-- Members directory + email-verification (double opt-in) for the join flow.
-- Retires the placeholder `messages` table from 0001; real domain tables start here.
--
-- Identity model: a member proves PUPR affiliation by confirming a one-time link
-- sent to their institutional address. `personal_email` is the durable primary
-- contact (newsletters, event notices); `institutional_email` is the unique key
-- and the only address the verification link is ever sent to.

DROP TABLE IF EXISTS messages;

CREATE TABLE members (
    -- UUID (not sequential) so a member id is safe to expose in a future portal
    -- URL without leaking counts or enabling enumeration. gen_random_uuid() is
    -- built into Postgres 13+, so no extension is required.
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name          TEXT        NOT NULL,
    last_name           TEXT        NOT NULL,
    personal_email      TEXT        NOT NULL,          -- primary contact; all ongoing mail goes here
    institutional_email TEXT        NOT NULL UNIQUE,   -- identity + verification only; lowercased @students.pupr.edu | @pupr.edu
    concentration       TEXT        NOT NULL,
    department          TEXT        NOT NULL,          -- web-form slug, e.g. 'electrica'
    status              TEXT        NOT NULL DEFAULT 'pending_verification'
                        CHECK (status IN ('pending_verification', 'active', 'alumni', 'rejected')),
    newsletter_opt_in   BOOLEAN     NOT NULL DEFAULT TRUE,
    verified_at         TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE member_verifications (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,  -- internal only, never exposed
    member_id   UUID        NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    token_hash  BYTEA       NOT NULL,            -- SHA-256 of the raw token; the raw token lives only in the email
    expires_at  TIMESTAMPTZ NOT NULL,            -- now() + VERIFICATION_TTL_HOURS (default 24h)
    consumed_at TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX member_verifications_token_hash_idx ON member_verifications (token_hash);
CREATE INDEX member_verifications_member_id_idx ON member_verifications (member_id);
