import tensorflow as tf
from tensorflow.keras.models import load_model, Model
from tensorflow.keras.layers import Input, Average
import os
from google.colab import drive

# 1. Mount Drive
drive.mount('/content/drive')

# 2. Paths to your 4 saved models
model_paths = [
    "/content/drive/MyDrive/model1_vgg.keras", 
    "/content/drive/MyDrive/model2_efficientnet.keras",
    "/content/drive/MyDrive/model3_inception.keras", 
    "/content/drive/MyDrive/model4_alexnet.keras"       
]

print("Loading individual models...")
models = []
for i, path in enumerate(model_paths):
    if os.path.exists(path):
        print(f"Loading {path}...")
        # Load the model
        model = load_model(path)
        # We rename the model object to prevent naming conflicts when merging
        model._name = f"sub_model_{i+1}"
        models.append(model)
    else:
        print(f"ERROR: Model file not found at {path}")

if len(models) == 0:
    raise ValueError("No models were found. Please train and save them first!")

# 3. Create the Unified "Best Model"
print("\nCombining the 4 models into a single Unified Super-Model...")

# Define the single shared input layer (224x224x3 images)
shared_input = Input(shape=(224, 224, 3), name="ensemble_input")

# Pass the shared input into all 4 models to get 4 separate outputs
outputs = [model(shared_input) for model in models]

# Mathematically average the 4 probability outputs into 1 final prediction
ensemble_output = Average(name="ensemble_average_output")(outputs)

# Construct the final unified Keras model
best_ensemble_model = Model(inputs=shared_input, outputs=ensemble_output, name="Ultimate_Crop_Ensemble")

# 4. Compile the Unified Model
best_ensemble_model.compile(
    optimizer='adam',
    loss='categorical_crossentropy',
    metrics=['accuracy', tf.keras.metrics.Precision(name='precision'), tf.keras.metrics.Recall(name='recall')]
)

best_ensemble_model.summary()

from tensorflow.keras.preprocessing.image import ImageDataGenerator

# 5. Evaluate the Unified Model to get Accuracy
print("\nLoading Validation Data to check Final Accuracy...")
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

# Use the 10% Test split for final evaluation
test_datagen = ImageDataGenerator(rescale=1./255)

val_data = test_datagen.flow_from_dataframe(
    test_df,
    x_col='filepath',
    y_col='label',
    target_size=(224,224),
    batch_size=32,
    class_mode='categorical',
    shuffle=False
)

print("\n--- Evaluating Unified Best Model ---")
loss, accuracy, precision, recall = best_ensemble_model.evaluate(val_data)
print("==================================================")
print(f"★ ULTIMATE UNIFIED MODEL ACCURACY:  {accuracy*100:.2f}% ★")
print(f"★ ULTIMATE UNIFIED MODEL PRECISION: {precision*100:.2f}% ★")
print(f"★ ULTIMATE UNIFIED MODEL RECALL:    {recall*100:.2f}% ★")
print("==================================================")

# 6. Save the Ultimate Model to Google Drive
save_path = "/content/drive/MyDrive/best_ensemble_model.keras"
best_ensemble_model.save(save_path)
print(f"\nSUCCESS: The unified Best Model has been saved permanently to: {save_path}")
print("You can now load this single file into any app or web server for predictions!")
