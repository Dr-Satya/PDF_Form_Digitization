from flask import Flask, jsonify, request, g as flask_g
from flask_cors import CORS
import os
from dotenv import load_dotenv
import psycopg2
from psycopg2.extras import RealDictCursor
from werkzeug.utils import secure_filename
import uuid
from pypdf import PdfReader
import json
import traceback
import secrets
import re
from flask_jwt_extended import JWTManager, jwt_required, create_access_token, get_jwt_identity, get_jwt
import bcrypt
from functools import wraps

load_dotenv()

app = Flask(__name__)
CORS(app)

app.config['UPLOAD_FOLDER'] = 'uploads'

app.config['JWT_SECRET_KEY'] = 'super-secret-key-that-is-long-enough-for-jwt-validation-at-least-32-bytes-long-12345678901234567890123456789012'
jwt = JWTManager(app)

@jwt.unauthorized_loader
def _jwt_missing_token(reason):
    return jsonify({"error": "Missing or invalid Authorization header", "details": reason}), 401

@jwt.invalid_token_loader
def _jwt_invalid_token(reason):
    return jsonify({"error": "Invalid token", "details": reason}), 422

@jwt.expired_token_loader
def _jwt_expired_token(jwt_header, jwt_payload):
    return jsonify({"error": "Token has expired"}), 401

def admin_required(f):
    @wraps(f)
    @jwt_required()
    def decorated_function(*args, **kwargs):
        user_id = get_jwt_identity()
        claims = get_jwt()
        if claims.get('role') != 'admin':
            return jsonify({"error": "Admin access required"}), 403
        flask_g.user = {
            'id': user_id,
            'email': claims.get('email'),
            'role': claims.get('role'),
        }
        return f(*args, **kwargs)
    return decorated_function

def get_db_connection():
    conn = psycopg2.connect(os.getenv('DATABASE_URL'))
    return conn

@app.route('/api/admin/register', methods=['POST'])
def register_admin():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    if not email or not password:
        return jsonify({"error": "Email and password required"}), 400
    hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("INSERT INTO users (email, password_hash, role) VALUES (%s, %s, 'admin')", (email, hashed.decode('utf-8')))
        conn.commit()
        return jsonify({"message": "Admin registered successfully"}), 201
    except psycopg2.IntegrityError:
        conn.rollback()
        return jsonify({"error": "Email already exists"}), 400
    finally:
        cursor.close()
        conn.close()

@app.route('/api/admin/login', methods=['POST'])
def login_admin():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    cursor.execute("SELECT id, email, password_hash, role FROM users WHERE email = %s", (email,))
    user = cursor.fetchone()
    cursor.close()
    conn.close()
    if not user or not bcrypt.checkpw(password.encode('utf-8'), user['password_hash'].encode('utf-8')):
        return jsonify({"error": "Invalid credentials"}), 401
    access_token = create_access_token(
        identity=str(user['id']),
        additional_claims={
            'email': user['email'],
            'role': user['role'],
        },
    )
    return jsonify({"access_token": access_token}), 200

@app.route('/api/health', methods=['GET'])
def health_check():
    try:
        conn = get_db_connection()
        conn.close()
        return jsonify({"status": "OK"}), 200
    except Exception as e:
        return jsonify({"status": "ERROR", "message": str(e)}), 500

@app.route('/api/forms/upload', methods=['POST'])
@admin_required
def upload_pdf():
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file part"}), 400
        file = request.files['file']
        if file.filename == '':
            return jsonify({"error": "No selected file"}), 400
        if not file.filename.lower().endswith('.pdf'):
            return jsonify({"error": "File must be a PDF"}), 400
        filename = secure_filename(file.filename)
        unique_filename = str(uuid.uuid4()) + '.pdf'
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
        file.save(filepath)
        # Insert into DB
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("INSERT INTO forms (original_pdf_path) VALUES (%s) RETURNING id", (filepath,))
        form_id = cursor.fetchone()[0]

        # Extract text
        reader = PdfReader(filepath)
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
        print("Extracted text:", text)

        # Improved field detection using regex
        labels = []
        lines = text.split('\n')
        for line in lines:
            line = line.strip()
            if re.search(r'……+', line):
                # Detect fields separated by long sequences of dots (5 or more)
                parts = re.split(r'……+', line)
                for part in parts:
                    part = part.strip()
                    if part:
                        # Remove leading and trailing dots
                        part = re.sub(r'^\.+', '', part).strip()
                        part = re.sub(r'\.+$', '', part).strip()
                        if part and not re.match(r'^\d+$', part):  # Avoid numbers only
                            labels.append(part)
            else:
                # Detect labels before ':'
                matches = re.findall(r'([^:]+):', line)
                for match in matches:
                    label = match.strip()
                    if label and label not in labels:
                        labels.append(label)
        fields = [{"label": label, "type": "text", "required": True} for label in labels]

        # Group fields into sections for better structure
        sections = []
        section_size = 5  # Fields per section
        for i in range(0, len(fields), section_size):
            section_fields = fields[i:i + section_size]
            section_title = f"Section {len(sections) + 1}"
            sections.append({"title": section_title, "fields": section_fields})

        schema = {"sections": sections}

        # Update form with schema
        cursor.execute("UPDATE forms SET form_schema = %s WHERE id = %s", (json.dumps(schema), form_id))
        conn.commit()

        cursor.close()
        conn.close()
        return jsonify({"form_id": str(form_id), "message": "PDF uploaded and processed successfully"}), 201
    except Exception as e:
        print("Error in upload:", str(e))
        print(traceback.format_exc())
        return jsonify({"error": "Internal server error: " + str(e)}), 500

@app.route('/api/forms/<uuid:form_id>', methods=['GET'])
def get_form(form_id):
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    cursor.execute("SELECT id, form_schema FROM forms WHERE id = %s", (str(form_id),))
    form = cursor.fetchone()
    cursor.close()
    conn.close()
    if not form:
        return jsonify({"error": "Form not found"}), 404
    return jsonify({"form_id": str(form['id']), "schema": form['form_schema']}), 200

@app.route('/api/forms/<uuid:form_id>/submit', methods=['POST'])
def submit_form(form_id):
    data = request.get_json() or {}
    filled_data = data.get('filled_data', [])
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO submissions (form_id, filled_data) VALUES (%s, %s)",
        (str(form_id), json.dumps(filled_data)),
    )
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({"message": "Submission successful"}), 201

if __name__ == '__main__':
    app.run(debug=True, host='127.0.0.1', port=8000)
