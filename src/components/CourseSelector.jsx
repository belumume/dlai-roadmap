import { useState, useMemo } from 'react';
import { Search, X, CheckCircle2 } from 'lucide-react';
import coursesData from '../data/courses.json';

// Popular courses to show as quick picks
const POPULAR_COURSE_IDS = [
  'ai-for-everyone',
  'generative-ai-for-everyone',
  'machine-learning-specialization',
  'deep-learning-specialization',
  'generative-ai-with-llms',
  'chatgpt-prompt-engineering',
];

export default function CourseSelector({ selected = [], onChange }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const allCourses = coursesData.courses;

  // Get popular courses
  const popularCourses = useMemo(() => {
    return POPULAR_COURSE_IDS
      .map(id => allCourses.find(c => c.id === id))
      .filter(Boolean);
  }, [allCourses]);

  // Filter courses based on search
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return allCourses
      .filter(course =>
        course.title.toLowerCase().includes(query) ||
        course.id.toLowerCase().includes(query)
      )
      .slice(0, 8); // Limit results
  }, [searchQuery, allCourses]);

  const toggleCourse = (courseId) => {
    if (selected.includes(courseId)) {
      onChange(selected.filter(id => id !== courseId));
    } else {
      onChange([...selected, courseId]);
    }
  };

  const removeCourse = (courseId) => {
    onChange(selected.filter(id => id !== courseId));
  };

  const getCourseName = (courseId) => {
    const course = allCourses.find(c => c.id === courseId);
    return course?.title || courseId;
  };

  const showSearchResults = isSearchFocused && searchQuery.trim().length > 0;

  return (
    <div className="space-y-4">
      {/* Selected courses as chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {selected.map(courseId => (
            <span
              key={courseId}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-[var(--node-cyan-dim)] border border-[var(--node-cyan)]/30 rounded-full text-sm text-[var(--node-cyan)]"
            >
              <span className="max-w-[200px] truncate">{getCourseName(courseId)}</span>
              <button
                onClick={() => removeCourse(courseId)}
                className="ml-1 hover:text-white transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder={`Search all ${courses.length} courses...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
            className="w-full pl-10 pr-4 py-3 bg-[var(--elevated)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--node-cyan)] transition-colors"
          />
        </div>

        {/* Search results dropdown */}
        {showSearchResults && (
          <div className="absolute z-20 w-full mt-2 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-xl max-h-64 overflow-y-auto">
            {searchResults.length > 0 ? (
              searchResults.map(course => {
                const isSelected = selected.includes(course.id);
                return (
                  <button
                    key={course.id}
                    onMouseDown={(e) => {
                      e.preventDefault(); // Prevent blur from firing
                      toggleCourse(course.id);
                      setSearchQuery('');
                    }}
                    className={`w-full text-left px-4 py-3 hover:bg-[var(--elevated)] transition-colors flex items-center justify-between ${
                      isSelected ? 'bg-[var(--node-cyan-dim)]' : ''
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className={`font-medium truncate ${isSelected ? 'text-[var(--node-cyan)]' : 'text-[var(--text-primary)]'}`}>
                        {course.title}
                      </div>
                      <div className="text-xs text-[var(--text-muted)]">
                        {course.type === 'certificate' ? 'Certificate' : course.type === 'course' ? 'Course' : 'Short Course'} • {course.difficulty}{course.platform === 'coursera' ? ' • Coursera' : ''}
                      </div>
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="w-5 h-5 text-[var(--node-cyan)] flex-shrink-0 ml-2" />
                    )}
                  </button>
                );
              })
            ) : (
              <div className="px-4 py-3 text-[var(--text-muted)] text-sm">
                No courses found for "{searchQuery}"
              </div>
            )}
          </div>
        )}
      </div>

      {/* Popular courses - quick picks */}
      <div>
        <p className="text-sm text-[var(--text-muted)] mb-3">Popular courses:</p>
        <div className="space-y-2">
          {popularCourses.map(course => {
            const isSelected = selected.includes(course.id);
            return (
              <button
                key={course.id}
                onClick={() => toggleCourse(course.id)}
                className={`w-full text-left p-3 rounded-xl border-2 transition-all duration-200 ${
                  isSelected
                    ? 'border-[var(--node-cyan)] bg-[var(--node-cyan-dim)]'
                    : 'border-[var(--border)] hover:border-[var(--node-cyan-dim)] hover:bg-[var(--elevated)]/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <div className={`font-medium ${isSelected ? 'text-[var(--node-cyan)]' : 'text-[var(--text-primary)]'}`}>
                      {course.title}
                    </div>
                    <div className="text-xs text-[var(--text-muted)] mt-0.5">
                      {course.type === 'certificate' ? 'Certificate' : course.type === 'course' ? 'Course' : 'Short Course'}{course.platform === 'coursera' ? ' • Coursera' : ''}
                    </div>
                  </div>
                  {isSelected && (
                    <CheckCircle2 className="w-5 h-5 text-[var(--node-cyan)] flex-shrink-0 ml-2" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
