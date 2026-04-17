from typing import List

from sqlalchemy import Column
from sqlalchemy.dialects.postgresql import ARRAY, UUID, INTEGER, FLOAT, VARCHAR
from sqlalchemy.orm import Mapped

from app.core.database import BaseTable

from uuid import UUID as PyUUID


class CaptchaRecordModel(BaseTable):
  __tablename__ = "captcha_record"

  uid: Mapped[PyUUID] = Column(UUID(as_uuid=True), primary_key=True, unique=True, nullable=False, server_default="gen_random_uuid()")
  request_id: Mapped[PyUUID] = Column(UUID(as_uuid=True), unique=True, nullable=False)
  original_image: Mapped[List[List[int]]] = Column(ARRAY(INTEGER, dimensions=2), nullable=False)
  digit_image: Mapped[List[List[int]]] = Column(ARRAY(INTEGER, dimensions=2), nullable=False)
  predicted: Mapped[List[int]] = Column(ARRAY(INTEGER), nullable=False)
  all_scores: Mapped[List[List[float]]] = Column(ARRAY(FLOAT, dimensions=2), nullable=False)
  turnaround_time: Mapped[float] = Column(FLOAT, nullable=False)
  model_tag: Mapped[str] = Column(VARCHAR(14), nullable=False)
