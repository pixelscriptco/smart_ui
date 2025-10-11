import React, { useState, useEffect } from 'react';
import { Box, Button, Typography, Paper, CircularProgress, Alert, InputLabel, Select, MenuItem, FormControl, SelectChangeEvent, Grid, Card, CardContent, Chip, Modal, List, ListItem, ListItemButton, ListItemText, Checkbox } from '@mui/material';
import { Bungalow as BungalowIcon,Add as AddIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import axiosInstance from '../utils/axios';
import { useNavigate, useParams } from 'react-router-dom';
import './Units.css';

interface UnitStatus {
  id: number;
  color: string;
  name: string;
}

interface UnitPlan {
  id: number;
  name: string;
  plan: string;
  area: string;
  type: string;
  cost: string;
  image_url: string;
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
  slug:string;
  unit_plans:UnitPlan;
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

interface Floor {
  id: string;
  number: number;
  name: string;
  tower_id: string;
}

const Units: React.FC = () => {
  const [units, setUnits] = useState<Unit[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [towers, setTowers] = useState<Tower[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<string>('');
  const [selectedTower, setSelectedTower] = useState<string>('');
  const [selectedFloor, setSelectedFloor] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [showFloorPlansModal, setShowFloorPlansModal] = useState(false);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [floorPlans, setFloorPlans] = useState<UnitPlan[]>([]);
  const [statusLoading, setStatusLoading] = useState<{ [unitId: string]: boolean }>({});
  const [loadingFloorPlans, setLoadingFloorPlans] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<UnitPlan | null>(null);
  const [customUnitName, setCustomUnitName] = useState('');
  const [selectedUnits, setSelectedUnits] = useState<string[]>([]);
  const [loadingAddPlanForSelected, setLoadingAddPlanForSelected] = useState(false);
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

      try {
        const response = await axiosInstance.get(`/api/towers/${selectedTower}/floors`);
        setFloors(response.data.floors);
      } catch (err) {
        console.error('Error fetching floors:', err);
        setError('Failed to load floors');
      }
    };

    fetchFloors();
  }, [selectedTower]);

  useEffect(() => {
    if (selectedFloor) {
      fetchUnits();
    } else {
      setUnits([]);
    }
  }, [selectedFloor]);

  const fetchUnits = async () => {
    try {
      setLoadingUnits(true);
      const response = await axiosInstance.get(`/api/floors/${selectedFloor}/units`);
      setUnits(response.data.units);
    } catch (error) {
      console.error('Error fetching units:', error);
      setError('Failed to fetch units');
    } finally {
      setLoadingUnits(false);
    }
  };

  const handleBuildingChange = (event: SelectChangeEvent<string>) => {
    const buildingId = event.target.value;
    setSelectedBuilding(buildingId);
    setSelectedTower(''); // Reset tower selection
    setSelectedFloor(''); // Reset floor selection
  };

  const handleTowerChange = (event: SelectChangeEvent<string>) => {
    setSelectedTower(event.target.value);
    setSelectedFloor(''); // Reset floor selection
  };

  const handleFloorChange = (event: SelectChangeEvent<string>) => {
    setSelectedFloor(event.target.value);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUnits(units.map(unit => unit.id));
    } else {
      setSelectedUnits([]);
    }
  };

  const handleUnitSelect = (unitId: string, checked: boolean) => {
    if (checked) {
      setSelectedUnits(prev => [...prev, unitId]);
    } else {
      setSelectedUnits(prev => prev.filter(id => id !== unitId));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'success';
      case 'booked':
        return 'warning';
      case 'sold':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const convertBlobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const compressImage = async (blob: Blob): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = URL.createObjectURL(blob);
      
      img.onload = () => {
        URL.revokeObjectURL(img.src);
        
        // Calculate new dimensions while maintaining aspect ratio
        const maxWidth = 800;
        const maxHeight = 600;
        let width = img.width;
        let height = img.height;
        
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        // Create canvas and draw resized image
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob with reduced quality
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Could not compress image'));
            }
          },
          'image/jpeg',
          0.7 // Quality: 0.7 = 70% quality
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(img.src);
        reject(new Error('Could not load image'));
      };
    });
  };

  const handleAddPlan = async (unitId: string) => {
    try {
      setLoadingFloorPlans(true);
      const response = await axiosInstance.get(`/api/projects/${project_id}/plans`);
      
      console.log(response);
      
      // Convert image URLs to base64 with compression
      const plansWithBase64Images = await Promise.all(
        response.data.plans.map(async (unitplan: UnitPlan) => {
          if (unitplan.plan) {
            try {
              const imageResp = await fetch(unitplan.plan);
              const imageBlob = await imageResp.blob();
              
              // Compress the image before converting to base64
              const compressedBlob = await compressImage(imageBlob);
              const imageBase64 = await convertBlobToBase64(compressedBlob);
              
              return {
                ...unitplan,
                plan: imageBase64
              };
            } catch (error) {
              console.error('Error processing image:', error);
              return unitplan;
            }
          }
          return unitplan;
        })
      );

      setFloorPlans(plansWithBase64Images);
      setShowFloorPlansModal(true);
      setSelectedUnitId(unitId);
      // Set custom name to the current unit's name
      const unit = units.find(u => u.id === unitId);
      setCustomUnitName(unit?.slug || unit?.name || '');
    } catch (error) {
      console.error('Error fetching floor plans:', error);
      setError('Failed to fetch floor plans');
    } finally {
      setLoadingFloorPlans(false);
    }
  };

  const handleMapUnitPlan = async (unitId: string, planId: string, customName: string) => {
    try {
      await axiosInstance.post(`/api/floors/units/map-plan`, {
        unit_id: unitId,
        unit_plan_id: planId,
        custom_name: customName
      });
      
      // Refresh the units list
      fetchUnits();
      setShowFloorPlansModal(false);
      setSelectedUnitId(null);
    } catch (error) {
      console.error('Error mapping unit plan:', error);
      setError('Failed to map unit plan');
    }
  };

  const handlePlanSelect = (plan: UnitPlan) => {
    setSelectedPlan(plan);
  };

  const handleSavePlan = async () => {
    if (selectedUnitId && selectedPlan) {
      if (selectedUnitId === 'multiple') {
        // Handle multiple units
        try {
          for (const unitId of selectedUnits) {
            await handleMapUnitPlan(unitId, selectedPlan.id.toString(), customUnitName);
          }
          setSelectedUnits([]); // Clear selected units after adding
          fetchUnits(); // Refresh units list
          setShowFloorPlansModal(false);
          setSelectedUnitId(null);
          setSelectedPlan(null);
          setCustomUnitName('');
          setLoadingAddPlanForSelected(false);
        } catch (error) {
          console.error('Error mapping unit plans for multiple units:', error);
          setError('Failed to map unit plans for selected units');
          setLoadingAddPlanForSelected(false);
        }
      } else {
        // Handle single unit (existing functionality)
        await handleMapUnitPlan(selectedUnitId, selectedPlan.id.toString(), customUnitName);
      }
    }
  };

  const handleAddPlanForSelected = async () => {
    if (selectedUnits.length === 0) return;

    try {
      setLoadingAddPlanForSelected(true);
      setLoadingFloorPlans(true);
      const response = await axiosInstance.get(`/api/projects/${project_id}/plans`);
      
      console.log(response);
      
      // Convert image URLs to base64 with compression
      const plansWithBase64Images = await Promise.all(
        response.data.plans.map(async (unitplan: UnitPlan) => {
          if (unitplan.plan) {
            try {
              const imageResp = await fetch(unitplan.plan);
              const imageBlob = await imageResp.blob();
              
              // Compress the image before converting to base64
              const compressedBlob = await compressImage(imageBlob);
              const imageBase64 = await convertBlobToBase64(compressedBlob);
              
              return {
                ...unitplan,
                plan: imageBase64
              };
            } catch (error) {
              console.error('Error processing image:', error);
              return unitplan;
            }
          }
          return unitplan;
        })
      );

      setFloorPlans(plansWithBase64Images);
      setShowFloorPlansModal(true);
      setSelectedUnitId('multiple'); // Special identifier for multiple units
      setCustomUnitName('');
    } catch (error) {
      console.error('Error fetching floor plans:', error);
      setError('Failed to fetch floor plans');
    } finally {
      setLoadingFloorPlans(false);
      setLoadingAddPlanForSelected(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        Loading units...
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
          Units ({projectName})
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
        <Button
            variant="contained"
            color="primary"
            startIcon={<BungalowIcon />}
            onClick={() => navigate(`/projects/${project_id}/unit-plans`)}
          >
            List Unit Plans
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => navigate(`/projects/${project_id}/unit-plan`)}
          >
            Add Unit Plan
          </Button>
          <Button
            variant="outlined"
            onClick={() => navigate(`/projects/${project_id}`)}
          >
            Back to Project
          </Button>
        </Box>
      </Box>

      <Box sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
          <Box sx={{ flex: '1 1 300px', minWidth: 0 }}>
            <FormControl fullWidth>
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
          </Box>

          <Box sx={{ flex: '1 1 300px', minWidth: 0 }}>
            <FormControl fullWidth>
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

          <Box sx={{ flex: '1 1 300px', minWidth: 0 }}>
            <FormControl fullWidth>
              <InputLabel id="floor-select-label">Select Floor</InputLabel>
              <Select
                labelId="floor-select-label"
                value={selectedFloor}
                onChange={handleFloorChange}
                label="Select Floor"
                disabled={!selectedTower}
              >
                {floors.map((floor) => (
                  <MenuItem key={floor.id} value={floor.id}>
                    {floor.name} (Floor {floor.number})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loadingUnits ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {units.length > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Checkbox
                    checked={selectedUnits.length === units.length && units.length > 0}
                    indeterminate={selectedUnits.length > 0 && selectedUnits.length < units.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                  <Typography variant="body1" sx={{ ml: 1 }}>
                    Select All ({selectedUnits.length} of {units.length} selected)
                  </Typography>
                </Box>
                {selectedUnits.length > 0 && (
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={loadingAddPlanForSelected ? <CircularProgress size={16} color="inherit" /> : <AddIcon />}
                    onClick={() => handleAddPlanForSelected()}
                    disabled={selectedUnits.length === 0 || loadingAddPlanForSelected}
                  >
                    {loadingAddPlanForSelected ? 'Loading...' : `Add Unit Plan for Selected (${selectedUnits.length})`}
                  </Button>
                )}
              </Box>
            )}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, justifyContent: 'flex-start' }}>
            {units.map((unit) => (
              <Box
                key={unit.id}
                sx={{
                  flex: '1 1 22%', // 4 per row on large screens
                  maxWidth: { xs: '100%', sm: '48%', md: '23%', lg: '23%' },
                  minWidth: 0,
                  mb: 3,
                }}
              >
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                        <Checkbox
                          checked={selectedUnits.includes(unit.id)}
                          onChange={(e) => handleUnitSelect(unit.id, e.target.checked)}
                          sx={{ mr: 1 }}
                        />
                        {/* <Typography variant="h6" component="div">
                          {unit.slug??unit.name}
                        </Typography> */}
                      </Box>
                      <FormControl size="small" sx={{ minWidth: 120 }}>
                        <Select
                          value={unit.unit_status.id}
                          onChange={async (e) => {
                            setStatusLoading((prev) => ({ ...prev, [unit.id]: true }));
                            try {
                              await axiosInstance.put(`/api/units/${unit.id}/status`, { status: Number(e.target.value) });
                              fetchUnits();
                            } finally {
                              setStatusLoading((prev) => ({ ...prev, [unit.id]: false }));
                            }
                          }}
                          disabled={!!statusLoading[unit.id]}
                          sx={{
                            backgroundColor:
                              unit.unit_status.id === 1
                                ? '#d0f5e8' // green for available
                                : unit.unit_status.id === 2
                                ? '#ffd6d6' // red for booked
                                : unit.unit_status.id === 3
                                ? '#d6e6ff' // blue for hold
                                : 'inherit',
                            '& .MuiSelect-select': {
                              fontWeight: 600,
                              color:
                                unit.unit_status.id === 1
                                  ? '#388e3c'
                                  : unit.unit_status.id === 2
                                  ? '#d32f2f'
                                  : unit.unit_status.id === 3
                                  ? '#1976d2'
                                  : 'inherit',
                            },
                          }}
                        >
                          <MenuItem value={1}>Available</MenuItem>
                          <MenuItem value={2}>Booked</MenuItem>
                          <MenuItem value={3}>Hold</MenuItem>
                        </Select>
                      </FormControl>
                    </Box>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      {unit.slug??unit.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Unit {unit.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Type: {unit.unit_plans?.type || 'N/A'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Area: {unit.unit_plans?.area || 'N/A'} sq.ft
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Price: {unit.unit_plans?.cost ? unit.unit_plans.cost : 'N/A'}
                    </Typography>
                    <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                      <Button
                        variant="outlined"
                        fullWidth
                        onClick={() => navigate(`/projects/${project_id}/units/${unit.id}`)}
                        // disabled={unit.unit_plans}
                      >
                        View
                      </Button>
                      <Button
                        variant="contained"
                        fullWidth
                        onClick={() => handleAddPlan(unit.id)}
                      >
                        {unit.unit_plans ? 'Edit' : 'Add'}
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            ))}
            {units.length === 0 && selectedFloor && (
              <Box sx={{ width: '100%', textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                  No units found for this floor
                </Typography>
              </Box>
            )}
          </Box>
          </>
        )}
      </Box>

      <Modal
        open={showFloorPlansModal}
        onClose={() => {
          setShowFloorPlansModal(false);
          setSelectedUnitId(null);
          setSelectedPlan(null);
          setCustomUnitName('');
          setLoadingAddPlanForSelected(false);
          if (selectedUnitId === 'multiple') {
            setSelectedUnits([]); // Clear selected units when closing modal for multiple units
          }
        }}
        aria-labelledby="floor-plans-modal-title"
      >
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 800,
          bgcolor: 'background.paper',
          boxShadow: 24,
          borderRadius: 2,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <Box sx={{ p: 4, borderBottom: 1, borderColor: 'divider' }}>
            <Typography id="floor-plans-modal-title" variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold' }}>
              {selectedUnitId === 'multiple' 
                ? `Select Unit Plan for ${selectedUnits.length} Selected Units`
                : 'Select Unit Plan'
              }
            </Typography>
            {selectedUnitId === 'multiple' && (
              <Typography variant="body2" color="text.secondary">
                This plan will be applied to all {selectedUnits.length} selected units.
              </Typography>
            )}
          </Box>

          <Box sx={{ 
            p: 4, 
            overflow: 'auto',
            flex: 1
          }}>
            {/* Custom Name Field */}
            <Box sx={{ mb: 2 }}>
              <InputLabel htmlFor="custom-unit-name">
                {selectedUnitId === 'multiple' ? 'Custom Name (will be applied to all selected units)' : 'Custom Name'}
              </InputLabel>
              <input
                id="custom-unit-name"
                type="text"
                value={customUnitName}
                onChange={e => setCustomUnitName(e.target.value)}
                style={{
                  width: '100%',
                  padding: 8,
                  fontSize: 16,
                  borderRadius: 4,
                  border: '1px solid #ccc'
                }}
                placeholder={selectedUnitId === 'multiple' ? "Enter custom name for all selected units" : "Enter custom unit name"}
              />
            </Box>
            {loadingFloorPlans ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {floorPlans.map((unitplan) => (
                    <Box key={unitplan.id}>
                      <Paper 
                        elevation={2}
                        sx={{
                          p: 2,
                          display: 'flex',
                          gap: 2,
                          cursor: 'pointer',
                          '&:hover': {
                            bgcolor: 'action.hover',
                          },
                          transition: 'background-color 0.2s',
                          border: selectedPlan?.id === unitplan.id ? '2px solid' : 'none',
                          borderColor: 'primary.main'
                        }}
                        onClick={() => handlePlanSelect(unitplan)}
                      >
                        <Box sx={{ width: 200, height: 150, position: 'relative' }}>
                          <img
                            src={unitplan.plan}
                            alt={unitplan.type}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              borderRadius: '4px'
                            }}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.onerror = null;
                              target.src = 'https://via.placeholder.com/200x150?text=No+Image';
                            }}
                          />
                          {!unitplan && (
                            <Box
                              sx={{
                                width: '100%',
                                height: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                bgcolor: 'grey.100',
                                borderRadius: '4px'
                              }}
                            >
                              <Typography variant="body2" color="text.secondary">
                                No Image
                              </Typography>
                            </Box>
                          )}
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" gutterBottom>
                            {unitplan.name}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 2 }}>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="body2" color="text.secondary">
                                Type
                              </Typography>
                              <Typography variant="body1">
                                {unitplan.type}
                              </Typography>
                            </Box>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="body2" color="text.secondary">
                                Area
                              </Typography>
                              <Typography variant="body1">
                                {unitplan.area} sq ft
                              </Typography>
                            </Box>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="body2" color="text.secondary">
                                Price
                              </Typography>
                              <Typography variant="body1" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                                INR {unitplan.cost}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      </Paper>
                    </Box>
                  ))}
                </Box>
                {floorPlans.length === 0 && (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="h6" color="text.secondary">
                      No plans available
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Please add some plans to get started
                    </Typography>
                  </Box>
                )}
              </>
            )}
          </Box>

          <Box sx={{ 
            p: 2, 
            borderTop: 1, 
            borderColor: 'divider',
            bgcolor: 'background.paper',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 2
          }}>
            <Button
              variant="outlined"
              onClick={() => {
                setShowFloorPlansModal(false);
                setSelectedUnitId(null);
                setSelectedPlan(null);
                setCustomUnitName('');
                setLoadingAddPlanForSelected(false);
                if (selectedUnitId === 'multiple') {
                  setSelectedUnits([]); // Clear selected units when closing modal for multiple units
                }
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSavePlan}
              disabled={!selectedPlan}
            >
              {selectedUnitId === 'multiple' ? `Apply to ${selectedUnits.length} Units` : 'Select'}
            </Button>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
};

export default Units;
