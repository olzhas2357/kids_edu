export const API_ROUTES = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
  },
  TEACHER: {
    COURSES: '/teacher/courses',
    TOPICS: (courseId: string) => `/teacher/courses/${courseId}/topics`,
    TOPIC: (topicId: string) => `/teacher/topics/${topicId}`,
    ANALYTICS_DASHBOARD: (courseId: string) => `/teacher/courses/${courseId}/analytics/dashboard`,
    ANALYTICS_SUMMARY: (courseId: string) => `/teacher/courses/${courseId}/analytics/summary`,
    ANALYTICS_DIFFICULT_TOPICS: (courseId: string) =>
      `/teacher/courses/${courseId}/analytics/topics/difficult`,
    ANALYTICS_WEAK_STUDENTS: (courseId: string) =>
      `/teacher/courses/${courseId}/analytics/students/weak`,
    ANALYTICS_PROGRESS_CHART: (courseId: string) =>
      `/teacher/courses/${courseId}/analytics/charts/progress`,
    ANALYTICS_ATTEMPTS_CHART: (courseId: string) =>
      `/teacher/courses/${courseId}/analytics/charts/attempts`,
    ANALYTICS_AI_RISK: (courseId: string) => `/teacher/courses/${courseId}/analytics/ai-risk`,
  },
  STUDENT: {
    COURSES: '/student/courses',
    COURSE_TOPICS: (courseId: string) => `/student/courses/${courseId}/topics`,
    TOPIC: (topicId: string) => `/student/topics/${topicId}`,
    TOPIC_RESULT: (topicId: string) => `/student/topics/${topicId}/result`,
    TEST_START: (topicId: string) => `/student/topics/${topicId}/test/start`,
    TEST_SESSION: (topicId: string, attemptId: string) =>
      `/student/topics/${topicId}/test/attempts/${attemptId}/session`,
    TEST_ANSWER: (topicId: string, attemptId: string, questionId: string) =>
      `/student/topics/${topicId}/test/attempts/${attemptId}/answers/${questionId}`,
    TEST_AUTOSAVE: (topicId: string, attemptId: string) =>
      `/student/topics/${topicId}/test/attempts/${attemptId}/autosave`,
    TEST_EVENT: (topicId: string, attemptId: string) =>
      `/student/topics/${topicId}/test/attempts/${attemptId}/events`,
    TEST_SUBMIT: (topicId: string, attemptId: string) =>
      `/student/topics/${topicId}/test/attempts/${attemptId}/submit`,
    TEST_HISTORY: (topicId: string) => `/student/topics/${topicId}/test/history`,
    TEST_RESULT: (topicId: string, attemptId: string) =>
      `/student/topics/${topicId}/test/attempts/${attemptId}/result`,
  },
  AI: {
    HEALTH: '/ai/health',
    TEST_ANALYZE: (topicId: string) => `/ai/topics/${topicId}/test/analyze`,
    PRACTICE_HINT: (topicId: string, taskId: string) =>
      `/ai/topics/${topicId}/practice/${taskId}/hint`,
    CHAT: '/ai/chat',
  },
} as const;

export const WEB_ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  TEACHER: {
    ROOT: '/teacher',
    DASHBOARD: '/teacher',
    TOPICS: '/teacher/topics',
    ANALYTICS: '/teacher/analytics',
    STUDENTS: '/teacher/students',
  },
  STUDENT: {
    ROOT: '/student',
    TOPICS: '/student/topics',
    LESSON: (topicId: string) => `/student/lessons/${topicId}`,
    TEST: (topicId: string) => `/student/lessons/${topicId}/test`,
    ASSISTANT: '/student/assistant',
    PROGRESS: '/student/progress',
  },
} as const;
