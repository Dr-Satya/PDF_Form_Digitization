import psycopg2
import bcrypt
import os
from dotenv import load_dotenv

load_dotenv()

conn = psycopg2.connect(os.getenv('DATABASE_URL'))
cursor = conn.cursor()

email = 'satya.prakash@gdgu.org'
password = '123456789'

hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

cursor.execute("INSERT INTO users (email, password_hash, role) VALUES (%s, %s, 'admin')", (email, hashed.decode('utf-8')))

conn.commit()

cursor.close()

conn.close()

print("Admin user created successfully")
