# AWS Lambda entry point — Mangum adapts the FastAPI ASGI app (server.py) into
# a Lambda-compatible handler so API Gateway events are routed to FastAPI.

from mangum import Mangum
from server import app

handler = Mangum(app)
