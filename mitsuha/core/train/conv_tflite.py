import tensorflow as tf

model_path = "../../data/mnist.keras"

model = tf.keras.models.load_model(model_path)

model.summary()
print("==> Converting to TFLite model")

converter = tf.lite.TFLiteConverter.from_keras_model(model)

tflite_model = converter.convert()

with open("../../data/mnist.tflite", "wb") as f:
  f.write(tflite_model)

print("Done")
