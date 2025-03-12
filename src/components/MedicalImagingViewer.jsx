import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ImagingService from '../../services/ImagingService.js';
import { 
  Download,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RotateCw,
  Share,
  Printer,
  Info,
  ChevronLeft,
  ChevronRight,
  X,
  ArrowLeft,
  FilePlus,
  Calendar,
  User,
  MessageSquare,
  Clock,
  AlertTriangle
} from 'lucide-react';

/**
 * Component for viewing and manipulating medical images
 */
const MedicalImagingViewer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [imagingStudy, setImagingStudy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [showInfo, setShowInfo] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageSeries, setImageSeries] = useState([]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [shareMessage, setShareMessage] = useState('');
  const [shareExpiration, setShareExpiration] = useState('7days');
  const [shareLoading, setShareLoading] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [shareError, setShareError] = useState(null);
  
  const imageRef = useRef(null);
  
  // Fetch imaging study data
  useEffect(() => {
    const fetchImagingStudy = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const study = await ImagingService.getImagingStudy(id);
        setImagingStudy(study);
        
        // Fetch other images in the same series if this is part of a multi-image study
        if (study.seriesId) {
          const seriesImages = await ImagingService.getPatientImagingStudies(study.patientId, {
            seriesId: study.seriesId
          });
          setImageSeries(seriesImages);
          
          // Set current image index
          const index = seriesImages.findIndex(img => img.id === id);
          if (index !== -1) {
            setCurrentImageIndex(index);
          }
        } else {
          // Single image study
          setImageSeries([study]);
        }
      } catch (err) {
        console.error('Error fetching imaging study:', err);
        setError('Failed to load imaging study. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchImagingStudy();
  }, [id]);
  
  // Reset image transformations when image changes
  useEffect(() => {
    setZoom(1);
    setRotation(0);
    setBrightness(100);
    setContrast(100);
  }, [currentImageIndex]);
  
  // Image manipulation handlers
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.5));
  const handleRotateLeft = () => setRotation(prev => prev - 90);
  const handleRotateRight = () => setRotation(prev => prev + 90);
  const handleBrightnessIncrease = () => setBrightness(prev => Math.min(prev + 10, 200));
  const handleBrightnessDecrease = () => setBrightness(prev => Math.max(prev - 10, 0));
  const handleContrastIncrease = () => setContrast(prev => Math.min(prev + 10, 200));
  const handleContrastDecrease = () => setContrast(prev => Math.max(prev - 10, 0));
  const handleResetImage = () => {
    setZoom(1);
    setRotation(0);
    setBrightness(100);
    setContrast(100);
  };
  
  // Navigation between images in series
  const handlePreviousImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(prev => prev - 1);
      navigate(`/imaging/${imageSeries[currentImageIndex - 1].id}`);
    }
  };
  
  const handleNextImage = () => {
    if (currentImageIndex < imageSeries.length - 1) {
      setCurrentImageIndex(prev => prev + 1);
      navigate(`/imaging/${imageSeries[currentImageIndex + 1].id}`);
    }
  };
  
  // Print current image
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    
    if (!printWindow) {
      alert('Please allow popups for this website to print images.');
      return;
    }
    
    const currentImage = imageSeries[currentImageIndex];
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Medical Image: ${currentImage.description}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
          .header { margin-bottom: 20px; }
          .patient-info { margin-bottom: 20px; }
          .patient-info div { margin-bottom: 5px; }
          .image-container { text-align: center; margin-bottom: 20px; }
          .notes { margin-top: 20px; border-top: 1px solid #ccc; padding-top: 20px; }
          @media print {
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${currentImage.description}</h1>
          <p>Date: ${new Date(currentImage.date).toLocaleDateString()}</p>
        </div>
        
        <div class="patient-info">
          <div><strong>Patient ID:</strong> ${currentImage.patientId}</div>
          <div><strong>Imaging Type:</strong> ${currentImage.type}</div>
          <div><strong>Ordered By:</strong> ${currentImage.orderedBy}</div>
        </div>
        
        <div class="image-container">
          <img src="${currentImage.imageUrl}" alt="${currentImage.description}" style="max-width: 100%; max-height: 500px;" />
        </div>
        
        <div class="notes">
          <h2>Radiologist Notes</h2>
          <p>${currentImage.radiologistNotes || 'No notes available.'}</p>
          
          <h2>Findings</h2>
          <p>${currentImage.findings || 'No findings recorded.'}</p>
        </div>
        
        <button onclick="window.print(); window.close();" style="margin-top: 20px; padding: 10px 15px; background-color: #4299e1; color: white; border: none; border-radius: 4px; cursor: pointer;">
          Print
        </button>
      </body>
      </html>
    `);
    
    printWindow.document.close();
    
    // Automatically trigger print after content loads
    printWindow.onload = function() {
      printWindow.focus();
      setTimeout(() => printWindow.print(), 500);
    };
  };
  
  // Download current image
  const handleDownload = () => {
    const currentImage = imageSeries[currentImageIndex];
    
    // Create a temporary link element
    const link = document.createElement('a');
    link.href = currentImage.imageUrl;
    link.download = `${currentImage.type.toLowerCase().replace(' ', '_')}_${new Date(currentImage.date).toISOString().split('T')[0]}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Share the current image
  const handleShare = async (e) => {
    e.preventDefault();
    
    if (!recipientEmail) {
      setShareError('Please enter a recipient email address.');
      return;
    }
    
    try {
      setShareLoading(true);
      setShareError(null);
      
      // Convert expiration selection to an actual date
      let expirationDate;
      switch (shareExpiration) {
        case '1day':
          expirationDate = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000);
          break;
        case '3days':
          expirationDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
          break;
        case '7days':
          expirationDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
          break;
        case '30days':
          expirationDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          expirationDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      }
      
      const shareData = {
        recipient: recipientEmail,
        message: shareMessage,
        expiration: expirationDate.toISOString()
      };
      
      const response = await ImagingService.shareImagingStudy(imagingStudy.id, shareData);
      
      setShareSuccess(true);
      
      // Reset form after successful share
      setTimeout(() => {
        setShareSuccess(false);
        setRecipientEmail('');
        setShareMessage('');
        setShareExpiration('7days');
        setShowShareModal(false);
      }, 3000);
    } catch (err) {
      console.error('Error sharing imaging study:', err);
      setShareError('Failed to share imaging study. Please try again.');
    } finally {
      setShareLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Loading Medical Image</h2>
          <button 
            onClick={() => navigate(-1)}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Error Loading Image</h2>
          <button 
            onClick={() => navigate(-1)}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="text-sm font-medium text-red-700 hover:text-red-600"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Current image in the series
  const currentImage = imageSeries[currentImageIndex] || imagingStudy;
  
  return (
    <div className="bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="border-b border-gray-200 p-4 flex items-center justify-between bg-gray-50 rounded-t-lg">
        <div className="flex items-center">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full text-gray-500 hover:bg-gray-200"
            aria-label="Go back"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-semibold text-gray-800 ml-2">{currentImage.description}</h1>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowInfo(!showInfo)}
            className={`p-2 rounded-full ${showInfo ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-200'}`}
            aria-label="Toggle information panel"
          >
            <Info size={20} />
          </button>
          
          <button
            onClick={() => setShowControls(!showControls)}
            className={`p-2 rounded-full ${showControls ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-200'}`}
            aria-label="Toggle image controls"
          >
            <ZoomIn size={20} />
          </button>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row">
        {/* Main Image Viewer */}
        <div className={`flex-1 ${showInfo ? 'md:w-3/4' : 'w-full'} bg-black relative`}>
          <div className="flex items-center justify-center min-h-[500px] max-h-[calc(100vh-200px)] overflow-hidden">
            <img
              ref={imageRef}
              src={currentImage.imageUrl}
              alt={currentImage.description}
              className="max-w-full max-h-full object-contain transition-transform duration-200"
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
                filter: `brightness(${brightness}%) contrast(${contrast}%)`
              }}
            />
            
            {/* Image Navigation Buttons (only if series has multiple images) */}
            {imageSeries.length > 1 && (
              <>
                <button
                  onClick={handlePreviousImage}
                  disabled={currentImageIndex === 0}
                  className="absolute left-2 p-2 rounded-full bg-gray-800 bg-opacity-50 text-white disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label="Previous image"
                >
                  <ChevronLeft size={24} />
                </button>
                
                <button
                  onClick={handleNextImage}
                  disabled={currentImageIndex === imageSeries.length - 1}
                  className="absolute right-2 p-2 rounded-full bg-gray-800 bg-opacity-50 text-white disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label="Next image"
                >
                  <ChevronRight size={24} />
                </button>
                
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-gray-800 bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                  {currentImageIndex + 1} of {imageSeries.length}
                </div>
              </>
            )}
          </div>
          
          {/* Image Controls */}
          {showControls && (
            <div className="bg-gray-800 p-4 text-white">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="space-x-2">
                  <button
                    onClick={handleZoomIn}
                    className="p-2 rounded-md hover:bg-gray-700"
                    aria-label="Zoom in"
                  >
                    <ZoomIn size={20} />
                  </button>
                  
                  <button
                    onClick={handleZoomOut}
                    className="p-2 rounded-md hover:bg-gray-700"
                    aria-label="Zoom out"
                  >
                    <ZoomOut size={20} />
                  </button>
                  
                  <button
                    onClick={handleRotateLeft}
                    className="p-2 rounded-md hover:bg-gray-700"
                    aria-label="Rotate left"
                  >
                    <RotateCcw size={20} />
                  </button>
                  
                  <button
                    onClick={handleRotateRight}
                    className="p-2 rounded-md hover:bg-gray-700"
                    aria-label="Rotate right"
                  >
                    <RotateCw size={20} />
                  </button>
                </div>
                
                <div className="flex-1 max-w-xs mx-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs">Brightness</span>
                    <span className="text-xs">{brightness}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={brightness}
                    onChange={(e) => setBrightness(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
                
                <div className="flex-1 max-w-xs mx-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs">Contrast</span>
                    <span className="text-xs">{contrast}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={contrast}
                    onChange={(e) => setContrast(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
                
                <div className="space-x-2">
                  <button
                    onClick={handleResetImage}
                    className="p-2 rounded-md hover:bg-gray-700"
                    aria-label="Reset image"
                  >
                    <RotateCcw size={20} />
                  </button>
                  
                  <button
                    onClick={handleDownload}
                    className="p-2 rounded-md hover:bg-gray-700"
                    aria-label="Download image"
                  >
                    <Download size={20} />
                  </button>
                  
                  <button
                    onClick={handlePrint}
                    className="p-2 rounded-md hover:bg-gray-700"
                    aria-label="Print image"
                  >
                    <Printer size={20} />
                  </button>
                  
                  <button
                    onClick={() => setShowShareModal(true)}
                    className="p-2 rounded-md hover:bg-gray-700"
                    aria-label="Share image"
                  >
                    <Share size={20} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Information Panel */}
        {showInfo && (
          <div className="md:w-1/4 border-l border-gray-200 p-4 bg-white overflow-y-auto max-h-[calc(100vh-200px)]">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Image Information</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-600">Study Details</h3>
                <div className="mt-1 border-t border-gray-200 pt-2">
                  <div className="flex items-start py-2">
                    <Calendar className="h-5 w-5 text-gray-400 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Date</p>
                      <p className="text-sm text-gray-600">{new Date(currentImage.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start py-2">
                    <FilePlus className="h-5 w-5 text-gray-400 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Type</p>
                      <p className="text-sm text-gray-600">{currentImage.type}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start py-2">
                    <User className="h-5 w-5 text-gray-400 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Ordered By</p>
                      <p className="text-sm text-gray-600">{currentImage.orderedBy}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start py-2">
                    <Clock className="h-5 w-5 text-gray-400 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Status</p>
                      <p className="text-sm text-gray-600 capitalize">{currentImage.status}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-600">Radiologist Notes</h3>
                <div className="mt-1 border-t border-gray-200 pt-2">
                  <div className="flex items-start py-2">
                    <MessageSquare className="h-5 w-5 text-gray-400 mr-2" />
                    <p className="text-sm text-gray-600">{currentImage.radiologistNotes || 'No notes available.'}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-600">Findings</h3>
                <div className="mt-1 border-t border-gray-200 pt-2">
                  <p className="text-sm text-gray-600 py-2">{currentImage.findings || 'No findings recorded.'}</p>
                </div>
              </div>
              
              {currentImage.metadata && (
                <div>
                  <h3 className="text-sm font-medium text-gray-600">Technical Details</h3>
                  <div className="mt-1 border-t border-gray-200 pt-2">
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(currentImage.metadata).map(([key, value]) => (
                        <div key={key} className="py-1">
                          <p className="text-xs text-gray-500 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                          <p className="text-sm text-gray-700">{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              {currentImage.tags && currentImage.tags.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-600">Tags</h3>
                  <div className="mt-1 border-t border-gray-200 pt-2">
                    <div className="flex flex-wrap gap-2 py-2">
                      {currentImage.tags.map((tag, index) => (
                        <span 
                          key={index} 
                          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">Share Medical Image</h2>
              <button 
                onClick={() => setShowShareModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleShare} className="p-4">
              {shareSuccess && (
                <div className="mb-4 bg-green-50 border-l-4 border-green-500 p-4 rounded-md">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-green-700">
                        Image shared successfully!
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {shareError && (
                <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <AlertTriangle className="h-5 w-5 text-red-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-700">{shareError}</p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="mb-4">
                <label htmlFor="recipientEmail" className="block text-sm font-medium text-gray-700 mb-1">
                  Recipient Email
                </label>
                <input
                  type="email"
                  id="recipientEmail"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="doctor@example.com"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="shareMessage" className="block text-sm font-medium text-gray-700 mb-1">
                  Message (Optional)
                </label>
                <textarea
                  id="shareMessage"
                  value={shareMessage}
                  onChange={(e) => setShareMessage(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Add a message to the recipient..."
                  rows="3"
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="shareExpiration" className="block text-sm font-medium text-gray-700 mb-1">
                  Access Expiration
                </label>
                <select
                  id="shareExpiration"
                  value={shareExpiration}
                  onChange={(e) => setShareExpiration(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="1day">1 Day</option>
                  <option value="3days">3 Days</option>
                  <option value="7days">7 Days</option>
                  <option value="30days">30 Days</option>
                </select>
              </div>
              
              <div className="border-t border-gray-200 pt-4 mt-4">
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowShareModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    Cancel
                  </button>
                  
                  <button
                    type="submit"
                    disabled={shareLoading || !recipientEmail}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed"
                  >
                    {shareLoading ? 'Sharing...' : 'Share Image'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicalImagingViewer; 