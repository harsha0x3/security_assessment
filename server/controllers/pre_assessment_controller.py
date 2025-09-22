from models.pre_assessment.answers import Answer
from models.pre_assessment.pre_assemments import PreAssessment
from models.pre_assessment.questions import Question
from models.pre_assessment.sections import Section
from models.pre_assessment.submissions import Submission
from models import Application
from models.schemas.crud_schemas import ApplicationCreate

from fastapi import HTTPException, status
from sqlalchemy import select, and_
from sqlalchemy.orm import Session

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


def submit_answers(
    assessment_id: str, responses: list[AnswerCreate], user_id: str, db: Session
):
    try:
        assessment = db.get(PreAssessment, assessment_id)

        if not assessment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Assessment not found for section creation",
            )

        new_submission = Submission(assessment_id=assessment_id, user_id=user_id)
        db.add(new_submission)
        db.flush()

        try:
            new_answers = [
                Answer(submission_id=new_submission.id, **res.model_dump())
                for res in responses
            ]
            db.add_all(new_answers)
            db.commit()
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


def get_assessment_submissions_for_admin(user_id: str, db: Session):
    try:
        # db.scalars(select(Submission).where(Submission.user_id))
        stmt = select(Submission)

        submissions = db.scalars(stmt).all()

        result = []
        for sub in submissions:
            result.append(
                SubmissionsOut(
                    id=sub.id,
                    status=sub.status,
                    created_at=sub.created_at,
                    updated_at=sub.created_at,
                    submitted_user=UserOut.model_validate(sub.submitted_user),
                    assessment=AssessmentOut.model_validate(sub.pre_assessment),
                    assessed_by=UserOut.model_validate(sub.assessed_person)
                    if sub.assessed_person
                    else None,
                )
            )

        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching submissions {str(e)}",
        )


def get_assessment_submissions_for_user(user_id: str, db: Session):
    try:
        stmt = select(Submission).where(Submission.user_id == user_id)

        submissions = db.scalars(stmt).all()

        result = []
        for sub in submissions:
            result.append(
                SubmissionsOut(
                    id=sub.id,
                    status=sub.status,
                    created_at=sub.created_at,
                    updated_at=sub.created_at,
                    assessment=AssessmentOut.model_validate(sub.pre_assessment),
                    submitted_user=UserOut.model_validate(sub.submitted_user),
                    assessed_by=UserOut.model_validate(sub.assessed_person)
                    if sub.assessed_person
                    else None,
                )
            )

        return result
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


def evaluate_pre_assessment(
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

            new_app = Application(creator_id=submission.assessed_by, **new_app_data)
            db.add(new_app)

        db.commit()
        db.refresh(submission)

    except HTTPException:
        raise

    except Exception as e:
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
