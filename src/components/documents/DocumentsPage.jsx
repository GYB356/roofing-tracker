// components/documents/DocumentsPage.jsx
import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
  Grid, 
  Typography, 
  Paper, 
  Button,
  TextField,
  InputAdornment,
  MenuItem,
  IconButton,
  Divider,
  Chip,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import DocumentList from './DocumentList';
import DocumentUploadDialog from './DocumentUploadDialog';
import { getAllDocuments } from '../../services/documentService';
import FilterPanel from './FilterPanel';

const DocumentsPage = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openUploadDialog, setOpenUploadDialog] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    projectId: '',
    clientId: '',
    category: '',
    tags: []
  });
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  useEffect(() => {
    fetchDocuments();
  }, [filters, searchQuery]);

  useEffect(() => {
    // Count active filters
    let count = 0;
    if (filters.projectId) count++;
    if (filters.clientId) count++;
    if (filters.category) count++;
    if (filters.tags.length > 0) count++;
    setActiveFiltersCount(count);
  }, [filters]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      
      // Prepare query parameters
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (filters.projectId) params.append('projectId', filters.projectId);
      if (filters.clientId) params.append('clientId', filters.clientId);
      if (filters.category) params.append('category', filters.category);
      if (filters.tags.length > 0) params.append('tags', filters.tags.join(','));
      
      const data = await getAllDocuments(params);
      setDocuments(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching documents:', err);
      setError('Failed to load documents. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenUploadDialog = () => {
    setOpenUploadDialog(true);
  };

  const handleCloseUploadDialog = (newDocument) => {
    setOpenUploadDialog(false);
    if (newDocument) {
      // Refresh documents list after upload
      fetchDocuments();
    }
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const handleToggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const handleFilterChange = (name, value) => {
    setFilters({
      ...filters,
      [name]: value
    });
  };

  const handleResetFilters = () => {
    setFilters({
      projectId: '',
      clientId: '',
      category: '',
      tags: []
    });
  };

  const handleDeleteDocument = async (documentId) => {
    try {
      // Delete logic will be handled in DocumentList component
      // Just refresh the list after successful deletion
      fetchDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" component="h1">
            Document Management
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<AddIcon />}
            onClick={handleOpenUploadDialog}
          >
            Upload Document
          </Button>
        </Box>
        
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search documents..."
              value={searchQuery}
              onChange={handleSearchChange}
              variant="outlined"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: searchQuery && (
                  <InputAdornment position="end">
                    <IconButton onClick={handleClearSearch} edge="end">
                      <ClearIcon />
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                startIcon={<FilterListIcon />}
                onClick={handleToggleFilters}
                endIcon={activeFiltersCount > 0 && (
                  <Chip 
                    label={activeFiltersCount} 
                    size="small" 
                    color="primary"
                  />
                )}
              >
                Filters
              </Button>
            </Box>
          </Grid>
        </Grid>
        
        {showFilters && (
          <FilterPanel 
            filters={filters} 
            onFilterChange={handleFilterChange}
            onResetFilters={handleResetFilters}
          />
        )}
        
        <Divider sx={{ my: 2 }} />
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error" align="center">{error}</Typography>
        ) : (
          <DocumentList 
            documents={documents} 
            onDelete={handleDeleteDocument}
            onUpdate={fetchDocuments}
          />
        )}
      </Paper>
      
      <DocumentUploadDialog 
        open={openUploadDialog} 
        onClose={handleCloseUploadDialog}
        initialProjectId={filters.projectId}
        initialClientId={filters.clientId}
      />
    </Container>
  );
};

export default DocumentsPage;

// components/documents/DocumentList.jsx
import React, { useState } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  IconButton,
  Typography,
  Chip,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  ListItemIcon,
  ListItemText,
  Tooltip
} from '@mui/material';
import {
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  MoreVert as MoreVertIcon,
  Visibility as VisibilityIcon,
  Archive as ArchiveIcon,
  Unarchive as UnarchiveIcon,
  FileCopy as FileCopyIcon,
  Photo as PhotoIcon,
  Description as DescriptionIcon,
  PictureAsPdf as PdfIcon,
  InsertDriveFile as FileIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import DocumentPreviewDialog from './DocumentPreviewDialog';
import DocumentEditDialog from './DocumentEditDialog';
import { deleteDocument, updateDocument } from '../../services/documentService';

// Helper to get appropriate file icon
const getFileIcon = (mimeType) => {
  if (mimeType.startsWith('image/')) {
    return <PhotoIcon />;
  } else if (mimeType === 'application/pdf') {
    return <PdfIcon />;
  } else if (
    mimeType === 'application/msword' ||
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    return <DescriptionIcon />;
  } else {
    return <FileIcon />;
  }
};

// Format file size for display
const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

const DocumentList = ({ documents, onDelete, onUpdate }) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [openPreview, setOpenPreview] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleMenuOpen = (event, document) => {
    setAnchorEl(event.currentTarget);
    setSelectedDocument(document);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleOpenPreview = () => {
    handleMenuClose();
    setOpenPreview(true);
  };

  const handleClosePreview = () => {
    setOpenPreview(false);
  };

  const handleDownload = () => {
    handleMenuClose();
    
    const downloadUrl = `/api/documents/${selectedDocument._id}/download`;
    
    // Create a temporary anchor element and trigger download
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = selectedDocument.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleEdit = () => {
    handleMenuClose();
    setOpenEditDialog(true);
  };

  const handleCloseEdit = (updated) => {
    setOpenEditDialog(false);
    if (updated) {
      onUpdate();
    }
  };

  const handleDeleteClick = () => {
    handleMenuClose();
    setOpenDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteDocument(selectedDocument._id);
      setOpenDeleteDialog(false);
      onDelete(selectedDocument._id);
    } catch (error) {
      console.error('Error deleting document:', error);
    }
  };

  const handleToggleArchive = async () => {
    handleMenuClose();
    
    try {
      await updateDocument(selectedDocument._id, {
        isArchived: !selectedDocument.isArchived
      });
      onUpdate();
    } catch (error) {
      console.error('Error updating document:', error);
    }
  };

  // Get category color
  const getCategoryColor = (category) => {
    const colors = {
      'contract': 'primary',
      'permit': 'secondary',
      'invoice': 'warning',
      'photo': 'info',
      'inspection': 'success',
      'other': 'default'
    };
    return colors[category] || 'default';
  };

  return (
    <>
      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table sx={{ minWidth: 700 }}>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Size</TableCell>
              <TableCell>Uploaded By</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Tags</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {documents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography variant="body1" sx={{ py: 2 }}>
                    No documents found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              documents
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((doc) => (
                  <TableRow key={doc._id} sx={{ 
                    opacity: doc.isArchived ? 0.6 : 1,
                    '&:hover': { 
                      backgroundColor: 'rgba(0, 0, 0, 0.04)' 
                    }
                  }}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {getFileIcon(doc.mimeType)}
                        <Typography sx={{ ml: 1, fontWeight: doc.isArchived ? 'normal' : 'medium' }}>
                          {doc.name}
                        </Typography>
                        {doc.isArchived && (
                          <Chip 
                            label="Archived" 
                            size="small" 
                            variant="outlined" 
                            sx={{ ml: 1 }} 
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={doc.category.charAt(0).toUpperCase() + doc.category.slice(1)} 
                        color={getCategoryColor(doc.category)}
                        size="small"
                        variant="filled"
                      />
                    </TableCell>
                    <TableCell>{formatFileSize(doc.size)}</TableCell>
                    <TableCell>
                      {doc.uploadedBy?.firstName} {doc.uploadedBy?.lastName}
                    </TableCell>
                    <TableCell>
                      {format(new Date(doc.createdAt), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {doc.tags.map((tag, index) => (
                          <Chip 
                            key={index} 
                            label={tag} 
                            size="small" 
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Preview">
                        <IconButton 
                          size="small"
                          onClick={() => {
                            setSelectedDocument(doc);
                            setOpenPreview(true);
                          }}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Download">
                        <IconButton 
                          size="small"
                          onClick={() => {
                            setSelectedDocument(doc);
                            handleDownload();
                          }}
                        >
                          <DownloadIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <IconButton 
                        size="small"
                        onClick={(event) => handleMenuOpen(event, doc)}
                      >
                        <MoreVertIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={documents.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
      
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleOpenPreview}>
          <ListItemIcon>
            <VisibilityIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Preview" />
        </MenuItem>
        <MenuItem onClick={handleDownload}>
          <ListItemIcon>
            <DownloadIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Download" />
        </MenuItem>
        <MenuItem onClick={handleEdit}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Edit Details" />
        </MenuItem>
        <MenuItem onClick={handleToggleArchive}>
          <ListItemIcon>
            {selectedDocument?.isArchived ? (
              <UnarchiveIcon fontSize="small" />
            ) : (
              <ArchiveIcon fontSize="small" />
            )}
          </ListItemIcon>
          <ListItemText 
            primary={selectedDocument?.isArchived ? "Unarchive" : "Archive"} 
          />
        </MenuItem>
        <MenuItem onClick={handleDeleteClick}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText primary="Delete" primaryTypographyProps={{ color: 'error' }} />
        </MenuItem>
      </Menu>
      
      {/* Preview Dialog */}
      {selectedDocument && (
        <DocumentPreviewDialog
          open={openPreview}
          onClose={handleClosePreview}
          document={selectedDocument}
        />
      )}
      
      {/* Edit Dialog */}
      {selectedDocument && (
        <DocumentEditDialog
          open={openEditDialog}
          onClose={handleCloseEdit}
          document={selectedDocument}
        />
      )}
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
      >
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{selectedDocument?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error">Delete</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default DocumentList;

// components/documents/DocumentUploadDialog.jsx
import React, { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Box,
  Typography,
  LinearProgress,
  IconButton,
  Chip,
  Stack,
  Autocomplete
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Close as CloseIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { uploadDocument } from '../../services/documentService';
import { getAllProjects } from '../../services/projectService';
import { getAllClients } from '../../services/clientService';

const DocumentUploadDialog = ({ open, onClose, initialProjectId = '', initialClientId = '' }) => {
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'other',
    projectId: initialProjectId,
    clientId: initialClientId,
    tags: []
  });
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const [tagInput, setTagInput] = useState('');
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  
  const fileInputRef = useRef();

  useEffect(() => {
    // Fetch projects and clients for dropdown menus
    const fetchData = async () => {
      try {
        const [projectsData, clientsData] = await Promise.all([
          getAllProjects(),
          getAllClients()
        ]);
        setProjects(projectsData);
        setClients(clientsData);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    
    if (open) {
      fetchData();
      
      // Reset form when dialog opens
      setFormData({
        name: '',
        description: '',
        category: 'other',
        projectId: initialProjectId,
        clientId: initialClientId,
        tags: []
      });
      setFile(null);
      setFilePreview(null);
      setUploadProgress(0);
      setIsUploading(false);
      setError(null);
    }
  }, [open, initialProjectId, initialClientId]);

  const handleFileSelect = (event) => {
    const selectedFile = event.target.files[0];
    
    if (!selectedFile) return;
    
    setFile(selectedFile);
    setFormData({
      ...formData,
      name: selectedFile.name
    });
    
    // Generate preview for images
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreview(e.target.result);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setFilePreview(null);
    }
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()]
      });
      setTagInput('');
    }
  };

  const handleDeleteTag = (tagToDelete) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToDelete)
    });
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleAddTag();
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      setError('Please select a file to upload');
      return;
    }
    
    try {
      setIsUploading(true);
      setError(null);
      
      const formDataToSend = new FormData();
      formDataToSend.append('file', file);
      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('category', formData.category);
      
      if (formData.projectId) {
        formDataToSend.append('projectId', formData.projectId);
      }
      
      if (formData.clientId) {
        formDataToSend.append('clientId', formData.clientId);
      }
      
      if (formData.tags.length > 0) {
        formDataToSend.append('tags', formData.tags.join(','));
      }
      
      // Track progress
      const onUploadProgress = (progressEvent) => {
        const progress = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        setUploadProgress(progress);
      };
      
      const newDocument = await uploadDocument(formDataToSend, onUploadProgress);
      
      setIsUploading(false);
      onClose(newDocument);
    } catch (err) {
      setIsUploading(false);
      setError(err.response?.data?.message || 'Error uploading document');
      console.error('Upload error:', err);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={() => !isUploading && onClose()} 
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>Upload Document</DialogTitle>
      <IconButton
        aria-label="close"
        onClick={() => !isUploading && onClose()}
        sx={{
          position: 'absolute',
          right: 8,
          top: 8,
          color: (theme) => theme.palette.grey[500],
        }}
        disabled={isUploading}
      >
        <CloseIcon />
      </IconButton>
      
      <DialogContent>
        <Grid container spacing={3}>
          {/* File Upload Area */}
          <Grid item xs={12}>
            <Box
              sx={{
                border: '2px dashed grey',
                borderRadius: 2,
                p: 3,
                textAlign: 'center',
                cursor: 'pointer',
                '&:hover': { borderColor: 'primary.main' },
                mb: 2
              }}
              onClick={() => fileInputRef.current.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileSelect}
                disabled={isUploading}
              />
              
              {filePreview ? (
                <Box sx={{ textAlign: 'center' }}>
                  <img 
                    src={filePreview} 
                    alt="Preview" 
                    style={{ 
                      maxWidth: '100%', 
                      maxHeight: '200px',
                      marginBottom: '16px'
                    }} 
                  />
                  <Typography variant="body1">
                    {file.name} ({Math.round(file.size / 1024)} KB)
                  </Typography>
                </Box>
              ) : file ? (
                <Typography variant="body1">
                  Selected: {file.name} ({Math.round(file.size / 1024)} KB)
                </Typography>
              ) : (
                <>
                  <UploadIcon fontSize="large" color="primary" />
                  <Typography variant="h6" sx={{ mt: 1 }}>
                    Drag & drop a file here or click to select
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Supported file types: PDF, Word, Excel, Images, CSV, etc.
                  </Typography>
                </>
              )}
            </Box>
            
            {isUploading && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" gutterBottom>
                  Uploading: {uploadProgress}%
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={uploadProgress} 
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
            )}
            
            {error && (
              <Typography color="error" variant="body2" sx={{ mt: 1 }}>
                {error}
              </Typography>
            )}
          </Grid>
          
          {/* Document Details Form */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Document Name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              disabled={isUploading}
              required
              margin="normal"
            />
            
            <TextField
              fullWidth
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              disabled={isUploading}
              multiline
              rows={3}
              margin="normal"
            />
            
            <FormControl fullWidth margin="normal">
              <InputLabel>Category</InputLabel>
              <Select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                disabled={isUploading}
                label="Category"
              >
                <MenuItem value="contract">Contract</MenuItem>
                <MenuItem value="permit">Permit</MenuItem>
                <MenuItem value="invoice">Invoice</MenuItem>
                <MenuItem value="photo">Photo</MenuItem>
                <MenuItem value="inspection">Inspection</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Project</InputLabel>
              <Select
                name="projectId"
                value={formData.projectId}
                onChange={handleInputChange}
                disabled={isUploading}
                label="Project"
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {projects.map((project) => (
                  <MenuItem key={project._id} value={project._id}>
                    {project.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl fullWidth margin="normal">
              <InputLabel>Client</InputLabel>
              <Select
                name="clientId"
                value={formData.clientId}
                onChange={handleInputChange}
                disabled={isUploading}
                label="Client"
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {clients.map((client) => (
                  <MenuItem key={client._id} value={client._id}>
                    {client.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" gutterBottom>
                Tags
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TextField
                  size="small"
                  placeholder="Add tag"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isUploading}
                  sx={{ flexGrow: 1 }}
                />
                <IconButton 
                  onClick={handleAddTag} 
                  disabled={!tagInput.trim() || isUploading}
                  color="primary"
                >
                  <AddIcon />
                </IconButton>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {formData.tags.map((tag, index) => (
                  <Chip
                    key={index}
                    label={tag}
                    onDelete={() => handleDeleteTag(tag)}
                    disabled={isUploading}
                  />
                ))}
              </Box>
            </Box>
          </Grid>
        </Grid>
      </DialogContent>
      
      <DialogActions>
        <Button 
          onClick={() => onClose()} 
          disabled={isUploading}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="primary"
          disabled={!file || isUploading}
          startIcon={isUploading ? null : <UploadIcon />}
        >
          {isUploading ? 'Uploading...' : 'Upload'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DocumentUploadDialog;

// components/documents/DocumentPreviewDialog.jsx
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  CircularProgress,
  Divider,
  Chip,
  Paper
} from '@mui/material';
import {
  Close as CloseIcon,
  Download as DownloadIcon,
  FileCopy as FileIcon,
  Description as DocumentIcon,
  PictureAsPdf as PdfIcon,
  Photo as ImageIcon
} from '@mui/icons-material';
import { format } from 'date-fns';

const DocumentPreviewDialog = ({ open, onClose, document }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (open && document) {
      setLoading(false);
    }
  }, [open, document]);
  
  if (!document) return null;
  
  const handleDownload = () => {
    const downloadUrl = `/api/documents/${document._id}/download`;
    
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = document.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
  
  const getFileIcon = () => {
    if (document.mimeType.startsWith('image/')) {
      return <ImageIcon fontSize="large" />;
    } else if (document.mimeType === 'application/pdf') {
      return <PdfIcon fontSize="large" />;
    } else if (
      document.mimeType === 'application/msword' ||
      document.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      return <DocumentIcon fontSize="large" />;
    } else {
      return <FileIcon fontSize="large" />;
    }
  };
  
  const renderPreview = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      );
    }
    
    if (error) {
      return (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="error">{error}</Typography>
        </Box>
      );
    }
    
    // Image preview
    if (document.mimeType.startsWith('image/')) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
          <img
            src={document.path}
            alt={document.name}
            style={{
              maxWidth: '100%',
              maxHeight: '70vh',
              objectFit: 'contain'
            }}
          />
        </Box>
      );
    }
    
    // PDF preview
    if (document.mimeType === 'application/pdf') {
      return (
        <Box sx={{ height: '70vh', width: '100%' }}>
          <iframe
            src={`${document.path}#view=FitH`}
            title={document.name}
            width="100%"
            height="100%"
            style={{ border: 'none' }}
          />
        </Box>
      );
    }
    
    // For other file types - show metadata
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        {getFileIcon()}
        <Typography variant="h6" sx={{ mt: 2 }}>
          Preview not available for this file type
        </Typography>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={handleDownload}
          sx={{ mt: 2 }}
        >
          Download to View
        </Button>
      </Box>
    );
  };
  
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {getFileIcon()}
          <Typography variant="h6" sx={{ ml: 1 }}>
            {document.name}
          </Typography>
        </Box>
        <IconButton onClick={onClose} edge="end">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <Divider />
      
      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' } }}>
          {/* Preview Area */}
          <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
            {renderPreview()}
          </Box>
          
          {/* Metadata Sidebar */}
          <Paper
            elevation={0}
            sx={{
              width: { xs: '100%', md: '300px' },
              p: 2,
              borderLeft: '1px solid',
              borderColor: 'divider',
              backgroundColor: 'background.default'
            }}
          >
            <Typography variant="subtitle1" gutterBottom>
              Document Information
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="textSecondary">
                Added on
              </Typography>
              <Typography variant="body1">
                {format(new Date(document.createdAt), 'MMMM d, yyyy')}
              </Typography>
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="textSecondary">
                Uploaded by
              </Typography>
              <Typography variant="body1">
                {document.uploadedBy?.firstName} {document.uploadedBy?.lastName}
              </Typography>
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="textSecondary">
                Category
              </Typography>
              <Chip 
                label={document.category.charAt(0).toUpperCase() + document.category.slice(1)} 
                size="small"
                color="primary"
                sx={{ mt: 0.5 }}
              />
            </Box>
            
            {document.description && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  Description
                </Typography>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {document.description}
                </Typography>
              </Box>
            )}
            
            {document.tags && document.tags.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Tags
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {document.tags.map((tag, index) => (
                    <Chip key={index} label={tag} size="small" variant="outlined" />
                  ))}
                </Box>
              </Box>
            )}
            
            {document.projectId && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  Project
                </Typography>
                <Typography variant="body1">
                  {document.projectId.name || 'Project Details Not Available'}
                </Typography>
              </Box>
            )}
            
            {document.clientId && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  Client
                </Typography>
                <Typography variant="body1">
                  {document.clientId.name || 'Client Details Not Available'}
                </Typography>
              </Box>
            )}
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="textSecondary">
                File Details
              </Typography>
              <Typography variant="body1">
                Type: {document.fileType.toUpperCase()}
              </Typography>
              <Typography variant="body1">
                Size: {(document.size / 1024).toFixed(1)} KB
              </Typography>
            </Box>
            
            <Button
              fullWidth
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={handleDownload}
              sx={{ mt: 2 }}
            >
              Download
            </Button>
          </Paper>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentPreviewDialog;

// components/documents/DocumentEditDialog.jsx
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Box,
  IconButton,
  Typography,
  Grid
} from '@mui/material';
import {
  Close as CloseIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { updateDocument } from '../../services/documentService';
import { getAllProjects } from '../../services/projectService';
import { getAllClients } from '../../services/clientService';

const DocumentEditDialog = ({ open, onClose, document }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'other',
    projectId: '',
    clientId: '',
    tags: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [tagInput, setTagInput] = useState('');
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  
  useEffect(() => {
    // Fetch projects and clients
    const fetchData = async () => {
      try {
        const [projectsData, clientsData] = await Promise.all([
          getAllProjects(),
          getAllClients()
        ]);
        setProjects(projectsData);
        setClients(clientsData);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    
    if (open) {
      fetchData();
    }
  }, [open]);
  
  useEffect(() => {
    if (document) {
      setFormData({
        name: document.name || '',
        description: document.description || '',
        category: document.category || 'other',
        projectId: document.projectId?._id || document.projectId || '',
        clientId: document.clientId?._id || document.clientId || '',
        tags: document.tags || []
      });
    }
  }, [document]);
  
  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()]
      });
      setTagInput('');
    }
  };
  
  const handleDeleteTag = (tagToDelete) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToDelete)
    });
  };
  
  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleAddTag();
    }
  };
  
  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      await updateDocument(document._id, formData);
      
      setIsSubmitting(false);
      onClose(true); // true indicates successful update
    } catch (err) {
      setIsSubmitting(false);
      setError(err.response?.data?.message || 'Error updating document');
      console.error('Update error:', err);
    }
  };
  
  return (
    <Dialog 
      open={open} 
      onClose={() => !isSubmitting && onClose()} 
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Edit Document</DialogTitle>
      <IconButton
        aria-label="close"
        onClick={() => !isSubmitting && onClose()}
        sx={{
          position: 'absolute',
          right: 8,
          top: 8,
          color: (theme) => theme.palette.grey[500],
        }}
        disabled={isSubmitting}
      >
        <CloseIcon />
      </IconButton>
      
      <DialogContent>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Document Name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              disabled={isSubmitting}
              required
              margin="normal"
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              disabled={isSubmitting}
              multiline
              rows={3}
              margin="normal"
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Category</InputLabel>
              <Select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                disabled={isSubmitting}
                label="Category"
              >
                <MenuItem value="contract">Contract</MenuItem>
                <MenuItem value="permit">Permit</MenuItem>
                <MenuItem value="invoice">Invoice</MenuItem>
                <MenuItem value="photo">Photo</MenuItem>
                <MenuItem value="inspection">Inspection</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Project</InputLabel>
              <Select
                name="projectId"
                value={formData.projectId}
                onChange={handleInputChange}
                disabled={isSubmitting}
                label="Project"
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {projects.map((project) => (
                  <MenuItem key={project._id} value={project._id}>
                    {project.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Client</InputLabel>
              <Select
                name="clientId"
                value={formData.clientId}
                onChange={handleInputChange}
                disabled={isSubmitting}
                label="Client"
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {clients.map((client) => (
                  <MenuItem key={client._id} value={client._id}>
                    {client.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12}>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" gutterBottom>
                Tags
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TextField
                  size="small"
                  placeholder="Add tag"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isSubmitting}
                  sx={{ flexGrow: 1 }}
                />
                <IconButton 
                  onClick={handleAddTag} 
                  disabled={!tagInput.trim() || isSubmitting}
                  color="primary"
                >
                  <AddIcon />
                </IconButton>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {formData.tags.map((tag, index) => (
                  <Chip
                    key={index}
                    label={tag}
                    onDelete={() => handleDeleteTag(tag)}
                    disabled={isSubmitting}
                  />
                ))}
              </Box>
            </Box>
          </Grid>
        </Grid>
        
        {error && (
          <Typography color="error" variant="body2" sx={{ mt: 2 }}>
            {error}
          </Typography>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button 
          onClick={() => onClose()} 
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="primary"
          disabled={!formData.name || isSubmitting}
        >
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DocumentEditDialog;

// services/documentService.js
import axios from 'axios';

const API_URL = '/api/documents';

export const getAllDocuments = async (params) => {
  const response = await axios.get(API_URL, { params });
  return response.data;
};

export const getDocumentById = async (id) => {
  const response = await axios.get(`${API_URL}/${id}`);
  return response.data;
};

export const getDocumentsByProject = async (projectId) => {
  const response = await axios.get(`${API_URL}/project/${projectId}`);
  return response.data;
};

export const getDocumentsByClient = async (clientId) => {
  const response = await axios.get(`${API_URL}/client/${clientId}`);
  return response.data;
};

export const uploadDocument = async (formData, onUploadProgress) => {
  const response = await axios.post(API_URL, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    onUploadProgress
  });
  return response.data;
};

export const updateDocument = async (id, data) => {
  const response = await axios.put(`${API_URL}/${id}`, data);
  return response.data;
};

export const deleteDocument = async (id) => {
  const response = await axios.delete(`${API_URL}/${id}`);
  return response.data;
};

export const downloadDocument = async (id) => {
  return axios.get(`${API_URL}/${id}/download`, {
    responseType: 'blob'
  });
};