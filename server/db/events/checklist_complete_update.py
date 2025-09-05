from sqlalchemy import event, func, select
from sqlalchemy.orm import Session

from models.checklists import Checklist
from models.controls import Control
from models.user_responses import UserResponse


@event.listens_for(Session, "after_flush")
def update_checklist_completion(session, flush_context):
    """
    After each flush, update is_completed for all checklists
    affected by new/updated/deleted UserResponse rows.
    """
    # Collect affected checklist IDs
    affected_checklist_ids = set()

    for instance in session.new.union(session.dirty).union(session.deleted):
        if isinstance(instance, UserResponse):
            print("IS instance in events")
            if instance.control_id:  # use control_id directly
                control = session.get(Control, instance.control_id)
                if control:
                    affected_checklist_ids.add(control.checklist_id)

    if not affected_checklist_ids:
        print("Not affected in  events")
        return

    for checklist_id in affected_checklist_ids:
        checklist = session.get(Checklist, checklist_id)
        if not checklist:
            print("No , cheklist")
            continue

        # Get all controls in this checklist
        control_ids = session.scalars(
            select(Control.id).where(Control.checklist_id == checklist.id)
        ).all()

        # For each user who has responses, check if all controls responded
        user_ids = session.scalars(
            select(UserResponse.user_id)
            .where(UserResponse.control_id.in_(control_ids))
            .distinct()
        ).all()

        for user_id in user_ids:
            responses_count = session.scalar(
                select(func.count(UserResponse.id)).where(
                    UserResponse.user_id == user_id,
                    UserResponse.control_id.in_(control_ids),
                )
            )

            # Update is_completed only if all controls have responses
            checklist.is_completed = responses_count == len(control_ids)
            session.add(checklist)
