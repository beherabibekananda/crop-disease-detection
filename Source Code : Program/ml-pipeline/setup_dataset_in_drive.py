import os
import matplotlib.pyplot as plt
import matplotlib.image as mpimg
from google.colab import files
from google.colab import drive

# 1. Mount Google Drive
print("Mounting Google Drive...")
drive.mount('/content/drive')

# 2. Get Kaggle API Key
if not os.path.exists('/root/.kaggle/kaggle.json'):
    print("\n--- Please upload your kaggle.json file ---")
    files.upload()
    os.system('mkdir -p ~/.kaggle')
    os.system('cp kaggle.json ~/.kaggle/')
    os.system('chmod 600 ~/.kaggle/kaggle.json')

# 3. Create the 'dataset' folder in your Google Drive
drive_dataset_path = "/content/drive/MyDrive/dataset"

if not os.path.exists(drive_dataset_path):
    print(f"\nCreating folder: {drive_dataset_path}")
    os.makedirs(drive_dataset_path)

# 4. Download and unzip directly into Google Drive
# NOTE: Unzipping 87,000 images directly into Google Drive can take a LONG time! 
# Please be patient and let it run.
if not os.path.exists(os.path.join(drive_dataset_path, "New Plant Diseases Dataset(Augmented)")):
    print("\nDownloading dataset from Kaggle...")
    os.system('kaggle datasets download -d vipoooool/new-plant-diseases-dataset')
    
    print("\nExtracting dataset directly into your Google Drive (This may take 30+ minutes)...")
    os.system(f'unzip -q new-plant-diseases-dataset.zip -d "{drive_dataset_path}"')
    print("\nExtraction Complete! The data is now permanently in your Google Drive.")
else:
    print("\nDataset already exists in your Google Drive!")

# 5. Show Faculty the Dataset (Visualizing 9 random images)
print("\n--- Generating Faculty Preview ---")
import glob
import random

# Grab some images from the training folder
train_path = os.path.join(drive_dataset_path, "New Plant Diseases Dataset(Augmented)/New Plant Diseases Dataset(Augmented)/train")
classes = os.listdir(train_path)

plt.figure(figsize=(12, 12))
for i in range(9):
    random_class = random.choice(classes)
    class_path = os.path.join(train_path, random_class)
    image_files = glob.glob(os.path.join(class_path, "*.JPG"))
    
    if len(image_files) > 0:
        random_image = random.choice(image_files)
        img = mpimg.imread(random_image)
        
        ax = plt.subplot(3, 3, i + 1)
        plt.imshow(img)
        # Shorten the title so it fits
        title = random_class.replace("Tomato___", "").replace("Corn_(maize)___", "").replace("_", " ")
        plt.title(title)
        plt.axis("off")

plt.suptitle("Plant Leaf Disease Dataset (Sample Images for Faculty)", fontsize=16)
plt.tight_layout()
plt.show()
