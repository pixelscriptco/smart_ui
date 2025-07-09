import React, { useRef, useState, useEffect } from 'react';
import { Box, Button, Typography, Paper, CircularProgress, Alert, ToggleButton, ToggleButtonGroup, IconButton, Tooltip, InputLabel,Select, MenuItem } from '@mui/material';
import { CloudUpload as CloudUploadIcon, Save as SaveIcon, Straighten as LineIcon, Rectangle as RectangleIcon, Undo as UndoIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import axiosInstance from '../utils/axios';
import { useNavigate, useParams } from 'react-router-dom';
import { SelectChangeEvent } from '@mui/material/Select';

type Point = {
  x: number;
  y: number;
};

type Shape = {
  id: number;
  type: 'line' | 'rectangle' | 'polygon';
  points: Point[];
  name?: string;
  isClosed?: boolean;
  floorCount?: number;
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
  const [towerName, setTowerName] = useState('');
  const [floorCount, setFloorCount] = useState(0);
  const [orderNumber, setOrderNumber] = useState<number>(0);
  const [isExistingTower, setIsExistingTower] = useState(false);
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const navigate = useNavigate();
  const { tower_id, project_id } = useParams();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImageSrc(reader.result as string);
        setIsExistingTower(false); // Reset to false for new uploads
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
    const fetchTower = async () => {
      if (!tower_id) return;
      
      try {
        const response = await axiosInstance.get(`/api/towers/${tower_id}`);
        const { name, floor_count, tower_plans } = response.data.tower;

        setTowerName(name);
        setFloorCount(floor_count);

        if (tower_plans.length > 0) {
          const { image_url, svg_url } = tower_plans[0];
          // Load image
          const imageResp = await fetch(image_url);        
          const imageBlob = await imageResp.blob();
          const imageBase64 = await convertBlobToBase64(imageBlob);
          setImageSrc(imageBase64 as string);

          // Load SVG content
          const svgResp = await fetch(svg_url);
          const svgText = await svgResp.text();
          setSvgContent(svgText);
          setIsExistingTower(true); // Set to true for existing building
        }
      } catch (err) {
        console.error("Error fetching tower data:", err);
        // setError("Failed to load building data.");
      }
    };

    fetchTower();
  }, [tower_id]);

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
      const distance = Math.sqrt(
        Math.pow(x - startPoint.x, 2) + Math.pow(y - startPoint.y, 2)
      );

      if (distance < 20) { // Close the polygon if within 20 pixels of start
        if (towerName && floorCount > 0) {
          const newShape: Shape = {
            id: Date.now(),
            type: 'polygon',
            points: [...currentPolygon, startPoint],
            isClosed: true,
            name: towerName,
            floorCount: floorCount
          };
          setShapes(prev => [...prev, newShape]);
          setCurrentPolygon([]);
          setCurrentPath(''); // Remove the dashed line
        } else {
          // If no tower name or floor count, remove the current polygon
          setCurrentPolygon([]);
          setCurrentPath(''); // Remove the dashed line
        }
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

    if (drawing.type === 'rectangle') {
      const startPoint = drawing.points[0];
      const newShape: Shape = {
        id,
        type: 'rectangle',
        points: [
          startPoint,
          { x: currentX, y: startPoint.y },
          { x: currentX, y: currentY },
          { x: startPoint.x, y: currentY }
        ],
      };
      setShapes((prev) => [...prev, newShape]);
    } else {
      const newShape: Shape = {
        id,
        type: drawing.type || 'line',
        points: [...drawing.points, { x: currentX, y: currentY }],
      };
      setShapes((prev) => [...prev, newShape]);
    }
    setDrawing({});
    setCurrentPath('');
  };

  const handleShapeClick = (id: number) => {
    const name = prompt("Enter name for this area:");
    if (name) {
      setShapes((prevShapes) =>
        prevShapes.map((shape) =>
          shape.id === id ? { ...shape, name } : shape
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

  const handleSave = async () => {
    if (!imageSrc || !svgRef.current) {
      setError('Please upload an image and draw at least one shape');
      return;
    }

    if (!towerName.trim()) {
      setError('Please enter a tower name');
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
      const svgString = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml' });
      // const pathIds = Array.from(svgElement.querySelectorAll('path'))
      //                  .map(el => el.id)
      //                  .filter(Boolean);         
      
      // Create form data
      const formData = new FormData();
      formData.append('name', towerName);
      formData.append('order',orderNumber.toString());
      formData.append('floors', JSON.stringify(shapes));
      formData.append('image', imageBlob, 'building.jpg');
      formData.append('svg', svgBlob, 'building.svg');
      formData.append('tower_id', tower_id as string);

      await axiosInstance.post('/api/towers', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSuccess('Tower saved successfully');
      // Reset form after successful save
      setTowerName('');
      setOrderNumber(0);
      setShapes([]);
      setImageSrc(null);
    } catch (err: any) {
      console.error('Save error:', err);
      setError(err.response?.data?.message || 'Error saving tower');
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

  const calculateHorizontalLines = (points: Point[], floorCount: number) => {
    const lines: Point[][] = [];
    
    // Find the bounding box of the polygon
    const minX = Math.min(...points.map(p => p.x));
    const maxX = Math.max(...points.map(p => p.x));
    const minY = Math.min(...points.map(p => p.y));
    const maxY = Math.max(...points.map(p => p.y));
    
    // Calculate spacing between lines
    const spacing = (maxY - minY) / (floorCount);
    
    // Generate horizontal lines from bottom to top
    for (let i = 0; i < floorCount+1; i++) {
      const y = maxY - (spacing * i); // Start from bottom (maxY) and go up
      lines.push([
        { x: minX, y: y },
        { x: maxX, y: y }
      ]);
    }
    
    return lines;
  };

  // Add new function to create floor paths
  const createFloorPaths = (points: Point[], horizontalLines: Point[][]) => {
    const paths: string[] = [];
    const minX = Math.min(...points.map(p => p.x));
    const maxX = Math.max(...points.map(p => p.x));

    // Create a path for each floor section
    for (let i = 0; i < horizontalLines.length - 1; i++) {
      const topLine = horizontalLines[i];
      const bottomLine = horizontalLines[i + 1];
      
      // Create path for this floor section
      const path = `M ${minX} ${topLine[0].y} 
                   L ${maxX} ${topLine[0].y}
                   L ${maxX} ${bottomLine[0].y}
                   L ${minX} ${bottomLine[0].y}
                   Z`;
      paths.push(path);
    }

    return paths;
  };

  const renderShape = (shape: Shape) => {
    if (shape.type === 'polygon') {
      const pathData = `M ${shape.points.map(p => `${p.x} ${p.y}`).join(' L ')} Z`;
      const elements = [
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
      ];

      // Add horizontal lines and floor paths if floorCount exists
      if (shape.floorCount && shape.points.length >= 3) {
        const horizontalLines = calculateHorizontalLines(shape.points, shape.floorCount);
        
        // Create paths for each floor section
        const floorPaths = createFloorPaths(shape.points, horizontalLines);
        
        // Add floor paths
        floorPaths.forEach((path, index) => {
          elements.push(
            <path
              key={`${shape.id}-floor-${index}`}
              id={`floor-${index + 1}`}
              d={path}
              fill="rgba(0, 0, 255, 0.1)"
              stroke="blue"
              strokeWidth="1"
            />
          );
        });
      }

      return elements;
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
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 60}}>
        <Typography variant="h4">
          Manage Tower Details - {towerName}
        </Typography>
        <Button
          // variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(`/projects/${project_id}/towers`)}
        >
          Back to Towers
        </Button>
      </Box>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
          <InputLabel id="order-number-label">Order Number</InputLabel>
          <Select
            labelId="order-number-label"
            value={orderNumber.toString()}
            onChange={(e: SelectChangeEvent) =>
              setOrderNumber(Number(e.target.value))
            }
            required
            fullWidth
          >
            {[0, 1, 2, 3, 4, 5, 6].map((num) => (
            <MenuItem key={num} value={num}>
              {num}
            </MenuItem>
          ))}
          </Select>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
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
              Upload Tower Image
            </Button>
          </label>

          <ToggleButtonGroup
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
          </ToggleButtonGroup>

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
            disabled={!imageSrc || shapes.length === 0 || saving || !towerName.trim()}
          >
            {saving ? <CircularProgress size={24} /> : 'Save Tower'}
          </Button>
        </Box>

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
            {isExistingTower && svgContent && (
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
    </Box>
  );
};

export default InteractiveImageUploader;
