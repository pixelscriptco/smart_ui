import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Typography, Paper, Box, CircularProgress, Chip, Divider, Button } from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import axiosInstance from '../utils/axios';

interface UnitPlan {
  id: number;
  name: string;
  plan: string;
  area: string;
  type: string;
  cost: string;
  image_url?: string;
}

interface UnitStatus {
  id: number;
  name: string;
  color: string;
}

interface Unit {
  id: string;
  number: string;
  name: string;
  unit_status: UnitStatus;
  area: number;
  price: number;
  floor_id: string;
  floor_plan_id: string;
  unit_plans: UnitPlan;
}

const UnitDetails: React.FC = () => {
  const { project_id, unit_id } = useParams();
  const navigate = useNavigate();
  const [unit, setUnit] = useState<Unit | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUnit = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get(`/api/units/${unit_id}`);
        setUnit(response.data.data);
      } catch (err) {
        setError('Failed to fetch unit details');
      } finally {
        setLoading(false);
      }
    };
    fetchUnit();
  }, [unit_id]);

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error || !unit) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Typography color="error" variant="h6" align="center">
          {error || 'Unit not found'}
        </Typography>
      </Container>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 60}}>
        <Typography variant="h4">
          Unit Details - {unit.name}
        </Typography>
        <Button
          // variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(`/projects/${project_id}/units`)}
        >
          Back to Units
        </Button>
      </Box>
      <Container maxWidth="md" sx={{ mb: 4 }}>
        <Paper sx={{ p: 4 }}>
          <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
            <Box sx={{ backgroundColor: '#e3f2fd', p: 2, borderRadius: 2, flex: 1 }}>
              <Typography variant="subtitle1"><strong>Type:</strong> {unit.unit_plans.type}</Typography>
            </Box>
            <Box sx={{ backgroundColor: '#fce4ec', p: 2, borderRadius: 2, flex: 1 }}>
              <Typography variant="subtitle1"><strong>Status:</strong> <Chip label={unit.unit_status.name} sx={{ backgroundColor: unit.unit_status.color, color: '#fff' }} size="small" /></Typography>
            </Box>
            <Box sx={{ backgroundColor: '#e8f5e9', p: 2, borderRadius: 2, flex: 1 }}>
              <Typography variant="subtitle1"><strong>Area:</strong> {unit.unit_plans.area}</Typography>
            </Box>
          </Box>
          {/* <Typography variant="subtitle1"><strong>Area:</strong> {unit.unit_plans.area} sq.ft</Typography>
          <Typography variant="subtitle1"><strong>Cost:</strong> {unit.unit_plans.cost}</Typography> */}
          {/* <Divider sx={{ my: 2 }} /> */}
          {unit.unit_plans ? (
            <Box>
              {unit.unit_plans.plan && (
                <Box sx={{ mt: 2 }}>
                  <img src={unit.unit_plans.plan} alt="Unit Plan" style={{ width: '100%', borderRadius: 8 }} />
                </Box>
              )}
            </Box>
          ) : (
            <Typography color="text.secondary">No plan details available.</Typography>
          )}
        </Paper>
      </Container>
    </Box>
  );
};

export default UnitDetails;
