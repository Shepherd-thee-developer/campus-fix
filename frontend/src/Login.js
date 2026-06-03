// src/Login.js
import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import './Dashboard.css';
import { Link } from 'react-router-dom';

const Login = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      // On success, the AuthContext will update the user and redirect (App.js handles the routing)
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Check credentials.');
    }
  };

  return (
    <div className="dashboard-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <div className="card" style={{ maxWidth: '400px', width: '100%' }}>
        <h1 style={{ textAlign: 'center' }}>Campus Fix</h1>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={{ width: '100%', padding: '0.5rem' }}
            />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={{ width: '100%', padding: '0.5rem' }}
            />
          </div>
          {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}
          <button type="submit" className="btn-dash btn-primary-dash" style={{ width: '100%' }}>
            Log In
          </button>
        </form>
      </div>
      <div style={{ textAlign: 'center', marginTop: '1rem' }}>
  Don't have an account? <Link to="/register">Sign Up</Link>
</div>
    </div>
  );
};

export default Login;