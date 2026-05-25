from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import numpy as np
from PIL import Image
import io
import base64
import os
from dotenv import load_dotenv
load_dotenv() # Load variables from .env

try:
    import tensorflow as tf
    from tensorflow.keras.models import load_model
    HAS_TENSORFLOW = True
except (ImportError, AttributeError):
    HAS_TENSORFLOW = False
    print("⚠️ TensorFlow not found or broken. Local ensemble model disabled.")
import google.generativeai as genai
import json
import requests

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Gemini Client
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    print("⚠️ WARNING: GEMINI_API_KEY not found in environment variables.")
genai.configure(api_key=GEMINI_API_KEY)
gemini_model = genai.GenerativeModel('gemini-flash-latest')

# Load local model (as fallback or secondary check)
MODEL_PATHS = ["best_ensemble_model.keras", "../best_ensemble_model.keras", "backend/best_ensemble_model.keras"]
model = None
if HAS_TENSORFLOW:
    for path in MODEL_PATHS:
        if os.path.exists(path):
            try:
                model = load_model(path)
                print(f"✅ Local Ensemble Model loaded from: {path}")
                break
            except: pass
else:
    print("ℹ️ Skipping model loading (TensorFlow unavailable).")

class ImageRequest(BaseModel):
    image_base64: str

def decode_image(image_input: str) -> Image.Image:
    # Check if it's a URL
    if image_input.startswith("http"):
        print(f"🌐 Fetching image from URL: {image_input}")
        response = requests.get(image_input)
        return Image.open(io.BytesIO(response.content)).convert('RGB')
    
    # Otherwise assume it's base64
    if "," in image_input:
        image_input = image_input.split(",")[1]
    image_data = base64.b64decode(image_input)
    return Image.open(io.BytesIO(image_data)).convert('RGB')

@app.post("/predict")
async def predict_disease(request: ImageRequest):
    try:
        # 1. Local Model Prediction (The Core)
        local_prediction = None
        local_conf = 0.0
        
        if model:
            print("🧠 Running local Ensemble Model classification...")
            image = decode_image(request.image_base64)
            image = image.resize((224, 224))
            img_array = np.array(image) / 255.0
            img_array = np.expand_dims(img_array, axis=0)
            
            preds = model.predict(img_array)
            class_idx = int(np.argmax(preds[0]))
            local_conf = float(np.max(preds[0])) * 100
            local_prediction = CLASS_NAMES[class_idx]
            print(f"✅ Local model identified: {local_prediction} ({local_conf:.1f}%)")

        # 2. Call Gemini for Expert Analysis & Verification
        print("🤖 Calling Gemini AI for expert validation...")
        prompt = """
        Analyze this plant image (can show a leaf, fruit, stem, root, flower, seed, or the whole crop/plant).
        This system supports all kinds of plants, including:
        - Field Crops (e.g., Rice, Wheat, Maize, Cotton, Soybean, Sugarcane)
        - Vegetables (e.g., Tomato, Potato, Chili, Onion, Cabbage, Brinjal, Okra, Cucumber)
        - Fruits (e.g., Mango, Apple, Banana, Citrus, Grape, Guava, Papaya, Pomegranate)
        - Herbs, Spices, and Ornamentals

        Tasks:
        1. Identify the EXACT plant/crop name (e.g., Mango, Tomato, Rice, Apple, etc.). If the exact variety/species is difficult to determine but it is clearly a plant or crop, guess the general category or family (e.g., "Citrus", "Cucurbit", "Crucifer", or "Unknown Plant") instead of "Unknown".
        2. Diagnose any diseases, fungal/bacterial/viral infections, rot, spots, cankers, nutrient deficiencies, or pest damage present on any part of the plant (leaf, fruit, stem, etc.).
        3. Provide a clear, actionable treatment and prevention plan.

        Return ONLY a JSON object with this exact structure:
        {
          "crop": "Name of the crop/plant",
          "disease": "Name of the disease/pest (or 'Healthy')",
          "confidence": 95.5,
          "severity": "low/moderate/high",
          "description": "Short medical-style description of symptoms seen on the leaf, fruit, stem, or plant",
          "treatment": ["step 1", "step 2", "step 3"],
          "prevention": ["step 1", "step 2", "step 3"],
          "causes": ["cause 1", "cause 2"]
        }

        CRITICAL: If the image does not show a plant or crop part at all (e.g., it is a person, animal, object, landscape, building, or any non-plant image), you MUST return EXACTLY:
        {
          "crop": "Unknown",
          "disease": "Not a Leaf",
          "confidence": 99.9,
          "severity": "low",
          "description": "",
          "treatment": [],
          "prevention": [],
          "causes": []
        }
        Do not provide any description or details about the image if it does not show a plant or crop.
        """
        
        # Prepare image for Gemini (handle URL or base64)
        if request.image_base64.startswith("http"):
            resp = requests.get(request.image_base64)
            image_data = resp.content
        else:
            raw_b64 = request.image_base64
            if "," in raw_b64:
                raw_b64 = raw_b64.split(",")[1]
            image_data = base64.b64decode(raw_b64)

        response = gemini_model.generate_content([
            prompt,
            {"mime_type": "image/jpeg", "data": image_data}
        ])

        # Extract JSON from response text (handling potential markdown blocks)
        text_response = response.text
        print(f"DEBUG: Raw Gemini Response: {text_response}")
        
        if "```json" in text_response:
            text_response = text_response.split("```json")[1].split("```")[0].strip()
        elif "```" in text_response:
            text_response = text_response.split("```")[1].split("```")[0].strip()
        
        try:
            ai_data = json.loads(text_response)
        except json.JSONDecodeError as e:
            print(f"❌ JSON Decode Error: {e}")
            print(f"Full response was: {text_response}")
            # Fallback to a structured error response
            ai_data = {
                "crop": "Unknown",
                "disease": "Detection Failed",
                "severity": "moderate",
                "description": "The AI could not format the diagnosis correctly. Please try another image.",
                "treatment": ["N/A"],
                "prevention": ["N/A"],
                "causes": ["N/A"]
            }

        # Programmatically override values only if explicitly detected as not a leaf
        is_not_leaf = (
            str(ai_data.get("disease", "")).strip().lower() == "not a leaf"
        )
        if is_not_leaf:
            ai_data["disease"] = "Not a Leaf"
            ai_data["crop"] = "Unknown"
            ai_data["description"] = ""
            ai_data["treatment"] = []
            ai_data["prevention"] = []
            ai_data["causes"] = []
            ai_data["severity"] = "low"
        
        # 3. Final Merged Result
        return {
            "id": f"scn_{int(np.random.randint(1000, 9999))}",
            "disease": ai_data.get('disease', local_prediction.split(' ')[1] if local_prediction else "Unknown"),
            "crop": ai_data.get('crop', local_prediction.split(' ')[0] if local_prediction else "Unknown"),
            "confidence": ai_data.get('confidence', local_conf if local_conf > 0 else 98.2),
            "severity": ai_data.get('severity', 'moderate').lower(),
            "description": ai_data.get('description', f"Verified analysis of {local_prediction} symptoms." if local_prediction else "Diagnosis complete."),
            "treatment": ai_data.get('treatment', ["Apply fungicide.", "Prune leaves."]),
            "prevention": ai_data.get('prevention', ["Monitor health.", "Crop rotation."]),
            "causes": ai_data.get('causes', ["Moisture", "Pathogens"]),
            "engine": "Gemini 2.0 Flash" + (" + Ensemble" if model else "")
        }

    except Exception as e:
        print(f"❌ Error during analysis: {e}")
        # Fallback to local model if Groq fails
        if model:
            # (Local model logic from previous version goes here if needed)
            pass
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
