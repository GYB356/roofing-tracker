// src/components/projects/ProjectForm.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const ProjectForm = ({ projectId = null }) => {
  const [formData, setFormData] = useState({
    projectName: '',
    client: '',
    address: '',
    startDate: '',
    estimatedEndDate: '',
    status: 'pending',
    roofType: '',
    roofSize: '',
    materials: [],
    budget: '',
    notes: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [clients, setClients] = useState([]);
  const [materialOptions, setMaterialOptions] = useState([]);
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchFormData = async () => {
      try {
        // Fetch clients for dropdown
        const clientsResponse = await api.get('/clients');
        setClients(clientsResponse.data);
        
        // Fetch materials for dropdown
        const materialsResponse = await api.get('/materials');
        setMaterialOptions(materialsResponse.data);
        
        // If editing an existing project, fetch its data
        if (projectId) {
          const projectResponse = await api.get(`/projects/${projectId}`);
          setFormData(projectResponse.data);
        }
      } catch (err) {
        console.error('Error fetching form data:', err);
        setError('Failed to load form data. Please try again.');
      }
    };
    
    fetchFormData();
  }, [projectId]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleMaterialChange = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    setFormData(prev => ({ ...prev, materials: selectedOptions }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      if (projectId) {
        // Update existing project
        await api.put(`/projects/${projectId}`, formData);
      } else {
        // Create new project
        await api.post('/projects', formData);
      }
      
      navigate('/projects');
    } catch (err) {
      console.error('Error saving project:', err);
      setError(err.response?.data?.message || 'Failed to save project. Please try again.');
      setLoading(false);
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">
        {projectId ? 'Edit Project' : 'Create New Project'}
      </h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Project Name*
            </label>
            <input
              type="text"
              name="projectName"
              value={formData.projectName}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Client*
            </label>
            <select
              name="client"
              value={formData.client}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Client</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address*
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date*
            </label>
            <input
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estimated End Date*
            </label>
            <input
              type="date"
              name="estimatedEndDate"
              value={formData.estimatedEndDate}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Roof Type
            </label>
            <select
              name="roofType"
              value={formData.roofType}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Roof Type</option>
              <option value="asphalt">Asphalt Shingles</option>
              <option value="metal">Metal Roof</option>
              <option value="tile">Tile Roof</option>
              <option value="flat">Flat Roof</option>
              <option value="slate">Slate Roof</option>
              <option value="wood">Wood Shingles</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Roof Size (sq ft)
            </label>
            <input
              type="number"
              name="roofSize"
              value={formData.roofSize}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Budget ($)
            </label>
            <input
              type="number"
              name="budget"
              value={formData.budget}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Materials
            </label>
            <select
              multiple
              name="materials"
              value={formData.materials}
              onChange={handleMaterialChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              size="4"
            >
              {materialOptions.map(material => (
                <option key={material.id} value={material.id}>
                  {material.name} - ${material.price}/unit
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple items</p>
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="4"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            ></textarea>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            type="button"
             the updates to the ProjectForm component with the changes you'veonClick={() => navigate('/projects')}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-[Windows
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            zyvalue driving the updates to the ProjectForm component with the changes you'veonClick={() => navigate('/projects')}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text[Windows
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text- provided:
            className="px