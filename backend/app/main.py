from datetime import datetime

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session
from transformers import pipeline

from app.database import Base, engine, get_db
from app.dependencies import get_current_user
from app.models import Analysis
from app.routes.auth import router as auth_router


Base.metadata.create_all(bind=engine)


app = FastAPI(title="AI Sentiment Analyzer")


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# AI SENTIMENT MODEL
sentiment_pipeline = pipeline(
    "sentiment-analysis",
    model="cardiffnlp/twitter-roberta-base-sentiment-latest",
)


class AnalyzeRequest(BaseModel):
    text: str


app.include_router(auth_router)


@app.get("/")
def root():
    return {
        "message": "AI Sentiment Analyzer API is running"
    }


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy"
    }


# ============================================================
# ANALYZE SENTIMENT
# ============================================================

@app.post("/api/analyze")
def analyze_sentiment(
    request: AnalyzeRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    text = request.text.strip()

    if not text:
        raise HTTPException(
            status_code=422,
            detail="Text cannot be empty.",
        )

    # Get ALL three sentiment probabilities
    results = sentiment_pipeline(
        text,
        truncation=True,
        max_length=512,
        top_k=None,
    )

    # Hugging Face can return:
    # [[{...}, {...}, {...}]]
    # or
    # [{...}, {...}, {...}]
    if results and isinstance(results[0], list):
        scores = results[0]
    else:
        scores = results

    # Convert model labels to our application labels
    label_map = {
        "LABEL_0": "NEGATIVE",
        "LABEL_1": "NEUTRAL",
        "LABEL_2": "POSITIVE",
        "NEGATIVE": "NEGATIVE",
        "NEUTRAL": "NEUTRAL",
        "POSITIVE": "POSITIVE",
    }

    predictions = []

    for item in scores:
        raw_label = str(item["label"]).strip().upper()
        score = float(item["score"])

        sentiment = label_map.get(raw_label)

        if sentiment:
            predictions.append(
                {
                    "sentiment": sentiment,
                    "score": score,
                }
            )

    if not predictions:
        raise HTTPException(
            status_code=503,
            detail="Sentiment model returned no supported predictions.",
        )

    # Select the sentiment with the highest probability
    best_prediction = max(
        predictions,
        key=lambda item: item["score"],
    )

    sentiment = best_prediction["sentiment"]
    confidence = best_prediction["score"]

    # ========================================================
    # SAVE ANALYSIS TO DATABASE
    # ========================================================

    analysis = Analysis(
        user_id=current_user.id,
        text=text,
        sentiment=sentiment,
        confidence=round(confidence * 100, 2),
    )

    db.add(analysis)
    db.commit()
    db.refresh(analysis)

    # ========================================================
    # RETURN RESULT TO FRONTEND
    # ========================================================

    return {
        "id": analysis.id,
        "sentiment": analysis.sentiment,
        "confidence": analysis.confidence,
        "model": "cardiffnlp/twitter-roberta-base-sentiment-latest",
    }


# ============================================================
# DASHBOARD
# ============================================================

@app.get("/api/dashboard")
def dashboard(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_id = current_user.id

    total_analyses = (
        db.query(func.count(Analysis.id))
        .filter(Analysis.user_id == user_id)
        .scalar()
        or 0
    )

    positive_count = (
        db.query(func.count(Analysis.id))
        .filter(
            Analysis.user_id == user_id,
            Analysis.sentiment == "POSITIVE",
        )
        .scalar()
        or 0
    )

    negative_count = (
        db.query(func.count(Analysis.id))
        .filter(
            Analysis.user_id == user_id,
            Analysis.sentiment == "NEGATIVE",
        )
        .scalar()
        or 0
    )

    neutral_count = (
        db.query(func.count(Analysis.id))
        .filter(
            Analysis.user_id == user_id,
            Analysis.sentiment == "NEUTRAL",
        )
        .scalar()
        or 0
    )

    average_confidence = (
        db.query(func.avg(Analysis.confidence))
        .filter(Analysis.user_id == user_id)
        .scalar()
        or 0
    )

    recent = (
        db.query(Analysis)
        .filter(Analysis.user_id == user_id)
        .order_by(Analysis.created_at.desc())
        .limit(5)
        .all()
    )

    sentiment_rows = (
        db.query(
            func.date(Analysis.created_at).label("date"),
            Analysis.sentiment,
            func.count(Analysis.id).label("count"),
        )
        .filter(Analysis.user_id == user_id)
        .group_by(
            func.date(Analysis.created_at),
            Analysis.sentiment,
        )
        .order_by(func.date(Analysis.created_at))
        .all()
    )

    return {
        "total_analyses": total_analyses,
        "positive_count": positive_count,
        "negative_count": negative_count,
        "neutral_count": neutral_count,
        "average_confidence": round(
            float(average_confidence),
            2,
        ),
        "recent_analyses": [
            {
                "id": item.id,
                "text": item.text,
                "sentiment": item.sentiment,
                "confidence": item.confidence,
                "created_at": item.created_at.isoformat(),
            }
            for item in recent
        ],
        "sentiment_over_time": [
            {
                "date": str(row.date),
                "sentiment": row.sentiment,
                "count": row.count,
            }
            for row in sentiment_rows
        ],
    }


# ============================================================
# ANALYSIS HISTORY
# ============================================================

@app.get("/api/analyses")
def get_analyses(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    analyses = (
        db.query(Analysis)
        .filter(Analysis.user_id == current_user.id)
        .order_by(Analysis.created_at.desc())
        .all()
    )

    return [
        {
            "id": item.id,
            "text": item.text,
            "sentiment": item.sentiment,
            "confidence": item.confidence,
            "created_at": item.created_at.isoformat(),
        }
        for item in analyses
    ]