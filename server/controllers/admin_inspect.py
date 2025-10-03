from models import Application, Submission
from sqlalchemy import select
from sqlalchemy.orm import Session


def get_subs_n_apps(db: Session):
    try:
        stmt = select(Application, Submission).join(
            Submission, Application.ticket_id == Submission.id, isouter=True
        )
        results = db.scalars(stmt).all()
        return results
    except Exception as e:
        print(f"Error fetching submissions and applications: {e}")
        return []
