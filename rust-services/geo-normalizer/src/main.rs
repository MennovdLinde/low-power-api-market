use actix_web::{web, App, HttpServer, HttpResponse, middleware};
use serde::{Deserialize, Serialize};
use shared::GeoResult;

#[derive(Debug, Deserialize)]
struct NormaliseRequest {
    raw: serde_json::Value,
}

/// Normalise a raw ip-api.com response into a consistent GeoResult.
/// Validates country codes and fills in sensible defaults for missing fields.
async fn normalise(body: web::Json<NormaliseRequest>) -> HttpResponse {
    let raw = &body.raw;

    let ip = raw["query"].as_str().unwrap_or("unknown").to_string();
    let country = raw["country"].as_str().unwrap_or("Unknown").to_string();
    let country_code = raw["countryCode"]
        .as_str()
        .unwrap_or("")
        .to_uppercase();

    // Validate ISO 3166-1 alpha-2: must be exactly 2 uppercase ASCII letters
    let country_code = if country_code.len() == 2
        && country_code.chars().all(|c| c.is_ascii_alphabetic())
    {
        country_code
    } else {
        "ZZ".to_string() // unknown country code sentinel
    };

    let result = GeoResult {
        ip,
        country,
        country_code,
        region: raw["region"].as_str().unwrap_or("").to_string(),
        city: raw["city"].as_str().unwrap_or("").to_string(),
        lat: raw["lat"].as_f64().unwrap_or(0.0),
        lon: raw["lon"].as_f64().unwrap_or(0.0),
        timezone: raw["timezone"].as_str().unwrap_or("UTC").to_string(),
        isp: raw["isp"].as_str().unwrap_or("").to_string(),
    };

    HttpResponse::Ok().json(result)
}

async fn health() -> HttpResponse {
    HttpResponse::Ok().json(serde_json::json!({ "status": "ok" }))
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let port: u16 = std::env::var("GEO_PORT")
        .unwrap_or_else(|_| "3001".to_string())
        .parse()
        .unwrap_or(3001);

    println!("🦀 geo-normalizer listening on port {port}");

    HttpServer::new(|| {
        App::new()
            .route("/health", web::get().to(health))
            .route("/normalise", web::post().to(normalise))
    })
    .bind(("0.0.0.0", port))?
    .run()
    .await
}
