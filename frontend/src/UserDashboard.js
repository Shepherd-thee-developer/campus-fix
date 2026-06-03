// src/UserDashboard.js
import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import api from './api';
import './Dashboard.css';

const UserDashboard = () => {
  const { user, logout } = useAuth();
  const [requests, setRequests] = useState([]);
  const [newTitle, setNewTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const res = await api.get('/requests');
      setRequests(res.data);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Could not load your requests. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setSelectedFile(null);
      setPreview(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      setError('Please describe the issue.');
      return;
    }
    setSubmitting(true);
    setError('');

    const formData = new FormData();
    formData.append('title', newTitle);
    if (selectedFile) {
      formData.append('image', selectedFile);
    }

    try {
      const res = await api.post('/requests', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setRequests([res.data, ...requests]);
      setNewTitle('');
      setSelectedFile(null);
      setPreview(null);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    // Use environment variable for backend URL in production
    const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    return `${baseUrl}${imagePath}`;
  };

  // Helper for status badge class
  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'status-pending';
      case 'in progress': return 'status-progress';
      case 'resolved': return 'status-resolved';
      default: return 'status-pending';
    }
  };

  return (
    <div className="dashboard-container">
      {/* Navbar with logout */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', margin: 0 }}>👋 Welcome, {user?.name || user?.email || 'User'}</h1>
        <button onClick={logout} className="btn-dash" style={{ background: '#ef4444', color: 'white' }}>
          Logout
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stat-grid">
        <div className="stat-card" style={{ borderLeftColor: '#3b82f6' }}>
          <h3>Open Requests</h3>
          <div className="stat-number">
            {requests.filter(r => r.status?.toLowerCase() !== 'resolved').length}
          </div>
        </div>
        <div className="stat-card" style={{ borderLeftColor: '#10b981' }}>
          <h3>Resolved</h3>
          <div className="stat-number">
            {requests.filter(r => r.status?.toLowerCase() === 'resolved').length}
          </div>
        </div>
        <div className="stat-card" style={{ borderLeftColor: '#f59e0b' }}>
          <h3>In Progress</h3>
          <div className="stat-number">
            {requests.filter(r => r.status?.toLowerCase() === 'in progress').length}
          </div>
        </div>
      </div>

      {/* Submit new request with image upload */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h2>📝 Report New Issue</h2>
        {error && <div style={{ color: '#dc2626', marginBottom: '1rem' }}>{error}</div>}
        <form onSubmit={handleSubmit} encType="multipart/form-data">
          <div style={{ marginBottom: '1rem' }}>
            <input
              type="text"
              placeholder="Describe the problem..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              required
              style={{ width: '100%', padding: '0.75rem', borderRadius: '2rem', border: '1px solid #cbd5e1' }}
              disabled={submitting}
            />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={submitting}
              style={{ marginBottom: '0.5rem' }}
            />
            {preview && (
              <div>
                <img src={preview} alt="Preview" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px' }} />
              </div>
            )}
          </div>
          <button type="submit" className="btn-dash btn-primary-dash" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Request'}
          </button>
        </form>
      </div>

      {/* My requests table */}
      <div className="card">
        <h2>📋 My Maintenance Requests</h2>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>Loading your requests...</div>
        ) : requests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
            You haven't submitted any requests yet. Use the form above to report an issue.
          </div>
        ) : (
          <table className="request-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Status</th>
                <th>Image</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {requests.map(req => (
                <tr key={req.id}>
                  <td>{req.id}</td>
                  <td>{req.title}</td>
                  <td>
                    <span className={`status-badge ${getStatusClass(req.status)}`}>
                      {req.status || 'Pending'}
                    </span>
                  </td>
                  <td>
                    {req.image_url ? (
                      <a href={getImageUrl(req.image_url)} target="_blank" rel="noopener noreferrer">
                        <img
                          src={getImageUrl(req.image_url)}
                          alt="attachment"
                          style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }}
                        />
                      </a>
                    ) : (
                      'No image'
                    )}
                  </td>
                  <td>{new Date(req.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;