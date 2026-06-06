import axios from 'axios';

const API_BASE = '/api/v1';

/** Normalize DRF paginated `{ results }` or plain arrays. */
export function asList(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.results)) return data.results;
  return [];
}

const client = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
});

export const authApi = {
  login: (username, password) =>
    client.post('/auth/login/', { username, password }),
  register: (data) =>
    client.post('/auth/register/', data),
  me: () => client.get('/auth/me/'),
  updateProfile: (data) => client.patch('/auth/me/', data),
  getUsers: () => client.get('/auth/users/'),
  getUser: (id) => client.get(`/auth/users/${id}/`),
  createUser: (data) => client.post('/auth/users/', data),
  updateUser: (id, data) => client.patch(`/auth/users/${id}/`, data),
  deleteUser: (id) => client.delete(`/auth/users/${id}/`),
  deactivateUser: (id) => client.post(`/auth/users/${id}/deactivate/`),
  activateUser: (id) => client.post(`/auth/users/${id}/activate/`),
};

export const newsApi = {
  getCategories: () => client.get('/news/categories/'),
  getFeed: (params) => client.get('/news/feed/', { params }),
  getFeedStory: (slug) => client.get(`/news/feed/${slug}/`),
  getStories: (params) => client.get('/news/stories/', { params }),
  getStory: (id) => client.get(`/news/stories/${id}/`),
  createStory: (data) => client.post('/news/stories/', data),
  updateStory: (id, data) => client.patch(`/news/stories/${id}/`, data),
  deleteStory: (id) => client.delete(`/news/stories/${id}/`),
  submitStory: (id) => client.post(`/news/stories/${id}/submit/`),
  startReview: (id) => client.post(`/news/stories/${id}/start_review/`),
  stopReview: (id) => client.post(`/news/stories/${id}/stop_review/`),
  reviewStory: (id, data) => client.post(`/news/stories/${id}/review/`, data),
  publishStory: (id) => client.post(`/news/stories/${id}/publish/`),
  archiveStory: (id) => client.post(`/news/stories/${id}/archive/`),
  unpublishStory: (id) => client.post(`/news/stories/${id}/unpublish/`),
  getHistory: (id) => client.get(`/news/stories/${id}/history/`),
  getDeadlines: () => client.get('/news/deadlines/'),
  createDeadline: (data) => client.post('/news/deadlines/', data),
  getReports: (params) => client.get('/news/reports/', { params }),
};

export default client;
