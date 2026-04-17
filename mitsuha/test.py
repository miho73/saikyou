import os

import numpy as np
import tensorflow as tf

from image_predictor import preprocess

test_images = "snu_numbers"
model_path = "mnist.keras"

if not os.path.exists(test_images):
  print(f"Directory '{test_images}' does not exist.")
  exit(-1)

if not os.path.exists(model_path):
  print(f"Model '{model_path}' does not exist.")
  exit(-1)

file_list = os.listdir(test_images)

print(f"Test {len(file_list)} images in '{test_images}'")

print(f"Loading model from {model_path}")
model = tf.keras.models.load_model(model_path)
model.summary()

ac, wa = 0, 0
for filename in file_list:
  file_path = os.path.join(test_images, filename)

  try:
    mnist_ready = preprocess(file_path)

    predictions = model.predict(mnist_ready, verbose=0)
    pred_nums = np.argmax(predictions, axis=1)
    pred_conf = np.max(predictions, axis=1)

    answer = filename.split(".")[0]
    prediction = str(pred_nums[0]) + str(pred_nums[1])
    correct = prediction == answer
    if correct:
      ac += 1
    else:
      wa += 1

    print(f"Image {filename}. Prediction: {prediction}. Confidence: {np.prod(pred_conf)*100:.2f}%[{pred_conf[0]*100:6.2f},{pred_conf[1]*100:6.2f}] Result: {"O" if correct else "X"})")

  except Exception as e:
    print(f"File '{file_path}' could not be processed\n", e)

print("==================================================================\n%.2f%%" % (100*ac/(ac+wa)))
