import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './components/Login';
import Register from './components/Register';
import Requests from './components/Requests';
import AdminDashboard from './components/AdminDashboard';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    if (token) {
      try {
        const decoded = JSON.parse(atob(token.split('.')[1]));
        setUserRole(decoded.role);
      } catch (e) {
        console.error('Invalid token', e);
      }
    } else {
      setUserRole(null);
    }
  }, [token]);

  // Logout function – clears token from state and localStorage
  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUserRole(null);
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login setToken={setToken} />} />
        <Route path="/register" element={<Register />} />
        <Route 
          path="/" 
          element={
            token ? (
              userRole === 'admin' ? 
                <Navigate to="/admin" /> : 
                <Requests onLogout={handleLogout} />   // ✅ pass logout
            ) : (
              <Navigate to="/login" />
            )
          } 
        />
        <Route 
          path="/admin" 
          element={
            token && userRole === 'admin' ? 
              <AdminDashboard onLogout={handleLogout} /> :  // ✅ pass logout
              <Navigate to="/" />
          } 
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;