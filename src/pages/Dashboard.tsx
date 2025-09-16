import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  CircularProgress,
  useTheme,
  alpha,
  Fade,
  IconButton,
  Tooltip,
  Grid,
} from '@mui/material';
import {
  People as PeopleIcon,
  Business as BusinessIcon,
  TrendingUp as TrendingUpIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axios';

interface Stats {
  total: number;
  active: number;
}
interface EnquiryStats {
  total: number;
  pending: number;
  confirmed: number;
  cancelled: number;
}

const StatCard: React.FC<{
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  loading?: boolean;
  rightColumn?: React.ReactNode;
  onClick?: () => void;
}> = ({ title, value, icon, color, loading, rightColumn, onClick }) => {
  const theme = useTheme();
  
  return (
    <Fade in timeout={500}>
      <Paper
        elevation={0}
        onClick={onClick}
        sx={{
          p: 3,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 2,
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          transition: 'transform 0.2s, box-shadow 0.2s',
          cursor: onClick ? 'pointer' : 'default',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: theme.shadows[4],
          },
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '100%',
            height: '100%',
            background: `linear-gradient(45deg, ${alpha(color, 0.1)} 0%, ${alpha(color, 0.05)} 100%)`,
            zIndex: 0,
          }}
        />
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box
              sx={{
                p: 1,
                borderRadius: 2,
                bgcolor: alpha(color, 0.1),
                color: color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {icon}
            </Box>
            {rightColumn && (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', ml: 2 }}>
                {rightColumn}
              </Box>
            )}
          </Box>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 600,
              mb: 1,
              background: `linear-gradient(45deg, ${color}, ${alpha(color, 0.7)})`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
            }}
          >
            {loading ? <CircularProgress size={24} /> : value}
          </Typography>
          <Typography
            variant="subtitle1"
            sx={{
              color: 'text.secondary',
              fontWeight: 500,
            }}
          >
            {title}
          </Typography>
        </Box>
      </Paper>
    </Fade>
  );
};

const Dashboard: React.FC = () => {
  const theme = useTheme();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [customers, setCustomerStats] = useState<Stats>({
    total: 0,
    active: 0
  });
  const [projects, setProjectStats] = useState<Stats>({
    total: 0,
    active: 0
  });
  const [enquiries, setEnquiryStats] = useState<EnquiryStats>({
    total: 0,
    confirmed: 0,
    pending:0,
    cancelled:0

  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      setRefreshing(true);
      const response = await axiosInstance.get('/api/dashboard/states');        
      setCustomerStats(response.data.data.customers);
      setProjectStats(response.data.data.projects);      
      setEnquiryStats(response.data.data.enquiries);  
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchStats();
    }
  }, [isAuthenticated]);

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="80vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Fade in timeout={500}>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'grid', gap: 3 }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2
          }}>
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 600,
                background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
              }}
            >
              Dashboard Overview
            </Typography>
            <Tooltip title="Refresh Stats">
              <IconButton 
                onClick={fetchStats}
                disabled={refreshing}
                sx={{
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.2),
                  }
                }}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>

          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(4, 1fr)'
            },
            gap: 3
          }}>
            <StatCard
              title="Total Customers"
              value={customers.total}
              icon={<PeopleIcon />}
              color={theme.palette.primary.main}
              loading={refreshing}
              onClick={() => navigate('/clients')}
            />
            <StatCard
              title="Active Customers"
              value={customers.active}
              icon={<TrendingUpIcon />}
              color={theme.palette.success.main}
              loading={refreshing}
              onClick={() => navigate('/clients')}
            />
            <StatCard
              title="Total Projects"
              value={projects.total}
              icon={<BusinessIcon />}
              color={theme.palette.info.main}
              loading={refreshing}
              onClick={() => navigate('/projects')}
            />
            <StatCard
              title="Total Enquiries"
              value={enquiries.total}
              icon={<TrendingUpIcon />}
              color={theme.palette.warning.main}
              loading={refreshing}
              rightColumn={
                <>
                  <Typography variant="caption" sx={{ color: theme.palette.grey[700], fontSize: 12 }}>
                    Pending: {enquiries.pending}
                  </Typography>
                  <Typography variant="caption" sx={{ color: theme.palette.success.dark, fontSize: 12 }}>
                    Confirmed: {enquiries.confirmed}
                  </Typography>
                  <Typography variant="caption" sx={{ color: theme.palette.error.main, fontSize: 12 }}>
                    Cancelled: {enquiries.cancelled}
                  </Typography>
                </>
              }
              onClick={() => navigate('/enquiries')}
            />
          </Box>
        </Box>
      </Container>
    </Fade>
  );
};

export default Dashboard; 