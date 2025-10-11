import React, { useState, useEffect } from 'react';
import { Snackbar,Box, Button, Typography, Paper, CircularProgress, Alert, ToggleButton, ToggleButtonGroup, IconButton, Tooltip, InputLabel, TextField, Select, MenuItem, FormControl, SelectChangeEvent, Checkbox, Stack, Modal, List, ListItem, ListItemText, ListItemButton } from '@mui/material';
import { Bungalow as BungalowIcon,CloudUpload as CloudUploadIcon, Save as SaveIcon, Straighten as LineIcon, Rectangle as RectangleIcon, Undo as UndoIcon, ArrowBack as ArrowBackIcon, Apartment as ApartmentIcon, Add as AddIcon, Edit as EditIcon } from '@mui/icons-material';
import axiosInstance from '../utils/axios';
import { useNavigate,useParams } from 'react-router-dom';
import './Floors.css';

interface FloorPlan {
  id: string;
  name: string;
}
interface Floor {
  id: string;
  number: number;
  name: string;
  units: number;
  floor_plan_id: string | null;
  floor_plan?: FloorPlan;
}

interface Building {
  id: string;
  project_id: number;
  name: string;
  image_url?: string;
}

interface Tower {
  id: number;
  name: string;
  floor_count: number;
  image_url?: string;
}

interface FloorPlan {
  id: string;
  name: string;
  unit_count: Number;
  created_at: string;
}

const Floors: React.FC = () => {
  const [floors, setFloors] = useState<Floor[]>([]);
  const [selectedFloor, setSelectedFloor] = useState<string | null>(null);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [towers, setTowers] = useState<Tower[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<string>('');
  const [selectedTower, setSelectedTower] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingFloors, setLoadingFloors] = useState(false);
  const [selectedFloors, setSelectedFloors] = useState<string[]>([]);
  const [showFloorPlansModal, setShowFloorPlansModal] = useState(false);
  const [floorPlans, setFloorPlans] = useState<FloorPlan[]>([]);
  const [loadingFloorPlans, setLoadingFloorPlans] = useState(false);
  const [selectedFloorPlan, setSelectedFloorPlan] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [projectName, setProjectName] = useState('');
  const navigate = useNavigate();
  const { project_id } = useParams();

  useEffect(() => {
    const fetchBuildings = async () => {
      try {
        const response = await axiosInstance.get(`/api/buildings/${project_id}`);
        setBuildings(response.data.buildings);
        setProjectName(response.data.project);
      } catch (err) {
        console.error('Error fetching buildings:', err);
        setError('Failed to load buildings');
      } finally {
        setLoading(false);
      }
    };

    fetchBuildings();
  }, [project_id]);

  useEffect(() => {
    const fetchTowers = async () => {
      if (!selectedBuilding) {
        setTowers([]);
        return;
      }

      try {
        const response = await axiosInstance.get(`/api/buildings/${selectedBuilding}/towers`);
        setTowers(response.data.towers);
      } catch (err) {
        console.error('Error fetching towers:', err);
        setError('Failed to load towers');
      }
    };

    fetchTowers();
  }, [selectedBuilding]);

  useEffect(() => {
    const fetchFloors = async () => {
      if (!selectedTower) {
        setFloors([]);
        return;
      }

      setLoadingFloors(true);
      try {
        const response = await axiosInstance.get(`/api/towers/${selectedTower}/floors`);
        setFloors(response.data.floors);
      } catch (err) {
        console.error('Error fetching floors:', err);
        setError('Failed to load floors');
      } finally {
        setLoadingFloors(false);
      }
    };

    fetchFloors();
  }, [selectedTower]);

  const handleFloorClick = (floor: Floor) => {
    setSelectedFloor(floor.id);
    // You can add additional actions here, like showing a modal or navigating to floor details
  };

  const formatArea = (area: number) => {
    return `${area.toLocaleString()} sq.ft`;
  };

  const handleBuildingChange = (event: SelectChangeEvent<string>) => {
    const buildingId = event.target.value;
    setSelectedBuilding(buildingId);
    setSelectedTower(''); // Reset tower selection when building changes
  };

  const handleTowerChange = (event: SelectChangeEvent<string>) => {
    setSelectedTower(event.target.value);
  };

  const handleFloorSelection = (floorId: string) => {
    setSelectedFloors(prev => 
      prev.includes(floorId) 
        ? prev.filter(id => id !== floorId)
        : [...prev, floorId]
    );
  };

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelectedFloors(floors.map(floor => floor.id));
    } else {
      setSelectedFloors([]);
    }
  };

  const handleAddFloorPlan = async () => {
    if (selectedFloors.length === 0) {
      setError('Please select at least one floor');
      return;
    }

    setIsEditingMode(false);
    setLoadingFloorPlans(true);
    try {
      const response = await axiosInstance.get(`/api/floors/${project_id}/floorplans`);
      setFloorPlans(response.data.floorPlans);
      setShowFloorPlansModal(true);
    } catch (err) {
      console.error('Error fetching floor plans:', err);
      setError('Failed to load floor plans');
    } finally {
      setLoadingFloorPlans(false);
    }
  };

  const handleEditFloorPlan = async (floorId: string) => {
    console.log('Edit floor plan clicked for floor:', floorId);
    setIsEditingMode(true);
    setLoadingFloorPlans(true);
    try {
      const response = await axiosInstance.get(`/api/floors/${project_id}/floorplans`);
      setFloorPlans(response.data.floorPlans);
      setSelectedFloors([floorId]); // Select only the current floor for editing
      setShowFloorPlansModal(true);
      console.log('Modal should be open now');
    } catch (err) {
      console.error('Error fetching floor plans:', err);
      setError('Failed to load floor plans');
    } finally {
      setLoadingFloorPlans(false);
    }
  };

  const handleSaveFloorPlan = async () => {
    if (!selectedFloorPlan || selectedFloors.length === 0) {
      setError('Please select a floor plan and at least one floor');
      return;
    }
  
    try {
      await axiosInstance.post(`/api/towers/${selectedTower}/floorplans`, {
        floor_plan_id: selectedFloorPlan,
        floor_ids: selectedFloors
      });

      setOpenSnackbar(true);
      setSuccessMessage(isEditingMode ? 'Floor plan updated successfully!' : 'Floor plans assigned successfully!');

      // Automatically close after 30 seconds
      setTimeout(() => {
        setOpenSnackbar(false);
      }, 30000);
      
      setShowFloorPlansModal(false);
      setSelectedFloorPlan(null);
      setIsEditingMode(false);

      // Refresh floors after saving
      const response = await axiosInstance.get(`/api/towers/${selectedTower}/floors`);
      setFloors(response.data.floors);
    } catch (err) {
      console.error('Error saving floor plan:', err);
      setError('Failed to save floor plan');
    }
  };

  const handleFloorPlanSelect = (floorPlanId: string) => {
    setSelectedFloorPlan(floorPlanId);
  };

  if (loading) {
    return (
      <div className="loading-container">
        Loading floors...
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        {error}
      </div>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">
          Floors ({projectName})
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<BungalowIcon />}
            onClick={() => navigate(`/projects/${project_id}/floor-plans`)}
          >
            View Floor Plans
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => navigate(`/projects/${project_id}/floor-plan`)}
          >
            Create Floor Plan
          </Button>
          <Button
            variant="outlined"
            onClick={() => navigate(`/projects/${project_id}`)}
          >
            Back to Project
          </Button>
        </Box>
      </Box>

      <Paper sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, mb: 3 }}>
        <FormControl sx={{ minWidth: 400 }}>
          <InputLabel id="building-select-label">Select Project</InputLabel>
          <Select
            labelId="building-select-label"
            value={selectedBuilding}
            onChange={handleBuildingChange}
            label="Select Project"
          >
            {buildings.map((building) => (
              <MenuItem key={building.id} value={building.id}>
                {building.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 400 }}>
          <InputLabel id="tower-select-label">Select Tower</InputLabel>
          <Select
            labelId="tower-select-label"
            value={selectedTower}
            onChange={handleTowerChange}
            label="Select Tower"
            disabled={!selectedBuilding}
          >
            {towers.map((tower) => (
              <MenuItem key={tower.id} value={tower.id}>
                {tower.name} ({tower.floor_count} floors)
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>


        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loadingFloors ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAddFloorPlan}
                disabled={selectedFloors.length === 0}
              >
                Add Floor Plan
              </Button>
              <Typography variant="body2" color="text.secondary" sx={{ alignSelf: 'center' }}>
                {selectedFloors.length} floor(s) selected
              </Typography>

              <FormControl>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Checkbox
                    checked={selectedFloors.length === floors.length}
                    indeterminate={selectedFloors.length > 0 && selectedFloors.length < floors.length}
                    onChange={handleSelectAll}
                    disabled={!floors.length}
                  />
                  <Typography variant="body2">Select All</Typography>
                </Box>
              </FormControl>
            </Stack>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2, mt: 2 }}>
              {floors.map((floor) => (
                <Paper
                  key={floor.id}
                  sx={{
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1,
                    height: '100%',
                    position: 'relative',
                  }}
                >
                  <Checkbox
                    checked={selectedFloors.includes(floor.id)}
                    onChange={() => handleFloorSelection(floor.id)}
                    sx={{ position: 'absolute', top: 8, right: 8 }}
                  />
                  <Typography variant="h6">{floor.name}</Typography>
                  {floor.floor_plan_id && floor.floor_plan && (
                    <Typography variant="body2" color="text.secondary" >
                      Floor Plan: {floor.floor_plan.name}
                    </Typography>
                  )}
                  {!floor.floor_plan_id && (
                    <Typography variant="body2" color="text.secondary" >
                      No Floor Plan Assigned
                    </Typography>
                  )}
                  <Box sx={{ mt: 'auto', display: 'flex', gap: 1 }}>
                    {floor.floor_plan_id ? (
                      <>
                        <Button
                          variant="contained"
                          fullWidth
                          onClick={() => navigate(`/projects/${project_id}/floor-plan/${floor.id}`)}
                        >
                          View 
                        </Button>
                        {/* <Button
                          variant="outlined"
                          startIcon={<EditIcon />}
                          fullWidth
                          onClick={() => handleEditFloorPlan(floor.id)}
                        >
                          Edit
                        </Button> */}
                      </>
                    ) : (
                      <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        fullWidth
                        onClick={() => handleAddFloorPlan}
                      >
                        Create Floor Plan
                      </Button>
                    )}
                  </Box>
                </Paper>
              ))}
            </Box>
          </>
        )}
      </Paper>

      <Modal
        open={showFloorPlansModal}
        onClose={() => {
          setShowFloorPlansModal(false);
          setSelectedFloorPlan(null);
          setIsEditingMode(false);
        }}
        aria-labelledby="floor-plans-modal"
      >
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 400,
          bgcolor: 'background.paper',
          boxShadow: 24,
          p: 4,
          borderRadius: 1,
        }}>
          <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
            {isEditingMode ? 'Edit Floor Plan' : 'Select Floor Plan'}
          </Typography>
          {loadingFloorPlans ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <List sx={{
              maxHeight: 300,
              overflowY: 'auto',
              border: '1px solid #ddd',
              borderRadius: 1,
            }}>
              {floorPlans.map((plan) => (
                <ListItem key={plan.id} disablePadding>
                  <ListItemButton 
                    onClick={() => handleFloorPlanSelect(plan.id)}
                    selected={selectedFloorPlan === plan.id}
                  >
                    <ListItemText 
                      primary={plan.name}
                      secondary={`${plan.unit_count} units`}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
              {floorPlans.length === 0 && (
                <ListItem>
                  <ListItemText primary="No floor plans available" />
                </ListItem>
              )}
            </List>
          )}
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button onClick={() => {
              setShowFloorPlansModal(false);
              setSelectedFloorPlan(null);
              setIsEditingMode(false);
            }}>
              Cancel
            </Button>
            <Button 
              variant="contained" 
              onClick={handleSaveFloorPlan}
              disabled={!selectedFloorPlan}
            >
              Save
            </Button>
          </Box>
        </Box>
      </Modal>

      <Snackbar
        open={openSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          severity="success"
          variant="filled"
          onClose={() => setOpenSnackbar(false)}
          sx={{ width: '100%' }}
        >
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Floors;
