export type Role = "admin" | "student" | "parent";
export type Grade = 6 | 7 | 8 | 9;

export type Profile = {
  id: string;
  email: string;
  username: string;
  role: Role;
  created_at: string;
};

export type Student = {
  id: string;
  user_id: string;
  full_name: string;
  class_name: string;
  grade: Grade;
  enrollment_date: string;
  avatar_initials: string | null;
  created_at: string;
};

export type ParentProfile = {
  id: string;
  user_id: string;
  grade: Grade;
};

export type Exam = {
  id: string;
  title: string;
  date: string;
  max_score: number;
};

export type Score = {
  id: string;
  exam_id: string;
  student_id: string;
  score: number;
  created_at: string;
  exams?: Exam | null;
};

export type BadgeKey =
  | "punctual_10"
  | "tenure_3_months"
  | "tenure_6_months"
  | "tenure_1_year"
  | "top_5"
  | "improved_20"
  | "top_score_week"
  | "excellent_student";

export type Badge = {
  id: string;
  student_id: string;
  badge_key: BadgeKey;
  awarded_at: string;
};

export type TeacherComment = {
  id: string;
  student_id: string;
  content: string;
  created_at: string;
};

export type PerformanceBand = {
  key: "beginner" | "pre_intermediate" | "intermediate" | "upper_intermediate";
  vi: string;
  en: string;
  className: string;
};

export type AppContext = {
  profile: Profile;
  student: Student | null;
  parent: ParentProfile | null;
};
