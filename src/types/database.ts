export type CourseFormat = 'online' | 'hardcopy' | 'video';
export type CreditType = 'CPA' | 'CFP' | 'CDFA' | 'EA' | 'OTRP' | 'EA/OTRP' | 'ERPA';

// Exam related types
export interface ExamQuestion {
  id: string;
  exam_id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: 'a' | 'b' | 'c' | 'd';
  created_at: string;
}

export interface Exam {
  id: string;
  course_id: string;
  title: string;
  description: string;
  passing_score: number; // Percentage needed to pass (e.g., 70 means 70%)
  attempt_limit: number | null; // Maximum number of attempts allowed (null means unlimited)
  created_at: string;
}

export interface UserExamAttempt {
  id: string;
  user_id: string;
  exam_id: string;
  score: number | null;
  completed: boolean;
  started_at: string;
  completed_at: string | null;
  passed: boolean | null;
  created_at: string;
}

export interface UserExamAnswer {
  id: string;
  attempt_id: string;
  question_id: string;
  selected_option: 'a' | 'b' | 'c' | 'd' | null;
  is_correct: boolean | null;
  created_at: string;
}

export interface UserEnrollment {
  id: string;
  user_id: string;
  course_id: string;
  progress: number;
  completed: boolean;
  enrolled_by: string | null;
  enrollment_type: string;
  enrollment_notes: string | null;
  enrolled_at: string;
  last_accessed_at: string | null;
  completed_at: string | null;
  exam_score: number | null;
  exam_passed: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface Course {
  id: string;
  sku: string;
  title: string;
  description: string;
  main_subject: string;
  author: string;
  table_of_contents_url: string;
  course_content_url: string;
  certificates?: string;
  created_at: string;
  updated_at?: string;
  last_updated?: string;
}

export interface CourseFormatEntry {
  id?: string;
  course_id?: string;
  format: string;
  price: number;
  created_at?: string;
}

export interface CourseCredit {
  id?: string;
  course_id?: string;
  credit_type: string;
  amount: number;
  course_number?: string;
  created_at?: string;
}

export interface CourseState {
  id?: string;
  course_id?: string;
  state_code: string;
  created_at?: string;
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
  formats: CourseFormatEntry[];
  credits: CourseCredit[];
  states: CourseState[];
  subject_areas?: {
    id: string;
    subject_areas: SubjectArea;
  }[];
  exams?: Exam[];
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
      exams: {
        Row: Exam;
        Insert: Omit<Exam, 'id' | 'created_at'>;
        Update: Partial<Omit<Exam, 'id' | 'created_at'>>;
      };
      exam_questions: {
        Row: ExamQuestion;
        Insert: Omit<ExamQuestion, 'id' | 'created_at'>;
        Update: Partial<Omit<ExamQuestion, 'id' | 'created_at'>>;
      };
      user_exam_attempts: {
        Row: UserExamAttempt;
        Insert: Omit<UserExamAttempt, 'id' | 'created_at'>;
        Update: Partial<Omit<UserExamAttempt, 'id' | 'created_at'>>;
      };
      user_exam_answers: {
        Row: UserExamAnswer;
        Insert: Omit<UserExamAnswer, 'id' | 'created_at'>;
        Update: Partial<Omit<UserExamAnswer, 'id' | 'created_at'>>;
      };
      user_enrollments: {
        Row: UserEnrollment;
        Insert: Omit<UserEnrollment, 'id' | 'created_at'>;
        Update: Partial<Omit<UserEnrollment, 'id' | 'created_at'>>;
      };
    };
  };
} 