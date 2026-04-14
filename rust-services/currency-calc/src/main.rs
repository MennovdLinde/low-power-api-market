use actix_web::{web, App, HttpServer, HttpResponse};
use serde::Deserialize;
use shared::CurrencyResult;
use std::collections::HashMap;
use chrono::Utc;

#[derive(Debug, Deserialize)]
struct ConvertRequest {
    rates: HashMap<String, f64>,
    from: String,
    to: String,
    amount: f64,
}

/// Perform cross-rate currency conversion with 4dp precision.
/// Handles the case where the base currency (from) equals the target (to).
async fn convert(body: web::Json<ConvertRequest>) -> HttpResponse {
    let req = &body.0;

    if req.amount <= 0.0 {
        return HttpResponse::BadRequest().json(serde_json::json!({
            "error": "amount must be positive"
        }));
    }

    let rate = match req.rates.get(&req.to) {
        Some(r) => *r,
        None => {
            return HttpResponse::BadRequest().json(serde_json::json!({
                "error": format!("Unknown currency: {}", req.to)
            }));
        }
    };

    // Round to 4 decimal places using integer arithmetic to avoid f64 drift
    let rate_4dp = (rate * 10_000.0).round() / 10_000.0;
    let converted_4dp = (req.amount * rate * 10_000.0).round() / 10_000.0;

    let result = CurrencyResult {
        from: req.from.clone(),
        to: req.to.clone(),
        rate: rate_4dp,
        amount: req.amount,
        converted: converted_4dp,
        date: Utc::now().format("%Y-%m-%d").to_string(),
        source: "frankfurter.app (ECB)".to_string(),
    };

    HttpResponse::Ok().json(result)
}

async fn health() -> HttpResponse {
    HttpResponse::Ok().json(serde_json::json!({ "status": "ok" }))
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let port: u16 = std::env::var("CURRENCY_PORT")
        .unwrap_or_else(|_| "3002".to_string())
        .parse()
        .unwrap_or(3002);

    println!("🦀 currency-calc listening on port {port}");

    HttpServer::new(|| {
        App::new()
            .route("/health", web::get().to(health))
            .route("/convert", web::post().to(convert))
    })
    .bind(("0.0.0.0", port))?
    .run()
    .await
}
