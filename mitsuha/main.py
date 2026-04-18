import os

from core.train.actual_finetune import actual_finetune
from core.train.conv_tflite import conv_tflite
from core.train.data_processor import copy_record, label_record
from core.train.mnist_train import train_mnist

run_path = os.path.dirname(os.path.realpath(__file__))

if __name__ == "__main__":
  while True:
    command = input("# ")

    try:
      if command == "exit":
        break
      elif command == "help":
        print("""train_mnist:\t Train a model on the MNIST dataset and save it as 'mnist.keras'.
train_finetune:\t Fine-tune the model on the actual dataset.
conv_tflite:\t Convert a .keras model to .tflite format.
test_mnist:\t Test a model on the MNIST dataset.
test_actual:\t Test a model on the actual dataset.
load_record:\t Copy digit image from CAPTCHA record table.
label: Label:\t the digit image.""")
      elif command == "train_mnist":
        train_mnist()
      elif command == "train_finetune":
        actual_finetune()
      elif command == "conv_tflite":
        conv_tflite()
      elif command == "test_mnist":
        raise NotImplementedError("Not Impl. test_mnist")
      elif command == "test_actual":
        raise NotImplementedError("Not Impl. test_actual")
      elif command == "load_record":
        copy_record()
      elif command == "label":
        label_record()
      else:
        print("Invalid operation")
    except Exception as e:
      print("An error occurred during the operation:\n", e)
