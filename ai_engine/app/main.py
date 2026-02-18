from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import random

app = FastAPI(title="Shipsy Clone AI Engine")

class PriceRequest(BaseModel):
    origin: str
    destination: str
    container_type: str
    volume: int

@app.get("/")
def home():
    return {"status": "AI Service is Online"}

@app.post("/predict_price")
def predict_price(data: PriceRequest):
    """
    Predicts the 'Reference Price' for a shipping lane.
    In a real app, this would load a .pkl model (XGBoost/RandomForest).
    Here, we simulate it with intelligent logic.
    """
    origin = data.origin.lower()
    dest = data.destination.lower()
    
    # Base rate mapping (simulating learned weights)
    base_price = 2000 # Default global base
    
    # Route Logic (Simulating Model Features)
    if "shanghai" in origin or "china" in origin:
        if "la" in dest or "los angeles" in dest:
            base_price = 4500 # High demand route
        elif "new york" in dest:
            base_price = 5800 # Longer distance
        elif "rotterdam" in dest:
            base_price = 3200
            
    elif "mumbai" in origin or "india" in origin:
        if "dubai" in dest:
            base_price = 800
        elif "london" in dest:
            base_price = 2500
            
    # Container Type Multiplier
    multiplier = 1.0
    if data.container_type == "20FT":
        multiplier = 0.6
    elif data.container_type == "LCL":
        multiplier = 0.1 # Per CBM usually, but keeping simple
        
    # Add some "AI Noise" / Fluctuation
    predicted_price = (base_price * multiplier) * random.uniform(0.95, 1.05)
    
    return {
        "predicted_price": round(predicted_price, 2),
        "confidence_score": round(random.uniform(0.85, 0.98), 2),
        "reasoning": f"Based on historical data for {data.origin} to {data.destination}"
    }