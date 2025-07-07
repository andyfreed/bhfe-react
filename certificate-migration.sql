-- Certificate System Migration
-- This migration adds certificate functionality to the existing database

-- Create certificate_templates table
CREATE TABLE IF NOT EXISTS public.certificate_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    credit_type TEXT NOT NULL, -- References the credit_type enum
    template_design TEXT NOT NULL, -- JSON containing template design/layout
    title TEXT NOT NULL,
    description TEXT,
    signature_fields TEXT, -- JSON array of signature field configurations
    custom_fields TEXT, -- JSON array of custom field configurations
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create certificates table
CREATE TABLE IF NOT EXISTS public.certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    enrollment_id UUID NOT NULL REFERENCES public.user_enrollments(id) ON DELETE CASCADE,
    template_id UUID NOT NULL REFERENCES public.certificate_templates(id) ON DELETE CASCADE,
    credit_type TEXT NOT NULL, -- The credit type this certificate is for
    certificate_number TEXT NOT NULL UNIQUE, -- Unique certificate number
    title TEXT NOT NULL,
    recipient_name TEXT NOT NULL,
    course_title TEXT NOT NULL,
    completion_date TIMESTAMP WITH TIME ZONE NOT NULL,
    exam_score INTEGER NOT NULL,
    credits_earned DECIMAL(5,2) NOT NULL,
    custom_data TEXT, -- JSON containing any custom certificate data
    is_revoked BOOLEAN DEFAULT FALSE,
    revoked_at TIMESTAMP WITH TIME ZONE NULL,
    revoked_by UUID NULL REFERENCES public.users(id),
    revoked_reason TEXT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, course_id, credit_type) -- One certificate per user per course per credit type
);

-- Create certificate_edits table to track edits
CREATE TABLE IF NOT EXISTS public.certificate_edits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    certificate_id UUID NOT NULL REFERENCES public.certificates(id) ON DELETE CASCADE,
    edited_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    field_name TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    edit_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.certificate_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificate_edits ENABLE ROW LEVEL SECURITY;

-- Create policies for certificate_templates
CREATE POLICY "Allow read access to certificate templates" 
    ON public.certificate_templates 
    FOR SELECT 
    USING (true);

CREATE POLICY "Allow full access to certificate templates for admins" 
    ON public.certificate_templates 
    USING (auth.jwt() ->> 'role' = 'admin');

-- Create policies for certificates
CREATE POLICY "Allow users to read their own certificates" 
    ON public.certificates 
    FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Allow full access to certificates for admins" 
    ON public.certificates 
    USING (auth.jwt() ->> 'role' = 'admin');

-- Create policies for certificate_edits
CREATE POLICY "Allow users to read edits of their own certificates" 
    ON public.certificate_edits 
    FOR SELECT 
    USING (auth.uid() IN (
        SELECT user_id FROM public.certificates WHERE id = certificate_id
    ));

CREATE POLICY "Allow full access to certificate edits for admins" 
    ON public.certificate_edits 
    USING (auth.jwt() ->> 'role' = 'admin');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_certificates_user_id ON public.certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_certificates_course_id ON public.certificates(course_id);
CREATE INDEX IF NOT EXISTS idx_certificates_enrollment_id ON public.certificates(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_certificates_credit_type ON public.certificates(credit_type);
CREATE INDEX IF NOT EXISTS idx_certificates_certificate_number ON public.certificates(certificate_number);
CREATE INDEX IF NOT EXISTS idx_certificate_edits_certificate_id ON public.certificate_edits(certificate_id);

-- Insert default certificate templates for each credit type
INSERT INTO public.certificate_templates (name, credit_type, template_design, title, description, signature_fields, custom_fields) VALUES 
('CPA Standard Template', 'CPA', '{"background": "#ffffff", "border": "#003366", "headerColor": "#003366", "textColor": "#000000", "layout": "standard"}', 'Certificate of Completion', 'This certificate is awarded for successful completion of continuing professional education requirements.', '[{"name": "instructor", "label": "Instructor Signature", "required": true}, {"name": "director", "label": "Program Director", "required": true}]', '[{"name": "license_number", "label": "CPA License Number", "required": false}]'),
('CFP Standard Template', 'CFP', '{"background": "#ffffff", "border": "#1f4e79", "headerColor": "#1f4e79", "textColor": "#000000", "layout": "standard"}', 'CFP Continuing Education Certificate', 'This certificate verifies completion of continuing education requirements for Certified Financial Planners.', '[{"name": "instructor", "label": "Instructor Signature", "required": true}, {"name": "cfp_board", "label": "CFP Board Representative", "required": false}]', '[{"name": "cfp_number", "label": "CFP Certificate Number", "required": false}]'),
('CDFA Standard Template', 'CDFA', '{"background": "#ffffff", "border": "#8b4513", "headerColor": "#8b4513", "textColor": "#000000", "layout": "standard"}', 'CDFA Education Certificate', 'This certificate acknowledges completion of Certified Divorce Financial Analyst education requirements.', '[{"name": "instructor", "label": "Instructor Signature", "required": true}, {"name": "cdfa_director", "label": "CDFA Program Director", "required": false}]', '[{"name": "cdfa_id", "label": "CDFA ID Number", "required": false}]'),
('EA Standard Template', 'EA', '{"background": "#ffffff", "border": "#006400", "headerColor": "#006400", "textColor": "#000000", "layout": "standard"}', 'Enrolled Agent Education Certificate', 'This certificate validates completion of continuing education for Enrolled Agents.', '[{"name": "instructor", "label": "Instructor Signature", "required": true}, {"name": "ea_director", "label": "EA Program Director", "required": false}]', '[{"name": "ea_number", "label": "EA Enrollment Number", "required": false}]'),
('OTRP Standard Template', 'OTRP', '{"background": "#ffffff", "border": "#8b0000", "headerColor": "#8b0000", "textColor": "#000000", "layout": "standard"}', 'OTRP Education Certificate', 'This certificate confirms completion of Oregon Tax Return Preparer education requirements.', '[{"name": "instructor", "label": "Instructor Signature", "required": true}, {"name": "otrp_director", "label": "OTRP Program Director", "required": false}]', '[{"name": "otrp_id", "label": "OTRP ID Number", "required": false}]'),
('EA/OTRP Standard Template', 'EA/OTRP', '{"background": "#ffffff", "border": "#4b0082", "headerColor": "#4b0082", "textColor": "#000000", "layout": "standard"}', 'EA/OTRP Dual Education Certificate', 'This certificate acknowledges completion of education requirements for both Enrolled Agent and Oregon Tax Return Preparer designations.', '[{"name": "instructor", "label": "Instructor Signature", "required": true}, {"name": "dual_director", "label": "Program Director", "required": false}]', '[{"name": "ea_number", "label": "EA Enrollment Number", "required": false}, {"name": "otrp_id", "label": "OTRP ID Number", "required": false}]'),
('ERPA Standard Template', 'ERPA', '{"background": "#ffffff", "border": "#ff4500", "headerColor": "#ff4500", "textColor": "#000000", "layout": "standard"}', 'ERPA Education Certificate', 'This certificate verifies completion of Enrolled Retirement Plan Agent education requirements.', '[{"name": "instructor", "label": "Instructor Signature", "required": true}, {"name": "erpa_director", "label": "ERPA Program Director", "required": false}]', '[{"name": "erpa_number", "label": "ERPA Number", "required": false}]')
ON CONFLICT DO NOTHING;

-- Create a function to generate certificate numbers
CREATE OR REPLACE FUNCTION generate_certificate_number()
RETURNS TEXT AS $$
DECLARE
    year_part TEXT;
    random_part TEXT;
    cert_number TEXT;
BEGIN
    year_part := EXTRACT(YEAR FROM NOW())::TEXT;
    random_part := LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0');
    cert_number := 'CERT-' || year_part || '-' || random_part;
    
    -- Ensure uniqueness
    WHILE EXISTS (SELECT 1 FROM public.certificates WHERE certificate_number = cert_number) LOOP
        random_part := LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0');
        cert_number := 'CERT-' || year_part || '-' || random_part;
    END LOOP;
    
    RETURN cert_number;
END;
$$ LANGUAGE plpgsql;

-- Add comments
COMMENT ON TABLE public.certificate_templates IS 'Templates for generating certificates based on credit type';
COMMENT ON TABLE public.certificates IS 'Generated certificates for users who pass exams';
COMMENT ON TABLE public.certificate_edits IS 'Audit trail for certificate edits';
COMMENT ON FUNCTION generate_certificate_number() IS 'Generates unique certificate numbers in format CERT-YYYY-NNNNNN';