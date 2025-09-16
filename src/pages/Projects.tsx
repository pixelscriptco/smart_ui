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
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Switch,
  TablePagination,
  InputAdornment,
  FormControlLabel,
  Grid
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Business as BusinessIcon, Upload as UploadIcon, Search as SearchIcon,ContentCopy as ContentCopyIcon } from '@mui/icons-material';
import RoomIcon from '@mui/icons-material/Room';
import axiosInstance from '../utils/axios';
import LexicalEditor from '../components/LexicalEditor';
import {MapPicker} from '../components/MapPicker';
interface User {
  company: string;
  url:string
}
interface Project {
  id: number;
  user_id: number;
  name: string;
  description: string;
  logo: string;
  url: string;
  project_url: string;
  status: number;
  company_id: number;
  User: User;
  created_at: string;
  updated_at: string;
  location?: string;
}

interface Company {
  id: number;
  company: string;
}

interface ProjectFormData {
  name: string;
  description: string;
  project_url: string;
  status: number;
  logo: File | null;
  company_id: number;
  registration_number?: string;
  qr_code?: File | null;
  location?: string;
  location_title?: string;
  location_description?: string;
  location_image?: File | null;
}

const Projects: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<ProjectFormData>({
    name: '',
    description: '',
    project_url: '',
    status: 1,
    logo: null,
    company_id: 0,
    registration_number: '',
    qr_code: null,
    location: '',
    location_title: '',
    location_description: '',
    location_image: null
  });
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [qrCodePreview, setQrCodePreview] = useState<string | null>(null);
  const [locationImagePreview, setLocationImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const editor_theme = {
    paragraph: 'editor-paragraph',
  };

  
  useEffect(() => {
    fetchProjects();
    fetchCompanies();
  }, []);

  useEffect(() => {
    const filtered = projects.filter(project => 
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.User.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (project.location && project.location.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredProjects(filtered);
  }, [projects, searchTerm]);

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

  const fetchCompanies = async () => {
    try {
      const response = await axiosInstance.get('/api/projects/companies');
      setCompanies(response.data.companies);
    } catch (err) {
      console.error('Error fetching companies:', err);
    }
  };

  const handleOpenModal = (project?: Project) => {
    setSubmitError(null);
    if (project) {
      setIsEditing(true);
      setCurrentProjectId(project.id);
      
      setFormData({
        name: project.name,
        description: project.description,
        project_url: project.project_url,
        status: project.status,
        logo: null,
        company_id: project.user_id,
        registration_number: (project as any).registration_number || '',
        qr_code: null,
        location: (project as any).location || '',
        location_title: (project as any).location_title || '',
        location_description: (project as any).location_description || '',
        location_image: null
      });
      setLogoPreview(project.logo || null);
      setQrCodePreview((project as any).qr_code || null);
      setLocationImagePreview((project as any).location_image || null);
    } else {
      setIsEditing(false);
      setCurrentProjectId(null);
      setFormData({
        name: '',
        description: '',
        project_url:'',
        status: 1,
        logo: null,
        company_id: 0,
        registration_number: '',
        qr_code: null,
        location: '',
        location_title: '',
        location_description: '',
        location_image: null
      });
      setLogoPreview(null);
      setQrCodePreview(null);
      setLocationImagePreview(null);
    }
    setOpen(true);
  };

  const handleCloseModal = () => {
    setOpen(false);
    setSubmitError(null);
    setFormData({
      name: '',
      description: '',
      project_url:'',
      status: 1,
      logo: null,
      company_id: 0,
      registration_number: '',
      qr_code: null,
      location: '',
      location_title: '',
      location_description: '',
      location_image: null
    });
    setLogoPreview(null);
    setQrCodePreview(null);
    setLocationImagePreview(null);
    setIsEditing(false);
    setCurrentProjectId(null);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | 
    { target: { name: string; value: number | string } }
  ) => {
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
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleQrCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        qr_code: file
      }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setQrCodePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLocationImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        location_image: file
      }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setLocationImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setLoading(true);
    console.log(coordinates);
    
    const formDataToSend = new FormData();
    formDataToSend.append('name', formData.name);
    formDataToSend.append('description', formData.description);
    formDataToSend.append('project_url', formData.project_url);
    formDataToSend.append('status', formData.status === 1 ? '1' : '0');
    formDataToSend.append('company_id', formData.company_id.toString());
    formDataToSend.append('registration_number', formData.registration_number || '');
    if (coordinates) {
      formDataToSend.append('latitude', JSON.stringify(coordinates.lat));
      formDataToSend.append('longitude', JSON.stringify(coordinates.lng));
    } else {
      formDataToSend.append('latitude', '');
      formDataToSend.append('longitude', '');
    }
    if (formData.logo) {
      formDataToSend.append('logo', formData.logo);
    }
    if (formData.qr_code) {
      formDataToSend.append('qr_code', formData.qr_code);
    }
    if (formData.location) {
      formDataToSend.append('location', formData.location);
    }
    if (formData.location_title) {
      formDataToSend.append('location_title', formData.location_title);
    }
    if (formData.location_description) {
      formDataToSend.append('location_description', formData.location_description);
    }
    if (formData.location_image) {
      formDataToSend.append('location_image', formData.location_image);
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
      fetchProjects();
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

  const handleStatusChange = async (projectId: number, newStatus: 1 | 0) => {
    try {
      // Update the status in the backend
      await axiosInstance.patch(`/api/projects/status/${projectId}`, {
        status: newStatus
      });

      // Update the local state
      setProjects(prevProjects =>
        prevProjects.map(project =>
          project.id === projectId
            ? { ...project, status: newStatus }
            : project
        )
      );
    } catch (err) {
      console.error('Error updating client status:', err);
      // You might want to show an error message to the user here
    }
  };

  const handleProjectClick = (projectId: number) => {
    navigate(`/projects/${projectId}`);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
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

        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            placeholder="Search by project name, company, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              }
            }}
          />
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
                <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Logo</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Company</TableCell>
                {/* <TableCell sx={{ fontWeight: 600 }}>Description</TableCell> */}
                <TableCell sx={{ fontWeight: 600 }}>Url</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Created At</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredProjects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <Typography variant="body1" color="text.secondary">
                      No projects found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredProjects
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((project) => (
                    <TableRow key={project.id}  style={{ cursor: 'pointer'}}>
                      <TableCell onClick={() => navigate(`/projects/${project.id}`)}>{project.name}</TableCell>
                      <TableCell onClick={() => navigate(`/projects/${project.id}`)}>
                        <Avatar
                          src={project.logo}
                          sx={{ width: 40, height: 40 }}
                        />
                      </TableCell>
                      <TableCell onClick={() => navigate(`/projects/${project.id}`)}>{project.User.company}</TableCell>
                      {/* <TableCell onClick={() => navigate(`/projects/${project.id}`)}>{project.description}</TableCell> */}
                      <TableCell onClick={() => navigate(`/projects/${project.id}`)}>{project.url}</TableCell>
                      {/* <TableCell onClick={() => navigate(`/projects/${project.id}`)}>
                        <Chip 
                          label={project.status === 1 ? 'active':'inactive'} 
                          color={project.status === 1 ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell> */}
                      <TableCell>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={project.status === 1}
                              onChange={(e) => handleStatusChange(
                                project.id,
                                e.target.checked ? 1 : 0
                              )}
                              color="success"
                            />
                          }
                          label={project.status === 1 ? 'active':'inactive'}
                          sx={{
                            '& .MuiFormControlLabel-label': {
                              color: project.status === 1 ? 'success.main' : 'error.main',
                              fontWeight: 500
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell onClick={() => navigate(`/projects/${project.id}`)}>{new Date(project.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Tooltip title="Edit">
                          <IconButton 
                            color="primary" 
                            size="small"
                            onClick={() => handleOpenModal(project)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Copy Project URL">
                          <IconButton 
                            color="primary" 
                            size="small"
                            onClick={() => navigator.clipboard.writeText(project.User.url+'/'+project.url)}
                          >
                            <ContentCopyIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {/* <Tooltip title="Delete">
                          <IconButton 
                            color="error" 
                            size="small"
                            onClick={() => handleDelete(project.id)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip> */}
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredProjects.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </TableContainer>

        <Dialog 
          open={open} 
          onClose={handleCloseModal}
          maxWidth="sm" 
          fullWidth
        >
          <DialogTitle>
            {isEditing ? 'Edit Project' : 'Add New Project'}
          </DialogTitle>
          <DialogContent>
            {/* Logo and QR code upload side by side */}
            <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, mb: 3 }}>
              {/* Logo upload */}
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
                    mb: 1,
                    border: `2px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                    '& img': { objectFit: 'cover' }
                  }}
                >
                  {!logoPreview && <BusinessIcon sx={{ fontSize: 40 }} />}
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
                <input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  style={{ display: 'none' }}
                />
                <Typography variant="body2" color="text.secondary" align="center">
                  Logo*
                </Typography>
              </Box>
              {/* QR Code upload */}
              <Box
                component="label"
                htmlFor="qr-code-upload"
                sx={{
                  cursor: 'pointer',
                  position: 'relative',
                  '&:hover .upload-overlay': {
                    opacity: 1
                  }
                }}
              >
                <Avatar
                  src={qrCodePreview || undefined}
                  sx={{
                    width: 100,
                    height: 100,
                    bgcolor: qrCodePreview ? 'transparent' : theme.palette.primary.main,
                    mb: 1,
                    border: `2px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                    '& img': { objectFit: 'cover' }
                  }}
                >
                  {!qrCodePreview && <UploadIcon sx={{ fontSize: 40 }} />}
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
                <input
                  id="qr-code-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleQrCodeChange}
                  style={{ display: 'none' }}
                />
                <Typography variant="body2" color="text.secondary" align="center">
                  QR Code
                </Typography>
              </Box>
            </Box>
            {/* Registration Number */}
            {/* <TextField
              fullWidth
              label="Registration Number"
              name="registration_number"
              value={formData.registration_number}
              onChange={handleInputChange}
              sx={{ mb: 2 }}
            /> */}
            <Box sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 2
            }}>
              {submitError && (
                <Typography variant="body2" color="error">{submitError}</Typography>
              )}

              <FormControl fullWidth>
                <InputLabel>Company</InputLabel>
                <Select
                  name="company_id"
                  value={formData.company_id}
                  onChange={handleInputChange}
                  label="Company*"
                  required
                >
                  {companies.map((company) => (
                    <MenuItem key={company.id} value={company.id}>
                      {company.company}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="Project Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
              <TextField
                fullWidth
                label="VR URL"
                name="project_url"
                value={formData.project_url}
                onChange={handleInputChange}
              />
              <LexicalEditor 
                initialValue={formData.description} 
                onChange={(html) => setFormData(prev => ({ ...prev, description: html }))} 
              />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box component="label" htmlFor="location-image-upload" sx={{ cursor: 'pointer' }}>
                  <Avatar
                    src={locationImagePreview || undefined}
                    sx={{ width: 64, height: 64 }}
                  >
                    {!locationImagePreview && <UploadIcon />}
                  </Avatar>
                  <input
                    id="location-image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleLocationImageChange}
                    style={{ display: 'none' }}
                  />
                  <Typography variant="body2" color="text.secondary" align="center">
                    Image
                  </Typography>
                </Box>
                <TextField
                  fullWidth
                  label="Location Title"
                  name="location_title"
                  value={formData.location_title}
                  onChange={handleInputChange}
                />
              </Box>
              <TextField
                fullWidth
                multiline
                minRows={2}
                label="Location Description"
                name="location_description"
                value={formData.location_description}
                onChange={handleInputChange}
              />
              <MapPicker
                coordinates={coordinates}
                setCoordinates={setCoordinates}
                setFormData={setFormData}
              />

            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseModal}>Cancel</Button>
            <Button 
              onClick={handleSubmit} 
              variant="contained" 
              disabled={loading}
            >
              {isEditing ? 'Save Changes' : 'Create Project'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Fade>
  );
};

export default Projects;
