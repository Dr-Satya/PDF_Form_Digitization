from flask import Flask, jsonify, request, g as flask_g, send_file
from flask_cors import CORS
import os
from dotenv import load_dotenv
import psycopg2
from psycopg2.extras import RealDictCursor
from werkzeug.utils import secure_filename
import uuid
from pypdf import PdfReader, PdfWriter
import json
import traceback
import secrets
import re
from flask_jwt_extended import JWTManager, jwt_required, create_access_token, get_jwt_identity, get_jwt
import bcrypt
from functools import wraps
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
import io
import zipfile

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

@app.route('/api/login', methods=['POST'])
def login():
    return login_admin()

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

def generate_filled_pdf(original_pdf_path, filled_data, schema, submitter_email=None, submitted_at=None):
    """
    Generate a filled PDF by overlaying form data onto the original PDF.
    For now, creates a simple PDF with the form data.
    """
    try:
        # Create a simple PDF with the filled data
        packet = io.BytesIO()
        can = canvas.Canvas(packet, pagesize=letter)
        
        from datetime import datetime

        # Add title
        form_name = schema.get('name', 'Generated Form')
        can.setFont("Helvetica-Bold", 16)
        can.drawString(50, 750, f"Form: {form_name}")

        submitted_dt = submitted_at if isinstance(submitted_at, datetime) else datetime.now()
        can.setFont("Helvetica", 10)
        if submitter_email:
            can.drawString(50, 735, f"Submitter Email: {submitter_email}")
            can.drawString(50, 720, f"Submitted: {submitted_dt.strftime('%Y-%m-%d %H:%M:%S')}")
            y_position = 695
        else:
            can.drawString(50, 730, f"Submitted: {submitted_dt.strftime('%Y-%m-%d %H:%M:%S')}")
            y_position = 700
        
        # Add admin instructions if present
        admin_text = schema.get('adminText')
        if admin_text:
            can.setFont("Helvetica-Oblique", 9)
            can.drawString(50, y_position, "Instructions:")
            y_position -= 12
            
            # Wrap long text
            max_width = 500
            words = admin_text.split()
            lines = []
            current_line = []
            
            for word in words:
                test_line = ' '.join(current_line + [word])
                if len(test_line) <= 80:  # Approximate character limit
                    current_line.append(word)
                else:
                    if current_line:
                        lines.append(' '.join(current_line))
                        current_line = [word]
                    else:
                        lines.append(word)
            if current_line:
                lines.append(' '.join(current_line))
            
            for line in lines:
                if y_position < 100:
                    can.showPage()
                    y_position = 750
                    can.setFont("Helvetica-Oblique", 9)
                can.drawString(50, y_position, line)
                y_position -= 12
            
            y_position -= 10  # Extra spacing after instructions

        # Add form data
        line_height = 16
        label_value_gap = 6
        left_x = 50
        value_max_width = 520
        
        field_index = 0
        for section in schema.get('sections', []):
            section_title = (section.get('title') or '').strip()
            if section_title:
                can.setFont("Helvetica-Bold", 12)
                can.drawString(left_x, y_position, section_title)
                y_position -= line_height
            
            # Add fields
            can.setFont("Helvetica", 10)
            for field in section.get('fields', []):
                submitted_item = filled_data[field_index] if field_index < len(filled_data) else None
                if isinstance(submitted_item, dict):
                    field_value = submitted_item.get('value', '')
                else:
                    field_value = ''
                label = field.get('label', f'Field {field_index + 1}')
                required = field.get('required', False)

                # Draw label (bold) + value (normal) with consistent spacing
                can.setFont("Helvetica-Bold", 10)
                label_text = f"{label}:"
                can.drawString(left_x, y_position, label_text)
                label_width = can.stringWidth(label_text, "Helvetica-Bold", 10)

                can.setFont("Helvetica", 10)
                value_text = field_value if field_value is not None else ''
                if required and not value_text:
                    value_text = f"{value_text} (REQUIRED)".strip()

                # Simple wrapping for long values
                start_x = left_x + label_width + label_value_gap
                max_chars = max(10, int((value_max_width - (start_x - left_x)) / 6))
                value_lines = [value_text] if len(str(value_text)) <= max_chars else []
                if not value_lines:
                    import textwrap
                    value_lines = textwrap.wrap(str(value_text), width=max_chars) or ['']

                for i, line in enumerate(value_lines):
                    if i == 0:
                        can.drawString(start_x, y_position, line)
                    else:
                        y_position -= line_height
                        can.drawString(start_x, y_position, line)

                y_position -= line_height
                field_index += 1
                
                # Page break if we're running out of space
                if y_position < 100:
                    can.showPage()
                    y_position = 750
                    can.setFont("Helvetica", 10)
            
            if section_title:
                y_position -= 6
        
        can.save()
        
        # Move to the beginning of the StringIO buffer
        packet.seek(0)
        
        # Create a new PDF with the generated content (do NOT include original PDF pages)
        new_pdf = PdfReader(packet)
        output = PdfWriter()
        for page in new_pdf.pages:
            output.add_page(page)
        
        # Save the result
        output_stream = io.BytesIO()
        output.write(output_stream)
        output_stream.seek(0)
        
        return output_stream.getvalue()
        
    except Exception as e:
        print(f"Error generating PDF: {str(e)}")
        traceback.print_exc()
        return None

@app.route('/api/forms/upload', methods=['POST'])
@admin_required
def upload_pdf():
    try:
        form_name = request.form.get('form_name')
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
        cursor.execute(
            "INSERT INTO forms (admin_id, original_pdf_path, status) VALUES (%s, %s, 'draft') RETURNING id",
            (flask_g.user['id'], filepath),
        )
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
        if form_name:
            schema['name'] = form_name

        # Update form with schema
        cursor.execute("UPDATE forms SET form_schema = %s WHERE id = %s", (json.dumps(schema), form_id))
        conn.commit()

        cursor.close()
        conn.close()
        return jsonify({"form_id": str(form_id), "status": "draft", "message": "PDF uploaded and processed successfully"}), 201
    except Exception as e:
        print("Error in upload:", str(e))
        print(traceback.format_exc())
        return jsonify({"error": "Internal server error: " + str(e)}), 500


@app.route('/api/forms/<uuid:form_id>/activate', methods=['POST'])
@admin_required
def activate_form(form_id):
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)

    cursor.execute("SELECT id, admin_id, status, public_slug FROM forms WHERE id = %s", (str(form_id),))
    form = cursor.fetchone()
    if not form:
        cursor.close()
        conn.close()
        return jsonify({"error": "Form not found"}), 404

    if str(form['admin_id']) != str(flask_g.user['id']):
        cursor.close()
        conn.close()
        return jsonify({"error": "Forbidden"}), 403

    if form['status'] == 'active' and form.get('public_slug'):
        cursor.close()
        conn.close()
        return jsonify({"public_slug": form['public_slug'], "status": "active"}), 200

    # Generate unique slug
    slug = None
    for _ in range(10):
        candidate = secrets.token_urlsafe(16)
        cursor.execute("SELECT 1 FROM forms WHERE public_slug = %s", (candidate,))
        if not cursor.fetchone():
            slug = candidate
            break
    if not slug:
        cursor.close()
        conn.close()
        return jsonify({"error": "Failed to generate unique slug"}), 500

    cursor.execute(
        "UPDATE forms SET public_slug = %s, status = 'active' WHERE id = %s",
        (slug, str(form_id)),
    )
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({"public_slug": slug, "status": "active"}), 200


@app.route('/api/forms/<uuid:form_id>/deactivate', methods=['POST'])
@admin_required
def deactivate_form(form_id):
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)

    cursor.execute("SELECT id, admin_id FROM forms WHERE id = %s", (str(form_id),))
    form = cursor.fetchone()
    if not form:
        cursor.close()
        conn.close()
        return jsonify({"error": "Form not found"}), 404

    if str(form['admin_id']) != str(flask_g.user['id']):
        cursor.close()
        conn.close()
        return jsonify({"error": "Forbidden"}), 403

    cursor.execute("UPDATE forms SET status = 'inactive' WHERE id = %s", (str(form_id),))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({"status": "inactive"}), 200


@app.route('/api/forms', methods=['GET'])
@admin_required
def list_forms():
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    cursor.execute(
        "SELECT id, status, public_slug, created_at, form_schema->>'name' AS name FROM forms WHERE admin_id = %s ORDER BY created_at DESC",
        (str(flask_g.user['id']),),
    )
    forms = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify({"forms": forms}), 200


@app.route('/api/forms', methods=['POST'])
@admin_required
def create_form():
    data = request.get_json() or {}
    name = (data.get('name') or '').strip()
    schema = data.get('schema')

    if schema is not None and not isinstance(schema, dict):
        return jsonify({"error": "Invalid schema"}), 400

    if not schema:
        schema = {
            "name": name or "Untitled Form",
            "adminText": "",
            "sections": [],
        }
    else:
        if name:
            schema['name'] = name
        schema.setdefault('adminText', "")
        schema.setdefault('sections', [])

    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cursor.execute(
            "INSERT INTO forms (admin_id, status, form_schema) VALUES (%s, %s, %s) RETURNING id",
            (str(flask_g.user['id']), 'inactive', json.dumps(schema)),
        )
        row = cursor.fetchone()
        conn.commit()
        form_id = row['id'] if isinstance(row, dict) else row[0]
        cursor.close()
        conn.close()
        return jsonify({"form_id": str(form_id), "schema": schema, "status": "inactive"}), 201
    except Exception as e:
        conn.rollback()
        cursor.close()
        conn.close()
        return jsonify({"error": "Create form failed", "details": str(e)}), 500


@app.route('/api/forms/<uuid:form_id>/schema', methods=['PUT'])
@admin_required
def update_form_schema(form_id):
    data = request.get_json() or {}
    schema = data.get('schema')
    if not isinstance(schema, dict):
        return jsonify({"error": "Invalid schema"}), 400

    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    cursor.execute("SELECT id, admin_id FROM forms WHERE id = %s", (str(form_id),))
    form = cursor.fetchone()
    if not form:
        cursor.close()
        conn.close()
        return jsonify({"error": "Form not found"}), 404

    if str(form['admin_id']) != str(flask_g.user['id']):
        cursor.close()
        conn.close()
        return jsonify({"error": "Forbidden"}), 403

    cursor.execute("UPDATE forms SET form_schema = %s WHERE id = %s", (json.dumps(schema), str(form_id)))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({"message": "Schema updated"}), 200

@app.route('/api/forms/<uuid:form_id>', methods=['GET'])
@admin_required
def get_form(form_id):
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    cursor.execute(
        "SELECT id, admin_id, form_schema, public_slug, status FROM forms WHERE id = %s",
        (str(form_id),),
    )
    form = cursor.fetchone()
    cursor.close()
    conn.close()
    if not form:
        return jsonify({"error": "Form not found"}), 404
    if str(form['admin_id']) != str(flask_g.user['id']):
        return jsonify({"error": "Forbidden"}), 403
    schema = form.get('form_schema')
    if isinstance(schema, str):
        try:
            schema = json.loads(schema)
        except Exception:
            schema = None
    return jsonify({
        "form_id": str(form['id']),
        "schema": schema,
        "public_slug": form.get('public_slug'),
        "status": form.get('status'),
    }), 200


@app.route('/api/forms/<uuid:form_id>', methods=['DELETE'])
@admin_required
def delete_form(form_id):
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)

    try:
        cursor.execute(
            "SELECT id, admin_id, original_pdf_path FROM forms WHERE id = %s",
            (str(form_id),),
        )
        form = cursor.fetchone()
        if not form:
            cursor.close()
            conn.close()
            return jsonify({"error": "Form not found"}), 404

        if str(form['admin_id']) != str(flask_g.user['id']):
            cursor.close()
            conn.close()
            return jsonify({"error": "Forbidden"}), 403

        cursor.execute(
            "SELECT generated_pdf_path FROM submissions WHERE form_id = %s",
            (str(form_id),),
        )
        submission_rows = cursor.fetchall() or []
        pdf_paths = [r.get('generated_pdf_path') for r in submission_rows if r.get('generated_pdf_path')]
        original_pdf_path = form.get('original_pdf_path')

        cursor.execute("DELETE FROM submissions WHERE form_id = %s", (str(form_id),))
        cursor.execute("DELETE FROM forms WHERE id = %s", (str(form_id),))
        conn.commit()

        cursor.close()
        conn.close()

        for path in pdf_paths:
            try:
                if path and os.path.exists(path):
                    os.remove(path)
            except Exception:
                pass

        try:
            if original_pdf_path and os.path.exists(original_pdf_path):
                os.remove(original_pdf_path)
        except Exception:
            pass

        return jsonify({"message": "Form deleted"}), 200

    except Exception as e:
        conn.rollback()
        cursor.close()
        conn.close()
        return jsonify({"error": "Delete failed", "details": str(e)}), 500


@app.route('/api/public/forms/<slug>', methods=['GET'])
def get_public_form(slug):
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    cursor.execute("SELECT id, form_schema, status FROM forms WHERE public_slug = %s", (slug,))
    form = cursor.fetchone()
    cursor.close()
    conn.close()

    if not form:
        return jsonify({"error": "Form not found"}), 404

    if form['status'] != 'active':
        return jsonify({"error": "Form has expired"}), 403

    schema = form.get('form_schema')
    if isinstance(schema, str):
        try:
            schema = json.loads(schema)
        except Exception:
            schema = None
    return jsonify({"form_id": str(form['id']), "schema": schema}), 200


@app.route('/api/forms/<uuid:form_id>/submissions', methods=['GET'])
@admin_required
def list_submissions(form_id):
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)

    cursor.execute("SELECT id, admin_id FROM forms WHERE id = %s", (str(form_id),))
    form = cursor.fetchone()
    if not form:
        cursor.close()
        conn.close()
        return jsonify({"error": "Form not found"}), 404

    if str(form['admin_id']) != str(flask_g.user['id']):
        cursor.close()
        conn.close()
        return jsonify({"error": "Forbidden"}), 403

    cursor.execute(
        "SELECT id, filled_data, submitted_at, generated_pdf_path, submitter_email FROM submissions WHERE form_id = %s ORDER BY submitted_at DESC",
        (str(form_id),),
    )
    submissions = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify({"submissions": submissions}), 200

@app.route('/api/migrate', methods=['POST'])
@admin_required
def run_migration():
    """Apply database migrations"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Read and execute migration file
        with open('migration_add_submitter_email.sql', 'r') as f:
            migration_sql = f.read()
        
        # Execute each statement separately
        statements = migration_sql.split(';')
        for statement in statements:
            statement = statement.strip()
            if statement:
                cursor.execute(statement)
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({"message": "Migration applied successfully"}), 200
        
    except Exception as e:
        return jsonify({"error": "Migration failed", "details": str(e)}), 500

@app.route('/api/forms/<uuid:form_id>/submit', methods=['POST'])
def submit_form(form_id):
    data = request.get_json() or {}
    filled_data = data.get('filled_data', [])
    submitter_email = data.get('email', '').strip().lower()
    
    # Validate email
    if not submitter_email or '@' not in submitter_email:
        return jsonify({"error": "Valid email address is required"}), 400
    
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        # Get form details and schema
        cursor.execute("SELECT original_pdf_path, form_schema FROM forms WHERE id = %s", (str(form_id),))
        form = cursor.fetchone()
        
        if not form:
            cursor.close()
            conn.close()
            return jsonify({"error": "Form not found"}), 404
        
        # Check for duplicate submission with same email
        cursor.execute(
            "SELECT id FROM submissions WHERE form_id = %s AND submitter_email = %s LIMIT 1",
            (str(form_id), submitter_email)
        )
        existing_submission = cursor.fetchone()
        
        if existing_submission:
            cursor.close()
            conn.close()
            return jsonify({"error": "A submission with this email address already exists for this form"}), 409
        
        from datetime import datetime
        submitted_at = datetime.now()

        # Generate PDF
        pdf_content = generate_filled_pdf(
            form['original_pdf_path'],
            filled_data,
            form['form_schema'],
            submitter_email=submitter_email,
            submitted_at=submitted_at,
        )
        
        # Save PDF file
        pdf_filename = f"submission_{uuid.uuid4()}.pdf"
        pdf_path = os.path.join(app.config['UPLOAD_FOLDER'], pdf_filename)
        
        with open(pdf_path, 'wb') as f:
            f.write(pdf_content)
        
        # Store submission with email and PDF path
        cursor.execute(
            "INSERT INTO submissions (form_id, filled_data, generated_pdf_path, submitter_email, submitted_at) VALUES (%s, %s, %s, %s, %s)",
            (str(form_id), json.dumps(filled_data), pdf_path, submitter_email, submitted_at),
        )
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({"message": "Submission successful", "pdf_generated": True}), 201
        
    except Exception as e:
        conn.rollback()
        cursor.close()
        conn.close()
        return jsonify({"error": "Submission failed", "details": str(e)}), 500

@app.route('/api/submissions/<uuid:submission_id>/download', methods=['GET'])
@admin_required
def download_submission_pdf(submission_id):
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        # Get submission details with form info
        cursor.execute("""
            SELECT s.id, s.form_id, s.generated_pdf_path, s.submitted_at, f.admin_id, f.form_schema
            FROM submissions s
            JOIN forms f ON s.form_id = f.id
            WHERE s.id = %s
        """, (str(submission_id),))
        
        submission = cursor.fetchone()
        
        if not submission:
            cursor.close()
            conn.close()
            return jsonify({"error": "Submission not found"}), 404
        
        # Check admin ownership
        if str(submission['admin_id']) != str(flask_g.user['id']):
            cursor.close()
            conn.close()
            return jsonify({"error": "Forbidden"}), 403
        
        # Check if PDF exists
        if not submission['generated_pdf_path'] or not os.path.exists(submission['generated_pdf_path']):
            cursor.close()
            conn.close()
            return jsonify({"error": "PDF not available"}), 404
        
        # Get form name for filename
        form_name = submission['form_schema'].get('name', 'form')
        safe_name = secure_filename(form_name)
        filename = f"{safe_name}_submission_{submission_id}.pdf"
        
        cursor.close()
        conn.close()
        
        return send_file(
            submission['generated_pdf_path'],
            as_attachment=True,
            download_name=filename,
            mimetype='application/pdf'
        )
        
    except Exception as e:
        cursor.close()
        conn.close()
        return jsonify({"error": "Download failed", "details": str(e)}), 500


@app.route('/api/submissions/<uuid:submission_id>', methods=['DELETE'])
@admin_required
def delete_submission(submission_id):
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)

    try:
        cursor.execute(
            """
            SELECT s.id, s.form_id, s.generated_pdf_path, f.admin_id
            FROM submissions s
            JOIN forms f ON s.form_id = f.id
            WHERE s.id = %s
            """,
            (str(submission_id),),
        )
        submission = cursor.fetchone()
        if not submission:
            cursor.close()
            conn.close()
            return jsonify({"error": "Submission not found"}), 404

        if str(submission['admin_id']) != str(flask_g.user['id']):
            cursor.close()
            conn.close()
            return jsonify({"error": "Forbidden"}), 403

        pdf_path = submission.get('generated_pdf_path')
        cursor.execute("DELETE FROM submissions WHERE id = %s", (str(submission_id),))
        conn.commit()

        cursor.close()
        conn.close()

        try:
            if pdf_path and os.path.exists(pdf_path):
                os.remove(pdf_path)
        except Exception:
            pass

        return jsonify({"message": "Submission deleted"}), 200

    except Exception as e:
        conn.rollback()
        cursor.close()
        conn.close()
        return jsonify({"error": "Delete failed", "details": str(e)}), 500


@app.route('/api/submissions/bulk-download', methods=['POST'])
@admin_required
def bulk_download_submissions():
    data = request.get_json() or {}
    submission_ids = data.get('submission_ids')

    if not isinstance(submission_ids, list) or not submission_ids:
        return jsonify({"error": "submission_ids must be a non-empty list"}), 400

    submission_ids = [str(sid) for sid in submission_ids]

    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)

    try:
        cursor.execute(
            """
            SELECT s.id, s.generated_pdf_path, s.submitted_at, s.submitter_email,
                   f.admin_id, f.form_schema
            FROM submissions s
            JOIN forms f ON s.form_id = f.id
            WHERE s.id = ANY(%s::uuid[])
            """,
            (submission_ids,),
        )
        rows = cursor.fetchall() or []
        cursor.close()
        conn.close()

        if len(rows) != len(set(submission_ids)):
            return jsonify({"error": "One or more submissions not found"}), 404

        for r in rows:
            if str(r.get('admin_id')) != str(flask_g.user['id']):
                return jsonify({"error": "Forbidden"}), 403

        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, mode='w', compression=zipfile.ZIP_DEFLATED) as zf:
            for r in rows:
                pdf_path = r.get('generated_pdf_path')
                if not pdf_path or not os.path.exists(pdf_path):
                    return jsonify({"error": "One or more PDFs not available"}), 404

                form_schema = r.get('form_schema')
                if isinstance(form_schema, str):
                    try:
                        form_schema = json.loads(form_schema)
                    except Exception:
                        form_schema = {}

                form_name = (form_schema or {}).get('name', 'form')
                safe_form_name = secure_filename(form_name) or 'form'
                email = r.get('submitter_email') or 'anonymous'
                safe_email = secure_filename(email) or 'anonymous'

                sid = str(r.get('id'))
                filename = f"{safe_form_name}_{safe_email}_{sid}.pdf"
                try:
                    with open(pdf_path, 'rb') as f:
                        zf.writestr(filename, f.read())
                except Exception:
                    return jsonify({"error": "Failed to read one or more PDFs"}), 500

        zip_buffer.seek(0)
        return send_file(
            zip_buffer,
            as_attachment=True,
            download_name='submissions.zip',
            mimetype='application/zip',
        )

    except Exception as e:
        try:
            cursor.close()
            conn.close()
        except Exception:
            pass
        return jsonify({"error": "Bulk download failed", "details": str(e)}), 500


@app.route('/api/submissions/bulk-delete', methods=['POST'])
@admin_required
def bulk_delete_submissions():
    data = request.get_json() or {}
    submission_ids = data.get('submission_ids')

    if not isinstance(submission_ids, list) or not submission_ids:
        return jsonify({"error": "submission_ids must be a non-empty list"}), 400

    submission_ids = [str(sid) for sid in submission_ids]

    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)

    try:
        cursor.execute(
            """
            SELECT s.id, s.generated_pdf_path, f.admin_id
            FROM submissions s
            JOIN forms f ON s.form_id = f.id
            WHERE s.id = ANY(%s::uuid[])
            """,
            (submission_ids,),
        )
        rows = cursor.fetchall() or []

        if len(rows) != len(set(submission_ids)):
            cursor.close()
            conn.close()
            return jsonify({"error": "One or more submissions not found"}), 404

        for r in rows:
            if str(r.get('admin_id')) != str(flask_g.user['id']):
                cursor.close()
                conn.close()
                return jsonify({"error": "Forbidden"}), 403

        pdf_paths = [r.get('generated_pdf_path') for r in rows if r.get('generated_pdf_path')]
        cursor.execute("DELETE FROM submissions WHERE id = ANY(%s::uuid[])", (submission_ids,))
        conn.commit()
        cursor.close()
        conn.close()

        deleted_files = 0
        for path in pdf_paths:
            try:
                if path and os.path.exists(path):
                    os.remove(path)
                    deleted_files += 1
            except Exception:
                pass

        return jsonify({"message": "Submissions deleted", "deleted": len(rows), "deleted_files": deleted_files}), 200

    except Exception as e:
        conn.rollback()
        try:
            cursor.close()
            conn.close()
        except Exception:
            pass
        return jsonify({"error": "Bulk delete failed", "details": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='127.0.0.1', port=8000)
