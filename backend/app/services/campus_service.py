from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.campus import Campus


def ensure_default_campus(db: Session) -> Campus:
    settings = get_settings()
    campus = db.query(Campus).filter(Campus.id == settings.default_campus_id).first()
    if campus:
        return campus

    campus = Campus(
        id=settings.default_campus_id,
        code="QMIS-MDU",
        name="Queen Mira International School - Madurai",
        city="Madurai",
        state="Tamil Nadu",
        is_active=True,
    )
    db.add(campus)
    db.commit()
    db.refresh(campus)
    return campus
