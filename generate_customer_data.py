"""
DULHAN — Synthetic Customer Data Generator for Agentic AI Pillars.

Generates 500+ realistic Indian banking customers with:
  - Demographics (name, age, income, location, digital maturity)
  - Product holdings (savings, FD, MF, insurance, credit card, UPI)
  - Transaction patterns (frequency, volume, channels)
  - Engagement history (app logins, feature usage)
  - Life events (salary credits, large purchases, dormancy)

Usage:
    python generate_customer_data.py
"""

import sqlite3
import random
import uuid
import json
from datetime import datetime, timedelta
from passlib.context import CryptContext

DB_NAME = "fintech_threat_db.sqlite"
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ---------------------------------------------------------------------------
#  Indian Banking Realistic Data Pools
# ---------------------------------------------------------------------------
FIRST_NAMES_M = [
    "Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Reyansh",
    "Ayaan", "Krishna", "Ishaan", "Shaurya", "Atharva", "Advik", "Pranav",
    "Advaith", "Aarush", "Kabir", "Ritvik", "Dhruv", "Yash", "Rohan",
    "Karthik", "Arnav", "Lakshya", "Manav", "Nikhil", "Rahul", "Vikram",
    "Suresh", "Rajesh", "Amit", "Pradeep", "Deepak", "Sandeep", "Harish",
]

FIRST_NAMES_F = [
    "Aanya", "Diya", "Saanvi", "Ananya", "Aadhya", "Isha", "Pari",
    "Anika", "Navya", "Myra", "Kiara", "Avni", "Sara", "Riya", "Priya",
    "Shreya", "Meera", "Pooja", "Nisha", "Kavya", "Tanvi", "Simran",
    "Neha", "Suhana", "Divya", "Bhavna", "Swati", "Anjali", "Rekha",
]

LAST_NAMES = [
    "Sharma", "Verma", "Gupta", "Singh", "Kumar", "Patel", "Reddy",
    "Nair", "Iyer", "Joshi", "Mehta", "Shah", "Rao", "Menon", "Pillai",
    "Deshmukh", "Kulkarni", "Chopra", "Malhotra", "Kapoor", "Agarwal",
    "Banerjee", "Chatterjee", "Mukherjee", "Das", "Bose", "Sen",
    "Tiwari", "Pandey", "Mishra", "Srivastava", "Saxena", "Chauhan",
]

CITIES = [
    ("Mumbai", "Maharashtra"), ("Delhi", "Delhi"), ("Bangalore", "Karnataka"),
    ("Hyderabad", "Telangana"), ("Chennai", "Tamil Nadu"), ("Kolkata", "West Bengal"),
    ("Pune", "Maharashtra"), ("Ahmedabad", "Gujarat"), ("Jaipur", "Rajasthan"),
    ("Lucknow", "Uttar Pradesh"), ("Chandigarh", "Punjab"), ("Bhopal", "Madhya Pradesh"),
    ("Indore", "Madhya Pradesh"), ("Nagpur", "Maharashtra"), ("Coimbatore", "Tamil Nadu"),
    ("Kochi", "Kerala"), ("Thiruvananthapuram", "Kerala"), ("Visakhapatnam", "Andhra Pradesh"),
    ("Surat", "Gujarat"), ("Vadodara", "Gujarat"), ("Patna", "Bihar"),
    ("Ranchi", "Jharkhand"), ("Guwahati", "Assam"), ("Dehradun", "Uttarakhand"),
]

OCCUPATIONS = [
    "Software Engineer", "Doctor", "Teacher", "Business Owner", "Government Employee",
    "Bank Employee", "Chartered Accountant", "Lawyer", "Architect", "Pharmacist",
    "Sales Executive", "Marketing Manager", "Freelancer", "Student", "Retired",
    "Homemaker", "Farmer", "Shop Owner", "Driver", "Consultant",
]

INCOME_BRACKETS = [
    ("0-3L", 0, 300000),
    ("3-5L", 300000, 500000),
    ("5-10L", 500000, 1000000),
    ("10-20L", 1000000, 2000000),
    ("20-50L", 2000000, 5000000),
    ("50L+", 5000000, 10000000),
]

BANKS = ["HDFC", "SBI", "ICICI", "AXIS", "KOTAK"]

PRODUCTS = [
    {"id": "savings", "name": "Savings Account", "category": "accounts", "digital_weight": 0.3},
    {"id": "current", "name": "Current Account", "category": "accounts", "digital_weight": 0.3},
    {"id": "fd", "name": "Fixed Deposit", "category": "deposits", "digital_weight": 0.5},
    {"id": "rd", "name": "Recurring Deposit", "category": "deposits", "digital_weight": 0.5},
    {"id": "upi", "name": "UPI Payments", "category": "payments", "digital_weight": 0.9},
    {"id": "netbanking", "name": "Net Banking", "category": "payments", "digital_weight": 0.7},
    {"id": "mobile_banking", "name": "Mobile Banking App", "category": "payments", "digital_weight": 0.95},
    {"id": "credit_card", "name": "Credit Card", "category": "cards", "digital_weight": 0.6},
    {"id": "debit_card", "name": "Debit Card", "category": "cards", "digital_weight": 0.4},
    {"id": "mutual_fund", "name": "Mutual Funds (SIP)", "category": "investments", "digital_weight": 0.8},
    {"id": "insurance_life", "name": "Life Insurance", "category": "insurance", "digital_weight": 0.5},
    {"id": "insurance_health", "name": "Health Insurance", "category": "insurance", "digital_weight": 0.5},
    {"id": "personal_loan", "name": "Personal Loan", "category": "loans", "digital_weight": 0.6},
    {"id": "home_loan", "name": "Home Loan", "category": "loans", "digital_weight": 0.4},
    {"id": "auto_debit", "name": "Auto-Debit/Standing Instructions", "category": "payments", "digital_weight": 0.7},
]

CHANNELS = ["branch", "atm", "mobile_app", "netbanking", "upi", "phone_banking", "whatsapp"]

LIFE_EVENT_TYPES = [
    "salary_credit", "large_purchase", "emi_start", "emi_end", "dormancy_detected",
    "spending_spike", "savings_milestone", "birthday_upcoming", "anniversary",
    "first_upi_transaction", "first_investment", "account_anniversary",
    "salary_increment_detected", "recurring_payment_new", "travel_spending",
]

ENGAGEMENT_ACTIONS = [
    "app_login", "balance_check", "fund_transfer", "bill_payment", "recharge",
    "statement_download", "fd_booking", "sip_setup", "loan_inquiry",
    "card_activation", "profile_update", "beneficiary_add", "upi_payment",
    "insurance_inquiry", "investment_view", "offer_clicked", "notification_read",
]


# ---------------------------------------------------------------------------
#  Table Creation
# ---------------------------------------------------------------------------
def create_agent_tables(cursor):
    """Create all tables needed for the Agentic AI pillars."""

    cursor.execute("DROP TABLE IF EXISTS customers")
    cursor.execute("DROP TABLE IF EXISTS customer_products")
    cursor.execute("DROP TABLE IF EXISTS customer_events")
    cursor.execute("DROP TABLE IF EXISTS customer_engagement")
    cursor.execute("DROP TABLE IF EXISTS agent_interactions")
    cursor.execute("DROP TABLE IF EXISTS campaigns")
    cursor.execute("DROP TABLE IF EXISTS campaign_targets")
    cursor.execute("DROP TABLE IF EXISTS acquisition_leads")
    cursor.execute("DROP TABLE IF EXISTS adoption_nudges")

    cursor.execute("""
        CREATE TABLE customers (
            customer_id TEXT PRIMARY KEY,
            first_name TEXT NOT NULL,
            last_name TEXT NOT NULL,
            age INTEGER NOT NULL,
            gender TEXT NOT NULL,
            city TEXT NOT NULL,
            state TEXT NOT NULL,
            occupation TEXT NOT NULL,
            income_bracket TEXT NOT NULL,
            annual_income REAL NOT NULL,
            bank_id TEXT NOT NULL,
            digital_maturity REAL NOT NULL,
            engagement_score REAL DEFAULT 0.5,
            engagement_status TEXT DEFAULT 'active',
            acquisition_stage TEXT DEFAULT 'onboarded',
            lead_score REAL DEFAULT 0.0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_active TIMESTAMP
        )
    """)

    cursor.execute("""
        CREATE TABLE customer_products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_id TEXT NOT NULL,
            product_id TEXT NOT NULL,
            product_name TEXT NOT NULL,
            category TEXT NOT NULL,
            is_active BOOLEAN DEFAULT 1,
            adoption_date TIMESTAMP,
            usage_frequency TEXT DEFAULT 'low',
            last_used TIMESTAMP,
            FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
        )
    """)

    cursor.execute("""
        CREATE TABLE customer_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_id TEXT NOT NULL,
            event_type TEXT NOT NULL,
            event_data TEXT,
            detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            ai_action TEXT,
            ai_confidence REAL DEFAULT 0.0,
            status TEXT DEFAULT 'pending',
            FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
        )
    """)

    cursor.execute("""
        CREATE TABLE customer_engagement (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_id TEXT NOT NULL,
            action TEXT NOT NULL,
            channel TEXT NOT NULL,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            session_duration_sec INTEGER DEFAULT 0,
            FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
        )
    """)

    cursor.execute("""
        CREATE TABLE agent_interactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT NOT NULL,
            customer_id TEXT,
            agent_type TEXT NOT NULL,
            direction TEXT NOT NULL,
            message TEXT NOT NULL,
            metadata TEXT,
            step TEXT,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    cursor.execute("""
        CREATE TABLE campaigns (
            campaign_id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            agent_type TEXT NOT NULL,
            target_segment TEXT NOT NULL,
            status TEXT DEFAULT 'active',
            message_template TEXT,
            channel TEXT DEFAULT 'mobile_app',
            total_targeted INTEGER DEFAULT 0,
            total_converted INTEGER DEFAULT 0,
            conversion_rate REAL DEFAULT 0.0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            expires_at TIMESTAMP
        )
    """)

    cursor.execute("""
        CREATE TABLE campaign_targets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            campaign_id TEXT NOT NULL,
            customer_id TEXT NOT NULL,
            status TEXT DEFAULT 'pending',
            interacted_at TIMESTAMP,
            converted BOOLEAN DEFAULT 0,
            FOREIGN KEY (campaign_id) REFERENCES campaigns(campaign_id),
            FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
        )
    """)

    cursor.execute("""
        CREATE TABLE acquisition_leads (
            lead_id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            phone TEXT,
            email TEXT,
            city TEXT,
            income_bracket TEXT,
            occupation TEXT,
            lead_source TEXT DEFAULT 'website',
            lead_score REAL DEFAULT 0.0,
            stage TEXT DEFAULT 'new',
            assigned_agent TEXT DEFAULT 'acquisition_bot',
            qualification_data TEXT,
            recommended_products TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP
        )
    """)

    cursor.execute("""
        CREATE TABLE adoption_nudges (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_id TEXT NOT NULL,
            product_id TEXT NOT NULL,
            product_name TEXT NOT NULL,
            nudge_type TEXT NOT NULL,
            message TEXT NOT NULL,
            confidence REAL DEFAULT 0.0,
            status TEXT DEFAULT 'pending',
            channel TEXT DEFAULT 'mobile_app',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            acted_at TIMESTAMP,
            FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
        )
    """)


# ---------------------------------------------------------------------------
#  Data Generation
# ---------------------------------------------------------------------------
def generate_customers(n=500):
    """Generate n synthetic Indian banking customers."""
    customers = []
    now = datetime.now()

    for i in range(n):
        gender = random.choice(["M", "F"])
        first = random.choice(FIRST_NAMES_M if gender == "M" else FIRST_NAMES_F)
        last = random.choice(LAST_NAMES)
        age = random.randint(18, 72)
        city, state = random.choice(CITIES)
        occupation = random.choice(OCCUPATIONS)

        # Income correlates loosely with age and occupation
        if age < 25:
            bracket_idx = random.choices(range(6), weights=[40, 30, 20, 8, 2, 0])[0]
        elif age < 35:
            bracket_idx = random.choices(range(6), weights=[10, 20, 35, 25, 8, 2])[0]
        elif age < 50:
            bracket_idx = random.choices(range(6), weights=[5, 10, 25, 30, 20, 10])[0]
        else:
            bracket_idx = random.choices(range(6), weights=[15, 20, 30, 20, 10, 5])[0]

        bracket = INCOME_BRACKETS[bracket_idx]
        income = random.uniform(bracket[1], bracket[2])

        # Digital maturity: younger = higher, metro = higher
        metro_bonus = 0.15 if city in ["Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai", "Pune"] else 0
        age_factor = max(0, 1 - (age - 18) / 60)
        digital_maturity = min(1.0, random.uniform(0.2, 0.5) + age_factor * 0.4 + metro_bonus)

        # Engagement status based on a weighted distribution
        eng_roll = random.random()
        if eng_roll < 0.55:
            eng_status = "active"
            eng_score = random.uniform(0.6, 1.0)
        elif eng_roll < 0.75:
            eng_status = "at_risk"
            eng_score = random.uniform(0.3, 0.6)
        elif eng_roll < 0.90:
            eng_status = "dormant"
            eng_score = random.uniform(0.05, 0.3)
        else:
            eng_status = "churned"
            eng_score = random.uniform(0.0, 0.1)

        days_ago = random.randint(0, 365 * 3)
        created = now - timedelta(days=days_ago)
        last_active_offset = random.randint(0, min(days_ago, 90 if eng_status == "active" else 365))
        last_active = now - timedelta(days=last_active_offset)

        customer_id = f"CUS-{uuid.uuid4().hex[:8].upper()}"

        customers.append({
            "customer_id": customer_id,
            "first_name": first,
            "last_name": last,
            "age": age,
            "gender": gender,
            "city": city,
            "state": state,
            "occupation": occupation,
            "income_bracket": bracket[0],
            "annual_income": round(income, 2),
            "bank_id": f"BNK-{random.choice(BANKS)}",
            "digital_maturity": round(digital_maturity, 3),
            "engagement_score": round(eng_score, 3),
            "engagement_status": eng_status,
            "created_at": created.isoformat(),
            "last_active": last_active.isoformat(),
        })

    return customers


def generate_products_for_customer(customer):
    """Assign products based on customer profile."""
    holdings = []
    dm = customer["digital_maturity"]
    income_idx = ["0-3L", "3-5L", "5-10L", "10-20L", "20-50L", "50L+"].index(customer["income_bracket"])

    # Everyone has savings
    holdings.append("savings")

    # Higher income → more products
    for prod in PRODUCTS:
        if prod["id"] == "savings":
            continue
        # Base probability from digital maturity and income
        prob = 0.1 + dm * 0.3 + income_idx * 0.05
        # Category adjustments
        if prod["category"] == "payments" and dm > 0.5:
            prob += 0.25
        if prod["category"] == "investments" and income_idx >= 3:
            prob += 0.2
        if prod["category"] == "insurance" and customer["age"] > 30:
            prob += 0.15
        if prod["category"] == "loans" and 25 < customer["age"] < 55:
            prob += 0.1

        if random.random() < min(prob, 0.85):
            holdings.append(prod["id"])

    return holdings


def generate_engagement_history(customer, days=90):
    """Generate recent engagement actions for a customer."""
    actions = []
    dm = customer["digital_maturity"]
    eng_score = customer["engagement_score"]
    now = datetime.now()

    # Number of actions scales with engagement
    num_actions = int(days * eng_score * dm * 1.5)
    num_actions = max(1, min(num_actions, 200))

    for _ in range(num_actions):
        action = random.choice(ENGAGEMENT_ACTIONS)
        # Channel correlates with digital maturity
        if dm > 0.7:
            channel = random.choices(CHANNELS, weights=[5, 5, 40, 15, 25, 5, 5])[0]
        elif dm > 0.4:
            channel = random.choices(CHANNELS, weights=[15, 10, 25, 20, 15, 10, 5])[0]
        else:
            channel = random.choices(CHANNELS, weights=[35, 20, 10, 10, 5, 15, 5])[0]

        ts = now - timedelta(
            days=random.randint(0, days),
            hours=random.randint(0, 23),
            minutes=random.randint(0, 59),
        )
        duration = random.randint(5, 600) if action != "notification_read" else random.randint(1, 10)

        actions.append({
            "customer_id": customer["customer_id"],
            "action": action,
            "channel": channel,
            "timestamp": ts.isoformat(),
            "session_duration_sec": duration,
        })

    return actions


def generate_life_events(customer, products):
    """Generate life events for a customer."""
    events = []
    now = datetime.now()
    cid = customer["customer_id"]

    # Salary credits (if employed)
    if customer["occupation"] not in ["Student", "Retired", "Homemaker"]:
        for month_ago in range(random.randint(1, 6)):
            ts = now - timedelta(days=month_ago * 30 + random.randint(0, 5))
            salary = customer["annual_income"] / 12
            events.append({
                "customer_id": cid,
                "event_type": "salary_credit",
                "event_data": json.dumps({"amount": round(salary, 2), "month": ts.strftime("%B %Y")}),
                "detected_at": ts.isoformat(),
                "ai_action": "Recommend SIP based on salary surplus",
                "ai_confidence": round(random.uniform(0.7, 0.95), 2),
                "status": random.choice(["pending", "acted", "dismissed"]),
            })

    # Large purchase detection
    if random.random() < 0.3:
        ts = now - timedelta(days=random.randint(1, 60))
        amount = random.uniform(50000, 500000)
        events.append({
            "customer_id": cid,
            "event_type": "large_purchase",
            "event_data": json.dumps({"amount": round(amount, 2), "merchant": random.choice(["Electronics Store", "Jeweler", "Auto Dealer", "Furniture Store"])}),
            "detected_at": ts.isoformat(),
            "ai_action": "Offer EMI conversion or personal loan",
            "ai_confidence": round(random.uniform(0.6, 0.9), 2),
            "status": "pending",
        })

    # Dormancy detection
    if customer["engagement_status"] in ["dormant", "churned"]:
        ts = now - timedelta(days=random.randint(5, 30))
        events.append({
            "customer_id": cid,
            "event_type": "dormancy_detected",
            "event_data": json.dumps({"days_inactive": random.randint(30, 180), "last_channel": random.choice(CHANNELS)}),
            "detected_at": ts.isoformat(),
            "ai_action": "Trigger re-engagement campaign with cashback offer",
            "ai_confidence": round(random.uniform(0.7, 0.9), 2),
            "status": "pending",
        })

    # First-time events
    if "upi" in products and random.random() < 0.2:
        ts = now - timedelta(days=random.randint(1, 30))
        events.append({
            "customer_id": cid,
            "event_type": "first_upi_transaction",
            "event_data": json.dumps({"amount": round(random.uniform(10, 5000), 2)}),
            "detected_at": ts.isoformat(),
            "ai_action": "Send UPI cashback offer and feature tutorial",
            "ai_confidence": 0.92,
            "status": "acted",
        })

    # Spending spike
    if random.random() < 0.15:
        ts = now - timedelta(days=random.randint(1, 20))
        events.append({
            "customer_id": cid,
            "event_type": "spending_spike",
            "event_data": json.dumps({"increase_pct": random.randint(40, 200), "category": random.choice(["dining", "travel", "shopping", "entertainment"])}),
            "detected_at": ts.isoformat(),
            "ai_action": "Alert customer and suggest budget tool",
            "ai_confidence": round(random.uniform(0.6, 0.85), 2),
            "status": "pending",
        })

    # Savings milestone
    if random.random() < 0.2:
        ts = now - timedelta(days=random.randint(1, 45))
        events.append({
            "customer_id": cid,
            "event_type": "savings_milestone",
            "event_data": json.dumps({"milestone": random.choice(["₹1L", "₹5L", "₹10L", "₹25L"]), "account_type": "savings"}),
            "detected_at": ts.isoformat(),
            "ai_action": "Congratulate and recommend FD or Mutual Fund",
            "ai_confidence": round(random.uniform(0.8, 0.95), 2),
            "status": random.choice(["pending", "acted"]),
        })

    return events


def generate_leads(n=50):
    """Generate acquisition leads (prospects not yet onboarded)."""
    leads = []
    now = datetime.now()
    stages = ["new", "new", "new", "contacted", "contacted", "qualified", "qualified", "kyc_pending", "onboarded"]
    sources = ["website", "referral", "social_media", "branch_walk_in", "phone_inquiry", "partner_api"]

    for _ in range(n):
        gender = random.choice(["M", "F"])
        first = random.choice(FIRST_NAMES_M if gender == "M" else FIRST_NAMES_F)
        last = random.choice(LAST_NAMES)
        city, _ = random.choice(CITIES)
        stage = random.choice(stages)

        # Lead score based on stage
        score_map = {"new": (0.1, 0.3), "contacted": (0.3, 0.5), "qualified": (0.5, 0.75), "kyc_pending": (0.75, 0.9), "onboarded": (0.9, 1.0)}
        lo, hi = score_map[stage]
        score = round(random.uniform(lo, hi), 2)

        # Recommended products
        recs = random.sample(["savings", "upi", "credit_card", "mutual_fund", "insurance_life", "mobile_banking", "fd"], k=random.randint(1, 3))

        leads.append({
            "lead_id": f"LEAD-{uuid.uuid4().hex[:8].upper()}",
            "name": f"{first} {last}",
            "phone": f"+91 {random.randint(70000, 99999)}{random.randint(10000, 99999)}",
            "email": f"{first.lower()}.{last.lower()}@{random.choice(['gmail.com', 'yahoo.in', 'outlook.com'])}",
            "city": city,
            "income_bracket": random.choice([b[0] for b in INCOME_BRACKETS]),
            "occupation": random.choice(OCCUPATIONS),
            "lead_source": random.choice(sources),
            "lead_score": score,
            "stage": stage,
            "qualification_data": json.dumps({"age": random.randint(21, 55), "existing_bank": random.choice(["Yes", "No"]), "digital_savvy": random.choice(["High", "Medium", "Low"])}),
            "recommended_products": json.dumps(recs),
            "created_at": (now - timedelta(days=random.randint(0, 30))).isoformat(),
            "updated_at": (now - timedelta(days=random.randint(0, 5))).isoformat(),
        })

    return leads


def generate_campaigns():
    """Generate pre-seeded AI campaigns."""
    now = datetime.now()
    return [
        {
            "campaign_id": "CAMP-ACQ-001",
            "name": "Digital-First Savings Account Drive",
            "agent_type": "acquisition",
            "target_segment": "young_professionals",
            "status": "active",
            "message_template": "Hi {name}! Open a zero-balance savings account with instant UPI activation. Get ₹500 cashback on your first transaction!",
            "channel": "mobile_app",
            "total_targeted": random.randint(150, 300),
            "total_converted": random.randint(30, 80),
            "created_at": (now - timedelta(days=15)).isoformat(),
            "expires_at": (now + timedelta(days=15)).isoformat(),
        },
        {
            "campaign_id": "CAMP-ADO-001",
            "name": "UPI Activation Nudge",
            "agent_type": "adoption",
            "target_segment": "non_upi_users",
            "status": "active",
            "message_template": "Hey {name}, switch to UPI and save time! Your first 5 UPI transactions earn ₹50 cashback each.",
            "channel": "push_notification",
            "total_targeted": random.randint(200, 500),
            "total_converted": random.randint(50, 150),
            "created_at": (now - timedelta(days=10)).isoformat(),
            "expires_at": (now + timedelta(days=20)).isoformat(),
        },
        {
            "campaign_id": "CAMP-ADO-002",
            "name": "SIP Starter Campaign",
            "agent_type": "adoption",
            "target_segment": "high_income_no_investment",
            "status": "active",
            "message_template": "Dear {name}, start your wealth journey! Begin a SIP with just ₹500/month. First 3 months management fee waived.",
            "channel": "email",
            "total_targeted": random.randint(100, 200),
            "total_converted": random.randint(15, 50),
            "created_at": (now - timedelta(days=20)).isoformat(),
            "expires_at": (now + timedelta(days=40)).isoformat(),
        },
        {
            "campaign_id": "CAMP-ENG-001",
            "name": "Dormant Customer Re-engagement",
            "agent_type": "engagement",
            "target_segment": "dormant_customers",
            "status": "active",
            "message_template": "We miss you, {name}! Come back and enjoy exclusive offers — 2% extra FD rate for returning customers.",
            "channel": "sms",
            "total_targeted": random.randint(80, 150),
            "total_converted": random.randint(10, 40),
            "created_at": (now - timedelta(days=7)).isoformat(),
            "expires_at": (now + timedelta(days=23)).isoformat(),
        },
        {
            "campaign_id": "CAMP-ENG-002",
            "name": "Life Event — Salary Increment Offer",
            "agent_type": "engagement",
            "target_segment": "salary_increment_detected",
            "status": "active",
            "message_template": "Congratulations on your raise, {name}! Time to grow your savings — upgrade to a Premium Savings Account with higher interest.",
            "channel": "mobile_app",
            "total_targeted": random.randint(50, 100),
            "total_converted": random.randint(10, 30),
            "created_at": (now - timedelta(days=5)).isoformat(),
            "expires_at": (now + timedelta(days=25)).isoformat(),
        },
    ]


def generate_nudges(customers, product_map):
    """Generate AI-driven adoption nudges for customers missing key products."""
    nudges = []
    now = datetime.now()

    nudge_templates = {
        "upi": ("Enable UPI for instant payments", "switch_to_digital", 0.88),
        "mobile_banking": ("Download our mobile app for banking on the go", "app_install", 0.85),
        "mutual_fund": ("Start building wealth with SIP — as low as ₹500/month", "investment_prompt", 0.72),
        "credit_card": ("Pre-approved credit card waiting for you!", "card_offer", 0.78),
        "insurance_life": ("Secure your family's future — term insurance from ₹15/day", "insurance_prompt", 0.68),
        "fd": ("Park your idle funds — earn up to 7.5% with FD", "deposit_prompt", 0.75),
        "auto_debit": ("Never miss a bill — set up auto-debit today", "automation_prompt", 0.70),
    }

    for c in customers:
        cid = c["customer_id"]
        held = product_map.get(cid, [])

        for prod_id, (msg, ntype, conf) in nudge_templates.items():
            if prod_id not in held and random.random() < 0.3:
                prod_info = next((p for p in PRODUCTS if p["id"] == prod_id), None)
                if not prod_info:
                    continue
                nudges.append({
                    "customer_id": cid,
                    "product_id": prod_id,
                    "product_name": prod_info["name"],
                    "nudge_type": ntype,
                    "message": msg,
                    "confidence": round(conf + random.uniform(-0.1, 0.1), 2),
                    "status": random.choices(["pending", "sent", "clicked", "converted", "dismissed"], weights=[40, 25, 15, 10, 10])[0],
                    "channel": random.choice(["mobile_app", "push_notification", "email", "sms"]),
                    "created_at": (now - timedelta(days=random.randint(0, 14))).isoformat(),
                })

    return nudges


# ---------------------------------------------------------------------------
#  Main Seeder
# ---------------------------------------------------------------------------
def seed_all():
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()

    print("Creating Agentic AI tables...")
    create_agent_tables(c)
    conn.commit()

    print("Generating 500 customers...")
    customers = generate_customers(500)
    for cust in customers:
        c.execute(
            """INSERT INTO customers (customer_id, first_name, last_name, age, gender, city, state,
               occupation, income_bracket, annual_income, bank_id, digital_maturity,
               engagement_score, engagement_status, created_at, last_active)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (cust["customer_id"], cust["first_name"], cust["last_name"], cust["age"],
             cust["gender"], cust["city"], cust["state"], cust["occupation"],
             cust["income_bracket"], cust["annual_income"], cust["bank_id"],
             cust["digital_maturity"], cust["engagement_score"], cust["engagement_status"],
             cust["created_at"], cust["last_active"]),
        )
    conn.commit()
    print(f"  ✓ {len(customers)} customers inserted")

    print("Generating product holdings...")
    product_map = {}
    total_products = 0
    for cust in customers:
        products = generate_products_for_customer(cust)
        product_map[cust["customer_id"]] = products
        now = datetime.now()
        for pid in products:
            prod_info = next((p for p in PRODUCTS if p["id"] == pid), None)
            if not prod_info:
                continue
            adoption_date = (now - timedelta(days=random.randint(1, 365))).isoformat()
            last_used = (now - timedelta(days=random.randint(0, 60))).isoformat()
            freq = random.choice(["daily", "weekly", "monthly", "rarely"])
            c.execute(
                """INSERT INTO customer_products (customer_id, product_id, product_name, category,
                   is_active, adoption_date, usage_frequency, last_used)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
                (cust["customer_id"], pid, prod_info["name"], prod_info["category"],
                 1, adoption_date, freq, last_used),
            )
            total_products += 1
    conn.commit()
    print(f"  ✓ {total_products} product holdings inserted")

    print("Generating engagement history...")
    total_eng = 0
    for cust in customers[:200]:  # Top 200 for performance
        actions = generate_engagement_history(cust, days=60)
        for act in actions:
            c.execute(
                """INSERT INTO customer_engagement (customer_id, action, channel, timestamp, session_duration_sec)
                   VALUES (?, ?, ?, ?, ?)""",
                (act["customer_id"], act["action"], act["channel"], act["timestamp"], act["session_duration_sec"]),
            )
            total_eng += 1
    conn.commit()
    print(f"  ✓ {total_eng} engagement actions inserted")

    print("Generating life events...")
    total_events = 0
    for cust in customers:
        events = generate_life_events(cust, product_map.get(cust["customer_id"], []))
        for ev in events:
            c.execute(
                """INSERT INTO customer_events (customer_id, event_type, event_data, detected_at,
                   ai_action, ai_confidence, status)
                   VALUES (?, ?, ?, ?, ?, ?, ?)""",
                (ev["customer_id"], ev["event_type"], ev["event_data"], ev["detected_at"],
                 ev["ai_action"], ev["ai_confidence"], ev["status"]),
            )
            total_events += 1
    conn.commit()
    print(f"  ✓ {total_events} life events inserted")

    print("Generating acquisition leads...")
    leads = generate_leads(50)
    for lead in leads:
        c.execute(
            """INSERT INTO acquisition_leads (lead_id, name, phone, email, city, income_bracket,
               occupation, lead_source, lead_score, stage, qualification_data, recommended_products,
               created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (lead["lead_id"], lead["name"], lead["phone"], lead["email"], lead["city"],
             lead["income_bracket"], lead["occupation"], lead["lead_source"], lead["lead_score"],
             lead["stage"], lead["qualification_data"], lead["recommended_products"],
             lead["created_at"], lead["updated_at"]),
        )
    conn.commit()
    print(f"  ✓ {len(leads)} acquisition leads inserted")

    print("Generating campaigns...")
    campaigns = generate_campaigns()
    for camp in campaigns:
        conv_rate = round(camp["total_converted"] / max(camp["total_targeted"], 1) * 100, 1)
        c.execute(
            """INSERT INTO campaigns (campaign_id, name, agent_type, target_segment, status,
               message_template, channel, total_targeted, total_converted, conversion_rate,
               created_at, expires_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (camp["campaign_id"], camp["name"], camp["agent_type"], camp["target_segment"],
             camp["status"], camp["message_template"], camp["channel"], camp["total_targeted"],
             camp["total_converted"], conv_rate, camp["created_at"], camp["expires_at"]),
        )
    conn.commit()
    print(f"  ✓ {len(campaigns)} campaigns inserted")

    print("Generating adoption nudges...")
    nudges = generate_nudges(customers, product_map)
    for nudge in nudges:
        c.execute(
            """INSERT INTO adoption_nudges (customer_id, product_id, product_name, nudge_type,
               message, confidence, status, channel, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (nudge["customer_id"], nudge["product_id"], nudge["product_name"], nudge["nudge_type"],
             nudge["message"], nudge["confidence"], nudge["status"], nudge["channel"],
             nudge["created_at"]),
        )
    conn.commit()
    print(f"  ✓ {len(nudges)} adoption nudges inserted")

    conn.close()
    print("\n✅ Agentic AI data seeding complete!")
    print(f"   Database: {DB_NAME}")
    print(f"   Customers: {len(customers)}")
    print(f"   Products: {total_products}")
    print(f"   Engagement Actions: {total_eng}")
    print(f"   Life Events: {total_events}")
    print(f"   Leads: {len(leads)}")
    print(f"   Campaigns: {len(campaigns)}")
    print(f"   Nudges: {len(nudges)}")


if __name__ == "__main__":
    seed_all()
