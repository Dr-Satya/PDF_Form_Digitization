import os
import psycopg2
import bcrypt
from dotenv import load_dotenv

load_dotenv()

email = os.getenv('APP_ADMIN_EMAIL')
password = os.getenv('APP_ADMIN_PASSWORD')

if not email or not password:
    email = input('App admin email: ').strip()
    password = input('App admin password: ').strip()

if not email or not password:
    raise SystemExit('Email and password are required')

conn = psycopg2.connect(os.getenv('DATABASE_URL'))
cursor = conn.cursor()

hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

cursor.execute(
    "INSERT INTO users (email, password_hash, role) VALUES (%s, %s, 'app_admin')",
    (email, hashed.decode('utf-8')),
)

conn.commit()
cursor.close()
conn.close()

print('App admin user created successfully')
