from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import date as date_module

from ..database import get_db
from ..models import Session as SessionModel, Store
from ..schemas.session import SessionResponse
from ..dependencies import get_current_store

router = APIRouter(prefix="/api/sessions", tags=["Sessions"])


@router.get("/today", response_model=SessionResponse)
async def get_today_session(
    store: Store = Depends(get_current_store),
    db: Session = Depends(get_db)
):
    """Get or create today's session"""
    today = date_module.today()

    session = db.query(SessionModel).filter(
        SessionModel.store_id == store.id,
        SessionModel.date == today
    ).first()

    if not session:
        session = SessionModel(
            store_id=store.id,
            date=today
        )
        db.add(session)
        db.commit()
        db.refresh(session)

    return session


@router.get("/{date}", response_model=SessionResponse)
async def get_session_by_date(
    date: str,
    store: Store = Depends(get_current_store),
    db: Session = Depends(get_db)
):
    """Get session for a specific date"""
    try:
        session_date = date_module.fromisoformat(date)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid date format. Use YYYY-MM-DD"
        )

    session = db.query(SessionModel).filter(
        SessionModel.store_id == store.id,
        SessionModel.date == session_date
    ).first()

    if not session:
        # Create session if it doesn't exist
        session = SessionModel(
            store_id=store.id,
            date=session_date
        )
        db.add(session)
        db.commit()
        db.refresh(session)

    return session


@router.patch("/{session_id}/export", response_model=SessionResponse)
async def mark_session_exported(
    session_id: str,
    store: Store = Depends(get_current_store),
    db: Session = Depends(get_db)
):
    """Mark a session as exported"""
    session = db.query(SessionModel).filter(
        SessionModel.id == session_id,
        SessionModel.store_id == store.id
    ).first()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    session.exported = True
    db.commit()
    db.refresh(session)
    return session
