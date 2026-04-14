use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct GeoResult {
    pub ip: String,
    pub country: String,
    pub country_code: String,
    pub region: String,
    pub city: String,
    pub lat: f64,
    pub lon: f64,
    pub timezone: String,
    pub isp: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CurrencyResult {
    pub from: String,
    pub to: String,
    pub rate: f64,
    pub amount: f64,
    pub converted: f64,
    pub date: String,
    pub source: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ApiError {
    pub error: String,
}
