# PDF Form Digitization Application -- Implementation TODO Roadmap

Derived from the Software Requirements Specification.

------------------------------------------------------------------------

# 🟢 PHASE 1 --- Foundation & Core Infrastructure (Easy)

## ✅ 1. Project Setup (Frontend + Backend)

-   [x] Initialize React project
-   [x] Initialize Flask/Django backend
-   [x] Setup PostgreSQL database
-   [x] Configure environment variables
-   [x] Setup Docker for local development

### Acceptance Criteria

-   Frontend runs on localhost:3000
-   Backend API runs on localhost:8000
-   Backend connects successfully to PostgreSQL
-   Health check endpoint `/api/health` returns 200 OK
-   Docker compose runs all services successfully

------------------------------------------------------------------------

## ✅ 2. Database Schema Implementation

-   [x] Create Users table
-   [x] Create Forms table
-   [x] Create Submissions table
-   [x] Add migrations support

### Acceptance Criteria

-   Tables exist in PostgreSQL
-   Foreign key constraints work correctly
-   Migration scripts recreate schema successfully
-   Test records can be inserted

------------------------------------------------------------------------

## ✅ 3. PDF Upload API

-   [x] Create `POST /api/forms/upload`
-   [x] Validate file type (PDF only)
-   [x] Upload file to cloud storage
-   [x] Store file path in Forms table

### Acceptance Criteria

-   Valid PDF upload returns 201 Created
-   Invalid file returns 400 error
-   File stored in bucket
-   Form record created in DB

------------------------------------------------------------------------

## ✅ 4. Basic PDF Preview (Frontend)

-   [x] Integrate pdf.js
-   [x] Render uploaded PDF preview
-   [x] Display loading state

### Acceptance Criteria

-   PDF renders correctly
-   Multi-page PDFs display properly
-   No console errors

------------------------------------------------------------------------

# 🟡 PHASE 2 --- Digital PDF Parsing (Moderate)

## ✅ 5. Digital PDF Text Extraction

-   [x] Extract text using PyPDF2
-   [x] Store extracted text temporarily
-   [x] Log extraction output

### Acceptance Criteria

-   ≥ 90% text accuracy for digital PDFs
-   No crashes on multi-page PDFs

------------------------------------------------------------------------

## ✅ 6. Rule-Based Field Detection

-   [x] Detect labels ending with ":"
-   [x] Generate JSON schema
-   [x] Store schema in DB
-   [x] Allow admin to edit schema (labels + required) and save
-   [x] Allow admin to name forms

### Acceptance Criteria

-   JSON schema generated for sample PDFs
-   Schema stored in JSONB column

------------------------------------------------------------------------

## ✅ 7. Dynamic Form Rendering

-   [x] Fetch schema
-   [x] Render dynamic fields
-   [x] Implement validation

### Acceptance Criteria

-   Form renders based on schema
-   Required fields validated
-   Inputs captured correctly

------------------------------------------------------------------------

## ✅ 8. Basic Form Submission API

-   [x] Store filled_data in Submissions table
-   [x] Record submission timestamp

### Acceptance Criteria

-   Submission stored successfully
-   Submission retrievable via API

------------------------------------------------------------------------

# 🟠 PHASE 3 --- PDF Generation & Workflow

## ✅ 9. Generate Filled PDF

-   [x] Map JSON fields to PDF coordinates
-   [x] Overlay text values
-   [x] Save generated PDF

### Acceptance Criteria

-   Generated PDF contains correct user input
-   File downloadable via API

------------------------------------------------------------------------

## ✅ 10. Download / Export Endpoint

-   [x] Secure download route
-   [x] Validate access permissions

### Acceptance Criteria

-   Download triggers file
-   Unauthorized access blocked

------------------------------------------------------------------------

## ✅ 11. Shareable Form URL

-   [x] Generate unique link
-   [x] Optional expiration support

### Acceptance Criteria

-   Form accessible via public link
-   Expired link returns 403

------------------------------------------------------------------------

## ✅ 12. Submission History UI

-   [x] List submissions
-   [x] View submission details
-   [x] Download PDFs
-   [x] Delete submissions
-   [x] Bulk download selected submissions (ZIP)
-   [x] Bulk delete selected submissions

### Acceptance Criteria

-   Submission list displays correctly
-   Individual submission view works

------------------------------------------------------------------------

# 🟦 PHASE 3.5 --- Enhanced Form Editor & PDF Generation

## ✅ 12.1. Admin Instructions System

-   [x] Add custom instructions text field
-   [x] Display instructions on web forms
-   [x] Include instructions in generated PDFs
-   [x] Text wrapping for long instructions

### Acceptance Criteria

-   Admin can add custom guidance for users
-   Instructions appear prominently on forms
-   Instructions included in PDF exports

------------------------------------------------------------------------

## ✅ 12.2. Dynamic Section Management

-   [x] Edit section titles inline
-   [x] Add new sections dynamically
-   [x] Delete sections with confirmation
-   [x] Auto-number new sections

### Acceptance Criteria

-   Section titles are editable
-   Sections can be added/removed
-   Form structure remains valid after changes

------------------------------------------------------------------------

## ✅ 12.3. Field Management System

-   [x] Edit field labels inline
-   [x] Add new fields to sections
-   [x] Delete individual fields
-   [x] Toggle required/optional status
-   [x] Auto-number new fields

### Acceptance Criteria

-   Field labels are editable
-   Fields can be added/removed dynamically
-   Required status can be toggled
-   Form validation works with dynamic changes

------------------------------------------------------------------------

## ✅ 12.4. Enhanced PDF Generation

-   [x] Include admin instructions in PDF
-   [x] Proper text formatting and wrapping
-   [x] Multi-page support for long content
-   [x] Improved PDF layout and styling

### Acceptance Criteria

-   Generated PDFs contain admin instructions
-   Long text wraps properly
-   PDF formatting is clean and readable

------------------------------------------------------------------------

## ✅ 12.5. User Interface Improvements

-   [x] Color-coded action buttons
-   [x] Intuitive form editor layout
-   [x] Responsive design elements
-   [x] Clear visual feedback
-   [x] Restored public share link route (frontend /public/{slug})
-   [x] Public form styling improvements + visible submit button
-   [x] Branding: Pragyanovation logo across pages
-   [x] Branding: global footer copyright message

### Acceptance Criteria

-   Actions are visually distinct
-   Interface is easy to navigate
-   Works on different screen sizes

------------------------------------------------------------------------

# 🟦 PHASE 3.6 --- App Administrator (Superuser)

## ✅ 12.6. App Administrator role and admin management

-   [x] Add app_admin role
-   [x] App admin login endpoint
-   [x] UI page: /app-admin
-   [x] Create admin users
-   [x] List admin users
-   [x] Reset admin passwords

------------------------------------------------------------------------

# 🔵 PHASE 4 --- OCR Support (Advanced)

## 13. Convert PDF Pages to Images

-   [ ] Extract page images
-   [ ] Preprocess for OCR

### Acceptance Criteria

-   Scanned PDFs converted without corruption

------------------------------------------------------------------------

## 14. Integrate Tesseract OCR

-   [ ] Extract text blocks
-   [ ] Preserve bounding boxes

### Acceptance Criteria

-   ≥ 80% recognition accuracy
-   Bounding boxes returned

------------------------------------------------------------------------

## 15. OCR-Based Field Detection

-   [ ] Generate schema from OCR output

### Acceptance Criteria

-   Scanned form produces usable web form

------------------------------------------------------------------------

# 🟣 PHASE 5 --- ML-Assisted Field Detection (Hard)

## ✅ 16. Dataset Preparation

-   [ ] Collect and label sample PDFs

### Acceptance Criteria

-   ≥ 100 labeled samples
-   Verified bounding boxes

------------------------------------------------------------------------

## ✅ 17. Implement Layout Detection Model

-   [ ] Train detection model
-   [ ] Detect text fields, checkboxes, radio buttons

### Acceptance Criteria

-   ≥ 85% precision
-   Returns structured predictions

------------------------------------------------------------------------

## ✅ 18. Hybrid ML + Rule Detection

-   [ ] Combine ML and heuristic logic

### Acceptance Criteria

-   Improved accuracy over rule-based detection

------------------------------------------------------------------------

# 🔴 PHASE 6 --- Production Readiness

## ✅ 19. Async Processing Queue

-   [ ] Background OCR jobs
-   [ ] Status tracking

### Acceptance Criteria

-   No request timeouts
-   Processing status available via API

------------------------------------------------------------------------

## ✅ 20. Security Hardening

-   [ ] JWT authentication
-   [ ] Rate limiting
-   [ ] Secure storage configuration

### Acceptance Criteria

-   Unauthorized access blocked
-   Sensitive endpoints protected

------------------------------------------------------------------------

## ✅ 21. Performance Optimization

-   [ ] Add DB indexing
-   [ ] Optimize PDF processing
-   [ ] Implement caching

### Acceptance Criteria

-   Digital PDF \< 10s processing
-   OCR \< 30s processing
-   UI load \< 2s

------------------------------------------------------------------------

# Final System Acceptance Criteria

-   Digital PDFs convert to editable forms
-   Scanned PDFs supported
-   ML improves detection accuracy
-   Forms shareable
-   Submissions tracked
-   Filled PDF downloadable
-   Cloud deployment stable
