from models.pre_assessment.answers import Answer
from models.pre_assessment.pre_assemments import PreAssessment
from models.pre_assessment.questions import Question
from models.pre_assessment.sections import Section
from models.pre_assessment.submissions import Submission
from models import Application
from models.schemas.params import PreAssessmentParams
from fastapi import HTTPException, status
from sqlalchemy import select, desc, asc, func
from sqlalchemy.orm import Session
from datetime import date
from services.notifications.email_notify import send_email
from .pre_assessment_drafts import delete_draft

from models.schemas.pre_assessment_schema import (
    AssessmentCreate,
    AssessmentOut,
    SectionCreate,
    SectionOut,
    QuestionCreate,
    QuestionOut,
    AnswerCreate,
    SubmissionsOut,
    AnswerOut,
    PreAssessmentEvaluateSchema,
    DefaultQuestions,
)
from models.schemas.crud_schemas import UserOut
from dotenv import load_dotenv
import os

load_dotenv()


def generate_ticket_id(db: Session, model) -> str:
    today_str = date.today().strftime("%y%m%d")

    # Get the latest submission for today
    last_id = db.scalar(
        select(model.id)
        .where(model.id.like(f"ISP-{today_str}-%"))
        .order_by(desc(model.created_at))
    )

    if last_id:
        try:
            last_seq = int(last_id.split("-")[-1])
        except ValueError:
            last_seq = 0
        next_seq = last_seq + 1
    else:
        next_seq = 1

    return f"ISP-{today_str}-{next_seq:03d}"


def create_assessement(payload: AssessmentCreate, db: Session):
    try:
        assessment = PreAssessment(**payload.model_dump())
        db.add(assessment)
        db.flush()

        default_section = Section(
            assessment_id=assessment.id, title="General Application Questions"
        )
        db.add(default_section)
        db.flush()

        default_q_instance = DefaultQuestions()
        default_qs = []
        for key, val in default_q_instance.model_dump().items():
            default_qs.append(
                Question(section_id=default_section.id, question_text=val)
            )

        db.add_all(default_qs)

        db.commit()
        db.refresh(assessment)
        db.refresh(default_section)
        for q in default_qs:
            db.refresh(q)

        return AssessmentOut.model_validate(assessment)

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error Adding the pre assessment {str(e)}",
        )


def get_assessments(db: Session):
    try:
        assessments = db.scalars(select(PreAssessment)).all()

        if not assessments:
            return []

        return [AssessmentOut.model_validate(assessment) for assessment in assessments]

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching assessments {str(e)}",
        )


def add_sections(payload: SectionCreate, assessment_id: str, db: Session):
    try:
        assessment = db.get(PreAssessment, assessment_id)

        if not assessment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Assessment not found for section creation",
            )

        new_section = Section(assessment_id=assessment.id, **payload.model_dump())

        db.add(new_section)
        db.commit()
        db.refresh(new_section)

        return SectionOut.model_validate(new_section)

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error Adding the Section {str(e)}",
        )


def get_sections(assessment_id: str, db: Session):
    try:
        assessment = db.get(PreAssessment, assessment_id)

        if not assessment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Assessment not found for section creation",
            )

        return [SectionOut.model_validate(section) for section in assessment.sections]

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching the sections {str(e)}",
        )


def add_questions(payload: list[QuestionCreate], section_id: str, db: Session):
    try:
        section = db.get(Section, section_id)

        if not section:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Section not found for section creation",
            )

        new_questions = [
            Question(section_id=section_id, **Q.model_dump()) for Q in payload
        ]
        db.add_all(new_questions)
        db.commit()

        return [QuestionOut.model_validate(new_q) for new_q in new_questions]
    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error Adding the Question {str(e)}",
        )


def get_assessment_questionnaire(assessment_id: str, db: Session):
    try:
        assessment = db.get(PreAssessment, assessment_id)
        if not assessment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Assessment not found for section creation",
            )
        sections = assessment.sections

        results = []

        for section in sections:
            questions = section.questions
            results.append(
                {
                    "section": SectionOut.model_validate(section),
                    "questions": [
                        QuestionOut.model_validate(question) for question in questions
                    ],
                }
            )
        return results

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting Questionnaire {str(e)}",
        )


def get_section_questions(section_id: str, db: Session):
    try:
        section = db.get(Section, section_id)
        if not section:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Section not found for questions fetch",
            )
        questions = section.questions

        return [QuestionOut.model_validate(question) for question in questions]

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error Adding the Question {str(e)}",
        )


async def submit_answers(
    assessment_id: str, responses: list[AnswerCreate], user: UserOut, db: Session
):
    try:
        assessment = db.get(PreAssessment, assessment_id)

        if not assessment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Assessment not found for section creation",
            )
        next_ticket_id = generate_ticket_id(db, Submission)

        new_submission = Submission(
            id=next_ticket_id, assessment_id=assessment_id, user_id=user.id
        )
        db.add(new_submission)
        db.flush()

        try:
            new_answers = [
                Answer(submission_id=new_submission.id, **res.model_dump())
                for res in responses
            ]
            db.add_all(new_answers)
            db.commit()

            # await send_email(
            #     subject="Assessment Submission recieved",
            #     reciepient=user,
            #     message=f"We have recieved your submission on ID {new_submission.id}. Please wait until our team evaluates your submission.",
            # )
            admin = UserOut(
                id="ad",
                username="is_assessment_team",
                email=os.getenv("RECIEVER_ADMIN", ""),
                role="admin",
                first_name="IS Assessment",
                last_name="Team",
            )
            # await send_email(
            #     subject="Assessment Submission recieved",
            #     reciepient=admin,
            #     message=f"You have new submission for pre assessment evaulation from {user.first_name}.\n Reference ID: {new_submission.id}. Please evaluate the submission.",
            # )

            delete_draft(db, user.id, assessment_id)

            return {
                "submission_id": new_submission.id,
                "answers_saved": len(new_answers),
            }

        except Exception as e:
            db.rollback()
            new_sub = db.get(Submission, new_submission.id)
            if new_sub:
                db.delete(new_sub)
                db.commit()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Unable to submit responses {str(e)}",
            )

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error Adding the Question {str(e)}",
        )


def get_assessment_submissions_for_admin(
    user: UserOut, db: Session, params: PreAssessmentParams
):
    try:
        # db.scalars(select(Submission).where(Submission.user_id))

        sort_column = getattr(Submission, params.sort_by)

        if params.sort_order == "desc":
            sort_column = desc(sort_column)
        else:
            sort_column = asc(sort_column)

        stmt = select(Submission).order_by(sort_column)

        total_count = db.scalar(select(func.count()).select_from(stmt.subquery()))

        if (
            params.search
            and params.search != "null"
            and params.search_by
            and params.search.strip() != ""
        ):
            search_value = f"%{params.search}%"
            search_column = getattr(Submission, params.search_by)
            stmt = stmt.where(search_column.ilike(search_value))

        if params.page >= 1:
            submissions = db.scalars(
                stmt.limit(params.page_size).offset(
                    (params.page_size * params.page - params.page_size)
                )
            ).all()

        else:
            submissions = db.scalars(stmt).all()

        result = []
        for sub in submissions:
            result.append(
                SubmissionsOut(
                    id=sub.id,
                    status=sub.status,
                    created_at=sub.created_at,
                    updated_at=sub.updated_at,
                    submitted_user=UserOut.model_validate(sub.submitted_user),
                    assessment=AssessmentOut.model_validate(sub.pre_assessment),
                    assessed_by=UserOut.model_validate(sub.assessed_person)
                    if sub.assessed_person
                    else None,
                )
            )

        return {"total_count": total_count, "submissions": result}

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching submissions {str(e)}",
        )


def get_assessment_submissions_for_user(
    user_id: str, db: Session, params: PreAssessmentParams
):
    try:
        sort_column = getattr(Submission, params.sort_by, None)
        if not sort_column:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid sort_by field: {params.sort_by}",
            )
        if params.sort_order == "desc":
            sort_column = desc(sort_column)
        else:
            sort_column = asc(sort_column)

        stmt = (
            select(Submission)
            .where(Submission.user_id == user_id)
            .order_by(sort_column)
        )
        total_count = db.scalar(select(func.count()).select_from(stmt.subquery()))

        if (
            params.search
            and params.search != "null"
            and params.search_by
            and params.search.strip() != ""
        ):
            search_value = f"%{params.search}%"
            search_column = getattr(Submission, params.search_by)
            stmt = stmt.where(search_column.ilike(search_value))

        if params.page >= 1:
            submissions = db.scalars(
                stmt.limit(params.page_size).offset(
                    (params.page_size * params.page - params.page_size)
                )
            ).all()

        else:
            submissions = db.scalars(stmt).all()

        result = []
        for sub in submissions:
            result.append(
                SubmissionsOut(
                    id=sub.id,
                    status=sub.status,
                    created_at=sub.created_at,
                    updated_at=sub.updated_at,
                    assessment=AssessmentOut.model_validate(sub.pre_assessment),
                    submitted_user=UserOut.model_validate(sub.submitted_user),
                    assessed_by=UserOut.model_validate(sub.assessed_person)
                    if sub.assessed_person
                    else None,
                )
            )

        return {"total_count": total_count, "submissions": result}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching submissions {str(e)}",
        )


def get_assessment_responses(submission_id: str, db: Session, user: UserOut):
    try:
        submission = db.get(Submission, submission_id)
        if not submission:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Submission doesn't exist"
            )
        if submission.user_id != user.id and user.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"You are not authorised {user.username}",
            )

        result = [AnswerOut.model_validate(ans) for ans in submission.answers]

        return result if result else []

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error Adding the Question {str(e)}",
        )


async def evaluate_pre_assessment(
    submission_id: str, db: Session, user: UserOut, payload: PreAssessmentEvaluateSchema
):
    try:
        submission = db.get(Submission, submission_id)
        if not submission:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Submission doesn't exist"
            )
        submission.status = payload.status
        submission.assessed_by = user.id
        db.flush()

        if submission.status == "approved":
            answers = db.scalars(
                select(Answer).where(Answer.submission_id == submission.id)
            ).all()

            dq = DefaultQuestions()
            mapping = {
                dq.app_name: "name",
                dq.app_tech: "app_tech",
                dq.owner: "owner_name",
            }

            new_app_data = {}

            for ans in answers:
                field = mapping.get(ans.question.question_text)
                if field:
                    new_app_data[field] = ans.answer_text

            try:
                new_app = Application(
                    creator_id=submission.assessed_by,
                    owner_id=submission.user_id,
                    ticket_id=submission.id,
                    **new_app_data,
                )
                db.add(new_app)
            except Exception as e:
                raise HTTPException(
                    status_code=status.HTTP_501_NOT_IMPLEMENTED,
                    detail=f"Falied to create app after evaluation {str(e)}",
                )

        status_message = (
            f"""We have to reject your application assessment request due to the following reasons.\n
                                    {payload.reason}"""
            if submission.status == "rejected"
            else f"""We have evaluated you pre assessment and ready to assess your application.\n {payload.reason}"""
        )

        # res = await send_email(
        #     subject="Assessment Evaluation update",
        #     reciepient=submission.submitted_user,
        #     message=f"We have evaluated your assessment submission with ID: {submission.id}.\n {status_message}",
        # )

        db.commit()
        db.refresh(submission)
        return {"email_status": res["success"], "msg": "Evaluation done."}

    except HTTPException:
        raise

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error Evaluating assessment {str(e)}",
        )


# try:
#     ...
# except HTTPException:
#     raise

# except Exception as e:
#     raise HTTPException(
#         status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#         detail=f"Error Adding the Question {str(e)}",
#     )
