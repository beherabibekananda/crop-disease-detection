import tensorflow as tf
import numpy as np
import matplotlib.pyplot as plt
import os
from google.colab import drive
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.models import load_model
from sklearn.metrics import confusion_matrix, classification_report

# 1. Mount Drive
drive.mount('/content/drive')

# 2. Setup Dataset Path
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

# 3. Data Generator (Use the 10% Test split for ensemble evaluation)
test_datagen = ImageDataGenerator(rescale=1./255)

val_data = test_datagen.flow_from_dataframe(
    test_df,
    x_col='filepath',
    y_col='label',
    target_size=(224,224),
    batch_size=32,
    class_mode='categorical',
    shuffle=False # CRITICAL: Must be False so predictions match true labels!
)

num_classes = val_data.num_classes
class_names = list(val_data.class_indices.keys())

# 4. Load Models
model_paths = [
    "/content/drive/MyDrive/model1_vgg.keras", 
    "/content/drive/MyDrive/model2_efficientnet.keras",
    "/content/drive/MyDrive/model3_inception.keras", 
    "/content/drive/MyDrive/model4_alexnet.keras"       
]

print("Loading models...")
models = []
for path in model_paths:
    if os.path.exists(path):
        print(f"Loading {path}...")
        model = load_model(path)
        models.append(model)
    else:
        print(f"ERROR: Model file not found at {path}")

if len(models) == 0:
    raise ValueError("No models were found. Please check your file paths.")

print(f"{len(models)} models loaded successfully!\n")

# 5. Evaluate Individual Models & Generate Predictions
print("--- Evaluating Individual Models ---")
val_data.reset()

y_true = val_data.classes
all_preds = []
model_metrics = []

from sklearn.metrics import accuracy_score, precision_score, recall_score, confusion_matrix, classification_report

for i, model in enumerate(models):
    print(f"Predicting with Model {i+1}...")
    preds = model.predict(val_data)
    all_preds.append(preds)
    
    # Calculate metrics for individual models
    pred_classes = np.argmax(preds, axis=1)
    acc = accuracy_score(y_true, pred_classes)
    prec = precision_score(y_true, pred_classes, average='weighted', zero_division=0)
    rec = recall_score(y_true, pred_classes, average='weighted', zero_division=0)
    
    model_name = model_paths[i].split("/")[-1].replace(".keras", "")
    model_metrics.append((model_name, acc, prec, rec))

# 6. Ensemble Prediction
ensemble_preds = np.mean(all_preds, axis=0)
ensemble_pred_classes = np.argmax(ensemble_preds, axis=1)

# Calculate Ensemble Metrics
ens_acc = accuracy_score(y_true, ensemble_pred_classes)
ens_prec = precision_score(y_true, ensemble_pred_classes, average='weighted', zero_division=0)
ens_rec = recall_score(y_true, ensemble_pred_classes, average='weighted', zero_division=0)

model_metrics.append(("ULTIMATE ENSEMBLE", ens_acc, ens_prec, ens_rec))

# 7. Print Comparison Table
print("\n" + "="*60)
print(f"{'MODEL NAME':<25} | {'ACCURACY':<9} | {'PRECISION':<9} | {'RECALL':<9}")
print("="*60)
for name, acc, prec, rec in model_metrics:
    print(f"{name:<25} | {acc*100:>8.2f}% | {prec*100:>8.2f}% | {rec*100:>8.2f}%")
print("="*60 + "\n")

# 8. Evaluate Ensemble Model visually
cm = confusion_matrix(y_true, ensemble_pred_classes)

plt.figure(figsize=(10,8))
plt.imshow(cm, interpolation='nearest', cmap=plt.cm.Blues)
plt.title("Ultimate Ensemble Confusion Matrix")
plt.colorbar()
tick_marks = np.arange(num_classes)
plt.xticks(tick_marks, class_names, rotation=90)
plt.yticks(tick_marks, class_names)
plt.ylabel('Actual Label')
plt.xlabel('Predicted Label')
plt.tight_layout()
plt.show()

print("\n--- Detailed Ensemble Classification Report ---")
print(classification_report(y_true, ensemble_pred_classes, target_names=class_names))
