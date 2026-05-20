export interface ChartDataset {
  label: string;
  data: number[];
}

export interface ChartResponse {
  labels: string[];
  datasets: ChartDataset[];
}

export interface AnalyticsSummary {
  averageScore: number | null;
  medianScore: number | null;
  passRate: number | null;
  totalStudents: number;
  activeStudents: number;
  totalAttempts: number;
  gradedAttempts: number;
  completedTopics: number;
  totalTopicSlots: number;
}

export interface DifficultTopicRow {
  topicId: string;
  topicTitle: string;
  orderIndex: number;
  averageScore: number | null;
  attemptCount: number;
  failRate: number;
  belowThresholdCount: number;
  difficultyScore: number;
}

export interface WeakStudentRow {
  studentId: string;
  displayName: string;
  email: string;
  averageScore: number | null;
  topicsStarted: number;
  topicsCompleted: number;
  retryRecommendedCount: number;
  lastActivityAt: Date | null;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface AiRiskStudent {
  studentId: string;
  displayName: string;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  reasons: string[];
  averageScore: number | null;
  attemptCount: number;
  flaggedAttempts: number;
  tabBlurTotal: number;
  pasteTotal: number;
  weakAiFeedbackCount: number;
}

export interface AttemptsStats {
  total: number;
  byStatus: Record<string, number>;
  averagePerStudent: number;
  chart: ChartResponse;
}

export interface TeacherDashboardAnalytics {
  courseId: string;
  courseTitle: string;
  generatedAt: string;
  summary: AnalyticsSummary;
  difficultTopics: DifficultTopicRow[];
  weakStudents: WeakStudentRow[];
  progressChart: ChartResponse;
  attempts: AttemptsStats;
  aiRisk: {
    summary: {
      criticalCount: number;
      highCount: number;
      mediumCount: number;
      reviewedStudents: number;
    };
    students: AiRiskStudent[];
  };
}
