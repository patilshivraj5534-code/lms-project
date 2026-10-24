import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './layout/AppLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CourseDetails from './pages/CourseDetails';
import Learn from './pages/Learn';
import AllCourses from './pages/AllCourses';
import InstructorDashboard from './pages/InstructorDashboard';
import QuizPage from './pages/QuizPage';

const HomeRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  
  const isInstructor = user.role === 'INSTRUCTOR' || user.role === 'ADMIN';
  return <Navigate to={isInstructor ? "/instructor" : "/dashboard"} replace />;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected routes with layout */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/course/:id" element={<CourseDetails />} />
            <Route path="/subjects" element={<AllCourses />} />
            <Route path="/learn/:courseId/video/:videoId" element={<Learn />} />
            <Route path="/instructor" element={<InstructorDashboard />} />
            <Route path="/course/:courseId/quiz" element={<QuizPage />} />
            <Route index element={<HomeRedirect />} />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<HomeRedirect />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
