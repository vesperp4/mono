//! Per-client-IP rate limiting for the public email-sending endpoints.
//!
//! Hand-rolled fixed-window limiter rather than a crate (`tower_governor` and
//! friends): the need is small — one keyed counter map — and owning the code
//! keeps the client-IP policy and the JSON error envelope under our control
//! with zero new dependencies to audit.
//!
//! **Client identity.** The API runs behind the Azure Container Apps ingress
//! (Envoy), so the TCP peer is always the ingress; the real client arrives in
//! `X-Forwarded-For`. The trustworthy entry is NOT the first one — a client can
//! pre-populate `X-Forwarded-For` and Envoy only *appends* the address of the
//! connection it terminates. With one trusted proxy in front of us (Envoy;
//! Cloudflare is DNS-only for the API host) the real client is therefore the
//! **last** entry, and everything to its left is attacker-controlled. Reading
//! the first entry would let anyone mint an unlimited number of buckets with a
//! spoofed header and bypass the limiter entirely. Policy, in order:
//! - `X-Forwarded-For` present: take the entry [`TRUSTED_PROXY_HOPS`] from the
//!   right (the hop our own infra appended). If it parses as an IP (with or
//!   without a port), key by that IP.
//! - `X-Forwarded-For` present but that entry is missing/unparseable: key into
//!   one shared [`ClientKey::Opaque`] bucket. The ingress always appends a
//!   well-formed address, so this only happens off-platform — sharing a bucket
//!   fails closed (garbage can't mint fresh buckets to bypass the limit).
//! - No `X-Forwarded-For`: key by the connection peer address (local dev,
//!   direct calls); if the server wasn't set up with connect info, fall back
//!   to the shared bucket.
//!
//! **Scope.** The limiter is in-memory, so with >1 replica each replica
//! counts independently (worst case: limit × replicas). Accepted for now —
//! there is no shared store (Redis) in the stack, and the limits are far
//! below what would make that slack exploitable.

use std::collections::HashMap;
use std::net::{IpAddr, SocketAddr};
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};

use axum::extract::{ConnectInfo, Request, State};
use axum::http::{header, HeaderMap, StatusCode};
use axum::middleware::Next;
use axum::response::{IntoResponse, Response};
use axum::Json;
use serde_json::json;

/// Fixed-window length. Limits are configured as requests **per minute**.
const WINDOW: Duration = Duration::from_secs(60);

/// Number of trusted reverse proxies in front of the app that append to
/// `X-Forwarded-For`. The Azure Container Apps ingress (Envoy) is the only one
/// — Cloudflare is DNS-only / grey-cloud for the API host — so the client is
/// the last (rightmost) entry Envoy appended. If a proxy that also rewrites
/// `X-Forwarded-For` is ever added in front of ACA, bump this so the client IP
/// is read from the correct hop.
const TRUSTED_PROXY_HOPS: usize = 1;

/// Who a request is attributed to for limiting purposes.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum ClientKey {
    /// A concrete client IP (from `X-Forwarded-For` or the peer address).
    Ip(IpAddr),
    /// Unattributable traffic (garbage forwarded header and no usable peer):
    /// one shared bucket, so being unattributable never grants more quota.
    Opaque,
}

/// Attribute a request to a [`ClientKey`]. See the module docs for the policy.
pub fn client_key(headers: &HeaderMap, peer: Option<SocketAddr>) -> ClientKey {
    match headers.get("x-forwarded-for") {
        Some(value) => value
            .to_str()
            .ok()
            .and_then(trusted_client_ip)
            .map_or(ClientKey::Opaque, ClientKey::Ip),
        None => peer.map_or(ClientKey::Opaque, |addr| ClientKey::Ip(addr.ip())),
    }
}

/// The client IP from an `X-Forwarded-For` value, trusting only the hop(s) our
/// own infra appends. Envoy appends the address it terminates as the last
/// entry, so with [`TRUSTED_PROXY_HOPS`] trusted proxies the client is that
/// many entries from the right; anything to its left is client-supplied and
/// spoofable, so it is never trusted. Returns `None` (=> the shared, fail-closed
/// [`ClientKey::Opaque`] bucket) when that entry is missing or unparseable.
fn trusted_client_ip(xff: &str) -> Option<IpAddr> {
    let entries: Vec<&str> = xff
        .split(',')
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .collect();
    let index = entries.len().checked_sub(TRUSTED_PROXY_HOPS)?;
    parse_forwarded_ip(entries[index])
}

/// Parse one `X-Forwarded-For` entry: a bare IP (`203.0.113.7`, `2001:db8::1`)
/// or an IP:port (`203.0.113.7:4711`, `[2001:db8::1]:4711`).
fn parse_forwarded_ip(entry: &str) -> Option<IpAddr> {
    entry
        .parse::<IpAddr>()
        .ok()
        .or_else(|| entry.parse::<SocketAddr>().ok().map(|a| a.ip()))
}

/// One client's current window.
struct Window {
    started: Instant,
    count: u32,
}

struct Buckets {
    map: HashMap<ClientKey, Window>,
    last_prune: Instant,
}

/// A keyed fixed-window rate limiter, shareable across requests via `Clone`.
#[derive(Clone)]
pub struct RateLimiter {
    inner: Arc<Inner>,
}

struct Inner {
    max_per_window: u32,
    buckets: Mutex<Buckets>,
}

/// Outcome of a limiter check.
#[derive(Debug, PartialEq, Eq)]
pub enum Decision {
    Allowed,
    /// Over quota; retry after this many seconds (window remainder, >= 1).
    Limited {
        retry_after_secs: u64,
    },
}

impl RateLimiter {
    /// A limiter allowing `max_per_minute` requests per key per minute (a
    /// value of 0 is clamped to 1 — the layer must never be a bypass).
    pub fn new(max_per_minute: u32) -> Self {
        Self {
            inner: Arc::new(Inner {
                max_per_window: max_per_minute.max(1),
                buckets: Mutex::new(Buckets {
                    map: HashMap::new(),
                    last_prune: Instant::now(),
                }),
            }),
        }
    }

    pub fn check(&self, key: ClientKey) -> Decision {
        self.check_at(key, Instant::now())
    }

    /// [`check`](Self::check) with an injectable clock, for tests.
    fn check_at(&self, key: ClientKey, now: Instant) -> Decision {
        // Lock note: held only for the map operations below — no I/O, no
        // await. Contention is negligible at these request rates.
        let mut buckets = self
            .inner
            .buckets
            .lock()
            .unwrap_or_else(|poisoned| poisoned.into_inner());

        // Drop expired windows at most once per window so the map can't grow
        // unboundedly under many distinct source IPs.
        if now.duration_since(buckets.last_prune) >= WINDOW {
            buckets.map.retain(|_, w| now < w.started + WINDOW);
            buckets.last_prune = now;
        }

        let window = buckets.map.entry(key).or_insert(Window {
            started: now,
            count: 0,
        });
        if now >= window.started + WINDOW {
            window.started = now;
            window.count = 0;
        }

        if window.count < self.inner.max_per_window {
            window.count += 1;
            Decision::Allowed
        } else {
            let remaining = (window.started + WINDOW).saturating_duration_since(now);
            Decision::Limited {
                retry_after_secs: remaining.as_secs().max(1),
            }
        }
    }
}

/// Middleware enforcing the limiter on whatever routes it is layered onto.
/// Attach with `axum::middleware::from_fn_with_state(limiter, enforce)`.
pub async fn enforce(State(limiter): State<RateLimiter>, req: Request, next: Next) -> Response {
    let peer = req
        .extensions()
        .get::<ConnectInfo<SocketAddr>>()
        .map(|ci| ci.0);
    match limiter.check(client_key(req.headers(), peer)) {
        Decision::Allowed => next.run(req).await,
        Decision::Limited { retry_after_secs } => too_many_requests(retry_after_secs),
    }
}

/// `429` with the app's standard error envelope. Deliberately generic: it is
/// produced before the body is even read, so it is byte-identical regardless
/// of which email address the request targets (no enumeration signal).
fn too_many_requests(retry_after_secs: u64) -> Response {
    (
        StatusCode::TOO_MANY_REQUESTS,
        [(header::RETRY_AFTER, retry_after_secs.to_string())],
        Json(json!({
            "error": {
                "code": "rate_limited",
                "message": "Too many requests. Please wait a moment and try again.",
            }
        })),
    )
        .into_response()
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::http::HeaderValue;

    fn headers(xff: Option<&str>) -> HeaderMap {
        let mut h = HeaderMap::new();
        if let Some(v) = xff {
            h.insert("x-forwarded-for", HeaderValue::from_str(v).unwrap());
        }
        h
    }

    fn ip(s: &str) -> IpAddr {
        s.parse().unwrap()
    }

    const PEER: Option<SocketAddr> = Some(SocketAddr::new(
        IpAddr::V4(std::net::Ipv4Addr::new(10, 0, 0, 9)),
        4711,
    ));

    #[test]
    fn xff_uses_the_last_trusted_hop_not_the_first() {
        // Envoy appends the real client (10.0.0.2) as the last entry; the
        // leftmost is whatever the client sent and must be ignored.
        assert_eq!(
            client_key(&headers(Some("203.0.113.7, 10.0.0.1, 10.0.0.2")), PEER),
            ClientKey::Ip(ip("10.0.0.2"))
        );
    }

    #[test]
    fn xff_spoofed_leading_entries_cannot_mint_new_buckets() {
        // Two requests spoofing different leading IPs but arriving from the
        // same real client must key to the SAME bucket (the appended entry).
        let a = client_key(&headers(Some("1.1.1.1, 203.0.113.7")), PEER);
        let b = client_key(&headers(Some("2.2.2.2, 203.0.113.7")), PEER);
        assert_eq!(a, b);
        assert_eq!(a, ClientKey::Ip(ip("203.0.113.7")));
    }

    #[test]
    fn xff_entry_with_port_parses() {
        assert_eq!(
            client_key(&headers(Some("10.0.0.1, 203.0.113.7:4711")), PEER),
            ClientKey::Ip(ip("203.0.113.7"))
        );
        assert_eq!(
            client_key(&headers(Some("[2001:db8::1]:443")), PEER),
            ClientKey::Ip(ip("2001:db8::1"))
        );
        assert_eq!(
            client_key(&headers(Some("2001:db8::1")), PEER),
            ClientKey::Ip(ip("2001:db8::1"))
        );
    }

    #[test]
    fn absent_header_falls_back_to_peer() {
        assert_eq!(
            client_key(&headers(None), PEER),
            ClientKey::Ip(ip("10.0.0.9"))
        );
    }

    #[test]
    fn garbage_header_shares_the_opaque_bucket() {
        assert_eq!(
            client_key(&headers(Some("not-an-ip")), PEER),
            ClientKey::Opaque
        );
        assert_eq!(client_key(&headers(Some("")), PEER), ClientKey::Opaque);
        // A parseable spoofed leading entry does NOT rescue an unparseable
        // trusted hop — fail closed to the shared bucket, never trust the left.
        assert_eq!(
            client_key(&headers(Some("203.0.113.7, not-an-ip")), PEER),
            ClientKey::Opaque
        );
    }

    #[test]
    fn no_header_no_peer_is_opaque() {
        assert_eq!(client_key(&headers(None), None), ClientKey::Opaque);
    }

    #[test]
    fn limiter_allows_up_to_max_then_denies() {
        let rl = RateLimiter::new(3);
        let now = Instant::now();
        let key = ClientKey::Ip(ip("203.0.113.7"));

        for _ in 0..3 {
            assert_eq!(rl.check_at(key, now), Decision::Allowed);
        }
        assert!(matches!(
            rl.check_at(key, now),
            Decision::Limited { retry_after_secs } if (1..=60).contains(&retry_after_secs)
        ));

        // A different key is unaffected.
        let other = ClientKey::Ip(ip("203.0.113.8"));
        assert_eq!(rl.check_at(other, now), Decision::Allowed);
    }

    #[test]
    fn limiter_resets_after_the_window() {
        let rl = RateLimiter::new(1);
        let now = Instant::now();
        let key = ClientKey::Ip(ip("203.0.113.7"));

        assert_eq!(rl.check_at(key, now), Decision::Allowed);
        assert!(matches!(rl.check_at(key, now), Decision::Limited { .. }));
        assert_eq!(
            rl.check_at(key, now + WINDOW + Duration::from_secs(1)),
            Decision::Allowed
        );
    }

    #[test]
    fn zero_limit_is_clamped_to_one() {
        let rl = RateLimiter::new(0);
        let now = Instant::now();
        let key = ClientKey::Opaque;
        assert_eq!(rl.check_at(key, now), Decision::Allowed);
        assert!(matches!(rl.check_at(key, now), Decision::Limited { .. }));
    }
}
