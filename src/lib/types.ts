export type UserRole = 'teacher' | 'student';
export type AiLevel = 'weak' | 'medium' | 'good' | 'excellent';
export type AiAction = 'retry' | 'review' | 'continue';
export type TaskLevel = 'A' | 'B' | 'C';

export interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  role: UserRole;
}

export interface CoursePath {
  id: string;
  subject: string;
  grade: number;
  quarter: number;
  title: string;
}

export interface Topic {
  id: string;
  course_path_id: string;
  title: string;
  description: string | null;
  order_index: number;
  is_published: boolean;
}

export interface TopicContent {
  topic_id: string;
  theory_title: string | null;
  theory_text: string | null;
  video_url: string | null;
}

export interface Task {
  id: string;
  topic_id: string;
  level: TaskLevel;
  title: string;
  link_url: string;
}

export interface TestQuestion {
  id: string;
  test_id: string;
  question_text: string;
  options: string[];
  correct_answer: string;
  order_index: number;
}

export interface Progress {
  id: string;
  student_id: string;
  topic_id: string;
  theory_done: boolean;
  video_done: boolean;
  task_a_done: boolean;
  task_b_done: boolean;
  task_c_done: boolean;
  test_score_percent: number | null;
  test_passed: boolean;
  ai_feedback_seen: boolean;
  topic_completed: boolean;
}

export interface AiResult {
  level: AiLevel;
  scorePercent: number;
  feedback: string;
  recommendation: string;
  action: AiAction;
  canProceed: boolean;
}

export interface TopicWithMeta extends Topic {
  content: TopicContent | null;
  tasks: Task[];
  questionCount: number;
}

export interface StudentTopicState extends Topic {
  locked: boolean;
  progress: Progress | null;
  statusLabel: string;
}
