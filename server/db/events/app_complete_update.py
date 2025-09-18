from sqlalchemy import event
from sqlalchemy.orm import Session

from models.core.applications import Application
from models.core.checklists import Checklist


@event.listens_for(Session, "after_flush")
def update_application_completion(session, flush_context):
    """
    Automatically update Application.is_completed whenever a Checklist
    is inserted, updated, or deleted.
    """
    # Track which applications need updating
    apps_to_update = set()

    # Check new, dirty, and deleted objects
    for obj in session.new.union(session.dirty).union(session.deleted):
        if isinstance(obj, Checklist):
            if obj.app_id:
                apps_to_update.add(obj.app_id)

    # Update each affected application
    for app_id in apps_to_update:
        app = session.get(Application, app_id)
        if app:
            app.refresh_completion_status()
