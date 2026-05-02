import os
from typing import List

from core.database import create_connection
from core.model.CaptchaRecordModel import CaptchaRecordModel
from core.model.TrainDigits import TrainDigits


def cls():
  os.system('cls' if os.name == 'nt' else 'clear')


def copy_record():
  print("Connecting to database")
  with create_connection() as conn:
    cnt = (
      conn.query(CaptchaRecordModel)
      .filter(CaptchaRecordModel.is_passed == False)
      .count()
    )
    print("Found {} records, {} images".format(cnt, cnt * 2))

    print("Reading records")
    records: List[CaptchaRecordModel] = (
      conn.query(CaptchaRecordModel)
      .filter(CaptchaRecordModel.is_passed == False)
      .yield_per(100)
    )

    for record in records:
      td0 = TrainDigits(
        raw_record_id=record.uid,
        image=record.digit_image[0],
        digit_position=False,
        prediction=record.predicted[0],
        score=record.all_scores[0],
        label=record.predicted[0],
      )

      td1 = TrainDigits(
        raw_record_id=record.uid,
        image=record.digit_image[1],
        digit_position=True,
        prediction=record.predicted[1],
        score=record.all_scores[1],
        label=record.predicted[1],
      )

      conn.add_all([td0, td1])
      record.is_passed = True

    while True:
      x = input("Batch completed. Commit? : ")
      if x == "Y" or x == "y":
        print("Commit")
        conn.commit()
        break
      elif x == "N" or x == "n":
        print("Rollback")
        conn.rollback()
        break
      else:
        print("Invalid input")


def label_record():
  print("Connecting to database")
  with create_connection() as conn:
    cnt = (
      conn.query(TrainDigits)
      .filter(TrainDigits.is_verified == False)
      .count()
    )

    print("Found unverified {} images".format(cnt))

    i = 0
    last_uid = None
    last_prediction = None
    while True:
      cls()

      record: TrainDigits = (
        conn.query(TrainDigits)
        .filter(TrainDigits.is_verified == False)
        .order_by(TrainDigits.prediction.asc())
        .order_by(TrainDigits.uid.asc())
        .first()
      )

      if not record:
        print("No more record to label")
        return

      print("Labeling")
      print("===========================================")
      print("{}/{} ({:.2f}%)".format(i, cnt, i * 100 / cnt))
      print("UID   ={}\nREQ_ID={}".format(record.uid, record.raw_record_id))
      print("===========================================")
      print()

      for row in record.image:
        for col in row:
          print("@@@" if col == 1 else "...", end='')
        print()

      print("PRED = {}, CONF = {}".format(record.prediction, max(record.score)))
      if last_prediction != record.prediction:
        print("------ PREDICTION CHANGED ------")
      while True:
        x = input("ANSWER: ")
        print("WAIT")
        if x == "":
          record.is_verified = True
          record.label = record.prediction
          conn.commit()
          i += 1
          last_uid = record.uid
          last_prediction = record.prediction
          break
        elif x.isdigit() and 0 <= int(x) <= 9:
          record.is_verified = True
          record.label = int(x)
          conn.commit()
          i += 1
          last_uid = record.uid
          last_prediction = record.label
          break
        elif x == "pass" or x == "p":
          record.is_verified = True
          record.label = -1
          conn.commit()
          break
        elif x == "q" or x == "quit" or x == "exit":
          return
        elif x == "back" or x == "b":
          if last_uid is None:
            print("Nothing to revert")
          else:
            last: TrainDigits = (
              conn.query(TrainDigits)
              .filter(TrainDigits.uid == last_uid)
              .scalar()
            )
            last.is_verified = False
            conn.commit()
            last_prediction = record.prediction
            break
        else:
          print("Invalid input")
