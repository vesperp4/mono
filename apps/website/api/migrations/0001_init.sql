-- Placeholder schema to exercise the database pipeline end-to-end.
-- Replace with real domain tables when backend features land.
CREATE TABLE IF NOT EXISTS messages (
    id BIGSERIAL PRIMARY KEY,
    body TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
