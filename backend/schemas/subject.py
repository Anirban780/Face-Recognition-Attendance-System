from pydantic import BaseModel


class SubjectCreate(BaseModel):
    code: str
    name: str


class SubjectResponse(BaseModel):
    id: int
    code: str
    name: str

    class Config:
        orm_mode = True
