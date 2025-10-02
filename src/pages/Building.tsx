import React, { useRef, useState, useEffect } from 'react';
import { Box, Button, Typography, Paper, CircularProgress, Alert, ToggleButton, ToggleButtonGroup, IconButton, Tooltip, TextField } from '@mui/material';
import { CloudUpload as CloudUploadIcon, Save as SaveIcon, Straighten as LineIcon, Rectangle as RectangleIcon, Undo as UndoIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import axiosInstance from '../utils/axios';
import { useNavigate, useParams } from 'react-router-dom';
import NameFloorInputModal from '../components/NameFloorInputModal';

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
  const [buildingName, setBuildingName] = useState('');
  const [isExistingBuilding, setIsExistingBuilding] = useState(false);
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [existingShapes, setExistingShapes] = useState<Shape[]>([]);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const navigate = useNavigate();
  const { project_id } = useParams();
  const [isNameModalOpen, setIsNameModalOpen] = useState(false);
  const [pendingPolygon, setPendingPolygon] = useState<Point[]>([]);


  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new window.Image();
        img.onload = () => {
          if (img.width === 4000 && img.height === 2250) {
            setImageSrc(reader.result as string);
            setIsExistingBuilding(false); // Reset to false for new uploads
            setError(null);
            setShapes([]);
            setSvgContent('');
            svgRef.current?.querySelectorAll('path, line, rect').forEach(el => el.remove());
          } else {
            setError('Image must be exactly 4000 x 2250 pixels.');
            setImageSrc(null);
          }
        };
        img.onerror = () => {
          setError('Invalid image file.');
          setImageSrc(null);
        };
        img.src = reader.result as string;
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
    const fetchBuilding = async () => {
      if (!project_id) return;
      
      try {
        const response = await axiosInstance.get(`/api/buildings/${project_id}`);
        if(response.data.buildings.length === 0) {
          setIsExistingBuilding(false);
          return;
        }
        const { name, image_url, svg_url } = response.data.buildings[0];

        setBuildingName(name);

        // Load image
        const imageResp = await fetch(image_url);        
        const imageBlob = await imageResp.blob();
        const imageBase64 = await convertBlobToBase64(imageBlob);
        setImageSrc(imageBase64 as string);

        // Load SVG content
        const svgResp = await fetch(svg_url);
        const svgText = await svgResp.text();
        setSvgContent(svgText);

        // Parse SVG content to extract shapes
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
        const paths = svgDoc.querySelectorAll('path');
        const lines = svgDoc.querySelectorAll('line');
        const rects = svgDoc.querySelectorAll('rect');

        const parsedShapes: Shape[] = [];

        // Parse paths (polygons)
        paths.forEach((path, index) => {
          const d = path.getAttribute('d');
          if (d) {
            const points = parsePathToPoints(d);
            
            // Calculate center point for distance calculation
            const centerX = points.reduce((sum, p) => sum + p.x, 0) / points.length;
            const centerY = points.reduce((sum, p) => sum + p.y, 0) / points.length;
            const distances = getDistancesFromSides({ x: centerX, y: centerY }, 4000, 2250);
            console.log(distances);
            
            // Add distance data to the SVG element
            const desc = document.createElementNS('http://www.w3.org/2000/svg', 'desc');
            desc.setAttribute('data-distance', 'true');
            desc.textContent = `left:${distances.left.toFixed(2)},right:${distances.right.toFixed(2)},top:${distances.top.toFixed(2)},bottom:${distances.bottom.toFixed(2)}`;
            path.appendChild(desc);
            
            parsedShapes.push({
              id: Date.now() + index,
              type: 'polygon',
              points,
              name: path.id,
              isClosed: true
            });
          }
        });

        // Parse lines
        lines.forEach((line, index) => {
          const x1 = parseFloat(line.getAttribute('x1') || '0');
          const y1 = parseFloat(line.getAttribute('y1') || '0');
          const x2 = parseFloat(line.getAttribute('x2') || '0');
          const y2 = parseFloat(line.getAttribute('y2') || '0');
          
          // Calculate midpoint for distance calculation
          const midX = (x1 + x2) / 2;
          const midY = (y1 + y2) / 2;
          const distances = getDistancesFromSides({ x: midX, y: midY }, 4000, 2250);
          
          // Add distance data to the SVG element
          const desc = document.createElementNS('http://www.w3.org/2000/svg', 'desc');
          desc.setAttribute('data-distance', 'true');
          desc.textContent = `left:${distances.left.toFixed(2)},right:${distances.right.toFixed(2)},top:${distances.top.toFixed(2)},bottom:${distances.bottom.toFixed(2)}`;
          line.appendChild(desc);
          
          parsedShapes.push({
            id: Date.now() + index + paths.length,
            type: 'line',
            points: [
              { x: x1, y: y1 },
              { x: x2, y: y2 }
            ],
            name: line.id
          });
        });

        // Parse rectangles
        rects.forEach((rect, index) => {
          const x = parseFloat(rect.getAttribute('x') || '0');
          const y = parseFloat(rect.getAttribute('y') || '0');
          const width = parseFloat(rect.getAttribute('width') || '0');
          const height = parseFloat(rect.getAttribute('height') || '0');
          
          // Calculate center point for distance calculation
          const centerX = x + width / 2;
          const centerY = y + height / 2;
          const distances = getDistancesFromSides({ x: centerX, y: centerY }, 4000, 2250);
          
          // Add distance data to the SVG element
          const desc = document.createElementNS('http://www.w3.org/2000/svg', 'desc');
          desc.setAttribute('data-distance', 'true');
          desc.textContent = `left:${distances.left.toFixed(2)},right:${distances.right.toFixed(2)},top:${distances.top.toFixed(2)},bottom:${distances.bottom.toFixed(2)}`;
          rect.appendChild(desc);
          
          parsedShapes.push({
            id: Date.now() + index + paths.length + lines.length,
            type: 'rectangle',
            points: [
              { x, y },
              { x: x + width, y: y + height }
            ],
            name: rect.id
          });
        });

        setExistingShapes(parsedShapes);
        
        // Update SVG content with distance data
        const updatedSvgString = new XMLSerializer().serializeToString(svgDoc);
        setSvgContent(updatedSvgString);
        
        setIsExistingBuilding(true);
      } catch (err) {
        console.error("Error fetching building data:", err);
      }
    };

    fetchBuilding();
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
    const name = prompt("Enter name for this tower:");
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

    if (!buildingName.trim()) {
      setError('Please enter a building name');
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
      const svgWidth = 4000; // Your image is always 4000x2250
      const svgHeight = 2250;


      svgElement.querySelectorAll('desc[data-distance]').forEach(desc => desc.remove());

      // For each shape, add a <desc> tag with distances
      shapes.forEach(shape => {
        let point: { x: number; y: number };
        
        // Calculate distances for different shape types
        if (shape.type === 'polygon') {
          // For polygons, use the center point
          const centerX = shape.points.reduce((sum, p) => sum + p.x, 0) / shape.points.length;
          const centerY = shape.points.reduce((sum, p) => sum + p.y, 0) / shape.points.length;
          point = { x: centerX, y: centerY };
        } else if (shape.type === 'line') {
          // For lines, use the midpoint
          const [start, end] = shape.points;
          point = { 
            x: (start.x + end.x) / 2, 
            y: (start.y + end.y) / 2 
          };
        } else if (shape.type === 'rectangle') {
          // For rectangles, use the center
          const [start, end] = shape.points;
          point = { 
            x: (start.x + end.x) / 2, 
            y: (start.y + end.y) / 2 
          };
        } else {
          point = shape.points[0];
        }
        
        const distances = getDistancesFromSides(point, svgWidth, svgHeight);

        // Find the SVG element by id (name)
        const el = svgElement.querySelector(`#${CSS.escape(shape.name || '')}`);
        if (el) {
          const desc = document.createElementNS('http://www.w3.org/2000/svg', 'desc');
          desc.setAttribute('data-distance', 'true');
          desc.textContent = `left:${distances.left.toFixed(2)},right:${distances.right.toFixed(2)},top:${distances.top.toFixed(2)},bottom:${distances.bottom.toFixed(2)}`;
          el.appendChild(desc);
        }
      });

      // Get SVG data
      const svgString = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml' });
      
      // Create form data
      const formData = new FormData();
      formData.append('name', buildingName);
      // formData.append('towers', JSON.stringify(pathIds));
      formData.append('image', imageBlob, 'building.jpg');
      formData.append('svg', svgBlob, 'building.svg');
      formData.append('project_id', project_id as string);

      formData.append('towers', JSON.stringify(shapes));

      const response = await axiosInstance.post('/api/buildings', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSuccess('Building saved successfully');
      // Reset form after successful save
      // setBuildingName('');
      // setShapes([]);
      // setImageSrc(null);
    } catch (err: any) {
      console.error('Save error:', err);
      setError(err.response?.data?.message || 'Error saving building');
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

  // Helper function to parse SVG path to points
  const parsePathToPoints = (pathData: string): Point[] => {
    const points: Point[] = [];
    const commands = pathData.split(/(?=[MLHVCSQTAZmlhvcsqtaz])/);
    
    commands.forEach(cmd => {
      const type = cmd[0];
      const coords = cmd.slice(1).trim().split(/[\s,]+/).map(Number);
      
      if (type === 'M' || type === 'L') {
        points.push({ x: coords[0], y: coords[1] });
      }
    });
    
    return points;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 60}}>
        <Typography variant="h4">
          Manage Project Details
        </Typography>
        <Button
          // variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(`/projects/${project_id}`)}
        >
          Back to Project
        </Button>
      </Box>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
          <TextField
            label="Building Name"
            value={buildingName}
            onChange={(e) => setBuildingName(e.target.value)}
            required
            fullWidth
          />
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
              Upload Building Image
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
            disabled={!imageSrc || shapes.length === 0 || saving || !buildingName.trim()}
          >
            {saving ? <CircularProgress size={24} /> : 'Save Building'}
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
              {existingShapes.map(renderShape)}
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

      <NameFloorInputModal
        isOpen={isNameModalOpen}
        title='Enter tower details'
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
