import { useState, useEffect } from 'react';
import {
  Download, Share2, ChevronDown, ChevronUp, ExternalLink,
  Clock, BookOpen, Trophy, RefreshCw, CheckCircle, Circle,
  Calendar, Target, Zap, Copy, Check, Filter, X, Star, AlertTriangle
} from 'lucide-react';
import { formatDuration, getDifficultyColor, getPathwayDescription } from '../utils/pathwayGenerator';
import { exportRoadmapPDF, generateShareableURL } from '../utils/exportPDF';
import { exportAndDownloadCalendar } from '../utils/exportCalendar';
import { getCategoryLabel } from '../utils/categories';

const STORAGE_KEY = 'dlai-roadmap-progress';

const DIFFICULTY_ORDER = ['beginner', 'intermediate', 'advanced'];

export default function RoadmapView({ roadmap, onRestart }) {
  const [expandedPhases, setExpandedPhases] = useState(new Set([0]));
  const [filters, setFilters] = useState({ categories: [], difficulties: [] });
  const [showFilters, setShowFilters] = useState(false);
  const [completedCourses, setCompletedCourses] = useState(() => {
    // Load from localStorage on init
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.completedCourses && Array.isArray(parsed.completedCourses)) {
          const validated = parsed.completedCourses
            .filter(id => typeof id === 'string' && id.length < 100)
            .slice(0, 200);
          return new Set(validated);
        }
      }
    } catch (e) {
      console.error('Failed to load progress:', e);
    }
    return new Set();
  });
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Save progress to localStorage when completedCourses changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        completedCourses: Array.from(completedCourses),
        pathway: roadmap.pathway,
        lastUpdated: new Date().toISOString(),
      }));
    } catch (e) {
      console.error('Failed to save progress:', e);
    }
  }, [completedCourses, roadmap.pathway]);

  const { pathway, pathwayName, phases, summary, milestones } = roadmap;
  const pathwayInfo = getPathwayDescription(pathway);

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      await exportRoadmapPDF(roadmap);
    } catch (error) {
      console.error('Failed to export PDF:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleShare = async () => {
    const url = generateShareableURL(roadmap.answers);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const togglePhase = (index) => {
    const newExpanded = new Set(expandedPhases);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedPhases(newExpanded);
  };

  const toggleCourseComplete = (courseId) => {
    const newCompleted = new Set(completedCourses);
    if (newCompleted.has(courseId)) {
      newCompleted.delete(courseId);
    } else {
      newCompleted.add(courseId);
    }
    setCompletedCourses(newCompleted);
  };

  const toggleCategoryFilter = (category) => {
    setFilters(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
  };

  const toggleDifficultyFilter = (difficulty) => {
    setFilters(prev => ({
      ...prev,
      difficulties: prev.difficulties.includes(difficulty)
        ? prev.difficulties.filter(d => d !== difficulty)
        : [...prev.difficulties, difficulty]
    }));
  };

  const clearFilters = () => {
    setFilters({ categories: [], difficulties: [] });
  };

  const courseMatchesFilters = (course) => {
    if (filters.categories.length === 0 && filters.difficulties.length === 0) {
      return true;
    }
    const categoryMatch = filters.categories.length === 0 ||
      course.categories?.some(cat => filters.categories.includes(cat));
    const difficultyMatch = filters.difficulties.length === 0 ||
      filters.difficulties.includes(course.difficulty);
    return categoryMatch && difficultyMatch;
  };

  const hasActiveFilters = filters.categories.length > 0 || filters.difficulties.length > 0;

  // Get unique categories from current roadmap courses
  const availableCategories = [...new Set(
    phases.flatMap(p => p.courses.flatMap(c => c.categories || []))
  )].sort();

  const completionPercent = summary.totalCourses > 0
    ? Math.round((completedCourses.size / summary.totalCourses) * 100)
    : 0;

  return (
    <div className="min-h-screen neural-bg">
      {/* Header */}
      <header className="border-b border-[var(--border)] bg-[var(--deep)]/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <span className="text-xl sm:text-2xl flex-shrink-0">{pathwayInfo.icon}</span>
            <div className="min-w-0">
              <h1 className="font-display text-base sm:text-xl font-bold text-[var(--text-primary)] truncate">{pathwayName}</h1>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] hidden sm:block">{pathwayInfo.tagline}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <button
              onClick={onRestart}
              className="flex items-center justify-center gap-2 p-2.5 sm:px-3 sm:py-2 min-w-[44px] min-h-[44px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--elevated)] rounded-lg transition-colors"
              title="Start Over"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Start Over</span>
            </button>
            <button
              onClick={handleShare}
              className="flex items-center justify-center gap-2 p-2.5 sm:px-3 sm:py-2 min-w-[44px] min-h-[44px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--elevated)] rounded-lg transition-colors"
              title={copied ? 'Copied!' : 'Share'}
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
              <span className="hidden sm:inline">{copied ? 'Copied!' : 'Share'}</span>
            </button>
            <button
              onClick={() => exportAndDownloadCalendar(roadmap)}
              className="flex items-center justify-center gap-2 p-2.5 sm:px-3 sm:py-2 min-w-[44px] min-h-[44px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--elevated)] rounded-lg transition-colors"
              title="Export to Calendar"
            >
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Calendar</span>
            </button>
            <button
              onClick={handleExportPDF}
              disabled={isExporting}
              className="flex items-center justify-center gap-2 p-2.5 sm:px-4 sm:py-2 min-w-[44px] min-h-[44px] btn-primary transition-colors disabled:opacity-50"
              title="Export PDF"
            >
              <Download className={`w-4 h-4 ${isExporting ? 'animate-pulse' : ''}`} />
              <span className="hidden sm:inline">{isExporting ? 'Exporting...' : 'Export PDF'}</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4">
            <div className="flex items-center gap-2 text-[var(--text-secondary)] mb-1">
              <BookOpen className="w-4 h-4" />
              <span className="text-sm">Total Courses</span>
            </div>
            <p className="text-2xl font-bold text-[var(--text-primary)]">{summary.totalCourses}</p>
          </div>
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4">
            <div className="flex items-center gap-2 text-[var(--text-secondary)] mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-sm">Total Hours</span>
            </div>
            <p className="text-2xl font-bold text-[var(--text-primary)]">{summary.totalHours}</p>
          </div>
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4">
            <div className="flex items-center gap-2 text-[var(--text-secondary)] mb-1">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">Duration</span>
            </div>
            <p className="text-2xl font-bold text-[var(--text-primary)]">{formatDuration(summary.totalWeeks)}</p>
          </div>
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4">
            <div className="flex items-center gap-2 text-[var(--text-secondary)] mb-1">
              <Target className="w-4 h-4" />
              <span className="text-sm">Weekly Pace</span>
            </div>
            <p className="text-2xl font-bold text-[var(--text-primary)]">{summary.weeklyHours} hrs</p>
          </div>
        </div>

        {/* Timeline Warning */}
        {summary.timelineWarning && (
          <div className="mb-8 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-400 font-medium">Timeline Notice</p>
              <p className="text-[var(--text-secondary)] text-sm mt-1">{summary.timelineWarning}</p>
            </div>
          </div>
        )}

        {/* Progress Bar */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-[var(--text-primary)]">Your Progress</h3>
            <span className="text-[var(--node-cyan)] font-medium">{completionPercent}%</span>
          </div>
          <div className="h-3 bg-[var(--elevated)] rounded-full overflow-hidden mb-4">
            <div
              className="h-full progress-glow transition-all duration-500"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-[var(--text-muted)]">
            {milestones.map((m, i) => {
              const isEndpoint = i === 0 || i === milestones.length - 1;
              return (
                <div
                  key={i}
                  className={`text-center ${!isEndpoint ? 'hidden sm:block' : ''} ${completionPercent >= m.percent ? 'text-[var(--node-cyan)]' : ''}`}
                >
                  <div className="font-medium">{m.percent}%</div>
                  <div className="hidden sm:block">{m.label}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Filter Bar */}
        <div className="mb-8">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-3 sm:py-2 min-h-[44px] rounded-lg transition-colors ${
              hasActiveFilters
                ? 'bg-[var(--node-cyan-dim)] text-[var(--node-cyan)] border border-[var(--node-cyan)]/30'
                : 'bg-[var(--surface)] text-[var(--text-secondary)] border border-[var(--border)] hover:border-[var(--node-cyan-dim)]'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filter Courses
            {hasActiveFilters && (
              <span className="ml-1 px-2 py-0.5 text-xs bg-[var(--node-cyan)] text-[var(--deep)] rounded-full">
                {filters.categories.length + filters.difficulties.length}
              </span>
            )}
          </button>

          {showFilters && (
            <div className="mt-4 bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-[var(--text-primary)]">Filter by</h4>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-1 text-sm text-[var(--text-secondary)] hover:text-[var(--node-cyan)]"
                  >
                    <X className="w-3 h-3" />
                    Clear all
                  </button>
                )}
              </div>

              {/* Difficulty filters */}
              <div className="mb-6">
                <p className="text-sm text-[var(--text-secondary)] mb-3">Difficulty</p>
                <div className="flex flex-wrap gap-2">
                  {DIFFICULTY_ORDER.map(diff => (
                    <button
                      key={diff}
                      onClick={() => toggleDifficultyFilter(diff)}
                      className={`px-3 py-2.5 sm:py-1.5 text-sm min-h-[44px] sm:min-h-0 rounded-lg border transition-colors ${
                        filters.difficulties.includes(diff)
                          ? 'bg-[var(--node-cyan-dim)] text-[var(--node-cyan)] border-[var(--node-cyan)]/30'
                          : 'bg-[var(--elevated)] text-[var(--text-secondary)] border-transparent hover:border-[var(--border)]'
                      }`}
                    >
                      {diff.charAt(0).toUpperCase() + diff.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category filters */}
              <div>
                <p className="text-sm text-[var(--text-secondary)] mb-3">Category</p>
                <div className="flex flex-wrap gap-2">
                  {availableCategories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => toggleCategoryFilter(cat)}
                      className={`px-3 py-2.5 sm:py-1.5 text-sm min-h-[44px] sm:min-h-0 rounded-lg border transition-colors ${
                        filters.categories.includes(cat)
                          ? 'bg-[var(--node-cyan-dim)] text-[var(--node-cyan)] border-[var(--node-cyan)]/30'
                          : 'bg-[var(--elevated)] text-[var(--text-secondary)] border-transparent hover:border-[var(--border)]'
                      }`}
                    >
                      {getCategoryLabel(cat)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-5 sm:left-6 top-0 bottom-0 w-0.5 bg-[var(--border)]" />

          {phases.map((phase, phaseIndex) => {
            const isExpanded = expandedPhases.has(phaseIndex);
            const filteredCourses = phase.courses.filter(courseMatchesFilters);
            const phaseCompleted = phase.courses.every(c => completedCourses.has(c.id));
            const phaseProgress = phase.courses.length > 0
              ? Math.round((phase.courses.filter(c => completedCourses.has(c.id)).length / phase.courses.length) * 100)
              : 0;

            // Skip phase if no courses match filter
            if (hasActiveFilters && filteredCourses.length === 0) {
              return null;
            }

            return (
              <div key={phaseIndex} className="relative mb-6">
                {/* Phase Header */}
                <button
                  onClick={() => togglePhase(phaseIndex)}
                  className="w-full flex items-start gap-4 group"
                >
                  {/* Phase indicator */}
                  <div className={`relative z-10 w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                    phaseCompleted
                      ? 'bg-emerald-500'
                      : phaseProgress > 0
                        ? 'bg-[var(--node-cyan)]'
                        : 'bg-[var(--elevated)] group-hover:bg-[var(--elevated)]'
                  }`}>
                    {phaseCompleted ? (
                      <Trophy className="w-5 h-5 text-[var(--text-primary)]" />
                    ) : (
                      <span className="text-[var(--text-primary)] font-bold">{phaseIndex + 1}</span>
                    )}
                  </div>

                  {/* Phase info */}
                  <div className="flex-1 bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 text-left group-hover:border-[var(--node-cyan-dim)] transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-display text-lg font-display font-semibold text-[var(--text-primary)]">{phase.phaseName}</h3>
                          {phase.isOptional ? (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                              Optional
                            </span>
                          ) : (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              Required
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-[var(--text-secondary)]">
                          {hasActiveFilters
                            ? `${filteredCourses.length} of ${phase.courses.length} ${phase.courses.length === 1 ? 'course' : 'courses'}`
                            : `${phase.courses.length} ${phase.courses.length === 1 ? 'course' : 'courses'}`} • {formatDuration(phase.endWeek - phase.startWeek)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        {phaseProgress > 0 && !phaseCompleted && (
                          <span className="text-sm text-[var(--node-cyan)]">{phaseProgress}%</span>
                        )}
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-[var(--text-secondary)]" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-[var(--text-secondary)]" />
                        )}
                      </div>
                    </div>

                    {/* Mini progress bar */}
                    <div className="h-1 bg-[var(--elevated)] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[var(--node-cyan)] transition-all duration-300"
                        style={{ width: `${phaseProgress}%` }}
                      />
                    </div>
                  </div>
                </button>

                {/* Expanded course list */}
                {isExpanded && (
                  <div className="ml-14 sm:ml-16 mt-4 space-y-3">
                    {/* Math Warning for this phase */}
                    {phase.mathWarning && (
                      <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-3">
                        <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-amber-400">{phase.mathWarning}</p>
                      </div>
                    )}

                    {filteredCourses.map((course, courseIndex) => {
                      const isCompleted = completedCourses.has(course.id);

                      return (
                        <div
                          key={course.id}
                          className={`bg-[var(--surface)]/50 border rounded-xl p-4 transition-all ${
                            isCompleted
                              ? 'border-emerald-500/30 bg-emerald-500/5'
                              : 'border-[var(--border)] hover:border-[var(--node-cyan-dim)]'
                          }`}
                        >
                          <div className="flex items-start gap-3 sm:gap-4">
                            {/* Completion toggle */}
                            <button
                              onClick={() => toggleCourseComplete(course.id)}
                              className="flex-shrink-0 p-2 -ml-2 -mt-1 min-w-[44px] min-h-[44px] flex items-center justify-center"
                            >
                              {isCompleted ? (
                                <CheckCircle className="w-5 h-5 text-emerald-400" />
                              ) : (
                                <Circle className="w-5 h-5 text-[var(--text-muted)] hover:text-[var(--text-secondary)]" />
                              )}
                            </button>

                            {/* Course info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <h4 className={`font-medium ${isCompleted ? 'text-[var(--text-secondary)] line-through' : 'text-[var(--text-primary)]'}`}>
                                    {course.title}
                                  </h4>
                                  <div className="flex flex-wrap items-center gap-2 mt-2">
                                    <span className={`text-xs px-2 py-0.5 rounded-full border ${getDifficultyColor(course.difficulty)}`}>
                                      {course.difficulty}
                                    </span>
                                    <span className="text-xs text-[var(--text-muted)]">
                                      {course.estimated_hours || 3} hrs
                                    </span>
                                    {course.instructor && (
                                      <span className="text-xs text-[var(--text-muted)]">
                                        • {course.instructor}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <a
                                  href={course.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex-shrink-0 p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--node-cyan)] hover:bg-[var(--elevated)] rounded-lg transition-colors"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                              </div>

                              {/* Timeline indicator */}
                              <div className="mt-3 flex items-center gap-2 text-xs text-[var(--text-muted)]">
                                <Calendar className="w-3 h-3" />
                                {course.startWeek + 1 === course.endWeek ? `Week ${course.startWeek + 1}` : `Week ${course.startWeek + 1} - ${course.endWeek}`}
                              </div>

                              {/* Skills taught */}
                              {course.skills_taught && course.skills_taught.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1">
                                  {course.skills_taught.slice(0, 4).map((skill, i) => (
                                    <span
                                      key={i}
                                      className="text-xs px-2 py-0.5 bg-[var(--elevated)] text-[var(--text-secondary)] rounded"
                                    >
                                      {skill}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Milestone */}
                    {phase.milestone && (
                      <div className="flex items-center gap-3 p-3 bg-[var(--node-cyan-dim)] border border-[var(--node-cyan)]/20 rounded-xl">
                        <Zap className="w-5 h-5 text-[var(--node-cyan)]" />
                        <span className="text-[var(--node-cyan)] font-medium">{phase.milestone}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-[var(--border)] text-center">
          <p className="text-[var(--text-muted)] text-sm">
            This roadmap was generated based on your learning profile.
            <br />
            Click courses to mark them complete and track your progress.
          </p>
        </div>
      </div>
    </div>
  );
}
