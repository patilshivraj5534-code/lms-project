import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Search } from 'lucide-react';
import api from '../services/api/axios';
import type { CourseResponse } from '../types';

/** First word of the title for badge / filter labels (no API category field). */
function categoryLabelFromTitle(title: string): string {
  const m = title.trim().match(/[A-Za-zÀ-ÿ0-9]+/);
  if (!m) return 'General';
  const word = m[0];
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

const AllCourses: React.FC = () => {
  const [courses, setCourses] = useState<CourseResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('All');

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await api.get<CourseResponse[]>('/subjects/public');
        setCourses(response.data);
      } catch (error) {
        console.error('Failed to fetch courses', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  const categories = useMemo(() => {
    const labels = new Set<string>();
    courses.forEach((c) => labels.add(categoryLabelFromTitle(c.title)));
    return ['All', ...Array.from(labels).sort((a, b) => a.localeCompare(b))];
  }, [courses]);

  const filteredCourses = useMemo(() => {
    const q = search.trim().toLowerCase();
    return courses.filter((c) => {
      const cat = categoryLabelFromTitle(c.title);
      const matchCat = category === 'All' || cat === category;
      const matchSearch =
        !q ||
        c.title.toLowerCase().includes(q) ||
        (c.description?.toLowerCase().includes(q) ?? false);
      return matchCat && matchSearch;
    });
  }, [courses, search, category]);

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
        <h1 className="text-4xl font-display font-bold text-white mb-2">All Courses</h1>
        <p className="text-slate-400">Browse available courses</p>
      </motion.div>

      {courses.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <BookOpen className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-400 mb-2">No courses available</h3>
        </div>
      ) : (
        <>
          <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-6">
            <div className="relative w-full lg:max-w-md">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden
              />
              <input
                type="search"
                placeholder="Search courses…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                aria-label="Search courses"
              />
            </div>
            <div className="flex flex-wrap gap-2 lg:justify-end lg:pt-0.5">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                    category === cat
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:shadow-sm'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {filteredCourses.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
              <BookOpen className="mx-auto mb-4 h-12 w-12 text-slate-300" />
              <h3 className="text-lg font-semibold text-slate-800">No courses match</h3>
              <p className="mt-1 text-sm text-slate-500">Try a different search or category.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {filteredCourses.map((course, idx) => (
                <motion.article
                  key={course.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="group flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md"
                >
                  <Link to={`/course/${course.id}`} className="flex h-full flex-col focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2">
                    <div className="relative aspect-[16/9] overflow-hidden bg-slate-100">
                      {course.thumbnailUrl ? (
                        <img
                          src={course.thumbnailUrl}
                          alt={course.title}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-slate-100">
                          <BookOpen className="h-12 w-12 text-slate-300" />
                        </div>
                      )}
                      <div className="absolute left-3 top-3">
                        <span className="inline-flex rounded-md border border-slate-200 bg-white/95 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700 shadow-sm backdrop-blur-sm">
                          {categoryLabelFromTitle(course.title)}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-1 flex-col p-5">
                      <h3 className="mb-2 text-lg font-bold leading-snug text-slate-900">{course.title}</h3>
                      <p className="mb-5 flex-1 text-sm leading-relaxed text-slate-600 line-clamp-3">
                        {course.description || 'No description provided.'}
                      </p>
                      <span className="inline-flex w-full items-center justify-center rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-indigo-700 transition-colors group-hover:border-indigo-200 group-hover:bg-indigo-50">
                        View Details
                      </span>
                    </div>
                  </Link>
                </motion.article>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AllCourses;
