import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

function Requests({ onLogout }) {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  const fetchRequests = async () => {
    try {
      const res = await api.get('/requests');
      setRequests(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('title', title);
    formData.append('location', location);
    formData.append('description', description);
    if (image) formData.append('image', image);

    try {
      await api.post('/requests', formData);
      fetchRequests();
      setTitle('');
      setLocation('');
      setDescription('');
      setImage(null);
    } catch (err) {
      alert('Failed to submit request');
    }
  };

  const updateStatus = async (id, newStatus) => {
    try {
      await api.put(`/requests/${id}`, { status: newStatus });
      fetchRequests();
    } catch (err) {
      alert('Status update failed');
    }
  };

  const deleteRequest = async (id) => {
    if (!window.confirm('Delete this request?')) return;
    try {
      await api.delete(`/requests/${id}`);
      fetchRequests();
    } catch (err) {
      alert('Delete failed');
    }
  };

  // Helper to get status class name (convert spaces to underscores if needed)
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
        <h2>CampusFix - Maintenance Requests</h2>
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </div>

      <form onSubmit={handleSubmit}>
        <input
          placeholder="Title (e.g., Broken AC)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <input
          placeholder="Location (e.g., Library 2nd floor)"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
        <textarea
          placeholder="Describe the problem"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <input type="file" onChange={(e) => setImage(e.target.files[0])} />
        <button type="submit">Submit Request</button>
      </form>

      {requests.map((req) => (
        <div key={req.id} className="request-card">
          <h3>{req.title}</h3>
          <p><strong>Location:</strong> {req.location}</p>
          <p>
            <strong>Status:</strong>{' '}
            <span className={getStatusClass(req.status)}>{req.status}</span>
          </p>
          <p><strong>Reported by:</strong> {req.name}</p>
          <p>{req.description}</p>
          {req.image_url && (
            <img
              src={`http://localhost:5000${req.image_url}`}
              width="100"
              alt="issue"
              style={{ borderRadius: '8px', marginTop: '8px' }}
            />
          )}
          <div className="card-actions">
            <button onClick={() => updateStatus(req.id, 'in_progress')}>In Progress</button>
            <button onClick={() => updateStatus(req.id, 'resolved')}>Resolved</button>
            <button onClick={() => deleteRequest(req.id)}>Delete</button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default Requests;