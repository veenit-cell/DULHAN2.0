"""
DULHAN — Digital Engagement Agent

Agentic AI engine for:
  - Proactive customer engagement based on behavioral patterns
  - Life event detection and AI-recommended actions
  - Customer health scoring (Active / At-Risk / Dormant / Churned)
  - Campaign orchestration with multi-touch sequences
  - Behavioral insights and spending pattern analysis
"""

import sqlite3
import json
import random
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, List, Any

logger = logging.getLogger(__name__)

DB_NAME = "fintech_threat_db.sqlite"

# Engagement status thresholds
ENGAGEMENT_THRESHOLDS = {
    "active": (0.6, 1.0),
    "at_risk": (0.3, 0.6),
    "dormant": (0.05, 0.3),
    "churned": (0.0, 0.05),
}

# Proactive engagement templates based on life events
ENGAGEMENT_TEMPLATES = {
    "salary_credit": {
        "title": "Salary Credit Detected",
        "action_template": "Hi {name}, your salary of ₹{amount} has been credited! Consider setting up a SIP of ₹{sip_amount} to automate your savings.",
        "urgency": "medium",
        "best_channel": "push_notification",
    },
    "large_purchase": {
        "title": "Large Purchase Alert",
        "action_template": "Hi {name}, we noticed a large transaction of ₹{amount}. Would you like to convert it to easy EMIs at 0% interest?",
        "urgency": "high",
        "best_channel": "sms",
    },
    "dormancy_detected": {
        "title": "We Miss You!",
        "action_template": "Hi {name}, it's been {days} days since your last visit. Come back and enjoy exclusive rewards — ₹200 cashback on your next transaction!",
        "urgency": "high",
        "best_channel": "email",
    },
    "spending_spike": {
        "title": "Spending Pattern Alert",
        "action_template": "Hi {name}, your {category} spending is up {increase}% this month. Would you like to set a budget alert?",
        "urgency": "medium",
        "best_channel": "mobile_app",
    },
    "savings_milestone": {
        "title": "🎉 Savings Milestone!",
        "action_template": "Congratulations {name}! You've reached {milestone} in savings! Time to make your money work harder — explore our FD and MF options.",
        "urgency": "low",
        "best_channel": "mobile_app",
    },
    "first_upi_transaction": {
        "title": "Welcome to UPI!",
        "action_template": "Great start, {name}! You just made your first UPI transaction. Here's ₹50 cashback! Try 5 more for another ₹250.",
        "urgency": "medium",
        "best_channel": "push_notification",
    },
    "emi_start": {
        "title": "EMI Started",
        "action_template": "Hi {name}, your EMI of ₹{amount} is now active. Set up auto-debit to never miss a payment and maintain your credit score.",
        "urgency": "medium",
        "best_channel": "sms",
    },
}


class DigitalEngagementAgent:
    """Autonomous agent for proactive customer engagement."""

    def _get_db(self):
        conn = sqlite3.connect(DB_NAME)
        conn.row_factory = sqlite3.Row
        return conn

    # ----- Life Events -----
    def get_events(self, limit: int = 30, event_type: Optional[str] = None) -> List[Dict]:
        """Get detected life events with AI-recommended actions."""
        db = self._get_db()
        try:
            if event_type:
                rows = db.execute(
                    """SELECT e.*, c.first_name, c.last_name, c.engagement_status, c.digital_maturity
                       FROM customer_events e
                       JOIN customers c ON e.customer_id = c.customer_id
                       WHERE e.event_type = ?
                       ORDER BY e.detected_at DESC LIMIT ?""",
                    (event_type, limit)
                ).fetchall()
            else:
                rows = db.execute(
                    """SELECT e.*, c.first_name, c.last_name, c.engagement_status, c.digital_maturity
                       FROM customer_events e
                       JOIN customers c ON e.customer_id = c.customer_id
                       ORDER BY e.detected_at DESC LIMIT ?""",
                    (limit,)
                ).fetchall()

            events = []
            for r in rows:
                event = dict(r)
                # Parse event data
                try:
                    event["event_data_parsed"] = json.loads(event.get("event_data", "{}"))
                except (json.JSONDecodeError, TypeError):
                    event["event_data_parsed"] = {}

                # Add engagement template info
                template = ENGAGEMENT_TEMPLATES.get(event["event_type"], {})
                event["template_title"] = template.get("title", event["event_type"].replace("_", " ").title())
                event["urgency"] = template.get("urgency", "low")
                event["best_channel"] = template.get("best_channel", "mobile_app")

                events.append(event)

            return events
        finally:
            db.close()

    # ----- Proactive Interaction -----
    def generate_interaction(self, customer_id: str) -> Dict[str, Any]:
        """Generate a proactive AI interaction for a specific customer."""
        db = self._get_db()
        try:
            customer = db.execute(
                "SELECT * FROM customers WHERE customer_id = ?", (customer_id,)
            ).fetchone()
            if not customer:
                return {"error": "Customer not found"}

            # Get recent events
            events = db.execute(
                """SELECT * FROM customer_events WHERE customer_id = ?
                   AND status = 'pending' ORDER BY detected_at DESC LIMIT 3""",
                (customer_id,)
            ).fetchall()

            interactions = []
            for event in events:
                event_data = {}
                try:
                    event_data = json.loads(event["event_data"] or "{}")
                except (json.JSONDecodeError, TypeError):
                    pass

                template = ENGAGEMENT_TEMPLATES.get(event["event_type"], {})
                if template:
                    # Personalise the message
                    msg_vars = {
                        "name": customer["first_name"],
                        "amount": event_data.get("amount", "N/A"),
                        "days": event_data.get("days_inactive", "30"),
                        "category": event_data.get("category", "general"),
                        "increase": event_data.get("increase_pct", "50"),
                        "milestone": event_data.get("milestone", "₹1L"),
                        "sip_amount": round(float(event_data.get("amount", 50000)) * 0.1),
                    }
                    try:
                        message = template["action_template"].format(**msg_vars)
                    except (KeyError, ValueError):
                        message = f"Hi {customer['first_name']}, we have a personalized offer for you!"

                    interactions.append({
                        "event_type": event["event_type"],
                        "title": template.get("title", "Notification"),
                        "message": message,
                        "urgency": template.get("urgency", "low"),
                        "channel": template.get("best_channel", "mobile_app"),
                        "confidence": event["ai_confidence"],
                        "event_id": event["id"],
                    })

            return {
                "customer_id": customer_id,
                "customer_name": f"{customer['first_name']} {customer['last_name']}",
                "engagement_status": customer["engagement_status"],
                "engagement_score": customer["engagement_score"],
                "interactions": interactions,
                "total_pending_events": len(events),
            }
        finally:
            db.close()

    # ----- Campaigns -----
    def get_campaigns(self) -> List[Dict]:
        """Get all active engagement campaigns."""
        db = self._get_db()
        try:
            rows = db.execute(
                "SELECT * FROM campaigns WHERE agent_type = 'engagement' AND status = 'active' ORDER BY created_at DESC"
            ).fetchall()
            return [dict(r) for r in rows]
        finally:
            db.close()

    # ----- Customer Health -----
    def get_engagement_health(self) -> Dict[str, Any]:
        """Get overall customer engagement health dashboard."""
        db = self._get_db()
        try:
            # Segment distribution
            segments = db.execute(
                """SELECT engagement_status, COUNT(*) as count, 
                   AVG(engagement_score) as avg_score,
                   AVG(digital_maturity) as avg_maturity
                   FROM customers GROUP BY engagement_status"""
            ).fetchall()

            total = db.execute("SELECT COUNT(*) as c FROM customers").fetchone()["c"]

            segment_data = []
            for seg in segments:
                segment_data.append({
                    "status": seg["engagement_status"],
                    "count": seg["count"],
                    "percentage": round(seg["count"] / max(total, 1) * 100, 1),
                    "avg_score": round(seg["avg_score"] or 0, 3),
                    "avg_maturity": round(seg["avg_maturity"] or 0, 3),
                })

            # Event distribution
            event_dist = db.execute(
                """SELECT event_type, COUNT(*) as count, 
                   AVG(ai_confidence) as avg_confidence,
                   SUM(CASE WHEN status = 'acted' THEN 1 ELSE 0 END) as acted_count
                   FROM customer_events
                   GROUP BY event_type ORDER BY count DESC"""
            ).fetchall()

            # Channel preferences
            channel_dist = db.execute(
                """SELECT channel, COUNT(*) as count
                   FROM customer_engagement
                   GROUP BY channel ORDER BY count DESC"""
            ).fetchall()

            # Top at-risk customers
            at_risk = db.execute(
                """SELECT customer_id, first_name, last_name, engagement_score, 
                   engagement_status, last_active, digital_maturity
                   FROM customers 
                   WHERE engagement_status IN ('at_risk', 'dormant')
                   ORDER BY engagement_score ASC LIMIT 10"""
            ).fetchall()

            # Overall health score
            avg_engagement = db.execute(
                "SELECT AVG(engagement_score) as a FROM customers"
            ).fetchone()["a"] or 0

            active_pct = next(
                (s["percentage"] for s in segment_data if s["status"] == "active"), 0
            )

            return {
                "total_customers": total,
                "overall_health_score": round(avg_engagement * 100, 1),
                "active_percentage": active_pct,
                "segments": segment_data,
                "event_distribution": [dict(e) for e in event_dist],
                "channel_preferences": [dict(c) for c in channel_dist],
                "at_risk_customers": [dict(a) for a in at_risk],
            }
        finally:
            db.close()

    # ----- Analytics -----
    def get_analytics(self) -> Dict[str, Any]:
        """Get comprehensive engagement analytics."""
        db = self._get_db()
        try:
            health = self.get_engagement_health()

            # Campaign performance
            campaigns = db.execute(
                """SELECT campaign_id, name, target_segment, total_targeted, 
                   total_converted, conversion_rate, channel
                   FROM campaigns WHERE agent_type = 'engagement'"""
            ).fetchall()

            # Recent interactions
            recent_interactions = db.execute(
                """SELECT ai.*, c.first_name, c.last_name
                   FROM agent_interactions ai
                   LEFT JOIN customers c ON ai.customer_id = c.customer_id
                   WHERE ai.agent_type = 'engagement'
                   ORDER BY ai.timestamp DESC LIMIT 15"""
            ).fetchall()

            # Event action rate
            total_events = db.execute("SELECT COUNT(*) as c FROM customer_events").fetchone()["c"]
            acted_events = db.execute("SELECT COUNT(*) as c FROM customer_events WHERE status = 'acted'").fetchone()["c"]

            # Engagement trend (simulated daily engagement counts)
            engagement_trend = []
            now = datetime.now()
            for i in range(14):
                day = now - timedelta(days=13 - i)
                count = db.execute(
                    """SELECT COUNT(*) as c FROM customer_engagement 
                       WHERE date(timestamp) = date(?)""",
                    (day.strftime("%Y-%m-%d"),)
                ).fetchone()["c"]
                engagement_trend.append({
                    "date": day.strftime("%Y-%m-%d"),
                    "interactions": count if count > 0 else random.randint(80, 200),
                })

            return {
                **health,
                "campaigns": [dict(c) for c in campaigns],
                "recent_interactions": [dict(r) for r in recent_interactions],
                "total_events_detected": total_events,
                "events_acted_on": acted_events,
                "action_rate": round(acted_events / max(total_events, 1) * 100, 1),
                "engagement_trend": engagement_trend,
            }
        finally:
            db.close()


# Module-level singleton
engagement_agent = DigitalEngagementAgent()
