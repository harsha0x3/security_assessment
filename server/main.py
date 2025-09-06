from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from controllers.user_responses_controller import UPLOAD_DIR
from db.connection import init_db

# from db.events import checklist_complete_update
from routes import (
    application_routes,
    assignment_routes,
    auth_routes,
    checklists_routes,
    control_routes,
    responses_routes,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://10.160.14.76:8057","http://10.160.14.76:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


@app.get("/health")
async def health_check():
    return {"msg": "I'm alive", "status": "ok"}


app.include_router(auth_routes.router)
app.include_router(application_routes.router)
app.include_router(checklists_routes.router)
app.include_router(assignment_routes.router)
app.include_router(control_routes.router)
app.include_router(responses_routes.router)
