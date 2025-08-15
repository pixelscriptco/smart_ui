import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Button,
  CircularProgress,
  Chip,
  Card,
  CardContent,
  CardActionArea
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import BusinessIcon from '@mui/icons-material/Business';
import ApartmentIcon from '@mui/icons-material/Apartment';
import LayersIcon from '@mui/icons-material/Layers';
import HomeIcon from '@mui/icons-material/Home';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import DeleteIcon from '@mui/icons-material/Delete';
import SpaIcon from '@mui/icons-material/Spa';
import axiosInstance from '../utils/axios';

interface Project {
  id: number;
  name: string;
  description: string;
  status: number;
  image_url: string;
  logo: string;
}

interface Tower {
  id: number;
  name: string;
  description: string;
  total_floors: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

interface ConstructionUpdate {
  id: number;
  image_url: string;
  name: string;
  updated_at: string;
  status: 'completed' | 'in-progress' | 'planned';
}

const ProjectDetails: React.FC = () => {
  const { project_id } = useParams<{ project_id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [towers, setTowers] = useState<Tower[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [constructionUpdates, setConstructionUpdates] = useState<ConstructionUpdate[]>([]);
  const [openUploadDialog, setOpenUploadDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [updateDescription, setUpdateDescription] = useState('');
  const [updateName, setUpdateName] = useState('');
  const [updateStatus, setUpdateStatus] = useState<'completed' | 'in-progress' | 'planned'>('in-progress');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetchProjectDetails = async () => {
      try {
        const [projectResponse, updatesResponse] = await Promise.all([
          axiosInstance.get(`/api/projects/${project_id}`),
          axiosInstance.get(`/api/projects/${project_id}/updates`)
        ]);
        setProject(projectResponse.data.project);
        setConstructionUpdates(updatesResponse.data.updates);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch project details');
      } finally {
        setLoading(false);
      }
    };

    fetchProjectDetails();
  }, [project_id]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('image', selectedFile);
      formData.append('name', updateName);
      formData.append('status', updateStatus);

      const response = await axiosInstance.post(
        `/api/projects/${project_id}/updates`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      setConstructionUpdates(prev => [...prev, response.data]);
      setOpenUploadDialog(false);
      setSelectedFile(null);
      setUpdateDescription('');
      setUpdateStatus('in-progress');
    } catch (err) {
      console.error('Error uploading construction update:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteUpdate = async (updateId: number) => {
    try {
      await axiosInstance.delete(`/api/projects/${project_id}/updates/${updateId}`);
      setConstructionUpdates(prev => prev.filter(update => update.id !== updateId));
    } catch (err) {
      console.error('Error deleting update:', err);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !project) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography color="error">{error || 'Project not found'}</Typography>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/projects')}
          sx={{ mt: 2 }}
        >
          Back to Projects
        </Button>
      </Container>
    );
  }

  const handleNavigation = (path: string) => {
    navigate(`/projects/${project_id}/${path}`);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
        <Box sx={{ flex: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/projects')}
            >
            </Button>
            <Typography variant="h5">
              {project.name}
            </Typography>
            <Chip
              label={project.status === 1 ? 'Active' : 'Inactive'}
              color={project.status === 1 ? 'success' : 'error'}
            />
          </Box>
          <Box sx={{ flex: 1, ml: 9, color: 'text.secondary', mb:5 }}>
            {/* <Typography variant="body1">
              {project.description}
            </Typography> */}
          </Box>
        </Box>
      </Box>

      <Box sx={{ 
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, 1fr)',
          md: 'repeat(4, 1fr)'
        },
        gap: 3
      }}>
        <Box>
          <Card 
            sx={{ 
              height: '100%',
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 3
              }
            }}
          >
            <CardActionArea onClick={() => handleNavigation('buildings')}>
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <BusinessIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Project
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Manage project
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        </Box>
        <Box>
          <Card 
            sx={{ 
              height: '100%',
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 3
              }
            }}
          >
            <CardActionArea onClick={() => handleNavigation('towers')}>
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <ApartmentIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Towers
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Manage project towers
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        </Box>
        <Box>
          <Card 
            sx={{ 
              height: '100%',
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 3
              }
            }}
          >
            <CardActionArea onClick={() => handleNavigation('floors')}>
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <LayersIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Floors
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Manage building floors
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        </Box>
        <Box>
          <Card 
            sx={{ 
              height: '100%',
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 3
              }
            }}
          >
            <CardActionArea onClick={() => handleNavigation('units')}>
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <HomeIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Units
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Manage floor units
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        </Box>
      </Box>

      {/* Amenities Section */}
      <Box sx={{ mt: 6, mb: 2 }}>
        <Typography variant="h5" color="Black">
          Project Amenities
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Card sx={{ width: 320, transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)', boxShadow: 3 } }}>
          <CardActionArea onClick={() => handleNavigation('amenities')}>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <SpaIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Amenities
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Manage project amenities
              </Typography>
            </CardContent>
          </CardActionArea>
        </Card>
      </Box>
    </Container>
  );
};

export default ProjectDetails; 