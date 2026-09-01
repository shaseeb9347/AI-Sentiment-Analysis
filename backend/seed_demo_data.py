"""Seed realistic-looking historical sentiment data for local demos.

Usage:
    cd backend
    source .venv/bin/activate
    python seed_demo_data.py

This adds 90 analyses across the previous 30 days for the first registered user.
It does not delete existing records.
"""

from datetime import datetime, timedelta
import random

from app.database import SessionLocal
from app.models import User, Analysis

POSITIVE_TEXTS = [
    "The product is excellent and feels worth every rupee.",
    "Really happy with the experience. Everything worked smoothly.",
    "Fast delivery and great quality. I would definitely recommend it.",
    "The interface is clean, intuitive, and easy to use.",
    "Customer support solved my issue quickly and professionally.",
    "Amazing service. The whole process was simple and reliable.",
    "The latest update made the experience much better.",
    "I love how responsive and polished the product feels.",
]

NEUTRAL_TEXTS = [
    "The product is okay and works as expected.",
    "The experience was average. Nothing stood out either way.",
    "Delivery arrived on time and the quality is acceptable.",
    "The interface is simple, although it could use a few improvements.",
    "It does the job, but I would like to see more features.",
    "The service was fine and matched what I expected.",
    "Some parts are good while other parts could be improved.",
    "The latest update is okay; I have not noticed a major difference.",
]

NEGATIVE_TEXTS = [
    "The product was disappointing and did not meet expectations.",
    "The experience was slow and frustrating from start to finish.",
    "The quality feels poor compared with the price.",
    "I had trouble using the interface and could not find what I needed.",
    "Support took too long to respond to a simple issue.",
    "The latest update introduced bugs that were not there before.",
    "Delivery was late and the packaging arrived damaged.",
    "I would not recommend this product in its current state.",
]

random.seed(42)


def main():
    db = SessionLocal()
    try:
        user = db.query(User).order_by(User.id.asc()).first()
        if not user:
            print("No user found. Register/login once, then run this script.")
            return

        existing = db.query(Analysis).filter(Analysis.user_id == user.id).count()
        print(f"Existing analyses for {user.email}: {existing}")

        now = datetime.utcnow().replace(microsecond=0)

        rows = []
        for i in range(90):
            day_offset = random.randint(0, 30)
            hour = random.randint(8, 22)
            minute = random.randint(0, 59)
            created_at = now - timedelta(days=day_offset, hours=hour, minutes=minute)

            # Balanced enough to make a realistic three-class demo dashboard.
            roll = random.random()
            if roll < 0.56:
                sentiment = "POSITIVE"
                pool = POSITIVE_TEXTS
            elif roll < 0.78:
                sentiment = "NEUTRAL"
                pool = NEUTRAL_TEXTS
            else:
                sentiment = "NEGATIVE"
                pool = NEGATIVE_TEXTS
            text = random.choice(pool)
            confidence = round(random.uniform(82, 99.8), 2)

            rows.append(
                Analysis(
                    user_id=user.id,
                    text=text,
                    sentiment=sentiment,
                    confidence=confidence,
                    created_at=created_at,
                )
            )

        db.add_all(rows)
        db.commit()
        print(f"Added {len(rows)} demo analyses for {user.email}.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
