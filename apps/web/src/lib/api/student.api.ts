import { API_ROUTES } from '@edu-platform/shared';
import type { StudentTopic } from '@/types/learning';
import { api } from './client';

export const studentApi = {
  listCourses: () => api.get<unknown[]>(API_ROUTES.STUDENT.COURSES),

  listTopics: (courseId: string) =>
    api.get<StudentTopic[]>(API_ROUTES.STUDENT.COURSE_TOPICS(courseId)),

  getTopic: (topicId: string) => api.get<unknown>(API_ROUTES.STUDENT.TOPIC(topicId)),

  getTopicResult: (topicId: string) =>
    api.get<unknown>(API_ROUTES.STUDENT.TOPIC_RESULT(topicId)),

  startTest: (topicId: string) =>
    api.post<unknown>(API_ROUTES.STUDENT.TEST_START(topicId)),

  submitTest: (topicId: string, attemptId: string) =>
    api.post<unknown>(API_ROUTES.STUDENT.TEST_SUBMIT(topicId, attemptId)),
};
