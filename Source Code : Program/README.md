# Robust Crop Disease Detection via Ensemble Learning 🌿

An advanced, robust machine learning pipeline designed to detect and classify 38 different plant leaf diseases using a multi-architecture ensemble neural network. 

## 📖 Project Overview
This project leverages deep learning to assist in agricultural monitoring. Because a single Convolutional Neural Network (CNN) can suffer from bias or fail to generalize to real-world agricultural conditions, this project trains **four distinct architectures** and fuses their predictions using **Soft Voting**. This ensures a highly resilient, fault-tolerant classification system.

## 🗄 Dataset
This project uses the **New Plant Diseases Dataset (Augmented)** fetched automatically via the Kaggle API.
* **Size:** 87,000+ high-resolution RGB images.
* **Scope:** 38 distinct classes (Healthy and Diseased leaves spanning crops like Apple, Corn, Tomato, Potato, etc.).
* **Preprocessing:** Rescaling (1./255) and dynamic data augmentation (rotation, zooming, flipping, brightness adjustment) to prevent overfitting.

## 🧠 Model Architectures
To ensure diverse feature extraction, four unique models are trained:
1. **Model 1 (VGG16 Hybrid):** Utilizes VGG16 transfer learning with a custom densely connected head. Excellent at capturing spatial hierarchies.
2. **Model 2 (EfficientNetB0):** A highly optimized, lightweight CNN architecture that scales depth, width, and resolution. Handles complex shapes and textures efficiently.
3. **Model 3 (Custom Inception):** Built from scratch using parallel Inception blocks (1x1, 3x3, 5x5 filters). Includes `GaussianNoise` layers to simulate real-world camera artifacts.
4. **Model 4 (Custom AlexNet):** A deep, sequential architecture using aggressive pooling and high dropout rates (50%) to force generalization.

## 🤝 Ensemble Methodology
We utilize **Soft Voting (Probability Averaging)**. 
Instead of relying on the strict classification (Hard Voting) of a single model, the ensemble outputs the mathematical average of the softmax probability distributions from all 4 models. If one model makes an anomalous prediction due to an artifact on the leaf, the other three models organically overrule it.

## 🚀 Execution Guide (Google Colab)
To run this pipeline, follow this strict execution order in Google Colab:
1. **`setup_dataset_in_drive.py`**: Mounts Google Drive, authenticates the Kaggle API, downloads the 87k image dataset, and extracts it permanently to your Drive.
2. **`model_1_vgg.py` to `model_4_alexnet.py`**: Run these 4 scripts individually. They pull the data from your Drive, train the respective models, and save the weights as `.keras` files.
3. **`unified_ensemble_model.py`**: Loads the 4 saved models and physically merges them into a single Keras Functional API model (`best_ensemble_model.keras`).
4. **`ensemble.py` (Evaluation):** Evaluates the models against the unseen validation dataset, generating a comparative metrics table and the ultimate Confusion Matrix.
