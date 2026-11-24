import React, { useEffect, useState } from 'react';
import { Box,Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, CircularProgress, Alert, Button, ButtonGroup, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, TextField, Select, MenuItem } from '@mui/material';
import { Add as AddIcon} from '@mui/icons-material';
import CloseIcon from '@mui/icons-material/Close';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../utils/axios';
import { replaceS3WithCloudFront, processApiResponse } from '../utils/urlReplacer';
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
  vr_url?: string;
  balcony_images?: BalconyImage[];
}

const UnitPlans = () => {
  const [unitPlans, setUnitPlans] = useState<UnitPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [openPlanDialog, setOpenPlanDialog] = useState(false);
  const [editingUnitPlan, seteditingUnitPlan] = useState<UnitPlan | null>(null);
  const [selectedPlanImage, setSelectedPlanImage] = useState<string | null>(null);
  const [open3dImageDialog, setOpen3dImageDialog] = useState(false);
  const [openUnitPlanDialog, setOpenUnitPlanDialog] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<UnitPlan | null>(null);
  const [selectedBalconyId, setSelectedBalconyId] = useState<number | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [open3dImageViewer, setOpen3dImageViewer] = useState(false);
  const [selected3dImage, setSelected3dImage] = useState<string | null>(null);
  const [selected3dImageName, setSelected3dImageName] = useState<string>('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [openVrUrlDialog, setOpenVrUrlDialog] = useState(false);
  const [selectedVrPlan, setSelectedVrPlan] = useState<UnitPlan | null>(null);
  const [vrUrl, setVrUrl] = useState<string>('');
  const [updatingVrUrl, setUpdatingVrUrl] = useState(false);
  const { project_id } = useParams();
  useEffect(() => {
    fetchUnitPlans();
  }, []);

  const fetchUnitPlans = async () => {
    setLoading(true);
    setError('');
    try {
      // Adjust the URL as needed for your backend route
      const response = await axiosInstance.get(`/api/units/unitplans/${project_id}`);
      
      // Process the response data to replace S3 URLs with CloudFront URLs
      const processedData = processApiResponse(response.data) as any;
      const processedUnitPlans = ((processedData.data || processedData.plans) || []).map((plan: UnitPlan) => ({
        ...plan,
        plan: replaceS3WithCloudFront(plan.plan || ''),
        balcony_images: plan.balcony_images?.map(balcony => ({
          ...balcony,
          image_url: replaceS3WithCloudFront(balcony.image_url || '')
        }))
      }));
      
      setUnitPlans(processedUnitPlans);
    } catch (err) {
      setError('Failed to fetch unit plans');
    } finally {
      setLoading(false);
    }
  };

  const handleShowPlan = (planUrl: string) => {
    const cloudFrontPlanUrl = replaceS3WithCloudFront(planUrl);
    setSelectedPlanImage(cloudFrontPlanUrl);
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
    setError('');
    setImageFile(null);
    setIsEditMode(false);
    setOpen3dImageDialog(true);
  };

  const editUnitPlanModal = (planId: number) => {
    const plan = unitPlans.find(p => p.id === planId);
    setSelectedPlanId(planId);
    setSelectedPlan(plan || null);
    setSelectedBalconyId(null);
    setError('');
    setImageFile(null);
    setIsEditMode(false);
    setOpenUnitPlanDialog(true);
  };

  const edit3dImageModal = (planId: number) => {
    const plan = unitPlans.find(p => p.id === planId);
    setSelectedPlanId(planId);
    setSelectedPlan(plan || null);
    setSelectedBalconyId(null);
    setError('');
    setImageFile(null);
    setIsEditMode(true);
    setOpen3dImageDialog(true);
  };

  const handleClose3dImageDialog = () => {
    setOpen3dImageDialog(false);
    setSelectedPlanId(null);
    setSelectedPlan(null);
    setSelectedBalconyId(null);
    setImageFile(null);
    setError('');
  };

  const handleCloseUnitPlanDialog = () => {
    setOpenUnitPlanDialog(false);
  }

  const handleBalconySelect = (balconyId: number) => {
    setSelectedBalconyId(balconyId);
    setImageFile(null);
  };

  const handleShow3dImage = (imageUrl: string, imageName: string) => {
    const cloudFrontImageUrl = replaceS3WithCloudFront(imageUrl);
    setSelected3dImage(cloudFrontImageUrl);
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
    if (!imageFile || !selectedPlanId || !selectedBalconyId) {
      setError('Please select a balcony and choose an image file');
      return;
    }

    setUploading(true);
    setError('');
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
      const response = await axiosInstance.get(`/api/units/unitplans/${project_id}`);
      
      // Process the response data to replace S3 URLs with CloudFront URLs
      const processedData = processApiResponse(response.data) as any;
      const processedUnitPlans = ((processedData.data || processedData.plans) || []).map((plan: UnitPlan) => ({
        ...plan,
        plan: replaceS3WithCloudFront(plan.plan || ''),
        balcony_images: plan.balcony_images?.map(balcony => ({
          ...balcony,
          image_url: replaceS3WithCloudFront(balcony.image_url || '')
        }))
      }));
      
      setUnitPlans(processedUnitPlans);
      
      handleClose3dImageDialog();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to upload image. Please try again.';
      setError(errorMessage);
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleOpenVrUrlDialog = (plan: UnitPlan) => {
    setSelectedVrPlan(plan);
    setVrUrl(plan.vr_url || '');
    setError('');
    setOpenVrUrlDialog(true);
  };

  const handleCloseVrUrlDialog = () => {
    setOpenVrUrlDialog(false);
    setSelectedVrPlan(null);
    setVrUrl('');
    setError('');
  };

  const handleUpdateVrUrl = async () => {
    if (!selectedVrPlan || !vrUrl.trim()) {
      setError('Please enter a valid VR URL');
      return;
    }

    setUpdatingVrUrl(true);
    setError('');
    try {
      await axiosInstance.put(`/api/units/unitplans/${selectedVrPlan.id}/vr-url`, {
        vr_url: vrUrl.trim()
      });

      // Refresh the unit plans after successful update
      const response = await axiosInstance.get(`/api/units/unitplans/${project_id}`);
      
      // Process the response data to replace S3 URLs with CloudFront URLs
      const processedData = processApiResponse(response.data) as any;
      const processedUnitPlans = ((processedData.data || processedData.plans) || []).map((plan: UnitPlan) => ({
        ...plan,
        plan: replaceS3WithCloudFront(plan.plan || ''),
        balcony_images: plan.balcony_images?.map(balcony => ({
          ...balcony,
          image_url: replaceS3WithCloudFront(balcony.image_url || '')
        }))
      }));
      
      setUnitPlans(processedUnitPlans);
      
      handleCloseVrUrlDialog();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to update VR URL. Please try again.';
      setError(errorMessage);
      console.error('VR URL update error:', err);
    } finally {
      setUpdatingVrUrl(false);
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
                <TableCell>Images</TableCell>
                {/* <TableCell>VR URL</TableCell> */}
                <TableCell>Add Normal Image</TableCell>
                <TableCell></TableCell>
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
                        Show
                      </Button>
                    ) : (
                      <Typography variant="body2" color="text.secondary">No Plan</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {plan.balcony_images && plan.balcony_images.length > 0 ? (
                      <Box>
                        {plan.balcony_images
                          .filter(balcony => balcony.image_url && balcony.image_type === 'normal')
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
                        {plan.balcony_images.filter(balcony => balcony.image_url && balcony.image_type === 'normal').length === 0 && (
                          <Typography variant="body2" color="text.secondary">No Images</Typography>
                        )}
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">No Balconies</Typography>
                    )}
                  </TableCell>
                  {/* <TableCell>
                    {plan.vr_url ? (
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          variant="outlined"
                          size="small"
                          sx={{ mb: 0.5 }}
                          onClick={() => window.open(plan.vr_url, '_blank')}
                        >
                          View VR
                        </Button>
                        <Button
                          variant="contained"
                          size="small"
                          color="primary"
                          onClick={() => handleOpenVrUrlDialog(plan)}
                        >
                          Edit VR
                        </Button>
                      </Box>
                    ) : (
                      <Button
                        variant="contained"
                        size="small"
                        color="primary"
                        onClick={() => handleOpenVrUrlDialog(plan)}
                      >
                        Add VR
                      </Button>
                    )}
                  </TableCell> */}
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="contained"
                        size="small"
                        color="primary"
                        onClick={() => add3dImageModal(plan.id!)} 
                      >
                        Add
                      </Button>
                      {/* <Button
                        variant="contained"
                        size="small"
                        color="primary"
                        onClick={() => edit3dImageModal(plan.id!)} 
                      >
                        Edit
                      </Button> */}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="contained"
                        size="small"
                        color="primary"
                        onClick={() => editUnitPlanModal(plan.id!)} 
                      >
                        Edit
                      </Button>
                    </Box>
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
          {isEditMode ? 'Edit' : 'Add'} Image - {selectedPlan?.name}
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
                  Select Balcony for Image:
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
                      Select a image file to upload for the selected balcony.
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
                        Choose Image File
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
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
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
            {uploading ? 'Uploading...' : (isEditMode ? 'Update' : 'Upload')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 3D Image Viewer Modal */}
      <Dialog open={open3dImageViewer} onClose={handleClose3dImageViewer} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
           Image - {selected3dImageName}
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

      {/* VR URL Dialog */}
      <Dialog open={openVrUrlDialog} onClose={handleCloseVrUrlDialog} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {selectedVrPlan?.vr_url ? 'Edit VR URL' : 'Add VR URL'} - {selectedVrPlan?.name}
          <IconButton onClick={handleCloseVrUrlDialog}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              VR Tour URL
            </Typography>
            <TextField
              fullWidth
              label="VR URL"
              placeholder="Enter VR tour URL (e.g., https://example.com/vr-tour)"
              value={vrUrl}
              onChange={(e) => setVrUrl(e.target.value)}
              variant="outlined"
              sx={{ mb: 2 }}
            />
            {selectedVrPlan?.vr_url && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  Current VR URL:
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    p: 1, 
                    bgcolor: 'grey.100', 
                    borderRadius: 1,
                    wordBreak: 'break-all'
                  }}
                >
                  {selectedVrPlan.vr_url}
                </Typography>
              </Box>
            )}
          </Box>
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseVrUrlDialog} disabled={updatingVrUrl}>
            Cancel
          </Button>
          <Button 
            onClick={handleUpdateVrUrl} 
            variant="contained" 
            disabled={!vrUrl.trim() || updatingVrUrl}
          >
            {updatingVrUrl ? 'Updating...' : (selectedVrPlan?.vr_url ? 'Update VR URL' : 'Add VR URL')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Unit Plan Dialog */}
      <Dialog open={openUnitPlanDialog} onClose={handleCloseUnitPlanDialog} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          Edit Unit Plan - {selectedPlan?.name}
          <IconButton onClick={handleCloseUnitPlanDialog}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          {selectedPlan && (
            <>
              <TextField
                label="Name"
                value={selectedPlan.name}
                onChange={e =>
                  setSelectedPlan({ ...selectedPlan, name: e.target.value })
                }
                fullWidth
              />
              <TextField
                label="Area"
                value={selectedPlan.area}
                fullWidth
                onChange={e =>
                  setSelectedPlan({ ...selectedPlan, area: e.target.value })
                }
              />
              <TextField
                label="Cost"
                value={selectedPlan.cost}
                onChange={e =>
                  setSelectedPlan({ ...selectedPlan, cost: e.target.value })
                }
                fullWidth
              />
              <Select
                labelId="unit-select-label"
                value={selectedPlan.type}
                label="Type"
                required
                onChange={e =>
                  setSelectedPlan({ ...selectedPlan, type: e.target.value as string })
                }
              >
                  <MenuItem key='1bhk' value='1 BHK'>1 BHK</MenuItem>
                  <MenuItem key='2bhk' value='2 BHK'>2 BHK</MenuItem>
                  <MenuItem key='3bhk' value='3 BHK'>3 BHK</MenuItem>
                  <MenuItem key='4bhk' value='4 BHK'>4 BHK</MenuItem>
                  <MenuItem key='5bhk' value='5 BHK'>5 BHK</MenuItem>
              </Select>
              <TextField
                label="VR URL"
                value={selectedPlan.vr_url}
                onChange={e =>
                  setSelectedPlan({ ...selectedPlan, vr_url: e.target.value })
                }
                fullWidth
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenUnitPlanDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={async () => {
              try {
                if (selectedPlan) {
                  const formData = new FormData();
                  formData.append('name', selectedPlan.name);
                  formData.append('area', selectedPlan.area);
                  formData.append('cost', selectedPlan.cost);
                  formData.append('type', selectedPlan.type);
                  formData.append('vr_url', selectedPlan.vr_url || '');
                  

                  await axiosInstance.put(`/api/units/unitplans/${selectedPlan.id}`, formData, {
                    headers: {
                      'Content-Type': 'multipart/form-data',
                    },
                  });

                  fetchUnitPlans(); // refresh
                  handleCloseUnitPlanDialog();
                }
              } catch (err) {
                console.error("Failed to update client", err);
              }
            }}
            disabled={!!error}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UnitPlans;
