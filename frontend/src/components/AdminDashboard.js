import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

function AdminDashboard({ onLogout }) {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchAllRequests();
    fetchAllUsers();
  }, []);

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  const fetchAllRequests = async () => {
    const res = await api.get('/requests');
    setRequests(res.data);
  };

  const fetchAllUsers = async () => {
    try {
      const res = await api.get('/admin/users');
      console.log('Users response:', res.data);
      setUsers(res.data);
    } catch (err) {
      console.error('Failed to fetch users', err);
      console.error('Error response:', err.response);
    }
  };

  const updateStatus = async (id, newStatus) => {
    await api.put(`/admin/requests/${id}/status`, { status: newStatus });
    fetchAllRequests();
  };

  const deleteRequest = async (id) => {
    if (window.confirm('Delete this request?')) {
      await api.delete(`/admin/requests/${id}`);
      fetchAllRequests();
    }
  };

  // Helper to get status class name
  const getStatusClass = (status) => {
    const statusMap = {
      'pending': 'pending',
      'in progress': 'in_progress',
      'in_progress': 'in_progress',
      'resolved': 'resolved'
    };
    return `status-badge status-${statusMap[status] || 'pending'}`;
  };

  return (
    <div className="container">
      <div className="header-bar">
        <h2>Admin Dashboard</h2>
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </div>

      <h3>All Maintenance Requests</h3>
      {requests.map(req => (
        <div key={req.id} className="request-card">
          <h3>{req.title}</h3>
          <p><strong>Reported by:</strong> {req.name}</p>
          <p><strong>Location:</strong> {req.location}</p>
          <p>
            <strong>Status:</strong>{' '}
            <span className={getStatusClass(req.status)}>{req.status}</span>
          </p>
          <div className="card-actions">
            <button onClick={() => updateStatus(req.id, 'in_progress')}>In Progress</button>
            <button onClick={() => updateStatus(req.id, 'resolved')}>Resolved</button>
            <button onClick={() => deleteRequest(req.id)}>Delete</button>
          </div>
        </div>
      ))}

      <hr style={{ margin: '2rem 0', borderColor: '#E5E7EB' }} />

      <h3>Registered Users</h3>
      {users.length === 0 ? (
        <p style={{ color: '#EF4444', background: '#FEE2E2', padding: '10px', borderRadius: '8px' }}>
          No users found or failed to load. Check console for errors.
        </p>
      ) : (
        <ul className="user-list">
          {users.map(user => (
            <li key={user.id}>{user.name} ({user.email}) – Role: {user.role}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default AdminDashboard;