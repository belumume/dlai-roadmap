import coursesData from '../data/courses.json';

/**
 * Generate a personalized learning pathway based on questionnaire answers
 */
export function generatePathway(answers) {
  const { courses, pathways } = coursesData;

  // Build course lookup map
  const courseMap = new Map(courses.map(c => [c.id, c]));

  // Calculate weekly hours from time commitment
  const weeklyHours = {
    '2-5': 3.5,
    '5-10': 7.5,
    '10-20': 15,
    '20+': 25,
  }[answers.timeCommitment] || 7.5;

  // Calculate total months from timeline
  const totalMonths = {
    '3-months': 3,
    '6-months': 6,
    '12-months': 12,
    'no-rush': 18,
  }[answers.timeline] || 6;

  // Determine which courses to skip based on prior experience
  const priorCourses = new Set(answers.priorCourses || []);
  const skipBeginner = answers.experience === 'professional' || answers.experience === 'ml-basics';

  // Select pathway based on target role
  const selectedPath = answers.targetRole === 'undecided' ? 'builder' : answers.targetRole;
  const pathway = pathways[selectedPath];

  // Build the course sequence
  let courseSequence = [];

  // Phase 1: Foundation (trunk) - unless skipping beginner content
  if (!skipBeginner) {
    const trunkCourses = pathways.trunk.courses
      .filter(id => !priorCourses.has(id))
      .map(id => courseMap.get(id))
      .filter(Boolean);

    if (trunkCourses.length > 0) {
      courseSequence.push({
        phase: 'Foundation',
        phaseName: pathways.trunk.name,
        milestone: pathways.trunk.milestone,
        courses: trunkCourses,
      });
    }
  }

  // Phase 2+: Role-specific phases
  if (pathway && pathway.phases) {
    pathway.phases.forEach((phase, index) => {
      const phaseCourses = phase.courses
        .filter(id => !priorCourses.has(id))
        .map(id => courseMap.get(id))
        .filter(Boolean);

      if (phaseCourses.length > 0) {
        courseSequence.push({
          phase: `Phase ${index + 2}`,
          phaseName: phase.name,
          milestone: phase.milestone || `${phase.name} Complete`,
          courses: phaseCourses,
        });
      }
    });
  }

  // Add electives based on interests
  if (answers.interests && answers.interests.length > 0) {
    const electiveCourses = courses
      .filter(c => {
        if (priorCourses.has(c.id)) return false;
        if (courseSequence.some(phase => phase.courses.some(pc => pc.id === c.id))) return false;
        return c.categories?.some(cat => answers.interests.includes(cat));
      })
      .slice(0, 5); // Limit electives

    if (electiveCourses.length > 0) {
      courseSequence.push({
        phase: 'Electives',
        phaseName: 'Areas of Interest',
        milestone: 'Specialization Deepened',
        courses: electiveCourses,
      });
    }
  }

  // Calculate timeline for each course
  let currentWeek = 0;
  const timelinedSequence = courseSequence.map(phase => {
    const timelinedCourses = phase.courses.map(course => {
      const hours = course.estimated_hours || (course.type === 'specialization' ? 40 : 3);
      const weeksNeeded = Math.ceil(hours / weeklyHours);
      const startWeek = currentWeek;
      currentWeek += weeksNeeded;

      return {
        ...course,
        startWeek,
        endWeek: currentWeek,
        estimatedWeeks: weeksNeeded,
      };
    });

    const phaseStartWeek = timelinedCourses[0]?.startWeek || 0;
    const phaseEndWeek = timelinedCourses[timelinedCourses.length - 1]?.endWeek || 0;

    return {
      ...phase,
      courses: timelinedCourses,
      startWeek: phaseStartWeek,
      endWeek: phaseEndWeek,
    };
  });

  // Calculate totals
  const totalCourses = timelinedSequence.reduce((sum, phase) => sum + phase.courses.length, 0);
  const totalHours = timelinedSequence.reduce((sum, phase) =>
    sum + phase.courses.reduce((s, c) => s + (c.estimated_hours || 3), 0), 0
  );
  const totalWeeks = currentWeek;

  // Generate milestones at 25%, 50%, 75%, 100%
  const milestones = [
    { percent: 25, week: Math.round(totalWeeks * 0.25), label: 'Getting Started' },
    { percent: 50, week: Math.round(totalWeeks * 0.5), label: 'Halfway There' },
    { percent: 75, week: Math.round(totalWeeks * 0.75), label: 'Home Stretch' },
    { percent: 100, week: totalWeeks, label: 'Journey Complete' },
  ];

  return {
    pathway: selectedPath,
    pathwayName: pathway?.name || 'AI Foundations',
    phases: timelinedSequence,
    summary: {
      totalCourses,
      totalHours,
      totalWeeks,
      weeklyHours,
      estimatedMonths: Math.ceil(totalWeeks / 4.33),
    },
    milestones,
    answers, // Keep for PDF export
  };
}

/**
 * Get pathway description for display
 */
export function getPathwayDescription(pathwayId) {
  const descriptions = {
    builder: {
      title: 'AI Product Engineer',
      tagline: 'Build AI-powered applications',
      description: 'Master RAG systems, AI agents, and production deployment. Perfect for developers who want to integrate AI into applications.',
      icon: '🛠️',
    },
    researcher: {
      title: 'Model Architect',
      tagline: 'Train and optimize models',
      description: 'Deep dive into model training, fine-tuning, and optimization. Ideal for those who want to understand how AI models work under the hood.',
      icon: '🔬',
    },
    enterprise: {
      title: 'Enterprise AI Leader',
      tagline: 'Lead AI transformation',
      description: 'Strategy, governance, and large-scale deployment. For leaders driving AI adoption in organizations.',
      icon: '🏢',
    },
  };

  return descriptions[pathwayId] || descriptions.builder;
}

/**
 * Format weeks into human-readable duration
 */
export function formatDuration(weeks) {
  if (weeks < 4) {
    return `${weeks} week${weeks === 1 ? '' : 's'}`;
  }
  const months = Math.round(weeks / 4.33);
  return `~${months} month${months === 1 ? '' : 's'}`;
}

/**
 * Get course difficulty badge color
 */
export function getDifficultyColor(difficulty) {
  const colors = {
    beginner: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    intermediate: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    advanced: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  };
  return colors[difficulty] || colors.intermediate;
}
