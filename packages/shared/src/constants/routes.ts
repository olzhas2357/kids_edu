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
  },
  STUDENT: {
    COURSES: '/student/courses',
    COURSE_TOPICS: (courseId: string) => `/student/courses/${courseId}/topics`,
    TOPIC: (topicId: string) => `/student/topics/${topicId}`,
    TOPIC_RESULT: (topicId: string) => `/student/topics/${topicId}/result`,
    TEST_START: (topicId: string) => `/student/topics/${topicId}/test/start`,
    TEST_SUBMIT: (topicId: string, attemptId: string) =>
      `/student/topics/${topicId}/test/attempts/${attemptId}/submit`,
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
