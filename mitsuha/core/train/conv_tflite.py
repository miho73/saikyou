import os

import tensorflow as tf

run_path = os.getcwd()


def conv_tflite():
  name = input("KERAS model name: ")
  model_path = os.path.join(run_path, 'data', name + '.keras')

  model = tf.keras.models.load_model(model_path)

  model.summary()
  print("==> Converting to TFLite model")

  converter = tf.lite.TFLiteConverter.from_keras_model(model)

  tflite_model = converter.convert()

  with open(os.path.join(run_path, 'data', name + '.tflite'), "wb") as f:
    f.write(tflite_model)

  print("Converted {}.keras to {}.tflite".format(name, name))
