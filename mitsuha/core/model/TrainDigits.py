from datetime import datetime
from typing import List

from sqlalchemy import Column, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, ARRAY, SMALLINT, FLOAT, BOOLEAN, TIMESTAMP
from sqlalchemy.orm import Mapped, relationship, backref
from uuid import UUID as PyUUID

from sqlalchemy.sql.functions import current_timestamp

from core.database import BaseTable
from core.model.CaptchaRecordModel import CaptchaRecordModel


class TrainDigits(BaseTable):
  __tablename__ = 'train_digits'
  uid: Mapped[PyUUID] = Column(UUID(as_uuid=True), primary_key=True, unique=True, nullable=False, server_default="gen_random_uuid()")
  raw_record_id: Mapped[PyUUID] = Column(UUID(as_uuid=True), ForeignKey("captcha_record.uid"), nullable=False)
  image: Mapped[List[List[int]]] = Column(ARRAY(SMALLINT, dimensions=2), nullable=False)
  digit_position: Mapped[bool] = Column(BOOLEAN, nullable=False)
  prediction: Mapped[int] = Column(SMALLINT, nullable=False)
  score: Mapped[List[float]] = Column(ARRAY(FLOAT), nullable=False)
  label: Mapped[int] = Column(SMALLINT, nullable=False)
  is_verified: Mapped[bool] = Column(BOOLEAN, nullable=False, server_default="false")

  created_at: Mapped[datetime] = Column(TIMESTAMP(timezone=True), nullable=False, server_default="now()")
  updated_at: Mapped[datetime] = Column(TIMESTAMP(timezone=True), nullable=False, server_default="now()", onupdate=current_timestamp())

  raw_record: Mapped[CaptchaRecordModel] = relationship(
    "CaptchaRecordModel",
    uselist=False,
    backref=backref(
      "train_digits",
      uselist=True,
      cascade="all, delete-orphan",
      single_parent=True
    ),
  )
