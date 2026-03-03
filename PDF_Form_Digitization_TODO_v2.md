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

-   [x] Admin-only upload endpoint
-   [x] Save form as DRAFT
-   [x] Associate form with admin_id

Acceptance Criteria: - Only logged-in admin can upload - Draft not
publicly accessible

------------------------------------------------------------------------

## Generate & Activate Public URL

-   [x] Generate secure slug (16+ chars)
-   [x] Save slug in DB
-   [x] Activate form

Acceptance Criteria: - Unique slug generated - Public URL accessible
only if ACTIVE

------------------------------------------------------------------------

## Admin Persistence (Re-login)

-   [x] List forms owned by admin
-   [x] Admin can reload a previously created form and view its submissions

------------------------------------------------------------------------

# PHASE 4 -- Public Form Submission

## Public Form Rendering

-   [x] Fetch form by slug
-   [x] Validate ACTIVE status
-   [x] Render dynamic schema

Acceptance Criteria: - Inactive forms return 404 - Active form renders
successfully

------------------------------------------------------------------------

## Store Public Submission

-   [x] Save filled_data in Submissions
-   [x] Associate submission with form_id
-   [x] Auto PDF generation on submission

Acceptance Criteria: - Submission stored - PDF created automatically

------------------------------------------------------------------------

# PHASE 5 -- Admin Submission Management

## View Submissions

-   [x] List submissions per form
-   [x] Ensure admin ownership validation

Acceptance Criteria: - Admin sees only own submissions - 403 on
unauthorized access

------------------------------------------------------------------------

## Manual PDF Generation

-   [x] Generate PDF from submission
-   [x] Store generated file path
-   [x] Create download endpoint

Acceptance Criteria: - PDF generated on submission - File downloadable securely

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
-   [x] Allow admin schema editing
-   [x] Allow admin to name forms

Acceptance Criteria: - Public users never trigger OCR/ML - Field
detection accuracy improved - Admin can adjust schema before activation

------------------------------------------------------------------------

# PHASE 7.5 -- Enhanced Form Editor Features

## Admin Instructions System
-   [x] Add custom instructions text field
-   [x] Display instructions on web forms
-   [x] Include instructions in generated PDFs
-   [x] Text wrapping for long instructions

Acceptance Criteria: - Admin can add custom guidance - Instructions appear prominently - Instructions included in PDF exports

------------------------------------------------------------------------

## Dynamic Section Management
-   [x] Edit section titles inline
-   [x] Add new sections dynamically
-   [x] Delete sections with confirmation
-   [x] Auto-number new sections

Acceptance Criteria: - Section titles are editable - Sections can be added/removed - Form structure remains valid

------------------------------------------------------------------------

## Field Management System
-   [x] Edit field labels inline
-   [x] Add new fields to sections
-   [x] Delete individual fields
-   [x] Toggle required/optional status
-   [x] Auto-number new fields

Acceptance Criteria: - Field labels are editable - Fields can be added/removed - Required status can be toggled

------------------------------------------------------------------------

## Enhanced PDF Generation
-   [x] Include admin instructions in PDF
-   [x] Proper text formatting and wrapping
-   [x] Multi-page support for long content
-   [x] Improved PDF layout and styling

Acceptance Criteria: - Generated PDFs contain admin instructions - Long text wraps properly - PDF formatting is clean

------------------------------------------------------------------------

## User Interface Improvements
-   [x] Color-coded action buttons
-   [x] Intuitive form editor layout
-   [x] Responsive design elements
-   [x] Clear visual feedback

Acceptance Criteria: - Actions are visually distinct - Interface is easy to navigate - Works on different screen sizes

------------------------------------------------------------------------

End of TODO Roadmap v2.
