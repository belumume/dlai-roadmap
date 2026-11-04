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
  // Courses the learner added by hand from the full catalog, in the order added
  const addedCourseIds = [...new Set(answers.addedCourses || [])].filter(id => courseMap.has(id));
  const skipFoundation = answers.experience === 'professional' || answers.experience === 'ml-basics';

  // Experience-based difficulty band for electives
  const experienceDifficultyMap = {
    'none': ['beginner', 'intermediate'], // beginners can stretch to intermediate
    'some-python': ['beginner', 'intermediate', 'advanced'],
    'ml-basics': ['intermediate', 'advanced'], // skip beginner content
    'professional': ['intermediate', 'advanced'], // skip beginner content
  };
  const allowedByExperience = experienceDifficultyMap[answers.experience] || ['beginner', 'intermediate'];

  // Determine max difficulty based on math background
  const mathDifficultyMap = {
    'minimal': ['beginner'],
    'moderate': ['beginner', 'intermediate'],
    'strong': ['beginner', 'intermediate', 'advanced'],
    'expert': ['beginner', 'intermediate', 'advanced'],
  };
  const mathAllowed = mathDifficultyMap[answers.mathBackground] || ['beginner'];
  // Math only gates math-heavy electives (the 'training' category: fine-tuning,
  // pretraining, model internals). Agent, RAG or coding courses need Python, not
  // math, so they use the experience band alone. When the math and experience
  // bands don't overlap (e.g. professional + minimal math), fall back to the
  // experience band rather than offering no training electives at all.
  const bothAllowed = mathAllowed.filter(d => allowedByExperience.includes(d));
  const allowedDifficulties = bothAllowed.length > 0 ? bothAllowed : allowedByExperience;
  const MATH_HEAVY_CATEGORIES = ['training'];
  const fitsLevel = (course) => {
    const mathHeavy = course.categories?.some(cat => MATH_HEAVY_CATEGORIES.includes(cat));
    return (mathHeavy ? allowedDifficulties : allowedByExperience).includes(course.difficulty);
  };

  // Determine learning priority based on goal
  const goalPriorities = {
    'career-switch': { prioritize: 'practical', preferSpecializations: true },
    'upskill': { prioritize: 'practical', preferSpecializations: false },
    'research': { prioritize: 'theoretical', preferSpecializations: true },
    'curiosity': { prioritize: 'breadth', preferSpecializations: false },
  };
  const goalConfig = goalPriorities[answers.goal] || { prioritize: 'practical', preferSpecializations: false };

  // Select pathway based on target role
  const selectedPath = answers.targetRole === 'undecided' ? 'builder' : answers.targetRole;
  const pathway = pathways[selectedPath];

  // Build the course sequence
  let courseSequence = [];

  // Phase 1: Foundation (trunk) - unless skipping foundation content
  // Learners who already code skip the Python primer; outside the leadership
  // track they also skip the two non-technical "for Everyone" overviews.
  const trunkSkips = new Set();
  if (answers.experience === 'some-python') {
    trunkSkips.add('ai-python-for-beginners');
    if (answers.targetRole !== 'enterprise') {
      trunkSkips.add('ai-for-everyone');
      trunkSkips.add('generative-ai-for-everyone');
    }
  }

  if (!skipFoundation) {
    const trunkCourses = pathways.trunk.courses
      .filter(id => !priorCourses.has(id) && !trunkSkips.has(id))
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
      // Pathway courses are the role's required core, so they aren't filtered by
      // difficulty. DLAI labels describe entry level, not whether an experienced
      // learner already knows the material; experience is applied by skipping the
      // Foundation trunk, and learners remove courses they've done via priorCourses.
      const phaseCourses = phase.courses
        .filter(id => !priorCourses.has(id))
        .map(id => courseMap.get(id))
        .filter(Boolean);

      if (phaseCourses.length > 0) {
        // Check if this is a math-heavy phase for researcher with weak math background
        const isMathPhase = selectedPath === 'researcher' && phase.name.toLowerCase().includes('math');
        const needsMathWarning = isMathPhase && (answers.mathBackground === 'minimal' || answers.mathBackground === 'moderate');

        courseSequence.push({
          phase: `Phase ${index + 2}`,
          phaseName: phase.name,
          milestone: phase.milestone || `${phase.name} Complete`,
          courses: phaseCourses,
          mathWarning: needsMathWarning ? 'This phase requires strong mathematical foundations. Consider strengthening your math background first.' : null,
        });
      }
    });
  }

  // Calculate target weeks from timeline
  const targetWeeks = totalMonths * 4.33;

  // Calculate core pathway hours (before electives)
  const coreHours = courseSequence.reduce((sum, phase) =>
    sum + phase.courses.reduce((s, c) => s + (c.estimated_hours || (c.type === 'specialization' ? 40 : 3)), 0), 0
  );
  const coreWeeks = Math.ceil(coreHours / weeklyHours);
  const remainingWeeks = Math.max(0, targetWeeks - coreWeeks);

  // Add electives based on interests, filtered by math background, limited by timeline
  if (answers.interests && answers.interests.length > 0 && remainingWeeks > 0) {
    let electiveCourses = courses
      .filter(c => {
        if (priorCourses.has(c.id)) return false;
        if (addedCourseIds.includes(c.id)) return false;
        if (trunkSkips.has(c.id)) return false; // skipped foundation courses stay skipped
        if (courseSequence.some(phase => phase.courses.some(pc => pc.id === c.id))) return false;
        // Filter by experience (and, for math-heavy courses, math) difficulty
        if (!fitsLevel(c)) return false;
        return c.categories?.some(cat => answers.interests.includes(cat));
      });

    // Rank by fit, not by vendor: first how many of the learner's interests a
    // course covers, then the course type the learner's goal favours. Ties keep
    // catalog order, where newer courses sit near the top.
    const typeWeights = goalConfig.preferSpecializations
      ? { certificate: 3, course: 2, short: 1 } // career-switch/research: depth first
      : goalConfig.prioritize === 'practical'
        ? { short: 3, course: 2, certificate: 1 } // upskill: short, applied courses first
        : { short: 1, course: 1, certificate: 1 }; // curiosity: breadth, no preference
    const fitScore = (course) =>
      (course.categories || []).filter(cat => answers.interests.includes(cat)).length * 10
      + (typeWeights[course.type] || 0);
    const catalogOrder = new Map(courses.map((c, i) => [c.id, i]));
    electiveCourses.sort((a, b) =>
      fitScore(b) - fitScore(a) || catalogOrder.get(a.id) - catalogOrder.get(b.id));

    // Limit electives to fit within remaining timeline
    let electiveWeeks = 0;
    const maxElectives = goalConfig.prioritize === 'breadth' ? 7 : 5;
    electiveCourses = electiveCourses.filter(c => {
      const courseWeeks = Math.ceil((c.estimated_hours || 3) / weeklyHours);
      if (electiveWeeks + courseWeeks <= remainingWeeks) {
        electiveWeeks += courseWeeks;
        return true;
      }
      return false;
    }).slice(0, maxElectives);

    if (electiveCourses.length > 0) {
      courseSequence.push({
        phase: 'Electives',
        phaseName: 'Areas of Interest',
        milestone: 'Specialization Deepened',
        courses: electiveCourses,
        isOptional: true,
      });
    }
  }

  // Courses the learner added by hand. One that a roadmap course builds on
  // (directly or through its prerequisites) goes right before the first course
  // that needs it; the rest go last, in the order the learner chose. Ones
  // already in the roadmap are skipped so nothing appears twice.
  const prerequisiteCache = new Map();
  const allPrerequisites = (id) => {
    if (prerequisiteCache.has(id)) return prerequisiteCache.get(id);
    const found = new Set();
    prerequisiteCache.set(id, found); // guards against cycles in the data
    for (const pre of courseMap.get(id)?.prerequisites || []) {
      if (!courseMap.has(pre)) continue;
      found.add(pre);
      allPrerequisites(pre).forEach(p => found.add(p));
    }
    return found;
  };
  const unplacedAdded = [];
  addedCourseIds
    .filter(id => !courseSequence.some(phase => phase.courses.some(pc => pc.id === id)))
    .forEach(id => {
      const course = { ...courseMap.get(id), isAdded: true };
      for (const phase of courseSequence) {
        const index = phase.courses.findIndex(c => allPrerequisites(c.id).has(id));
        if (index !== -1) {
          // Name the course it now sits right before (possibly another added one)
          course.placedBefore = phase.courses[index].title;
          phase.courses = [...phase.courses.slice(0, index), course, ...phase.courses.slice(index)];
          return;
        }
      }
      unplacedAdded.push(course);
    });
  if (unplacedAdded.length > 0) {
    courseSequence.push({
      phase: 'Added',
      phaseName: 'Your Added Courses',
      milestone: 'Added Courses Complete',
      courses: unplacedAdded,
      isAdded: true,
    });
  }

  // Timeline warning if core exceeds target
  const timelineWarning = coreWeeks > targetWeeks
    ? `Core courses take ~${Math.ceil(coreWeeks / 4.33)} months. Consider increasing your weekly hours or extending your timeline.`
    : null;

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
  // Short-course hours are fractional (e.g. 1.3), so round the displayed total
  const totalHours = Math.round(timelinedSequence.reduce((sum, phase) =>
    sum + phase.courses.reduce((s, c) => s + (c.estimated_hours || 3), 0), 0
  ));
  const totalWeeks = currentWeek;

  // Generate milestones at 25%, 50%, 75%, 100% (guard against zero weeks)
  const milestones = totalWeeks > 0 ? [
    { percent: 25, week: Math.round(totalWeeks * 0.25), label: 'Getting Started' },
    { percent: 50, week: Math.round(totalWeeks * 0.5), label: 'Halfway There' },
    { percent: 75, week: Math.round(totalWeeks * 0.75), label: 'Home Stretch' },
    { percent: 100, week: totalWeeks, label: 'Journey Complete' },
  ] : [];

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
      targetMonths: totalMonths,
      mathLevel: answers.mathBackground,
      goal: answers.goal,
      timelineWarning,
    },
    milestones,
    answers, // Keep for PDF export
    personalizationFactors: {
      experienceLevel: answers.experience,
      mathBackground: answers.mathBackground,
      goal: answers.goal,
      allowedDifficulties,
      allowedByExperience,
      goalConfig,
      priorCoursesSkipped: priorCourses.size,
      interestsApplied: answers.interests?.length || 0,
    },
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
