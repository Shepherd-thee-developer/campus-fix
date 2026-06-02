import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',  // Your backend URL
});

// Attach token to every request if it exists
api.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) req.headers['x-auth-token'] = token;
  return req;
});

export default api;