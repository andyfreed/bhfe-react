export type CourseFormat = 'online' | 'hardcopy' | 'video';
export type CreditType = 'CPA' | 'CFP' | 'CDFA' | 'EA' | 'OTRP' | 'ERPA';

export interface Course {
  id: string;
  sku: string;
  title: string;
  description: string;
  main_subject: string;
  author: string;
  table_of_contents_url: string;
  course_content_url: string;
  created_at: string;
  formats: CourseFormatEntry[];
  credits: CourseCredit[];
  states: CourseState[];
}

export interface CourseFormatEntry {
  format: string;
  price: number;
}

export interface CourseCredit {
  credit_type: string;
  amount: number;
}

export interface CourseState {
  state: string;
}

export interface SubjectArea {
  id: string;
  name: string;
  credit_type: CreditType | null;
  created_at: string;
}

export interface CourseSubjectArea {
  id: string;
  course_id: string;
  subject_area_id: string;
  created_at: string;
}

// Types with relationships included
export interface CourseWithRelations extends Course {
  formats?: CourseFormatEntry[];
  credits?: CourseCredit[];
  states?: CourseState[];
  subject_areas?: SubjectArea[];
}

export interface Database {
  public: {
    Tables: {
      courses: {
        Row: Course;
        Insert: Omit<Course, 'id' | 'created_at' | 'updated_at' | 'last_updated'>;
        Update: Partial<Omit<Course, 'id' | 'created_at' | 'updated_at'>>;
      };
      course_formats: {
        Row: CourseFormatEntry;
        Insert: Omit<CourseFormatEntry, 'id' | 'created_at'>;
        Update: Partial<Omit<CourseFormatEntry, 'id' | 'created_at'>>;
      };
      course_credits: {
        Row: CourseCredit;
        Insert: Omit<CourseCredit, 'id' | 'created_at'>;
        Update: Partial<Omit<CourseCredit, 'id' | 'created_at'>>;
      };
      course_states: {
        Row: CourseState;
        Insert: Omit<CourseState, 'id' | 'created_at'>;
        Update: Partial<Omit<CourseState, 'id' | 'created_at'>>;
      };
      subject_areas: {
        Row: SubjectArea;
        Insert: Omit<SubjectArea, 'id' | 'created_at'>;
        Update: Partial<Omit<SubjectArea, 'id' | 'created_at'>>;
      };
      course_subject_areas: {
        Row: CourseSubjectArea;
        Insert: Omit<CourseSubjectArea, 'id' | 'created_at'>;
        Update: Partial<Omit<CourseSubjectArea, 'id' | 'created_at'>>;
      };
    };
  };
} 