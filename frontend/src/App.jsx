import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import LoginPage from './pages/LoginPage';
import NewsStoriesPage from './pages/NewsStoriesPage';
import StoryEditorPage from './pages/StoryEditorPage';
import EditorReviewPage from './pages/EditorReviewPage';
import PublishedFeedPage from './pages/PublishedFeedPage';
import StoryDetailPage from './pages/StoryDetailPage';
import NewsAnalyticsPage from './pages/NewsAnalyticsPage';
import AdminPage from './pages/AdminPage';
import ProfilePage from './pages/ProfilePage';

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="app-container"><div className="skeleton" style={{ height: 200, marginTop: '2rem' }} /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role) && !(roles.includes('editor') && user.role === 'admin')) {
    return <Navigate to="/feed" replace />;
  }
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/feed" element={<PublishedFeedPage />} />
      <Route path="/feed/:slug" element={<StoryDetailPage />} />

      <Route path="/stories" element={
        <ProtectedRoute roles={['journalist', 'editor', 'admin']}>
          <NewsStoriesPage />
        </ProtectedRoute>
      } />
      <Route path="/stories/new" element={
        <ProtectedRoute roles={['journalist', 'editor', 'admin']}>
          <StoryEditorPage />
        </ProtectedRoute>
      } />
      <Route path="/stories/:id/edit" element={
        <ProtectedRoute roles={['journalist', 'editor', 'admin']}>
          <StoryEditorPage />
        </ProtectedRoute>
      } />

      <Route path="/review" element={
        <ProtectedRoute roles={['editor', 'admin']}>
          <EditorReviewPage />
        </ProtectedRoute>
      } />

      <Route path="/analytics" element={
        <ProtectedRoute roles={['editor', 'admin']}>
          <NewsAnalyticsPage />
        </ProtectedRoute>
      } />

      <Route path="/admin" element={
        <ProtectedRoute roles={['admin']}>
          <AdminPage />
        </ProtectedRoute>
      } />

      <Route path="/profile" element={
        <ProtectedRoute>
          <ProfilePage />
        </ProtectedRoute>
      } />

      <Route path="/" element={<Navigate to="/feed" replace />} />
      <Route path="*" element={<Navigate to="/feed" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
