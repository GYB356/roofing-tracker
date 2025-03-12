import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Download, ZoomIn, ZoomOut, RotateCcw, RotateCw, Image } from 'lucide-react';

const MedicalImagingViewer = () => {
  const { id } = useParams();
  const [imagingData, setImagingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  
  useEffect(() => {
    const fetchImagingData = async () => {
      try {
        setLoading(true);
        
        // Check for mock data
        const mockDataStr = localStorage.getItem('mockImagingData');
        if (mockDataStr) {
          const mockData = JSON.parse(mockDataStr);
          const image = mockData.find(img => img.id === id) || mockData[0];
          setImagingData(image);
          setLoading(false);
          return;
        }
        
        // Real API call
        const response = await fetch(`/api/imaging/${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch imaging data');
        }
        
        const data = await response.json();
        setImagingData(data);
      } catch (err) {
        console.error('Error fetching imaging data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchImagingData();
  }, [id]);
  
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.5));
  const handleRotateLeft = () => setRotation(prev => prev - 90);
  const handleRotateRight = () => setRotation(prev => prev + 90);
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">
          {imagingData?.type || 'Medical Imaging'}: {imagingData?.description}
        </h2>
        <div className="text-sm text-gray-500">
          Date: {new Date(imagingData?.date).toLocaleDateString()}
        </div>
      </div>
      
      <div className="bg-black rounded-lg p-4 mb-4">
        <div className="relative flex justify-center">
          <img
            src={imagingData?.imageUrl || '/sample-xray.jpg'}
            alt={imagingData?.description || 'Medical image'}
            className="max-w-full max-h-96 object-contain"
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
              transition: 'transform 0.3s ease'
            }}
          />
        </div>
      </div>
      
      <div className="flex justify-center space-x-4 mb-6">
        <button 
          onClick={handleZoomIn} 
          className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"
          aria-label="Zoom in"
        >
          <ZoomIn size={20} />
        </button>
        <button 
          onClick={handleZoomOut} 
          className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"
          aria-label="Zoom out"
        >
          <ZoomOut size={20} />
        </button>
        <button 
          onClick={handleRotateLeft} 
          className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"
          aria-label="Rotate left"
        >
          <RotateCcw size={20} />
        </button>
        <button 
          onClick={handleRotateRight} 
          className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"
          aria-label="Rotate right"
        >
          <RotateCw size={20} />
        </button>
        <button 
          className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"
          aria-label="Download image"
        >
          <Download size={20} />
        </button>
      </div>
      
      <div className="border-t border-gray-100 pt-4">
        <h3 className="font-medium text-gray-700 mb-2">Radiologist Notes</h3>
        <p className="text-gray-600">{imagingData?.radiologistNotes || 'No notes available.'}</p>
        
        <div className="mt-4">
          <h3 className="font-medium text-gray-700 mb-2">Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Imaging Type</p>
              <p className="font-medium">{imagingData?.type || 'Unknown'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Ordered By</p>
              <p className="font-medium">{imagingData?.orderedBy || 'Unknown'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Body Region</p>
              <p className="font-medium">{imagingData?.bodyRegion || 'Unknown'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <p className="font-medium">{imagingData?.status || 'Completed'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MedicalImagingViewer; 