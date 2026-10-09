import { useState, useEffect } from 'react';
import { track } from './utils/analytics';
import WelcomeScreen from './components/WelcomeScreen';
import Questionnaire from './components/Questionnaire';
import RoadmapView from './components/RoadmapView';
import { generatePathway } from './utils/pathwayGenerator';
import { decodePathwayFromURL } from './utils/exportPDF';

function loadSharedRoadmap() {
  const sharedAnswers = decodePathwayFromURL();
  return sharedAnswers ? generatePathway(sharedAnswers) : null;
}

function App() {
  // A shared roadmap URL is read once, during the first render, so the
  // roadmap shows immediately instead of after a second render.
  const [sharedRoadmap] = useState(loadSharedRoadmap);
  const [currentView, setCurrentView] = useState(sharedRoadmap ? 'roadmap' : 'welcome'); // welcome | questionnaire | roadmap
  const [roadmap, setRoadmap] = useState(sharedRoadmap);

  useEffect(() => {
    if (sharedRoadmap) {
      track('shared_roadmap_loaded', {
        pathway: sharedRoadmap.pathway,
      });
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [sharedRoadmap]);

  const handleStartQuestionnaire = () => {
    setCurrentView('questionnaire');
  };

  const handleQuestionnaireComplete = (answers) => {
    const generatedRoadmap = generatePathway(answers);
    setRoadmap(generatedRoadmap);
    setCurrentView('roadmap');
    track('roadmap_generated', {
      pathway: generatedRoadmap.pathway,
      experience: answers.experience,
      goal: answers.goal,
      time_commitment: answers.timeCommitment,
      total_courses: generatedRoadmap.summary.totalCourses,
    });
  };

  const handleRestart = () => {
    setRoadmap(null);
    setCurrentView('welcome');
  };

  return (
    <>
      {currentView === 'welcome' && (
        <WelcomeScreen onStart={handleStartQuestionnaire} />
      )}
      {currentView === 'questionnaire' && (
        <Questionnaire onComplete={handleQuestionnaireComplete} />
      )}
      {currentView === 'roadmap' && roadmap && (
        <RoadmapView roadmap={roadmap} onRestart={handleRestart} />
      )}
    </>
  );
}

export default App;
