import tensorflow as tf
import numpy as np
import matplotlib.pyplot as plt
from sklearn.metrics import confusion_matrix, classification_report
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.models import load_model

# 1. Dataset Preparation
dataset_path = "/content/drive/MyDrive/dataset/New Plant Diseases Dataset(Augmented)/New Plant Diseases Dataset(Augmented)"

import pandas as pd
from sklearn.model_selection import train_test_split

print("Collecting dataset files for random 80/10/10 split...")
all_data = []
for folder in ["train", "valid"]:
    folder_path = os.path.join(dataset_path, folder)
    if not os.path.exists(folder_path):
        continue
    for class_name in sorted(os.listdir(folder_path)):
        class_dir = os.path.join(folder_path, class_name)
        if not os.path.isdir(class_dir):
            continue
        for img_name in os.listdir(class_dir):
            if img_name.lower().endswith(('.png', '.jpg', '.jpeg', '.bmp', '.gif')):
                all_data.append({
                    'filepath': os.path.join(class_dir, img_name),
                    'label': class_name
                })

df = pd.DataFrame(all_data)
train_df, temp_df = train_test_split(df, test_size=0.20, random_state=42, stratify=df['label'])
val_df, test_df = train_test_split(temp_df, test_size=0.50, random_state=42, stratify=temp_df['label'])

# Use the 10% Test split for ensemble evaluation
test_datagen = ImageDataGenerator(rescale=1./255)

val_data = test_datagen.flow_from_dataframe(
    test_df,
    x_col='filepath',
    y_col='label',
    target_size=(224,224),
    batch_size=32,
    class_mode='categorical',
    shuffle=False # CRITICAL: Must be false to match true labels with predictions
)

num_classes = val_data.num_classes
class_names = list(val_data.class_indices.keys())

# 2. Paths to your 4 saved models in Google Drive
# IMPORTANT: Update these paths to the exact filenames of your 4 saved models!
model_paths = [
    "/content/drive/MyDrive/model_1_vgg.keras", 
    "/content/drive/MyDrive/model_2_efficientnet.keras",
    "/content/drive/MyDrive/hybrid_model.keras", # Your custom inception model
    "/content/drive/MyDrive/model_4.keras"       # Your 4th model
]

# 3. Load Models
print("Loading models...")
models = []
for path in model_paths:
    print(f"Loading {path}...")
    model = load_model(path)
    models.append(model)
print("All models loaded successfully!\n")

# 4. Ensemble Prediction (Averaging Softmax Probabilities)
print("--- Generating Ensemble Predictions ---")
val_data.reset() # Reset generator before predicting

y_true = val_data.classes
all_preds = []

# Collect probability predictions from each model
for i, model in enumerate(models):
    print(f"Predicting with Model {i+1}...")
    preds = model.predict(val_data)
    all_preds.append(preds)

# Average the probabilities across all 4 models
ensemble_preds = np.mean(all_preds, axis=0)

# Get final predicted classes by choosing the highest average probability
ensemble_pred_classes = np.argmax(ensemble_preds, axis=1)

# 5. Evaluate Ensemble Model
cm = confusion_matrix(y_true, ensemble_pred_classes)

# Plot Confusion Matrix
plt.figure(figsize=(8,6))
plt.imshow(cm, interpolation='nearest', cmap=plt.cm.Blues)
plt.title("Ensemble Confusion Matrix")
plt.colorbar()
tick_marks = np.arange(num_classes)
plt.xticks(tick_marks, class_names, rotation=45)
plt.yticks(tick_marks, class_names)
plt.ylabel('Actual Label')
plt.xlabel('Predicted Label')
plt.tight_layout()
plt.show()

# Classification Report
print("\n--- Ensemble Classification Report ---")
print(classification_report(y_true, ensemble_pred_classes, target_names=class_names))

# Final Accuracy
ensemble_acc = np.sum(ensemble_pred_classes == y_true) / len(y_true) * 100
print(f"Final Ensemble Validation Accuracy: {ensemble_acc:.2f}%")
