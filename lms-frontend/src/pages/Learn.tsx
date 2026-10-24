import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import YouTube from 'react-youtube';
import type { YouTubeEvent, YouTubePlayer } from 'react-youtube';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle,
  Circle,
  Lock,
  PlayCircle,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  ArrowLeft,
  BookOpen,
} from 'lucide-react';
import api from '../services/api/axios';
// import { checkEnrollment } from '../services/api/enrollment';
import type { VideoDto, CourseDto, ProgressRequest, VideoProgressDto, SubjectProgressDto } from '../types';
import { useAuth } from '../context/AuthContext';
import debounce from 'lodash.debounce';

// ─── VideoPlayer Component ──────────────────────────────────────────────────
// Props follow the spec: videoId, startPositionSeconds, onProgress, onCompleted

interface VideoPlayerProps {
  youtubeId: string;
  startPositionSeconds: number;
  onProgress: (seconds: number) => void;
  onCompleted: () => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  youtubeId,
  startPositionSeconds,
  onProgress,
  onCompleted,
}) => {
  const playerRef = useRef<YouTubePlayer | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completedRef = useRef(false);

  // Clear the polling interval safely
  const clearPoller = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Start polling getCurrentTime every 2 s while PLAYING
  const startPoller = useCallback(() => {
    clearPoller();
    intervalRef.current = setInterval(() => {
      if (!playerRef.current) return;
      const current: number = Math.floor(playerRef.current.getCurrentTime());
      onProgress(current);

      // Auto-complete when within 2 s of end
      const duration: number = Math.floor(playerRef.current.getDuration());
      if (duration > 0 && current >= duration - 2 && !completedRef.current) {
        completedRef.current = true;
        onCompleted();
      }
    }, 2000);
  }, [clearPoller, onProgress, onCompleted]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearPoller();
    };
  }, [clearPoller]);

  const handleReady = (event: YouTubeEvent) => {
    playerRef.current = event.target;
    if (startPositionSeconds > 0) {
      event.target.seekTo(startPositionSeconds, true);
    }
  };

  const handleStateChange = (event: YouTubeEvent) => {
    const YT_PLAYING = 1;
    const YT_ENDED = 0;

    if (event.data === YT_PLAYING) {
      startPoller();
    } else if (event.data === YT_ENDED) {
      clearPoller();
      if (!completedRef.current) {
        completedRef.current = true;
        onCompleted();
      }
    } else {
      // Paused / buffering / cued — stop polling, fire final progress
      clearPoller();
      if (playerRef.current) {
        const current: number = Math.floor(playerRef.current.getCurrentTime());
        onProgress(current);
      }
    }
  };

  return (
    <YouTube
      videoId={youtubeId}
      opts={{
        width: '100%',
        height: '100%',
        playerVars: {
          autoplay: 1,
          modestbranding: 1,
          rel: 0,
          start: startPositionSeconds > 0 ? startPositionSeconds : undefined,
        },
      }}
      onReady={handleReady}
      onStateChange={handleStateChange}
      className="w-full h-full"
      iframeClassName="w-full h-full"
    />
  );
};

// ─── Learn Page ─────────────────────────────────────────────────────────────

const Learn: React.FC = () => {
  const { courseId, videoId } = useParams<{ courseId: string; videoId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [course, setCourse] = useState<CourseDto | null>(null);
  const [currentVideo, setCurrentVideo] = useState<VideoDto | null>(null);
  const [subjectProgress, setSubjectProgress] = useState<SubjectProgressDto | null>(null);
  const [startSeconds, setStartSeconds] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [bottomTab, setBottomTab] = useState<'notes' | 'overview'>('overview');

  // Derived: is current video completed?
  const isCompleted = currentVideo?.isCompleted ?? false;

  // Fetch the full course tree (sections + videos with locked status)
  const fetchCourse = useCallback(async () => {
    try {
      const res = await api.get<CourseDto>(`/subjects/${courseId}/tree`);
      setCourse(res.data);
    } catch (err) {
      console.error('Failed to fetch course tree', err);
    }
  }, [courseId]);

  // Initial load
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const [courseRes, progressRes] = await Promise.all([
          api.get<CourseDto>(`/subjects/${courseId}/tree`),
          user?.id ? api.get<SubjectProgressDto>(`/progress/subjects/${courseId}`) : Promise.resolve(null)
        ]);
        
        setCourse(courseRes.data);
        if (progressRes) setSubjectProgress(progressRes.data);
        
        // Resume logic: if no videoId in URL, decide where to go
        if (!videoId) {
          const lastVidId = progressRes?.data?.lastVideoId;
          if (lastVidId) {
            navigate(`/learn/${courseId}/video/${lastVidId}`, { replace: true });
          } else {
            const firstVid = courseRes.data.sections[0]?.videos[0];
            if (firstVid) {
              navigate(`/learn/${courseId}/video/${firstVid.id}`, { replace: true });
            }
          }
        }
      } catch (err) {
        console.error('Failed to initialize Learn page', err);
      } finally {
        setLoading(false);
      }
    };
    if (courseId) init();
    // Only run on courseId or user change to initialize
  }, [courseId, user?.id, navigate]);

  // Fetch video progress when video changes
  useEffect(() => {
    if (!videoId || !user?.id) return;
    const fetchVideoProgress = async () => {
      try {
        const res = await api.get<VideoProgressDto>(`/progress/videos/${videoId}`);
        setStartSeconds(res.data.lastPositionSeconds ?? 0);
      } catch (err) {
        console.error('Failed to fetch video progress', err);
      }
    };
    fetchVideoProgress();
  }, [videoId, user?.id]);

  // Resolve currentVideo whenever videoId or course changes
  useEffect(() => {
    if (!course || !videoId) return;
    const found = course.sections
      .flatMap((s) => s.videos)
      .find((v) => v.id === Number(videoId));
    setCurrentVideo(found ?? null);
  }, [course, videoId]);

  // Flatten all videos for Prev/Next navigation
  const flatVideos = useMemo(
    () => (course?.sections ?? []).flatMap((s) => s.videos),
    [course]
  );
  const currentIndex = flatVideos.findIndex((v) => v.id === Number(videoId));
  const prevVideo = currentIndex > 0 ? flatVideos[currentIndex - 1] : null;
  const nextVideo =
    currentIndex >= 0 && currentIndex < flatVideos.length - 1
      ? flatVideos[currentIndex + 1]
      : null;

  // Backend sync logic
  const syncProgressApi = useCallback(async (seconds: number, completed: boolean) => {
    if (!user?.id || !videoId) return;
    try {
      const payload: ProgressRequest = { lastPositionSeconds: Math.floor(seconds), isCompleted: completed };
      await api.post(`/progress/videos/${videoId}`, payload);
      if (completed) {
        await fetchCourse();
      }
    } catch (err) {
      console.error('Failed to sync progress', err);
    }
  }, [user?.id, videoId, fetchCourse]);

  // Debounced position sync (fires at most every 1.5 s)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSync = useCallback(
    debounce((seconds: number) => {
      syncProgressApi(seconds, false);
    }, 1500),
    [syncProgressApi]
  );

  // onProgress callback (from VideoPlayer)
  const handleProgress = useCallback(
    (seconds: number) => {
      if (!isCompleted) {
        debouncedSync(seconds);
      }
    },
    [debouncedSync, isCompleted]
  );


  // onCompleted callback (from VideoPlayer)
  const handleCompleted = useCallback(async () => {
    debouncedSync.cancel();
    await syncProgressApi(currentVideo?.duration ?? 0, true);
    if (nextVideo) {
      navigate(`/learn/${courseId}/video/${nextVideo.id}`);
    }
  }, [debouncedSync, syncProgressApi, currentVideo, nextVideo, courseId, navigate]);

  // Manual "Mark as Complete" button
  const markComplete = async () => {
    debouncedSync.cancel();
    await syncProgressApi(currentVideo?.duration ?? 0, true);
    if (nextVideo) {
      navigate(`/learn/${courseId}/video/${nextVideo.id}`);
    }
  };

  // Navigate to a video
  const goToVideo = (vid: VideoDto) => {
    if (vid.locked) return;
    navigate(`/learn/${courseId}/video/${vid.id}`);
  };

  if (loading || !course) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-4rem)] bg-slate-950 relative overflow-hidden">

      {/* Mobile top bar */}
      <div className="md:hidden p-4 flex items-center justify-between bg-slate-900 border-b border-white/5">
        <button
          onClick={() => navigate(`/course/${courseId}`)}
          className="text-slate-400 hover:text-white flex items-center gap-2 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" /> Course
        </button>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Main content */}
      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'md:mr-[360px]' : ''}`}>
        <motion.div
          className="mx-auto flex h-full w-full max-w-5xl flex-col px-4 py-5 md:px-8 md:py-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {/* Focus header */}
          <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-0">
              <button
                onClick={() => navigate(`/course/${courseId}`)}
                className="hidden md:flex items-center gap-1 text-slate-400 hover:text-white text-sm mb-2 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Course
              </button>
              <h1 className="truncate text-xl md:text-2xl font-display font-bold text-white">
                {currentVideo?.title ?? 'Select a lesson'}
              </h1>
              <p className="mt-1 text-sm text-slate-400 truncate">
                {course.title}
                {subjectProgress && (
                  <span className="ml-2 inline-flex items-center rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2 py-0.5 text-[11px] font-semibold text-indigo-300">
                    {Math.round(subjectProgress.percentComplete)}% complete
                  </span>
                )}
              </p>
            </div>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden md:flex items-center gap-2 px-4 py-2 bg-slate-800/80 text-slate-300 hover:text-white rounded-lg transition-colors text-sm ring-1 ring-white/5"
            >
              <BookOpen className="w-4 h-4" />
              {sidebarOpen ? 'Hide Playlist' : 'Show Playlist'}
            </button>
          </div>

          {/* YouTube Player */}
          <div className="mb-5 rounded-2xl bg-gradient-to-b from-slate-900 to-black p-3 ring-1 ring-white/10 shadow-2xl">
            <div className="aspect-video bg-black rounded-xl overflow-hidden">
            {currentVideo ? (
              <VideoPlayer
                key={currentVideo.id}       /* remount on video change */
                youtubeId={currentVideo.youtubeId}
                startPositionSeconds={startSeconds}
                onProgress={handleProgress}
                onCompleted={handleCompleted}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-600">
                <PlayCircle className="w-16 h-16" />
              </div>
            )}
            </div>
          </div>

          {/* Bottom dock: navigation + tabs */}
          <div className="glass-card overflow-hidden">
            <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex w-full gap-3 sm:w-auto">
                <button
                  onClick={() => prevVideo && goToVideo(prevVideo)}
                  disabled={!prevVideo}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-lg transition-colors ${
                    prevVideo ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-slate-800/40 text-slate-600 cursor-not-allowed'
                  }`}
                >
                  <ChevronLeft className="w-5 h-5" /> Previous Lesson
                </button>
                <button
                  onClick={() => nextVideo && goToVideo(nextVideo)}
                  disabled={!nextVideo || !!nextVideo.locked}
                  title={nextVideo?.locked ? 'Complete current lesson to unlock' : 'Go to next lesson'}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-lg transition-colors ${
                    !nextVideo
                      ? 'bg-slate-800/40 text-slate-600 cursor-not-allowed'
                      : nextVideo.locked
                        ? 'bg-slate-800/50 text-slate-500 cursor-not-allowed'
                        : 'bg-slate-800 hover:bg-slate-700 text-white'
                  }`}
                >
                  Next Lesson <ChevronRight className="w-5 h-5" />
                  {nextVideo?.locked && <Lock className="w-4 h-4 ml-1" />}
                </button>
              </div>

              <button
                onClick={markComplete}
                disabled={isCompleted}
                className={`w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-lg transition-colors font-medium ${
                  isCompleted
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30 cursor-default'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20'
                }`}
              >
                <CheckCircle className="w-5 h-5" />
                {isCompleted ? 'Completed ✓' : 'Mark as Complete'}
              </button>
            </div>

            <div className="border-t border-white/10">
              <div className="flex items-center gap-2 px-5 pt-4">
                <button
                  type="button"
                  onClick={() => setBottomTab('overview')}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                    bottomTab === 'overview'
                      ? 'bg-white/10 text-white ring-1 ring-white/10'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Overview
                </button>
                <button
                  type="button"
                  onClick={() => setBottomTab('notes')}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                    bottomTab === 'notes'
                      ? 'bg-white/10 text-white ring-1 ring-white/10'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Lesson Notes
                </button>
              </div>

              <div className="px-5 pb-5 pt-4 text-sm text-slate-300">
                {bottomTab === 'overview' ? (
                  <div className="space-y-2">
                    <p className="text-slate-200 font-medium">Course</p>
                    <p className="text-slate-400">{course.title}</p>
                    <p className="text-slate-200 font-medium mt-3">Lesson</p>
                    <p className="text-slate-400">{currentVideo?.title ?? 'Select a lesson from the playlist.'}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-slate-200 font-medium">Lesson Notes</p>
                    <p className="text-slate-400">
                      No notes available here.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed md:absolute right-0 top-0 bottom-0 w-full sm:w-[360px] bg-slate-900 border-l border-white/5 z-40 flex flex-col"
          >
            {/* Sticky header */}
            <div className="p-5 bg-slate-900/90 backdrop-blur border-b border-white/5 flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="font-display font-semibold text-white">Course Syllabus</h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-sm text-slate-400 truncate max-w-[180px]">{course.title}</p>
                  {subjectProgress && (
                    <span className="text-[10px] font-bold bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded-full border border-indigo-500/20">
                      {Math.round(subjectProgress.percentComplete)}%
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                aria-label="Close playlist"
                title="Close playlist"
                className="md:hidden p-2 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable lesson list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {course.sections?.map((section, sIdx) => {
                const sectionTotal = section.videos.length;
                const sectionDone = section.videos.filter((v) => v.isCompleted).length;

                return (
                  <div key={section.id}>
                    {/* Section header with progress fraction */}
                    <div className="flex items-center justify-between mb-2 px-1">
                      <h4 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                        Section {sIdx + 1}: {section.title}
                      </h4>
                      <span className="text-xs text-slate-500">
                        {sectionDone}/{sectionTotal}
                      </span>
                    </div>

                    {/* Mini progress bar per section */}
                    <div className="h-1 bg-slate-800 rounded-full mb-3 mx-1 overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                        style={{
                          width: sectionTotal > 0
                            ? `${(sectionDone / sectionTotal) * 100}%`
                            : '0%',
                        }}
                      />
                    </div>

                    <div className="space-y-1">
                      {section.videos.map((vid, vIdx) => {
                        const isCurrent = vid.id === Number(videoId);
                        const isDone = vid.isCompleted ?? false;
                        const isLocked = vid.locked && !isCurrent;

                        return (
                          <button
                            key={vid.id}
                            disabled={!!isLocked}
                            onClick={() => goToVideo(vid)}
                            className={`w-full text-left px-4 py-3 rounded-xl flex items-start gap-3 transition-all
                              ${isCurrent
                                ? 'bg-indigo-600 shadow-lg shadow-indigo-500/20'
                                : isLocked
                                  ? 'opacity-40 cursor-not-allowed'
                                  : 'hover:bg-white/5 cursor-pointer'
                              }`}
                          >
                            {/* Status icon */}
                            <div className={`mt-0.5 flex-shrink-0 ${
                              isCurrent ? 'text-white' :
                              isDone ? 'text-green-400' :
                              isLocked ? 'text-slate-600' : 'text-slate-400'
                            }`}>
                              {isLocked
                                ? <Lock className="w-4 h-4" />
                                : isCurrent
                                  ? <PlayCircle className="w-4 h-4" />
                                  : isDone
                                    ? <CheckCircle className="w-4 h-4" />
                                    : <Circle className="w-4 h-4" />}
                            </div>

                            {/* Video info */}
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium leading-snug ${
                                isCurrent ? 'text-white' :
                                isDone ? 'text-slate-300' :
                                isLocked ? 'text-slate-500' : 'text-slate-300'
                              }`}>
                                {vIdx + 1}. {vid.title}
                              </p>
                              <p className={`text-xs mt-1 ${
                                isCurrent ? 'text-indigo-200' : 'text-slate-500'
                              }`}>
                                {vid.duration
                                  ? `${Math.floor(vid.duration / 60)}:${(vid.duration % 60)
                                      .toString()
                                      .padStart(2, '0')}`
                                  : '--:--'}
                                {isDone && !isCurrent && (
                                  <span className="ml-2 text-green-500">✓ Done</span>
                                )}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Learn;
