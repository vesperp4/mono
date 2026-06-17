# syntax=docker/dockerfile:1

# Pin the builder to Debian bookworm so the binary links against the same glibc
# (2.36) as the distroless cc-debian12 runtime below. The unpinned `-slim` tag
# now resolves to Debian trixie (glibc >= 2.38), and the native deps
# (aws-lc-sys/ring, pulled in by the Azure SDK) reference 2.38 symbols — which
# the bookworm runtime lacks ("GLIBC_2.38 not found"), so the binary won't start.
FROM rust:1.94-slim-bookworm AS builder
WORKDIR /app

COPY Cargo.toml Cargo.lock ./
COPY src ./src
COPY migrations ./migrations

# Build with cached registry + target; copy the binary out of the cache mount
# so it survives into the final stage.
RUN --mount=type=cache,target=/usr/local/cargo/registry \
    --mount=type=cache,target=/app/target \
    cargo build --release --locked --bin portal-api \
    && cp /app/target/release/portal-api /usr/local/bin/portal-api

FROM gcr.io/distroless/cc-debian12:nonroot AS runtime
COPY --from=builder /usr/local/bin/portal-api /usr/local/bin/portal-api
EXPOSE 8080
ENTRYPOINT ["/usr/local/bin/portal-api"]
