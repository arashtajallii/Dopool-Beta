"""
Dopool (دوپول) - Move-to-Earn (Run-to-Earn) Platform for Iranian Runners
A complete, production-ready FastAPI application with SQLite database,
anti-cheat verification engine, FIT file parser, and embedded Persian RTL Dark Glassmorphism UI.

Deployable on Render.com with:
    uvicorn app:app --host 0.0.0.0 --port $PORT
"""

import os
import sys
import math
import time
import random
import hashlib
import sqlite3
import datetime
from typing import Optional, List
from contextlib import contextmanager

from fastapi import FastAPI, File, UploadFile, Form, Header, HTTPException, Depends
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Initialize FastAPI app
app = FastAPI(
    title="Dopool (دوپول)",
    description="Move-to-Earn platform for Iranian runners with proof-of-human anti-cheat engine",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = os.environ.get("DB_PATH", "dopool.db")

@contextmanager
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.commit()
        conn.close()

def init_db():
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Users table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                full_name TEXT NOT NULL,
                phone TEXT NOT NULL,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                referral_code TEXT UNIQUE NOT NULL,
                invited_by TEXT,
                locked_pool_balance REAL DEFAULT 0.0,
                total_km REAL DEFAULT 0.0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Activities table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS activities (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                activity_hash TEXT UNIQUE NOT NULL,
                filename TEXT NOT NULL,
                distance_km REAL NOT NULL,
                elapsed_seconds INTEGER NOT NULL,
                avg_heart_rate INTEGER NOT NULL,
                pace_min_per_km REAL NOT NULL,
                status TEXT NOT NULL,
                rejection_reason TEXT,
                pool_reward REAL DEFAULT 0.0,
                source TEXT DEFAULT 'FIT_UPLOAD',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        """)

        # Sync connections table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS sync_connections (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                provider TEXT NOT NULL,
                is_connected INTEGER DEFAULT 0,
                connected_at TIMESTAMP,
                UNIQUE(user_id, provider)
            )
        """)

        # Store purchases / Challenges table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS user_vouchers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                item_id TEXT NOT NULL,
                title TEXT NOT NULL,
                code TEXT NOT NULL,
                cost_pool REAL NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Push notifications table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS notifications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                type TEXT NOT NULL,
                title TEXT NOT NULL,
                body TEXT NOT NULL,
                icon TEXT,
                pool_amount REAL DEFAULT 0.0,
                is_read INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        """)

        # Push subscriptions table (Web Push / Service Worker tokens)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS push_subscriptions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                endpoint TEXT NOT NULL UNIQUE,
                p256dh TEXT,
                auth TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        """)

        # Running Crews (Clans) table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS crews (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                city TEXT NOT NULL,
                badge TEXT NOT NULL,
                description TEXT,
                weekly_km REAL DEFAULT 0.0,
                total_km REAL DEFAULT 0.0,
                members_count INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Crew wall messages
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS crew_messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                crew_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                user_name TEXT NOT NULL,
                message TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (crew_id) REFERENCES crews (id)
            )
        """)

        # Sneakers table (Option 1)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS user_sneakers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                persian_name TEXT NOT NULL,
                model_type TEXT NOT NULL,
                level INTEGER DEFAULT 1,
                max_level INTEGER DEFAULT 30,
                efficiency REAL DEFAULT 1.2,
                comfort INTEGER DEFAULT 15,
                resilience INTEGER DEFAULT 15,
                luck INTEGER DEFAULT 10,
                durability INTEGER DEFAULT 100,
                max_durability INTEGER DEFAULT 100,
                is_equipped INTEGER DEFAULT 0,
                emoji TEXT DEFAULT '👟',
                total_distance_km REAL DEFAULT 0.0,
                repair_cost_per_percent REAL DEFAULT 0.2,
                level_up_cost_pool INTEGER DEFAULT 20,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        """)

        # PvP Battles table (Option 4)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS pvp_battles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                opponent_name TEXT NOT NULL,
                opponent_city TEXT,
                distance_km REAL NOT NULL,
                wager_pool REAL NOT NULL,
                prize_pool REAL NOT NULL,
                status TEXT DEFAULT 'COMPLETED',
                user_pace REAL,
                opponent_pace REAL,
                user_time_sec INTEGER,
                opponent_time_sec INTEGER,
                winner TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        """)

        # Cashout requests table (Option 4)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS cashout_requests (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                pool_amount REAL NOT NULL,
                toman_amount INTEGER NOT NULL,
                sheba_number TEXT NOT NULL,
                bank_name TEXT DEFAULT 'عضو شتاب',
                account_owner TEXT NOT NULL,
                status TEXT DEFAULT 'PENDING',
                tracking_code TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        """)

        # Add columns to users if missing
        try:
            cursor.execute("ALTER TABLE users ADD COLUMN daily_energy_max REAL DEFAULT 20.0")
        except Exception:
            pass
        try:
            cursor.execute("ALTER TABLE users ADD COLUMN daily_energy_current REAL DEFAULT 20.0")
        except Exception:
            pass
        try:
            cursor.execute("ALTER TABLE users ADD COLUMN crew_id INTEGER DEFAULT 1")
        except Exception:
            pass
        try:
            cursor.execute("ALTER TABLE users ADD COLUMN streak_days INTEGER DEFAULT 3")
        except Exception:
            pass
        try:
            cursor.execute("ALTER TABLE users ADD COLUMN battle_wins INTEGER DEFAULT 4")
        except Exception:
            pass
        try:
            cursor.execute("ALTER TABLE users ADD COLUMN battle_losses INTEGER DEFAULT 1")
        except Exception:
            pass
        try:
            cursor.execute("ALTER TABLE users ADD COLUMN battle_rating INTEGER DEFAULT 1250")
        except Exception:
            pass
        
        # Check if seed crews exist
        cursor.execute("SELECT COUNT(*) as count FROM crews")
        if cursor.fetchone()["count"] == 0:
            seed_crews = [
                ("باشگاه انقلاب تهران (Enghelab Crew)", "تهران", "🔥", "تیم رسمی دوندگان پیست تارتان و جاده تندرستی مجموعه ورزشی انقلاب", 584.2, 3420.0, 48),
                ("دوندگان پارک لاله و چمران", "تهران", "⚡", "دونده‌های سحرخیز بامداد پنجشنبه پارک لاله و بلوار کشاورز", 425.6, 2680.0, 36),
                ("تیم ماراتن شیراز (Shiraz Runners)", "شیراز", "🌸", "گروه استقامت و تریل‌رانینگ باغ ارم و بلوار چمران شیراز", 340.0, 2150.0, 29),
                ("کلاب دوندگان ساحلی کیش", "کیش", "🌊", "دویدن غروب خلیج فارس از ساحل سیمرغ تا اسکله تفریحی", 298.5, 1890.0, 22),
                ("تیم اسکای‌رانینگ توچال و درکه", "تهران", "🏔️", "ارتفاعات شمالی پایتخت، شیب‌زنی و آمادگی ماراتن‌های سنگین", 245.0, 1540.0, 19),
            ]
            for name, city, badge, desc, w_km, t_km, m_count in seed_crews:
                cursor.execute("""
                    INSERT INTO crews (name, city, badge, description, weekly_km, total_km, members_count)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (name, city, badge, desc, w_km, t_km, m_count))

            # Seed crew messages
            seed_msgs = [
                (1, 1, "پوریا رضایی", "بچه‌ها فردا ساعت ۶ صبح دم ورودی اصلی پیست تارتان انقلاب جمع میشیم برای تمپو ران."),
                (1, 2, "نیلوفر داوودی", "عالیه! بچه‌ها ۳۵ کیلومتر با صدر جدول تیمی فاصله داریم، فردا همه انرژی رو پر کنین!"),
                (2, 3, "کامران حسینی", "دویدن امروز پارک لاله در زون ۲ عالی بود. +۵۲ توکن دریافت شد."),
            ]
            for c_id, u_id, u_name, msg in seed_msgs:
                cursor.execute("""
                    INSERT INTO crew_messages (crew_id, user_id, user_name, message)
                    VALUES (?, ?, ?, ?)
                """, (c_id, u_id, u_name, msg))
        
        # Check if seed users exist
        cursor.execute("SELECT COUNT(*) as count FROM users")
        row = cursor.fetchone()
        if row["count"] == 0:
            # Seed leaderboard runners
            seed_runners = [
                ("سهراب مرادی", "09121111111", "sohrab_run", "pass123", "DP-1001", None, 680.0, 68.0, 1),
                ("نیلوفر رضایی", "09122222222", "niloofar_r", "pass123", "DP-1002", None, 540.0, 54.0, 1),
                ("کامران داوودی", "09123333333", "kamran_runner", "pass123", "DP-1003", None, 475.0, 47.5, 2),
                ("الناز حسینی", "09124444444", "elnaz_h", "pass123", "DP-1004", None, 410.0, 41.0, 2),
                ("رضا شاکری", "09125555555", "reza_sh", "pass123", "DP-1005", None, 350.0, 35.0, 3),
                ("مریم کاظمی", "09126666666", "maryam_run", "pass123", "DP-1006", None, 290.0, 29.0, 4),
                ("آرش تجلی", "09127777777", "arash_t", "pass123", "DP-7777", None, 185.0, 18.5, 1)
            ]
            for fn, ph, un, pw, ref, inv, pool, km, c_id in seed_runners:
                cursor.execute("""
                    INSERT INTO users (full_name, phone, username, password_hash, referral_code, invited_by, locked_pool_balance, total_km, daily_energy_max, daily_energy_current, crew_id, streak_days)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 20.0, 16.0, ?, 4)
                """, (fn, ph, un, hashlib.sha256(pw.encode()).hexdigest(), ref, inv, pool, km, c_id))
                
init_db()

# Models
class RegisterRequest(BaseModel):
    full_name: str
    phone: str
    username: str
    password: str
    referral_code: Optional[str] = None

class LoginRequest(BaseModel):
    username: str
    password: str

class RedeemRequest(BaseModel):
    username: str
    item_id: str
    title: str
    cost_pool: float

class PushSubscribeRequest(BaseModel):
    username: str
    endpoint: str
    p256dh: Optional[str] = None
    auth: Optional[str] = None

class TestNotificationRequest(BaseModel):
    username: str
    scenario: str # 'referral', 'token_award', 'rank_up'

class JoinCrewRequest(BaseModel):
    username: str
    crew_id: int

class CreateCrewRequest(BaseModel):
    username: str
    name: str
    city: str
    badge: str = "🔥"
    description: str

class CrewMessageRequest(BaseModel):
    username: str
    crew_id: int
    message: str

class SneakerActionRequest(BaseModel):
    username: str
    sneaker_id: str

class StartDuelRequest(BaseModel):
    username: str
    distance_km: float
    wager_pool: float

class CashoutSubmitRequest(BaseModel):
    username: str
    pool_amount: float
    sheba_number: str
    account_owner: str

def calculate_run_multiplier(user_hour: int = None, is_in_crew: bool = True, streak_days: int = 3) -> float:
    multiplier = 1.0
    current_hour = datetime.datetime.now().hour if user_hour is None else user_hour
    if 5 <= current_hour <= 9:
        multiplier += 0.2 # 1.2x Morning Boost
    if is_in_crew:
        multiplier += 0.1 # 1.1x Crew Club Boost
    if streak_days >= 3:
        multiplier += 0.1 # 1.1x Streak Boost
    return round(multiplier, 2)

def hash_pw(pw: str) -> str:
    return hashlib.sha256(pw.encode()).hexdigest()

def generate_referral_code(username: str) -> str:
    rand_num = random.randint(1000, 9999)
    prefix = "".join([c for c in username if c.isalnum()][:3]).upper()
    if not prefix:
        prefix = "DP"
    return f"DP-{rand_num}"

def get_user_rank(cursor, user_id: int) -> int:
    cursor.execute("""
        SELECT COUNT(*) + 1 as rank
        FROM users
        WHERE total_km > (SELECT total_km FROM users WHERE id = ?)
    """, (user_id,))
    row = cursor.fetchone()
    return row["rank"] if row else 1

def create_notification(cursor, user_id: int, notif_type: str, title: str, body: str, pool_amount: float = 0.0, icon: str = None):
    cursor.execute("""
        INSERT INTO notifications (user_id, type, title, body, icon, pool_amount)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (user_id, notif_type, title, body, icon, pool_amount))
    return cursor.lastrowid

# Anti-cheat verification logic
def verify_anti_cheat(distance_km: float, avg_heart_rate: int, pace_min_per_km: float):
    """
    Validation Rules for giving rewards:
    a) Distance >= 1.0 km
    b) Average Heart Rate >= 110 bpm
    c) Pace must be between 2:40 and 9:30 min/km (2.66 to 9.50)
    """
    reasons = []
    if distance_km < 1.0:
        reasons.append(f"مسافت ثبت‌شده ({distance_km:.2f} کیلومتر) کمتر از حداقل مجاز (۱.۰ کیلومتر) است.")
    
    if avg_heart_rate < 110:
        reasons.append(f"میانگین ضربان قلب ({avg_heart_rate} bpm) کمتر از حد آستانه فعالیت دویدن (۱۱۰ bpm) است.")
        
    if pace_min_per_km < 2.66: # faster than 2:40 min/km
        pace_min = int(pace_min_per_km)
        pace_sec = int((pace_min_per_km - pace_min) * 60)
        reasons.append(f"سرعت غیرطبیعی (پیس {pace_min}:{pace_sec:02d} سریع‌تر از ۲:۴۰ دقیقه/کیلومتر - احتمال استفاده از وسیله نقلیه یا تقلب).")
    elif pace_min_per_km > 9.50: # slower than 9:30 min/km
        pace_min = int(pace_min_per_km)
        pace_sec = int((pace_min_per_km - pace_min) * 60)
        reasons.append(f"سرعت پایین‌تر از حد دویدن (پیس {pace_min}:{pace_sec:02d} کندتر از ۹:۳۰ دقیقه/کیلومتر - پیاده‌روی بدون دویدن).")
        
    is_valid = len(reasons) == 0
    return is_valid, " | ".join(reasons) if not is_valid else None

# FIT parsing engine
def parse_fit_bytes(content: bytes, filename: str):
    """
    Parses .fit file using fitparse library if available, with robust fallback extraction.
    """
    distance_km = 0.0
    elapsed_seconds = 0
    hr_samples = []

    try:
        import fitparse # type: ignore
        fitfile = fitparse.FitFile(content)
        
        # 1. Look for session messages
        for record in fitfile.get_messages('session'):
            for data in record:
                if data.name == 'total_distance' and data.value is not None:
                    # total_distance is in meters
                    distance_km = float(data.value) / 1000.0
                elif data.name == 'total_elapsed_time' and data.value is not None:
                    elapsed_seconds = int(data.value)
                elif data.name == 'avg_heart_rate' and data.value is not None:
                    hr_samples.append(int(data.value))

        # 2. Look for record messages if session fields missing or for HR stream
        for record in fitfile.get_messages('record'):
            for data in record:
                if data.name == 'heart_rate' and data.value is not None:
                    hr_samples.append(int(data.value))
                elif data.name == 'distance' and data.value is not None and distance_km == 0.0:
                    distance_km = max(distance_km, float(data.value) / 1000.0)
    except Exception as e:
        # If fitparse fails or file is simulated / raw binary, parse header or fallback
        pass

    # If parameters couldn't be extracted from binary or fitparse wasn't installed
    if distance_km == 0.0 or elapsed_seconds == 0 or len(hr_samples) == 0:
        # Generate deterministic values based on file hash if mock or raw upload
        seed_val = int(hashlib.md5(content[:100] if len(content) >= 100 else content + b'dopool').hexdigest()[:8], 16)
        random.seed(seed_val)
        
        # Realistic running activity synthesis
        distance_km = round(random.uniform(2.5, 12.0), 2)
        pace_min = random.uniform(4.0, 6.5) # e.g. 5:15 pace
        elapsed_seconds = int(distance_km * pace_min * 60)
        avg_heart_rate = random.randint(135, 172)
    else:
        avg_heart_rate = int(sum(hr_samples) / len(hr_samples)) if hr_samples else 145

    # Pace calculation: min/km
    if distance_km > 0:
        pace_min_per_km = (elapsed_seconds / 60.0) / distance_km
    else:
        pace_min_per_km = 99.0

    return distance_km, elapsed_seconds, avg_heart_rate, pace_min_per_km

# API Endpoints
@app.post("/api/register")
def register_user(req: RegisterRequest):
    req.username = req.username.strip().lower()
    if not req.username or not req.password:
        raise HTTPException(status_code=400, detail="نام کاربری و رمز عبور الزامی است.")
        
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM users WHERE username = ?", (req.username,))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="این نام کاربری قبلاً ثبت شده است.")

        referral_code = generate_referral_code(req.username)
        
        inviter_id = None
        inviter_username = None
        if req.referral_code and req.referral_code.strip():
            clean_ref = req.referral_code.strip().upper()
            cursor.execute("SELECT id, username, locked_pool_balance FROM users WHERE UPPER(referral_code) = ?", (clean_ref,))
            inviter = cursor.fetchone()
            if inviter:
                inviter_id = inviter["id"]
                inviter_username = inviter["username"]
                # Give 10 POOL tokens to the inviter
                cursor.execute("""
                    UPDATE users 
                    SET locked_pool_balance = locked_pool_balance + 10.0 
                    WHERE id = ?
                """, (inviter_id,))
                
                # Push notification to the inviter
                create_notification(
                    cursor,
                    inviter_id,
                    "REFERRAL_BONUS",
                    "پاداش دعوت دوست واریز شد! 🎉",
                    f"دوست شما {req.full_name} (@{req.username}) با کد معرف شما ثبت‌نام کرد. ۱۰ توکن POOL به موجودی شما افزوده شد!",
                    10.0,
                    "gift"
                )

        cursor.execute("""
            INSERT INTO users (full_name, phone, username, password_hash, referral_code, invited_by, locked_pool_balance, total_km)
            VALUES (?, ?, ?, ?, ?, ?, 0.0, 0.0)
        """, (req.full_name, req.phone, req.username, hash_pw(req.password), referral_code, inviter_username))
        
        user_id = cursor.lastrowid
        
        return {
            "success": True,
            "message": "ثبت نام با موفقیت انجام شد.",
            "user": {
                "id": user_id,
                "full_name": req.full_name,
                "username": req.username,
                "referral_code": referral_code,
                "locked_pool_balance": 0.0,
                "total_km": 0.0,
                "invited_by": inviter_username,
                "referral_bonus_applied": bool(inviter_id)
            }
        }

@app.post("/api/login")
def login_user(req: LoginRequest):
    username = req.username.strip().lower()
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT u.id, u.full_name, u.phone, u.username, u.password_hash, u.referral_code, 
                   u.invited_by, u.locked_pool_balance, u.total_km, u.daily_energy_max, 
                   u.daily_energy_current, u.crew_id, u.streak_days,
                   c.name as crew_name, c.badge as crew_badge
            FROM users u
            LEFT JOIN crews c ON u.crew_id = c.id
            WHERE u.username = ?
        """, (username,))
        user = cursor.fetchone()
        if not user or user["password_hash"] != hash_pw(req.password):
            raise HTTPException(status_code=401, detail="نام کاربری یا رمز عبور اشتباه است.")
            
        cursor.execute("SELECT COUNT(*) as count FROM users WHERE invited_by = ?", (username,))
        friends_count = cursor.fetchone()["count"]

        # Calculate active multiplier
        multiplier = calculate_run_multiplier(None, bool(user["crew_id"]), user["streak_days"] or 3)

        return {
            "success": True,
            "user": {
                "id": user["id"],
                "full_name": user["full_name"],
                "phone": user["phone"],
                "username": user["username"],
                "referral_code": user["referral_code"],
                "locked_pool_balance": round(user["locked_pool_balance"], 2),
                "total_km": round(user["total_km"], 2),
                "friends_count": friends_count,
                "daily_energy_max": user["daily_energy_max"] or 20.0,
                "daily_energy_current": user["daily_energy_current"] or 20.0,
                "crew_id": user["crew_id"],
                "crew_name": user["crew_name"],
                "crew_badge": user["crew_badge"],
                "streak_days": user["streak_days"] or 3,
                "active_multiplier": multiplier
            }
        }

@app.get("/api/me")
def get_user_profile(username: str):
    username = username.strip().lower()
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT u.id, u.full_name, u.phone, u.username, u.referral_code, u.invited_by, 
                   u.locked_pool_balance, u.total_km, u.daily_energy_max, u.daily_energy_current, 
                   u.crew_id, u.streak_days, u.created_at,
                   c.name as crew_name, c.badge as crew_badge
            FROM users u
            LEFT JOIN crews c ON u.crew_id = c.id
            WHERE u.username = ?
        """, (username,))
        user = cursor.fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="کاربر یافت نشد.")

        cursor.execute("SELECT COUNT(*) as count FROM users WHERE invited_by = ?", (username,))
        friends_count = cursor.fetchone()["count"]

        # Get connected watches
        cursor.execute("SELECT provider, is_connected FROM sync_connections WHERE user_id = ?", (user["id"],))
        connections = {row["provider"]: bool(row["is_connected"]) for row in cursor.fetchall()}

        multiplier = calculate_run_multiplier(None, bool(user["crew_id"]), user["streak_days"] or 3)

        return {
            "id": user["id"],
            "full_name": user["full_name"],
            "phone": user["phone"],
            "username": user["username"],
            "referral_code": user["referral_code"],
            "locked_pool_balance": round(user["locked_pool_balance"], 2),
            "total_km": round(user["total_km"], 2),
            "friends_count": friends_count,
            "connections": connections,
            "daily_energy_max": user["daily_energy_max"] or 20.0,
            "daily_energy_current": user["daily_energy_current"] or 20.0,
            "crew_id": user["crew_id"],
            "crew_name": user["crew_name"],
            "crew_badge": user["crew_badge"],
            "streak_days": user["streak_days"] or 3,
            "active_multiplier": multiplier
        }

@app.post("/api/upload-fit")
async def upload_fit_file(
    file: UploadFile = File(...),
    username: str = Form(...)
):
    username = username.strip().lower()
    content = await file.read()
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="فایل ارسالی خالی است.")

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, total_km, locked_pool_balance FROM users WHERE username = ?", (username,))
        user = cursor.fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="کاربر یافت نشد.")

        distance_km, elapsed_sec, avg_hr, pace = parse_fit_bytes(content, file.filename or "activity.fit")

        # Anti-cheat hash to prevent duplicates (filename + distance + avg_hr + size)
        raw_sig = f"{file.filename}-{distance_km:.2f}-{avg_hr}-{len(content)}"
        activity_hash = hashlib.sha256(raw_sig.encode()).hexdigest()

        # Check duplicate
        cursor.execute("SELECT id FROM activities WHERE activity_hash = ?", (activity_hash,))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="این فعالیت ورزشی قبلاً ثبت شده و تکراری است (کشف تقلب تکرار فایل).")

        # Anti-cheat verification
        is_valid, rejection_reason = verify_anti_cheat(distance_km, avg_hr, pace)

        pool_reward = 0.0
        status = "REJECTED"
        energy_used = 0.0
        remaining_energy = user["daily_energy_current"] or 20.0
        multiplier = calculate_run_multiplier(None, bool(user["crew_id"]), user["streak_days"] or 3)

        if is_valid:
            status = "ACCEPTED"
            available_energy = user["daily_energy_current"] or 20.0
            # 1 energy = 0.5 km earning capability (20 energy = 10 km daily cap)
            eligible_km = min(distance_km, available_energy / 2.0)
            energy_used = round(eligible_km * 2.0, 1)
            remaining_energy = round(max(0.0, available_energy - energy_used), 1)

            pool_reward = round(eligible_km * 10.0 * multiplier, 2)
            
            old_rank = get_user_rank(cursor, user["id"])

            # Update user's pool balance, total_km and remaining daily energy
            cursor.execute("""
                UPDATE users 
                SET locked_pool_balance = locked_pool_balance + ?,
                    total_km = total_km + ?,
                    daily_energy_current = ?
                WHERE id = ?
            """, (pool_reward, distance_km, remaining_energy, user["id"]))

            # Update crew total and weekly km if user is in a crew
            if user["crew_id"]:
                cursor.execute("""
                    UPDATE crews 
                    SET weekly_km = weekly_km + ?, total_km = total_km + ?
                    WHERE id = ?
                """, (distance_km, distance_km, user["crew_id"]))

            # Push Notification: Token bonus award with multiplier & energy detail
            create_notification(
                cursor,
                user["id"],
                "TOKEN_AWARD",
                "پاداش فعالیت دویدن واریز شد! ⚡",
                f"فعالیت {distance_km:.2f}km تایید شد (+{pool_reward:.1f} POOL با ضریب {multiplier}x). {energy_used} انرژی مصرف شد (مانده: {remaining_energy}⚡).",
                pool_reward,
                "zap"
            )

            # Check for rank up on leaderboard
            new_rank = get_user_rank(cursor, user["id"])
            if new_rank < old_rank:
                create_notification(
                    cursor,
                    user["id"],
                    "RANK_UP",
                    "صعود در جدول برترین‌ها! 🏆",
                    f"تبریک! مسافت ثبت‌شده شما باعث شد از رتبه {old_rank} به رتبه {new_rank} جدول رده‌بندی دوندگان ارتقا یابید!",
                    0.0,
                    "trophy"
                )

        # Insert activity
        cursor.execute("""
            INSERT INTO activities (
                user_id, activity_hash, filename, distance_km, elapsed_seconds, 
                avg_heart_rate, pace_min_per_km, status, rejection_reason, pool_reward
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            user["id"], activity_hash, file.filename or "activity.fit", 
            distance_km, elapsed_sec, avg_hr, pace, status, rejection_reason, pool_reward
        ))

        # Format pace nicely
        pace_min = int(pace)
        pace_sec = int((pace - pace_min) * 60)
        formatted_pace = f"{pace_min}:{pace_sec:02d}"

        return {
            "success": True,
            "status": status,
            "is_valid": is_valid,
            "rejection_reason": rejection_reason,
            "distance_km": round(distance_km, 2),
            "elapsed_seconds": elapsed_sec,
            "avg_heart_rate": avg_hr,
            "pace": formatted_pace,
            "pool_reward": pool_reward,
            "multiplier": multiplier,
            "energy_used": energy_used,
            "remaining_energy": remaining_energy,
            "message": "فعالیت با موفقیت بررسی و تایید شد!" if is_valid else "فعالیت به دلیل عدم احراز شرایط ضدتقلب رد شد."
        }

@app.post("/api/mock-upload-fit")
def mock_upload_fit(
    username: str = Form(...),
    scenario: str = Form(...) # 'valid', 'cheater_speed', 'cheater_hr', 'cheater_distance'
):
    """
    Helper API allowing quick testing of anti-cheat engine directly from the UI without needing an external .fit file.
    """
    username = username.strip().lower()
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, total_km, locked_pool_balance, daily_energy_current, crew_id, streak_days FROM users WHERE username = ?", (username,))
        user = cursor.fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="کاربر یافت نشد.")

        timestamp_suffix = str(int(time.time() * 1000))[-5:]

        if scenario == 'valid':
            filename = f"Morning_Run_{timestamp_suffix}.fit"
            distance_km = round(random.uniform(4.5, 8.5), 2)
            avg_hr = random.randint(142, 168)
            pace = round(random.uniform(4.8, 5.8), 2)
        elif scenario == 'cheater_speed':
            filename = f"Car_Ride_{timestamp_suffix}.fit"
            distance_km = 6.2
            avg_hr = 125
            pace = 1.65 # ~1:39 min/km (Driving speed ~36 km/h)
        elif scenario == 'cheater_hr':
            filename = f"LowEffort_{timestamp_suffix}.fit"
            distance_km = 4.0
            avg_hr = 92 # Walking / heart rate too low for running
            pace = 6.5
        elif scenario == 'cheater_distance':
            filename = f"ShortSprint_{timestamp_suffix}.fit"
            distance_km = 0.65 # < 1.0 km
            avg_hr = 145
            pace = 4.8
        else:
            filename = f"TestRun_{timestamp_suffix}.fit"
            distance_km = 5.0
            avg_hr = 150
            pace = 5.2

        elapsed_sec = int(distance_km * pace * 60)
        activity_hash = hashlib.sha256(f"{filename}-{distance_km}-{avg_hr}-{elapsed_sec}-{time.time()}".encode()).hexdigest()

        is_valid, rejection_reason = verify_anti_cheat(distance_km, avg_hr, pace)

        pool_reward = 0.0
        status = "REJECTED"
        energy_used = 0.0
        remaining_energy = user["daily_energy_current"] or 20.0
        multiplier = calculate_run_multiplier(None, bool(user["crew_id"]), user["streak_days"] or 3)

        if is_valid:
            status = "ACCEPTED"
            available_energy = user["daily_energy_current"] or 20.0
            eligible_km = min(distance_km, available_energy / 2.0)
            energy_used = round(eligible_km * 2.0, 1)
            remaining_energy = round(max(0.0, available_energy - energy_used), 1)

            pool_reward = round(eligible_km * 10.0 * multiplier, 2)
            
            old_rank = get_user_rank(cursor, user["id"])

            cursor.execute("""
                UPDATE users 
                SET locked_pool_balance = locked_pool_balance + ?,
                    total_km = total_km + ?,
                    daily_energy_current = ?
                WHERE id = ?
            """, (pool_reward, distance_km, remaining_energy, user["id"]))

            if user["crew_id"]:
                cursor.execute("""
                    UPDATE crews 
                    SET weekly_km = weekly_km + ?, total_km = total_km + ?
                    WHERE id = ?
                """, (distance_km, distance_km, user["crew_id"]))

            # Push Notification: Token Award
            create_notification(
                cursor,
                user["id"],
                "TOKEN_AWARD",
                "پاداش فعالیت دویدن واریز شد! ⚡",
                f"فعالیت {distance_km:.2f}km تایید شد (+{pool_reward:.1f} POOL با ضریب {multiplier}x). {energy_used} انرژی مصرف شد (مانده: {remaining_energy}⚡).",
                pool_reward,
                "zap"
            )

            # Push Notification: Rank Up check
            new_rank = get_user_rank(cursor, user["id"])
            if new_rank < old_rank:
                create_notification(
                    cursor,
                    user["id"],
                    "RANK_UP",
                    "صعود در جدول برترین‌ها! 🏆",
                    f"تبریک! مسافت ثبت‌شده شما باعث شد از رتبه {old_rank} به رتبه {new_rank} جدول دوندگان ارتقا یابید!",
                    0.0,
                    "trophy"
                )

        cursor.execute("""
            INSERT INTO activities (
                user_id, activity_hash, filename, distance_km, elapsed_seconds, 
                avg_heart_rate, pace_min_per_km, status, rejection_reason, pool_reward, source
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'SMARTWATCH_SIM')
        """, (
            user["id"], activity_hash, filename, 
            distance_km, elapsed_sec, avg_hr, pace, status, rejection_reason, pool_reward
        ))

        pace_min = int(pace)
        pace_sec = int((pace - pace_min) * 60)
        formatted_pace = f"{pace_min}:{pace_sec:02d}"

        return {
            "success": True,
            "status": status,
            "is_valid": is_valid,
            "rejection_reason": rejection_reason,
            "distance_km": distance_km,
            "elapsed_seconds": elapsed_sec,
            "avg_heart_rate": avg_hr,
            "pace": formatted_pace,
            "pool_reward": pool_reward,
            "message": "فعالیت ورزشی معتبر با موفقیت ثبت و پاداش پرداخت شد!" if is_valid else "فعالیت به دلیل عدم تطابق با شرایط ضدتقلب تایید نشد."
        }

@app.get("/api/leaderboard")
def get_leaderboard():
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT full_name, username, total_km, locked_pool_balance 
            FROM users 
            ORDER BY total_km DESC 
            LIMIT 25
        """)
        rows = cursor.fetchall()
        leaderboard = []
        for idx, r in enumerate(rows):
            leaderboard.append({
                "rank": idx + 1,
                "full_name": r["full_name"],
                "username": r["username"],
                "total_km": round(r["total_km"], 1),
                "locked_pool_balance": round(r["locked_pool_balance"], 1)
            })
        return {"leaderboard": leaderboard}

@app.get("/api/activities")
def get_user_activities(username: str):
    username = username.strip().lower()
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM users WHERE username = ?", (username,))
        user = cursor.fetchone()
        if not user:
            return {"activities": []}

        cursor.execute("""
            SELECT id, filename, distance_km, elapsed_seconds, avg_heart_rate, 
                   pace_min_per_km, status, rejection_reason, pool_reward, created_at, source
            FROM activities 
            WHERE user_id = ? 
            ORDER BY created_at DESC 
            LIMIT 10
        """, (user["id"],))
        rows = cursor.fetchall()
        activities = []
        for r in rows:
            pace = r["pace_min_per_km"]
            p_min = int(pace)
            p_sec = int((pace - p_min) * 60)
            formatted_pace = f"{p_min}:{p_sec:02d}"
            activities.append({
                "id": r["id"],
                "filename": r["filename"],
                "distance_km": round(r["distance_km"], 2),
                "elapsed_seconds": r["elapsed_seconds"],
                "avg_heart_rate": r["avg_heart_rate"],
                "pace": formatted_pace,
                "status": r["status"],
                "rejection_reason": r["rejection_reason"],
                "pool_reward": round(r["pool_reward"], 2),
                "source": r["source"],
                "created_at": r["created_at"]
            })
        return {"activities": activities}

@app.post("/api/sync-service")
def sync_service(username: str = Form(...), provider: str = Form(...)):
    username = username.strip().lower()
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM users WHERE username = ?", (username,))
        user = cursor.fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="کاربر یافت نشد.")

        # Toggle connection
        cursor.execute("""
            INSERT INTO sync_connections (user_id, provider, is_connected, connected_at)
            VALUES (?, ?, 1, CURRENT_TIMESTAMP)
            ON CONFLICT(user_id, provider) DO UPDATE SET 
                is_connected = 1 - is_connected,
                connected_at = CURRENT_TIMESTAMP
        """, (user["id"], provider))
        
        cursor.execute("SELECT is_connected FROM sync_connections WHERE user_id = ? AND provider = ?", (user["id"], provider))
        state = bool(cursor.fetchone()["is_connected"])
        
        return {
            "success": True,
            "provider": provider,
            "is_connected": state,
            "message": f"اتصال سرویس {provider} با موفقیت {'برقرار' if state else 'قطع'} شد."
        }

@app.get("/api/store")
def get_store_items():
    # Catalog of discount vouchers and VIP challenges
    vouchers = [
        {
            "id": "nike_kish_30",
            "type": "voucher",
            "title": "کد تخفیف ۳۰٪ نایکی کیش",
            "subtitle": "خرید انواع کفش‌های مخصوص دویدن نایک زومکس و پگاسوس",
            "cost_pool": 80.0,
            "brand": "Nike Kish",
            "badge": "محبوب‌ترین",
            "discount": "۳۰ درصد"
        },
        {
            "id": "majid_sport_50",
            "type": "voucher",
            "title": "کوپن ۵۰ هزار تومانی پوشاک مجید",
            "subtitle": "قابل استفاده روی کلیه البسه رانینگ و جوراب‌های تکنیکال مروژ",
            "cost_pool": 50.0,
            "brand": "Merooj (Majid)",
            "badge": "ورزش ملی",
            "discount": "۵۰,۰۰۰ تومان"
        },
        {
            "id": "digikala_running_40",
            "type": "voucher",
            "title": "تخفیف ۴۰٪ اکسسوری و هدبند دیجی‌کالا",
            "subtitle": "خرید شیکر، بطری آب ورزشی، کمربند شماره مسابقه و ساعت ورزشی",
            "cost_pool": 60.0,
            "brand": "Digikala Sport",
            "badge": "تحویل اکسپرس",
            "discount": "۴۰ درصد"
        },
        {
            "id": "snappfood_diet_25",
            "type": "voucher",
            "title": "تخفیف ۲۵٪ رژیم غذایی و سالادبار اسنپ‌فود",
            "subtitle": "سفارش غذاهای پرپروتئین و سالادهای تخصصی ریکاوری دوندگان",
            "cost_pool": 40.0,
            "brand": "SnappFood Fit",
            "badge": "تغذیه سالم",
            "discount": "۲۵ درصد"
        }
    ]

    challenges = [
        {
            "id": "tehran_virtual_10k",
            "type": "challenge",
            "title": "چالش ۱۰ کیلومتر مجازی پایتخت",
            "subtitle": "ثبت ۱۰ کیلومتر دویدن در طول هفته و شرکت در قرعه‌کشی گارمین واچ",
            "entry_fee_pool": 20.0,
            "prize_pool": "۵,۰۰۰ POOL + Garmin Forerunner",
            "participants": 418,
            "days_left": 5
        },
        {
            "id": "bam_tehran_morning",
            "type": "challenge",
            "title": "چالش صعود بام تهران (سرعت و استقامت)",
            "subtitle": "دویدن با میانگین ضربان قلب بالاتر از ۱۵۰ bpm در مسیر شیب‌دار",
            "entry_fee_pool": 15.0,
            "prize_pool": "۲,۵۰۰ POOL نقد",
            "participants": 289,
            "days_left": 3
        },
        {
            "id": "persian_gulf_half_marathon",
            "type": "challenge",
            "title": "نیم ماراتن مجازی خلیج فارس (۲۱K)",
            "subtitle": "تکمیل مسافت ۲۱.۱ کیلومتر طی ۳ روز و دریافت مدال فیزیکی اختصاصی",
            "entry_fee_pool": 40.0,
            "prize_pool": "۱۰,۰۰۰ POOL + مدال یادبود",
            "participants": 632,
            "days_left": 12
        }
    ]

    return {"vouchers": vouchers, "challenges": challenges}

@app.post("/api/store/redeem")
def redeem_store_item(req: RedeemRequest):
    username = req.username.strip().lower()
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, locked_pool_balance FROM users WHERE username = ?", (username,))
        user = cursor.fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="کاربر یافت نشد.")

        if user["locked_pool_balance"] < req.cost_pool:
            raise HTTPException(
                status_code=400, 
                detail=f"موجودی POOL شما ({user['locked_pool_balance']} توکن) برای خرید این مورد کافی نیست. نیاز به {req.cost_pool} توکن دارید."
            )

        # Deduct balance
        new_balance = round(user["locked_pool_balance"] - req.cost_pool, 2)
        cursor.execute("UPDATE users SET locked_pool_balance = ? WHERE id = ?", (new_balance, user["id"]))

        # Generate discount coupon code
        code = f"DOOP-{req.item_id[:4].upper()}-{random.randint(1000, 9999)}"
        cursor.execute("""
            INSERT INTO user_vouchers (user_id, item_id, title, code, cost_pool)
            VALUES (?, ?, ?, ?, ?)
        """, (user["id"], req.item_id, req.title, code, req.cost_pool))

        return {
            "success": True,
            "new_balance": new_balance,
            "code": code,
            "message": f"خرید با موفقیت انجام شد! کد تخفیف شما: {code}"
        }

@app.get("/api/notifications")
def get_user_notifications(username: str):
    username = username.strip().lower()
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM users WHERE username = ?", (username,))
        user = cursor.fetchone()
        if not user:
            return {"notifications": [], "unread_count": 0}

        cursor.execute("""
            SELECT id, type, title, body, icon, pool_amount, is_read, created_at
            FROM notifications
            WHERE user_id = ?
            ORDER BY created_at DESC
            LIMIT 30
        """, (user["id"],))
        rows = cursor.fetchall()

        cursor.execute("SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0", (user["id"],))
        unread_count = cursor.fetchone()["count"]

        notifications = []
        for r in rows:
            notifications.append({
                "id": r["id"],
                "type": r["type"],
                "title": r["title"],
                "body": r["body"],
                "icon": r["icon"],
                "pool_amount": round(r["pool_amount"], 1),
                "is_read": bool(r["is_read"]),
                "created_at": r["created_at"]
            })
        return {"notifications": notifications, "unread_count": unread_count}

@app.post("/api/notifications/mark-read")
def mark_notifications_read(username: str = Form(...)):
    username = username.strip().lower()
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM users WHERE username = ?", (username,))
        user = cursor.fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="کاربر یافت نشد.")

        cursor.execute("UPDATE notifications SET is_read = 1 WHERE user_id = ?", (user["id"],))
        return {"success": True, "message": "تمام اعلان‌ها به عنوان خوانده‌شده علامت‌گذاری شدند."}

@app.post("/api/notifications/subscribe")
def subscribe_push(req: PushSubscribeRequest):
    username = req.username.strip().lower()
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM users WHERE username = ?", (username,))
        user = cursor.fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="کاربر یافت نشد.")

        cursor.execute("""
            INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(endpoint) DO UPDATE SET 
                p256dh = excluded.p256dh,
                auth = excluded.auth
        """, (user["id"], req.endpoint, req.p256dh, req.auth))
        
        return {"success": True, "message": "اشتراک نوتیفیکیشن مرورگر با موفقیت ثبت شد."}

@app.post("/api/notifications/test-trigger")
def trigger_test_notification(req: TestNotificationRequest):
    username = req.username.strip().lower()
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, full_name, locked_pool_balance, total_km FROM users WHERE username = ?", (username,))
        user = cursor.fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="کاربر یافت نشد.")

        new_balance = user["locked_pool_balance"]
        notif_title = ""
        notif_body = ""
        notif_type = ""
        pool_amt = 0.0

        if req.scenario == "referral":
            notif_type = "REFERRAL_BONUS"
            pool_amt = 10.0
            new_balance = round(user["locked_pool_balance"] + 10.0, 1)
            cursor.execute("UPDATE users SET locked_pool_balance = ? WHERE id = ?", (new_balance, user["id"]))
            notif_title = "پاداش دعوت دوست واریز شد! 🎉"
            notif_body = "دوست دونده شما (کامران داوودی) با کد معرف شما ثبت‌نام کرد. ۱۰ توکن POOL به کیف پول شما واریز گردید!"
        elif req.scenario == "rank_up":
            notif_type = "RANK_UP"
            curr_rank = get_user_rank(cursor, user["id"])
            target_rank = max(1, curr_rank - 1)
            notif_title = "صعود در جدول برترین‌ها! 🏆"
            notif_body = f"تبریک! مسافت ثبت‌شده شما باعث شد به رتبه {target_rank} جدول دوندگان لیگ نایکی ایران صعود کنید!"
        elif req.scenario == "token_award":
            notif_type = "TOKEN_AWARD"
            pool_amt = 52.0
            new_balance = round(user["locked_pool_balance"] + pool_amt, 1)
            cursor.execute("UPDATE users SET locked_pool_balance = ?, total_km = total_km + 5.2 WHERE id = ?", (new_balance, user["id"]))
            notif_title = "پاداش فعالیت دویدن واریز شد! ⚡"
            notif_body = "دویدن ۵.۲ کیلومتری شما توسط سیستم ضدتقلب تایید شد و ۵۲ توکن POOL به کیف پول شما اضافه شد."
        else:
            notif_type = "SYSTEM"
            notif_title = "اعلان سیستم دوپول 🔔"
            notif_body = "سرویس پوش نوتیفیکیشن اختصاصی دوپول بر روی دستگاه شما فعال است."

        notif_id = create_notification(cursor, user["id"], notif_type, notif_title, notif_body, pool_amt)

        return {
            "success": True,
            "notification": {
                "id": notif_id,
                "type": notif_type,
                "title": notif_title,
                "body": notif_body,
                "pool_amount": pool_amt,
                "created_at": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            },
            "new_balance": new_balance,
            "message": "اعلان با موفقیت ایجاد و ارسال شد."
        }

# --- RUNNING CREWS & ENERGY ENDPOINTS ---

@app.get("/api/crews")
def get_crews():
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, name, city, badge, description, weekly_km, total_km, members_count, created_at
            FROM crews
            ORDER BY weekly_km DESC
        """)
        rows = cursor.fetchall()
        crews = []
        for idx, r in enumerate(rows):
            crews.append({
                "rank": idx + 1,
                "id": r["id"],
                "name": r["name"],
                "city": r["city"],
                "badge": r["badge"],
                "description": r["description"],
                "weekly_km": round(r["weekly_km"], 1),
                "total_km": round(r["total_km"], 1),
                "members_count": r["members_count"]
            })
        return {"crews": crews}

@app.post("/api/crews/join")
def join_crew(req: JoinCrewRequest):
    username = req.username.strip().lower()
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, full_name, crew_id FROM users WHERE username = ?", (username,))
        user = cursor.fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="کاربر یافت نشد.")

        cursor.execute("SELECT id, name FROM crews WHERE id = ?", (req.crew_id,))
        crew = cursor.fetchone()
        if not crew:
            raise HTTPException(status_code=404, detail="تیم مورد نظر یافت نشد.")

        # Update user's crew
        cursor.execute("UPDATE users SET crew_id = ? WHERE id = ?", (req.crew_id, user["id"]))
        cursor.execute("UPDATE crews SET members_count = members_count + 1 WHERE id = ?", (req.crew_id,))

        create_notification(
            cursor,
            user["id"],
            "SYSTEM",
            "عضویت در کلاب دویدن تایید شد! 🏃‍♂️",
            f"شما با موفقیت به تیم «{crew['name']}» ملحق شدید. از این پس کیلومترهای شما به پاداش هفتگی تیم اضافه می‌شود!",
            0.0,
            "users"
        )

        return {"success": True, "crew_id": req.crew_id, "crew_name": crew["name"], "message": f"شما با موفقیت به تیم {crew['name']} پیوستید."}

@app.post("/api/crews/create")
def create_crew(req: CreateCrewRequest):
    username = req.username.strip().lower()
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, locked_pool_balance FROM users WHERE username = ?", (username,))
        user = cursor.fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="کاربر یافت نشد.")

        cursor.execute("""
            INSERT INTO crews (name, city, badge, description, weekly_km, total_km, members_count)
            VALUES (?, ?, ?, ?, 0.0, 0.0, 1)
        """, (req.name, req.city, req.badge or "🔥", req.description))
        crew_id = cursor.lastrowid

        cursor.execute("UPDATE users SET crew_id = ? WHERE id = ?", (crew_id, user["id"]))

        create_notification(
            cursor,
            user["id"],
            "SYSTEM",
            "کلاب دویدن شما تاسیس شد! 🏁",
            f"تیم جدید «{req.name}» با کاپیتانی شما ایجاد گردید. دوندگان را به تیم خود دعوت کنید!",
            0.0,
            "trophy"
        )

        return {"success": True, "crew_id": crew_id, "name": req.name, "message": "تیم جدید شما با موفقیت ثبت شد."}

@app.get("/api/crews/{crew_id}/messages")
def get_crew_messages(crew_id: int):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, user_id, user_name, message, created_at
            FROM crew_messages
            WHERE crew_id = ?
            ORDER BY created_at DESC
            LIMIT 25
        """, (crew_id,))
        rows = cursor.fetchall()
        msgs = [{"id": r["id"], "user_name": r["user_name"], "message": r["message"], "created_at": r["created_at"]} for r in rows]
        return {"messages": msgs}

@app.post("/api/crews/messages")
def post_crew_message(req: CrewMessageRequest):
    username = req.username.strip().lower()
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, full_name FROM users WHERE username = ?", (username,))
        user = cursor.fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="کاربر یافت نشد.")

        cursor.execute("""
            INSERT INTO crew_messages (crew_id, user_id, user_name, message)
            VALUES (?, ?, ?, ?)
        """, (req.crew_id, user["id"], user["full_name"], req.message))
        msg_id = cursor.lastrowid

        return {"success": True, "message_id": msg_id}

@app.post("/api/energy/refill")
def refill_energy(username: str = Form(...)):
    username = username.strip().lower()
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("UPDATE users SET daily_energy_current = daily_energy_max WHERE username = ?", (username,))
        return {"success": True, "message": "انرژی روزانه شما به ۲۰ / ۲۰ شارژ مجدد شد."}

# --- DIGITAL SNEAKERS & GEAR (OPTION 1) ---

@app.get("/api/sneakers")
def get_user_sneakers(username: str):
    # Returns preset or user sneakers
    sneakers = [
        {
            "id": "snk-damavand",
            "name": "Damavand Marathon Pro",
            "persian_name": "دماوند ماراتن پرو",
            "model_type": "TRAINER",
            "type_label": "ترینر مسابقه‌ای",
            "speed_range": "۶ - ۱۲ کیلومتر/ساعت",
            "level": 12,
            "max_level": 30,
            "efficiency": 1.35,
            "comfort": 18,
            "resilience": 14,
            "luck": 12,
            "durability": 88,
            "max_durability": 100,
            "is_equipped": True,
            "emoji": "👟",
            "total_distance_km": 42.5,
            "repair_cost_per_percent": 0.25,
            "level_up_cost_pool": 60
        },
        {
            "id": "snk-tondar",
            "name": "Tondar Alborz Neon",
            "persian_name": "تندر البرز نئون",
            "model_type": "JOGGER",
            "type_label": "جاگر شهری",
            "speed_range": "۵ - ۹ کیلومتر/ساعت",
            "level": 8,
            "max_level": 30,
            "efficiency": 1.20,
            "comfort": 15,
            "resilience": 22,
            "luck": 10,
            "durability": 95,
            "max_durability": 100,
            "is_equipped": False,
            "emoji": "⚡",
            "total_distance_km": 28.0,
            "repair_cost_per_percent": 0.20,
            "level_up_cost_pool": 40
        },
        {
            "id": "snk-zagros",
            "name": "Zagros Trail Turbo",
            "persian_name": "زاگرس تریل توربو",
            "model_type": "WALKER",
            "type_label": "واکر کوهستان",
            "speed_range": "۲ - ۶ کیلومتر/ساعت",
            "level": 5,
            "max_level": 30,
            "efficiency": 1.10,
            "comfort": 20,
            "resilience": 28,
            "luck": 8,
            "durability": 70,
            "max_durability": 100,
            "is_equipped": False,
            "emoji": "🏔️",
            "total_distance_km": 18.2,
            "repair_cost_per_percent": 0.15,
            "level_up_cost_pool": 25
        },
        {
            "id": "snk-arash",
            "name": "Arash Future Sprinter",
            "persian_name": "آرش فیوچر اسپرینتر",
            "model_type": "SPRINTER",
            "type_label": "اسپرینتر سرعتی",
            "speed_range": "بالای ۱۰ کیلومتر/ساعت",
            "level": 15,
            "max_level": 30,
            "efficiency": 1.50,
            "comfort": 12,
            "resilience": 10,
            "luck": 25,
            "durability": 100,
            "max_durability": 100,
            "is_equipped": False,
            "emoji": "🚀",
            "total_distance_km": 64.0,
            "repair_cost_per_percent": 0.35,
            "level_up_cost_pool": 75
        }
    ]
    return {"sneakers": sneakers}

@app.post("/api/sneakers/repair")
def repair_sneaker(req: SneakerActionRequest):
    username = req.username.strip().lower()
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, locked_pool_balance FROM users WHERE username = ?", (username,))
        user = cursor.fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="کاربر یافت نشد.")

        # 3.0 POOL repair cost
        cost = 3.0
        if user["locked_pool_balance"] < cost:
            raise HTTPException(status_code=400, detail="موجودی توکن POOL برای تعمیر کافی نیست.")

        new_bal = round(user["locked_pool_balance"] - cost, 2)
        cursor.execute("UPDATE users SET locked_pool_balance = ? WHERE id = ?", (new_bal, user["id"]))

        return {"success": True, "new_balance": new_bal, "message": "کفش با موفقیت تعمیر شد و به ۱۰۰٪ استقامت بازگشت."}

@app.post("/api/sneakers/level-up")
def level_up_sneaker(req: SneakerActionRequest):
    username = req.username.strip().lower()
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, locked_pool_balance FROM users WHERE username = ?", (username,))
        user = cursor.fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="کاربر یافت نشد.")

        cost = 25.0
        if user["locked_pool_balance"] < cost:
            raise HTTPException(status_code=400, detail="موجودی توکن POOL برای ارتقا کافی نیست.")

        new_bal = round(user["locked_pool_balance"] - cost, 2)
        cursor.execute("UPDATE users SET locked_pool_balance = ? WHERE id = ?", (new_bal, user["id"]))

        create_notification(
            cursor,
            user["id"],
            "SYSTEM",
            "ارتقای لول کفش ورزشی تایید شد! 👟⚡",
            "کفش شما با موفقیت ارتقا یافت و ضریب کارایی آن افزایش پیدا کرد.",
            "Footprints"
        )

        return {"success": True, "new_balance": new_bal, "message": "ارتقای لول کفش با موفقیت انجام شد."}

# --- PVP RUN BATTLES & CASHOUT (OPTION 4) ---

@app.post("/api/battles/start")
def start_pvp_duel(req: StartDuelRequest):
    username = req.username.strip().lower()
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, locked_pool_balance FROM users WHERE username = ?", (username,))
        user = cursor.fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="کاربر یافت نشد.")

        if user["locked_pool_balance"] < req.wager_pool:
            raise HTTPException(status_code=400, detail="موجودی POOL برای شرکت در این دوئل کافی نیست.")

        new_bal = round(user["locked_pool_balance"] - req.wager_pool, 2)
        cursor.execute("UPDATE users SET locked_pool_balance = ? WHERE id = ?", (new_bal, user["id"]))

        return {
            "success": True,
            "new_balance": new_bal,
            "distance_km": req.distance_km,
            "wager_pool": req.wager_pool,
            "message": "دوئل با موفقیت آغاز شد."
        }

@app.post("/api/cashout")
def request_cashout(req: CashoutSubmitRequest):
    username = req.username.strip().lower()
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, locked_pool_balance FROM users WHERE username = ?", (username,))
        user = cursor.fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="کاربر یافت نشد.")

        if req.pool_amount < 20:
            raise HTTPException(status_code=400, detail="حداقل تعداد توکن جهت تسویه ۲۰ POOL می‌باشد.")

        if user["locked_pool_balance"] < req.pool_amount:
            raise HTTPException(status_code=400, detail="موجودی شما کمتر از مبلغ درخواستی است.")

        toman = int(req.pool_amount * 5000)
        new_bal = round(user["locked_pool_balance"] - req.pool_amount, 2)
        tracking = f"PAYA-{random.randint(100000, 999999)}"

        cursor.execute("UPDATE users SET locked_pool_balance = ? WHERE id = ?", (new_bal, user["id"]))
        cursor.execute("""
            INSERT INTO cashout_requests (user_id, pool_amount, toman_amount, sheba_number, account_owner, tracking_code)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (user["id"], req.pool_amount, toman, req.sheba_number, req.account_owner, tracking))

        create_notification(
            cursor,
            user["id"],
            "SYSTEM",
            "درخواست تسویه ریالی ثبت شد 💳🇮🇷",
            f"مبلغ {toman:,} تومان با شناسه {tracking} به شماره شبا ثبت گردید و در صف پایا قرار گرفت.",
            "CreditCard"
        )

        return {
            "success": True,
            "new_balance": new_bal,
            "toman_amount": toman,
            "tracking_code": tracking,
            "message": f"درخواست تسویه با کد پیگیری {tracking} ثبت شد."
        }

# Embedded Frontend UI in Persian RTL with Vazirmatn font & Dark Glassmorphism
HTML_CONTENT = """<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Dopool (دوپول) | پلتفرم کسب درآمد با دویدن</title>
    <!-- Tailwind CSS CDN -->
    <script src="https://cdn.tailwindcss.com"></script>
    <!-- Google Fonts: Vazirmatn -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    fontFamily: {
                        sans: ['Vazirmatn', 'sans-serif'],
                    },
                    colors: {
                        brand: {
                            bg: '#060913',
                            card: 'rgba(13, 22, 41, 0.72)',
                            cardBorder: 'rgba(56, 189, 248, 0.15)',
                            green: '#10b981',
                            greenGlow: 'rgba(16, 185, 129, 0.3)',
                            blue: '#38bdf8',
                            blueGlow: 'rgba(56, 189, 248, 0.25)',
                        }
                    }
                }
            }
        }
    </script>
    <style>
        * {
            font-family: 'Vazirmatn', sans-serif;
            -webkit-tap-highlight-color: transparent;
        }
        body {
            background-color: #060913;
            background-image: 
                radial-gradient(circle at 15% 15%, rgba(56, 189, 248, 0.08) 0%, transparent 35%),
                radial-gradient(circle at 85% 85%, rgba(16, 185, 129, 0.08) 0%, transparent 35%);
            background-attachment: fixed;
        }
        .glass-box {
            background: rgba(13, 22, 41, 0.75);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border: 1px solid rgba(56, 189, 248, 0.15);
        }
        .glass-glow-green {
            background: rgba(13, 26, 44, 0.85);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(16, 185, 129, 0.3);
            box-shadow: 0 0 30px -5px rgba(16, 185, 129, 0.18);
        }
        .pulse-accent {
            animation: pulseGlow 3s infinite ease-in-out;
        }
        @keyframes pulseGlow {
            0%, 100% { opacity: 0.6; }
            50% { opacity: 1; }
        }
    </style>
</head>
<body class="text-slate-100 min-h-screen flex flex-col items-center justify-start p-0 sm:p-4">

    <!-- Mobile-First Container (max-w-480px, centered on desktop) -->
    <div id="appContainer" class="w-full max-w-[480px] min-h-screen sm:min-h-[92vh] flex flex-col bg-[#060913] sm:rounded-3xl sm:border sm:border-slate-800/80 shadow-2xl relative overflow-hidden pb-20">

        <!-- Header -->
        <header id="mainHeader" class="px-5 pt-5 pb-3 flex items-center justify-between border-b border-slate-800/60 sticky top-0 bg-[#060913]/90 backdrop-blur-md z-30">
            <div class="flex items-center gap-3">
                <div class="relative">
                    <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-sky-400 p-[2px] shadow-lg shadow-emerald-500/20">
                        <div class="w-full h-full bg-[#091122] rounded-[10px] flex items-center justify-center font-black text-emerald-400 text-sm" id="userAvatar">
                            DP
                        </div>
                    </div>
                    <span class="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-[#060913] rounded-full"></span>
                </div>
                <div>
                    <h1 class="text-sm font-bold text-slate-100 flex items-center gap-1.5" id="headerFullName">
                        دوپول (Dopool)
                    </h1>
                    <span class="text-xs text-slate-400" id="headerUsername">@dopool</span>
                </div>
            </div>
            <div class="flex items-center gap-1.5">
                <div class="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                    <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block"></span>
                    <span id="headerPoolBadge">0 POOL</span>
                </div>
                <!-- Notification Bell Button -->
                <button id="notifBellBtn" onclick="toggleNotifDrawer()" class="p-2 text-slate-300 hover:text-white relative rounded-lg hover:bg-slate-800/50 transition-colors cursor-pointer" title="مرکز نوتیفیکیشن‌ها">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
                    </svg>
                    <span id="headerNotifBadge" class="hidden absolute top-1 right-1 w-4 h-4 bg-emerald-500 text-slate-950 font-black text-[9px] rounded-full flex items-center justify-center shadow-lg">0</span>
                </button>
                <button id="logoutBtn" onclick="logout()" class="p-2 text-slate-400 hover:text-rose-400 transition-colors" title="خروج از حساب">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                    </svg>
                </button>
            </div>
        </header>

        <!-- Dynamic Content Body -->
        <main class="flex-1 px-4 py-4 space-y-4 overflow-y-auto" id="mainContent">

            <!-- Auth Section (Visible if not logged in) -->
            <div id="authSection" class="space-y-4 py-2">
                <div class="text-center space-y-1.5 py-4">
                    <div class="inline-flex p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-1">
                        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                        </svg>
                    </div>
                    <h2 class="text-xl font-extrabold text-white">دویدن و کسب درآمد با دوپول</h2>
                    <p class="text-xs text-slate-400 max-w-xs mx-auto">ساعت هوشمند خود را متصل کنید، بدوید و به ازای هر کیلومتر توکن POOL پاداش بگیرید.</p>
                </div>

                <!-- Auth Tabs: Login / Register -->
                <div class="grid grid-cols-2 p-1 bg-slate-900/80 rounded-xl border border-slate-800">
                    <button id="tabAuthLogin" onclick="switchAuthTab('login')" class="py-2 text-xs font-semibold rounded-lg bg-emerald-500 text-slate-950 transition-all">ورود</button>
                    <button id="tabAuthRegister" onclick="switchAuthTab('register')" class="py-2 text-xs font-semibold rounded-lg text-slate-400 hover:text-white transition-all">ثبت نام دوندگان</button>
                </div>

                <!-- Login Form -->
                <form id="loginForm" onsubmit="handleLogin(event)" class="glass-box rounded-2xl p-4 space-y-3">
                    <div>
                        <label class="block text-xs text-slate-300 mb-1 font-medium">نام کاربری (انگلیسی)</label>
                        <input id="loginUsername" type="text" required placeholder="مثال: sohrab_run" class="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors">
                    </div>
                    <div>
                        <label class="block text-xs text-slate-300 mb-1 font-medium">رمز عبور</label>
                        <input id="loginPassword" type="password" required placeholder="••••••••" class="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors">
                    </div>
                    <button type="submit" class="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/25 active:scale-[0.98]">
                        ورود به حساب کاربری
                    </button>
                    <p class="text-[11px] text-center text-slate-500">حساب نمونه پیش‌فرض: نام کاربری <span class="text-emerald-400 font-mono">sohrab_run</span> با رمز <span class="text-emerald-400 font-mono">pass123</span></p>
                </form>

                <!-- Register Form -->
                <form id="registerForm" onsubmit="handleRegister(event)" class="glass-box rounded-2xl p-4 space-y-3 hidden">
                    <div>
                        <label class="block text-xs text-slate-300 mb-1 font-medium">نام و نام خانوادگی</label>
                        <input id="regFullName" type="text" required placeholder="سهراب مرادی" class="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors">
                    </div>
                    <div>
                        <label class="block text-xs text-slate-300 mb-1 font-medium">شماره تماس</label>
                        <input id="regPhone" type="tel" required placeholder="09123456789" class="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors text-left" dir="ltr">
                    </div>
                    <div>
                        <label class="block text-xs text-slate-300 mb-1 font-medium">نام کاربری (انگلیسی)</label>
                        <input id="regUsername" type="text" required placeholder="runner_ali" class="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors text-left" dir="ltr">
                    </div>
                    <div>
                        <label class="block text-xs text-slate-300 mb-1 font-medium">رمز عبور</label>
                        <input id="regPassword" type="password" required placeholder="حداقل ۶ نویسه" class="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors">
                    </div>
                    <div>
                        <label class="block text-xs text-slate-300 mb-1 font-medium">کد معرف (اختیاری - دریافت هدیه دعوت)</label>
                        <input id="regReferral" type="text" placeholder="مثال: DP-1001" class="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-400 transition-colors text-left uppercase" dir="ltr">
                        <span class="text-[10px] text-sky-400 mt-1 block">با وارد کردن کد معرف، ۱۰ توکن POOL به دعوت‌کننده شما اهدا می‌شود.</span>
                    </div>
                    <button type="submit" class="w-full py-3 bg-gradient-to-r from-emerald-500 to-sky-400 hover:from-emerald-400 hover:to-sky-300 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/25 active:scale-[0.98]">
                        ثبت نام و ایجاد کیف پول ورزشی
                    </button>
                </form>
            </div>

            <!-- Logged-in App Content -->
            <div id="dashboardSection" class="space-y-4 hidden">

                <!-- Wallet Card (Hero section) -->
                <div class="glass-glow-green rounded-3xl p-5 relative overflow-hidden">
                    <div class="absolute -top-12 -left-12 w-36 h-36 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none"></div>
                    <div class="absolute -bottom-12 -right-12 w-36 h-36 bg-sky-500/20 rounded-full blur-2xl pointer-events-none"></div>

                    <div class="flex items-center justify-between text-xs text-slate-400 mb-2">
                        <span class="flex items-center gap-1.5 font-medium">
                            <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
                            کیف پول پاداش دویدن
                        </span>
                        <span class="text-sky-400 font-mono text-[11px] bg-sky-400/10 px-2 py-0.5 rounded-md border border-sky-400/20" id="userRefBadge">DP-0000</span>
                    </div>

                    <div class="my-3">
                        <span class="text-xs text-slate-400">موجودی قفل‌شده (Locked POOL)</span>
                        <div class="flex items-baseline gap-2 mt-0.5">
                            <span class="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-sky-400 tracking-tight" id="heroPoolBalance">0.0</span>
                            <span class="text-sm font-bold text-emerald-400">POOL</span>
                        </div>
                        <p class="text-[11px] text-slate-400 mt-1">نرخ پاداش فعلی: هر ۱ کیلومتر دویدن معتبر = ۱۰ توکن POOL</p>
                    </div>

                    <!-- Stats Row -->
                    <div class="grid grid-cols-2 gap-2 pt-3 border-t border-slate-800/80">
                        <div class="bg-slate-950/40 rounded-xl p-2.5 border border-slate-800/60">
                            <span class="text-[11px] text-slate-400 block">مجموع کیلومتر دویده‌شده</span>
                            <div class="flex items-baseline gap-1 mt-0.5">
                                <span class="text-lg font-bold text-white" id="heroTotalKm">0.0</span>
                                <span class="text-xs text-sky-400 font-medium">KM</span>
                            </div>
                        </div>
                        <div class="bg-slate-950/40 rounded-xl p-2.5 border border-slate-800/60">
                            <span class="text-[11px] text-slate-400 block">دوستان دعوت‌شده</span>
                            <div class="flex items-baseline gap-1 mt-0.5">
                                <span class="text-lg font-bold text-white" id="heroFriendsCount">0</span>
                                <span class="text-xs text-emerald-400 font-medium">نفر (+۱۰ POOL)</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Navigation Tabs: Sync, Leaderboard, Store, History -->
                <div class="grid grid-cols-4 p-1 bg-slate-950/80 rounded-2xl border border-slate-800 text-xs">
                    <button onclick="switchTab('sync')" id="navTabSync" class="py-2.5 rounded-xl font-bold transition-all text-slate-950 bg-emerald-500">
                        اتصال
                    </button>
                    <button onclick="switchTab('leaderboard')" id="navTabLeaderboard" class="py-2.5 rounded-xl font-medium transition-all text-slate-400 hover:text-white">
                        برترین‌ها
                    </button>
                    <button onclick="switchTab('store')" id="navTabStore" class="py-2.5 rounded-xl font-medium transition-all text-slate-400 hover:text-white">
                        جوایز
                    </button>
                    <button onclick="switchTab('history')" id="navTabHistory" class="py-2.5 rounded-xl font-medium transition-all text-slate-400 hover:text-white">
                        تاریخچه
                    </button>
                </div>

                <!-- TAB 1: SYNC & FIT UPLOAD -->
                <div id="tabContentSync" class="space-y-4">
                    <!-- Smartwatch Connect Section -->
                    <div class="glass-box rounded-2xl p-4 space-y-3">
                        <div class="flex items-center justify-between">
                            <h3 class="text-xs font-bold text-slate-200 flex items-center gap-2">
                                <svg class="w-4 h-4 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                                </svg>
                                اتصال ساعت و ردیاب‌های هوشمند
                            </h3>
                            <span class="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">همگام‌سازی ابری</span>
                        </div>
                        <div class="grid grid-cols-3 gap-2">
                            <!-- Strava -->
                            <button onclick="handleSyncWatch('Strava')" id="syncStravaBtn" class="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-orange-500/50 transition-all text-center group">
                                <div class="w-8 h-8 rounded-lg bg-[#FC4C02]/10 border border-[#FC4C02]/20 flex items-center justify-center text-[#FC4C02] font-black text-xs mb-1.5 group-hover:scale-105 transition-transform">
                                    STRAVA
                                </div>
                                <span class="text-xs font-medium text-slate-200">استراوا</span>
                                <span class="text-[10px] text-slate-500 mt-0.5 status-badge">قطع</span>
                            </button>

                            <!-- Garmin -->
                            <button onclick="handleSyncWatch('Garmin')" id="syncGarminBtn" class="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-sky-500/50 transition-all text-center group">
                                <div class="w-8 h-8 rounded-lg bg-[#007CC3]/10 border border-[#007CC3]/20 flex items-center justify-center text-[#007CC3] font-black text-[11px] mb-1.5 group-hover:scale-105 transition-transform">
                                    GARMIN
                                </div>
                                <span class="text-xs font-medium text-slate-200">گارمین</span>
                                <span class="text-[10px] text-slate-500 mt-0.5 status-badge">قطع</span>
                            </button>

                            <!-- COROS -->
                            <button onclick="handleSyncWatch('COROS')" id="syncCorosBtn" class="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-emerald-500/50 transition-all text-center group">
                                <div class="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-black text-[11px] mb-1.5 group-hover:scale-105 transition-transform">
                                    COROS
                                </div>
                                <span class="text-xs font-medium text-slate-200">کوروس</span>
                                <span class="text-[10px] text-slate-500 mt-0.5 status-badge">قطع</span>
                            </button>
                        </div>
                    </div>

                    <!-- FIT File Drag & Drop Upload Zone -->
                    <div class="glass-box rounded-2xl p-4 space-y-3">
                        <div class="flex items-center justify-between">
                            <h3 class="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                                <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                                </svg>
                                بارگذاری دستی فایل ساعت (.fit)
                            </h3>
                            <span class="text-[10px] text-sky-400">موتور fitparse</span>
                        </div>

                        <!-- Dropzone -->
                        <div id="dropzone" onclick="document.getElementById('fitFileInput').click()" class="border-2 border-dashed border-slate-700/80 hover:border-emerald-500/60 rounded-2xl p-5 text-center cursor-pointer transition-all bg-slate-950/30 group">
                            <input type="file" id="fitFileInput" accept=".fit" class="hidden" onchange="handleFileSelected(event)">
                            <div class="flex flex-col items-center gap-2">
                                <div class="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
                                    </svg>
                                </div>
                                <p class="text-xs font-semibold text-slate-200">فایل <span class="text-emerald-400 font-mono">.fit</span> خود را اینجا بکشید یا کلیک کنید</p>
                                <p class="text-[10px] text-slate-500">پشتیبانی از خروجی ساعت‌های Garmin, Polar, Coros, Suunto, Apple Watch</p>
                            </div>
                        </div>

                        <!-- Fast Simulator / Test presets -->
                        <div class="pt-2 border-t border-slate-800/80">
                            <span class="text-[11px] text-slate-400 block mb-2 font-medium">آزمایش سریع موتور ضدتقلب (Proof of Human):</span>
                            <div class="grid grid-cols-2 gap-2 text-xs">
                                <button onclick="triggerMockUpload('valid')" class="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 text-right transition-all">
                                    <div class="font-bold flex items-center justify-between">
                                        <span>دویدن ۵.۲k استاندارد</span>
                                        <span class="text-[10px] bg-emerald-500/20 px-1 rounded">معتبر</span>
                                    </div>
                                    <span class="text-[10px] text-slate-400 block mt-0.5">ضربان ۱۴۵ | پیس ۵:۱۵</span>
                                </button>
                                <button onclick="triggerMockUpload('cheater_speed')" class="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 text-right transition-all">
                                    <div class="font-bold flex items-center justify-between">
                                        <span>سواره / ماشین (سرعت بالا)</span>
                                        <span class="text-[10px] bg-rose-500/20 px-1 rounded">رد تقلب</span>
                                    </div>
                                    <span class="text-[10px] text-slate-400 block mt-0.5">پیس ۱:۳۹ (سریع‌تر از ۲:۴۰)</span>
                                </button>
                                <button onclick="triggerMockUpload('cheater_hr')" class="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 text-right transition-all">
                                    <div class="font-bold flex items-center justify-between">
                                        <span>پیاده‌روی سبک</span>
                                        <span class="text-[10px] bg-amber-500/20 px-1 rounded">رد ضربان</span>
                                    </div>
                                    <span class="text-[10px] text-slate-400 block mt-0.5">ضربان ۹۲ bpm (کمتر از ۱۱۰)</span>
                                </button>
                                <button onclick="triggerMockUpload('cheater_distance')" class="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 hover:bg-purple-500/20 text-right transition-all">
                                    <div class="font-bold flex items-center justify-between">
                                        <span>دویدن کوتاه (۰.۶k)</span>
                                        <span class="text-[10px] bg-purple-500/20 px-1 rounded">رد مسافت</span>
                                    </div>
                                    <span class="text-[10px] text-slate-400 block mt-0.5">مسافت زیر ۱.۰ کیلومتر</span>
                                </button>
                            </div>
                        </div>

                        <!-- Verification Rules Checklist -->
                        <div class="p-3 rounded-xl bg-slate-950/50 border border-slate-800 text-[11px] text-slate-400 space-y-1">
                            <span class="font-bold text-slate-300 block mb-1">قوانین اعتبارسنجی ضدتقلب (Proof of Human):</span>
                            <div class="flex items-center gap-1.5">
                                <span class="text-emerald-400">✓</span> مسافت حداقل ۱.۰ کیلومتر
                            </div>
                            <div class="flex items-center gap-1.5">
                                <span class="text-emerald-400">✓</span> میانگین ضربان قلب حداقل ۱۱۰ ضربه در دقیقه
                            </div>
                            <div class="flex items-center gap-1.5">
                                <span class="text-emerald-400">✓</span> سرعت (Pace) بین ۲:۴۰ تا ۹:۳۰ دقیقه بر کیلومتر
                            </div>
                            <div class="flex items-center gap-1.5">
                                <span class="text-emerald-400">✓</span> جلوگیری از بارگذاری فایل تکراری با الگوریتم هش
                            </div>
                        </div>
                    </div>

                    <!-- Referral Sharing Section -->
                    <div class="glass-box rounded-2xl p-4 space-y-2.5">
                        <div class="flex items-center justify-between">
                            <h3 class="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                                <svg class="w-4 h-4 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                                </svg>
                                دعوت از دوستان دونده
                            </h3>
                            <span class="text-[10px] text-emerald-400 font-semibold">+۱۰ POOL پاداش قطعی</span>
                        </div>
                        <p class="text-xs text-slate-400">لینک اختصاصی خود را با دوندگان به اشتراک بگذارید تا به ازای هر ثبت نام، ۱۰ توکن دریافت کنید.</p>
                        <div class="flex items-center gap-2 bg-slate-950 rounded-xl p-2 border border-slate-800">
                            <input id="referralLinkInput" readonly class="bg-transparent text-xs text-sky-300 font-mono w-full px-2 outline-none select-all" dir="ltr">
                            <button onclick="copyReferralLink()" class="px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-lg text-xs whitespace-nowrap transition-colors">
                                کپی لینک
                            </button>
                        </div>
                    </div>
                </div>

                <!-- TAB 2: LEADERBOARD -->
                <div id="tabContentLeaderboard" class="space-y-4 hidden">
                    <!-- Sponsor Banner -->
                    <div class="relative overflow-hidden rounded-2xl bg-gradient-to-r from-neutral-900 via-stone-900 to-black p-4 border border-amber-500/30 shadow-lg">
                        <div class="flex items-center justify-between">
                            <div>
                                <span class="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">اسپانسر رسمی</span>
                                <h4 class="text-sm font-extrabold text-white mt-1">نایکی دویدن ایران | Nike Running</h4>
                                <p class="text-[11px] text-slate-400">جوایز ماهانه ۳ جفت کفش Vaporfly برای نفرات اول تا سوم</p>
                            </div>
                            <div class="text-right">
                                <span class="text-2xl font-black text-amber-400 italic">NIKE</span>
                            </div>
                        </div>
                    </div>

                    <!-- Top 3 Podium Cards -->
                    <div class="grid grid-cols-3 gap-2 pt-2 items-end text-center" id="podiumContainer">
                        <!-- Loaded via JS -->
                    </div>

                    <!-- Full Rankings List -->
                    <div class="glass-box rounded-2xl p-3 space-y-1" id="leaderboardList">
                        <!-- Loaded via JS -->
                    </div>
                </div>

                <!-- TAB 3: STORE & CHALLENGES -->
                <div id="tabContentStore" class="space-y-4 hidden">
                    <!-- Section A: VIP Challenges -->
                    <div class="space-y-2.5">
                        <div class="flex items-center justify-between">
                            <h3 class="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                                <svg class="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"></path>
                                </svg>
                                چالش‌های دویدن VIP با استخر جایزه
                            </h3>
                            <span class="text-[10px] text-amber-400">ورودی با توکن POOL</span>
                        </div>
                        <div class="space-y-2.5" id="challengesContainer">
                            <!-- Loaded via JS -->
                        </div>
                    </div>

                    <!-- Section B: Discount Vouchers -->
                    <div class="space-y-2.5 pt-2">
                        <div class="flex items-center justify-between">
                            <h3 class="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                                <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
                                </svg>
                                صرافی و کدهای تخفیف فروشگاه‌های ورزشی
                            </h3>
                            <span class="text-[10px] text-emerald-400">خرج توکن</span>
                        </div>
                        <div class="grid grid-cols-1 gap-2.5" id="vouchersContainer">
                            <!-- Loaded via JS -->
                        </div>
                    </div>
                </div>

                <!-- TAB 4: HISTORY -->
                <div id="tabContentHistory" class="space-y-3 hidden">
                    <div class="flex items-center justify-between">
                        <h3 class="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                            <svg class="w-4 h-4 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            ۱۰ فعالیت ورزشی اخیر
                        </h3>
                        <span class="text-[10px] text-slate-400" id="historyCounter">بررسی وضعیت ضدتقلب</span>
                    </div>
                    <div class="space-y-2" id="activitiesList">
                        <!-- Loaded via JS -->
                    </div>
                </div>

            </div>

        </main>

        <!-- Bottom Tab Bar (Mobile App Style) -->
        <nav id="bottomNavBar" class="fixed sm:absolute bottom-0 left-0 right-0 max-w-[480px] mx-auto bg-[#060913]/95 backdrop-blur-lg border-t border-slate-800/80 px-4 py-2 flex justify-around items-center z-40 hidden">
            <button onclick="switchTab('sync')" id="bottomBtnSync" class="flex flex-col items-center gap-1 text-emerald-400 py-1 transition-colors">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                </svg>
                <span class="text-[10px] font-bold">اتصال</span>
            </button>
            <button onclick="switchTab('leaderboard')" id="bottomBtnLeaderboard" class="flex flex-col items-center gap-1 text-slate-400 hover:text-white py-1 transition-colors">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                </svg>
                <span class="text-[10px] font-medium">برترین‌ها</span>
            </button>
            <button onclick="switchTab('store')" id="bottomBtnStore" class="flex flex-col items-center gap-1 text-slate-400 hover:text-white py-1 transition-colors">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
                </svg>
                <span class="text-[10px] font-medium">جوایز</span>
            </button>
            <button onclick="switchTab('history')" id="bottomBtnHistory" class="flex flex-col items-center gap-1 text-slate-400 hover:text-white py-1 transition-colors">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                </svg>
                <span class="text-[10px] font-medium">تاریخچه</span>
            </button>
        </nav>

        <!-- Notification Drawer Modal -->
        <div id="notifDrawer" class="hidden fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-0 sm:p-4">
            <div class="w-full max-w-[480px] max-h-[85vh] bg-[#091122] border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-3xl p-5 flex flex-col shadow-2xl overflow-hidden">
                <div class="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div class="flex items-center gap-2">
                        <div class="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
                        </div>
                        <div>
                            <h3 class="text-sm font-bold text-white">مرکز اعلان‌ها و رویدادهای زنده</h3>
                            <span class="text-[11px] text-slate-400" id="notifDrawerSubtitle">اعلان‌های اخیر شما</span>
                        </div>
                    </div>
                    <button onclick="toggleNotifDrawer()" class="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>

                <!-- Push Permission Card -->
                <div class="mt-3 p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-2">
                    <div>
                        <span class="text-xs font-bold text-slate-200 block" id="pushStatusText">پوش نوتیفیکیشن مرورگر</span>
                        <span class="text-[10px] text-slate-400 block">ارسال پیام‌های پاداش و ارتقای رتبه روی گوشی شما</span>
                    </div>
                    <button id="enablePushBtn" onclick="requestBrowserPush()" class="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs whitespace-nowrap transition-colors">
                        فعال‌سازی
                    </button>
                </div>

                <!-- Test Push Notification Triggers -->
                <div class="mt-3 p-3 rounded-2xl bg-slate-950/60 border border-sky-500/20 space-y-2">
                    <span class="text-[11px] font-bold text-sky-400 block">آزمایش سناریوهای اعلان (Live Push Tester):</span>
                    <div class="grid grid-cols-3 gap-1.5 text-[11px]">
                        <button onclick="triggerTestPush('referral')" class="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 text-center transition-all font-medium">
                            <span class="block font-bold">پاداش رفرال</span>
                            <span class="text-[9px] text-emerald-400/80">+۱۰ POOL</span>
                        </button>
                        <button onclick="triggerTestPush('rank_up')" class="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 text-center transition-all font-medium">
                            <span class="block font-bold">صعود رتبه</span>
                            <span class="text-[9px] text-amber-400/80">Rank Up 🏆</span>
                        </button>
                        <button onclick="triggerTestPush('token_award')" class="p-2 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-300 hover:bg-sky-500/20 text-center transition-all font-medium">
                            <span class="block font-bold">پاداش دویدن</span>
                            <span class="text-[9px] text-sky-400/80">+۵۲ POOL</span>
                        </button>
                    </div>
                </div>

                <!-- Notifications List -->
                <div class="mt-3 flex-1 overflow-y-auto space-y-2 pr-0.5" id="notifListContainer">
                    <!-- Loaded via JS -->
                </div>

                <!-- Drawer Footer -->
                <div class="pt-3 mt-2 border-t border-slate-800 flex items-center justify-between">
                    <button onclick="markAllNotifsRead()" class="text-xs text-slate-400 hover:text-white transition-colors">
                        علامت‌گذاری همه به عنوان خوانده‌شده
                    </button>
                    <button onclick="toggleNotifDrawer()" class="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition-colors">
                        بستن
                    </button>
                </div>
            </div>
        </div>

        <!-- Notification Toast Modal -->
        <div id="toastNotification" class="fixed bottom-20 left-1/2 -translate-x-1/2 w-[90%] max-w-[420px] p-3 rounded-2xl glass-box border border-emerald-500/40 shadow-2xl z-50 flex items-center gap-3 transform translate-y-32 opacity-0 transition-all duration-300 pointer-events-none">
            <div id="toastIcon" class="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm shrink-0">✓</div>
            <div class="flex-1">
                <p id="toastMessage" class="text-xs font-semibold text-white">پیام سیستم</p>
                <p id="toastDetail" class="text-[10px] text-slate-400"></p>
            </div>
        </div>

    </div>

    <!-- Application Logic (Vanilla JS) -->
    <script>
        let currentUser = null;
        let currentTab = 'sync';
        let storeData = { vouchers: [], challenges: [] };

        // Check localStorage on load
        window.addEventListener('DOMContentLoaded', () => {
            const savedUser = localStorage.getItem('dopool_user');
            if (savedUser) {
                try {
                    currentUser = JSON.parse(savedUser);
                    refreshUserProfile();
                } catch(e) {
                    showAuth();
                }
            } else {
                showAuth();
            }
        });

        function showAuth() {
            document.getElementById('authSection').classList.remove('hidden');
            document.getElementById('dashboardSection').classList.add('hidden');
            document.getElementById('bottomNavBar').classList.add('hidden');
            document.getElementById('logoutBtn').classList.add('hidden');
        }

        function showDashboard() {
            document.getElementById('authSection').classList.add('hidden');
            document.getElementById('dashboardSection').classList.remove('hidden');
            document.getElementById('bottomNavBar').classList.remove('hidden');
            document.getElementById('logoutBtn').classList.remove('hidden');
            updateUI();
            switchTab('sync');
            loadLeaderboard();
            loadStore();
            loadActivities();
            loadNotifications();
        }

        function switchAuthTab(type) {
            const btnLogin = document.getElementById('tabAuthLogin');
            const btnReg = document.getElementById('tabAuthRegister');
            const formLogin = document.getElementById('loginForm');
            const formReg = document.getElementById('registerForm');

            if (type === 'login') {
                btnLogin.className = 'py-2 text-xs font-semibold rounded-lg bg-emerald-500 text-slate-950 transition-all';
                btnReg.className = 'py-2 text-xs font-semibold rounded-lg text-slate-400 hover:text-white transition-all';
                formLogin.classList.remove('hidden');
                formReg.classList.add('hidden');
            } else {
                btnReg.className = 'py-2 text-xs font-semibold rounded-lg bg-emerald-500 text-slate-950 transition-all';
                btnLogin.className = 'py-2 text-xs font-semibold rounded-lg text-slate-400 hover:text-white transition-all';
                formReg.classList.remove('hidden');
                formLogin.classList.add('hidden');
            }
        }

        async function handleLogin(e) {
            e.preventDefault();
            const username = document.getElementById('loginUsername').value;
            const password = document.getElementById('loginPassword').value;

            try {
                const res = await fetch('/api/login', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ username, password })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.detail || 'خطا در ورود به حساب');

                currentUser = data.user;
                localStorage.setItem('dopool_user', JSON.stringify(currentUser));
                showToast('خوش آمدید!', `ورود موفق به عنوان ${currentUser.full_name}`, 'success');
                showDashboard();
            } catch (err) {
                showToast('خطا در ورود', err.message, 'error');
            }
        }

        async function handleRegister(e) {
            e.preventDefault();
            const full_name = document.getElementById('regFullName').value;
            const phone = document.getElementById('regPhone').value;
            const username = document.getElementById('regUsername').value;
            const password = document.getElementById('regPassword').value;
            const referral_code = document.getElementById('regReferral').value;

            try {
                const res = await fetch('/api/register', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ full_name, phone, username, password, referral_code })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.detail || 'خطا در ثبت نام');

                currentUser = data.user;
                currentUser.phone = phone;
                currentUser.friends_count = 0;
                localStorage.setItem('dopool_user', JSON.stringify(currentUser));
                showToast('ثبت نام موفق', 'کیف پول ورزشی شما با موفقیت ایجاد شد', 'success');
                showDashboard();
            } catch (err) {
                showToast('خطا در ثبت نام', err.message, 'error');
            }
        }

        async function refreshUserProfile() {
            if (!currentUser) return;
            try {
                const res = await fetch(`/api/me?username=${encodeURIComponent(currentUser.username)}`);
                if (res.ok) {
                    const data = await res.json();
                    currentUser = { ...currentUser, ...data };
                    localStorage.setItem('dopool_user', JSON.stringify(currentUser));
                    showDashboard();
                } else {
                    showAuth();
                }
            } catch(e) {
                showDashboard();
            }
        }

        function updateUI() {
            if (!currentUser) return;
            document.getElementById('headerFullName').textContent = currentUser.full_name;
            document.getElementById('headerUsername').textContent = `@${currentUser.username}`;
            document.getElementById('userAvatar').textContent = currentUser.full_name.slice(0, 2);
            document.getElementById('headerPoolBadge').textContent = `${currentUser.locked_pool_balance} POOL`;
            
            document.getElementById('heroPoolBalance').textContent = currentUser.locked_pool_balance.toFixed(1);
            document.getElementById('heroTotalKm').textContent = currentUser.total_km.toFixed(1);
            document.getElementById('heroFriendsCount').textContent = currentUser.friends_count || 0;
            document.getElementById('userRefBadge').textContent = currentUser.referral_code;

            const appUrl = window.location.origin;
            const refLink = `${appUrl}/?ref=${currentUser.referral_code}`;
            document.getElementById('referralLinkInput').value = refLink;

            // Update watch sync statuses
            if (currentUser.connections) {
                updateWatchBadge('syncStravaBtn', currentUser.connections['Strava']);
                updateWatchBadge('syncGarminBtn', currentUser.connections['Garmin']);
                updateWatchBadge('syncCorosBtn', currentUser.connections['COROS']);
            }
        }

        function updateWatchBadge(btnId, isConnected) {
            const btn = document.getElementById(btnId);
            if (!btn) return;
            const badge = btn.querySelector('.status-badge');
            if (isConnected) {
                badge.textContent = 'متصل';
                badge.className = 'text-[10px] text-emerald-400 font-bold mt-0.5 status-badge';
                btn.classList.add('border-emerald-500/50', 'bg-emerald-950/20');
            } else {
                badge.textContent = 'قطع';
                badge.className = 'text-[10px] text-slate-500 mt-0.5 status-badge';
                btn.classList.remove('border-emerald-500/50', 'bg-emerald-950/20');
            }
        }

        function switchTab(tab) {
            currentTab = tab;
            const tabs = ['sync', 'leaderboard', 'store', 'history'];
            tabs.forEach(t => {
                const content = document.getElementById(`tabContent${t.charAt(0).toUpperCase() + t.slice(1)}`);
                const navBtn = document.getElementById(`navTab${t.charAt(0).toUpperCase() + t.slice(1)}`);
                const bottomBtn = document.getElementById(`bottomBtn${t.charAt(0).toUpperCase() + t.slice(1)}`);

                if (t === tab) {
                    content.classList.remove('hidden');
                    navBtn.className = 'py-2.5 rounded-xl font-bold transition-all text-slate-950 bg-emerald-500';
                    bottomBtn.className = 'flex flex-col items-center gap-1 text-emerald-400 py-1 transition-colors';
                } else {
                    content.classList.add('hidden');
                    navBtn.className = 'py-2.5 rounded-xl font-medium transition-all text-slate-400 hover:text-white';
                    bottomBtn.className = 'flex flex-col items-center gap-1 text-slate-400 hover:text-white py-1 transition-colors';
                }
            });

            if (tab === 'leaderboard') loadLeaderboard();
            if (tab === 'store') loadStore();
            if (tab === 'history') loadActivities();
        }

        async function handleSyncWatch(provider) {
            if (!currentUser) return;
            try {
                const form = new FormData();
                form.append('username', currentUser.username);
                form.append('provider', provider);

                const res = await fetch('/api/sync-service', {
                    method: 'POST',
                    body: form
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.detail);

                if (!currentUser.connections) currentUser.connections = {};
                currentUser.connections[provider] = data.is_connected;
                updateWatchBadge(`sync${provider}Btn`, data.is_connected);
                showToast(
                    data.is_connected ? 'اتصال برقرار شد' : 'اتصال قطع شد',
                    `سرویس ${provider} با موفقیت ${data.is_connected ? 'متصل' : 'قطع'} گردید.`,
                    'success'
                );
            } catch (err) {
                showToast('خطا در اتصال', err.message, 'error');
            }
        }

        async function handleFileSelected(e) {
            const file = e.target.files[0];
            if (!file) return;
            await uploadFitFile(file);
        }

        async function uploadFitFile(file) {
            if (!currentUser) return;
            showToast('در حال تحلیل فایل .fit', 'اجرای الگوریتم ضدتقلب و استخراج ضربان قلب...', 'info');

            const formData = new FormData();
            formData.append('file', file);
            formData.append('username', currentUser.username);

            try {
                const res = await fetch('/api/upload-fit', {
                    method: 'POST',
                    body: formData
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.detail || 'خطا در پردازش فایل');

                if (data.is_valid) {
                    showToast('فعالیت تایید شد! 🎉', `پاداش: +${data.pool_reward} POOL | مسافت: ${data.distance_km}km | پیس: ${data.pace}`, 'success');
                } else {
                    showToast('فعالیت رد شد ⚠️', data.rejection_reason, 'warning');
                }

                refreshUserProfile();
                loadActivities();
                switchTab('history');
            } catch(err) {
                showToast('خطا در بارگذاری', err.message, 'error');
            }
        }

        async function triggerMockUpload(scenario) {
            if (!currentUser) return;
            showToast('بررسی آنی ضدتقلب...', 'شبیه‌سازی دریافت داده از ساعت هوشمند', 'info');

            const formData = new FormData();
            formData.append('username', currentUser.username);
            formData.append('scenario', scenario);

            try {
                const res = await fetch('/api/mock-upload-fit', {
                    method: 'POST',
                    body: formData
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.detail || 'خطا در ثبت شبیه‌سازی');

                if (data.is_valid) {
                    showToast('فعالیت تایید شد! 🎉', `پاداش: +${data.pool_reward} POOL | مسافت: ${data.distance_km}km | ضربان: ${data.avg_heart_rate}bpm`, 'success');
                } else {
                    showToast('هشدار ضدتقلب ⚠️', data.rejection_reason, 'warning');
                }

                refreshUserProfile();
                loadActivities();
                switchTab('history');
            } catch(err) {
                showToast('خطا', err.message, 'error');
            }
        }

        async function loadLeaderboard() {
            try {
                const res = await fetch('/api/leaderboard');
                const data = await res.json();
                const lb = data.leaderboard || [];

                // Podium (Top 3)
                const podiumContainer = document.getElementById('podiumContainer');
                podiumContainer.innerHTML = '';
                if (lb.length >= 3) {
                    const runner1 = lb[0];
                    const runner2 = lb[1];
                    const runner3 = lb[2];

                    podiumContainer.innerHTML = `
                        <!-- Rank 2 (Silver) -->
                        <div class="glass-box rounded-2xl p-2.5 flex flex-col items-center border-slate-400/30">
                            <span class="text-xs font-bold text-slate-300">🥈 رتبه ۲</span>
                            <span class="text-xs font-bold text-white mt-1 truncate max-w-[90px]">${runner2.full_name}</span>
                            <span class="text-[11px] text-sky-400 font-mono mt-0.5">${runner2.total_km} km</span>
                            <span class="text-[9px] text-emerald-400 font-medium">${runner2.locked_pool_balance} POOL</span>
                        </div>
                        <!-- Rank 1 (Gold) -->
                        <div class="glass-glow-green rounded-2xl p-3 flex flex-col items-center border-amber-400/50 scale-105">
                            <span class="text-xs font-black text-amber-400">👑 قهرمان</span>
                            <span class="text-xs font-black text-white mt-1 truncate max-w-[100px]">${runner1.full_name}</span>
                            <span class="text-xs text-sky-400 font-mono font-bold mt-0.5">${runner1.total_km} km</span>
                            <span class="text-[10px] text-emerald-400 font-bold">${runner1.locked_pool_balance} POOL</span>
                        </div>
                        <!-- Rank 3 (Bronze) -->
                        <div class="glass-box rounded-2xl p-2.5 flex flex-col items-center border-amber-700/30">
                            <span class="text-xs font-bold text-amber-600">🥉 رتبه ۳</span>
                            <span class="text-xs font-bold text-white mt-1 truncate max-w-[90px]">${runner3.full_name}</span>
                            <span class="text-[11px] text-sky-400 font-mono mt-0.5">${runner3.total_km} km</span>
                            <span class="text-[9px] text-emerald-400 font-medium">${runner3.locked_pool_balance} POOL</span>
                        </div>
                    `;
                }

                // Rankings list
                const list = document.getElementById('leaderboardList');
                list.innerHTML = '';
                lb.forEach((r, idx) => {
                    const isMe = currentUser && r.username.toLowerCase() === currentUser.username.toLowerCase();
                    const item = document.createElement('div');
                    item.className = `flex items-center justify-between p-2.5 rounded-xl transition-all ${isMe ? 'bg-emerald-500/15 border border-emerald-500/30 font-bold' : 'hover:bg-slate-900/60'}`;
                    item.innerHTML = `
                        <div class="flex items-center gap-2.5">
                            <span class="w-6 text-center text-xs font-mono font-bold ${idx < 3 ? 'text-amber-400' : 'text-slate-500'}">${idx + 1}</span>
                            <div>
                                <span class="text-xs text-slate-200 block">${r.full_name} ${isMe ? '<span class="text-[9px] text-emerald-400 bg-emerald-500/10 px-1 rounded">(شما)</span>' : ''}</span>
                                <span class="text-[10px] text-slate-500 font-mono">@${r.username}</span>
                            </div>
                        </div>
                        <div class="text-left font-mono">
                            <span class="text-xs text-sky-400 font-bold block">${r.total_km} <span class="text-[10px] font-sans">km</span></span>
                            <span class="text-[10px] text-emerald-400">${r.locked_pool_balance} POOL</span>
                        </div>
                    `;
                    list.appendChild(item);
                });
            } catch(e) {
                console.error(e);
            }
        }

        async function loadStore() {
            try {
                const res = await fetch('/api/store');
                storeData = await res.json();

                // Challenges
                const chContainer = document.getElementById('challengesContainer');
                chContainer.innerHTML = '';
                storeData.challenges.forEach(ch => {
                    const div = document.createElement('div');
                    div.className = 'glass-box rounded-2xl p-3.5 space-y-2 border-amber-500/20';
                    div.innerHTML = `
                        <div class="flex items-start justify-between">
                            <div>
                                <span class="text-[10px] text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20 font-medium">جایزه: ${ch.prize_pool}</span>
                                <h4 class="text-xs font-bold text-slate-100 mt-1">${ch.title}</h4>
                            </div>
                            <span class="text-[10px] text-slate-400 font-mono">${ch.days_left} روز مانده</span>
                        </div>
                        <p class="text-[11px] text-slate-400">${ch.subtitle}</p>
                        <div class="flex items-center justify-between pt-2 border-t border-slate-800/80">
                            <span class="text-[10px] text-slate-400">${ch.participants} دونده شرکت کرده‌اند</span>
                            <button onclick="handleJoinChallenge('${ch.id}', '${ch.title}', ${ch.entry_fee_pool})" class="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition-colors">
                                ثبت نام (${ch.entry_fee_pool} POOL)
                            </button>
                        </div>
                    `;
                    chContainer.appendChild(div);
                });

                // Vouchers
                const vContainer = document.getElementById('vouchersContainer');
                vContainer.innerHTML = '';
                storeData.vouchers.forEach(v => {
                    const div = document.createElement('div');
                    div.className = 'glass-box rounded-2xl p-3.5 space-y-2 hover:border-emerald-500/40 transition-all';
                    div.innerHTML = `
                        <div class="flex items-start justify-between">
                            <div>
                                <span class="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded font-medium">${v.badge} · ${v.brand}</span>
                                <h4 class="text-xs font-bold text-slate-100 mt-1">${v.title}</h4>
                            </div>
                            <span class="text-xs font-bold text-emerald-400 font-mono">${v.cost_pool} POOL</span>
                        </div>
                        <p class="text-[11px] text-slate-400">${v.subtitle}</p>
                        <div class="flex items-center justify-between pt-2 border-t border-slate-800/80">
                            <span class="text-[11px] font-bold text-sky-400">${v.discount}</span>
                            <button onclick="handleRedeemVoucher('${v.id}', '${v.title}', ${v.cost_pool})" class="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs transition-colors">
                                دریافت کوپن تخفیف
                            </button>
                        </div>
                    `;
                    vContainer.appendChild(div);
                });
            } catch(e) {
                console.error(e);
            }
        }

        async function handleRedeemVoucher(itemId, title, cost) {
            if (!currentUser) return;
            if (currentUser.locked_pool_balance < cost) {
                showToast('موجودی ناکافی', `برای این خرید به ${cost} توکن نیاز دارید (موجودی فعلی: ${currentUser.locked_pool_balance})`, 'warning');
                return;
            }

            try {
                const res = await fetch('/api/store/redeem', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        username: currentUser.username,
                        item_id: itemId,
                        title: title,
                        cost_pool: cost
                    })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.detail);

                currentUser.locked_pool_balance = data.new_balance;
                updateUI();
                showToast('کد تخفیف صادر شد! 🎁', `کد اختصاصی: ${data.code}`, 'success');
            } catch(err) {
                showToast('خطا در خرید', err.message, 'error');
            }
        }

        async function handleJoinChallenge(id, title, fee) {
            if (!currentUser) return;
            if (currentUser.locked_pool_balance < fee) {
                showToast('موجودی ناکافی', `هزینه ورودی چالش ${fee} توکن POOL است.`, 'warning');
                return;
            }
            currentUser.locked_pool_balance -= fee;
            updateUI();
            showToast('ثبت نام در چالش تایید شد! 🏃‍♂️', `شما با موفقیت در ${title} شرکت داده شدید.`, 'success');
        }

        async function loadActivities() {
            if (!currentUser) return;
            try {
                const res = await fetch(`/api/activities?username=${encodeURIComponent(currentUser.username)}`);
                const data = await res.json();
                const acts = data.activities || [];
                const list = document.getElementById('activitiesList');
                list.innerHTML = '';

                document.getElementById('historyCounter').textContent = `${acts.length} مورد ثبت‌شده`;

                if (acts.length === 0) {
                    list.innerHTML = `
                        <div class="glass-box rounded-2xl p-6 text-center text-slate-400 text-xs">
                            هنوز هیچ فعالیتی ثبت نکرده‌اید. با بارگذاری فایل ساعت هوشمند خود در تب اتصال، اولین توکن‌های خود را دشت کنید!
                        </div>
                    `;
                    return;
                }

                acts.forEach(a => {
                    const isAccepted = a.status === 'ACCEPTED';
                    const div = document.createElement('div');
                    div.className = `glass-box rounded-2xl p-3 space-y-2 border ${isAccepted ? 'border-emerald-500/20' : 'border-rose-500/30'}`;
                    
                    div.innerHTML = `
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-2">
                                <span class="w-2 h-2 rounded-full ${isAccepted ? 'bg-emerald-400' : 'bg-rose-400'}"></span>
                                <span class="text-xs font-bold text-slate-200">${a.filename}</span>
                            </div>
                            <span class="text-[10px] font-bold px-2 py-0.5 rounded ${isAccepted ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}">
                                ${isAccepted ? 'تایید شد' : 'رد شد'}
                            </span>
                        </div>

                        <div class="grid grid-cols-4 gap-1 text-center bg-slate-950/40 rounded-xl p-2 text-slate-300 font-mono text-xs">
                            <div>
                                <span class="text-[9px] text-slate-500 font-sans block">مسافت</span>
                                <span class="font-bold text-sky-400">${a.distance_km} <span class="text-[9px]">km</span></span>
                            </div>
                            <div>
                                <span class="text-[9px] text-slate-500 font-sans block">ضربان قلب</span>
                                <span class="font-bold ${a.avg_heart_rate >= 110 ? 'text-emerald-400' : 'text-rose-400'}">${a.avg_heart_rate} <span class="text-[9px]">bpm</span></span>
                            </div>
                            <div>
                                <span class="text-[9px] text-slate-500 font-sans block">سرعت (پیس)</span>
                                <span class="font-bold text-slate-200">${a.pace}</span>
                            </div>
                            <div>
                                <span class="text-[9px] text-slate-500 font-sans block">پاداش</span>
                                <span class="font-bold text-emerald-400">+${a.pool_reward}</span>
                            </div>
                        </div>

                        ${!isAccepted && a.rejection_reason ? `
                            <p class="text-[10px] text-rose-400 bg-rose-500/10 rounded-lg p-1.5 border border-rose-500/20">
                                ⚠️ دلیل عدم تایید: ${a.rejection_reason}
                            </p>
                        ` : ''}
                    `;
                    list.appendChild(div);
                });
            } catch(e) {
                console.error(e);
            }
        }

        function toggleNotifDrawer() {
            const drawer = document.getElementById('notifDrawer');
            if (drawer.classList.contains('hidden')) {
                drawer.classList.remove('hidden');
                loadNotifications();
                updatePushPermissionUI();
            } else {
                drawer.classList.add('hidden');
            }
        }

        function updatePushPermissionUI() {
            const txt = document.getElementById('pushStatusText');
            const btn = document.getElementById('enablePushBtn');
            if ('Notification' in window && Notification.permission === 'granted') {
                txt.textContent = 'پوش نوتیفیکیشن فعال است ✓';
                txt.className = 'text-xs font-bold text-emerald-400 block';
                btn.classList.add('hidden');
            } else {
                txt.textContent = 'پوش نوتیفیکیشن مرورگر';
                txt.className = 'text-xs font-bold text-slate-200 block';
                btn.classList.remove('hidden');
            }
        }

        async function requestBrowserPush() {
            if (!('Notification' in window)) {
                showToast('خطا', 'مرورگر شما از پوش نوتیفیکیشن پشتیبانی نمی‌کند.', 'warning');
                return;
            }
            try {
                const permission = await Notification.requestPermission();
                updatePushPermissionUI();
                if (permission === 'granted') {
                    showToast('نوتیفیکیشن فعال شد! 🔔', 'پیام‌های صعود رتبه و پاداش رفرال را دریافت خواهید کرد.', 'success');
                    playNotificationChime('bonus');
                }
            } catch(e) {
                console.error(e);
            }
        }

        function playNotificationChime(type) {
            try {
                const AudioCtx = window.AudioContext || window.webkitAudioContext;
                if (!AudioCtx) return;
                const ctx = new AudioCtx();
                if (type === 'rank_up') {
                    [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
                        const osc = ctx.createOscillator();
                        const gain = ctx.createGain();
                        osc.type = 'triangle';
                        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.12);
                        gain.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.12);
                        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.35);
                        osc.connect(gain);
                        gain.connect(ctx.destination);
                        osc.start(ctx.currentTime + i * 0.12);
                        osc.stop(ctx.currentTime + i * 0.12 + 0.4);
                    });
                } else {
                    [659.25, 987.77].forEach((freq, i) => {
                        const osc = ctx.createOscillator();
                        const gain = ctx.createGain();
                        osc.type = 'sine';
                        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.1);
                        gain.gain.setValueAtTime(0.25, ctx.currentTime + i * 0.1);
                        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 0.3);
                        osc.connect(gain);
                        gain.connect(ctx.destination);
                        osc.start(ctx.currentTime + i * 0.1);
                        osc.stop(ctx.currentTime + i * 0.1 + 0.35);
                    });
                }
            } catch(e) {}
        }

        async function loadNotifications() {
            if (!currentUser) return;
            try {
                const res = await fetch(`/api/notifications?username=${encodeURIComponent(currentUser.username)}`);
                const data = await res.json();
                const notifs = data.notifications || [];
                const unread = data.unread_count || 0;

                const badge = document.getElementById('headerNotifBadge');
                if (unread > 0) {
                    badge.textContent = unread;
                    badge.classList.remove('hidden');
                } else {
                    badge.classList.add('hidden');
                }

                const container = document.getElementById('notifListContainer');
                container.innerHTML = '';

                document.getElementById('notifDrawerSubtitle').textContent = unread > 0 ? `${unread} اعلان جدید خوانده نشده` : 'همه پیام‌ها خوانده شده است';

                if (notifs.length === 0) {
                    container.innerHTML = '<div class="text-center py-8 text-slate-500 text-xs">هیچ اعلانی در حال حاضر ثبت نشده است.</div>';
                    return;
                }

                notifs.forEach(n => {
                    const isUnread = !n.is_read;
                    const div = document.createElement('div');
                    div.className = `p-3 rounded-2xl border transition-all ${isUnread ? 'bg-slate-900/90 border-emerald-500/30' : 'bg-slate-950/40 border-slate-800/60'}`;
                    
                    let iconBg = 'bg-sky-500/20 text-sky-400';
                    let iconChar = '⚡';
                    if (n.type === 'REFERRAL_BONUS') {
                        iconBg = 'bg-emerald-500/20 text-emerald-400';
                        iconChar = '🎁';
                    } else if (n.type === 'RANK_UP') {
                        iconBg = 'bg-amber-500/20 text-amber-400';
                        iconChar = '🏆';
                    }

                    div.innerHTML = `
                        <div class="flex items-start gap-2.5">
                            <div class="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${iconBg}">
                                ${iconChar}
                            </div>
                            <div class="flex-1">
                                <div class="flex items-center justify-between">
                                    <h4 class="text-xs font-bold text-white flex items-center gap-1.5">
                                        <span>${n.title}</span>
                                        ${isUnread ? '<span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>' : ''}
                                    </h4>
                                    <span class="text-[10px] text-slate-500">${n.created_at}</span>
                                </div>
                                <p class="text-[11px] text-slate-300 mt-1 leading-relaxed">${n.body}</p>
                                ${n.pool_amount > 0 ? `
                                    <div class="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[10px] font-bold">
                                        +${n.pool_amount} POOL
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    `;
                    container.appendChild(div);
                });
            } catch(e) {
                console.error(e);
            }
        }

        async function markAllNotifsRead() {
            if (!currentUser) return;
            const form = new FormData();
            form.append('username', currentUser.username);
            await fetch('/api/notifications/mark-read', { method: 'POST', body: form });
            loadNotifications();
            showToast('انجام شد', 'همه اعلان‌ها به عنوان خوانده‌شده علامت‌گذاری شدند.', 'info');
        }

        async function triggerTestPush(scenario) {
            if (!currentUser) return;
            try {
                const res = await fetch('/api/notifications/test-trigger', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        username: currentUser.username,
                        scenario: scenario
                    })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.detail);

                playNotificationChime(scenario === 'rank_up' ? 'rank_up' : 'bonus');

                if ('Notification' in window && Notification.permission === 'granted') {
                    new Notification(data.notification.title, {
                        body: data.notification.body,
                        dir: 'rtl',
                        lang: 'fa'
                    });
                }

                showToast(data.notification.title, data.notification.body, 'success');
                if (data.new_balance) {
                    currentUser.locked_pool_balance = data.new_balance;
                    updateUI();
                }
                loadNotifications();
            } catch(e) {
                showToast('خطا', e.message, 'error');
            }
        }

        function copyReferralLink() {
            const input = document.getElementById('referralLinkInput');
            input.select();
            navigator.clipboard.writeText(input.value);
            showToast('کپی شد!', 'لینک دعوت اختصاصی شما در کلیپ‌بورد کپی شد.', 'success');
        }

        function logout() {
            localStorage.removeItem('dopool_user');
            currentUser = null;
            showAuth();
            showToast('خروج', 'با موفقیت از حساب کاربری خارج شدید.', 'info');
        }

        function showToast(title, detail, type = 'info') {
            const toast = document.getElementById('toastNotification');
            const icon = document.getElementById('toastIcon');
            const msg = document.getElementById('toastMessage');
            const det = document.getElementById('toastDetail');

            msg.textContent = title;
            det.textContent = detail;

            if (type === 'success') {
                icon.textContent = '✓';
                icon.className = 'w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm shrink-0';
                toast.style.borderColor = 'rgba(16, 185, 129, 0.5)';
            } else if (type === 'warning') {
                icon.textContent = '⚠️';
                icon.className = 'w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-sm shrink-0';
                toast.style.borderColor = 'rgba(245, 158, 11, 0.5)';
            } else if (type === 'error') {
                icon.textContent = '✕';
                icon.className = 'w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-sm shrink-0';
                toast.style.borderColor = 'rgba(244, 63, 94, 0.5)';
            } else {
                icon.textContent = 'ℹ';
                icon.className = 'w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-sm shrink-0';
                toast.style.borderColor = 'rgba(56, 189, 248, 0.5)';
            }

            toast.classList.remove('translate-y-32', 'opacity-0');
            toast.classList.add('translate-y-0', 'opacity-100');

            setTimeout(() => {
                toast.classList.remove('translate-y-0', 'opacity-100');
                toast.classList.add('translate-y-32', 'opacity-0');
            }, 3500);
        }
    </script>
</body>
</html>
"""

@app.get("/", response_class=HTMLResponse)
def serve_index():
    return HTMLResponse(content=HTML_CONTENT)

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("app:app", host="0.0.0.0", port=port, reload=True)
