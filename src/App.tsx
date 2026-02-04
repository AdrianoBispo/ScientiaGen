import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
import { Home } from './pages/Home';
import { Learn } from './pages/Learn';
import { Flashcards } from './pages/Flashcards';
import { Match } from './pages/Match';
import { Mixed } from './pages/Mixed';
import { Guided } from './pages/Guided';

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
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
