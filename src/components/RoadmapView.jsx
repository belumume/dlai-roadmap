import { useState } from 'react';
import {
  Download, Share2, ChevronDown, ChevronUp, ExternalLink,
  Clock, BookOpen, Trophy, RefreshCw, CheckCircle, Circle,
  Calendar, Target, Sparkles, Copy, Check
} from 'lucide-react';
import { formatDuration, getDifficultyColor, getPathwayDescription } from '../utils/pathwayGenerator';
import { exportRoadmapPDF, generateShareableURL } from '../utils/exportPDF';

export default function RoadmapView({ roadmap, onRestart }) {
  const [expandedPhases, setExpandedPhases] = useState(new Set([0]));
  const [completedCourses, setCompletedCourses] = useState(new Set());
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{pathwayInfo.icon}</span>
            <div>
              <h1 className="text-xl font-bold text-white">{pathwayName}</h1>
              <p className="text-sm text-slate-400">{pathwayInfo.tagline}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onRestart}
              className="flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Start Over
            </button>
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Share'}
            </button>
            <button
              onClick={handleExportPDF}
              disabled={isExporting}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
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
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center gap-2 text-slate-400 mb-1">
              <BookOpen className="w-4 h-4" />
              <span className="text-sm">Total Courses</span>
            </div>
            <p className="text-2xl font-bold text-white">{summary.totalCourses}</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center gap-2 text-slate-400 mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-sm">Total Hours</span>
            </div>
            <p className="text-2xl font-bold text-white">{summary.totalHours}</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center gap-2 text-slate-400 mb-1">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">Duration</span>
            </div>
            <p className="text-2xl font-bold text-white">{formatDuration(summary.totalWeeks)}</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center gap-2 text-slate-400 mb-1">
              <Target className="w-4 h-4" />
              <span className="text-sm">Weekly Pace</span>
            </div>
            <p className="text-2xl font-bold text-white">{summary.weeklyHours} hrs</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">Your Progress</h3>
            <span className="text-blue-400 font-medium">{completionPercent}%</span>
          </div>
          <div className="h-3 bg-slate-700 rounded-full overflow-hidden mb-4">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-500">
            {milestones.map((m, i) => (
              <div key={i} className={`text-center ${completionPercent >= m.percent ? 'text-blue-400' : ''}`}>
                <div className="font-medium">{m.percent}%</div>
                <div>{m.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-700" />

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
                        ? 'bg-blue-500'
                        : 'bg-slate-700 group-hover:bg-slate-600'
                  }`}>
                    {phaseCompleted ? (
                      <Trophy className="w-5 h-5 text-white" />
                    ) : (
                      <span className="text-white font-bold">{phaseIndex + 1}</span>
                    )}
                  </div>

                  {/* Phase info */}
                  <div className="flex-1 bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-left group-hover:border-slate-600 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-semibold text-white">{phase.phaseName}</h3>
                        <p className="text-sm text-slate-400">
                          {phase.courses.length} courses • {formatDuration(phase.endWeek - phase.startWeek)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        {phaseProgress > 0 && !phaseCompleted && (
                          <span className="text-sm text-blue-400">{phaseProgress}%</span>
                        )}
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                    </div>

                    {/* Mini progress bar */}
                    <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 transition-all duration-300"
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
                          className={`bg-slate-800/30 border rounded-xl p-4 transition-all ${
                            isCompleted
                              ? 'border-emerald-500/30 bg-emerald-500/5'
                              : 'border-slate-700 hover:border-slate-600'
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
                                <Circle className="w-5 h-5 text-slate-500 hover:text-slate-400" />
                              )}
                            </button>

                            {/* Course info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <h4 className={`font-medium ${isCompleted ? 'text-slate-400 line-through' : 'text-white'}`}>
                                    {course.title}
                                  </h4>
                                  <div className="flex flex-wrap items-center gap-2 mt-2">
                                    <span className={`text-xs px-2 py-0.5 rounded-full border ${getDifficultyColor(course.difficulty)}`}>
                                      {course.difficulty}
                                    </span>
                                    <span className="text-xs text-slate-500">
                                      {course.estimated_hours || 3} hrs
                                    </span>
                                    {course.instructor && (
                                      <span className="text-xs text-slate-500">
                                        • {course.instructor}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <a
                                  href={course.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex-shrink-0 p-2 text-slate-500 hover:text-blue-400 hover:bg-slate-700 rounded-lg transition-colors"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                              </div>

                              {/* Timeline indicator */}
                              <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
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
                      <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl">
                        <Sparkles className="w-5 h-5 text-blue-400" />
                        <span className="text-blue-300 font-medium">{phase.milestone}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-slate-800 text-center">
          <p className="text-slate-500 text-sm">
            This roadmap was generated based on your learning profile.
            <br />
            Click courses to mark them complete and track your progress.
          </p>
        </div>
      </div>
    </div>
  );
}
