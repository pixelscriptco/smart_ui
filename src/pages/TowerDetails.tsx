import React, { useRef, useState, useEffect } from 'react';
import { Box, Button, Typography, Paper, CircularProgress, Alert, ToggleButton, ToggleButtonGroup, IconButton, Tooltip, InputLabel,Select, MenuItem, Modal } from '@mui/material';
import { CloudUpload as CloudUploadIcon, Save as SaveIcon, Straighten as LineIcon, Rectangle as RectangleIcon, Undo as UndoIcon, ArrowBack as ArrowBackIcon, Create as CreateIcon, ShowChart as ShowChartIcon, Layers as LayersIcon } from '@mui/icons-material';
import axiosInstance from '../utils/axios';
import { useNavigate, useParams } from 'react-router-dom';
import { SelectChangeEvent } from '@mui/material/Select';
import TextField from '@mui/material/TextField';

type Point = {
  x: number;
  y: number;
};

type ConnectingLine = {
  id: number;
  startPoint: Point;
  endPoint: Point;
  color: string;
  floorNumber?: number; // Add floor number property
};

type Shape = {
  id: number;
  type: 'line' | 'rectangle' | 'polygon' | 'freeform' | 'simple-line';
  points: Point[];
  name?: string;
  isClosed?: boolean;
  floorCount?: number;
  internalPoints?: Point[];
  borderPoints?: Point[];
  connectingLines?: ConnectingLine[];
  parts?: { id: string; points: Point[] }[]; // id is string
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
  const [drawMode, setDrawMode] = useState<'line' | 'rectangle' | 'freeform' | 'simple-line'>('line');
  const [currentPolygon, setCurrentPolygon] = useState<Point[]>([]);
  const [currentFreeform, setCurrentFreeform] = useState<Point[]>([]);
  const [towerName, setTowerName] = useState('');
  const [floorCount, setFloorCount] = useState(0);
  const [orderNumber, setOrderNumber] = useState<number>(0);
  const [isExistingTower, setIsExistingTower] = useState(false);
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [direction, setDirection] = useState('');
  const svgRef = useRef<SVGSVGElement>(null);
  const navigate = useNavigate();
  const { tower_id, project_id } = useParams();
  const [internalPointsMap, setInternalPointsMap] = useState<{ [polygonId: number]: Point[] }>({});
  const [enableFloorPartitioning, setEnableFloorPartitioning] = useState(false);
  const [floorModalOpen, setFloorModalOpen] = useState(false);
  const [pendingFloorShapeId, setPendingFloorShapeId] = useState<number | null>(null);
  const [pendingLineId, setPendingLineId] = useState<number | null>(null);
  const [pendingFloorValue, setPendingFloorValue] = useState('');
  const newLineIdRef = useRef<number | null>(null);

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

    // Double-click only starts drawing
    if (drawMode === 'line' && currentPolygon.length === 0) {
      // Start drawing a polygon
      setCurrentPolygon([{ x, y }]);
    } else if (drawMode === 'freeform' && currentFreeform.length === 0) {
      // Start new freeform shape
      setCurrentFreeform([{ x, y }]);
    } else if (drawMode === 'simple-line' && !drawing.points) {
      // Start simple line drawing
      setDrawing({ type: drawMode, points: [{ x, y }] });
    } else if (drawMode === 'rectangle' && !drawing.points) {
      // Start rectangle drawing
      setDrawing({ type: drawMode, points: [{ x, y }] });
    }
  };

  const fetchTower = async (orderParam = orderNumber) => {
    if (!tower_id) return;
    
    try {
      const response = await axiosInstance.get(`/api/towers/${tower_id}?order=${orderParam}`);
      const { name, floor_count, tower_plans } = response.data.tower;

      setTowerName(name);
      setFloorCount(floor_count);
      setImageSrc('');
      setSvgContent('');
      setIsExistingTower(false);
      if (tower_plans.length > 0) {
        const { image_url, svg_url,order,direction } = tower_plans[0];
        setOrderNumber(Number(order));
        setDirection(direction)

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

  useEffect(() => {
    fetchTower(orderNumber);
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
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Only handle clicks if we're already drawing a shape
    if (drawMode === 'line' && currentPolygon.length > 0) {
      // Continue drawing polygon
      const startPoint = currentPolygon[0];
      const distance = Math.sqrt(
        Math.pow(x - startPoint.x, 2) + Math.pow(y - startPoint.y, 2)
      );

      if (distance < 20 && currentPolygon.length > 2) { // Close the polygon if within 20 pixels of start
        if (towerName) {
          const newShape: Shape = {
            id: Date.now(),
            type: 'polygon',
            points: [...currentPolygon, startPoint],
            isClosed: true,
            name: towerName,
            floorCount: enableFloorPartitioning ? floorCount : undefined
          };
          setShapes(prev => [...prev, newShape]);
          setCurrentPolygon([]);
          setCurrentPath('');
        } else {
          setCurrentPolygon([]);
          setCurrentPath('');
        }
      } else {
        setCurrentPolygon(prev => [...prev, { x, y }]);
      }
    } else if (drawMode === 'freeform' && currentFreeform.length > 0) {
      // Continue drawing freeform shape
      const startPoint = currentFreeform[0];
      const distance = Math.sqrt(
        Math.pow(x - startPoint.x, 2) + Math.pow(y - startPoint.y, 2)
      );

      if (distance < 20 && currentFreeform.length > 2) {
        // Complete the freeform shape
        const newShape: Shape = {
          id: Date.now(),
          type: 'freeform',
          points: [...currentFreeform, startPoint],
          isClosed: true,
          name: towerName
        };
        setShapes(prev => [...prev, newShape]);
        setCurrentFreeform([]);
        setCurrentPath('');
      } else {
        setCurrentFreeform(prev => [...prev, { x, y }]);
      }
    } else {
      // If not drawing, try to add internal points
      if (currentPolygon.length === 0 && currentFreeform.length === 0 && !drawing.points && shapes.length > 0) {
        const lastPolygon = [...shapes].reverse().find(s => s.type === 'polygon' && s.isClosed);
        if (lastPolygon) {
          if (isPointInPolygon({ x, y }, lastPolygon.points)) {
            setInternalPointsMap(prev => {
              const prevPoints = prev[lastPolygon.id] || [];
              if (prevPoints.length >= 2) return prev;
              return { ...prev, [lastPolygon.id]: [...prevPoints, { x, y }] };
            });
          }
        }
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
    } else if (drawMode === 'freeform' && currentFreeform.length > 0) {
      // Create path for the current freeform shape being drawn
      const path = `M ${currentFreeform.map(p => `${p.x} ${p.y}`).join(' L ')} L ${currentX} ${currentY}`;
      setCurrentPath(path);
    } else if (drawing.points) {
      const startPoint = drawing.points[0];
      let path = '';

      if (drawing.type === 'line') {
        path = `M ${startPoint.x} ${startPoint.y} L ${currentX} ${currentY}`;
      } else if (drawing.type === 'simple-line') {
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
    } else if (drawing.type === 'simple-line') {
      const newShape: Shape = {
        id,
        type: 'simple-line',
        points: [...drawing.points, { x: currentX, y: currentY }],
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
    // Removed popup functionality - shapes can be named through other means if needed
  };

  const handleShapeBorderClick = (e: React.MouseEvent, shapeId: number) => {
    e.stopPropagation(); // Prevent event bubbling
    if (!svgRef.current) return;
    
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    let newLineId: number | null = null;
    const newShapes = setShapes(prevShapes => {
      const mapped = prevShapes.map(shape => {
        if (shape.id === shapeId) {
          const existingBorderPoints = shape.borderPoints || [];
          const newBorderPoints = [...existingBorderPoints, { x, y }];
          
          // Create connecting lines in pairs: 1-2, 3-4, 5-6, etc.
          let connectingLines = shape.connectingLines || [];
          if (newBorderPoints.length >= 2 && newBorderPoints.length % 2 === 0) {
            // Only create a line when we have an even number of points (pairs)
            const lineId = Date.now() + Math.random();
            newLineId = lineId;
            
            connectingLines.push({
              id: lineId,
              startPoint: newBorderPoints[newBorderPoints.length - 2], // Second to last point
              endPoint: newBorderPoints[newBorderPoints.length - 1],  // Last point
              color: getShapeColor(shape.type) // Get the same color as the original shape
            });
          }
          
          // Create sections/parts based on pairs of points
          if (shape.type === 'polygon' && newBorderPoints.length >= 2 && newBorderPoints.length % 2 === 0) {
            const pairIndex = Math.floor(newBorderPoints.length / 2) - 1; // Which pair (0, 1, 2, etc.)
            const p1 = newBorderPoints[pairIndex * 2];
            const p2 = newBorderPoints[pairIndex * 2 + 1];
            
            // Find the bounding box of the shape
            const minX = Math.min(...shape.points.map(p => p.x));
            const maxX = Math.max(...shape.points.map(p => p.x));
            const minY = Math.min(...shape.points.map(p => p.y));
            const maxY = Math.max(...shape.points.map(p => p.y));
            
            let partPoints: Point[] = [];
            
            if (pairIndex === 0) {
              // First pair (1-2): Create section from line 1-2 to bottom of shape
              partPoints = [
                p1, p2,
                { x: maxX, y: p2.y }, // Right side
                { x: maxX, y: maxY }, // Bottom right
                { x: minX, y: maxY }, // Bottom left
                { x: minX, y: p1.y }, // Left side
                p1 // Close the polygon
              ];
            } else {
              // Subsequent pairs: Create section between current line and previous line
              const prevP1 = newBorderPoints[(pairIndex - 1) * 2];
              const prevP2 = newBorderPoints[(pairIndex - 1) * 2 + 1];
              
              partPoints = [
                p1, p2, // Current line
                { x: maxX, y: p2.y }, // Right side to current line
                { x: maxX, y: prevP2.y }, // Right side to previous line
                prevP2, prevP1, // Previous line
                { x: minX, y: prevP1.y }, // Left side to previous line
                { x: minX, y: p1.y }, // Left side to current line
                p1 // Close the polygon
              ];
            }
            
            const partId = Date.now() + Math.random();
            const newParts = (shape.parts || []).concat([{ id: String(partId), points: partPoints }]);
            
            return {
              ...shape,
              borderPoints: newBorderPoints,
              connectingLines: connectingLines,
              parts: newParts
            };
          }

          return {
            ...shape,
            borderPoints: newBorderPoints,
            connectingLines: connectingLines
          };
        }
        return shape;
      });
      // After state update, trigger modal if a new line was created
      if (newLineId) {
        setTimeout(() => {
          setPendingFloorShapeId(shapeId);
          setPendingLineId(newLineId!);
          setFloorModalOpen(true);
        }, 0);
      }
      return mapped;
    });
  };

  // Helper function to get the color for each shape type
  const getShapeColor = (shapeType: string) => {
    switch (shapeType) {
      case 'polygon':
        return 'green';
      case 'line':
        return 'green';
      case 'simple-line':
        return 'blue';
      case 'freeform':
        return 'purple';
      case 'rectangle':
        return 'green';
      default:
        return 'green';
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
      formData.append('direction', direction);

      // await axiosInstance.post('/api/towers', formData, {
      //   headers: {
      //     'Content-Type': 'multipart/form-data',
      //   },
      // });

      setSuccess('Tower saved successfully');
      // Reset form after successful save
      setTowerName('');
      // setOrderNumber(0);
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
    } else if (currentFreeform.length > 0) {
      // If we're currently drawing a freeform shape, remove the last point
      setCurrentFreeform(prev => prev.slice(0, -1));
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
          fill="rgba(255, 255, 255, 0)"
          stroke="green"
          strokeWidth="2"
          onClick={(e) => handleShapeBorderClick(e, shape.id)}
          onMouseOver={(e) => handleMouseOver(e, shape.name, shape.id.toString())}
          onMouseOut={handleMouseOut}
        />
      ];

      // Add horizontal lines and floor paths if floorCount exists and floor partitioning is enabled
      if (shape.floorCount && shape.points.length >= 3 && enableFloorPartitioning) {
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

      // Show only the last unpaired border point as a red dot
      if (shape.borderPoints && shape.borderPoints.length % 2 === 1) {
        const lastIndex = shape.borderPoints.length - 1;
        const point = shape.borderPoints[lastIndex];
        elements.push(
          <circle
            key={`${shape.id}-border-${lastIndex}`}
            cx={point.x}
            cy={point.y}
            r={4}
            fill="red"
            stroke="darkred"
            strokeWidth="1"
          />
        );
      }

      // Render sections/parts with a single color
      if (shape.parts && shape.parts.length > 0) {
        shape.parts.forEach((part) => {
          const pathData = `M ${part.points.map(p => `${p.x} ${p.y}`).join(' L ')} Z`;
          elements.push(
            <path
              key={`part-${shape.id}-${part.id}`}
              id={part.id}
              d={pathData}
              fill="rgba(0, 255, 0, 0.3)"
              stroke="green"
              strokeWidth="2"
            />
          );
        });
      }

      return elements;
    } else if (shape.type === 'line' || shape.type === 'simple-line') {      
      const [start, end] = shape.points;
      const strokeColor = shape.type === 'simple-line' ? 'blue' : 'green';
      const strokeWidth = shape.type === 'simple-line' ? '3' : '2';
      return (
        <g key={shape.id}>
          <line
            x1={start.x}
            y1={start.y}
            x2={end.x}
            y2={end.y}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            onClick={(e) => handleShapeBorderClick(e, shape.id)}
            onMouseOver={(e) => handleMouseOver(e, shape.name, shape.id.toString())}
            onMouseOut={handleMouseOut}
          />
          {/* Show only the last unpaired border point as a red dot */}
          {shape.borderPoints && shape.borderPoints.length % 2 === 1 && (() => {
            const lastIndex = shape.borderPoints.length - 1;
            const point = shape.borderPoints[lastIndex];
            return (
              <circle
                key={`${shape.id}-border-${lastIndex}`}
                cx={point.x}
                cy={point.y}
                r={4}
                fill="red"
                stroke="darkred"
                strokeWidth="1"
              />
            );
          })()}
          {shape.connectingLines && shape.connectingLines.map((line, index) => {
            const sectionsCreated = shape.parts?.length || 0;
            // Only show lines for pairs that don't have sections yet
            if (index >= sectionsCreated) {
              return (
                <line
                  key={`${shape.id}-line-${line.id}`}
                  x1={line.startPoint.x}
                  y1={line.startPoint.y}
                  x2={line.endPoint.x}
                  y2={line.endPoint.y}
                  stroke={line.color}
                  strokeWidth="2"
                />
              );
            }
            return null;
          })}
        </g>
      );
    } else if (shape.type === 'freeform') {
      // Render freeform shape as a path
      const pathData = `M ${shape.points.map(p => `${p.x} ${p.y}`).join(' L ')}`;
      return (
        <g key={shape.id}>
          <path
            id={shape.name}
            d={pathData}
            fill="none"
            stroke="purple"
            strokeWidth="3"
            onClick={(e) => handleShapeBorderClick(e, shape.id)}
            onMouseOver={(e) => handleMouseOver(e, shape.name, shape.id.toString())}
            onMouseOut={handleMouseOut}
          />
          {/* Show only the last unpaired border point as a red dot */}
          {shape.borderPoints && shape.borderPoints.length % 2 === 1 && (() => {
            const lastIndex = shape.borderPoints.length - 1;
            const point = shape.borderPoints[lastIndex];
            return (
              <circle
                key={`${shape.id}-border-${lastIndex}`}
                cx={point.x}
                cy={point.y}
                r={4}
                fill="red"
                stroke="darkred"
                strokeWidth="1"
              />
            );
          })()}
          {shape.connectingLines && shape.connectingLines.map((line, index) => {
            const sectionsCreated = shape.parts?.length || 0;
            // Only show lines for pairs that don't have sections yet
            if (index >= sectionsCreated) {
              return (
                <line
                  key={`${shape.id}-line-${line.id}`}
                  x1={line.startPoint.x}
                  y1={line.startPoint.y}
                  x2={line.endPoint.x}
                  y2={line.endPoint.y}
                  stroke={line.color}
                  strokeWidth="2"
                />
              );
            }
            return null;
          })}
        </g>
      );
    } else {
      const [start] = shape.points;
      const width = shape.points[1].x - start.x;
      const height = shape.points[1].y - start.y;
      return (
        <g key={shape.id}>
          <rect
            x={start.x}
            y={start.y}
            width={width}
            height={height}
            fill="rgba(0, 255, 0, 0.3)"
            stroke="green"
            strokeWidth="2"
            onClick={(e) => handleShapeBorderClick(e, shape.id)}
            onMouseOver={(e) => handleMouseOver(e, shape.name, shape.id.toString())}
            onMouseOut={handleMouseOut}
          />
          {/* Show only the last unpaired border point as a red dot */}
          {shape.borderPoints && shape.borderPoints.length % 2 === 1 && (() => {
            const lastIndex = shape.borderPoints.length - 1;
            const point = shape.borderPoints[lastIndex];
            return (
              <circle
                key={`${shape.id}-border-${lastIndex}`}
                cx={point.x}
                cy={point.y}
                r={4}
                fill="red"
                stroke="darkred"
                strokeWidth="1"
              />
            );
          })()}
          {shape.connectingLines && shape.connectingLines.map((line, index) => {
            const sectionsCreated = shape.parts?.length || 0;
            // Only show lines for pairs that don't have sections yet
            if (index >= sectionsCreated) {
              return (
                <line
                  key={`${shape.id}-line-${line.id}`}
                  x1={line.startPoint.x}
                  y1={line.startPoint.y}
                  x2={line.endPoint.x}
                  y2={line.endPoint.y}
                  stroke={line.color}
                  strokeWidth="2"
                />
              );
            }
            return null;
          })}
        </g>
      );
    }
  };

  const handleOrderChange = (e: SelectChangeEvent) => {    
    const newOrder = Number(e.target.value);    
    setOrderNumber(newOrder);
    setDirection('');
    fetchTower(newOrder);
  };

  // Add to Shape type:
  //   internalPoints?: Point[];
  // Add a helper to check if a point is inside a polygon
  function isPointInPolygon(point: Point, polygon: Point[]): boolean {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x, yi = polygon[i].y;
      const xj = polygon[j].x, yj = polygon[j].y;
      const intersect = ((yi > point.y) !== (yj > point.y)) &&
        (point.x < (xj - xi) * (point.y - yi) / (yj - yi + 0.00001) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }

  // handleSvgClick is now handled in handleClick
  const handleSvgClick = (e: React.MouseEvent) => {
    // This function is kept for compatibility but logic is moved to handleClick
  };

  const handleFloorModalClose = () => {
    setFloorModalOpen(false);
    setPendingFloorShapeId(null);
    setPendingLineId(null);
    setPendingFloorValue('');
  };

  const handleFloorModalSubmit = () => {
    if (!pendingFloorShapeId || !pendingLineId) return;
    setShapes(prevShapes =>
      prevShapes.map(shape => {
        if (shape.id === pendingFloorShapeId) {
          // Update connectingLines as before
          const updatedLines = (shape.connectingLines || []).map(line =>
            line.id === pendingLineId ? { ...line, floorNumber: Number(pendingFloorValue) } : line
          );
          // Update the most recently added part's id to the floor number (as string)
          let updatedParts = shape.parts;
          if (updatedLines.length && shape.parts && shape.parts.length > 0) {
            updatedParts = shape.parts.map((part, idx) => {
              if (idx === shape.parts!.length - 1) {
                return { ...part, id: String(pendingFloorValue) };
              }
              return part;
            });
          }
          return {
            ...shape,
            connectingLines: updatedLines,
            parts: updatedParts,
          };
        }
        return shape;
      })
    );
    handleFloorModalClose();
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
        <Box sx={{ display: 'flex', flexDirection: 'row', gap: 4, mb: 3 }}>
          <Box sx={{ minWidth: 200 }}>
            <InputLabel id="order-number-label">Order Number</InputLabel>
            <Select
              labelId="order-number-label"
              value={orderNumber.toString()}
              onChange={handleOrderChange}
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
          <Box sx={{ minWidth: 250 }}>
            <InputLabel id="direction-label">Direction</InputLabel>
            <Select
              labelId="direction-label"
              value={direction}
              onChange={(e: SelectChangeEvent) => setDirection(e.target.value)}
              required
              fullWidth
            >
              {['North', 'South', 'East', 'West', 'North-East', 'North-West', 'South-East', 'South-West'].map((dir) => (
                <MenuItem key={dir} value={dir}>
                  {dir}
                </MenuItem>
              ))}
            </Select>
          </Box>
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

          {/* <ToggleButtonGroup
            value={drawMode}
            exclusive
            onChange={(e, value) => {
              if (value) {
                setDrawMode(value);
                setCurrentPolygon([]);
                setCurrentFreeform([]);
              }
            }}
            aria-label="drawing mode"
          >
            <ToggleButton value="line" aria-label="draw polygon">
              <LineIcon />
            </ToggleButton>
            <ToggleButton value="simple-line" aria-label="draw simple line">
              <ShowChartIcon />
            </ToggleButton>
            <ToggleButton value="rectangle" aria-label="draw rectangle">
              <RectangleIcon />
            </ToggleButton>
            <ToggleButton value="freeform" aria-label="draw freeform">
              <CreateIcon />
            </ToggleButton>
          </ToggleButtonGroup> */}

          <Tooltip title="Undo last action">
            <IconButton 
              onClick={handleUndo}
              disabled={shapes.length === 0 && currentPolygon.length === 0 && currentFreeform.length === 0}
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

          <Tooltip title={enableFloorPartitioning ? "Disable floor partitioning" : "Enable floor partitioning"}>
            <IconButton 
              onClick={() => setEnableFloorPartitioning(!enableFloorPartitioning)}
              color={enableFloorPartitioning ? "secondary" : "primary"}
              sx={{ 
                border: '1px solid',
                borderColor: 'divider',
                '&:hover': {
                  backgroundColor: 'action.hover'
                }
              }}
            >
              <LayersIcon />
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

      <Modal open={floorModalOpen} onClose={handleFloorModalClose}>
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          bgcolor: 'background.paper',
          boxShadow: 24,
          p: 4,
          borderRadius: 2,
          minWidth: 300,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}>
          <Typography variant="h6">Link Floor Number</Typography>
          <TextField
            label="Floor Number"
            value={pendingFloorValue}
            onChange={e => setPendingFloorValue(e.target.value)}
            type="number"
            autoFocus
          />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button onClick={handleFloorModalClose}>Cancel</Button>
            <Button variant="contained" onClick={handleFloorModalSubmit} disabled={!pendingFloorValue}>Save</Button>
          </Box>
        </Box>
      </Modal>

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
              {/* Draw internal points and lines */}
              {shapes.filter(s => s.type === 'polygon' && s.isClosed).map(poly => {
                const points = internalPointsMap[poly.id] || [];
                return (
                  <g key={poly.id + '-internal'}>
                    {points.map((pt, idx) => (
                      <circle key={idx} cx={pt.x} cy={pt.y} r={5} fill="red" />
                    ))}
                    {points.length === 2 && (
                      <line
                        x1={points[0].x}
                        y1={points[0].y}
                        x2={points[1].x}
                        y2={points[1].y}
                        stroke="red"
                        strokeWidth={2}
                      />
                    )}
                  </g>
                );
              })}
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
