import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlusCircle, Trash2, Edit3, ChevronDown, ChevronUp,
  BookOpen, Video, Eye, EyeOff, Save, X, ClipboardList
} from 'lucide-react';
import api from '../services/api/axios';

// ── Types ─────────────────────────────────────────────────────────────────────

interface VideoResp {
  id: number; sectionId: number; title: string; description: string;
  youtubeId: string; durationSeconds: number; orderIndex: number;
}
interface SectionResp {
  id: number; courseId: number; title: string; orderIndex: number; videos: VideoResp[];
}
interface CourseResp {
  id: number; title: string; description: string; thumbnailUrl: string;
  price: number; status: string; createdAt: string;
}

// ── Small reusable modal ──────────────────────────────────────────────────────

const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
      className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-lg mx-4 shadow-2xl"
    >
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
      </div>
      {children}
    </motion.div>
  </div>
);

// ── Field ─────────────────────────────────────────────────────────────────────
const Field: React.FC<{
  label: string; hint?: string; value: string | number; onChange: (v: string) => void;
  type?: string; required?: boolean; placeholder?: string; as?: 'textarea';
}> = ({ label, hint, value, onChange, type = 'text', required, placeholder, as: Tag }) => (
  <div className="mb-4">
    <label className="block text-sm text-slate-300 mb-1">
      {label} {required && <span className="text-red-400">*</span>}
      {hint && <span className="text-slate-500 text-xs ml-2">{hint}</span>}
    </label>
    {Tag === 'textarea'
      ? <textarea value={value} onChange={e => onChange(e.target.value)} rows={3} placeholder={placeholder}
          className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500 resize-none" />
      : <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} required={required}
          className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500" />
    }
  </div>
);

const Btn: React.FC<{ onClick?: () => void; type?: 'button'|'submit'; variant?: 'primary'|'ghost'|'danger'; disabled?: boolean; children: React.ReactNode; className?: string }> =
  ({ onClick, type = 'button', variant = 'primary', disabled, children, className = '' }) => {
    const cls = variant === 'primary' ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
              : variant === 'danger'  ? 'bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-500/30'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300';
    return (
      <button type={type} onClick={onClick} disabled={disabled}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 ${cls} ${className}`}>
        {children}
      </button>
    );
  };

// ── Video Form Modal ──────────────────────────────────────────────────────────
const VideoForm: React.FC<{
  sectionId: number; initial?: VideoResp | null; onSave: () => void; onClose: () => void;
}> = ({ sectionId, initial, onSave, onClose }) => {
  const [f, setF] = useState({ title: initial?.title ?? '', description: initial?.description ?? '',
    youtubeId: initial?.youtubeId ?? '', durationSeconds: String(initial?.durationSeconds ?? ''),
    orderIndex: String(initial?.orderIndex ?? '') });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const set = (k: string) => (v: string) => setF(p => ({ ...p, [k]: v }));

  const extractYoutubeId = (input: string) => {
    const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = input.match(regExp);
    return (match && match[2].length === 11) ? match[2] : input;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(''); setSaving(true);
    try {
      const ytId = extractYoutubeId(f.youtubeId);
      const body = { 
        title: f.title, 
        description: f.description, 
        youtubeId: ytId,
        durationSeconds: f.durationSeconds ? Number(f.durationSeconds) : null,
        orderIndex: Number(f.orderIndex) 
      };
      if (initial) await api.put(`/instructor/videos/${initial.id}`, body);
      else await api.post(`/instructor/sections/${sectionId}/videos`, body);
      onSave();
    } catch (e: any) {
      const msg = e.response?.data?.message || e.message || 'Failed to save';
      setErr(msg);
    } finally { setSaving(false); }
  };

  return (
    <Modal title={initial ? 'Edit Lesson' : 'Add Lesson'} onClose={onClose}>
      <form onSubmit={submit}>
        <Field label="Title" required value={f.title} onChange={set('title')} placeholder="e.g. Installation & Setup" />
        <Field label="Description" value={f.description} onChange={set('description')} placeholder="Optional lesson description" as="textarea" />
        <Field label="YouTube Video ID" required hint="11-char ID only, e.g. grEKMHGYyns" value={f.youtubeId} onChange={set('youtubeId')} placeholder="grEKMHGYyns" />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Duration (seconds)" type="number" hint="optional" value={f.durationSeconds} onChange={set('durationSeconds')} placeholder="300" />
          <Field label="Order Index" type="number" required value={f.orderIndex} onChange={set('orderIndex')} placeholder="1" />
        </div>
        {err && <p className="text-red-400 text-sm mb-3">{err}</p>}
        <div className="flex justify-end gap-2 mt-2">
          <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
          <Btn type="submit" disabled={saving}><Save className="w-4 h-4" />{saving ? 'Saving…' : 'Save Lesson'}</Btn>
        </div>
      </form>
    </Modal>
  );
};

// ── Quiz Editor Modal ─────────────────────────────────────────────────────────
interface QuizQForm {
  questionText: string; optionA: string; optionB: string;
  optionC: string; optionD: string; correctOption: string; orderIndex: number;
}
const emptyQ = (): QuizQForm => ({
  questionText: '', optionA: '', optionB: '', optionC: '', optionD: '', correctOption: 'A', orderIndex: 0
});

const QuizEditorModal: React.FC<{ courseId: number; onClose: () => void }> = ({ courseId, onClose }) => {
  const [title, setTitle] = useState('');
  const [questions, setQuestions] = useState<QuizQForm[]>([emptyQ()]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  // Load existing quiz on open
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get<{ id: number; title: string; questions: any[] }>(
          `/instructor/courses/${courseId}/quiz`
        );
        setTitle(data.title);
        setQuestions(data.questions.map((q: any) => ({
          questionText: q.questionText, optionA: q.optionA, optionB: q.optionB,
          optionC: q.optionC, optionD: q.optionD, correctOption: q.correctOption,
          orderIndex: q.orderIndex,
        })));
      } catch {
        // No quiz yet — start with blank
      } finally { setLoading(false); }
    })();
  }, [courseId]);

  const setQ = (i: number, k: keyof QuizQForm) => (v: string | number) =>
    setQuestions(prev => prev.map((q, idx) => idx === i ? { ...q, [k]: v } : q));

  const addQuestion = () =>
    setQuestions(prev => [...prev, { ...emptyQ(), orderIndex: prev.length + 1 }]);

  const removeQuestion = (i: number) =>
    setQuestions(prev => prev.filter((_, idx) => idx !== i));

  const save = async () => {
    if (!title.trim()) { setErr('Quiz title is required.'); return; }
    if (questions.length === 0) { setErr('Add at least one question.'); return; }
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.questionText.trim() || !q.optionA.trim() || !q.optionB.trim() || !q.optionC.trim() || !q.optionD.trim()) {
        setErr(`Question ${i + 1}: all fields are required.`); return;
      }
    }
    setSaving(true); setErr('');
    try {
      await api.post(`/instructor/courses/${courseId}/quiz`, {
        title,
        questions: questions.map((q, i) => ({ ...q, orderIndex: i + 1 })),
      });
      onClose();
    } catch (e: any) {
      setErr(e.response?.data?.message || 'Failed to save quiz.');
    } finally { setSaving(false); }
  };

  const deleteQuiz = async () => {
    if (!confirm('Delete the entire quiz for this course?')) return;
    await api.delete(`/instructor/courses/${courseId}/quiz`);
    onClose();
  };

  const options: { label: string; key: keyof QuizQForm }[] = [
    { label: 'A', key: 'optionA' }, { label: 'B', key: 'optionB' },
    { label: 'C', key: 'optionC' }, { label: 'D', key: 'optionD' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 backdrop-blur-sm overflow-y-auto py-8">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-2xl mx-4 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-purple-400" /> Quiz Editor
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        {loading ? (
          <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" /></div>
        ) : (
          <>
            {/* Quiz title */}
            <div className="mb-5">
              <label className="block text-sm text-slate-300 mb-1">Quiz Title <span className="text-red-400">*</span></label>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Chapter 1 Assessment"
                className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500" />
            </div>

            {/* Questions */}
            <div className="space-y-5">
              {questions.map((q, i) => (
                <div key={i} className="bg-slate-800/60 rounded-xl border border-white/5 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-purple-400 text-xs font-semibold uppercase">Q{i + 1}</span>
                    {questions.length > 1 && (
                      <button onClick={() => removeQuestion(i)} className="text-red-400 hover:text-red-300">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <textarea value={q.questionText} onChange={e => setQ(i, 'questionText')(e.target.value)}
                    rows={2} placeholder="Question text…"
                    className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-white text-sm resize-none mb-3 focus:outline-none focus:border-purple-500" />
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {options.map(o => (
                      <div key={o.key}>
                        <label className="text-xs text-slate-400 mb-0.5 block">Option {o.label}</label>
                        <input value={q[o.key] as string} onChange={e => setQ(i, o.key)(e.target.value)}
                          placeholder={`Option ${o.label}`}
                          className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500" />
                      </div>
                    ))}
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Correct Answer</label>
                    <div className="flex gap-2">
                      {['A', 'B', 'C', 'D'].map(opt => (
                        <button key={opt} onClick={() => setQ(i, 'correctOption')(opt)}
                          className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors
                            ${q.correctOption === opt ? 'bg-green-600 text-white' : 'bg-slate-900 text-slate-400 hover:bg-slate-700'}`}>
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Add question */}
            <button onClick={addQuestion}
              className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 text-sm text-purple-400
                border border-dashed border-purple-500/40 rounded-xl hover:border-purple-500 transition-colors">
              <PlusCircle className="w-4 h-4" /> Add Question
            </button>

            {err && <p className="text-red-400 text-sm mt-3">{err}</p>}

            <div className="flex gap-2 mt-5">
              <Btn variant="danger" onClick={deleteQuiz} className="flex-shrink-0"><Trash2 className="w-3.5 h-3.5" /> Delete Quiz</Btn>
              <div className="flex-1" />
              <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
              <Btn onClick={save} disabled={saving}><Save className="w-4 h-4" />{saving ? 'Saving…' : 'Save Quiz'}</Btn>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};

const SectionForm: React.FC<{
  courseId: number; initial?: SectionResp | null; onSave: () => void; onClose: () => void;
}> = ({ courseId, initial, onSave, onClose }) => {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [order, setOrder] = useState(String(initial?.orderIndex ?? ''));
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(''); setSaving(true);
    try {
      const body = { title, orderIndex: Number(order) };
      if (initial) await api.put(`/instructor/sections/${initial.id}`, body);
      else await api.post(`/instructor/courses/${courseId}/sections`, body);
      onSave();
    } catch (e: any) { setErr(e.response?.data?.message ?? 'Failed to save'); }
    finally { setSaving(false); }
  };

  return (
    <Modal title={initial ? 'Edit Section' : 'Add Section'} onClose={onClose}>
      <form onSubmit={submit}>
        <Field label="Section Title" required value={title} onChange={setTitle} placeholder="e.g. Getting Started" />
        <Field label="Order Index" type="number" required value={order} onChange={setOrder} placeholder="1" />
        {err && <p className="text-red-400 text-sm mb-3">{err}</p>}
        <div className="flex justify-end gap-2 mt-2">
          <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
          <Btn type="submit" disabled={saving}><Save className="w-4 h-4" />{saving ? 'Saving…' : 'Save Section'}</Btn>
        </div>
      </form>
    </Modal>
  );
};

// ── Course Form Modal ─────────────────────────────────────────────────────────
const CourseForm: React.FC<{ initial?: CourseResp | null; onSave: () => void; onClose: () => void }> = ({ initial, onSave, onClose }) => {
  const [f, setF] = useState({ title: initial?.title ?? '', description: initial?.description ?? '',
    thumbnailUrl: initial?.thumbnailUrl ?? '', price: String(initial?.price ?? '0') });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const set = (k: string) => (v: string) => setF(p => ({ ...p, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(''); setSaving(true);
    try {
      const body = { ...f, price: Number(f.price) };
      if (initial) await api.put(`/instructor/courses/${initial.id}`, body);
      else await api.post('/instructor/courses', body);
      onSave();
    } catch (e: any) { setErr(e.response?.data?.message ?? 'Failed to save'); }
    finally { setSaving(false); }
  };

  return (
    <Modal title={initial ? 'Edit Course' : 'Create Course'} onClose={onClose}>
      <form onSubmit={submit}>
        <Field label="Course Title" required value={f.title} onChange={set('title')} placeholder="e.g. Intro to Java" />
        <Field label="Description" value={f.description} onChange={set('description')} as="textarea" placeholder="What students will learn…" />
        <Field label="Thumbnail URL" value={f.thumbnailUrl} onChange={set('thumbnailUrl')} placeholder="https://…" />
        <Field label="Price (USD)" type="number" required value={f.price} onChange={set('price')} placeholder="0" />
        {err && <p className="text-red-400 text-sm mb-3">{err}</p>}
        <div className="flex justify-end gap-2 mt-2">
          <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
          <Btn type="submit" disabled={saving}><Save className="w-4 h-4" />{saving ? 'Saving…' : 'Save Course'}</Btn>
        </div>
      </form>
    </Modal>
  );
};

// ── Section Panel (with its videos) ──────────────────────────────────────────
const SectionPanel: React.FC<{ section: SectionResp; courseId: number; onRefresh: () => void }> = ({ section, courseId, onRefresh }) => {
  const [open, setOpen] = useState(true);
  const [showVideoForm, setShowVideoForm] = useState(false);
  const [editVideo, setEditVideo] = useState<VideoResp | null>(null);
  const [editSection, setEditSection] = useState(false);

  const delSection = async () => {
    if (!confirm(`Delete section "${section.title}" and all its lessons?`)) return;
    await api.delete(`/instructor/sections/${section.id}`);
    onRefresh();
  };
  const delVideo = async (v: VideoResp) => {
    if (!confirm(`Delete lesson "${v.title}"?`)) return;
    await api.delete(`/instructor/videos/${v.id}`);
    onRefresh();
  };

  return (
    <div className="bg-slate-800/50 rounded-xl border border-white/5 overflow-hidden mb-3">
      {/* Section header */}
      <div className="flex items-center justify-between px-5 py-3 bg-slate-800/80">
        <button onClick={() => setOpen(!open)} className="flex items-center gap-2 text-left flex-1">
          {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          <span className="text-indigo-400 text-xs font-semibold uppercase tracking-wider mr-1">§{section.orderIndex}</span>
          <span className="text-white font-medium">{section.title}</span>
          <span className="text-slate-500 text-xs ml-2">{section.videos.length} lesson{section.videos.length !== 1 ? 's' : ''}</span>
        </button>
        <div className="flex gap-1">
          <Btn variant="ghost" onClick={() => setEditSection(true)}><Edit3 className="w-3.5 h-3.5" /></Btn>
          <Btn variant="danger" onClick={delSection}><Trash2 className="w-3.5 h-3.5" /></Btn>
        </div>
      </div>

      {/* Videos list */}
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="p-4 space-y-2">
              {section.videos.length === 0 && (
                <p className="text-slate-500 text-sm text-center py-4">No lessons yet. Add one below.</p>
              )}
              {section.videos.map(v => (
                <div key={v.id} className="flex items-center gap-3 bg-slate-900/50 rounded-lg px-4 py-3 border border-white/5">
                  <Video className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate">{v.orderIndex}. {v.title}</p>
                    <p className="text-xs text-slate-500 flex gap-3 mt-0.5">
                      <span>ID: <code className="text-indigo-300">{v.youtubeId}</code></span>
                      {v.durationSeconds && <span>{Math.floor(v.durationSeconds/60)}:{String(v.durationSeconds%60).padStart(2,'0')}</span>}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Btn variant="ghost" onClick={() => setEditVideo(v)}><Edit3 className="w-3.5 h-3.5" /></Btn>
                    <Btn variant="danger" onClick={() => delVideo(v)}><Trash2 className="w-3.5 h-3.5" /></Btn>
                  </div>
                </div>
              ))}
              <button
                onClick={() => setShowVideoForm(true)}
                className="w-full flex items-center justify-center gap-2 py-2 text-sm text-indigo-400 hover:text-indigo-300 border border-dashed border-indigo-500/30 rounded-lg hover:border-indigo-500/60 transition-colors"
              >
                <PlusCircle className="w-4 h-4" /> Add Lesson
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {showVideoForm && <VideoForm sectionId={section.id} onSave={() => { setShowVideoForm(false); onRefresh(); }} onClose={() => setShowVideoForm(false)} />}
      {editVideo && <VideoForm sectionId={section.id} initial={editVideo} onSave={() => { setEditVideo(null); onRefresh(); }} onClose={() => setEditVideo(null)} />}
      {editSection && <SectionForm courseId={courseId} initial={section} onSave={() => { setEditSection(false); onRefresh(); }} onClose={() => setEditSection(false)} />}
    </div>
  );
};

// ── Course Card (expanded view) ───────────────────────────────────────────────
const CourseCard: React.FC<{ course: CourseResp; onRefresh: () => void }> = ({ course, onRefresh }) => {
  const [expanded, setExpanded] = useState(false);
  const [sections, setSections] = useState<SectionResp[]>([]);
  const [loadingSec, setLoadingSec] = useState(false);
  const [showSectionForm, setShowSectionForm] = useState(false);
  const [editCourse, setEditCourse] = useState(false);
  const [showQuizEditor, setShowQuizEditor] = useState(false);

  const loadSections = async () => {
    setLoadingSec(true);
    try { const r = await api.get<SectionResp[]>(`/instructor/courses/${course.id}/sections`); setSections(r.data); }
    finally { setLoadingSec(false); }
  };

  const toggle = () => {
    if (!expanded) loadSections();
    setExpanded(!expanded);
  };

  const refreshSections = () => loadSections();

  const togglePublish = async () => {
    try {
      const action = course.status === 'PUBLISHED' ? 'unpublish' : 'publish';
      await api.patch(`/instructor/courses/${course.id}/${action}`);
      onRefresh();
    } catch (e: any) {
      alert('Failed to publish: ' + (e.response?.data?.message || e.message));
    }
  };

  const delCourse = async () => {
    if (!confirm(`Permanently delete "${course.title}"?`)) return;
    await api.delete(`/instructor/courses/${course.id}`);
    onRefresh();
  };

  const isPublished = course.status === 'PUBLISHED';

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="bg-slate-900 border border-white/10 rounded-2xl overflow-hidden mb-4">
      {/* Course header row */}
      <div className="flex items-center gap-4 p-5">
        <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
          <BookOpen className="w-6 h-6 text-indigo-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-white font-semibold truncate">{course.title}</h3>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isPublished ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'}`}>
              {isPublished ? 'Published' : 'Draft'}
            </span>
          </div>
          <p className="text-slate-500 text-sm truncate mt-0.5">{course.description || 'No description'}</p>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Btn variant="ghost" onClick={togglePublish}>
            {isPublished ? <><EyeOff className="w-3.5 h-3.5" /> Unpublish</> : <><Eye className="w-3.5 h-3.5" /> Publish</>}
          </Btn>
          <Btn variant="ghost" onClick={() => setShowQuizEditor(true)}><ClipboardList className="w-3.5 h-3.5" /> Quiz</Btn>
          <Btn variant="ghost" onClick={() => setEditCourse(true)}><Edit3 className="w-3.5 h-3.5" /></Btn>
          <Btn variant="danger" onClick={delCourse}><Trash2 className="w-3.5 h-3.5" /></Btn>
          <button onClick={toggle} className="ml-1 p-2 text-slate-400 hover:text-white transition-colors">
            {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Sections */}
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="border-t border-white/5 p-5">
              {loadingSec
                ? <div className="flex justify-center py-6"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" /></div>
                : <>
                    {sections.map(s => <SectionPanel key={s.id} section={s} courseId={course.id} onRefresh={refreshSections} />)}
                    <button
                      onClick={() => setShowSectionForm(true)}
                      className="w-full flex items-center justify-center gap-2 py-3 text-sm text-indigo-400 hover:text-indigo-300 border border-dashed border-indigo-500/30 rounded-xl hover:border-indigo-500/60 transition-colors mt-1"
                    >
                      <PlusCircle className="w-4 h-4" /> Add Section
                    </button>
                  </>
              }
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {showSectionForm && <SectionForm courseId={course.id} onSave={() => { setShowSectionForm(false); refreshSections(); }} onClose={() => setShowSectionForm(false)} />}
      {editCourse && <CourseForm initial={course} onSave={() => { setEditCourse(false); onRefresh(); }} onClose={() => setEditCourse(false)} />}
      {showQuizEditor && <QuizEditorModal courseId={course.id} onClose={() => setShowQuizEditor(false)} />}
    </motion.div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const InstructorDashboard: React.FC = () => {
  const [courses, setCourses] = useState<CourseResp[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const load = async () => {
    setLoading(true);
    try { const r = await api.get<CourseResp[]>('/instructor/courses'); setCourses(r.data); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-white">Instructor Dashboard</h1>
          <p className="text-slate-400 mt-1">Manage your courses, sections, and lessons</p>
        </div>
        <Btn onClick={() => setShowCreate(true)}>
          <PlusCircle className="w-4 h-4" /> New Course
        </Btn>
      </motion.div>

      {loading
        ? <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500" /></div>
        : courses.length === 0
          ? (
            <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl">
              <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 mb-4">You haven't created any courses yet.</p>
              <Btn onClick={() => setShowCreate(true)}><PlusCircle className="w-4 h-4" /> Create your first course</Btn>
            </div>
          )
          : courses.map(c => <CourseCard key={c.id} course={c} onRefresh={load} />)
      }

      {showCreate && <CourseForm onSave={() => { setShowCreate(false); load(); }} onClose={() => setShowCreate(false)} />}
    </div>
  );
};

export default InstructorDashboard;
