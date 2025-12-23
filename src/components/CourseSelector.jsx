import { useState, useMemo } from 'react';
import { Search, X, CheckCircle2, Circle } from 'lucide-react';
import coursesData from '../data/courses.json';
import { getCourseCountByCategory } from '../utils/categories';

const POPULAR_COURSE_IDS = [
  'ai-for-everyone',
  'generative-ai-for-everyone',
  'machine-learning-specialization',
  'deep-learning-specialization',
  'generative-ai-with-llms',
  'chatgpt-prompt-engineering-for-developers',
];

const CATEGORY_TABS = [
  { id: 'popular', label: 'Popular' },
  { id: 'all', label: 'All' },
  { id: 'agents', label: 'Agents' },
  { id: 'rag', label: 'RAG' },
  { id: 'training', label: 'Training' },
  { id: 'prompting', label: 'Prompting' },
  { id: 'deployment', label: 'MLOps' },
  { id: 'coding', label: 'Coding' },
  { id: 'general', label: 'General' },
  { id: 'safety', label: 'Safety' },
  { id: 'privacy', label: 'Privacy' },
];

export default function CourseSelector({ selected = [], onChange }) {
  const [activeCategory, setActiveCategory] = useState('popular');
  const [searchTerm, setSearchTerm] = useState('');

  const allCourses = coursesData.courses;

  const categoryCounts = useMemo(() => {
    const counts = getCourseCountByCategory(allCourses);
    counts.popular = POPULAR_COURSE_IDS.length;
    return counts;
  }, [allCourses]);

  const filteredCourses = useMemo(() => {
    let courses = allCourses;

    if (activeCategory === 'popular') {
      courses = courses.filter(c => POPULAR_COURSE_IDS.includes(c.id));
    } else if (activeCategory !== 'all') {
      courses = courses.filter(c => c.categories?.includes(activeCategory));
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      courses = courses.filter(c =>
        c.title.toLowerCase().includes(term) ||
        c.id.toLowerCase().includes(term)
      );
    }

    return courses;
  }, [activeCategory, searchTerm, allCourses]);

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

  const getTypeLabel = (type) => {
    if (type === 'certificate') return 'Certificate';
    if (type === 'course') return 'Course';
    return 'Short';
  };

  const getDifficultyLabel = (diff) => {
    if (diff === 'beginner') return 'Beg';
    if (diff === 'intermediate') return 'Int';
    if (diff === 'advanced') return 'Adv';
    return diff;
  };

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
              <span className="max-w-[120px] sm:max-w-[200px] truncate">{getCourseName(courseId)}</span>
              <button
                onClick={() => removeCourse(courseId)}
                className="ml-1 p-1 -mr-1 min-w-[24px] min-h-[24px] flex items-center justify-center hover:text-white hover:bg-[var(--node-cyan)]/30 rounded transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
        <input
          type="text"
          placeholder={`Search ${activeCategory === 'all' ? 'all' : activeCategory === 'popular' ? 'popular' : activeCategory} courses...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-[var(--elevated)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--node-cyan)] transition-colors"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-[var(--elevated)] rounded"
          >
            <X className="w-4 h-4 text-[var(--text-muted)]" />
          </button>
        )}
      </div>

      {/* Category tabs */}
      <div className="relative -mx-1">
        <div className="flex gap-2 overflow-x-auto pb-2 px-1 scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
          {CATEGORY_TABS.map(tab => {
            const count = categoryCounts[tab.id] || 0;
            const isActive = activeCategory === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveCategory(tab.id);
                  setSearchTerm('');
                }}
                className={`flex-shrink-0 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[var(--node-cyan)] text-[var(--bg-primary)]'
                    : 'bg-[var(--elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)]'
                }`}
              >
                {tab.id === 'popular' && <span className="mr-1">⭐</span>}
                {tab.label}
                {count > 0 && (
                  <span className={`ml-1.5 ${isActive ? 'opacity-80' : 'text-[var(--text-muted)]'}`}>
                    ({count})
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Course list */}
      <div className="border border-[var(--border)] rounded-xl overflow-hidden">
        <div className="max-h-[280px] overflow-y-auto">
          {filteredCourses.length > 0 ? (
            filteredCourses.map(course => {
              const isSelected = selected.includes(course.id);
              return (
                <button
                  key={course.id}
                  onClick={() => toggleCourse(course.id)}
                  className={`w-full text-left px-4 py-3 flex items-center gap-3 border-b border-[var(--border)] last:border-b-0 transition-colors ${
                    isSelected
                      ? 'bg-[var(--node-cyan-dim)]'
                      : 'hover:bg-[var(--elevated)]'
                  }`}
                >
                  {isSelected ? (
                    <CheckCircle2 className="w-5 h-5 text-[var(--node-cyan)] flex-shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-[var(--text-muted)] flex-shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className={`font-medium truncate ${isSelected ? 'text-[var(--node-cyan)]' : 'text-[var(--text-primary)]'}`}>
                      {course.title}
                    </div>
                    <div className="text-xs text-[var(--text-muted)] mt-0.5 flex items-center gap-2">
                      <span>{getTypeLabel(course.type)}</span>
                      <span>•</span>
                      <span>{getDifficultyLabel(course.difficulty)}</span>
                      {course.platform === 'coursera' && (
                        <>
                          <span>•</span>
                          <span>Coursera</span>
                        </>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="px-4 py-8 text-center text-[var(--text-muted)]">
              {searchTerm ? (
                <p>No courses found for "{searchTerm}" in {activeCategory === 'popular' ? 'popular courses' : activeCategory === 'all' ? 'all courses' : `${activeCategory} category`}</p>
              ) : (
                <p>No courses in this category</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Count indicator */}
      <p className="text-xs text-[var(--text-muted)] text-center">
        {searchTerm ? (
          <>Found {filteredCourses.length} {filteredCourses.length === 1 ? 'course' : 'courses'}</>
        ) : (
          <>Showing {filteredCourses.length} of {allCourses.length} courses</>
        )}
        {selected.length > 0 && (
          <> • {selected.length} selected</>
        )}
      </p>
    </div>
  );
}
