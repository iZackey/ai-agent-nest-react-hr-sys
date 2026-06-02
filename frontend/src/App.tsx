import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ChatPage from './pages/ChatPage';
import EvaluatePage from './pages/EvaluatePage';
import HistoryPage from './pages/HistoryPage';
import StatusPage from './pages/StatusPage';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<ChatPage />} />
          <Route path="/evaluate" element={<EvaluatePage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/status" element={<StatusPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
