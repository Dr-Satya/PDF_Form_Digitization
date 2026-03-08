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

CREATE TABLE legal_acceptances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_type VARCHAR(32) NOT NULL,
    user_id UUID REFERENCES users(id),
    form_id UUID REFERENCES forms(id),
    submission_id UUID,
    email VARCHAR(255),
    policy_version TEXT NOT NULL,
    accepted_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_legal_acceptances_user_id ON legal_acceptances (user_id);
CREATE INDEX idx_legal_acceptances_submission_id ON legal_acceptances (submission_id);
CREATE INDEX idx_legal_acceptances_email ON legal_acceptances (email);
