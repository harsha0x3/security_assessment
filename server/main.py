from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from fastapi.staticfiles import StaticFiles

# from db.events import checklist_complete_update
from db.events.app_complete_update import update_application_completion
from routes import (
    auth_routes,
    application_routes,
    checklists_routes,
    assignment_routes,
    control_routes,
    responses_routes,
)
from db.connection import init_db
from controllers.user_responses_controller import UPLOAD_DIR


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
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
