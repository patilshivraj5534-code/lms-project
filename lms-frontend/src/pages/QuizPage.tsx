import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Trophy, RotateCcw, ArrowLeft, AlertCircle } from 'lucide-react';
import api from '../services/api/axios';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Question {
  id: number;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  orderIndex: number;
}

interface QuizData {
  id: number;
  courseId: number;
  title: string;
  questions: Question[];
}

interface QuizResult {
  score: number;
  total: number;
  percentage: number;
  passed: boolean;
  correctAnswers: Record<number, string>;
  yourAnswers: Record<number, string>;
}

// ── Option Button ─────────────────────────────────────────────────────────────

const OptionBtn: React.FC<{
  label: string;
  text: string;
  selected: boolean;
  correct?: boolean;
  wrong?: boolean;
  disabled?: boolean;
  onClick: () => void;
}> = ({ label, text, selected, correct, wrong, disabled, onClick }) => {
  const base = 'w-full flex items-start gap-3 px-4 py-3 rounded-xl border text-left transition-all duration-200 text-sm';
  let style = 'border-white/10 bg-slate-800/60 hover:bg-slate-800 hover:border-indigo-500/40 text-slate-300';
  if (selected && !correct && !wrong) style = 'border-indigo-500 bg-indigo-500/15 text-white';
  if (correct) style = 'border-green-500 bg-green-500/15 text-green-300';
  if (wrong) style = 'border-red-500 bg-red-500/15 text-red-300';

  return (
    <button className={`${base} ${style} ${disabled ? 'cursor-default' : 'cursor-pointer'}`}
      onClick={onClick} disabled={disabled}>
      <span className={`flex-shrink-0 w-6 h-6 rounded-full border flex items-center justify-center text-xs font-bold
        ${correct ? 'border-green-400 text-green-400' : wrong ? 'border-red-400 text-red-400' : selected ? 'border-indigo-400 text-indigo-400' : 'border-slate-600 text-slate-500'}`}>
        {label}
      </span>
      <span className="flex-1 leading-snug">{text}</span>
    </button>
  );
};

// ── Result Card ───────────────────────────────────────────────────────────────

const ResultCard: React.FC<{ result: QuizResult; quiz: QuizData; onRetake: () => void; onBack: () => void }> =
  ({ result, quiz, onRetake, onBack }) => {
    const circumference = 2 * Math.PI * 54;
    const offset = circumference - (result.percentage / 100) * circumference;

    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl mx-auto px-4 py-10">
        {/* Score ring */}
        <div className="text-center mb-8">
          <div className="relative inline-flex items-center justify-center mb-4">
            <svg width="128" height="128" className="-rotate-90">
              <circle cx="64" cy="64" r="54" fill="none" stroke="#1e293b" strokeWidth="10" />
              <circle cx="64" cy="64" r="54" fill="none"
                stroke={result.passed ? '#22c55e' : '#ef4444'}
                strokeWidth="10" strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                style={{ transition: 'stroke-dashoffset 1s ease' }} />
            </svg>
            <div className="absolute text-center">
              <p className={`text-3xl font-bold ${result.passed ? 'text-green-400' : 'text-red-400'}`}>
                {Math.round(result.percentage)}%
              </p>
            </div>
          </div>
          <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold mb-2
            ${result.passed ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
            {result.passed ? <><Trophy className="w-4 h-4" /> Passed!</> : <><XCircle className="w-4 h-4" /> Not passed</>}
          </div>
          <p className="text-white text-xl font-bold">{result.score} / {result.total} correct</p>
          <p className="text-slate-400 text-sm mt-1">Pass mark: 60%</p>
        </div>

        {/* Review answers */}
        <div className="space-y-4 mb-8">
          <h3 className="text-slate-300 font-semibold text-sm uppercase tracking-wider">Answer Review</h3>
          {quiz.questions.map((q, i) => {
            const correct = result.correctAnswers[q.id];
            const yours = result.yourAnswers[q.id];
            const isRight = correct === yours;
            return (
              <div key={q.id} className={`rounded-xl border p-4 ${isRight ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5'}`}>
                <p className="text-white text-sm font-medium mb-1">
                  {i + 1}. {q.questionText}
                </p>
                <p className="text-xs text-slate-400">
                  {isRight
                    ? <span className="text-green-400 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Correct — {correct}</span>
                    : <span className="text-red-400 flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> You chose {yours || '—'}, correct: {correct}</span>
                  }
                </p>
              </div>
            );
          })}
        </div>

        <div className="flex gap-3">
          <button onClick={onBack}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Course
          </button>
          <button onClick={onRetake}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors">
            <RotateCcw className="w-4 h-4" /> Retake Quiz
          </button>
        </div>
      </motion.div>
    );
  };

// ── Main QuizPage ─────────────────────────────────────────────────────────────

const QuizPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);

  useEffect(() => { fetchQuiz(); }, [courseId]);

  const fetchQuiz = async () => {
    setLoading(true); setError(''); setResult(null); setAnswers({});
    try {
      const { data } = await api.get<QuizData>(`/courses/${courseId}/quiz`);
      setQuiz(data);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to load quiz.');
    } finally { setLoading(false); }
  };

  const submit = async () => {
    if (!quiz) return;
    const unanswered = quiz.questions.filter(q => !answers[q.id]);
    if (unanswered.length > 0) {
      alert(`Please answer all questions. ${unanswered.length} question(s) remaining.`);
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await api.post<QuizResult>(`/courses/${courseId}/quiz/submit`, { answers });
      setResult(data);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e: any) {
      alert(e.response?.data?.message || 'Submission failed.');
    } finally { setSubmitting(false); }
  };

  const options: { label: string; key: keyof Question }[] = [
    { label: 'A', key: 'optionA' },
    { label: 'B', key: 'optionB' },
    { label: 'C', key: 'optionC' },
    { label: 'D', key: 'optionD' },
  ];

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500" />
    </div>
  );

  if (error) return (
    <div className="max-w-xl mx-auto px-4 py-16 text-center">
      <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
      <p className="text-red-400 text-lg">{error}</p>
      <button onClick={() => navigate(-1)}
        className="mt-6 px-5 py-2.5 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 transition-colors text-sm">
        Go Back
      </button>
    </div>
  );

  if (!quiz) return null;

  if (result) {
    return <ResultCard result={result} quiz={quiz}
      onRetake={fetchQuiz} onBack={() => navigate(`/course/${courseId}`)} />;
  }

  const answered = Object.keys(answers).length;
  const total = quiz.questions.length;
  const progress = total > 0 ? (answered / total) * 100 : 0;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <button onClick={() => navigate(`/course/${courseId}`)}
          className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Course
        </button>
        <h1 className="text-2xl font-bold text-white">{quiz.title}</h1>
        <p className="text-slate-400 text-sm mt-1">{total} question{total !== 1 ? 's' : ''}</p>

        {/* Progress bar */}
        <div className="mt-4 flex items-center gap-3">
          <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
            <motion.div className="h-full bg-indigo-500 rounded-full"
              animate={{ width: `${progress}%` }} transition={{ duration: 0.4 }} />
          </div>
          <span className="text-xs text-slate-400 w-16 text-right">{answered}/{total} done</span>
        </div>
      </motion.div>

      {/* Questions */}
      <div className="space-y-6">
        <AnimatePresence>
          {quiz.questions.map((q, i) => (
            <motion.div key={q.id}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="bg-slate-900 border border-white/10 rounded-2xl p-5">
              <p className="text-white font-medium mb-4">
                <span className="text-indigo-400 font-semibold mr-2">{i + 1}.</span>
                {q.questionText}
              </p>
              <div className="space-y-2">
                {options.map(o => {
                  const val = q[o.key] as string;
                  return (
                    <OptionBtn key={o.label} label={o.label} text={val}
                      selected={answers[q.id] === o.label}
                      onClick={() => setAnswers(prev => ({ ...prev, [q.id]: o.label }))} />
                  );
                })}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Submit */}
      <div className="mt-8">
        <button onClick={submit} disabled={submitting}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700
            text-white font-semibold text-base transition-all disabled:opacity-50 shadow-lg shadow-indigo-500/20">
          {submitting ? 'Submitting…' : `Submit Quiz (${answered}/${total} answered)`}
        </button>
        {answered < total && (
          <p className="text-center text-slate-500 text-xs mt-2">
            Answer all questions to submit
          </p>
        )}
      </div>
    </div>
  );
};

export default QuizPage;
