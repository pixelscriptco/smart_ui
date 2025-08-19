import React, { useRef, useState, useEffect } from 'react';
import { Box, Button, Typography, Paper, CircularProgress, Alert, ToggleButton, ToggleButtonGroup, IconButton, Tooltip, TextField, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { CloudUpload as CloudUploadIcon, Save as SaveIcon, Straighten as LineIcon, Rectangle as RectangleIcon, Undo as UndoIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import axiosInstance from '../utils/axios';
import { useNavigate, useParams } from 'react-router-dom';
import NameInputModal from '../components/NameInputModal';

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
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [hoveredName, setHoveredName] = useState<string | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [drawing, setDrawing] = useState<Partial<Shape>>({});
  const [currentPath, setCurrentPath] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [drawMode, setDrawMode] = useState<'line' | 'rectangle'>('line');
  const [currentPolygon, setCurrentPolygon] = useState<Point[]>([]);
  const [FloorPlanName, setFloorPlanName] = useState('');
  const [isExistingFloorPlan, setIsExistingFloorPlan] = useState(false);
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const navigate = useNavigate();
  const { project_id, floor_id } = useParams();
  const [isNameModalOpen, setIsNameModalOpen] = useState(false);
  const [pendingPolygon, setPendingPolygon] = useState<Point[]>([]);
  const [floorPlans, setFloorPlans] = useState<any[]>([]);
  const [selectedFloorPlanId, setSelectedFloorPlanId] = useState<string>('');

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

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (drawMode === 'line') {
      // Start a new polygon on double click
      setCurrentPolygon([{ x, y }]);
    } else {
      // Start drawing rectangle on double click
      setDrawing({ type: drawMode, points: [{ x, y }] });
    }
  };

  useEffect(() => {
    const fetchFloorPlan = async () => {      
      if (!floor_id) return;
      
      try {
        const response = await axiosInstance.get(`/api/floors/${floor_id}/plan`);
        const { name, image_url, svg_url } = response.data.floor.floor_plan;

        setFloorPlanName(name);

        // Load image
        const imageResp = await fetch(image_url);        
        const imageBlob = await imageResp.blob();
        const imageBase64 = await convertBlobToBase64(imageBlob);
        setImageSrc(imageBase64 as string);

        // Load SVG content
        const svgResp = await fetch(svg_url);
        const svgText = await svgResp.text();
        setSvgContent(svgText);
        setIsExistingFloorPlan(true); // Set to true for existing Floor Plan
      } catch (err) {
        console.error("Error fetching Floor Plan data:", err);
        // setError("Failed to load Floor Plan data.");
      }
    };

    fetchFloorPlan();
  }, [project_id]);

  useEffect(() => {
    const fetchFloorPlans = async () => {
      if (!project_id) return;
      try {
        const response = await axiosInstance.get(`/api/projects/${project_id}/floor-plans`);
        setFloorPlans(response.data.floor_plans || []);
      } catch (err) {
        console.error('Error fetching floor plans:', err);
      }
    };
    fetchFloorPlans();
  }, [project_id]);

  const convertBlobToBase64 = (blob: Blob): Promise<string | ArrayBuffer | null> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleClick = (e: React.MouseEvent) => {
    if (!svgRef.current || (!currentPolygon.length && !drawing.points)) return;
  
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
  
    if (drawMode === 'line' && currentPolygon.length > 0) {
      const startPoint = currentPolygon[0];
      const distance = Math.sqrt(Math.pow(x - startPoint.x, 2) + Math.pow(y - startPoint.y, 2));
  
      if (distance < 20) {
        // Close polygon, show modal for name
        const closedPolygon = [...currentPolygon, startPoint];
        setPendingPolygon(closedPolygon);
        setIsNameModalOpen(true);
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
    
    if (drawMode === 'line' && currentPolygon.length > 0) {
      // Create path for the current polygon being drawn
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
        path = `M ${startPoint.x} ${startPoint.y} 
                h ${width} 
                v ${height} 
                h ${-width} 
                z`;
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
  };

  const handleShapeClick = (id: number) => {
    const name = prompt("Enter unit number:");
    if (name) {
      // Validate that the input is a number
      const unitNumber = parseInt(name);
      if (isNaN(unitNumber)) {
        alert("Please enter a valid number");
        return;
      }
      
      setShapes((prevShapes) =>
        prevShapes.map((shape) =>
          shape.id === id ? { ...shape, name: unitNumber.toString() } : shape
        )
      );
    }
  };

  const handleMouseOver = (e: React.MouseEvent, name?: string, id?: string) => {
    if (!name) return;
    setHoveredName(`${name}`);
    setHoverPos({ x: e.clientX + 10, y: e.clientY + 10 });
  };

  const handleMouseOut = () => {
    setHoveredName(null);
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

    if (!FloorPlanName.trim()) {
      setError('Please enter a floor plan name');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // Convert base64 image to Blob
      const imageBlob = await fetch(imageSrc).then(res => res.blob());
      
      // Get SVG data
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
      formData.append('name', FloorPlanName);
      formData.append('image', imageBlob, 'floor_plan.jpg');
      formData.append('svg', svgBlob, 'floor_plan.svg');
      formData.append('project_id', project_id as string);
      
      // Convert shapes to include unit numbers as IDs
      const shapesWithUnitIds = shapes.map(shape => {
        
        const unitId = shape.name ? parseInt(shape.name) : undefined;
        return {
          ...shape,
          unit_id: unitId
        };
      });
      
      formData.append('units',shapes.length.toString());

      const response = await axiosInstance.post('/api/floors/floorplan', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSuccess('Floor Plan saved successfully');
      setFloorPlanName('');
      setShapes([]);
      setImageSrc(null);
    } catch (err: any) {
      console.error('Save error:', err);
      setError(err.response?.data?.message || 'Error saving Floor Plan');
    } finally {
      setSaving(false);
    }
  };

  const handleUndo = () => {
    if (currentPolygon.length > 0) {
      // If we're currently drawing a polygon, remove the last point
      setCurrentPolygon(prev => prev.slice(0, -1));
    } else if (shapes.length > 0) {
      // If we have shapes, remove the last one
      setShapes(prev => prev.slice(0, -1));
    }
  };

  const handleSelectFloorPlan = async (floorPlanId: string) => {
    setSelectedFloorPlanId(floorPlanId);
    try {
      const response = await axiosInstance.get(`/api/floor-plans/${floorPlanId}`);
      const { name, image_url, svg_url } = response.data.floor_plan;
      setFloorPlanName(name);
      // Load image
      const imageResp = await fetch(image_url);
      const imageBlob = await imageResp.blob();
      const imageBase64 = await convertBlobToBase64(imageBlob);
      setImageSrc(imageBase64 as string);
      // Load SVG content
      const svgResp = await fetch(svg_url);
      const svgText = await svgResp.text();
      setSvgContent(svgText);
      setIsExistingFloorPlan(true);
    } catch (err) {
      console.error('Error loading selected floor plan:', err);
    }
  };

  const renderShape = (shape: Shape) => {    
    if (shape.type === 'polygon') {
      const pathData = `M ${shape.points.map(p => `${p.x} ${p.y}`).join(' L ')} Z`;
      return (
        <path
          key={shape.id}
          id={shape.name}
          d={pathData}
          fill="rgba(0, 255, 0, 0.3)"
          stroke="green"
          strokeWidth="2"
          onClick={() => handleShapeClick(shape.id)}
          onMouseOver={(e) => handleMouseOver(e, shape.name, shape.id.toString())}
          onMouseOut={handleMouseOut}
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
          stroke="green"
          strokeWidth="2"
          onClick={() => handleShapeClick(shape.id)}
          onMouseOver={(e) => handleMouseOver(e, shape.name, shape.id.toString())}
          onMouseOut={handleMouseOut}
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
          fill="rgba(0, 255, 0, 0.3)"
          stroke="green"
          strokeWidth="2"
          onClick={() => handleShapeClick(shape.id)}
          onMouseOver={(e) => handleMouseOver(e, shape.name, shape.id.toString())}
          onMouseOut={handleMouseOut}
        />
      );
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 4 }}>
        <Typography variant="h4">
          Manage Floor Plan
        </Typography>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(`/projects/${project_id}/floors`)}
        >
          Back to Floors
        </Button>
      </Box>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
          <TextField
            label="Floor Plan Name"
            value={FloorPlanName}
            onChange={(e) => setFloorPlanName(e.target.value)}
            required
            fullWidth
          />
        </Box>
        {!floor_id && (
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
                Upload Floor Plan Image
              </Button>
            </label>

            {/* <ToggleButtonGroup
              value={drawMode}
              exclusive
              onChange={(e, value) => {
                if (value) {
                  setDrawMode(value);
                  setCurrentPolygon([]);
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

            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              disabled={!imageSrc || shapes.length === 0 || saving || !FloorPlanName.trim()}
            >
              {saving ? <CircularProgress size={24} /> : 'Save Floor Plan'}
            </Button>

            {/* Floor Plan Dropdown */}
            {/* <FormControl sx={{ minWidth: 220, ml: 2 }} size="small">
              <InputLabel>Floor Plans</InputLabel>
              <Select
                value={selectedFloorPlanId}
                label="Floor Plans"
                onChange={(e) => handleSelectFloorPlan(e.target.value)}
              >
                <MenuItem value="">Select Floor Plan</MenuItem>
                {floorPlans.map((plan) => (
                  <MenuItem key={plan.id} value={plan.id}>{plan.name}</MenuItem>
                ))}
              </Select>
            </FormControl> */}
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
            {isExistingFloorPlan && svgContent && (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  zIndex: 2,
                  pointerEvents: 'none'
                }}
                dangerouslySetInnerHTML={{ __html: svgContent }}
              />
            )}
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
                  stroke="green"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                  onMouseOver={(e) => handleMouseOver(e, "Drawing in progress", "temp-" + Date.now())}
                  onMouseOut={handleMouseOut}
                />
              )}
            </svg>
          </>
        )}
        {hoveredName && (
          <div
            style={{
              position: 'fixed',
              top: hoverPos.y,
              left: hoverPos.x,
              background: 'white',
              padding: '6px 12px',
              border: '1px solid #ccc',
              borderRadius: '6px',
              boxShadow: '0px 2px 6px rgba(0,0,0,0.2)',
              zIndex: 1000,
            }}
          >
            {hoveredName}
          </div>
        )}
      </div>

      <NameInputModal
        isOpen={isNameModalOpen}
        title='Enter floor details'
        onClose={() => {
          setIsNameModalOpen(false);
          setPendingPolygon([]);
          setCurrentPath('');
          setCurrentPolygon([]);
        }}
        onSubmit={(name: string, floorCount: number) => {
          const newShape: Shape = {
            id: Date.now(),
            type: 'polygon',
            points: pendingPolygon,
            isClosed: true,
            name: name,
            floorCount: floorCount 
          };
          setShapes(prev => [...prev, newShape]);
          setPendingPolygon([]);
          setCurrentPolygon([]);
          setCurrentPath('');
          setIsNameModalOpen(false);
        }}
      />

    </Box>
  );
};

export default InteractiveImageUploader;
