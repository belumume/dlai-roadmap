import { useState, useEffect } from 'react';
import {
  Download, Share2, ChevronDown, ChevronUp, ExternalLink,
  Clock, BookOpen, Trophy, RefreshCw, CheckCircle, Circle,
  Calendar, Target, Zap, Copy, Check
} from 'lucide-react';
import { formatDuration, getDifficultyColor, getPathwayDescription } from '../utils/pathwayGenerator';
import { exportRoadmapPDF, generateShareableURL } from '../utils/exportPDF';

const STORAGE_KEY = 'dlai-roadmap-progress';

export default function RoadmapView({ roadmap, onRestart }) {
  const [expandedPhases, setExpandedPhases] = useState(new Set([0]));
  const [completedCourses, setCompletedCourses] = useState(() => {
    // Load from localStorage on init
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return new Set(parsed.completedCourses || []);
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

  const completionPercent = Math.round((completedCourses.size / summary.totalCourses) * 100);

  return (
    <div className="min-h-screen neural-bg">
      {/* Header */}
      <header className="border-b border-[var(--border)] bg-[var(--deep)]/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{pathwayInfo.icon}</span>
            <div>
              <h1 className="font-display text-xl font-bold text-[var(--text-primary)]">{pathwayName}</h1>
              <p className="text-sm text-[var(--text-secondary)]">{pathwayInfo.tagline}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onRestart}
              className="flex items-center gap-2 px-3 py-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--elevated)] rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Start Over
            </button>
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-3 py-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--elevated)] rounded-lg transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Share'}
            </button>
            <button
              onClick={handleExportPDF}
              disabled={isExporting}
              className="flex items-center gap-2 px-4 py-2 btn-primary transition-colors disabled:opacity-50"
            >
              <Download className={`w-4 h-4 ${isExporting ? 'animate-pulse' : ''}`} />
              {isExporting ? 'Exporting...' : 'Export PDF'}
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
            {milestones.map((m, i) => (
              <div key={i} className={`text-center ${completionPercent >= m.percent ? 'text-[var(--node-cyan)]' : ''}`}>
                <div className="font-medium">{m.percent}%</div>
                <div>{m.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-[var(--border)]" />

          {phases.map((phase, phaseIndex) => {
            const isExpanded = expandedPhases.has(phaseIndex);
            const phaseCompleted = phase.courses.every(c => completedCourses.has(c.id));
            const phaseProgress = Math.round(
              (phase.courses.filter(c => completedCourses.has(c.id)).length / phase.courses.length) * 100
            );

            return (
              <div key={phaseIndex} className="relative mb-6">
                {/* Phase Header */}
                <button
                  onClick={() => togglePhase(phaseIndex)}
                  className="w-full flex items-start gap-4 group"
                >
                  {/* Phase indicator */}
                  <div className={`relative z-10 w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
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
                        <h3 className="font-display text-lg font-display font-semibold text-[var(--text-primary)]">{phase.phaseName}</h3>
                        <p className="text-sm text-[var(--text-secondary)]">
                          {phase.courses.length} courses • {formatDuration(phase.endWeek - phase.startWeek)}
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
                  <div className="ml-16 mt-4 space-y-3">
                    {phase.courses.map((course, courseIndex) => {
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
                          <div className="flex items-start gap-4">
                            {/* Completion toggle */}
                            <button
                              onClick={() => toggleCourseComplete(course.id)}
                              className="flex-shrink-0 mt-1"
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
                                  className="flex-shrink-0 p-2 text-[var(--text-muted)] hover:text-[var(--node-cyan)] hover:bg-[var(--elevated)] rounded-lg transition-colors"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                              </div>

                              {/* Timeline indicator */}
                              <div className="mt-3 flex items-center gap-2 text-xs text-[var(--text-muted)]">
                                <Calendar className="w-3 h-3" />
                                Week {course.startWeek + 1} - {course.endWeek}
                              </div>
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
