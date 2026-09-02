import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import MainLayout from './components/layout/MainLayout';
import MicroAppLoader from './components/microfrontend/MicroAppLoader';
import LoginForm from './components/auth/LoginForm';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { childApps } from './config/apps.config';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginForm />} />
          
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route path="/" element={
                <Navigate to={childApps[0]?.path || '/login'} replace />
              } />
              
              {/* 🔥 КАЖДОЕ приложение имеет СВОЙ маршрут */}
              {childApps.map(app => (
                <Route 
                  key={app.id}
                  path={`${app.path}/*`} 
                  element={<MicroAppLoader />} 
                />
              ))}
              
              <Route path="*" element={
                <div style={{ padding: '40px', textAlign: 'center' }}>
                  <h2>Страница не найдена</h2>
                </div>
              } />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;