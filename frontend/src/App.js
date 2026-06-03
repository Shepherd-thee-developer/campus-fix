import React from 'react';
import { useAuth, AuthProvider } from './AuthContext';
import Login from './Login';
import Register from './Register';
import UserDashboard from './UserDashboard';
import AdminDashboard from './AdminDashboard';
import { HashRouter } from 'react-router-dom';
// ...
<HashRouter>
  <App />
</HashRouter>

// Component to handle routing based on auth state
const AppRoutes = () => {
  const { user } = useAuth();
  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    );
  }
  return (
    <Routes>
      <Route path="/" element={user.role === 'admin' ? <AdminDashboard /> : <UserDashboard />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;