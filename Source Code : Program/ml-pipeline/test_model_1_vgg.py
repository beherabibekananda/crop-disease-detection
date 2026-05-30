import os
import sys
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import load_model

CLASSES = [
    "Apple___Apple_scab", "Apple___Black_rot", "Apple___Cedar_apple_rust", "Apple___healthy",
    "Blueberry___healthy", "Cherry_(including_sour)___Powdery_mildew", "Cherry_(including_sour)___healthy",
    "Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot", "Corn_(maize)___Common_rust_",
    "Corn_(maize)___Northern_Leaf_Blight", "Corn_(maize)___healthy", "Grape___Black_rot",
    "Grape___Esca_(Black_Measles)", "Grape___Leaf_blight_(Isariopsis_Leaf_Spot)", "Grape___healthy",
    "Orange___Haunglongbing_(Citrus_greening)", "Peach___Bacterial_spot", "Peach___healthy",
    "Pepper,_bell___Bacterial_spot", "Pepper,_bell___healthy", "Potato___Early_blight",
    "Potato___Late_blight", "Potato___healthy", "Raspberry___healthy", "Soybean___healthy",
    "Squash___Powdery_mildew", "Strawberry___Leaf_scorch", "Strawberry___healthy",
    "Tomato___Bacterial_spot", "Tomato___Early_blight", "Tomato___Late_blight", "Tomato___Leaf_Mold",
    "Tomato___Septoria_leaf_spot", "Tomato___Spider_mites Two-spotted_spider_mite", "Tomato___Target_Spot",
    "Tomato___Tomato_Yellow_Leaf_Curl_Virus", "Tomato___Tomato_mosaic_virus", "Tomato___healthy"
]

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    model_path = os.path.join(project_root, "model1_vgg.keras")
    
    if not os.path.exists(model_path):
        print(f"⚠️ Model 1 (VGG16) file not found at: {model_path}")
        print("Please generate it or copy it into the project root directory first.")
        sys.exit(1)
        
    print(f"Loading Model 1: VGG16 from {model_path}...")
    model = load_model(model_path)
    
    # Generate mock image data (224x224x3) for inference
    np.random.seed(42)
    test_image = np.random.rand(1, 224, 224, 3).astype(np.float32)
    
    print("Running predictions with Model 1 (VGG16)...")
    preds = model.predict(test_image)
    pred_idx = np.argmax(preds[0])
    confidence = preds[0][pred_idx] * 100
    pred_class = CLASSES[pred_idx]
    
    print("\n" + "="*50)
    print("★ MODEL 1 (VGG16) EVALUATION RESULT ★")
    print("="*50)
    print(f"Predicted Class Index : {pred_idx}")
    print(f"Predicted Class Label : {pred_class}")
    print(f"Prediction Confidence : {confidence:.2f}%")
    print("="*50 + "\n")

if __name__ == "__main__":
    main()
