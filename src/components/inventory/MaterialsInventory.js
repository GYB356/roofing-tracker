// src/components/inventory/MaterialsInventory.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import DashboardLayout from '../layout/DashboardLayout';
import MaterialsTable from './MaterialsTable';
import MaterialForm from './MaterialForm';

const MaterialsInventory = () => {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchMaterials();
    fetchCategories();
  }, [selectedCategory]);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const response = await api.get('/materials', {
        params: {
          category: selectedCategory !== 'all' ? selectedCategory : undefined,
          search: searchTerm || undefined
        }
      });
      setMaterials(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching materials:', err);
      setError('Failed to load materials. Please try again.');
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/materials/categories');
      setCategories(response.data);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchMaterials();
  };

  const handleAddMaterial = async (materialData) => {
    try {
      await api.post('/materials', materialData);
      setShowAddForm(false);
      fetchMaterials();
    } catch (err) {
      console.error('Error adding material:', err);
      return err.response?.data?.message || 'Failed to add material. Please try again.';
    }
  };

  const handleUpdateQuantity = async (id, newQuantity) => {
    try {
      await api.patch(`/materials/${id}/quantity`, { quantity: newQuantity });
      // Update local state
      setMaterials(prevMaterials => 
        prevMaterials.map(material => 
          material.id === id ? { ...material, quantity: newQuantity } : material
        )
      );
    } catch (err) {
      console.error('Error updating quantity:', err);
      return err.response?.data?.message || 'Failed to update quantity. Please try again.';
    }
  };

  const handleDeleteMaterial = async (id) => {
    if (!window.confirm('Are you sure you want to delete this material?')) {
      return;
    }
    
    try {
      await api.delete(`/materials/${id}`);
      // Update local state
      setMaterials(prevMaterials => prevMaterials.filter(material => material.id !== id));
    } catch (err) {
      console.error('Error deleting material:', err);
      alert(err.response?.data?.message || 'Failed to delete material. Please try again.');
    }
  };

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Materials Inventory</h1>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {showAddForm ? 'Cancel' : 'Add New Material'}
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Add New Material</h2>
          <MaterialForm 
            categories={categories} 
            onSubmit={handleAddMaterial} 
            onCancel={() => setShowAddForm(false)}
          />
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6">
        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <label htmlFor="categoryFilter" className="text-sm font-medium text-gray-700">
              Filter by Category:
            </label>
            <select
              id="categoryFilter"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <form onSubmit={handleSearch} className="flex w-full md:w-auto">
            <input
              type="text"
              placeholder="Search materials..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 w-full"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Search
            </button>
          </form>
        </div>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
            <p>{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            {materials.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 text-lg">No materials found.</p>
                <p className="text-gray-500">Add new materials or adjust your search criteria.</p>
              </div>
            ) : (
              <MaterialsTable 
                materials={materials} 
                onUpdateQuantity={handleUpdateQuantity}
                onDelete={handleDeleteMaterial}
              />
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MaterialsInventory;