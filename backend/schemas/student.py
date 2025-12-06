from pydantic import BaseModel, EmailStr, Field


class StudentCreate(BaseModel):
    name: str
    email: EmailStr
    enrollmentNo: str


class StudentResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    enrollmentNo: str = Field(..., alias="enrollment_no")
    photo_count: int

    class Config:
        orm_mode = True
        allow_population_by_field_name = True
