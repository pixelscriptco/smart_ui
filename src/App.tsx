import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, CircularProgress, Typography } from '@mui/material';

// Components
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Register from './pages/Register';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProjectDetails from './pages/ProjectDetails';
import Building from './pages/Building';
import TowerDetails from './pages/TowerDetails';
import Towers from './pages/Towers';
import TowerAmenities from './pages/TowerAmenities';
import Floors from './pages/Floors';
import FloorPlan from './pages/FloorPlan';
import Units from './pages/Units';
import UnitPlan from './pages/UnitPlan';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

const AppRoutes = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        gap={2}
      >
        <CircularProgress />
        <Typography variant="body1" color="text.secondary">
          Loading...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex' }}>
      {isAuthenticated && (
        <>
          <Navbar />
          <Sidebar />
        </>
      )}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          mt: isAuthenticated ? 8 : 0,
          ml: isAuthenticated ? '20px' : 0,
        }}
      >
        <Routes>
          <Route
            path="/"
            element={
              isAuthenticated ? (
                <Dashboard />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/projects"
            element={
              isAuthenticated ? (
                <Projects/>
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/projects/:id"
            element={
              isAuthenticated ? (
                <ProjectDetails />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/projects/:project_id/buildings"
            element={
              isAuthenticated ? (
                <Building />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/projects/:project_id/towers"
            element={
              isAuthenticated ? (
                <Towers />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/projects/:project_id/towers/:tower_id"
            element={
              isAuthenticated ? (
                <TowerDetails />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/projects/:project_id/towers/:tower_id/amenities"
            element={
              isAuthenticated ? (
                <TowerAmenities />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/projects/:project_id/floors"
            element={
              isAuthenticated ? (
                <Floors />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/projects/:project_id/floor-plan"
            element={
              isAuthenticated ? (
                <FloorPlan />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/projects/:project_id/floor-plan/:floor_id"
            element={
              isAuthenticated ? (
                <FloorPlan />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/projects/:project_id/units"
            element={
              isAuthenticated ? (
                <Units />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/projects/:project_id/unit-plan"
            element={
              isAuthenticated ? (
                <UnitPlan />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/settings"
            element={
              isAuthenticated ? (
                <Settings />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/login"
            element={
              !isAuthenticated ? (
                <Login />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route
            path="/register"
            element={
              !isAuthenticated ? (
                <Register />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
        </Routes>
      </Box>
    </Box>
  );
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
