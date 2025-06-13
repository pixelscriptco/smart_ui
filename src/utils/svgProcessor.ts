interface Room {
    id: string;
    name: string;
    path: string;
    devices: any[];
  }
  
  export const processSVG = (svgContent: string): { processedSVG: string; rooms: Room[] } => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgContent, 'image/svg+xml');
    const rooms: Room[] = [];
  
    // Find all paths in the SVG
    const paths = doc.getElementsByTagName('path');
    Array.from(paths).forEach((path, index) => {
      const roomId = `room-${index + 1}`;
      const roomName = path.getAttribute('data-room-name') || `Room ${index + 1}`;
      
      // Add interactivity attributes
      path.setAttribute('id', roomId);
      path.setAttribute('class', 'room-path');
      path.setAttribute('fill', '#ffffff');
      path.setAttribute('stroke', '#000000');
      path.setAttribute('stroke-width', '2');
      path.setAttribute('cursor', 'pointer');
      
      // Add hover effect
      path.setAttribute('onmouseover', `this.setAttribute('fill', '#e3f2fd')`);
      path.setAttribute('onmouseout', `this.setAttribute('fill', '#ffffff')`);
  
      // Store room data
      rooms.push({
        id: roomId,
        name: roomName,
        path: path.getAttribute('d') || '',
        devices: []
      });
    });
  
    // Add styles to the SVG
    const style = doc.createElementNS('http://www.w3.org/2000/svg', 'style');
    style.textContent = `
      .room-path {
        transition: fill 0.3s ease;
      }
      .room-path:hover {
        fill: #e3f2fd;
      }
      .device {
        cursor: pointer;
      }
    `;
    doc.documentElement.insertBefore(style, doc.documentElement.firstChild);
  
    return {
      processedSVG: new XMLSerializer().serializeToString(doc),
      rooms
    };
  };
  
  export const addDeviceToRoom = (svgContent: string, roomId: string, device: any): string => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgContent, 'image/svg+xml');
    const room = doc.getElementById(roomId) as unknown as SVGGraphicsElement;
      
    if (room) {
      const bbox = room.getBBox();
      const deviceGroup = doc.createElementNS('http://www.w3.org/2000/svg', 'g');
      deviceGroup.setAttribute('class', 'device');
      deviceGroup.setAttribute('id', `device-${device.id}`);
  
      // Create device icon (simple circle for now)
      const circle = doc.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', String(bbox.x + bbox.width / 2));
      circle.setAttribute('cy', String(bbox.y + bbox.height / 2));
      circle.setAttribute('r', '10');
      circle.setAttribute('fill', '#4caf50');
  
      deviceGroup.appendChild(circle);
      room.appendChild(deviceGroup);
    }
  
    return new XMLSerializer().serializeToString(doc);
  };