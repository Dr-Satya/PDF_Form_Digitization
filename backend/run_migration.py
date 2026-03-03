import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

# Database connection
conn = psycopg2.connect(
    host="localhost",
    database="pdf_digitization",
    user="postgres",
    password="password123",
    port=5432
)

try:
    cursor = conn.cursor()
    
    # Add submitter_email column
    print("Adding submitter_email column...")
    cursor.execute("""
        ALTER TABLE submissions 
        ADD COLUMN IF NOT EXISTS submitter_email VARCHAR(255)
    """)
    
    # Add index for performance
    print("Adding index...")
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_submissions_form_email 
        ON submissions(form_id, submitter_email)
    """)
    
    # Update existing records
    print("Updating existing records...")
    cursor.execute("""
        UPDATE submissions 
        SET submitter_email = 'unknown@example.com' 
        WHERE submitter_email IS NULL
    """)
    
    conn.commit()
    print("Migration completed successfully!")
    
except Exception as e:
    print(f"Error: {e}")
    conn.rollback()
finally:
    conn.close()
