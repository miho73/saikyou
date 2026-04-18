import os.path
from datetime import datetime
from typing import List

import numpy as np
from sklearn.model_selection import train_test_split
import tensorflow as tf
from tensorflow.keras.optimizers import Adam
from tensorflow.python.keras.callbacks import EarlyStopping

from core.database import create_connection
from core.model.TrainDigits import TrainDigits

run_path = os.getcwd()

def actual_finetune():
  model_name = input("MNIST model to finetune: ")
  model_path = os.path.join(run_path, "data", model_name + ".keras")

  print("Connecting to database")
  with create_connection() as conn:
    print("Loading dataset")
    records: List[TrainDigits] = (
      conn.query(TrainDigits)
      .filter(TrainDigits.is_verified == True)
      .all()
    )

    print("{} images found for finetuning".format(len(records)))

    print("Preprocessing dataset")
    x_list = []
    y_list = []
    for r in records:
      x_list.append(r.image)
      y_list.append(r.label)

  x = np.array(x_list, dtype=np.float32)
  y = np.array(y_list, dtype=np.float32)

  x = np.expand_dims(x, axis=-1)

  x_train, x_val, y_train, y_val = train_test_split(x, y, test_size=0.2, random_state=42)
  print("Train size: {}, Test size: {}".format(len(y_train), len(y_val)))

  print("Loading model")
  model = tf.keras.models.load_model(model_path)
  model.summary()

  test_loss_pre, test_acc_pre = model.evaluate(x, y, verbose=0)
  print(f"Accuracy: {test_acc_pre * 100:.2f}%")
  c = input("Continue? : ")
  if c != "y" and c != 'Y':
    print("Abort")
    return

  model.compile(
    optimizer=Adam(learning_rate=0.0001),
    loss='sparse_categorical_crossentropy',
    metrics=['accuracy']
  )

  early_stopping = EarlyStopping(
    monitor='val_loss',
    patience=5,
    restore_best_weights=True
  )

  print("Fine-tuning model")
  model.fit(
    x_train, y_train,
    validation_data=(x_val, y_val),
    epochs=50,
    batch_size=32,
    callbacks=[early_stopping]
  )

  print("Done")

  print("Validating")
  test_loss, test_acc = model.evaluate(x_val, y_val, verbose=0)
  print(f"Accuracy: {test_acc * 100:.2f}%")

  while True:
    save = input("Save model? (y/n): ")
    if save == "y":
      date = datetime.now().strftime("%y-%m-%d")
      model.save(os.path.join(run_path, 'data', 'saikyou-{}.keras'.format(date)))
      print("Model saved as saikyou-{}.keras".format(date))
      break
    elif save == "n":
      print("Trashed")
      break
    else:
      print("Invalid input")
