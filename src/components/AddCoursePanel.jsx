import { useState, useMemo } from 'react';
import { Search, X, Plus } from 'lucide-react';
import coursesData from '../data/courses.json';
import { getDifficultyColor } from '../utils/pathwayGenerator';

const MAX_RESULTS = 8;

/**
 * Search the full catalog and add any course to the roadmap, whatever the
 * learner's path or profile. Courses already in the roadmap aren't offered.
 */
export default function AddCoursePanel({ roadmapCourseIds, onAdd, onClose, notice }) {
  const [searchTerm, setSearchTerm] = useState('');

  const matches = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return [];
    return coursesData.courses.filter(c =>
      !roadmapCourseIds.has(c.id) && (
        c.title.toLowerCase().includes(term) ||
        c.id.toLowerCase().includes(term) ||
        c.partner?.toLowerCase().includes(term) ||
        c.skills_taught?.some(s => s.toLowerCase().includes(term))
      )
    );
  }, [searchTerm, roadmapCourseIds]);

  return (
    <div data-testid="add-course-panel" className="mt-4 bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-medium text-[var(--text-primary)]">Add any course to your roadmap</h4>
        <button
          onClick={onClose}
          className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-lg"
          aria-label="Close course search"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
        <input
          type="search"
          autoFocus
          aria-label="Search all courses"
          placeholder="Search all courses, e.g. Deep Learning Specialization"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-[var(--elevated)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--node-cyan)] transition-colors"
        />
      </div>

      <p role="status" className="mt-2 min-h-[1.25rem] text-sm text-emerald-400">{notice}</p>

      {searchTerm.trim() && (
        <ul className="mt-3 border border-[var(--border)] rounded-xl overflow-hidden">
          {matches.length > 0 ? (
            matches.slice(0, MAX_RESULTS).map(course => (
              <li key={course.id} className="border-b border-[var(--border)] last:border-b-0">
                <button
                  onClick={() => onAdd(course)}
                  aria-label={`Add ${course.title}`}
                  className="w-full text-left px-4 py-3 min-h-[44px] flex items-center gap-3 hover:bg-[var(--elevated)] transition-colors"
                >
                  <Plus className="w-5 h-5 text-[var(--node-cyan)] flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-[var(--text-primary)] truncate">{course.title}</div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
                      <span className={`px-2 py-0.5 rounded-full border ${getDifficultyColor(course.difficulty)}`}>
                        {course.difficulty}
                      </span>
                      <span>{course.estimated_hours || 3} hrs</span>
                      {course.partner && <span>• {course.partner}</span>}
                    </div>
                  </div>
                </button>
              </li>
            ))
          ) : (
            <li className="px-4 py-6 text-center text-sm text-[var(--text-muted)]">
              No courses outside your roadmap match "{searchTerm.trim()}"
            </li>
          )}
          {matches.length > MAX_RESULTS && (
            <li className="px-4 py-2 text-center text-xs text-[var(--text-muted)]">
              Showing {MAX_RESULTS} of {matches.length} matches. Keep typing to narrow them down.
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
