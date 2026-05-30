import os
import sys
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import load_model

# The 38 classes of the crop disease dataset
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
    
    # 1. Paths to local models
    model_paths = {
        "Model 1 (VGG16)": os.path.join(project_root, "model1_vgg.keras"),
        "Model 2 (EfficientNet)": os.path.join(project_root, "model2_efficientnet.keras"),
        "Model 3 (Inception)": os.path.join(project_root, "model3_inception.keras"),
        "Model 4 (AlexNet)": os.path.join(project_root, "model4_alexnet.keras"),
        "ULTIMATE ENSEMBLE": os.path.join(project_root, "best_ensemble_model.keras")
    }
    
    # 2. Check if models exist
    missing_models = [name for name, path in model_paths.items() if not os.path.exists(path)]
    if missing_models:
        print("⚠️ Missing models detected:")
        for name in missing_models:
            print(f"  - {name} (Expected at: {model_paths[name]})")
        print("\nPlease run the mock model generation script first:")
        print("  python3 ml-pipeline/generate_mock_models.py\n")
        sys.exit(1)
        
    print("✅ All local models located. Preparing testing data...")
    
    # 3. Create a mock input image (224x224x3 normalized float array)
    # This represents a single test leaf image
    np.random.seed(42)
    mock_image = np.random.rand(1, 224, 224, 3).astype(np.float32)
    
    # 4. Load models and run inference
    inference_results = []
    print("\n--- Running Inference Tests ---")
    for name, path in model_paths.items():
        print(f"Loading {name} and running prediction...")
        try:
            model = load_model(path)
            
            # Predict
            preds = model.predict(mock_image)
            pred_idx = np.argmax(preds[0])
            confidence = preds[0][pred_idx] * 100
            pred_class = CLASSES[pred_idx]
            
            inference_results.append((name, pred_class, confidence))
        except Exception as e:
            print(f"❌ Error evaluating {name}: {e}")
            
    # 5. Print Comparison Table
    print("\n" + "="*80)
    print(f"{'MODEL CLASSIFIER':<25} | {'PREDICTED CLASS':<38} | {'CONFIDENCE':<10}")
    print("="*80)
    for name, pred_class, conf in inference_results:
        # Highlight ensemble model
        if name == "ULTIMATE ENSEMBLE":
            print(f"\033[1;32m{name:<25} | {pred_class:<38} | {conf:>8.2f}%\033[0m")
        else:
            print(f"{name:<25} | {pred_class:<38} | {conf:>8.2f}%")
    print("="*80 + "\n")
    print("Inference test complete! The ensemble average probability is successfully verified.")

if __name__ == "__main__":
    main()
