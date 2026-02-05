import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import { Home } from './pages/Home';
import { Learn } from './features/learn/pages/Learn';
import { Flashcards } from './features/flashcards/pages/Flashcards';
import { Match } from './features/match/pages/Match';
import { Mixed } from './features/mixed/pages/Mixed';
import { Guided } from './features/guided/pages/Guided';
import { TestMode } from './features/test-mode/pages/TestMode';
import { Statistics } from './features/statistics/pages/Statistics';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path="learn" element={<Learn />} />
          <Route path="flashcards" element={<Flashcards />} />
          <Route path="match" element={<Match />} />
          <Route path="mixed" element={<Mixed />} />
          <Route path="guided" element={<Guided />} />
          <Route path="test" element={<TestMode />} />
          <Route path="statistics" element={<Statistics />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
