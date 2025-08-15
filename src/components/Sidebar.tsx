import React, { useState } from 'react';
import { Link, useLocation, matchPath,useNavigate } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Collapse,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  MeetingRoom as RoomIcon,
  Devices as DeviceIcon,
  Group as GroupIcon,
  ContactMail as ContactMailIcon,
  ExpandLess,
  ExpandMore,
  Business as BuildingIcon,
  Apartment as TowerIcon,
  Layers as FloorIcon,
  Home as UnitIcon,
} from '@mui/icons-material';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Match project_id from any route that contains it
  const match = matchPath(
    { path: '/projects/:project_id/*' }, // match paths like /projects/123/anything
    location.pathname
  );

  const project_id = match?.params?.project_id;
  // const { project_id } = useParams();
  const [projectsOpen, setProjectsOpen] = useState(false);

  const navItems = [
    { label: 'Dashboard', to: '/', icon: <DashboardIcon /> },
    { label: 'Projects', to: '/projects', icon: <RoomIcon /> },
    { label: 'Clients', to: '/clients', icon: <GroupIcon /> },
    { label: 'Enquiries', to: '/enquiries', icon: <ContactMailIcon /> },
    { label: 'Settings', to: '/settings', icon: <DeviceIcon /> },
  ];

  const projectSubItems = [
    { label: 'Building', to: `/projects/${project_id}/buildings`, icon: <BuildingIcon /> },
    { label: 'Tower', to: `/projects/${project_id}/towers`, icon: <TowerIcon /> },
    { label: 'Floor', to: `/projects/${project_id}/floors`, icon: <FloorIcon /> },
    { label: 'Unit', to: `/projects/${project_id}/units`, icon: <UnitIcon /> },
  ];
  
  // Check if we're on a project page
  const isProjectPage = project_id && (location.pathname.startsWith(`/projects/${project_id}`));
  
  // Auto-open submenu when on project page
  React.useEffect(() => {
    if (isProjectPage) {
      setProjectsOpen(true);
    } else {
      setProjectsOpen(false);
    }
  }, [isProjectPage, project_id]);

  const openProjects = () => {
    if (isProjectPage) {
      // If already on project page, just toggle the submenu
      setProjectsOpen(!projectsOpen);
    } else {
      // If not on project page, navigate to projects and open submenu
      navigate('/projects');
      setProjectsOpen(true);
    }
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: 240,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: 240,
          position: 'fixed',
          top: 64,
        },
      }}
    >
      <List>
        {navItems.map((item) => {          
          const isActive = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to));
          
          // Special handling for Projects item to include submenu
          if (item.label === 'Projects' && isProjectPage) {
            
            return (
              <React.Fragment key={item.to}>
                <ListItemButton
                  onClick={() => openProjects()}
                  sx={{
                    bgcolor: isActive ? '#a1a1a1' : 'inherit',
                    color: isActive ? 'white' : 'inherit',
                    '& .MuiListItemIcon-root': {
                      color: isActive ? 'white' : 'inherit',
                    },
                    '&:hover': {
                      bgcolor: isActive ? '#a1a1a1' : '#f0f0f0',
                    },
                  }}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.label} />
                  {projectsOpen ? <ExpandLess /> : <ExpandMore />}
                </ListItemButton>
                <Collapse in={projectsOpen} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {projectSubItems.map((subItem) => {
                      const isSubActive = location.pathname === subItem.to || location.pathname.startsWith(subItem.to);
                      return (
                        <ListItemButton
                          key={subItem.to}
                          component={Link}
                          to={subItem.to}
                          sx={{
                            pl: 4,
                            bgcolor: isSubActive ? '#d0d0d0' : 'inherit',
                            color: isSubActive ? 'black' : 'inherit',
                            '& .MuiListItemIcon-root': {
                              color: isSubActive ? 'black' : 'inherit',
                            },
                            '&:hover': {
                              bgcolor: isSubActive ? '#d0d0d0' : '#f5f5f5',
                            },
                          }}
                        >
                          <ListItemIcon>{subItem.icon}</ListItemIcon>
                          <ListItemText primary={subItem.label} />
                        </ListItemButton>
                      );
                    })}
                  </List>
                </Collapse>
              </React.Fragment>
            );
          }
          
          return (
            <ListItemButton
              key={item.to}
              component={Link}
              to={item.to}
              sx={{
                bgcolor: isActive ? '#a1a1a1' : 'inherit',
                color: isActive ? 'white' : 'inherit',
                '& .MuiListItemIcon-root': {
                  color: isActive ? 'white' : 'inherit',
                },
                '&:hover': {
                  bgcolor: isActive ? '#a1a1a1' : '#f0f0f0',
                },
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          );
        })}
      </List>
      <Divider />
    </Drawer>
  );
};

export default Sidebar; 