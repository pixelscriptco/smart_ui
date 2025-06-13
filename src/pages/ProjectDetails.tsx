import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Paper,
  Box,
  Button,
  CircularProgress,
  Chip,
  Grid,
  Card,
  CardContent,
  CardActionArea
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import BusinessIcon from '@mui/icons-material/Business';
import ApartmentIcon from '@mui/icons-material/Apartment';
import LayersIcon from '@mui/icons-material/Layers';
import HomeIcon from '@mui/icons-material/Home';
import axios from 'axios';
import { API_URL } from '../config';
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

const ProjectDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [towers, setTowers] = useState<Tower[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjectDetails = async () => {
      try {
        const [projectResponse] = await Promise.all([
          axiosInstance.get(`/api/projects/${id}`),
        //   axios.get(`${API_URL}/api/projects/${id}/towers`)
        ]);
        setProject(projectResponse.data.project);
        
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch project details');
      } finally {
        setLoading(false);
      }
    };

    fetchProjectDetails();
  }, [id]);

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
    navigate(`/projects/${id}/${path}`);
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
          <Box sx={{ flex: 1, ml: 9, color: 'text.secondary' }}>
            <Typography variant="body1">
              {project.description}
            </Typography>
          </Box>
        </Box>
      </Box>

      <Box sx={{ mt: 4 }}>
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
                    Buildings
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Manage project buildings
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
      </Box>
    </Container>
  );
};

export default ProjectDetails; 