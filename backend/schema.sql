CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE user_role AS ENUM ('app_admin', 'admin', 'public');
CREATE TYPE form_status AS ENUM ('draft', 'active', 'inactive');

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE,
    password_hash TEXT,
    role user_role DEFAULT 'public'
);

CREATE TABLE forms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID REFERENCES users(id),
    original_pdf_path TEXT,
    form_schema JSONB,
    public_slug VARCHAR(255) UNIQUE,
    status form_status DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_id UUID REFERENCES forms(id),
    filled_data JSONB,
    generated_pdf_path TEXT,
    submitter_email VARCHAR(255),
    submitted_at TIMESTAMP DEFAULT NOW()
);
