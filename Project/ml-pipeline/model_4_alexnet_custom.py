import tensorflow as tf
import numpy as np
import matplotlib.pyplot as plt
import os
from google.colab import drive
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import (Input, Conv2D, MaxPooling2D,
                                     BatchNormalization, Flatten,
                                     Dense, Dropout)

# 1. Mount Drive
drive.mount('/content/drive')

# 2. Setup Dataset Path
dataset_path = "/content/drive/MyDrive/dataset/New Plant Diseases Dataset(Augmented)/New Plant Diseases Dataset(Augmented)"
train_path = os.path.join(dataset_path, "train")
val_path = os.path.join(dataset_path, "valid")

# 3. Data Generators
train_datagen = ImageDataGenerator(
    rescale=1./255,
    rotation_range=20,
    zoom_range=0.2,
    horizontal_flip=True
)

val_datagen = ImageDataGenerator(rescale=1./255)

train_data = train_datagen.flow_from_directory(
    train_path,
    target_size=(224,224),
    batch_size=32,
    class_mode='categorical'
)

val_data = val_datagen.flow_from_directory(
    val_path,
    target_size=(224,224),
    batch_size=32,
    class_mode='categorical',
    shuffle=False
)

# 4. Build Model (Custom AlexNet Inspired)
model = Sequential()
model.add(Input(shape=(224,224,3)))

model.add(Conv2D(32, (3,3), activation='relu', padding='same'))
model.add(BatchNormalization())
model.add(MaxPooling2D(pool_size=(2,2)))

model.add(Conv2D(64, (3,3), activation='relu', padding='same'))
model.add(BatchNormalization())
model.add(MaxPooling2D(pool_size=(2,2)))

model.add(Conv2D(128, (5,5), activation='relu', padding='same'))
model.add(BatchNormalization())
model.add(MaxPooling2D(pool_size=(3,3), strides=2))

model.add(Conv2D(256, (3,3), activation='relu', padding='same'))
model.add(BatchNormalization())

model.add(Conv2D(256, (3,3), activation='relu', padding='same'))
model.add(MaxPooling2D(pool_size=(3,3), strides=2))

model.add(Flatten())
model.add(Dense(512, activation='relu'))
model.add(Dropout(0.5))

model.add(Dense(128, activation='relu'))
model.add(Dropout(0.3))
model.add(Dense(train_data.num_classes, activation='softmax'))

model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])
model.summary()

# 5. Train Model
history = model.fit(train_data, validation_data=val_data, epochs=10)

# 6. Save Model
model.save("/content/drive/MyDrive/model4_alexnet.keras")
print("Saved to Google Drive as model4_alexnet.keras")
