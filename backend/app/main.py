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


# ============================================================
# DATABASE
# ============================================================

Base.metadata.create_all(bind=engine)


# ============================================================
# FASTAPI APP
# ============================================================

app = FastAPI(title="AI Sentiment Analyzer")


# ============================================================
# CORS
# ============================================================

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


# ============================================================
# AI SENTIMENT MODEL
# ============================================================

sentiment_pipeline = pipeline(
    "text-classification",
    model="j-hartmann/sentiment-roberta-large-english-3-classes",
)

# ============================================================
# REQUEST MODEL
# ============================================================

class AnalyzeRequest(BaseModel):
    text: str


# ============================================================
# AUTH ROUTES
# ============================================================

app.include_router(auth_router)


# ============================================================
# ROOT
# ============================================================

@app.get("/")
def root():
    return {
        "message": "AI Sentiment Analyzer API is running"
    }


# ============================================================
# HEALTH CHECK
# ============================================================

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
    # --------------------------------------------------------
    # Validate text
    # --------------------------------------------------------

    text = request.text.strip()

    if not text:
        raise HTTPException(
            status_code=422,
            detail="Text cannot be empty.",
        )

    # --------------------------------------------------------
    # Get all three sentiment probabilities
    # --------------------------------------------------------

    results = sentiment_pipeline(
        text,
        truncation=True,
        max_length=512,
        top_k=None,
    )

    # Hugging Face may return either:
    #
    # [
    #     {"label": "...", "score": ...},
    #     {"label": "...", "score": ...},
    #     {"label": "...", "score": ...}
    # ]
    #
    # or:
    #
    # [
    #     [
    #         {"label": "...", "score": ...},
    #         {"label": "...", "score": ...},
    #         {"label": "...", "score": ...}
    #     ]
    # ]

    if results and isinstance(results[0], list):
        scores = results[0]
    else:
        scores = results

    # --------------------------------------------------------
    # Convert model labels to application labels
    # --------------------------------------------------------

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

    # --------------------------------------------------------
    # Make sure the model returned a valid prediction
    # --------------------------------------------------------

    if not predictions:
        raise HTTPException(
            status_code=503,
            detail="Sentiment model returned no supported predictions.",
        )

    # --------------------------------------------------------
    # Select the sentiment with the highest probability
    # --------------------------------------------------------

    best_prediction = max(
        predictions,
        key=lambda item: item["score"],
    )

    sentiment = best_prediction["sentiment"]
    confidence = best_prediction["score"]

    # --------------------------------------------------------
    # Debug output
    # --------------------------------------------------------

    print("\n--- SENTIMENT MODEL SCORES ---")

    for prediction in sorted(
        predictions,
        key=lambda item: item["score"],
        reverse=True,
    ):
        print(
            f"{prediction['sentiment']}: "
            f"{prediction['score'] * 100:.2f}%"
        )

    print("------------------------------\n")

    # --------------------------------------------------------
    # Save analysis to database
    # --------------------------------------------------------

    analysis = Analysis(
        user_id=current_user.id,
        text=text,
        sentiment=sentiment,
        confidence=round(confidence * 100, 2),
    )

    db.add(analysis)
    db.commit()
    db.refresh(analysis)

    # --------------------------------------------------------
    # Return result to frontend
    # --------------------------------------------------------

    return {
        "id": analysis.id,
        "sentiment": analysis.sentiment,
        "confidence": analysis.confidence,
        "model": "j-hartmann/sentiment-roberta-large-english-3-classes",
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

    # --------------------------------------------------------
    # Total analyses
    # --------------------------------------------------------

    total_analyses = (
        db.query(func.count(Analysis.id))
        .filter(Analysis.user_id == user_id)
        .scalar()
        or 0
    )

    # --------------------------------------------------------
    # Positive count
    # --------------------------------------------------------

    positive_count = (
        db.query(func.count(Analysis.id))
        .filter(
            Analysis.user_id == user_id,
            Analysis.sentiment == "POSITIVE",
        )
        .scalar()
        or 0
    )

    # --------------------------------------------------------
    # Negative count
    # --------------------------------------------------------

    negative_count = (
        db.query(func.count(Analysis.id))
        .filter(
            Analysis.user_id == user_id,
            Analysis.sentiment == "NEGATIVE",
        )
        .scalar()
        or 0
    )

    # --------------------------------------------------------
    # Neutral count
    # --------------------------------------------------------

    neutral_count = (
        db.query(func.count(Analysis.id))
        .filter(
            Analysis.user_id == user_id,
            Analysis.sentiment == "NEUTRAL",
        )
        .scalar()
        or 0
    )

    # --------------------------------------------------------
    # Average confidence
    # --------------------------------------------------------

    average_confidence = (
        db.query(func.avg(Analysis.confidence))
        .filter(Analysis.user_id == user_id)
        .scalar()
        or 0
    )

    # --------------------------------------------------------
    # Recent analyses
    # --------------------------------------------------------

    recent = (
        db.query(Analysis)
        .filter(Analysis.user_id == user_id)
        .order_by(Analysis.created_at.desc())
        .limit(5)
        .all()
    )

    # --------------------------------------------------------
    # Sentiment over time
    # --------------------------------------------------------

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

    # --------------------------------------------------------
    # Return dashboard data
    # --------------------------------------------------------

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