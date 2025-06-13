import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  useTheme,
  alpha,
  Fade,
  Tooltip,
  Avatar,
  CircularProgress,
  Alert
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Business as BusinessIcon, Upload as UploadIcon } from '@mui/icons-material';
import axiosInstance from '../utils/axios';

interface Project {
  id: number;
  name: string;
  description: string;
  status: number;
  logo?: string;
  created_at: string;
  updated_at: string;
}

interface FormData {
  name: string;
  description: string;
  status: string;
  logo: File | null;
}

const Projects: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    status: 'active',
    logo: null
  });
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<number | null>(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get('/api/projects');
      setProjects(response.data.data);
    } catch (err: any) {
      console.error('Error fetching projects:', err);
      setError('Failed to fetch projects. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (project?: Project) => {
    setSubmitError(null); // Clear previous submit errors
    if (project) {
      setIsEditing(true);
      setCurrentProjectId(project.id);
      setFormData({
        name: project.name,
        description: project.description,
        status: project.status === 1 ? 'active' : 'inactive', // Convert status number to string
        logo: null // Cannot pre-fill file input for security reasons
      });
      setLogoPreview(project.logo || null); // Pre-fill logo preview if exists
    } else {
      setIsEditing(false);
      setCurrentProjectId(null);
      setFormData({
        name: '',
        description: '',
        status: 'active',
        logo: null
      });
      setLogoPreview(null);
    }
    setOpen(true);
  };

  const handleCloseModal = () => {
    setOpen(false);
    setSubmitError(null); // Clear submit errors on close
    // Reset form data and editing state when modal closes
    setFormData({
      name: '',
      description: '',
      status: 'active',
      logo: null
    });
    setLogoPreview(null);
    setIsEditing(false);
    setCurrentProjectId(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        logo: file
      }));
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null); // Clear error before new submission
    setLoading(true);

    const formDataToSend = new FormData();
    formDataToSend.append('name', formData.name);
    formDataToSend.append('description', formData.description);
    // Convert status string back to number for backend if needed, assuming 1 for active
    formDataToSend.append('status', formData.status === 'active' ? '1' : '0'); 
    if (formData.logo) {
      formDataToSend.append('logo', formData.logo);
    }

    try {
      if (isEditing && currentProjectId) {
        await axiosInstance.put(`/api/projects/${currentProjectId}`, formDataToSend, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      } else {
        await axiosInstance.post('/api/projects', formDataToSend, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      }
      handleCloseModal();
      fetchProjects(); // Refresh the list
    } catch (err: any) {
      console.error('Error submitting project:', err);
      setSubmitError(err.response?.data?.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      setLoading(true);
      setError(null);
      try {
        await axiosInstance.delete(`/api/projects/${id}`);
        fetchProjects(); // Refresh the list
      } catch (err: any) {
        console.error('Error deleting project:', err);
        setError('Failed to delete project. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleProjectClick = (projectId: number) => {
    navigate(`/projects/${projectId}`);
  };

  return (
    <Fade in timeout={500}>
      <Box sx={{ 
        p: { xs: 2, md: 4 },
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 4,
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2
        }}>
          <Typography 
            variant="h4" 
            component="h1"
            sx={{ 
              fontWeight: 500,
              color: theme.palette.text.primary,
              letterSpacing: '-0.5px'
            }}
          >
            Projects
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => handleOpenModal()}
            sx={{
              px: 3,
              py: 1,
              borderRadius: 2,
              textTransform: 'none',
              boxShadow: 'none',
              '&:hover': {
                boxShadow: 'none',
                backgroundColor: alpha(theme.palette.primary.main, 0.9)
              }
            }}
          >
            Create Project
          </Button>
        </Box>

        {loading && <CircularProgress sx={{ mt: 4 }} />}
        {error && <Alert severity="error" sx={{ mt: 4 }}>{error}</Alert>}

        <TableContainer 
          component={Paper} 
          elevation={0}
          sx={{ 
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            overflow: 'hidden'
          }}
        >
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ 
                  fontWeight: 600,
                  backgroundColor: alpha(theme.palette.primary.main, 0.05) 
                }}>Name</TableCell>
                <TableCell sx={{ 
                  fontWeight: 600,
                  backgroundColor: alpha(theme.palette.primary.main, 0.05) 
                }}>Logo</TableCell>
                <TableCell sx={{ 
                  fontWeight: 600,
                  backgroundColor: alpha(theme.palette.primary.main, 0.05) 
                }}>Description</TableCell>
                <TableCell sx={{ 
                  fontWeight: 600,
                  backgroundColor: alpha(theme.palette.primary.main, 0.05) 
                }}>Status</TableCell>
                <TableCell sx={{ 
                  fontWeight: 600,
                  backgroundColor: alpha(theme.palette.primary.main, 0.05) 
                }}>Created At</TableCell>
                <TableCell sx={{ 
                  fontWeight: 600,
                  backgroundColor: alpha(theme.palette.primary.main, 0.05) 
                }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {projects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <Typography 
                      variant="body1" 
                      color="text.secondary"
                      sx={{ 
                        fontSize: '1.1rem',
                        opacity: 0.7
                      }}
                    >
                      No projects currently. Click the "Create Project" button to add one.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                projects.map((project) => (
                  <TableRow 
                    key={project.id}
                    sx={{
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.02)
                      },
                      transition: 'background-color 0.2s'
                    }}
                  >
                    <TableCell 
                      onClick={() => handleProjectClick(project.id)}
                      sx={{ 
                        cursor: 'pointer',
                        '&:hover': {
                          color: 'primary.main',
                        },
                      }}
                    >
                      {project.name}
                    </TableCell>
                    <TableCell>
                      <Avatar
                        src={project.logo}
                        sx={{ width: 40, height: 40 }}
                      />
                    </TableCell>
                    <TableCell>{project.description}</TableCell>
                    <TableCell>
                      <Box
                        sx={{
                          display: 'inline-block',
                          px: 1.5,
                          py: 0.5,
                          borderRadius: 1,
                          backgroundColor: project.status === 1 
                            ? alpha(theme.palette.success.main, 0.1)
                            : alpha(theme.palette.error.main, 0.1),
                          color: project.status === 1
                            ? theme.palette.success.main
                            : theme.palette.error.main,
                          fontSize: '0.875rem'
                        }}
                      >
                        {project.status === 1 ? 'Active' : 'Inactive'}
                      </Box>
                    </TableCell>
                    <TableCell>{new Date(project.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Tooltip title="Edit">
                        <IconButton 
                          color="primary" 
                          size="small"
                          onClick={() => handleOpenModal(project)} // Call handleOpenModal with project data
                          sx={{ 
                            '&:hover': {
                              backgroundColor: alpha(theme.palette.primary.main, 0.1)
                            }
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton 
                          color="error" 
                          size="small"
                          onClick={() => handleDelete(project.id)}
                          sx={{ 
                            '&:hover': {
                              backgroundColor: alpha(theme.palette.error.main, 0.1)
                            }
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Dialog 
          open={open} 
          onClose={handleCloseModal} // Use the new close handler
          maxWidth="sm" 
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 2,
              boxShadow: theme.shadows[3]
            }
          }}
        >
          <DialogTitle id="project-modal-title" sx={{ pb: 1 }}>
            {isEditing ? 'Edit Project' : 'Add New Project'} {/* Dynamic title */}
          </DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
               <Box
                component="label"
                htmlFor="logo-upload"
                sx={{
                  cursor: 'pointer',
                  position: 'relative',
                  '&:hover .upload-overlay': {
                    opacity: 1
                  }
                }}
              >
                <Avatar
                  src={logoPreview || undefined}
                  sx={{
                    width: 100,
                    height: 100,
                    bgcolor: logoPreview ? 'transparent' : theme.palette.primary.main,
                    mb: 2,
                    border: `2px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                     // Optional: add a fallback icon if no logo and not previewing
                    '& img': { objectFit: 'cover' } // Ensure image covers the avatar area
                  }}
                >
                   {!logoPreview && <BusinessIcon sx={{ fontSize: 40 }} />} {/* Fallback icon */}
                </Avatar>
                <Box
                  className="upload-overlay"
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: alpha(theme.palette.primary.main, 0.7),
                    borderRadius: '50%',
                    opacity: 0,
                    transition: 'opacity 0.2s'
                  }}
                >
                  <UploadIcon sx={{ color: 'white', fontSize: 30 }} />
                </Box>
              </Box>
              <input
                id="logo-upload"
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                style={{ display: 'none' }}
              />
              <Typography 
                variant="body2" 
                color="text.secondary"
              >
                Click to upload project logo
              </Typography>
            </Box>
             <Box sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'left',
              width: '100%', // Ensure Box takes full width for text fields
              pl: 0 // Remove padding if not needed here
            }}>
              {submitError && (
                <Typography variant="body2" color="error" sx={{ mb: 2 }}>{submitError}</Typography>
              )}

               <TextField
                fullWidth
                label="Project Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                sx={{ 
                  mb: 3,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5
                  }
                }}
              />
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                multiline
                rows={4}
                sx={{ 
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5
                  }
                }}
              />
            </Box>

          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button 
              onClick={handleCloseModal} // Use the new close handler
              sx={{ 
                textTransform: 'none',
                px: 2
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              variant="contained" 
              color="primary"
              disabled={loading}
              sx={{ 
                textTransform: 'none',
                px: 3,
                borderRadius: 1.5
              }}
            >
              {isEditing ? 'Save Changes' : 'Create Project'} {/* Dynamic button text */}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Fade>
  );
};

export default Projects;
