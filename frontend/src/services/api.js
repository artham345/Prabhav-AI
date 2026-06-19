const BASE_URL = 'http://localhost:8000/api';

const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem('prabhav_token');
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Network request failed' }));
    throw new Error(errorData.detail || 'Request failed');
  }
  
  return response.json();
};

export const api = {
  // Authentication
  login: async (email, password) => {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem('prabhav_token', data.access_token);
    localStorage.setItem('prabhav_role', data.role);
    return data;
  },
  
  register: async (email, password, role) => {
    return apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, role }),
    });
  },
  
  logout: () => {
    localStorage.removeItem('prabhav_token');
    localStorage.removeItem('prabhav_role');
  },
  
  getRole: () => localStorage.getItem('prabhav_role'),
  getToken: () => localStorage.getItem('prabhav_token'),
  isAuthenticated: () => !!localStorage.getItem('prabhav_token'),
  
  // Brand Profile
  getBrandProfile: () => apiRequest('/brand/profile'),
  createBrandProfile: (data) => apiRequest('/brand/profile', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateBrandProfile: (data) => apiRequest('/brand/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  
  // Influencer Profile & Ingestion
  getInfluencerProfile: () => apiRequest('/influencer/profile'),
  createInfluencerProfile: (data) => apiRequest('/influencer/profile', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateInfluencerProfile: (data) => apiRequest('/influencer/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  ingestIntelligence: () => apiRequest('/influencer/intelligence/ingest', {
    method: 'POST',
  }),
  getAllInfluencers: () => apiRequest('/influencer/all'),
  
  // Campaigns
  getCampaigns: () => apiRequest('/campaigns'),
  getCampaignById: (id) => apiRequest(`/campaigns/${id}`),
  createCampaign: (data) => apiRequest('/campaigns', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  // AI Feature Endpoints
  getRecommendations: (campaignId) => apiRequest(`/campaigns/${campaignId}/recommendations`),
  getAudienceFit: (campaignId, influencerId) => apiRequest(`/campaigns/${campaignId}/audience-fit/${influencerId}`),
  simulateCampaign: (campaignId, data) => apiRequest(`/campaigns/${campaignId}/simulate`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getRoiPredictions: (campaignId) => apiRequest(`/campaigns/${campaignId}/roi-predictions`),
  getSentimentAnalysis: (campaignId, comments) => apiRequest(`/campaigns/${campaignId}/sentiment`, {
    method: 'POST',
    body: JSON.stringify(comments),
  }),
  getAdvisorSuggestions: (campaignId) => apiRequest(`/campaigns/${campaignId}/advisor`),
  
  getMarketIntelligence: (category) => apiRequest(`/market-intelligence?category=${category}`),
  
  // Collaboration Marketplace
  getCollaborations: () => apiRequest('/collaborations'),

  createCollaboration: (data) => apiRequest('/collaborations', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateCollaboration: (collabId, data) => apiRequest(`/collaborations/${collabId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
};
