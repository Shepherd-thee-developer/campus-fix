// src/AdminDashboard.js
import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import api from './api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line
} from 'recharts';
import './Dashboard.css';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [allRequests, setAllRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await api.get('/requests');
      setAllRequests(res.data);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, newStatus, newAssignedTo = null) => {
    try {
      const payload = { status: newStatus };
      if (newAssignedTo) payload.assigned_to = newAssignedTo;
      const res = await api.put(`/requests/${id}`, payload);
      setAllRequests(prev =>
        prev.map(req => (req.id === id ? { ...req, ...res.data } : req))
      );
    } catch (err) {
      console.error(err);
      setError('Failed to update request status.');
    }
  };

  const handleSave = async (req, newStatus, newAssignedTo) => {
    await updateStatus(req.id, newStatus, newAssignedTo);
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete request "${title}"?`)) return;
    try {
      await api.delete(`/requests/${id}`);
      setAllRequests(prev => prev.filter(req => req.id !== id));
    } catch (err) {
      console.error(err);
      setError('Failed to delete request.');
    }
  };

  // Helper for image URL
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    return `${baseUrl}${imagePath}`;
  };

  // Chart data
  const statusCounts = { Pending: 0, 'In Progress': 0, Resolved: 0 };
  allRequests.forEach(req => {
    const status = req.status || 'Pending';
    if (status === 'Pending') statusCounts.Pending++;
    else if (status === 'In Progress') statusCounts['In Progress']++;
    else if (status === 'Resolved') statusCounts.Resolved++;
  });
  const statusData = Object.keys(statusCounts).map(key => ({ name: key, count: statusCounts[key] }));

  const last7Days = () => {
    const dates = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().slice(0, 10));
    }
    return dates;
  };
  const trendData = last7Days().map(date => {
    const count = allRequests.filter(req => new Date(req.created_at).toISOString().slice(0, 10) === date).length;
    return { date, count };
  });

  if (loading) return <div className="dashboard-container"><div style={{ textAlign: 'center', padding: '3rem' }}>Loading...</div></div>;

  return (
    <div className="dashboard-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', margin: 0 }}>🛠️ Admin Dashboard</h1>
          <p style={{ color: '#4b5563' }}>Welcome, {user?.name || 'Admin'}</p>
        </div>
        <button onClick={logout} className="btn-dash" style={{ background: '#ef4444', color: 'white' }}>Logout</button>
      </div>

      <div className="stat-grid">
        <div className="stat-card" style={{ borderLeftColor: '#ef4444' }}><h3>Pending</h3><div className="stat-number">{statusCounts.Pending}</div></div>
        <div className="stat-card" style={{ borderLeftColor: '#3b82f6' }}><h3>In Progress</h3><div className="stat-number">{statusCounts['In Progress']}</div></div>
        <div className="stat-card" style={{ borderLeftColor: '#10b981' }}><h3>Resolved</h3><div className="stat-number">{statusCounts.Resolved}</div></div>
        <div className="stat-card" style={{ borderLeftColor: '#8b5cf6' }}><h3>Total</h3><div className="stat-number">{allRequests.length}</div></div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', marginBottom: '2rem' }}>
        <div className="card" style={{ flex: 1 }}><h2>📊 Requests by Status</h2><ResponsiveContainer width="100%" height={300}><BarChart data={statusData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="count" fill="#3b82f6" /></BarChart></ResponsiveContainer></div>
        <div className="card" style={{ flex: 1 }}><h2>📈 Daily Trend (Last 7 Days)</h2><ResponsiveContainer width="100%" height={300}><LineChart data={trendData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" /><YAxis /><Tooltip /><Line type="monotone" dataKey="count" stroke="#10b981" /></LineChart></ResponsiveContainer></div>
      </div>

      <div className="card">
        <h2>📌 All Campus Requests</h2>
        {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}
        {allRequests.length === 0 ? <p>No requests yet.</p> : (
          <table className="request-table">
            <thead><tr><th>ID</th><th>Title</th><th>Status</th><th>Assigned To</th><th>Image</th><th>User ID</th><th>Date</th><th>Actions</th></tr></thead>
            <tbody>
              {allRequests.map(req => (
                <tr key={req.id}>
                  <td>{req.id}</td>
                  <td>{req.title}</td>
                  <td>
                    <select value={req.status || 'Pending'} onChange={(e) => {
                      const updated = { ...req, status: e.target.value };
                      setAllRequests(prev => prev.map(r => r.id === req.id ? updated : r));
                    }} style={{ padding: '0.3rem', borderRadius: '1rem' }}>
                      <option>Pending</option><option>In Progress</option><option>Resolved</option>
                    </select>
                  </td>
                  <td>
                    <select value={req.assigned_to || 'Unassigned'} onChange={(e) => {
                      const updated = { ...req, assigned_to: e.target.value };
                      setAllRequests(prev => prev.map(r => r.id === req.id ? updated : r));
                    }} style={{ padding: '0.3rem', borderRadius: '1rem' }}>
                      <option>Unassigned</option><option>John</option><option>Sarah</option><option>Mike</option>
                    </select>
                  </td>
                  <td>
                    {req.image_url && (
                      <a href={getImageUrl(req.image_url)} target="_blank" rel="noopener noreferrer">
                        <img src={getImageUrl(req.image_url)} style={{ width: '40px', height: '40px', objectFit: 'cover' }} alt="attachment" />
                      </a>
                    )}
                  </td>
                  <td>#{req.user_id}</td>
                  <td>{new Date(req.created_at).toLocaleDateString()}</td>
                  <td>
                    <button onClick={() => handleSave(req, req.status, req.assigned_to)} className="btn-dash" style={{ background: '#2563eb', color: 'white', marginRight: '8px' }}>Save</button>
                    <button onClick={() => handleDelete(req.id, req.title)} className="btn-dash" style={{ background: '#dc2626', color: 'white' }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;