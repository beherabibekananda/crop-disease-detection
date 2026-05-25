import tensorflow as tf
import numpy as np
import matplotlib.pyplot as plt
import os
from google.colab import drive
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.layers import Conv2D, MaxPooling2D, Dense, Dropout
from tensorflow.keras.layers import BatchNormalization, Input, Concatenate
from tensorflow.keras.layers import GlobalAveragePooling2D, GaussianNoise
from tensorflow.keras.models import Model
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.regularizers import l2
from tensorflow.keras.callbacks import EarlyStopping

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
    horizontal_flip=True,
    brightness_range=[0.6, 1.4],
    width_shift_range=0.1,
    height_shift_range=0.1
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

# 4. Build Model (Custom Inception Hybrid)
def inception_block(x, filters):
    f1, f3, f5, fpool = filters
    conv1 = Conv2D(f1, (1,1), padding='same', activation='relu')(x)
    conv3 = Conv2D(f3, (3,3), padding='same', activation='relu')(x)
    conv5 = Conv2D(f5, (5,5), padding='same', activation='relu')(x)
    pool = MaxPooling2D((3,3), strides=1, padding='same')(x)
    pool = Conv2D(fpool, (1,1), padding='same', activation='relu')(pool)
    return Concatenate()([conv1, conv3, conv5, pool])

def build_model(input_shape=(224,224,3), num_classes=5):
    inputs = Input(shape=input_shape)
    x = GaussianNoise(0.08)(inputs)
    x = Conv2D(32, (3,3), activation='relu', padding='same', kernel_regularizer=l2(0.001))(x)
    x = BatchNormalization()(x)
    x = MaxPooling2D(2,2)(x)
    x = Conv2D(64, (3,3), activation='relu', padding='same', kernel_regularizer=l2(0.001))(x)
    x = BatchNormalization()(x)
    x = MaxPooling2D(2,2)(x)
    x = inception_block(x, [32,32,32,32])
    x = MaxPooling2D(2,2)(x)
    x = inception_block(x, [32,32,32,32])
    x = MaxPooling2D(2,2)(x)
    x = GlobalAveragePooling2D()(x)
    x = Dense(128, activation='relu')(x)
    x = Dropout(0.6)(x)
    outputs = Dense(num_classes, activation='softmax')(x)
    return Model(inputs, outputs)

model = build_model(num_classes=train_data.num_classes)

model.compile(optimizer=Adam(learning_rate=0.00003), loss=tf.keras.losses.CategoricalCrossentropy(label_smoothing=0.1), metrics=['accuracy'])
early_stop = EarlyStopping(monitor='val_loss', patience=5, restore_best_weights=True)

# 5. Train Model
history = model.fit(train_data, validation_data=val_data, epochs=10, callbacks=[early_stop])

# 6. Save Model
model.save("/content/drive/MyDrive/model3_inception.keras")
print("Saved to Google Drive as model3_inception.keras")
