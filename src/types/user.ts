// User-related TypeScript interfaces

export interface Address {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}

export interface LicenseEntry {
  id?: string; // uuid
  license_type: string;
  license_number: string;
}

export interface UserProfile {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at?: string;
  role?: string;
  first_name?: string;
  last_name?: string;
  company?: string;
  phone?: string;
  billing_address?: Address;
  shipping_address?: Address;
  licenses?: LicenseEntry[];
} 