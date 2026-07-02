/**
 * 应用主入口组件
 * 配置应用的路由结构，使用 React Router 实现页面导航
 */
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ChatPage from './pages/ChatPage';
import EvaluatePage from './pages/EvaluatePage';
import HistoryPage from './pages/HistoryPage';
import StatusPage from './pages/StatusPage';
import './App.css';

/**
 * App 主组件
 * 定义应用的路由配置，所有页面都嵌套在 Layout 布局组件中
 * @returns {JSX.Element} 应用主视图
 */
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 主布局路由，所有子路由共享 Layout 组件 */}
        <Route element={<Layout />}>
          {/* 聊天页面 - 默认首页 */}
          <Route path="/" element={<ChatPage />} />
          {/* 评估页面 */}
          <Route path="/evaluate" element={<EvaluatePage />} />
          {/* 历史记录页面 */}
          <Route path="/history" element={<HistoryPage />} />
          {/* 状态页面 */}
          <Route path="/status" element={<StatusPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;