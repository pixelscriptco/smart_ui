import React from 'react';
import { Link } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  MeetingRoom as RoomIcon,
  Devices as DeviceIcon,
  Group as GroupIcon,
  ContactMail as ContactMailIcon,
} from '@mui/icons-material';

const Sidebar: React.FC = () => {
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
        <ListItemButton component={Link} to="/">
          <ListItemIcon>
            <DashboardIcon />
          </ListItemIcon>
          <ListItemText primary="Dashboard" />
        </ListItemButton>
        <ListItemButton component={Link} to="/projects">
          <ListItemIcon>
            <RoomIcon />
          </ListItemIcon>
          <ListItemText primary="Projects" />
        </ListItemButton>
        <ListItemButton component={Link} to="/clients">
          <ListItemIcon>
            <GroupIcon />
          </ListItemIcon>
          <ListItemText primary="Clients" />
        </ListItemButton>
        <ListItemButton component={Link} to="/enquiries">
          <ListItemIcon>
            <ContactMailIcon />
          </ListItemIcon>
          <ListItemText primary="Enquiries" />
        </ListItemButton>
        <ListItemButton component={Link} to="/settings">
          <ListItemIcon>
            <DeviceIcon />
          </ListItemIcon>
          <ListItemText primary="Settings" />
        </ListItemButton>
      </List>
      <Divider />
    </Drawer>
  );
};

export default Sidebar; 