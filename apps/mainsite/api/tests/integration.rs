use sqlx::postgres::PgPoolOptions;

/// Exercises the full DB path against a real Postgres (service container in CI,
/// or a local container during development): run migrations, then round-trip a row.
#[tokio::test]
async fn migrations_apply_and_roundtrip() {
    let url =
        std::env::var("DATABASE_URL").expect("DATABASE_URL must be set to run integration tests");

    let pool = PgPoolOptions::new()
        .max_connections(2)
        .connect(&url)
        .await
        .expect("connect to postgres");

    sqlx::migrate!()
        .run(&pool)
        .await
        .expect("migrations apply cleanly");

    let body = "pipeline-smoke-test";

    let id: i64 = sqlx::query_scalar("INSERT INTO messages (body) VALUES ($1) RETURNING id")
        .bind(body)
        .fetch_one(&pool)
        .await
        .expect("insert row");

    let got: String = sqlx::query_scalar("SELECT body FROM messages WHERE id = $1")
        .bind(id)
        .fetch_one(&pool)
        .await
        .expect("select row back");

    assert_eq!(got, body);
}
