import { useState } from 'react';
import { ChevronRight, ChevronLeft, Sparkles, Clock, Target, GraduationCap, Calculator, Calendar, BookOpen, CheckCircle2 } from 'lucide-react';

const questions = [
  {
    id: 'experience',
    title: 'What\'s your current AI/ML experience level?',
    subtitle: 'Be honest - this helps us find the right starting point',
    icon: GraduationCap,
    type: 'single',
    options: [
      { value: 'none', label: 'Complete Beginner', description: 'New to AI/ML, maybe heard of ChatGPT' },
      { value: 'some-python', label: 'Some Programming', description: 'Comfortable with Python basics' },
      { value: 'ml-basics', label: 'ML Fundamentals', description: 'Understand supervised/unsupervised learning' },
      { value: 'professional', label: 'Working Professional', description: 'Building ML systems at work' },
    ],
  },
  {
    id: 'goal',
    title: 'What\'s driving your learning journey?',
    subtitle: 'Your primary motivation helps shape the path',
    icon: Target,
    type: 'single',
    options: [
      { value: 'career-switch', label: 'Career Transition', description: 'Moving into AI/ML from another field' },
      { value: 'upskill', label: 'Skill Enhancement', description: 'Adding AI capabilities to current role' },
      { value: 'research', label: 'Academic/Research', description: 'Deep understanding for research purposes' },
      { value: 'curiosity', label: 'Personal Interest', description: 'Learning for the joy of it' },
    ],
  },
  {
    id: 'timeCommitment',
    title: 'How much time can you dedicate weekly?',
    subtitle: 'We\'ll pace your roadmap accordingly',
    icon: Clock,
    type: 'single',
    options: [
      { value: '2-5', label: '2-5 hours/week', description: 'Casual pace, steady progress' },
      { value: '5-10', label: '5-10 hours/week', description: 'Moderate commitment' },
      { value: '10-20', label: '10-20 hours/week', description: 'Serious learning mode' },
      { value: '20+', label: '20+ hours/week', description: 'Full immersion' },
    ],
  },
  {
    id: 'targetRole',
    title: 'Which path resonates most with you?',
    subtitle: 'Don\'t worry - you can always pivot later',
    icon: Sparkles,
    type: 'single',
    options: [
      { value: 'builder', label: 'AI Product Engineer', description: 'Build apps with RAG, agents, and APIs' },
      { value: 'researcher', label: 'Model Architect', description: 'Train, fine-tune, and optimize models' },
      { value: 'enterprise', label: 'Enterprise AI Leader', description: 'Strategy, governance, and deployment at scale' },
      { value: 'undecided', label: 'Still Exploring', description: 'Show me a bit of everything' },
    ],
  },
  {
    id: 'mathBackground',
    title: 'How comfortable are you with math?',
    subtitle: 'Linear algebra, calculus, probability & statistics',
    icon: Calculator,
    type: 'single',
    options: [
      { value: 'minimal', label: 'Basic Math Only', description: 'High school level, a bit rusty' },
      { value: 'moderate', label: 'Some College Math', description: 'Took calculus, remember some of it' },
      { value: 'strong', label: 'Strong Foundation', description: 'Comfortable with linear algebra & stats' },
      { value: 'expert', label: 'Math Background', description: 'STEM degree, math comes naturally' },
    ],
  },
  {
    id: 'timeline',
    title: 'What\'s your target timeline?',
    subtitle: 'When do you want to reach your learning goals?',
    icon: Calendar,
    type: 'single',
    options: [
      { value: '3-months', label: '3 Months', description: 'Intensive sprint' },
      { value: '6-months', label: '6 Months', description: 'Balanced pace' },
      { value: '12-months', label: '1 Year', description: 'Thorough journey' },
      { value: 'no-rush', label: 'No Rush', description: 'Learning is the destination' },
    ],
  },
  {
    id: 'priorCourses',
    title: 'Have you taken any DeepLearning.AI courses?',
    subtitle: 'Select all that apply (or skip if none)',
    icon: BookOpen,
    type: 'multi',
    options: [
      { value: 'ai-for-everyone', label: 'AI For Everyone' },
      { value: 'ml-specialization', label: 'Machine Learning Specialization' },
      { value: 'deep-learning-specialization', label: 'Deep Learning Specialization' },
      { value: 'chatgpt-prompt-engineering', label: 'ChatGPT Prompt Engineering' },
      { value: 'langchain', label: 'LangChain Courses' },
      { value: 'gen-ai-llms', label: 'Generative AI with LLMs' },
      { value: 'none', label: 'None yet - this is my first!' },
    ],
  },
  {
    id: 'interests',
    title: 'What topics excite you most?',
    subtitle: 'Pick up to 3 areas you\'d love to explore',
    icon: Sparkles,
    type: 'multi',
    maxSelections: 3,
    options: [
      { value: 'llms', label: 'Large Language Models' },
      { value: 'computer-vision', label: 'Computer Vision' },
      { value: 'agents', label: 'AI Agents & Automation' },
      { value: 'rag', label: 'RAG & Knowledge Systems' },
      { value: 'mlops', label: 'MLOps & Deployment' },
      { value: 'fine-tuning', label: 'Fine-tuning & Training' },
      { value: 'multimodal', label: 'Multimodal AI' },
      { value: 'responsible-ai', label: 'AI Safety & Ethics' },
    ],
  },
];

export default function Questionnaire({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isTransitioning, setIsTransitioning] = useState(false);

  const currentQuestion = questions[currentStep];
  const progress = ((currentStep + 1) / questions.length) * 100;

  const handleSelect = (value) => {
    if (currentQuestion.type === 'multi') {
      const current = answers[currentQuestion.id] || [];
      const maxSelections = currentQuestion.maxSelections || Infinity;

      if (current.includes(value)) {
        setAnswers({ ...answers, [currentQuestion.id]: current.filter(v => v !== value) });
      } else if (current.length < maxSelections) {
        // Handle "none" option specially
        if (value === 'none') {
          setAnswers({ ...answers, [currentQuestion.id]: ['none'] });
        } else {
          setAnswers({ ...answers, [currentQuestion.id]: [...current.filter(v => v !== 'none'), value] });
        }
      }
    } else {
      setAnswers({ ...answers, [currentQuestion.id]: value });
      // Auto-advance for single select after a brief delay
      setTimeout(() => handleNext(), 300);
    }
  };

  const handleNext = () => {
    if (currentStep < questions.length - 1) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
        setIsTransitioning(false);
      }, 150);
    } else {
      onComplete(answers);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentStep(currentStep - 1);
        setIsTransitioning(false);
      }, 150);
    }
  };

  const isCurrentAnswered = () => {
    const answer = answers[currentQuestion.id];
    if (currentQuestion.type === 'multi') {
      return answer && answer.length > 0;
    }
    return answer !== undefined;
  };

  const Icon = currentQuestion.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-slate-400 mb-2">
            <span>Question {currentStep + 1} of {questions.length}</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question card */}
        <div
          className={`bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 shadow-2xl transition-all duration-150 ${
            isTransitioning ? 'opacity-0 transform translate-x-4' : 'opacity-100 transform translate-x-0'
          }`}
        >
          {/* Question header */}
          <div className="flex items-start gap-4 mb-8">
            <div className="p-3 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl">
              <Icon className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-white mb-1">
                {currentQuestion.title}
              </h2>
              <p className="text-slate-400">
                {currentQuestion.subtitle}
              </p>
            </div>
          </div>

          {/* Options */}
          <div className="space-y-3">
            {currentQuestion.options.map((option) => {
              const isSelected = currentQuestion.type === 'multi'
                ? (answers[currentQuestion.id] || []).includes(option.value)
                : answers[currentQuestion.id] === option.value;

              return (
                <button
                  key={option.value}
                  onClick={() => handleSelect(option.value)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                    isSelected
                      ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/10'
                      : 'border-slate-600 hover:border-slate-500 hover:bg-slate-700/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className={`font-medium ${isSelected ? 'text-blue-300' : 'text-white'}`}>
                        {option.label}
                      </div>
                      {option.description && (
                        <div className="text-sm text-slate-400 mt-0.5">
                          {option.description}
                        </div>
                      )}
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="w-5 h-5 text-blue-400 flex-shrink-0" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t border-slate-700">
            <button
              onClick={handleBack}
              disabled={currentStep === 0}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                currentStep === 0
                  ? 'text-slate-600 cursor-not-allowed'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>

            {currentQuestion.type === 'multi' && (
              <button
                onClick={handleNext}
                disabled={!isCurrentAnswered()}
                className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-all ${
                  isCurrentAnswered()
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:shadow-lg hover:shadow-blue-500/25'
                    : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                }`}
              >
                {currentStep === questions.length - 1 ? 'Generate My Roadmap' : 'Continue'}
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Skip hint for multi-select */}
        {currentQuestion.type === 'multi' && currentQuestion.id === 'priorCourses' && (
          <p className="text-center text-slate-500 text-sm mt-4">
            Select "None yet" if you haven't taken any courses
          </p>
        )}
      </div>
    </div>
  );
}
