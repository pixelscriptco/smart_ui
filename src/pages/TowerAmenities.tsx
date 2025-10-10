import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Alert,
  CircularProgress,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Card,
  CardContent,
  CardMedia,
  CardActions
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../utils/axios';

interface Amenity {
  id: number;
  name: string;
  image: string;
  vr_url: string;
  tower_id: number;
}

const TowerAmenities = () => {
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [openModal, setOpenModal] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [amenityToDelete, setAmenityToDelete] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newAmenity, setNewAmenity] = useState({
    id: null as number | null,
    name: '',
    vr_url: '',
    image: null as File | null
  });
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();
  const { project_id, tower_id } = useParams();

  useEffect(() => {
    fetchAmenities();
  }, [tower_id]);

  const fetchAmenities = async () => {
    try {
      const response = await axiosInstance.get(`/api/projects/${project_id}/amenities`);
      setAmenities(response.data.amenities);
    } catch (err) {
      console.error('Error fetching amenities:', err);
      setError('Failed to load amenities');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setNewAmenity(prev => ({ ...prev, image: file }));
    }
  };

  const handleAddClick = () => {
    setIsEditing(false);
    setNewAmenity({
      id: null,
      name: '',
      vr_url: '',
      image: null
    });
    setOpenModal(true);
  };

  const handleEditAmenity = (amenity: Amenity) => {
    setIsEditing(true);
    setNewAmenity({
      id: amenity.id,
      name: amenity.name,
      vr_url: amenity.vr_url,
      image: null
    });
    setOpenModal(true);
  };

  const handleAddAmenity = async () => {
    if (!newAmenity.name.trim()) {
      setError('Amenity name is required');
      return;
    }
    // if (!newAmenity.vr_url.trim()) {
    //   setError('VR URL is required');
    //   return;
    // }
    if (!isEditing && !newAmenity.image) {
      setError('Image is required');
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append('name', newAmenity.name);
      formData.append('vr_url', newAmenity.vr_url);
      if (newAmenity.image) {
        formData.append('image', newAmenity.image);
      }

      if (isEditing && newAmenity.id) {
        await axiosInstance.put(`/api/projects/${project_id}/amenities/${newAmenity.id}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        setSuccess('Amenity updated successfully');
      } else {
        await axiosInstance.post(`/api/projects/${project_id}/amenities`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        setSuccess('Amenity added successfully');
      }

      setNewAmenity({
        id: null,
        name: '',
        vr_url: '',
        image: null
      });
      setOpenModal(false);
      setIsEditing(false);
      fetchAmenities();
    } catch (err) {
      console.error('Error saving amenity:', err);
      setError(isEditing ? 'Failed to update amenity' : 'Failed to add amenity');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteClick = (amenityId: number) => {
    setAmenityToDelete(amenityId);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!amenityToDelete) return;

    try {
      await axiosInstance.delete(`/api/towers/amenities/${amenityToDelete}`);
      setSuccess('Amenity deleted successfully');
      fetchAmenities();
    } catch (err) {
      console.error('Error deleting amenity:', err);
      setError('Failed to delete amenity');
    } finally {
      setDeleteModalOpen(false);
      setAmenityToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModalOpen(false);
    setAmenityToDelete(null);
  };

  const handleViewImage = (imageUrl: string) => {
    window.open(imageUrl, '_blank');
  };

  const handleViewVR = (vrUrl: string) => {
    window.open(vrUrl, '_blank');
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, justifyContent: 'space-between'}}>
        <Typography variant="h4">
          Amenities
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddClick}
          >
            Add Amenity
          </Button>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(`/projects/${project_id}`)}
          >
            Back to Project
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Box sx={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: 3,
        '& > *': {
          flex: '1 1 300px',
          maxWidth: 'calc(33.333% - 16px)',
          minWidth: '300px'
        }
      }}>
        {amenities.length === 0 ? (
          <Typography variant="body1" color="text.secondary" align="center" sx={{ width: '100%', py: 6 }}>
            No Amenities are listed
          </Typography>
        ) : (
          amenities.map((amenity) => (
            <Card 
              key={amenity.id}
              sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                '&:hover': {
                  boxShadow: 6
                }
              }}
            >
              {amenity.image? (
                <CardMedia
                  component="img"
                  height="200"
                  image={amenity.image}
                  alt={amenity.name}
                  sx={{ cursor: 'pointer' }}
                  src={amenity.image}
                  // onClick={() => handleViewImage(amenity.image_url)}
                />
              ) : (
                <Box
                  sx={{
                    height: 200,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'grey.100'
                  }}
                >
                  <ViewIcon sx={{ fontSize: 60, color: 'grey.400' }} />
                </Box>
              )}
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h6" gutterBottom>
                  {amenity.name}
                </Typography>
              </CardContent>
              <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                {amenity.vr_url && (
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => handleViewVR(amenity.vr_url)}
                  >
                    View VR Tour
                  </Button>
                )}
                <Box display="flex" gap={0}>
                  <Tooltip title="Edit Amenity">
                    <IconButton 
                      color="primary" 
                      onClick={() => handleEditAmenity(amenity)}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete Amenity">
                    <IconButton
                      color="error"
                      onClick={() => handleDeleteClick(amenity.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </CardActions>
            </Card>
          ))
        )}
      </Box>

      {/* Add/Edit Amenity Modal */}
      <Dialog 
        open={openModal} 
        onClose={() => {
          setOpenModal(false);
          setIsEditing(false);
          setNewAmenity({
            id: null,
            name: '',
            vr_url: '',
            image: null
          });
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {isEditing ? 'Edit Amenity' : 'Add New Amenity'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              label="Amenity Name"
              value={newAmenity.name}
              onChange={(e) => setNewAmenity(prev => ({ ...prev, name: e.target.value }))}
              required
              fullWidth
              error={Boolean(error) && !newAmenity.name.trim()}
              helperText={Boolean(error) && !newAmenity.name.trim() ? 'Name is required' : ''}
            />
            <TextField
              label="VR URL"
              value={newAmenity.vr_url}
              onChange={(e) => setNewAmenity(prev => ({ ...prev, vr_url: e.target.value }))}
              required
              fullWidth
              error={Boolean(error) && !newAmenity.vr_url.trim()}
              helperText={Boolean(error) && !newAmenity.vr_url.trim() ? 'VR URL is required' : ''}
              placeholder="https://example.com/vr-tour"
            />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <input
                type="file"
                onChange={handleImageUpload}
                accept="image/*"
                style={{ display: 'none' }}
                id="amenity-image-upload"
              />
              <label htmlFor="amenity-image-upload">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<CloudUploadIcon />}
                  color={'primary'}
                >
                  {isEditing ? 'Change Image' : 'Upload Image'}
                </Button>
              </label>
              {newAmenity.image && (
                <Typography variant="body2" color="text.secondary">
                  {newAmenity.image.name}
                </Typography>
              )}
              {/* {!isEditing && !newAmenity.image && (
                <Typography variant="body2" color="error">
                  Image is required
                </Typography>
              )} */}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setOpenModal(false);
            setIsEditing(false);
            setNewAmenity({
              id: null,
              name: '',
              vr_url: '',
              image: null
            });
            setError(null);
          }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleAddAmenity}
            disabled={uploading || !newAmenity.name.trim() || (!newAmenity.vr_url.trim() && (!isEditing ? !newAmenity.image : false))}
            startIcon={uploading ? <CircularProgress size={20} /> : null}
          >
            {uploading ? (isEditing ? 'Updating...' : 'Adding...') : (isEditing ? 'Update' : 'Add')} Amenity
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog
        open={deleteModalOpen}
        onClose={handleDeleteCancel}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon color="warning" />
          Confirm Delete
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this amenity? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      
    </Box>
  );
};

export default TowerAmenities;