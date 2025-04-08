export type CourseType = 'CFP' | 'CPA' | 'IRS' | 'OTHER';

export interface Course {
  id: string;
  title: string;
  description: string;
  type: CourseType[];
  price: number;
  duration: string; // e.g., "2 hours"
  credits: number;
  features: string[];
  image?: string;
  slug: string;
  objectives: string[];
  requirements?: string[];
  instructor: {
    name: string;
    bio: string;
    image?: string;
  };
} 