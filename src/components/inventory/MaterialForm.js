// src/components/inventory/MaterialForm.js
import React, { useState } from 'react';

const MaterialForm = ({ categories, initialData, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState(initialData || {
    name: '',
    description: '',
    category: '',
    quantity: 0,
    unit: '',
    unitPrice: 0,
    supplier: '',
    minStockLevel: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;
    
    // Convert numeric inputs to numbers
    if (['quantity', 'unitPrice', 'minStockLevel'].includes(name)) {
      processedValue = value === '' ? 0 : Number(value);
    }
    
    setFormData(prev => ({ ...prev, [name]: processedValue }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const result = await onSubmit(formData);
      if (result) {
        // If the onSubmit returns an error message
        setError(result);
        setLoading(false);
      }
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Material Name*
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category*
          </label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select Category</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Quantity*
          </label>
          <input
            type="number"
            name="quantity"
            value={formData.quantity}
            onChange={handleChange}
            required
            min="0"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Unit*
          </label>
          <input
            type="text"
            name="unit"
            value={formData.unit}
            onChange={handleChange}
            required
            placeholder="e.g., sq ft, bundle, each"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Unit Price ($)*
          </label>
          <input
            type="number"
            name="unitPrice"
            value={formData.unitPrice}
            onChange={handleChange}
            required
            min="0"
            step="0.01"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Minimum Stock Level*
          </label>
          <input
            type="number"
            name="minStockLevel"
            value={formData.minStockLevel}
            onChange={handleChange}
            required
            min="0"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Supplier
          </label>
          <input
            type="text"
            name="supplier"
            value={formData.supplier}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            name="description"
            rows="3"
            value={formData.description}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          ></textarea>
        </div>
      </div>
      
      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {loading ? 'Saving...' : initialData ? 'Update Material' : 'Add Material'}
        </button>
      </div>
    </form>
  );
};

export default MaterialForm;

// src/components/inventory/MaterialsTable.js
import React, { useState } from 'react';

const MaterialsTable = ({ materials, onUpdateQuantity, onDelete }) => {
  const [editingId, setEditingId] = useState(null);
  const [editQuantity, setEditQuantity] = useState(0);
  const [updateLoading, setUpdateLoading] = useState(false);

  const handleEdit = (material) => {
    setEditingId(material.id);
    setEditQuantity(material.quantity);
  };

  const handleUpdate = async (id) => {
    setUpdateLoading(true);
    const error = await onUpdateQuantity(id, editQuantity);
    if (!error) {
      setEditingId(null);
    }
    setUpdateLoading(false);
  };

  // Function to determine if stock level is low
  const isLowStock = (material) => {
    return material.quantity <= material.minStockLevel;
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Material
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Category
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Quantity
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Unit
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Unit Price
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Total Value
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {materials.map(material => (
            <tr key={material.id} className={`${isLowStock(material) ? 'bg-red-50' : 'hover:bg-gray-50'}`}>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{material.name}</div>
                <div className="text-sm text-gray-500">{material.supplier}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {material.categoryName}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {editingId === material.id ? (
                  <div className="flex items-center">
                    <input
                      type="number"
                      value={editQuantity}
                      onChange={(e) => setEditQuantity(Number(e.target.value))}
                      min="0"
                      className="w-20 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      onClick={() => handleUpdate(material.id)}
                      disabled={updateLoading}
                      className="ml-2 text-green-600 hover:text-green-900"
                    >
                      {updateLoading ? '...' : '✓'}
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="ml-1 text-red-600 hover:text-red-900"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center">
                    <span className={`text-sm font-medium ${isLowStock(material) ? 'text-red-700' : 'text-gray-900'}`}>
                      {material.quantity}
                      {isLowStock(material) && (
                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Low Stock
                        </span>
                      )}
                    </span>
                  </div>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {material.unit}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${parseFloat(material.unitPrice).toFixed(2)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${(material.quantity * material.unitPrice).toFixed(2)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                  onClick={() => handleEdit(material)}
                  className="text-indigo-600 hover:text-indigo-900 mr-4"
                >
                  Edit Qty
                </button>
                <button
                  onClick={() => onDelete(material.id)}
                  className="text-red-600 hover:text-red-900"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MaterialsTable;

// src/components/inventory/MaterialsAlert.js
import React from 'react';
import { Link } from 'react-router-dom';

const MaterialsAlert = ({ alerts }) => {
  if (!alerts || alerts.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-gray-500">No material alerts at this time.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {alerts.map((alert, index) => (
        <div 
          key={index} 
          className="bg-red-50 border-l-4 border-red-500 p-4 flex justify-between items-center"
        >
          <div>
            <p className="text-red-700 font-medium">{alert.name}</p>
            <p className="text-sm text-red-600">
              Current stock: {alert.quantity} {alert.unit} (Minimum: {alert.minStockLevel} {alert.unit})
            </p>
          </div>
          <Link 
            to="/inventory" 
            className="px-3 py-1 bg-red-100 text-red-800 rounded-md hover:bg-red-200 text-sm"
          >
            View
          </Link>
        </div>
      ))}
    </div>
  );
};

export default MaterialsAlert;