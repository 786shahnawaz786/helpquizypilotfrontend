import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAdmin, loading } = useAuth();

  if (loading) return <LoadingSpinner text="Checking session…" />;
  if (!isAdmin) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
