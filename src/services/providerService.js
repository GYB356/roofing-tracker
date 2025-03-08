import axios from 'axios';

class ProviderService {
  async getProviderProfile() {
    return axios.get('/api/providers/profile');
  }

  async updateProviderProfile(profileData) {
    return axios.put('/api/providers/profile', profileData);
  }

  async getProjects(filters = {}) {
    return axios.get('/api/projects', { params: filters });
  }

  async getProjectById(id) {
    return axios.get(`/api/projects/${id}`);
  }

  async createProject(projectData) {
    return axios.post('/api/projects', projectData);
  }

  async updateProject(id, projectData) {
    return axios.put(`/api/projects/${id}`, projectData);
  }

  async deleteProject(id) {
    return axios.delete(`/api/projects/${id}`);
  }

  async getClients() {
    return axios.get('/api/clients');
  }

  async getClientById(id) {
    return axios.get(`/api/clients/${id}`);
  }

  async createClient(clientData) {
    return axios.post('/api/clients', clientData);
  }

  async updateClient(id, clientData) {
    return axios.put(`/api/clients/${id}`, clientData);
  }

  async deleteClient(id) {
    return axios.delete(`/api/clients/${id}`);
  }
}

export default new ProviderService();