import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Header from './components/Header';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import CategoryPage from './pages/CategoryPage';
import ArticlePage from './pages/ArticlePage';
import SearchPage from './pages/SearchPage';
import AdminPage from './pages/AdminPage';
import LoginPage from './pages/LoginPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-gray-50">
          <Header />
          <main className="flex-1">
            <Routes>
              {/* Public */}
              <Route path="/" element={<HomePage />} />
              <Route path="/category/:slug" element={<CategoryPage />} />
              <Route path="/articles/:slug" element={<ArticlePage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/login" element={<LoginPage />} />

              {/* Protected — admin only */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <AdminPage />
                  </ProtectedRoute>
                }
              />

              <Route path="*" element={
                <div className="flex flex-col items-center justify-center py-32 text-gray-500">
                  <p className="text-4xl font-bold text-gray-200 mb-4">404</p>
                  <p className="text-sm mb-4">Page not found</p>
                  <a href="/" className="text-brand-600 hover:underline text-sm">← Back to Help Center</a>
                </div>
              } />
            </Routes>
          </main>
          <footer className="border-t border-gray-200 bg-white py-6 text-center text-xs text-gray-400">
            © {new Date().getFullYear()} QuizCommerce · Help Center ·
            <a href="mailto:support@quizcommerce.io" className="ml-1 hover:text-brand-600 transition">support@quizcommerce.io</a>
          </footer>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
