from typing import List

from pydantic import BaseModel, Field, field_validator


class CaptchaSolveRequest(BaseModel):
  image: List[List[int]] = Field(..., min_length=1352, max_length=1352)

  @field_validator('image')
  @classmethod
  def validate_shape(cls, v: List[List[int]]) -> List[List[int]]:
    if len(v) != 1352:
      raise ValueError("Invalid shape")
    if any(len(row) != 3 for row in v):
      raise ValueError("Invalid shape")
    return v

class CaptchaSolution(BaseModel):
  solution: str
  confidence: float
