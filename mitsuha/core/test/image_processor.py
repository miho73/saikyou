import cv2
import numpy as np

valid_extensions = ('.png', '.jpg', '.jpeg', '.bmp')

def preprocess(image_path: str):
  if not image_path.endswith(valid_extensions):
    raise BaseException("unsupported extension: " + image_path.split(".")[-1])

  img = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
  if img is None:
    raise BaseException("could not read image")

  _, binary_img = cv2.threshold(img, 127, 255, cv2.THRESH_BINARY)
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

  for i, contour in enumerate(num_contours):
    # digit만 자르기
    x, y, w, h = cv2.boundingRect(contour)
    digit_crop = binary_img[y:y+h, x:x+w]

    # 20 x 20으로 리사이즈
    side_len = max(w, h)
    scale = 20.0 / side_len
    new_w, new_h = int(w * scale), int(h * scale)

    digit_resized = cv2.resize(digit_crop, (new_w, new_h), interpolation=cv2.INTER_AREA)

    # 28 x 28로 padding
    canvas = np.zeros((28, 28), dtype=np.uint8)
    sx, sy = (28 - new_w) // 2, (28 - new_h) // 2

    canvas[sy:sy+new_h, sx:sx+new_w] = digit_resized / 255.0
    canvas_ready = canvas.reshape(28, 28, 1)
    mnist_ready.append(canvas_ready)
    begin_x.append(x)

  if begin_x[0] > begin_x[1]:
    mnist_ready[0], mnist_ready[1] = mnist_ready[1], mnist_ready[0]

  return np.array(mnist_ready)
