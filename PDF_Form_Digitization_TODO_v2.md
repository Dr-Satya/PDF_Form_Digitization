# PDF Form Digitization -- TODO Roadmap (Version 2)

------------------------------------------------------------------------

# PHASE 1 -- Authentication & Role System

## Admin Authentication

-   [x] Implement admin registration
-   [x] Implement login with JWT
-   [x] Hash passwords (bcrypt)
-   [x] Create role-based middleware

Acceptance Criteria: - Admin receives JWT on login - Unauthorized users
blocked - Passwords stored securely

------------------------------------------------------------------------

# PHASE 2 -- Database Updates

-   [x] Add role column to Users
-   [x] Add admin_id to Forms
-   [x] Add public_slug to Forms
-   [ ] Add Generated_PDFs table
-   [x] Add ENUM status (draft, active, inactive)

Acceptance Criteria: - Foreign keys enforced - Slugs unique - Migration
successful

------------------------------------------------------------------------

# PHASE 3 -- Admin Form Lifecycle

## Upload & Draft Creation

-   [ ] Admin-only upload endpoint
-   [ ] Save form as DRAFT
-   [ ] Associate form with admin_id

Acceptance Criteria: - Only logged-in admin can upload - Draft not
publicly accessible

------------------------------------------------------------------------

## Generate & Activate Public URL

-   [ ] Generate secure slug (16+ chars)
-   [ ] Save slug in DB
-   [ ] Activate form

Acceptance Criteria: - Unique slug generated - Public URL accessible
only if ACTIVE

------------------------------------------------------------------------

# PHASE 4 -- Public Form Submission

## Public Form Rendering

-   [ ] Fetch form by slug
-   [ ] Validate ACTIVE status
-   [ ] Render dynamic schema

Acceptance Criteria: - Inactive forms return 404 - Active form renders
successfully

------------------------------------------------------------------------

## Store Public Submission

-   [ ] Save filled_data in Submissions
-   [ ] Associate submission with form_id
-   [ ] No auto PDF generation

Acceptance Criteria: - Submission stored - No PDF created automatically

------------------------------------------------------------------------

# PHASE 5 -- Admin Submission Management

## View Submissions

-   [ ] List submissions per form
-   [ ] Ensure admin ownership validation

Acceptance Criteria: - Admin sees only own submissions - 403 on
unauthorized access

------------------------------------------------------------------------

## Manual PDF Generation

-   [ ] Generate PDF from submission
-   [ ] Store generated file path
-   [ ] Create Generated_PDFs record

Acceptance Criteria: - PDF generated only when admin triggers - File
downloadable securely

------------------------------------------------------------------------

# PHASE 6 -- Access Control Hardening

-   [ ] Prevent IDOR vulnerabilities
-   [ ] Enforce admin ownership checks
-   [ ] Add rate limiting to public endpoints

Acceptance Criteria: - Changing IDs manually does not expose data -
Proper 403 responses returned

------------------------------------------------------------------------

# PHASE 7 -- OCR & ML Integration

-   [ ] Trigger OCR only during admin upload
-   [ ] Integrate ML-assisted field detection
-   [ ] Allow admin schema editing

Acceptance Criteria: - Public users never trigger OCR/ML - Field
detection accuracy improved - Admin can adjust schema before activation

------------------------------------------------------------------------

End of TODO Roadmap v2.
