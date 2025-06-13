import React, { useState } from 'react';
import {
  Container,
  Typography,
  Button,
  TextField,
  Box,
  Alert,
  Paper,
} from '@mui/material';
import LockResetIcon from '@mui/icons-material/LockReset';
import axiosInstance from '../utils/axios';

const Settings: React.FC = () => {
  const [resetPasswordData, setResetPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [resetPasswordError, setResetPasswordError] = useState<string | null>(null);
  const [resetPasswordSuccess, setResetPasswordSuccess] = useState<string | null>(null);

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetPasswordError(null);
    setResetPasswordSuccess(null);

    // Validate passwords
    if (resetPasswordData.newPassword !== resetPasswordData.confirmPassword) {
      setResetPasswordError('New passwords do not match');
      return;
    }

    if (resetPasswordData.newPassword.length < 8) {
      setResetPasswordError('New password must be at least 8 characters long');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axiosInstance.post(
        '/api/users/reset-password',
        {
          currentPassword: resetPasswordData.currentPassword,
          newPassword: resetPasswordData.newPassword,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setResetPasswordSuccess('Password reset successfully');
      setResetPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error: any) {
      setResetPasswordError(error.response?.data?.message || 'Error resetting password');
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Settings
        </Typography>
      </Box>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Reset Password
        </Typography>

        {resetPasswordError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {resetPasswordError}
          </Alert>
        )}
        {resetPasswordSuccess && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {resetPasswordSuccess}
          </Alert>
        )}

        <form onSubmit={handleResetPasswordSubmit}>
          <TextField
            margin="normal"
            label="Current Password"
            type="password"
            fullWidth
            required
            value={resetPasswordData.currentPassword}
            onChange={(e) =>
              setResetPasswordData({
                ...resetPasswordData,
                currentPassword: e.target.value,
              })
            }
          />
          <TextField
            margin="normal"
            label="New Password"
            type="password"
            fullWidth
            required
            value={resetPasswordData.newPassword}
            onChange={(e) =>
              setResetPasswordData({
                ...resetPasswordData,
                newPassword: e.target.value,
              })
            }
          />
          <TextField
            margin="normal"
            label="Confirm New Password"
            type="password"
            fullWidth
            required
            value={resetPasswordData.confirmPassword}
            onChange={(e) =>
              setResetPasswordData({
                ...resetPasswordData,
                confirmPassword: e.target.value,
              })
            }
          />
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              startIcon={<LockResetIcon />}
              size="large"
            >
              Reset Password
            </Button>
          </Box>
        </form>
      </Paper>
    </Container>
  );
};

export default Settings;
