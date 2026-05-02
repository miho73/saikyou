import os
from datetime import datetime

import numpy as np
from keras import models, layers
from tensorflow.python.keras.callbacks import EarlyStopping

run_path = os.getcwd()
mnist_dset_path = os.path.join(run_path, 'data', 'mnist.npz')


def train_mnist():
  # ==============================================
  # 데이터 로딩
  # ==============================================
  print("Loading MNIST dateset")
  with np.load(mnist_dset_path, allow_pickle=True) as data:
    x_train, y_train = data["x_train"], data["y_train"]
    x_test, y_test = data["x_test"], data["y_test"]

  print(f"Train Size: {x_train.shape[0]}\nTest Size: {x_test.shape[0]}\n")

  # ==============================================
  # 데이터셋 전처리 & 모델 구성
  # ==============================================
  print("Preparing dataset")
  x_train, x_test = x_train / 255.0, x_test / 255.0
  x_train = x_train.reshape(x_train.shape[0], 28, 28, 1)
  x_test = x_test.reshape(x_test.shape[0], 28, 28, 1)

  print("Building model")
  model = models.Sequential([
    layers.Input(shape=(28, 28, 1)),

    layers.Conv2D(32, (3, 3), activation='relu'),
    layers.MaxPooling2D((2, 2)),
    layers.Flatten(),
    layers.Dense(128, activation='relu'),
    layers.Dense(10, activation='softmax')
  ])

  model.compile(
    optimizer='adam',
    loss='sparse_categorical_crossentropy',
    metrics=['accuracy']
  )

  # ==============================================
  # 학습
  # ==============================================
  print("Training")
  early_stop = EarlyStopping(monitor='val_loss', patience=3, restore_best_weights=True)

  model.fit(
    x_train, y_train,
    epochs=50,
    validation_data=(x_test, y_test),
    callbacks=[early_stop]
  )
  print("Done")

  print("Validating")
  test_loss, test_acc = model.evaluate(x_test, y_test, verbose=2)
  print(f"Accuracy: {test_acc * 100:.2f}%")

  while True:
    save = input("Save model? (y/n): ")
    if save == "y":
      date = datetime.now().strftime("%y-%m-%d")
      model.save(os.path.join(run_path, 'data', 'mnist-{}.keras'.format(date)))
      print("Model saved as mnist-{}.keras".format(date))
      break
    elif save == "n":
      print("Trashed")
      break
    else:
      print("Invalid input")
