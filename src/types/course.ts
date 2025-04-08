export type CourseType = 'CFP' | 'CPA' | 'IRS' | 'OTHER';

export type CourseFormat = 'online' | 'hardcopy' | 'video';

export type CreditType = 'CPA' | 'CFP' | 'CDFA' | 'EA' | 'OTRP' | 'ERPA';

export interface CourseCredit {
  type: CreditType;
  amount: number;
  courseNumber: string; // assigned by governing body
}

export interface CoursePrice {
  format: CourseFormat;
  price: number;
  shippingRequired?: boolean;
}

export interface CourseSubjectArea {
  name: string;
  licenseType?: CreditType; // If undefined, it's a global/main subject
}

export interface Course {
  id: string;
  sku: string;
  title: string;
  description: string;
  formats: CoursePrice[];
  credits: CourseCredit[];
  mainSubject: string;
  subjectAreas: CourseSubjectArea[];
  states: string[]; // US state codes
  author: string;
  lastUpdated: Date;
  tableOfContentsUrl: string; // URL to the preview PDF
  courseContentUrl: string; // URL to the full course material PDF (only accessible after purchase)
  createdAt: Date;
  updatedAt: Date;
} 