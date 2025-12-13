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
  const skipFoundation = answers.experience === 'professional' || answers.experience === 'ml-basics';

  // Experience-based difficulty filtering for pathway courses
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
  const allowedDifficulties = mathDifficultyMap[answers.mathBackground] || ['beginner'];

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
  if (!skipFoundation) {
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
        .filter(Boolean)
        .filter(course => allowedByExperience.includes(course.difficulty) && allowedDifficulties.includes(course.difficulty));

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
        if (courseSequence.some(phase => phase.courses.some(pc => pc.id === c.id))) return false;
        // Filter by math-appropriate difficulty
        if (!allowedDifficulties.includes(c.difficulty)) return false;
        // Filter by experience-appropriate difficulty
        if (!allowedByExperience.includes(c.difficulty)) return false;
        return c.categories?.some(cat => answers.interests.includes(cat));
      });

    // Sort by quality score (always applied for objective, merit-based ordering)
    // Quality = partner tier + type weight + depth (hours)
    const getQualityScore = (course) => {
      // Partner tier: DLAI core highest, major partners next, others last
      const partnerTiers = {
        'DeepLearning.AI': 100,
        'Google': 80, 'OpenAI': 80, 'Meta': 80, 'Microsoft': 80,
        'AWS': 70, 'Anthropic': 70, 'Hugging Face': 70,
        'LangChain': 60, 'LlamaIndex': 60, 'Stanford': 60, 'Stanford/DeepLearning.AI': 60,
      };
      const partnerScore = partnerTiers[course.partner] || 30;

      // Type weight: certificates more comprehensive
      // Goal-based modifier: career-switch/research prefer certificates, upskill prefers shorter
      let typeWeights = { 'certificate': 40, 'course': 20, 'short': 10 };
      if (goalConfig.preferSpecializations && course.type === 'certificate') {
        typeWeights.certificate = 70; // Boost certificates for career-switch/research
      } else if (goalConfig.prioritize === 'practical' && !goalConfig.preferSpecializations) {
        typeWeights.short = 25; // Boost shorter courses for upskill
      }
      const typeScore = typeWeights[course.type] || 10;

      // Depth: more hours = more comprehensive (capped at 50)
      const depthScore = Math.min(course.estimated_hours || 3, 50);

      return partnerScore + typeScore + depthScore;
    };

    electiveCourses.sort((a, b) => getQualityScore(b) - getQualityScore(a));

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
  const totalHours = timelinedSequence.reduce((sum, phase) =>
    sum + phase.courses.reduce((s, c) => s + (c.estimated_hours || 3), 0), 0
  );
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
