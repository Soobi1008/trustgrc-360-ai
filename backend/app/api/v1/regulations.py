from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.regulation import Regulation
from app.schemas.regulation import RegulationResponse

router = APIRouter()


@router.get(
    "/",
    response_model=list[RegulationResponse],
)
def list_regulations(
    db: Session = Depends(get_db),
):
    return (
        db.query(Regulation)
        .order_by(Regulation.short_name)
        .all()
    )


@router.get(
    "/{regulation_id}",
    response_model=RegulationResponse,
)
def get_regulation(
    regulation_id: int,
    db: Session = Depends(get_db),
):
    return (
        db.query(Regulation)
        .filter(
            Regulation.id == regulation_id
        )
        .first()
    )