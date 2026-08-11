"""
DULHAN — Digital Adoption Agent

Agentic AI engine for:
  - Personalised product recommendations based on customer profile
  - Contextual nudge generation (e.g., cash user → nudge UPI)
  - Adoption gap analysis per customer
  - Adaptive journey builder that sequences product introductions
"""

import sqlite3
import json
import random
import logging
from datetime import datetime, timezone
from typing import Optional, Dict, List, Any

logger = logging.getLogger(__name__)

DB_NAME = "fintech_threat_db.sqlite"

# Product dependency graph — some products are natural progressions
PRODUCT_JOURNEYS = {
    "savings": {"next": ["debit_card", "netbanking", "mobile_banking"], "prereqs": []},
    "debit_card": {"next": ["upi", "netbanking"], "prereqs": ["savings"]},
    "netbanking": {"next": ["mobile_banking", "auto_debit"], "prereqs": ["savings"]},
    "mobile_banking": {"next": ["upi", "mutual_fund", "insurance_life"], "prereqs": ["savings"]},
    "upi": {"next": ["auto_debit", "credit_card"], "prereqs": ["savings", "mobile_banking"]},
    "credit_card": {"next": ["auto_debit", "insurance_health"], "prereqs": ["savings"]},
    "fd": {"next": ["rd", "mutual_fund"], "prereqs": ["savings"]},
    "rd": {"next": ["mutual_fund"], "prereqs": ["savings"]},
    "mutual_fund": {"next": ["insurance_life"], "prereqs": ["savings"]},
    "insurance_life": {"next": ["insurance_health"], "prereqs": ["savings"]},
    "insurance_health": {"next": [], "prereqs": ["savings"]},
    "personal_loan": {"next": ["credit_card"], "prereqs": ["savings"]},
    "home_loan": {"next": ["insurance_life"], "prereqs": ["savings"]},
    "auto_debit": {"next": [], "prereqs": ["savings", "netbanking"]},
    "current": {"next": ["netbanking", "credit_card"], "prereqs": []},
}

# Contextual triggers — transaction patterns that suggest product needs
CONTEXTUAL_TRIGGERS = {
    "high_cash_withdrawals": {
        "suggest": ["upi", "mobile_banking"],
        "message": "We noticed you prefer cash transactions. Switch to UPI for instant, free transfers!",
        "confidence": 0.85,
    },
    "frequent_branch_visits": {
        "suggest": ["netbanking", "mobile_banking"],
        "message": "Save time — do everything from home with our Mobile Banking app.",
        "confidence": 0.82,
    },
    "idle_balance": {
        "suggest": ["fd", "mutual_fund", "rd"],
        "message": "Your savings are earning minimal interest. Consider an FD at 7.5% or start a SIP!",
        "confidence": 0.78,
    },
    "salary_credit_no_sip": {
        "suggest": ["mutual_fund"],
        "message": "Automate your wealth building — set up a SIP right after your salary credit date.",
        "confidence": 0.88,
    },
    "no_insurance": {
        "suggest": ["insurance_life", "insurance_health"],
        "message": "Protect what matters most. Get term insurance from just ₹15/day.",
        "confidence": 0.75,
    },
    "high_upi_usage": {
        "suggest": ["credit_card"],
        "message": "You love digital payments! Earn 2x rewards on every transaction with our Credit Card.",
        "confidence": 0.80,
    },
}

PRODUCT_INFO = {
    "savings": {"name": "Savings Account", "category": "accounts"},
    "current": {"name": "Current Account", "category": "accounts"},
    "fd": {"name": "Fixed Deposit", "category": "deposits"},
    "rd": {"name": "Recurring Deposit", "category": "deposits"},
    "upi": {"name": "UPI Payments", "category": "payments"},
    "netbanking": {"name": "Net Banking", "category": "payments"},
    "mobile_banking": {"name": "Mobile Banking App", "category": "payments"},
    "credit_card": {"name": "Credit Card", "category": "cards"},
    "debit_card": {"name": "Debit Card", "category": "cards"},
    "mutual_fund": {"name": "Mutual Funds (SIP)", "category": "investments"},
    "insurance_life": {"name": "Life Insurance", "category": "insurance"},
    "insurance_health": {"name": "Health Insurance", "category": "insurance"},
    "personal_loan": {"name": "Personal Loan", "category": "loans"},
    "home_loan": {"name": "Home Loan", "category": "loans"},
    "auto_debit": {"name": "Auto-Debit", "category": "payments"},
}


class DigitalAdoptionAgent:
    """Autonomous agent for driving digital product adoption."""

    def _get_db(self):
        conn = sqlite3.connect(DB_NAME)
        conn.row_factory = sqlite3.Row
        return conn

    # ----- Recommendations -----
    def get_recommendations(self, customer_id: str) -> Dict[str, Any]:
        """Generate personalized product recommendations for a customer."""
        db = self._get_db()
        try:
            # Get customer profile
            customer = db.execute(
                "SELECT * FROM customers WHERE customer_id = ?", (customer_id,)
            ).fetchone()
            if not customer:
                return {"error": "Customer not found"}

            # Get current products
            products = db.execute(
                "SELECT product_id FROM customer_products WHERE customer_id = ? AND is_active = 1",
                (customer_id,)
            ).fetchall()
            held_products = {p["product_id"] for p in products}

            # Identify gaps
            all_products = set(PRODUCT_INFO.keys())
            missing = all_products - held_products

            recommendations = []
            for prod_id in missing:
                score = self._score_recommendation(customer, prod_id, held_products)
                if score > 0.3:
                    journey = PRODUCT_JOURNEYS.get(prod_id, {})
                    prereqs_met = all(p in held_products for p in journey.get("prereqs", []))
                    
                    recommendations.append({
                        "product_id": prod_id,
                        "product_name": PRODUCT_INFO[prod_id]["name"],
                        "category": PRODUCT_INFO[prod_id]["category"],
                        "match_score": round(score * 100),
                        "reason": self._generate_reason(customer, prod_id),
                        "prereqs_met": prereqs_met,
                        "priority": "high" if score > 0.7 else "medium" if score > 0.5 else "low",
                    })

            recommendations.sort(key=lambda x: x["match_score"], reverse=True)

            return {
                "customer_id": customer_id,
                "customer_name": f"{customer['first_name']} {customer['last_name']}",
                "digital_maturity": customer["digital_maturity"],
                "products_held": len(held_products),
                "products_available": len(all_products),
                "adoption_rate": round(len(held_products) / len(all_products) * 100, 1),
                "recommendations": recommendations[:6],
            }
        finally:
            db.close()

    def _score_recommendation(self, customer, product_id: str, held: set) -> float:
        """AI scoring for product-customer match."""
        score = 0.3  # Base

        dm = customer["digital_maturity"]
        income = customer["annual_income"]
        age = customer["age"]

        prod = PRODUCT_INFO.get(product_id, {})
        cat = prod.get("category", "")

        # Digital maturity alignment
        if cat == "payments" and dm > 0.5:
            score += 0.25
        elif cat == "investments" and income > 500000:
            score += 0.2
        elif cat == "insurance" and age > 28:
            score += 0.15
        elif cat == "cards" and income > 300000:
            score += 0.15
        elif cat == "deposits" and income > 200000:
            score += 0.1

        # Journey readiness — products whose prereqs are met score higher
        journey = PRODUCT_JOURNEYS.get(product_id, {})
        prereqs = journey.get("prereqs", [])
        if prereqs and all(p in held for p in prereqs):
            score += 0.2

        # Natural next step bonus
        for held_prod in held:
            next_prods = PRODUCT_JOURNEYS.get(held_prod, {}).get("next", [])
            if product_id in next_prods:
                score += 0.15
                break

        return min(score, 1.0)

    def _generate_reason(self, customer, product_id: str) -> str:
        """Generate a human-readable recommendation reason."""
        reasons = {
            "upi": f"Based on your digital maturity score of {customer['digital_maturity']:.0%}, UPI would streamline your daily transactions",
            "mobile_banking": "Access your account, pay bills, and invest — all from your phone",
            "credit_card": f"With your income bracket of {customer['income_bracket']}, you qualify for our premium rewards card",
            "mutual_fund": "Start building long-term wealth with systematic investments starting ₹500/month",
            "fd": "Park your idle funds safely and earn up to 7.5% annual returns",
            "insurance_life": "Secure your family's financial future with affordable term coverage",
            "insurance_health": "Rising medical costs make health insurance essential — get covered from ₹500/month",
            "netbanking": "Complete banking control from your browser — transfers, statements, and more",
            "auto_debit": "Never miss a payment — automate your recurring bills and EMIs",
            "rd": "Build savings discipline with a recurring deposit — small amounts, big results",
            "debit_card": "Free ATM withdrawals and easy point-of-sale transactions",
            "personal_loan": "Quick personal loans at competitive rates for your immediate needs",
            "home_loan": "Turn your dream home into reality with affordable EMIs",
            "current": "Ideal for your business transactions with higher transaction limits",
        }
        return reasons.get(product_id, "This product would complement your existing banking portfolio")

    # ----- Nudges -----
    def get_active_nudges(self, limit: int = 20) -> List[Dict]:
        """Get active adoption nudges across customers."""
        db = self._get_db()
        try:
            rows = db.execute(
                """SELECT n.*, c.first_name, c.last_name, c.digital_maturity
                   FROM adoption_nudges n
                   JOIN customers c ON n.customer_id = c.customer_id
                   WHERE n.status IN ('pending', 'sent')
                   ORDER BY n.confidence DESC
                   LIMIT ?""",
                (limit,)
            ).fetchall()
            return [dict(r) for r in rows]
        finally:
            db.close()

    # ----- Journey Builder -----
    def get_adoption_journey(self, customer_id: str) -> Dict[str, Any]:
        """Build an adaptive product adoption journey for a customer."""
        db = self._get_db()
        try:
            customer = db.execute(
                "SELECT * FROM customers WHERE customer_id = ?", (customer_id,)
            ).fetchone()
            if not customer:
                return {"error": "Customer not found"}

            products = db.execute(
                "SELECT product_id, adoption_date, usage_frequency FROM customer_products WHERE customer_id = ? AND is_active = 1 ORDER BY adoption_date",
                (customer_id,)
            ).fetchall()

            held = {p["product_id"] for p in products}
            journey_steps = []

            # Step 1: What they have (completed steps)
            for p in products:
                journey_steps.append({
                    "product_id": p["product_id"],
                    "product_name": PRODUCT_INFO.get(p["product_id"], {}).get("name", p["product_id"]),
                    "status": "completed",
                    "adopted_on": p["adoption_date"],
                    "usage": p["usage_frequency"],
                })

            # Step 2: AI-recommended next steps
            next_candidates = set()
            for prod_id in held:
                next_prods = PRODUCT_JOURNEYS.get(prod_id, {}).get("next", [])
                for np in next_prods:
                    if np not in held:
                        next_candidates.add(np)

            for np_id in list(next_candidates)[:3]:
                journey_steps.append({
                    "product_id": np_id,
                    "product_name": PRODUCT_INFO.get(np_id, {}).get("name", np_id),
                    "status": "recommended",
                    "reason": self._generate_reason(customer, np_id),
                    "match_score": round(self._score_recommendation(customer, np_id, held) * 100),
                })

            return {
                "customer_id": customer_id,
                "customer_name": f"{customer['first_name']} {customer['last_name']}",
                "total_products": len(held),
                "adoption_maturity": round(len(held) / len(PRODUCT_INFO) * 100, 1),
                "journey": journey_steps,
            }
        finally:
            db.close()

    # ----- Analytics -----
    def get_analytics(self) -> Dict[str, Any]:
        """Get adoption analytics dashboard data."""
        db = self._get_db()
        try:
            # Overall adoption rates by product
            product_adoption = db.execute(
                """SELECT product_id, product_name, COUNT(*) as adopters
                   FROM customer_products WHERE is_active = 1
                   GROUP BY product_id ORDER BY adopters DESC"""
            ).fetchall()

            total_customers = db.execute("SELECT COUNT(*) as c FROM customers").fetchone()["c"]

            adoption_rates = []
            for p in product_adoption:
                adoption_rates.append({
                    "product_id": p["product_id"],
                    "product_name": p["product_name"],
                    "adopters": p["adopters"],
                    "adoption_rate": round(p["adopters"] / max(total_customers, 1) * 100, 1),
                })

            # Category breakdown
            category_stats = db.execute(
                """SELECT category, COUNT(DISTINCT customer_id) as users, COUNT(*) as total_products
                   FROM customer_products WHERE is_active = 1
                   GROUP BY category"""
            ).fetchall()

            # Digital maturity distribution
            maturity_dist = db.execute(
                """SELECT 
                     CASE 
                       WHEN digital_maturity >= 0.7 THEN 'high'
                       WHEN digital_maturity >= 0.4 THEN 'medium'
                       ELSE 'low'
                     END as segment,
                     COUNT(*) as count,
                     AVG(digital_maturity) as avg_maturity
                   FROM customers GROUP BY segment"""
            ).fetchall()

            # Nudge effectiveness
            nudge_stats = db.execute(
                """SELECT status, COUNT(*) as count FROM adoption_nudges GROUP BY status"""
            ).fetchall()

            # Active campaigns
            campaigns = db.execute(
                "SELECT * FROM campaigns WHERE agent_type = 'adoption' AND status = 'active'"
            ).fetchall()

            # Usage frequency distribution
            usage_dist = db.execute(
                """SELECT usage_frequency, COUNT(*) as count
                   FROM customer_products WHERE is_active = 1
                   GROUP BY usage_frequency"""
            ).fetchall()

            return {
                "total_customers": total_customers,
                "adoption_rates": adoption_rates,
                "category_stats": [dict(c) for c in category_stats],
                "maturity_distribution": [dict(m) for m in maturity_dist],
                "nudge_effectiveness": [dict(n) for n in nudge_stats],
                "active_campaigns": [dict(c) for c in campaigns],
                "usage_distribution": [dict(u) for u in usage_dist],
                "avg_products_per_customer": round(
                    db.execute("SELECT AVG(cnt) as a FROM (SELECT COUNT(*) as cnt FROM customer_products WHERE is_active=1 GROUP BY customer_id)").fetchone()["a"] or 0, 1
                ),
            }
        finally:
            db.close()


# Module-level singleton
adoption_agent = DigitalAdoptionAgent()
