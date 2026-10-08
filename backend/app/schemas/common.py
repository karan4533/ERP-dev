from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str
    app: str
    env: str
    version: str


class MessageResponse(BaseModel):
    message: str
