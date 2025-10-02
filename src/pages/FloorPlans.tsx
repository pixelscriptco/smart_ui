import React, { useEffect, useState } from 'react';
import { Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, CircularProgress, Alert, Button, ButtonGroup, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Chip } from '@mui/material';
import { Add as AddIcon, Visibility as VisibilityIcon } from '@mui/icons-material';
import CloseIcon from '@mui/icons-material/Close';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../utils/axios';

// Define the type for a floor plan
interface FloorPlan {
  id: number;
  name: string;
  unit_count: number;
  image_url: string | null;
  svg_url: string | null;
  status: boolean;
  created_at: string;
  updated_at: string;
}

const FloorPlans = () => {
  const [floorPlans, setFloorPlans] = useState<FloorPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [openPlanDialog, setOpenPlanDialog] = useState(false);
  const [selectedPlanImage, setSelectedPlanImage] = useState<string | null>(null);
  const [selectedPlanName, setSelectedPlanName] = useState<string>('');
  const { project_id } = useParams();

  useEffect(() => {
    const fetchFloorPlans = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await axiosInstance.get(`/api/floors/${project_id}/floorplans`);
        setFloorPlans(response.data.floorPlans || []);
      } catch (err) {
        setError('Failed to fetch floor plans');
      } finally {
        setLoading(false);
      }
    };
    fetchFloorPlans();
  }, [project_id]);

  const handleShowPlan = (planUrl: string, planName: string) => {
    setSelectedPlanImage(planUrl);
    setSelectedPlanName(planName);
    setOpenPlanDialog(true);
  };

  const handleClosePlanDialog = () => {
    setOpenPlanDialog(false);
    setSelectedPlanImage(null);
    setSelectedPlanName('');
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, justifyContent: 'space-between' }}>
        <Typography variant="h4">
          Floor Plans
        </Typography>
        <ButtonGroup variant="contained" aria-label="floor plan actions" sx={{ gap: 1 }} disableElevation>
          <Button
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => navigate(`/projects/${project_id}/floor-plan`)}
          >
            Add Floor Plan
          </Button>
          <Button
            onClick={() => navigate(`/projects/${project_id}/floors`)}
          >
            Back to Floors
          </Button>
        </ButtonGroup>
      </Box>

      <TableContainer component={Paper} sx={{ mt: 4 }}>
        {loading ? (
          <CircularProgress sx={{ m: 2 }} />
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>No</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Unit Count</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created At</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {floorPlans.map((plan, index) => (
                <TableRow key={plan.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                      {plan.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {plan.unit_count} units
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={plan.status ? 'Active' : 'Inactive'}
                      color={plan.status ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(plan.created_at).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {plan.image_url && (
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<VisibilityIcon />}
                          onClick={() => handleShowPlan(plan.image_url!, plan.name)}
                        >
                          View Plan
                        </Button>
                      )}
                      {/* {plan.svg_url && (
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<VisibilityIcon />}
                          onClick={() => handleShowPlan(plan.svg_url!, `${plan.name} (SVG)`)}
                        >
                          View SVG
                        </Button>
                      )} */}
                      {!plan.image_url && !plan.svg_url && (
                        <Typography variant="body2" color="text.secondary">
                          No Plan Available
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
              {floorPlans.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      No floor plans found
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </TableContainer>

      {/* Plan Image Viewer Dialog */}
      <Dialog open={openPlanDialog} onClose={handleClosePlanDialog} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {selectedPlanName}
          <IconButton onClick={handleClosePlanDialog}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 500 }}>
          {selectedPlanImage && (
            <img 
              src={selectedPlanImage} 
              alt={selectedPlanName} 
              style={{ 
                maxWidth: '100%', 
                maxHeight: 600, 
                borderRadius: 8,
                objectFit: 'contain'
              }} 
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePlanDialog}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FloorPlans;