import os
import tensorflow as tf
from tensorflow.keras.models import Sequential, Model
from tensorflow.keras.layers import Input, Conv2D, GlobalAveragePooling2D, Dense, Average

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

def create_mock_base_model(name):
    print(f"Creating mock architecture for: {name}...")
    model = Sequential([
        Input(shape=(224, 224, 3), name=f"{name}_input"),
        Conv2D(8, (3, 3), padding='same', activation='relu'),
        GlobalAveragePooling2D(),
        Dense(128, activation='relu'),
        Dense(38, activation='softmax', name=f"{name}_output")
    ], name=name)
    model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])
    return model

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    
    # Define paths to save the models
    model_paths = {
        "model1_vgg": os.path.join(project_root, "model1_vgg.keras"),
        "model2_efficientnet": os.path.join(project_root, "model2_efficientnet.keras"),
        "model3_inception": os.path.join(project_root, "model3_inception.keras"),
        "model4_alexnet": os.path.join(project_root, "model4_alexnet.keras"),
    }
    
    # 1. Generate the 4 base models
    models = []
    for name, path in model_paths.items():
        m = create_mock_base_model(name)
        m.save(path)
        print(f"✅ Saved base model to: {path}")
        models.append(m)
        
    # 2. Combine into Unified Ensemble Model
    print("\nFusing base architectures into a Unified Average Ensemble model...")
    shared_input = Input(shape=(224, 224, 3), name="ensemble_input")
    
    # Rename submodels to prevent namespace conflicts in the graph
    for i, m in enumerate(models):
        m._name = f"sub_model_{i+1}"
        
    outputs = [m(shared_input) for m in models]
    ensemble_output = Average(name="ensemble_average_output")(outputs)
    
    ensemble_model = Model(inputs=shared_input, outputs=ensemble_output, name="Ultimate_Crop_Ensemble")
    ensemble_model.compile(
        optimizer='adam',
        loss='categorical_crossentropy',
        metrics=['accuracy']
    )
    
    ensemble_path = os.path.join(project_root, "best_ensemble_model.keras")
    ensemble_model.save(ensemble_path)
    print(f"✅ Saved Unified Ensemble model to: {ensemble_path}")
    print("\nAll mock models successfully generated! You can now run local inference tests.")

if __name__ == "__main__":
    main()
