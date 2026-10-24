export interface User {
  id: number;
  name: string;
  email: string;
  role: 'USER' | 'INSTRUCTOR' | 'ADMIN';
}

export interface VideoDto {
  id: number;
  title: string;
  youtubeId: string;
  duration: number;
  orderIndex: number;
  locked?: boolean;
  isCompleted?: boolean;
  unlockReason?: string;
  previousVideoId?: number;
  nextVideoId?: number;
}

export interface SectionDto {
  id: number;
  title: string;
  orderIndex: number;
  videos: VideoDto[];
}

export interface CourseDto {
  id: number;
  title: string;
  description: string;
  instructorId: number;
  instructorName?: string;
  thumbnailUrl: string;
  price: number;
  status: string;
  createdAt: string;
  sections: SectionDto[];
}

export interface CourseResponse {
  id: number;
  title: string;
  description: string;
  instructorId: number;
  thumbnailUrl: string;
  price: number;
  status: string;
  createdAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  name: string;
  email: string;
  role: 'USER' | 'INSTRUCTOR' | 'ADMIN';
}

export interface VideoProgressDto {
  videoId: number;
  lastPositionSeconds: number;
  isCompleted: boolean;
  locked?: boolean;
}

export interface ProgressRequest {
  lastPositionSeconds?: number;
  isCompleted?: boolean;
}

export interface SubjectProgressDto {
  totalVideos: number;
  completedVideos: number;
  percentComplete: number;
  lastVideoId: number | null;
  lastPositionSeconds: number | null;
}
