import { useState } from 'react';
import WelcomeScreen from './components/WelcomeScreen';
import Questionnaire from './components/Questionnaire';
import RoadmapView from './components/RoadmapView';
import { generatePathway } from './utils/pathwayGenerator';

function App() {
  const [currentView, setCurrentView] = useState('welcome'); // welcome | questionnaire | roadmap
  const [roadmap, setRoadmap] = useState(null);

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
