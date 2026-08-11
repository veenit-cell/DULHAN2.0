"""
DULHAN — Customer Acquisition Agent

Agentic AI engine for:
  - Lead scoring and qualification
  - Conversational onboarding with state machine
  - Hyper-personalised product recommendations for prospects
  - Autonomous lead nurturing pipeline
"""

import sqlite3
import json
import uuid
import random
import logging
from datetime import datetime, timezone
from typing import Optional, Dict, List, Any

logger = logging.getLogger(__name__)

DB_NAME = "fintech_threat_db.sqlite"


# ---------------------------------------------------------------------------
#  Conversation State Machine
# ---------------------------------------------------------------------------
CONVERSATION_FLOW = {
    "GREETING": {
        "message": "Hello! I'm your AI banking assistant. I'll help you find the perfect banking products. May I know your name?",
        "next": "NAME_CAPTURE",
        "field": None,
    },
    "NAME_CAPTURE": {
        "message": "Nice to meet you, {name}! To recommend the best products, could you tell me your approximate annual income range?",
        "next": "INCOME_CAPTURE",
        "field": "name",
        "options": None,
    },
    "INCOME_CAPTURE": {
        "message": "Great. What's your primary occupation?",
        "next": "OCCUPATION_CAPTURE",
        "field": "income",
        "options": ["Under ₹3 Lakhs", "₹3-5 Lakhs", "₹5-10 Lakhs", "₹10-20 Lakhs", "₹20-50 Lakhs", "₹50 Lakhs+"],
    },
    "OCCUPATION_CAPTURE": {
        "message": "And which city are you based in?",
        "next": "CITY_CAPTURE",
        "field": "occupation",
    },
    "CITY_CAPTURE": {
        "message": "Thanks! One last question — are you currently using any digital banking services like UPI, Net Banking, or Mobile Banking?",
        "next": "DIGITAL_CHECK",
        "field": "city",
        "options": None,
    },
    "DIGITAL_CHECK": {
        "message": "Excellent! Based on your profile, I've prepared personalized recommendations. Let me analyze the best products for you...",
        "next": "RECOMMENDATION",
        "field": "digital_usage",
        "options": ["Yes, I use UPI and Mobile Banking", "Only Net Banking", "Only ATM/Branch", "None of these"],
    },
    "RECOMMENDATION": {
        "message": "Here are my top recommendations for you:\n\n{recommendations}\n\nWould you like to proceed with opening an account? I can start the KYC process right away!",
        "next": "KYC_PROMPT",
        "field": None,
    },
    "KYC_PROMPT": {
        "message": "I'll need a few documents for KYC verification:\n• Aadhaar Card\n• PAN Card\n• Address Proof\n\nYou can upload these through our secure portal. Shall I send you a link?",
        "next": "ONBOARDING_COMPLETE",
        "field": "kyc_consent",
        "options": ["Yes, send the link!", "I'll do it later", "I need more information"],
    },
    "ONBOARDING_COMPLETE": {
        "message": "🎉 Wonderful! Your application has been submitted. A relationship manager will contact you within 24 hours to complete the process. Welcome to the family!",
        "next": None,
        "field": None,
    },
}


class CustomerAcquisitionAgent:
    """Autonomous agent for customer acquisition and onboarding."""

    def __init__(self):
        self.sessions: Dict[str, Dict] = {}

    def _get_db(self):
        conn = sqlite3.connect(DB_NAME)
        conn.row_factory = sqlite3.Row
        return conn

    # ----- Session Management -----
    def start_session(self) -> Dict[str, Any]:
        """Start a new conversational onboarding session."""
        session_id = f"SES-{uuid.uuid4().hex[:8].upper()}"
        session = {
            "session_id": session_id,
            "step": "GREETING",
            "data": {},
            "started_at": datetime.now(timezone.utc).isoformat(),
            "lead_score": 0.0,
        }
        self.sessions[session_id] = session

        greeting = CONVERSATION_FLOW["GREETING"]
        self._log_interaction(session_id, None, "agent", greeting["message"], "GREETING")

        return {
            "session_id": session_id,
            "message": greeting["message"],
            "step": "GREETING",
            "options": greeting.get("options"),
            "progress": 0.125,
        }

    def chat(self, session_id: str, user_message: str) -> Dict[str, Any]:
        """Process user message and advance the conversation."""
        session = self.sessions.get(session_id)
        if not session:
            return {"error": "Session not found", "session_id": session_id}

        current_step = session["step"]
        flow = CONVERSATION_FLOW.get(current_step)

        if not flow:
            return {
                "session_id": session_id,
                "message": "This session has been completed. Thank you!",
                "step": "COMPLETED",
                "complete": True,
            }

        # Log user message
        self._log_interaction(session_id, None, "user", user_message, current_step)

        # Capture field data
        if flow.get("field"):
            session["data"][flow["field"]] = user_message

        # Advance to next step
        next_step = flow["next"]
        session["step"] = next_step

        if next_step is None:
            # Conversation complete — create lead
            lead = self._create_lead(session)
            return {
                "session_id": session_id,
                "message": CONVERSATION_FLOW["ONBOARDING_COMPLETE"]["message"],
                "step": "COMPLETED",
                "complete": True,
                "lead": lead,
            }

        next_flow = CONVERSATION_FLOW[next_step]
        
        # Generate response
        if next_step == "RECOMMENDATION":
            recommendations = self._generate_recommendations(session["data"])
            rec_text = "\n".join([f"  {i+1}. **{r['name']}** — {r['reason']} (Match: {r['score']}%)" for i, r in enumerate(recommendations)])
            message = next_flow["message"].format(recommendations=rec_text)
            session["data"]["recommendations"] = recommendations
        else:
            message = next_flow["message"].format(**session.get("data", {}))

        # Calculate progress
        steps = list(CONVERSATION_FLOW.keys())
        progress = round(steps.index(next_step) / len(steps), 2)

        # Update lead score progressively
        session["lead_score"] = self._calculate_lead_score(session["data"])

        self._log_interaction(session_id, None, "agent", message, next_step)

        return {
            "session_id": session_id,
            "message": message,
            "step": next_step,
            "options": next_flow.get("options"),
            "progress": progress,
            "lead_score": session["lead_score"],
        }

    # ----- Lead Scoring -----
    def _calculate_lead_score(self, data: Dict) -> float:
        """Score the lead based on captured data."""
        score = 0.2  # Base score for starting

        if data.get("name"):
            score += 0.1
        if data.get("income"):
            income = data["income"]
            if "50" in income or "20" in income:
                score += 0.2
            elif "10" in income or "5" in income:
                score += 0.15
            else:
                score += 0.1
        if data.get("occupation"):
            score += 0.1
        if data.get("city"):
            score += 0.1
        if data.get("digital_usage"):
            if "UPI" in data["digital_usage"]:
                score += 0.15
            elif "Net Banking" in data["digital_usage"]:
                score += 0.1
            else:
                score += 0.05
        if data.get("kyc_consent"):
            if "Yes" in data.get("kyc_consent", ""):
                score += 0.15
            else:
                score += 0.05

        return min(round(score, 2), 1.0)

    # ----- Product Recommendations -----
    def _generate_recommendations(self, data: Dict) -> List[Dict]:
        """AI-driven product recommendations based on prospect profile."""
        recs = []
        income = data.get("income", "")
        digital = data.get("digital_usage", "")
        occupation = data.get("occupation", "")

        # Always recommend savings
        recs.append({
            "id": "savings",
            "name": "Zero-Balance Savings Account",
            "reason": "Start your banking journey with zero maintenance charges",
            "score": 95,
        })

        # Digital products for digital-savvy users
        if "UPI" in digital or "Mobile" in digital:
            recs.append({
                "id": "mobile_banking",
                "name": "Mobile Banking App",
                "reason": "Full banking at your fingertips — transfers, bills, investments",
                "score": 92,
            })

        # Income-based recommendations
        if any(x in income for x in ["10", "20", "50"]):
            recs.append({
                "id": "credit_card",
                "name": "Premium Credit Card",
                "reason": "Earn rewards on every spend, complimentary lounge access",
                "score": 88,
            })
            recs.append({
                "id": "mutual_fund",
                "name": "Mutual Fund SIP",
                "reason": f"Grow your wealth systematically — start with ₹500/month",
                "score": 85,
            })

        if any(x in income for x in ["5", "10", "20", "50"]):
            recs.append({
                "id": "insurance_life",
                "name": "Term Life Insurance",
                "reason": "Protect your family with coverage up to ₹1 Crore",
                "score": 80,
            })

        # UPI for everyone
        if "UPI" not in digital:
            recs.append({
                "id": "upi",
                "name": "UPI Payments",
                "reason": "Instant money transfers, bill payments — all from your phone",
                "score": 90,
            })

        return recs[:5]

    # ----- Lead Creation -----
    def _create_lead(self, session: Dict) -> Dict:
        """Create a lead record from completed session."""
        data = session["data"]
        lead_id = f"LEAD-{uuid.uuid4().hex[:8].upper()}"
        score = self._calculate_lead_score(data)
        recs = data.get("recommendations", [])

        db = self._get_db()
        try:
            db.execute(
                """INSERT INTO acquisition_leads (lead_id, name, city, income_bracket, occupation,
                   lead_source, lead_score, stage, qualification_data, recommended_products,
                   created_at, updated_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (lead_id, data.get("name", "Unknown"), data.get("city", ""),
                 data.get("income", ""), data.get("occupation", ""),
                 "ai_chat", score, "qualified",
                 json.dumps(data), json.dumps([r["id"] for r in recs]),
                 datetime.now(timezone.utc).isoformat(),
                 datetime.now(timezone.utc).isoformat()),
            )
            db.commit()
        finally:
            db.close()

        return {
            "lead_id": lead_id,
            "name": data.get("name"),
            "score": score,
            "stage": "qualified",
            "recommended_products": [r["name"] for r in recs],
        }

    # ----- Interaction Logging -----
    def _log_interaction(self, session_id: str, customer_id: Optional[str],
                         direction: str, message: str, step: str):
        """Log agent interaction to the database."""
        db = self._get_db()
        try:
            db.execute(
                """INSERT INTO agent_interactions (session_id, customer_id, agent_type,
                   direction, message, step, timestamp)
                   VALUES (?, ?, ?, ?, ?, ?, ?)""",
                (session_id, customer_id, "acquisition", direction, message,
                 step, datetime.now(timezone.utc).isoformat()),
            )
            db.commit()
        except Exception as e:
            logger.error(f"Failed to log interaction: {e}")
        finally:
            db.close()

    # ----- Analytics -----
    def get_leads(self, stage: Optional[str] = None) -> List[Dict]:
        """Get all leads, optionally filtered by stage."""
        db = self._get_db()
        try:
            if stage:
                rows = db.execute(
                    "SELECT * FROM acquisition_leads WHERE stage = ? ORDER BY lead_score DESC", (stage,)
                ).fetchall()
            else:
                rows = db.execute(
                    "SELECT * FROM acquisition_leads ORDER BY lead_score DESC"
                ).fetchall()
            return [dict(r) for r in rows]
        finally:
            db.close()

    def get_pipeline_stats(self) -> Dict:
        """Get acquisition funnel statistics."""
        db = self._get_db()
        try:
            stages = ["new", "contacted", "qualified", "kyc_pending", "onboarded"]
            pipeline = {}
            for stage in stages:
                row = db.execute(
                    "SELECT COUNT(*) as count, AVG(lead_score) as avg_score FROM acquisition_leads WHERE stage = ?",
                    (stage,)
                ).fetchone()
                pipeline[stage] = {
                    "count": row["count"],
                    "avg_score": round(row["avg_score"] or 0, 2),
                }

            total = db.execute("SELECT COUNT(*) as c FROM acquisition_leads").fetchone()["c"]
            converted = db.execute("SELECT COUNT(*) as c FROM acquisition_leads WHERE stage = 'onboarded'").fetchone()["c"]

            return {
                "pipeline": pipeline,
                "total_leads": total,
                "total_converted": converted,
                "conversion_rate": round(converted / max(total, 1) * 100, 1),
                "avg_lead_score": round(
                    db.execute("SELECT AVG(lead_score) as a FROM acquisition_leads").fetchone()["a"] or 0, 2
                ),
            }
        finally:
            db.close()

    def get_analytics(self) -> Dict:
        """Get acquisition analytics dashboard data."""
        db = self._get_db()
        try:
            pipeline = self.get_pipeline_stats()

            # Source distribution
            sources = db.execute(
                "SELECT lead_source, COUNT(*) as count FROM acquisition_leads GROUP BY lead_source ORDER BY count DESC"
            ).fetchall()

            # Recent leads
            recent = db.execute(
                "SELECT lead_id, name, lead_score, stage, lead_source, created_at FROM acquisition_leads ORDER BY created_at DESC LIMIT 10"
            ).fetchall()

            # Campaigns
            campaigns = db.execute(
                "SELECT * FROM campaigns WHERE agent_type = 'acquisition' AND status = 'active'"
            ).fetchall()

            return {
                **pipeline,
                "source_distribution": [dict(s) for s in sources],
                "recent_leads": [dict(r) for r in recent],
                "active_campaigns": [dict(c) for c in campaigns],
            }
        finally:
            db.close()


# Module-level singleton
acquisition_agent = CustomerAcquisitionAgent()
