export interface User {
  id: string;
  name: string;
  role: 'student' | 'teacher' | 'admin';
  class?: string;
  department?: string;
}

export interface Exam {
  id: string;
  title: string;
  type: 'exam' | 'quiz' | 'assignment' | 'project' | 'final_exam';
  startDate: string;
  endDate: string;
  createdBy: string;
  isActive?: boolean;
  targetClasses?: string[];
}

export interface Evaluation {
  teacherId: string;
  grade: string | number;
  feedback?: string;
}

export interface Submission {
  id: string;
  examId: string;
  studentId: string;
  status: 'pending' | 'graded' | 'edit_granted';
  evaluations?: Evaluation[];
  gradedBy?: string; // Legacy
  grade?: string | number; // Legacy
}
