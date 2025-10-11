import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, Card, CardContent, CardMedia, CardActions } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../utils/axios';
import { Apartment as ApartmentIcon } from '@mui/icons-material';

interface Tower {
  id: number;
  name: string;
  image_url?: string;
  building_id: number;
}

const Towers = () => {
  const [towers, setTowers] = useState<Tower[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const [projectName, setProjectName] = useState('');
  const { project_id, building_id } = useParams();

  useEffect(() => {
    const fetchTowers = async () => {
      try {
        const response = await axiosInstance.get(`/api/projects/${project_id}/towers`);
        setTowers(response.data.towers);
        setProjectName(response.data.project);
      } catch (err) {
        console.error('Error fetching towers:', err);
        setError('Failed to load towers');
      } finally {
        setLoading(false);
      }
    };

    fetchTowers();
  }, [project_id]);

  const handleTowerDetails = (towerId: number) => {
    navigate(`/projects/${project_id}/towers/${towerId}`);
  };

  const handleTowerAmenities = (towerId: number) => {
    navigate(`/projects/${project_id}/towers/${towerId}/amenities`);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 60 }}>
        <Typography variant="h4">
          Towers ({projectName})
        </Typography>
        <Button
          variant="contained"
          onClick={() => navigate(`/projects/${project_id}`)}
        >
          Back to Project
        </Button>
      </Box>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        {towers.map((tower) => (
          <Box key={tower.id} sx={{ flex: '1 1 300px', maxWidth: 350, minWidth: 250 }}>
            <Card 
              sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                '&:hover': {
                  boxShadow: 6
                }
              }}
            >
              {tower.image_url ? (
                <CardMedia
                  component="img"
                  height="200"
                  image={tower.image_url}
                  alt={tower.name}
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
                  <ApartmentIcon sx={{ fontSize: 100, color: 'grey.400' }} />
                </Box>
              )}
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography gutterBottom variant="h5" component="div">
                  {tower.name}
                </Typography>
              </CardContent>
              <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                <Button 
                  size="small" 
                  color="primary"
                  variant="outlined"
                  onClick={() => handleTowerDetails(tower.id)}
                >
                  Tower Details
                </Button>
              </CardActions>
            </Card>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default Towers;
