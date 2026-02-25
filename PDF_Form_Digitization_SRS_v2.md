# PDF Form Digitization & Workflow Application

## Software Requirements Specification (SRS) -- Version 2 (Admin + Public Users)

------------------------------------------------------------------------

# 1. System Overview

This is a cloud-based PDF Form Digitization and Workflow Application
supporting two user types:

1.  Admin User
2.  Public User (Anonymous Form Filler)

The system allows admins to upload PDFs, convert them into online forms,
publish them via unique URLs, collect submissions, and generate filled
PDFs from submitted data.

------------------------------------------------------------------------

# 2. User Roles

## 2.1 Admin User

Capabilities:

-   Register / Login
-   Upload PDF
-   Trigger form extraction (Digital + OCR + ML)
-   Edit generated form schema
-   Save form
-   Generate unique public URL
-   View submissions
-   Generate filled PDFs (manual trigger)
-   Download generated PDFs
-   Activate / Deactivate forms

------------------------------------------------------------------------

## 2.2 Public User

Capabilities:

-   Access form via unique public URL
-   Fill in fields
-   Submit form

Restrictions:

-   Cannot view other submissions
-   Cannot generate PDFs
-   Cannot edit schema
-   No authentication required

------------------------------------------------------------------------

# 3. Functional Requirements

## 3.1 Admin Authentication

-   JWT-based authentication
-   Password hashing (bcrypt)
-   Role-based access control middleware

Acceptance Criteria: - Admin login returns valid JWT - Unauthorized
access blocked (401/403)

------------------------------------------------------------------------

## 3.2 Form Creation Workflow

1.  Admin uploads PDF
2.  System extracts fields (PyPDF2 / OCR / ML)
3.  Admin reviews and edits schema
4.  Admin saves form
5.  System generates secure public_slug
6.  Form status set to ACTIVE

------------------------------------------------------------------------

## 3.3 Public Form Access

Public URL format:

    https://app.com/forms/{public_slug}

System must: - Validate form status is ACTIVE - Render dynamic schema -
Accept submission

------------------------------------------------------------------------

## 3.4 Submission Handling

-   Store submission data
-   Associate with form_id
-   DO NOT auto-generate PDF

------------------------------------------------------------------------

## 3.5 Admin PDF Generation

Admin must manually: - Select submission - Trigger PDF generation -
Download generated PDF

------------------------------------------------------------------------

# 4. Database Schema

## Users

-   id (UUID)
-   email (VARCHAR)
-   password_hash (TEXT)
-   role (ENUM: admin)
-   created_at (TIMESTAMP)

## Forms

-   id (UUID)
-   admin_id (UUID FK Users.id)
-   original_pdf_path (TEXT)
-   form_schema (JSONB)
-   public_slug (VARCHAR UNIQUE)
-   status (ENUM: draft, active, inactive)
-   created_at (TIMESTAMP)

## Submissions

-   id (UUID)
-   form_id (UUID FK Forms.id)
-   filled_data (JSONB)
-   submitted_at (TIMESTAMP)

## Generated_PDFs

-   id (UUID)
-   submission_id (UUID FK Submissions.id)
-   generated_pdf_path (TEXT)
-   generated_at (TIMESTAMP)

------------------------------------------------------------------------

# 5. API Endpoints

## Admin Endpoints (Protected)

-   POST /api/admin/login
-   POST /api/admin/forms/upload
-   POST /api/admin/forms/{id}/save
-   GET /api/admin/forms
-   GET /api/admin/forms/{id}/submissions
-   POST /api/admin/submissions/{id}/generate-pdf
-   GET /api/admin/generated/{id}/download

## Public Endpoints

-   GET /api/forms/{public_slug}
-   POST /api/forms/{public_slug}/submit

------------------------------------------------------------------------

# 6. Security Requirements

-   JWT authentication required for admin endpoints
-   Slugs must be random and non-sequential (min 16 chars)
-   Admin can access only their own forms
-   Rate limiting on public submission endpoint
-   HTTPS mandatory

------------------------------------------------------------------------

# 7. Final System Behavior Matrix

  Action             Admin   Public
  ------------------ ------- --------
  Upload PDF         Yes     No
  Edit Schema        Yes     No
  Save Form          Yes     No
  Access Form        Yes     Yes
  Submit Form        No      Yes
  View Submissions   Yes     No
  Generate PDF       Yes     No
  Download PDF       Yes     No

------------------------------------------------------------------------

End of SRS v2.
