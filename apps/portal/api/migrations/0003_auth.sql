-- Sign-in (issue #171): magic-link login tokens + server-side sessions +
-- transient OIDC authorization-request state.
--
-- Sign-in NEVER creates members. Every row here hangs off an existing member
-- (or, for OIDC requests, off no member at all until the callback proves an
-- institutional email that already belongs to an active one). Same token
-- discipline as member_verifications: only the SHA-256 of a token is stored;
-- the raw value lives only in the email link / browser cookie / redirect URL.

CREATE TABLE login_tokens (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,  -- internal only, never exposed
    member_id   UUID        NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    token_hash  BYTEA       NOT NULL,            -- SHA-256 of the raw token; the raw token lives only in the email
    expires_at  TIMESTAMPTZ NOT NULL,            -- now() + LOGIN_LINK_TTL_MINUTES (default 15m)
    consumed_at TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX login_tokens_token_hash_idx ON login_tokens (token_hash);
CREATE INDEX login_tokens_member_id_idx ON login_tokens (member_id);

CREATE TABLE sessions (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,  -- internal only, never exposed
    member_id   UUID        NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    token_hash  BYTEA       NOT NULL,            -- SHA-256 of the raw token; the raw token lives only in the cookie
    expires_at  TIMESTAMPTZ NOT NULL,            -- now() + SESSION_TTL_DAYS (default 30d)
    revoked_at  TIMESTAMPTZ,                     -- set on sign-out; NULL while the session is live
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX sessions_token_hash_idx ON sessions (token_hash);
CREATE INDEX sessions_member_id_idx ON sessions (member_id);

CREATE TABLE oidc_auth_requests (
    id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,  -- internal only, never exposed
    state_hash    BYTEA       NOT NULL,          -- SHA-256 of the `state` round-tripped through Entra
    nonce_hash    BYTEA       NOT NULL,          -- SHA-256 of the `nonce` we expect back inside the ID token
    pkce_verifier TEXT        NOT NULL,          -- high-entropy random string; never leaves the server
    expires_at    TIMESTAMPTZ NOT NULL,          -- short (10 min): an auth redirect either completes quickly or not at all
    consumed_at   TIMESTAMPTZ,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX oidc_auth_requests_state_hash_idx ON oidc_auth_requests (state_hash);
