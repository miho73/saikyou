from datetime import datetime
from typing import List

from sqlalchemy import Column
from sqlalchemy.dialects.postgresql import ARRAY, UUID, SMALLINT, FLOAT, VARCHAR, TIMESTAMP, BOOLEAN
from sqlalchemy.orm import Mapped
from sqlalchemy.sql.functions import current_timestamp

from uuid import UUID as PyUUID

from core.database import BaseTable


class CaptchaRecordModel(BaseTable):
  __tablename__ = "captcha_record"

  uid: Mapped[PyUUID] = Column(UUID(as_uuid=True), primary_key=True, unique=True, nullable=False, server_default="gen_random_uuid()")
  request_id: Mapped[PyUUID] = Column(UUID(as_uuid=True), unique=True, nullable=False)
  original_image: Mapped[List[List[int]]] = Column(ARRAY(SMALLINT, dimensions=2), nullable=False)
  digit_image: Mapped[List[List[List[int]]]] = Column(ARRAY(SMALLINT, dimensions=3), nullable=False)
  predicted: Mapped[List[int]] = Column(ARRAY(SMALLINT), nullable=False)
  all_scores: Mapped[List[List[float]]] = Column(ARRAY(FLOAT, dimensions=2), nullable=False)
  turnaround_time: Mapped[float] = Column(FLOAT, nullable=False)
  model_tag: Mapped[str] = Column(VARCHAR(16), nullable=False)
  is_passed: Mapped[bool] = Column(BOOLEAN, nullable=False, server_default="false")

  created_at: Mapped[datetime] = Column(TIMESTAMP(timezone=True), nullable=False, server_default="now()")
  updated_at: Mapped[datetime] = Column(TIMESTAMP(timezone=True), nullable=False, server_default="now()", onupdate=current_timestamp())
