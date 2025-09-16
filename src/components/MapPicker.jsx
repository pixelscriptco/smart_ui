// Add at the top of your file
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useState } from 'react';
import { TextField, Box, Button, CircularProgress } from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';

function MapPicker({ coordinates, setCoordinates, setFormData }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [mapRef, setMapRef] = useState(null);

  // Fix for default marker icon in Leaflet
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
    iconUrl: require('leaflet/dist/images/marker-icon.png'),
    shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
  });

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        const { lat, lon, display_name } = data[0];
        const newCoordinates = { lat: parseFloat(lat), lng: parseFloat(lon) };
        
        setCoordinates(newCoordinates);
        setFormData(prev => ({
          ...prev,
          location: display_name
        }));
        
        // Update map view to the searched location
        if (mapRef) {
          mapRef.setView([lat, lon], 15);
        }
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  function LocationMarker() {
    useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng;
        setCoordinates({ lat, lng });
        // Optionally fetch address using Nominatim
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
          .then(res => res.json())
          .then(data => {
            setFormData(prev => ({
              ...prev,
              location: data.display_name || `${lat}, ${lng}`
            }));
          });
      },
    });

    return coordinates ? (
      <Marker position={[coordinates.lat, coordinates.lng]} />
    ) : null;
  }

  return (
    <Box sx={{ width: '100%', marginBottom: 2 }}>
      {/* Search Bar */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <TextField
          fullWidth
          placeholder="Search for a location..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          size="small"
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
          }}
        />
        <Button
          variant="contained"
          onClick={handleSearch}
          disabled={isSearching || !searchQuery.trim()}
          startIcon={isSearching ? <CircularProgress size={16} /> : <SearchIcon />}
        >
          {isSearching ? 'Searching...' : 'Search'}
        </Button>
      </Box>
      
      {/* Map */}
      <div style={{ height: 300, width: '100%' }}>
        <MapContainer
          center={[coordinates?.lat || 20.5937, coordinates?.lng || 78.9629]} // Default: India
          zoom={coordinates ? 15 : 5}
          style={{ height: '100%', width: '100%' }}
          whenCreated={setMapRef}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker />
        </MapContainer>
      </div>
    </Box>
  );
}
export { MapPicker };