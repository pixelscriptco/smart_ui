import React, { useRef, useState, useEffect } from 'react';
import { Box, Button, Typography, Paper, CircularProgress, Alert, ToggleButton, ToggleButtonGroup, IconButton, Tooltip, TextField, FormControl, InputLabel, Select, MenuItem, SelectChangeEvent } from '@mui/material';
import { CloudUpload as CloudUploadIcon, Save as SaveIcon, Straighten as LineIcon, Rectangle as RectangleIcon, Undo as UndoIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import axiosInstance from '../utils/axios';
import { useNavigate, useParams } from 'react-router-dom';

type Point = {
  x: number;
  y: number;
};

type Shape = {
  id: number;
  type: 'line' | 'rectangle' | 'polygon';
  points: Point[];
  name?: string;
  floorCount?: number;
  isClosed?: boolean;
};

const InteractiveImageUploader = () => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [UnitPlanName, setUnitPlanName] = useState('');
  const [Area, setUnitArea] = useState('');
  const [Cost, setUnitCost] = useState('');
  const [VRUrl, setUnitVRUrl] = useState('');
  const [Type, setSelectedType] = useState<string>('');
  const [isExistingFloorPlan, setIsExistingFloorPlan] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const navigate = useNavigate();
  const { project_id, unit_id } = useParams();


  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImageSrc(reader.result as string);
        setIsExistingFloorPlan(false); // Reset to false for new uploads
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    const fetchFloorPlan = async () => {      
      if (!unit_id) return;
      
      try {
        const response = await axiosInstance.get(`/api/units/${unit_id}/plan`);
        const { name, image_url } = response.data.unit.unit_plan;

        setUnitPlanName(name);

        // Load image
        const imageResp = await fetch(image_url);        
        const imageBlob = await imageResp.blob();
        const imageBase64 = await convertBlobToBase64(imageBlob);
        setImageSrc(imageBase64 as string);

        setIsExistingFloorPlan(true); // Set to true for existing Unit Plan
      } catch (err) {
        console.error("Error fetching Unit Plan data:", err);
        // setError("Failed to load Unit Plan data.");
      }
    };

    fetchFloorPlan();
  }, [project_id]);

  const convertBlobToBase64 = (blob: Blob): Promise<string | ArrayBuffer | null> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleTypeChange = (event: SelectChangeEvent<string>) => {
    const type = event.target.value;
    setSelectedType(type);// Reset floor selection
  };

  const handleSave = async () => {
    if (!imageSrc) {
      setError('Please upload an image');
      return;
    }

    if (!UnitPlanName.trim()) {
      setError('Please enter a unit plan name');
      return;
    }

    if (!Area.trim()) {
      setError('Please enter a unit plan area');
      return;
    }

    if (!Cost.trim()) {
      setError('Please enter a unit plan cost');
      return;
    }

    if (!Type.trim()) {
      setError('Please enter a unit plan type');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // Convert base64 image to Blob
      const imageBlob = await fetch(imageSrc).then(res => res.blob());
      
      // Create form data
      const formData = new FormData();
      formData.append('name', UnitPlanName);
      formData.append('image', imageBlob, 'unit_plan.jpg');
      formData.append('area', Area);
      formData.append('type', Type);
      formData.append('cost', Cost);
      formData.append('vr_url', VRUrl);
      formData.append('project_id', project_id as string);

      const response = await axiosInstance.post('/api/units/unitplan', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSuccess('Unit Plan saved successfully');
      // Reset form after successful save
      setUnitPlanName('');
      setImageSrc(null);
    } catch (err: any) {
      console.error('Save error:', err);
      setError(err.response?.data?.message || 'Error saving Unit Plan');
    } finally {
      setSaving(false);
    }
  };


  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 60}}>
        <Typography variant="h4">
          Manage Unit Plan
        </Typography>
        <Button
          // variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(`/projects/${project_id}/units`)}
        >
          Back to Unit
        </Button>
      </Box>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
          <Box sx={{ flex: '1 1 300px', minWidth: 0 }}>
            <TextField
              label="Unit Plan Name"
              value={UnitPlanName}
              onChange={(e) => setUnitPlanName(e.target.value)}
              required
              fullWidth
            />
          </Box>
          <Box sx={{ flex: '1 1 300px', minWidth: 0 }}>
            <TextField
              label="Area (sqft)"
              value={Area}
              onChange={(e) => setUnitArea(e.target.value)}
              required
              fullWidth
            />
          </Box>
          <Box sx={{ flex: '1 1 300px', minWidth: 0 }}>
            <TextField
              label="Cost"
              value={Cost}
              onChange={(e) => setUnitCost(e.target.value)}
              required
              fullWidth
            />
          </Box>
        </Box>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
          <Box sx={{ flex: '1 1 300px', minWidth: 0 }}>
            <TextField
              label="VR URL"
              value={VRUrl}
              onChange={(e) => setUnitVRUrl(e.target.value)}
              fullWidth
            />
          </Box>
          <Box sx={{ flex: '1 1 300px', minWidth: 0 }}>
            <FormControl fullWidth>
              <InputLabel id="unit-select-label">Select Type *</InputLabel>
              <Select
                labelId="unit-select-label"
                onChange={handleTypeChange}
                value={Type}
                label="Select Type"
                required
              >
                  <MenuItem key='1bhk' value='1 BHK'>1 BHK</MenuItem>
                  <MenuItem key='2bhk' value='2 BHK'>2 BHK</MenuItem>
                  <MenuItem key='3bhk' value='3 BHK'>3 BHK</MenuItem>
                  <MenuItem key='4bhk' value='4 BHK'>4 BHK</MenuItem>
                  <MenuItem key='5bhk' value='5 BHK'>5 BHK</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>
        {!unit_id && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }} >
            <input
              type="file"
              onChange={handleImageUpload}
              accept="image/*"
              style={{ display: 'none' }}
              id="floorplan-upload"
            />
            <label htmlFor="floorplan-upload">
              <Button
                variant="outlined"
                component="span"
                startIcon={<CloudUploadIcon />}
              >
                Upload Unit Plan Image
              </Button>
            </label>

            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              disabled={!imageSrc || saving || !UnitPlanName.trim() || !Area.trim() || !Cost.trim() || !Type.trim()}
            >
              {saving ? <CircularProgress size={24} /> : 'Save Unit Plan'}
            </Button>
          </Box>
        )}
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
      </Paper>

      <div style={{ position: 'relative', width: '100%', height: 'auto' }}>
        {imageSrc && (
          <>
            <img 
              src={imageSrc} 
              alt="Uploaded" 
              style={{ 
                width: '100%',
                height: 'auto',
                display: 'block',
                position: 'relative',
                zIndex: 1
              }} 
            />
          </>
        )}
      </div>
    </Box>
  );
};

export default InteractiveImageUploader;