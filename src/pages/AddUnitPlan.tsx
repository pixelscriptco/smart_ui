import React, { useRef, useState, useEffect } from 'react';
import { Box, Button, Typography, Paper, CircularProgress, Alert, ToggleButton, ToggleButtonGroup, IconButton, Tooltip, TextField, FormControl, InputLabel, Select, MenuItem, SelectChangeEvent, Dialog, DialogTitle, DialogContent, DialogActions, Divider } from '@mui/material';
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

  // Drawing types
  const [drawMode, setDrawMode] = useState<'line' | 'rectangle' | 'polygon'>('polygon');
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [drawing, setDrawing] = useState<Partial<Shape>>({});
  const [currentPolygon, setCurrentPolygon] = useState<Point[]>([]);
  const [currentPath, setCurrentPath] = useState<string>('');
  const [is3DModalOpen, setIs3DModalOpen] = useState(false);
  const [pendingPolygon, setPendingPolygon] = useState<Point[]>([]);
  const [uploaded3DImage, setUploaded3DImage] = useState<File | null>(null);
  const [selectedShapeId, setSelectedShapeId] = useState<number | null>(null);

  // Add state for image type and description
  const [balconyImageType, setBalconyImageType] = useState('3d');
  const [balconyImageName, setbalconyImageName] = useState('');

  // Add state for multiple balcony entries
  const [balconyEntries, setBalconyEntries] = useState<Array<{name: string, type: string}>>([]);


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

  // Drawing handlers
  const handleDoubleClick = (e: React.MouseEvent) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (drawMode === 'polygon') {
      setCurrentPolygon([{ x, y }]);
    } else {
      setDrawing({ type: drawMode, points: [{ x, y }] });
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (!svgRef.current || (!currentPolygon.length && !drawing.points)) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (drawMode === 'polygon' && currentPolygon.length > 0) {
      const startPoint = currentPolygon[0];
      const distance = Math.sqrt(Math.pow(x - startPoint.x, 2) + Math.pow(y - startPoint.y, 2));
      if (distance < 20 && currentPolygon.length > 2) {
        // Close polygon, open modal for 3D image
        const closedPolygon = [...currentPolygon, startPoint];
        setPendingPolygon(closedPolygon);
        setIs3DModalOpen(true);
      } else {
        setCurrentPolygon(prev => [...prev, { x, y }]);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;
    if (drawMode === 'polygon' && currentPolygon.length > 0) {
      const path = `M ${currentPolygon.map(p => `${p.x} ${p.y}`).join(' L ')} L ${currentX} ${currentY}`;
      setCurrentPath(path);
    } else if (drawing.points) {
      const startPoint = drawing.points[0];
      let path = '';
      if (drawing.type === 'line') {
        path = `M ${startPoint.x} ${startPoint.y} L ${currentX} ${currentY}`;
      } else if (drawing.type === 'rectangle') {
        const width = currentX - startPoint.x;
        const height = currentY - startPoint.y;
        path = `M ${startPoint.x} ${startPoint.y} h ${width} v ${height} h ${-width} z`;
      }
      setCurrentPath(path);
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!drawing.points || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;
    const id = Date.now();
    const newShape: Shape = {
      id,
      type: drawing.type || 'line',
      points: [...drawing.points, { x: currentX, y: currentY }],
    };
    setShapes((prev) => [...prev, newShape]);
    setDrawing({});
    setCurrentPath('');
    setSelectedShapeId(id);
    setUploaded3DImage(null);
    setIs3DModalOpen(true);
  };

  const handleUndo = () => {
    if (currentPolygon.length > 0) {
      setCurrentPolygon(prev => prev.slice(0, -1));
    } else if (shapes.length > 0) {
      setShapes(prev => prev.slice(0, -1));
    }
  };

  const renderShape = (shape: Shape) => {
    if (shape.type === 'polygon') {
      const pathData = `M ${shape.points.map(p => `${p.x} ${p.y}`).join(' L ')} Z`;
      return (
        <path
          key={shape.id}
          d={pathData}
          fill="rgba(0, 0, 255, 0.2)"
          stroke="blue"
          strokeWidth="2"
        />
      );
    } else if (shape.type === 'line') {
      const [start, end] = shape.points;
      return (
        <line
          key={shape.id}
          x1={start.x}
          y1={start.y}
          x2={end.x}
          y2={end.y}
          stroke="blue"
          strokeWidth="2"
        />
      );
    } else {
      const [start] = shape.points;
      const width = shape.points[1].x - start.x;
      const height = shape.points[1].y - start.y;
      return (
        <rect
          key={shape.id}
          x={start.x}
          y={start.y}
          width={width}
          height={height}
          fill="rgba(0, 0, 255, 0.2)"
          stroke="blue"
          strokeWidth="2"
        />
      );
    }
  };

  // 3D Image Modal
  const handle3DImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {    
    const file = e.target.files?.[0];
    
    if (file) {
      setUploaded3DImage(file);
    }
  };

  const handle3DModalClose = () => {
    setIs3DModalOpen(false);
    setPendingPolygon([]);
    setCurrentPolygon([]);
    setCurrentPath('');
  };

  const handle3DModalSubmit = () => {
    // Attach 3D image to the shape (for demo, just add to shapes array)
    if (pendingPolygon.length > 0) {
      const id = Date.now();
      setShapes(prev => [...prev, { id, type: 'polygon', points: pendingPolygon, isClosed: true, name: uploaded3DImage?.name }]);
    }
    // Add balcony entry to array
    setBalconyEntries(prev => [...prev, {
      name: balconyImageName,
      type: balconyImageType
    }]);
    
    // Reset form
    setbalconyImageName('');
    setBalconyImageType('3d');
    
    // Close modal
    handle3DModalClose();
  };

  const getDistancesFromSides = (
    point: { x: number; y: number },
    imageWidth: number,
    imageHeight: number
  ) => {
    return {
      left: point.x,
      right: imageWidth - point.x,
      top: point.y,
      bottom: imageHeight - point.y,
    };
  }

  const handleSave = async () => {
    if (!imageSrc || !svgRef.current) {
      setError('Please upload an image and draw at least one shape');
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
      
      const svgElement = svgRef.current;

      const img = document.querySelector('img');
      const svgWidth = img?.naturalWidth || 4000;
      const svgHeight = img?.naturalHeight || 2250;


      svgElement.querySelectorAll('desc[data-distance]').forEach(desc => desc.remove());

      // For each shape, add a <desc> tag with distances
      shapes.forEach(shape => {
        let point: { x: number; y: number };
        if (shape.type === 'polygon' || shape.type === 'line') {
          point = shape.points[0];
        } else {
          point = shape.points[0];
        }
        const distances = getDistancesFromSides(point, svgWidth, svgHeight);

        // Find the SVG element by id (name)
        const el = svgElement.querySelector(`#${CSS.escape(shape.name || '')}`);
        if (el) {
          const desc = document.createElementNS('http://www.w3.org/2000/svg', 'desc');
          desc.setAttribute('data-distance', 'true');
          desc.textContent = `left:${distances.left},right:${distances.right},top:${distances.top},bottom:${distances.bottom}`;
          el.appendChild(desc);
        }
      });
      const svgString = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml' });

      // Create form data
      const formData = new FormData();
      formData.append('name', UnitPlanName);
      formData.append('image', imageBlob, 'unit_plan.jpg');
      formData.append('svg', svgBlob, 'building.svg');
      formData.append('area', Area);
      formData.append('type', Type);
      formData.append('cost', Cost);
      formData.append('vr_url', VRUrl);
      formData.append('project_id', project_id as string);
      
      // Only append balcony image if it exists
      if (balconyEntries.length > 0) {
        formData.append('balcony_entries', JSON.stringify(balconyEntries));
      }

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
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 2 }}>
            {/* Left: Scale (drawing mode) and Undo */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
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
            {/* Right: Upload and Save buttons */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {/* <ToggleButtonGroup
                value={drawMode}
                exclusive
                onChange={(e, value) => {
                  if (value) {
                    setDrawMode(value);
                    setCurrentPolygon([]);
                    setDrawing({});
                  }
                }}
                aria-label="drawing mode"
              >
                <ToggleButton value="line" aria-label="draw line">
                  <LineIcon />
                </ToggleButton>
                <ToggleButton value="rectangle" aria-label="draw rectangle">
                  <RectangleIcon />
                </ToggleButton>
                <ToggleButton value="polygon" aria-label="draw polygon">
                  Polygon
                </ToggleButton>
              </ToggleButtonGroup> */}
              <Tooltip title="Undo last action">
                <IconButton 
                  onClick={handleUndo}
                  disabled={shapes.length === 0 && currentPolygon.length === 0}
                  color="primary"
                  sx={{ 
                    border: '1px solid',
                    borderColor: 'divider',
                    '&:hover': {
                      backgroundColor: 'action.hover'
                    }
                  }}
                >
                  <UndoIcon />
                </IconButton>
              </Tooltip>
            </Box>
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
            <svg
              ref={svgRef}
              onDoubleClick={handleDoubleClick}
              onClick={handleClick}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'auto',
                zIndex: 3
              }}
            >
              {shapes.map(renderShape)}
              {currentPath && (
                <path
                  d={currentPath}
                  fill="none"
                  stroke="blue"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                />
              )}
            </svg>
          </>
        )}
      </div>
      <Dialog open={is3DModalOpen} onClose={handle3DModalClose} maxWidth="md" fullWidth>
        <Paper sx={{ p: 3, borderRadius: 3, background: '#f8fafc' }}>
          <DialogTitle sx={{ fontWeight: 700, fontSize: 24, textAlign: 'center', pb: 1 }}>
            Upload 3D Image for this Unit
          </DialogTitle>
          <Divider sx={{ mb: 2 }} />
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, width: '100%', maxWidth: 400 }}>
              {/* Display existing balcony entries */}
              {balconyEntries.length > 0 && (
                <Box sx={{ width: '100%', mb: 2 }}>
                  <Typography variant="h6" sx={{ mb: 1 }}>Added Balconies:</Typography>
                  {balconyEntries.map((entry, index) => (
                    <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, border: '1px solid #ddd', borderRadius: 1, mb: 1 }}>
                      <Typography>{entry.name} ({entry.type})</Typography>
                      <Button 
                        size="small" 
                        color="error" 
                        onClick={() => setBalconyEntries(prev => prev.filter((_, i) => i !== index))}
                      >
                        Remove
                      </Button>
                    </Box>
                  ))}
                </Box>
              )}
              
              <FormControl fullWidth>
                <InputLabel id="balcony-image-type-label">Image Type</InputLabel>
                <Select
                  labelId="balcony-image-type-label"
                  value={balconyImageType}
                  label="Image Type"
                  onChange={e => setBalconyImageType(e.target.value)}
                  sx={{ mb: 2, borderRadius: 2 }}
                >
                  <MenuItem value="3d">3D</MenuItem>
                  <MenuItem value="normal">Normal</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Name of the balcony"
                value={balconyImageName}
                onChange={e => setbalconyImageName(e.target.value)}
                fullWidth
                sx={{ mb: 2, borderRadius: 2 }}
              />
              {/* <CloudUploadIcon sx={{ fontSize: 48, color: '#1976d2', mb: 1 }} />
              <Button
                variant="outlined"
                component="label"
                sx={{ borderRadius: 2, fontWeight: 500, px: 4, py: 1.5 }}
              >
                Choose 3D File
                <input type="file" accept=".glb,.obj,image/*" hidden onChange={handle3DImageUpload} />
              </Button>
              {uploaded3DImage && (
                <Typography variant="body2" sx={{ mt: 1, color: '#1976d2', fontWeight: 500 }}>
                  Selected: {uploaded3DImage.name}
                </Typography>
              )}
              <Typography variant="caption" sx={{ color: 'text.secondary', mt: 1 }}>
                Supported: .glb, .obj, images
              </Typography> */}
            </Box>
          </DialogContent>
          <DialogActions sx={{ justifyContent: 'center', gap: 2, mt: 2 }}>
            <Button onClick={handle3DModalClose} variant="outlined" sx={{ borderRadius: 2, px: 4, fontWeight: 500 }}>Cancel</Button>
            <Button onClick={handle3DModalSubmit} disabled={!balconyImageName} variant="contained" sx={{ borderRadius: 2, px: 4, fontWeight: 500 }}>Attach</Button>
          </DialogActions>
        </Paper>
      </Dialog>
    </Box>
  );
};

export default InteractiveImageUploader;