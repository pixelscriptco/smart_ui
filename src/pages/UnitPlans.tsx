import React, { useEffect, useState } from 'react';
import { Box,Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, CircularProgress, Alert, Button, ButtonGroup, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, TextField } from '@mui/material';
import { Add as AddIcon} from '@mui/icons-material';
import CloseIcon from '@mui/icons-material/Close';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../utils/axios';
// Define the type for a balcony image
interface BalconyImage {
  id: number;
  unit_plan_id: number;
  image_url: string | null;
  image_type: string;
  name: string;
  created_at: string;
  updated_at: string;
}

// Define the type for a unit plan
interface UnitPlan {
  id: number;
  name: string;
  type: string;
  area: string;
  cost: string;
  status: boolean;
  plan?: string;
  balcony_images?: BalconyImage[];
}

const UnitPlans = () => {
  const [unitPlans, setUnitPlans] = useState<UnitPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [openPlanDialog, setOpenPlanDialog] = useState(false);
  const [selectedPlanImage, setSelectedPlanImage] = useState<string | null>(null);
  const [open3dImageDialog, setOpen3dImageDialog] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<UnitPlan | null>(null);
  const [selectedBalconyId, setSelectedBalconyId] = useState<number | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [open3dImageViewer, setOpen3dImageViewer] = useState(false);
  const [selected3dImage, setSelected3dImage] = useState<string | null>(null);
  const [selected3dImageName, setSelected3dImageName] = useState<string>('');
  const { project_id } = useParams();
  useEffect(() => {
    const fetchUnitPlans = async () => {
      setLoading(true);
      setError('');
      try {
        // Adjust the URL as needed for your backend route
        const response = await axiosInstance.get('/api/units/unitplans');
        setUnitPlans(response.data.data || response.data.plans || []);
      } catch (err) {
        setError('Failed to fetch unit plans');
      } finally {
        setLoading(false);
      }
    };
    fetchUnitPlans();
  }, []);

  const handleShowPlan = (planUrl: string) => {
    setSelectedPlanImage(planUrl);
    setOpenPlanDialog(true);
  };

  const handleClosePlanDialog = () => {
    setOpenPlanDialog(false);
    setSelectedPlanImage(null);
  };

  const add3dImageModal = (planId: number) => {
    const plan = unitPlans.find(p => p.id === planId);
    setSelectedPlanId(planId);
    setSelectedPlan(plan || null);
    setSelectedBalconyId(null);
    setOpen3dImageDialog(true);
  };

  const handleClose3dImageDialog = () => {
    setOpen3dImageDialog(false);
    setSelectedPlanId(null);
    setSelectedPlan(null);
    setSelectedBalconyId(null);
    setImageFile(null);
  };

  const handleBalconySelect = (balconyId: number) => {
    setSelectedBalconyId(balconyId);
    setImageFile(null);
  };

  const handleShow3dImage = (imageUrl: string, imageName: string) => {
    setSelected3dImage(imageUrl);
    setSelected3dImageName(imageName);
    setOpen3dImageViewer(true);
  };

  const handleClose3dImageViewer = () => {
    setOpen3dImageViewer(false);
    setSelected3dImage(null);
    setSelected3dImageName('');
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
    }
  };

  const handleUpload3dImage = async () => {
    if (!imageFile || !selectedPlanId || !selectedBalconyId) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      formData.append('planId', selectedPlanId.toString());
      formData.append('balconyId', selectedBalconyId.toString());

      await axiosInstance.post('/api/units/upload-3d-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Refresh the unit plans after successful upload
      const response = await axiosInstance.get('/api/units/unitplans');
      setUnitPlans(response.data.data || response.data.plans || []);
      
      handleClose3dImageDialog();
    } catch (err) {
      setError('Failed to upload 3D image');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, justifyContent:'space-between' }}>
        <Typography variant="h4">
            Unit Plans
        </Typography>
        <ButtonGroup variant="contained" aria-label="unit plan actions" sx={{ gap: 1 }} disableElevation>
          <Button
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => navigate(`/projects/${project_id}/unit-plan`)}
          >
            Add Unit Plan
          </Button>
          <Button
            onClick={() => navigate(`/projects/${project_id}/units`)}
          >
            Back to Units
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
                <TableCell>Type</TableCell>
                <TableCell>Area</TableCell>
                <TableCell>Cost</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Show Plan</TableCell>
                <TableCell>3D Images</TableCell>
                <TableCell>Add 3D Image</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {unitPlans.map((plan,index) => (
                <TableRow key={plan.id}>
                  <TableCell>{index+1}</TableCell>
                  <TableCell>{plan.name}</TableCell>
                  <TableCell>{plan.type}</TableCell>
                  <TableCell>{plan.area}</TableCell>
                  <TableCell>{plan.cost}</TableCell>
                  <TableCell>{plan.status ? 'Active' : 'Inactive'}</TableCell>
                  <TableCell>
                    {plan.plan ? (
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => handleShowPlan(plan.plan!)}
                      >
                        Show Plan
                      </Button>
                    ) : (
                      <Typography variant="body2" color="text.secondary">No Plan</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {plan.balcony_images && plan.balcony_images.length > 0 ? (
                      <Box>
                        {plan.balcony_images
                          .filter(balcony => balcony.image_url && balcony.image_type === '3d')
                          .map((balcony) => (
                            <Button
                              key={balcony.id}
                              variant="outlined"
                              size="small"
                              sx={{ mb: 0.5, mr: 0.5 }}
                              onClick={() => handleShow3dImage(balcony.image_url!, balcony.name)}
                            >
                              {balcony.name}
                            </Button>
                          ))}
                        {plan.balcony_images.filter(balcony => balcony.image_url && balcony.image_type === '3d').length === 0 && (
                          <Typography variant="body2" color="text.secondary">No 3D Images</Typography>
                        )}
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">No Balconies</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="contained"
                      size="small"
                      color="primary"
                      onClick={() => add3dImageModal(plan.id!)} 
                    >
                      Add 3D Image
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </TableContainer>
      <Dialog open={openPlanDialog} onClose={handleClosePlanDialog} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          Plan Image
          <IconButton onClick={handleClosePlanDialog}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          {selectedPlanImage && (
            <img src={selectedPlanImage} alt="Unit Plan" style={{ maxWidth: '100%', maxHeight: 500, borderRadius: 8 }} />
          )}
        </DialogContent>
      </Dialog>

      {/* 3D Image Upload Modal */}
      <Dialog open={open3dImageDialog} onClose={handleClose3dImageDialog} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          Add 3D Image - {selectedPlan?.name}
          <IconButton onClick={handleClose3dImageDialog}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            {selectedPlan && (
              <>
                {/* <Typography variant="h6" sx={{ mb: 2 }}>
                  Unit Plan: {selectedPlan.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Type: {selectedPlan.type} | Area: {selectedPlan.area} | Cost: {selectedPlan.cost}
                </Typography> */}
                
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Select Balcony for 3D Image:
                </Typography>
                
                {selectedPlan.balcony_images && selectedPlan.balcony_images.length > 0 ? (
                  <Box sx={{ mb: 3 }}>
                    {selectedPlan.balcony_images.map((balcony) => (
                      <Box
                        key={balcony.id}
                        sx={{
                          border: selectedBalconyId === balcony.id ? '2px solid #1976d2' : '1px solid #ddd',
                          borderRadius: 1,
                          p: 2,
                          mb: 1,
                          cursor: 'pointer',
                          backgroundColor: selectedBalconyId === balcony.id ? '#f5f5f5' : 'transparent',
                          '&:hover': {
                            backgroundColor: '#f5f5f5',
                          }
                        }}
                        onClick={() => handleBalconySelect(balcony.id)}
                      >
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                          {balcony.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Type: {balcony.image_type}
                          {balcony.image_url && (
                            <span> | Has existing image</span>
                          )}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="error" sx={{ mb: 3 }}>
                    No balcony images found for this unit plan.
                  </Typography>
                )}
                
                {selectedBalconyId && (
                  <>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      Select a 3D image file to upload for the selected balcony.
                    </Typography>
                    <input
                      accept="image/*"
                      style={{ display: 'none' }}
                      id="3d-image-file"
                      type="file"
                      onChange={handleFileChange}
                    />
                    <label htmlFor="3d-image-file">
                      <Button
                        variant="outlined"
                        component="span"
                        fullWidth
                        sx={{ mb: 2 }}
                      >
                        Choose 3D Image File
                      </Button>
                    </label>
                    {imageFile && (
                      <Typography variant="body2" color="text.secondary">
                        Selected file: {imageFile.name}
                      </Typography>
                    )}
                  </>
                )}
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose3dImageDialog} disabled={uploading}>
            Cancel
          </Button>
          <Button 
            onClick={handleUpload3dImage} 
            variant="contained" 
            disabled={!imageFile || !selectedBalconyId || uploading}
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 3D Image Viewer Modal */}
      <Dialog open={open3dImageViewer} onClose={handleClose3dImageViewer} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          3D Image - {selected3dImageName}
          <IconButton onClick={handleClose3dImageViewer}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 500 }}>
          {selected3dImage && (
            <img 
              src={selected3dImage} 
              alt={`3D Image - ${selected3dImageName}`} 
              style={{ 
                maxWidth: '100%', 
                maxHeight: 600, 
                borderRadius: 8,
                objectFit: 'contain'
              }} 
            />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default UnitPlans;
