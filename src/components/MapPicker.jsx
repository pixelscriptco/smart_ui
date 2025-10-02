import React, { useState, useEffect, useRef } from 'react';
import { TextField, Box, Button, CircularProgress } from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { REACT_APP_GOOGLE_MAPS_API_KEY } from '../config';

function MapPicker({ coordinates, setCoordinates, setFormData }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const searchBoxRef = useRef(null);
  const autocompleteService = useRef(null);

  // Load Google Maps script
  useEffect(() => {
    const loadGoogleMapsScript = () => {
      if (window.google && window.google.maps) {
        setIsMapLoaded(true);
        return;
      }

      // Check if API key exists
      const apiKey = REACT_APP_GOOGLE_MAPS_API_KEY;

      if (!apiKey) {
        console.error('Google Maps API key is missing. Please add REACT_APP_GOOGLE_MAPS_API_KEY to your .env file');
        alert('Google Maps API key is not configured. Please contact the administrator.');
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => setIsMapLoaded(true);
      script.onerror = () => {
        console.error('Failed to load Google Maps script. Please check your API key and billing settings.');
        alert('Failed to load Google Maps. Please check your internet connection and try again.');
      };
      document.head.appendChild(script);
    };

    loadGoogleMapsScript();
  }, []);

  // Initialize map when Google Maps is loaded
  useEffect(() => {
    if (!isMapLoaded || !window.google) return;

    // Initialize Autocomplete Service
    autocompleteService.current = new window.google.maps.places.AutocompleteService();

    const defaultCenter = coordinates || { lat: 20.5937, lng: 78.9629 }; // Default: India

    mapRef.current = new window.google.maps.Map(document.getElementById('map'), {
      center: defaultCenter,
      zoom: coordinates ? 15 : 5,
      mapTypeId: 'roadmap',
    });

    // Add marker if coordinates exist
    if (coordinates) {
      markerRef.current = new window.google.maps.Marker({
        position: coordinates,
        map: mapRef.current,
        draggable: true,
      });

      // Add click listener to marker
      markerRef.current.addListener('dragend', () => {
        const position = markerRef.current.getPosition();
        const newCoordinates = {
          lat: position.lat(),
          lng: position.lng(),
        };
        setCoordinates(newCoordinates);
        reverseGeocode(newCoordinates);
      });
    }

    // Add click listener to map
    mapRef.current.addListener('click', (event) => {
      const newCoordinates = {
        lat: event.latLng.lat(),
        lng: event.latLng.lng(),
      };
      setCoordinates(newCoordinates);
      reverseGeocode(newCoordinates);
      
      // Update or create marker
      if (markerRef.current) {
        markerRef.current.setPosition(newCoordinates);
      } else {
        markerRef.current = new window.google.maps.Marker({
          position: newCoordinates,
          map: mapRef.current,
          draggable: true,
        });
        markerRef.current.addListener('dragend', () => {
          const position = markerRef.current.getPosition();
          const newCoordinates = {
            lat: position.lat(),
            lng: position.lng(),
          };
          setCoordinates(newCoordinates);
          reverseGeocode(newCoordinates);
        });
      }
    });

    // Initialize search box
    initializeSearchBox();
  }, [isMapLoaded, coordinates]);

  const initializeSearchBox = () => {
    if (!window.google || !mapRef.current) return;

    const input = document.getElementById('search-input');
    searchBoxRef.current = new window.google.maps.places.SearchBox(input);

    // Bias the SearchBox results towards current map's viewport
    mapRef.current.addListener('bounds_changed', () => {
      searchBoxRef.current.setBounds(mapRef.current.getBounds());
    });

    // Listen for the event fired when the user selects a prediction
    searchBoxRef.current.addListener('places_changed', () => {
      const places = searchBoxRef.current.getPlaces();

      if (places.length === 0) return;

      // For each place, get the icon, name and location
      const place = places[0];
      if (!place.geometry || !place.geometry.location) {
        console.log('Returned place contains no geometry');
        return;
      }

      const newCoordinates = {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
      };

      setCoordinates(newCoordinates);
      setFormData(prev => ({
        ...prev,
        location: place.formatted_address || place.name
      }));

      // Update map center and marker
      mapRef.current.setCenter(place.geometry.location);
      mapRef.current.setZoom(15);

      if (markerRef.current) {
        markerRef.current.setPosition(place.geometry.location);
      } else {
        markerRef.current = new window.google.maps.Marker({
          position: place.geometry.location,
          map: mapRef.current,
          draggable: true,
        });
        markerRef.current.addListener('dragend', () => {
          const position = markerRef.current.getPosition();
          const newCoordinates = {
            lat: position.lat(),
            lng: position.lng(),
          };
          setCoordinates(newCoordinates);
          reverseGeocode(newCoordinates);
        });
      }
    });
  };

  const reverseGeocode = (coords) => {
    if (!window.google) return;

    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: coords }, (results, status) => {
      if (status === 'OK' && results[0]) {
        setFormData(prev => ({
          ...prev,
          location: results[0].formatted_address
        }));
      }
    });
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() || !window.google) return;
    
    setIsSearching(true);
    try {
      // Use Google Places API to search for the location
      const service = new window.google.maps.places.PlacesService(mapRef.current);
      
      const request = {
        query: searchQuery,
        fields: ['name', 'geometry', 'formatted_address', 'place_id'],
      };

      service.findPlaceFromQuery(request, (results, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
          const place = results[0];
          
          if (!place.geometry || !place.geometry.location) {
            console.log('No geometry found for this place');
            setIsSearching(false);
            return;
          }

          const newCoordinates = {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
          };

          setCoordinates(newCoordinates);
          setFormData(prev => ({
            ...prev,
            location: place.formatted_address || place.name
          }));

          // Update map center and zoom
          mapRef.current.setCenter(place.geometry.location);
          mapRef.current.setZoom(15);

          // Update or create marker
          if (markerRef.current) {
            markerRef.current.setPosition(place.geometry.location);
          } else {
            markerRef.current = new window.google.maps.Marker({
              position: place.geometry.location,
              map: mapRef.current,
              draggable: true,
            });
            markerRef.current.addListener('dragend', () => {
              const position = markerRef.current.getPosition();
              const newCoordinates = {
                lat: position.lat(),
                lng: position.lng(),
              };
              setCoordinates(newCoordinates);
              reverseGeocode(newCoordinates);
            });
          }
        } else {
          alert('Location not found. Please try a different search term.');
        }
        setIsSearching(false);
      });
    } catch (error) {
      console.error('Search error:', error);
      alert('An error occurred while searching. Please try again.');
      setIsSearching(false);
    }
  };

  const handleSearchInputChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (!value.trim() || !autocompleteService.current) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Get autocomplete predictions
    autocompleteService.current.getPlacePredictions(
      {
        input: value,
        componentRestrictions: { country: 'in' }, // Restrict to India, change as needed
      },
      (predictions, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
          setSuggestions(predictions);
          setShowSuggestions(true);
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      }
    );
  };

  const handleSuggestionClick = (placeId, description) => {
    setSearchQuery(description);
    setShowSuggestions(false);

    // Get place details
    const service = new window.google.maps.places.PlacesService(mapRef.current);
    service.getDetails(
      {
        placeId: placeId,
        fields: ['geometry', 'formatted_address', 'name'],
      },
      (place, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
          if (!place.geometry || !place.geometry.location) return;

          const newCoordinates = {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
          };

          setCoordinates(newCoordinates);
          setFormData(prev => ({
            ...prev,
            location: place.formatted_address || place.name
          }));

          // Update map
          mapRef.current.setCenter(place.geometry.location);
          mapRef.current.setZoom(15);

          // Update or create marker
          if (markerRef.current) {
            markerRef.current.setPosition(place.geometry.location);
          } else {
            markerRef.current = new window.google.maps.Marker({
              position: place.geometry.location,
              map: mapRef.current,
              draggable: true,
            });
            markerRef.current.addListener('dragend', () => {
              const position = markerRef.current.getPosition();
              const newCoordinates = {
                lat: position.lat(),
                lng: position.lng(),
              };
              setCoordinates(newCoordinates);
              reverseGeocode(newCoordinates);
            });
          }
        }
      }
    );
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  if (!isMapLoaded) {
    return (
      <Box sx={{ width: '100%', marginBottom: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', marginBottom: 2 }}>
      {/* Search Bar */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2, position: 'relative' }}>
        <Box sx={{ flex: 1, position: 'relative' }}>
          <TextField
            id="search-input"
            fullWidth
            placeholder="Search for a location..."
            value={searchQuery}
            onChange={handleSearchInputChange}
            onKeyPress={handleKeyPress}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            size="small"
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
            }}
          />
          {/* Autocomplete Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <Box
              sx={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                mt: 0.5,
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                boxShadow: 3,
                maxHeight: 300,
                overflowY: 'auto',
                zIndex: 1000,
              }}
            >
              {suggestions.map((suggestion) => (
                <Box
                  key={suggestion.place_id}
                  onClick={() => handleSuggestionClick(suggestion.place_id, suggestion.description)}
                  sx={{
                    p: 1.5,
                    cursor: 'pointer',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                    '&:last-child': {
                      borderBottom: 'none',
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SearchIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                    <Box>
                      <Box sx={{ fontSize: '14px', fontWeight: 500 }}>
                        {suggestion.structured_formatting.main_text}
                      </Box>
                      <Box sx={{ fontSize: '12px', color: 'text.secondary' }}>
                        {suggestion.structured_formatting.secondary_text}
                      </Box>
                    </Box>
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </Box>
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
      <div id="map" style={{ height: 300, width: '100%', borderRadius: 8 }} />
    </Box>
  );
}
export { MapPicker };