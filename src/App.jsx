import { useState, useEffect } from 'react';
import WelcomeScreen from './components/WelcomeScreen';
import Questionnaire from './components/Questionnaire';
import RoadmapView from './components/RoadmapView';
import { generatePathway } from './utils/pathwayGenerator';
import { decodePathwayFromURL } from './utils/exportPDF';

function App() {
  const [currentView, setCurrentView] = useState('welcome'); // welcome | questionnaire | roadmap
  const [roadmap, setRoadmap] = useState(null);

  // Check for shared roadmap URL on mount
  useEffect(() => {
    const sharedAnswers = decodePathwayFromURL();
    if (sharedAnswers) {
      const generatedRoadmap = generatePathway(sharedAnswers);
      setRoadmap(generatedRoadmap);
      setCurrentView('roadmap');
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const handleStartQuestionnaire = () => {
    setCurrentView('questionnaire');
  };

  const handleQuestionnaireComplete = (answers) => {
    const generatedRoadmap = generatePathway(answers);
    setRoadmap(generatedRoadmap);
    setCurrentView('roadmap');
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
