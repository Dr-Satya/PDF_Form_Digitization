# PDF Form Digitization & Workflow Application

## Software Requirements Specification (SRS) -- Version 2 (Admin + Public Users)

------------------------------------------------------------------------

# 1. System Overview

This is a cloud-based PDF Form Digitization and Workflow Application
supporting three user types:

1.  App Administrator (Superuser)
2.  Admin User
3.  Public User (Anonymous Form Filler)

The system allows admins to upload PDFs, convert them into online forms,
publish them via unique URLs, collect submissions, and generate filled
PDFs from submitted data.

------------------------------------------------------------------------

# 2. User Roles

## 2.1 App Administrator (Superuser)

Capabilities:

-   Login (JWT)
-   Create admin users
-   List admin users
-   Modify admin email
-   Reset admin passwords

Notes:

-   Admin creation is restricted to App Administrator.
-   A one-time bootstrap script is used to create the first app admin.

------------------------------------------------------------------------

## 2.2 Admin User

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
-   Delete forms
-   Delete submissions
-   Bulk download selected submission PDFs (ZIP)
-   Bulk delete selected submissions

------------------------------------------------------------------------

## 2.3 Public User

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
-   Legal acceptance required for Admin registration (Privacy Policy + Terms of Use)

Acceptance Criteria: - Admin login returns valid JWT - Unauthorized
access blocked (401/403)

App Administrator Authentication:

-   JWT-based authentication
-   Role-based access control middleware (`app_admin`)

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

Public URL format (frontend):

    http://localhost:3000/public/{public_slug}

Public API route:

    GET http://localhost:8000/api/public/forms/{public_slug}

System must: - Validate form status is ACTIVE - Render dynamic schema -
Accept submission

------------------------------------------------------------------------

## 3.4 Submission Handling

-   Store submission data
-   Associate with form_id
-   Generate filled PDF on successful submission
-   Store generated PDF path with submission
-   Require submitter email (mandatory field)
-   Prevent duplicate submissions per form by email
-   Legal acceptance required for Public submission (Privacy Policy + Terms of Use)
-   System must preserve acceptance records per Admin user and per Public submission

------------------------------------------------------------------------

## 3.5 Admin PDF Generation

Admin can: - Select submission - Download generated PDF

Bulk operations:

-   Download multiple submissions as a single ZIP
-   Delete multiple submissions in one operation

------------------------------------------------------------------------

## 3.6 Legal Acceptance (Privacy Policy + Terms of Use)

The system must require users to accept the Privacy Policy and Terms of Use before:

-   Creating an Admin account
-   Submitting a Public form

Backend enforcement:

-   Admin registration requests must include:
    -   `accept_legal = true`
    -   `policy_version` (string)
-   Public form submission requests must include:
    -   `accept_legal = true`
    -   `policy_version` (string)

Acceptance record storage:

-   The system must store acceptance records in the database, including:
    -   Actor type (`admin` / `public`)
    -   User ID (for Admin registrations)
    -   Form ID + submission ID (for Public submissions)
    -   Email (for Public submissions)
    -   Policy version
    -   Timestamp

Acceptance Criteria:

-   Admin registration is rejected if legal acceptance is not provided.
-   Public submission is rejected if legal acceptance is not provided.
-   Acceptance records are persisted in the database.

------------------------------------------------------------------------

# 4. Database Schema

## Users

-   id (UUID)
-   email (VARCHAR)
-   password_hash (TEXT)
-   role (ENUM: app_admin, admin, public)
-   created_at (TIMESTAMP) (optional)

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
-   generated_pdf_path (TEXT)
-   submitter_email (VARCHAR)
-   submitted_at (TIMESTAMP)

## Legal Acceptances

-   id (UUID)
-   actor_type (VARCHAR: admin, public)
-   user_id (UUID FK Users.id) (nullable)
-   form_id (UUID FK Forms.id) (nullable)
-   submission_id (UUID) (nullable)
-   email (VARCHAR) (nullable)
-   policy_version (TEXT)
-   accepted_at (TIMESTAMP)

------------------------------------------------------------------------

# 5. API Endpoints

## App Administrator Endpoints (Protected)

-   POST /api/app-admin/login
-   GET /api/app-admin/admins
-   POST /api/app-admin/admins
-   PUT /api/app-admin/admins/{admin_id}
-   POST /api/app-admin/admins/{admin_id}/reset-password

## Admin Endpoints (Protected)

-   POST /api/admin/login
-   POST /api/admin/register (Admin self-registration)

-   GET /api/forms
-   POST /api/forms (create blank form)
-   GET /api/forms/{form_id}
-   PUT /api/forms/{form_id}/schema
-   POST /api/forms/{form_id}/activate
-   POST /api/forms/{form_id}/deactivate
-   DELETE /api/forms/{form_id}

-   POST /api/forms/upload
-   GET /api/forms/{form_id}/submissions

-   GET /api/submissions/{submission_id}/download
-   DELETE /api/submissions/{submission_id}

-   POST /api/submissions/bulk-download
-   POST /api/submissions/bulk-delete

## Public Endpoints

-   GET /api/public/forms/{public_slug}
-   POST /api/forms/{form_id}/submit

------------------------------------------------------------------------

# 6. Security Requirements

-   JWT authentication required for admin endpoints
-   JWT authentication required for app administrator endpoints
-   Slugs must be random and non-sequential (min 16 chars)
-   Admin can access only their own forms
-   Rate limiting on public submission endpoint
-   HTTPS mandatory

------------------------------------------------------------------------

# 7. UI / UX Requirements (Implemented)

-   Modern admin dashboard layout with sidebar navigation
-   Public forms render with professional card layout
-   Legal page route:
    -   `/legal` (Privacy Policy + Terms of Use summary with link to full documentation)
-   Legal acceptance UI:
    -   Admin registration requires checkbox acceptance (links to `/legal`)
    -   Public submission requires checkbox acceptance (links to `/legal`)
-   Branding:
    -   Pragyanovation logo on admin, app-admin, and public pages
    -   Global footer: "© 2026 Pragaynovation AI Tech LLP. All rights reserved."

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
