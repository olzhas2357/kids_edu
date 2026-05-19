import { API_ROUTES } from '@edu-platform/shared';
import { api } from './client';

/** Teacher API layer — wire to backend when implementing features */
export const teacherApi = {
  listCourses: () => api.get<unknown[]>(API_ROUTES.TEACHER.COURSES),

  listTopics: (courseId: string) =>
    api.get<unknown[]>(API_ROUTES.TEACHER.TOPICS(courseId)),

  getTopic: (topicId: string) => api.get<unknown>(API_ROUTES.TEACHER.TOPIC(topicId)),
};
