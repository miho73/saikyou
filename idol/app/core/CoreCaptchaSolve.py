import logging

import cv2
import numpy as np
from tensorflow.lite.python.interpreter import Interpreter

from app.core.Config import config

log = logging.getLogger(__name__)

interpreter = Interpreter(model_path=config["model"]["path"])
interpreter.resize_tensor_input(interpreter.get_input_details()[0]['index'], (2, 28, 28, 1))
interpreter.allocate_tensors()
input_details = interpreter.get_input_details()
output_details = interpreter.get_output_details()
log.info("MNIST model loaded")


def process_image(img: np.ndarray) -> np.ndarray:
  # to monochrome
  monochrome = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)

  # to binary
  _, binary_img = cv2.threshold(monochrome, 127, 255, cv2.THRESH_BINARY)
  binary_img = cv2.bitwise_not(binary_img)

  # find contours
  contours, _ = cv2.findContours(binary_img, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
  if not contours:
    raise BaseException("numbers was not found")

  num_contours = sorted(contours, key=cv2.contourArea, reverse=True)[:2]

  if len(num_contours) < 2:
    raise BaseException("too few digit(s)")

  mnist_ready = []
  begin_x = []

  for contour in num_contours:
    # digit만 자르기
    x, y, w, h = cv2.boundingRect(contour)
    digit_crop = binary_img[y:y + h, x:x + w]

    # 20 x 20으로 리사이즈
    side_len = max(w, h)
    scale = 20.0 / side_len
    new_w, new_h = int(w * scale), int(h * scale)

    digit_resized = cv2.resize(digit_crop, (new_w, new_h), interpolation=cv2.INTER_AREA)

    # 28 x 28로 padding
    canvas = np.zeros((28, 28), dtype=np.uint8)
    sx, sy = (28 - new_w) // 2, (28 - new_h) // 2

    canvas[sy:sy + new_h, sx:sx + new_w] = digit_resized / 255.0
    canvas_ready = canvas.reshape(28, 28, 1)
    mnist_ready.append(canvas_ready)
    begin_x.append(x)

  if begin_x[0] > begin_x[1]:
    mnist_ready[0], mnist_ready[1] = mnist_ready[1], mnist_ready[0]

  return np.array(mnist_ready)


def predict(img: np.ndarray):
  input_data = np.array(img, dtype=np.float32)
  interpreter.set_tensor(input_details[0]['index'], input_data)
  interpreter.invoke()

  output_data = interpreter.get_tensor(output_details[0]['index'])

  return output_data
