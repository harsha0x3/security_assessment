from typing import Annotated

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Path,
    status,
)
from sqlalchemy.orm import Session
from db.connection import get_db_conn
from controllers.pre_assessment_controller import (
    create_assessement,
    add_questions,
    add_sections,
    get_assessment_questionnaire,
    get_assessments,
    get_sections,
    get_section_questions,
    submit_answers,
    get_assessment_submissions_for_admin,
    get_assessment_submissions_for_user,
    get_assessment_responses,
    evaluate_pre_assessment,
)
from models.schemas.pre_assessment_schema import (
    AssessmentCreate,
    AssessmentOut,
    SectionCreate,
    SectionOut,
    QuestionCreate,
    QuestionOut,
    AnswerCreate,
    SubmissionsOut,
    PreAssessmentEvaluateSchema,
)
from models.schemas.crud_schemas import UserOut
from services.auth.deps import get_current_user

router = APIRouter(tags=["PreAssessment"], prefix="/pre-assessment")


@router.post("/assessment")
async def create_new_assessment(
    payload: Annotated[AssessmentCreate, ""],
    db: Annotated[Session, Depends(get_db_conn)],
    current_user: Annotated[UserOut, Depends(get_current_user)],
):
    try:
        if current_user.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Not authorised for this action {current_user.username}",
            )

        return create_assessement(payload=payload, db=db)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating the assessment in route {str(e)}",
        )


@router.get("/assessments")
async def get_all_assessmenets(
    db: Annotated[Session, Depends(get_db_conn)],
    current_user: Annotated[UserOut, Depends(get_current_user)],
):
    return get_assessments(db)


@router.post("/{assessment_id}/section")
async def create_new_section(
    payload: Annotated[SectionCreate, ""],
    assessment_id: Annotated[str, Path(...), ""],
    db: Annotated[Session, Depends(get_db_conn)],
    current_user: Annotated[UserOut, Depends(get_current_user)],
):
    try:
        if current_user.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Not authorised for this action {current_user.username}",
            )

        return add_sections(payload=payload, assessment_id=assessment_id, db=db)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating the assessment in route {str(e)}",
        )


@router.get("/{assessment_id}/sections")
async def get_all_sections(
    assessment_id: Annotated[str, Path(...), ""],
    db: Annotated[Session, Depends(get_db_conn)],
    current_user: Annotated[UserOut, Depends(get_current_user)],
):
    return get_sections(assessment_id=assessment_id, db=db)


@router.post("/{section_id}/question")
async def create_new_questions(
    payload: Annotated[list[QuestionCreate], ""],
    section_id: Annotated[str, Path(...), ""],
    db: Annotated[Session, Depends(get_db_conn)],
    current_user: Annotated[UserOut, Depends(get_current_user)],
):
    try:
        if current_user.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Not authorised for this action {current_user.username}",
            )

        return add_questions(payload=payload, section_id=section_id, db=db)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating the assessment in route {str(e)}",
        )


@router.get("/section/{section_id}/questions")
async def get_questions_for_section(
    section_id: Annotated[str, Path(...), ""],
    db: Annotated[Session, Depends(get_db_conn)],
    current_user: Annotated[UserOut, Depends(get_current_user)],
):
    try:
        return get_section_questions(section_id=section_id, db=db)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating the assessment in route {str(e)}",
        )


@router.get("/{assessment_id}/questionnaire")
async def get_questionnaire_for_assessment(
    assessment_id: Annotated[str, Path(...), ""],
    db: Annotated[Session, Depends(get_db_conn)],
    current_user: Annotated[UserOut, Depends(get_current_user)],
):
    try:
        return get_assessment_questionnaire(assessment_id=assessment_id, db=db)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating the assessment in route {str(e)}",
        )


@router.post("/{assessment_id}/submit")
async def submit_responses(
    assessment_id: Annotated[str, Path(...), ""],
    responses: list[AnswerCreate],
    db: Annotated[Session, Depends(get_db_conn)],
    current_user: Annotated[UserOut, Depends(get_current_user)],
):
    return await submit_answers(
        assessment_id=assessment_id, responses=responses, user=current_user, db=db
    )


@router.get("/submissions/assessments", response_model=list[SubmissionsOut])
async def get_submissions(
    db: Annotated[Session, Depends(get_db_conn)],
    current_user: Annotated[UserOut, Depends(get_current_user)],
):
    if current_user.role == "admin":
        return get_assessment_submissions_for_admin(user=current_user, db=db)
    return get_assessment_submissions_for_user(user_id=current_user.id, db=db)


@router.get("/submissions/{submission_id}/responses")
async def get_responses(
    db: Annotated[Session, Depends(get_db_conn)],
    current_user: Annotated[UserOut, Depends(get_current_user)],
    submission_id: Annotated[str, Path(...)],
):
    return get_assessment_responses(
        submission_id=submission_id, db=db, user=current_user
    )


@router.patch("/submissions/{submission_id}/evaluate")
async def evaluate_pre_assessment_sub(
    db: Annotated[Session, Depends(get_db_conn)],
    current_user: Annotated[UserOut, Depends(get_current_user)],
    submission_id: Annotated[str, Path(...)],
    payload: Annotated[PreAssessmentEvaluateSchema, ""],
):
    try:
        if current_user.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Not authorised for this action {current_user.username}",
            )
        return await evaluate_pre_assessment(
            submission_id=submission_id, db=db, user=current_user, payload=payload
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error evaluating the assessment in route {str(e)}",
        )
