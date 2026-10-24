import api from './axios';
import type { CourseResponse } from '../../types';

export const enroll = (courseId: number): Promise<CourseResponse> =>
  api.post<CourseResponse>(`/enrollments/${courseId}`).then(res => res.data);

export const unenroll = (courseId: number): Promise<void> =>
  api.delete(`/enrollments/${courseId}`).then(() => undefined);

export const checkEnrollment = (courseId: number): Promise<boolean> =>
  api.get<boolean>(`/enrollments/check/${courseId}`).then(res => res.data);

export const getEnrollments = (): Promise<CourseResponse[]> =>
  api.get<CourseResponse[]>(`/enrollments`).then(res => res.data);
