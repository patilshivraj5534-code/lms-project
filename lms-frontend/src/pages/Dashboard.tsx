import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Play, Plus, ArrowRight } from 'lucide-react';
import api from '../services/api/axios';
import { getEnrollments } from '../services/api/enrollment';
import type { CourseResponse, SubjectProgressDto } from '../types';
import { useAuth } from '../context/AuthContext';

const Dashboard: React.FC = () => {
  const [courses, setCourses] = useState<CourseResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [progressByCourseId, setProgressByCourseId] = useState<Record<number, SubjectProgressDto>>({});
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && (user.role === 'INSTRUCTOR' || user.role === 'ADMIN')) {
      navigate('/instructor', { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    const fetchEnrolledCourses = async () => {
      try {
        const data = await getEnrollments();
        setCourses(data);
        if (user?.id) {
          const progressPairs = await Promise.all(
            data.map(async (c) => {
              try {
                const res = await api.get<SubjectProgressDto>(`/progress/subjects/${c.id}`);
                return [c.id, res.data] as const;
              } catch {
                return null;
              }
            })
          );
          const next: Record<number, SubjectProgressDto> = {};
          progressPairs.forEach((p) => {
            if (!p) return;
            next[p[0]] = p[1];
          });
          setProgressByCourseId(next);
        }
      } catch (error) {
        console.error('Failed to fetch enrolled courses', error);
      } finally {
        setLoading(false);
      }
    };
    fetchEnrolledCourses();
  }, [user?.id]);

  const continueCourse = useMemo(() => {
    const withProgress = courses
      .map((c) => ({ course: c, progress: progressByCourseId[c.id] }))
      .filter((x) => x.progress);
    if (withProgress.length === 0) return null;
    withProgress.sort((a, b) => (b.progress?.percentComplete ?? 0) - (a.progress?.percentComplete ?? 0));
    return withProgress[0];
  }, [courses, progressByCourseId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-display font-bold text-white mb-2">
          {user?.name ? `Welcome back, ${user.name}` : 'Welcome back'}
        </h1>
        <p className="text-slate-400">Pick up right where you left off.</p>
      </motion.div>

      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Continue learning */}
        <div className="lg:col-span-8">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-600">Continue learning</p>
                <h2 className="mt-1 text-xl font-bold text-slate-900 truncate">
                  {continueCourse?.course.title ?? 'Choose a course to continue'}
                </h2>
                <p className="mt-2 text-sm text-slate-600 line-clamp-2">
                  {continueCourse?.course.description ?? 'Jump back into one of your enrolled courses.'}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Link to="/subjects">
                  <button className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-slate-300 hover:shadow-sm transition-all">
                    <Plus className="h-4 w-4" />
                    Browse
                  </button>
                </Link>
                <button
                  type="button"
                  disabled={!continueCourse?.progress?.lastVideoId}
                  onClick={() => {
                    if (!continueCourse?.course) return;
                    const last = continueCourse.progress?.lastVideoId;
                    if (last) navigate(`/learn/${continueCourse.course.id}/video/${last}`);
                  }}
                  className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Resume
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Progress</span>
                <span className="font-semibold text-slate-900">
                  {continueCourse?.progress ? `${Math.round(continueCourse.progress.percentComplete)}%` : '—'}
                </span>
              </div>
              <div className="mt-3 h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                <div
                  className="h-full rounded-full bg-indigo-600 transition-all"
                  style={{ width: `${Math.max(0, Math.min(100, continueCourse?.progress?.percentComplete ?? 0))}%` }}
                />
              </div>
              {continueCourse?.progress?.lastVideoId ? (
                <p className="mt-2 text-xs text-slate-500">
                  Ready when you are — we’ll resume from your last watched lesson.
                </p>
              ) : (
                <p className="mt-2 text-xs text-slate-500">
                  Start a lesson to unlock resume.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Quick action */}
        <div className="lg:col-span-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-600">Explore</p>
            <h3 className="mt-1 text-lg font-bold text-slate-900">Find your next course</h3>
            <p className="mt-2 text-sm text-slate-600">
              Browse the catalog and pick something new to learn today.
            </p>
            <Link to="/subjects" className="mt-4 inline-flex w-full">
              <button className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-indigo-700 hover:border-indigo-200 hover:bg-indigo-50 transition-colors">
                Browse All Courses
              </button>
            </Link>
          </div>
        </div>
      </div>

      {courses.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <BookOpen className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-400 mb-2">No courses yet</h3>
          <p className="text-slate-500">Enroll in a course to start learning</p>
        </div>
      ) : (
        <>
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-display font-semibold text-white">My Courses</h2>
              <p className="text-slate-400 text-sm">Track your completion across enrolled courses.</p>
            </div>
            <Link to="/subjects">
              <button className="hidden sm:flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10 transition-colors">
                <Plus className="h-4 w-4" />
                Add more
              </button>
            </Link>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {courses.map((course, idx) => {
              const p = progressByCourseId[course.id];
              const pct = p ? Math.max(0, Math.min(100, p.percentComplete)) : 0;
              return (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="min-w-[280px] max-w-[280px] sm:min-w-[320px] sm:max-w-[320px]"
                >
                  <Link to={`/course/${course.id}`} className="block h-full">
                    <div className="h-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
                      <div className="aspect-video bg-slate-100 flex items-center justify-center">
                        {course.thumbnailUrl ? (
                          <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
                        ) : (
                          <BookOpen className="w-12 h-12 text-slate-300" />
                        )}
                      </div>
                      <div className="p-5">
                        <h3 className="text-base font-bold text-slate-900 line-clamp-1">{course.title}</h3>
                        <p className="mt-1 text-sm text-slate-600 line-clamp-2">{course.description}</p>

                        <div className="mt-4">
                          <div className="flex items-center justify-between text-xs text-slate-600">
                            <span className="font-medium">Completion</span>
                            <span className="font-semibold text-slate-900">
                              {p ? `${Math.round(pct)}%` : '—'}
                            </span>
                          </div>
                          <div className="mt-2 h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                            <div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: `${pct}%` }} />
                          </div>
                        </div>

                        <div className="mt-4 flex items-center justify-between text-sm">
                          <span className="inline-flex items-center gap-1 text-slate-600">
                            <Play className="h-4 w-4" />
                            View
                          </span>
                          {p?.lastVideoId ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                navigate(`/learn/${course.id}/video/${p.lastVideoId}`);
                              }}
                              className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors"
                            >
                              Resume
                            </button>
                          ) : (
                            <span className="text-xs text-slate-500">Not started</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
