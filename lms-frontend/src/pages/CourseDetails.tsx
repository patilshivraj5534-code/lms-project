import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Play, ChevronDown, ChevronUp, BookOpen, ClipboardList } from 'lucide-react';
import api from '../services/api/axios';
import { enroll, checkEnrollment } from '../services/api/enrollment';
import type { CourseDto, VideoDto } from '../types';
import { useAuth } from '../context/AuthContext';

const CourseDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [course, setCourse] = useState<CourseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolled, setEnrolled] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set());
  const [quizExists, setQuizExists] = useState(false);

  const totalLessons = useMemo(() => {
    return course?.sections?.reduce((acc, s) => acc + s.videos.length, 0) ?? 0;
  }, [course]);

  const totalSeconds = useMemo(() => {
    return (
      course?.sections?.reduce(
        (acc, s) => acc + s.videos.reduce((vAcc, v) => vAcc + (v.duration || 0), 0),
        0
      ) ?? 0
    );
  }, [course]);

  const totalLengthLabel = useMemo(() => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    return h > 0 ? `${h}h ${m}m total length` : `${m}m total length`;
  }, [totalSeconds]);

  const priceLabel = useMemo(() => {
    const p = course?.price ?? 0;
    return p > 0 ? `$${p}` : 'Free';
  }, [course]);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const response = await api.get<CourseDto>(`/subjects/${id}/tree`);
        setCourse(response.data);
        // Auto-expand first section
        if (response.data.sections?.length > 0) {
          setExpandedSections(new Set([response.data.sections[0].id]));
        }
        // Check enrollment status if user is logged in
        if (user?.id) {
          const isEnrolled = await checkEnrollment(Number(id));
          setEnrolled(isEnrolled);
          // Check if course has a quiz
          try {
            const qr = await api.get<{ exists: boolean }>(`/courses/${id}/quiz/exists`);
            setQuizExists(qr.data.exists);
          } catch { setQuizExists(false); }
        } else {
          setEnrolled(false);
        }
      } catch (error) {
        console.error('Failed to fetch course', error);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchCourse();
  }, [id, user]);

  const toggleSection = (sectionId: number) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  const handleVideoClick = (video: VideoDto) => {
    if (!video.locked) {
      if (course) navigate(`/learn/${course.id}/video/${video.id}`);
    }
  };

  const handleEnroll = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!course) return;
    setEnrolling(true);
    try {
      await enroll(course.id);
      setEnrolled(true);
      
      // Redirect to the first video (it will be unlocked by the backend now)
      const firstVideo = course.sections
        ?.flatMap(s => s.videos)?.[0];
        
      if (firstVideo) {
        navigate(`/learn/${course.id}/video/${firstVideo.id}`);
      }

    } catch (error: any) {
      if (error.response?.status === 409) {
        setEnrolled(true);
      } else {
        console.error('Failed to enroll', error);
      }
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-slate-400">Course not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left: Hero */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-8"
        >
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="relative aspect-[16/9] bg-slate-100">
              {course.thumbnailUrl ? (
                <img src={course.thumbnailUrl} alt={course.title} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <BookOpen className="h-14 w-14 text-slate-300" />
                </div>
              )}
            </div>
            <div className="p-6 sm:p-8">
              <h1 className="text-3xl font-display font-bold tracking-tight text-slate-900 sm:text-4xl">
                {course.title}
              </h1>
              <p className="mt-2 text-sm font-medium text-slate-600">
                Instructor: <span className="text-slate-900">{course.instructorName || `Instructor #${course.instructorId}`}</span>
              </p>
              <div className="mt-5 space-y-3 text-slate-700">
                <p className="whitespace-pre-line text-base leading-relaxed">
                  {course.description || 'No description provided.'}
                </p>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-600">
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
                  <span className="font-semibold text-slate-900">{totalLessons}</span> lessons
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
                  <span className="font-semibold text-slate-900">{totalLengthLabel}</span>
                </span>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Right: Sticky Enrollment Card */}
        <aside className="lg:col-span-4">
          <div className="lg:sticky lg:top-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-sm font-medium text-slate-600">Course price</p>
                <p className="text-2xl font-bold text-slate-900">{priceLabel}</p>
              </div>

              <div className="mt-4 space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                <div className="flex items-center justify-between">
                  <span>Total lessons</span>
                  <span className="font-semibold text-slate-900">{totalLessons}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Total length</span>
                  <span className="font-semibold text-slate-900">{totalLengthLabel}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleEnroll}
                disabled={enrolled || enrolling}
                className={`mt-5 w-full rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/30 disabled:cursor-not-allowed
                  ${enrolled 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20'
                  }`}
              >
                {enrolling ? 'Enrolling...' : enrolled ? 'Enrolled ✓' : 'Enroll Now'}
              </button>
              {!enrolled && (
                <p className="mt-2 text-xs text-slate-500">
                  {user 
                    ? `Click to enroll in this course as ${user.name}.`
                    : "Sign in to enroll and start learning."}
                </p>
              )}
              {enrolled && quizExists && (
                <button
                  type="button"
                  onClick={() => navigate(`/course/${id}/quiz`)}
                  className="mt-3 w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold
                    bg-purple-600 hover:bg-purple-700 text-white shadow-sm transition-all"
                >
                  <ClipboardList className="w-4 h-4" /> Take Quiz
                </button>
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* Course Curriculum */}
      <div className="mt-10 space-y-4">
        <h2 className="text-2xl font-display font-semibold text-white mb-6">Course Curriculum</h2>
        {course.sections?.map((section, sectionIdx) => (
          <motion.div
            key={section.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: sectionIdx * 0.1 }}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
          >
            {/* Section Header */}
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-indigo-700 font-semibold">Section {sectionIdx + 1}</span>
                <h3 className="text-lg font-semibold text-slate-900">{section.title}</h3>
                <span className="text-sm text-slate-500">
                  {section.videos.length} lesson{section.videos.length !== 1 ? 's' : ''}
                </span>
              </div>
              {expandedSections.has(section.id) ? (
                <ChevronUp className="w-5 h-5 text-slate-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-slate-500" />
              )}
            </button>

            {/* Videos List */}
            <AnimatePresence>
              {expandedSections.has(section.id) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="border-t border-slate-200">
                    {section.videos.map((video, videoIdx) => (
                      <motion.div
                        key={video.id}
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: videoIdx * 0.05 }}
                        onClick={() => handleVideoClick(video)}
                        className={`px-6 py-4 flex items-center gap-4 cursor-pointer transition-all
                          ${video.locked
                            ? 'opacity-60 cursor-not-allowed bg-slate-50'
                            : 'hover:bg-indigo-50 hover:translate-x-1'
                          }`}
                      >
                        {/* Lock/Play Icon */}
                        <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center
                          ${video.locked
                            ? 'bg-slate-200 text-slate-500'
                            : 'bg-indigo-100 text-indigo-700'
                          }`}
                        >
                          {video.locked ? (
                            <Lock className="w-5 h-5" />
                          ) : (
                            <Play className="w-5 h-5" />
                          )}
                        </div>

                        {/* Video Info */}
                        <div className="flex-1">
                          <h4 className={`font-medium ${video.locked ? 'text-slate-600' : 'text-slate-900'}`}>
                            {videoIdx + 1}. {video.title}
                          </h4>
                          <p className="text-sm text-slate-500">
                            {video.duration ? `${Math.floor(video.duration / 60)}:${(video.duration % 60).toString().padStart(2, '0')}` : 'N/A'}
                          </p>
                        </div>

                        {/* Status Badge */}
                        {video.locked ? (
                          <span className="text-xs px-3 py-1 rounded-full border border-slate-200 bg-white text-slate-600">
                            Locked
                          </span>
                        ) : (
                          <span className="text-xs px-3 py-1 rounded-full border border-indigo-200 bg-indigo-50 text-indigo-700">
                            Available
                          </span>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default CourseDetails;
