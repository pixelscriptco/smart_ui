import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Avatar,
  Switch,
  FormControlLabel,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Tooltip
} from '@mui/material';
import {
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  Http as HttpIcon
} from '@mui/icons-material';
import axiosInstance from '../utils/axios';
import LockResetIcon from '@mui/icons-material/LockReset';
import CheckIcon from '@mui/icons-material/Check';
interface Client {
  id: number;
  name: string;
  email: string;
  mobile: string;
  status: 'active' | 'inactive';
  // type: 'individual' | 'corporate';
  url: string;
  company: string;
  createdAt: string;
  avatar?: string;
}

const Clients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    type: 'all'
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newClient, setNewClient] = useState({
    name: '',
    email: '',
    mobile: '',
    company: '',
    password:'',
    status: 'active',
  });
  const [createError, setCreateError] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [urltModalOpen, setClientUrlModal] = useState(false);
  const [clientUrl, setClientUrl] = useState<string | null>(null);
  const [clientUrlError, setClientUrlError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<number>(0);
  const [isSuccess, setIsSuccess] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [mobileError, setMobileError] = useState<string | null>(null);
  const [emailValidationTimeout, setEmailValidationTimeout] = useState<NodeJS.Timeout | null>(null);
  const [mobileValidationTimeout, setMobileValidationTimeout] = useState<NodeJS.Timeout | null>(null);
  const [emailValidating, setEmailValidating] = useState(false);
  const [mobileValidating, setMobileValidating] = useState(false);

  useEffect(() => {
    fetchClients();
  }, []);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (emailValidationTimeout) {
        clearTimeout(emailValidationTimeout);
      }
      if (mobileValidationTimeout) {
        clearTimeout(mobileValidationTimeout);
      }
    };
  }, [emailValidationTimeout, mobileValidationTimeout]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/api/users/clients');
      setClients(response.data);
    } catch (err) {
      setError('Failed to fetch clients');
      console.error('Error fetching clients:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
    setPage(0); // Reset to first page when filter changes
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(filters.search.toLowerCase()) ||
                         client.email.toLowerCase().includes(filters.search.toLowerCase());
    const matchesStatus = filters.status === 'all' || client.status === filters.status;
    
    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = async (clientId: number, newStatus: 'active' | 'inactive') => {
    try {
      // Update the status in the backend
      await axiosInstance.patch(`/api/users/clients/${clientId}`, {
        status: newStatus
      });

      // Update the local state
      setClients(prevClients =>
        prevClients.map(client =>
          client.id === clientId
            ? { ...client, status: newStatus }
            : client
        )
      );
    } catch (err) {
      console.error('Error updating client status:', err);
      // You might want to show an error message to the user here
    }
  };

  const handleCreateClient = async () => {
    setCreateError(null);
    
    // Check for validation errors
    if (emailError || mobileError) {
      setCreateError('Please fix the validation errors before creating the client');
      return;
    }
    
    try {
      const response = await axiosInstance.post('/api/users/client', newClient);
      setCreateModalOpen(false);
      setNewClient({ name: '', email: '', mobile: '', company: '', password: '', status: 'active' });
      setEmailError(null);
      setMobileError(null);
      fetchClients();
    } catch (err: any) {
      setCreateError(err.response?.data?.message || 'Failed to create client');
    }
  };

  const handleEdit = (clientId: number) => {
    const client = clients.find(c => c.id === clientId);
    if (client) {
      setEditingClient(client);
      setEditModalOpen(true);
    }
  };

  const handleSetUrl = (clientId: number) => {
    const client = clients.find(c => c.id === clientId);    
    if (client) {
      setSelectedClientId(clientId);
      setClientUrl(client.url);
      setClientUrlError('');
      setClientUrlModal(true);
    }
  };

  const handleResetClick = (clientId: number) => {    
    setSelectedClientId(clientId);
    setIsSuccess(false);
    setPassword('');
    setResetModalOpen(true);
  };

  const handleResetPassword = (clientId: number) => {
    // setResetModalOpen(true);
    if (password) {
      axiosInstance
        .patch(`/api/users/clients/${clientId}/reset-password`, {
          password: password
        })
        .then(() => {
          setIsSuccess(true);
          setTimeout(() => setResetModalOpen(false), 2000); 
        })
        .catch((err) => {
          setResetModalOpen(false);
          console.error('Failed to reset password:', err);
          // alert('Failed to reset password');
        });
    }
  };

  const handleSubmitUrl = (clientId: number) => {
    setClientUrlError('');
    if (clientUrl) {
      if (!clientUrl.startsWith('https://')) {
        setClientUrlError('URL must start with https://');
        console.error('URL must start with https://');
        return;
      }
      if (!clientUrl.endsWith('.proptour.live')) {
        setClientUrlError('URL must end with .proptour.live');
        console.error('URL must end with .proptour.live');
        return;
      }
      if (clientUrl.length < 23) {
        setClientUrlError('URL must be at least 20 characters long');
        console.error('URL must be at least 20 characters long');
        return;
      }
      if (clientUrl.includes(' ')) {
        setClientUrlError('URL cannot contain spaces');
        console.error('URL cannot contain spaces');
        // alert('URL cannot contain spaces');
        return;
      }
      axiosInstance
        .patch(`/api/users/clients/${clientId}/set-url`, {
          url: clientUrl
        })
        .then(() => {
          setIsSuccess(true);
          setTimeout(() => setClientUrlModal(false), 2000); 
        })
        .catch((err) => {
          setClientUrlModal(false);
          console.error('Failed to reset client url:', err);
          // alert('Failed to reset client url');
        });
    }
  };

  const validateEmail = async (email: string) => {
    if (!email) {
      setEmailError(null);
      setEmailValidating(false);
      return;
    }
    
    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      setEmailValidating(false);
      return;
    }
    
    // Clear previous timeout
    if (emailValidationTimeout) {
      clearTimeout(emailValidationTimeout);
    }
    
    // Set new timeout for debouncing
    const timeout = setTimeout(async () => {
      setEmailValidating(true);
      try {
        const response = await axiosInstance.get(`/api/users/check-client-exists?email=${encodeURIComponent(email)}`);
        if (response.data.exists && response.data.errors.email) {
          setEmailError(response.data.errors.email);
        } else {
          setEmailError(null);
        }
      } catch (error) {
        console.error('Error checking email:', error);
        setEmailError(null);
      } finally {
        setEmailValidating(false);
      }
    }, 500); // 500ms delay
    
    setEmailValidationTimeout(timeout);
  };

  const validateMobile = async (mobile: string) => {
    if (!mobile) {
      setMobileError(null);
      setMobileValidating(false);
      return;
    }
    
    // Basic mobile number validation (at least 10 digits)
    if (mobile.length < 10) {
      setMobileError('Mobile number must be at least 10 digits');
      setMobileValidating(false);
      return;
    }
    
    // Clear previous timeout
    if (mobileValidationTimeout) {
      clearTimeout(mobileValidationTimeout);
    }
    
    // Set new timeout for debouncing
    const timeout = setTimeout(async () => {
      setMobileValidating(true);
      try {
        const response = await axiosInstance.get(`/api/users/check-client-exists?mobile=${encodeURIComponent(mobile)}`);
        if (response.data.exists && response.data.errors.mobile) {
          setMobileError(response.data.errors.mobile);
        } else {
          setMobileError(null);
        }
      } catch (error) {
        console.error('Error checking mobile:', error);
        setMobileError(null);
      } finally {
        setMobileValidating(false);
      }
    }, 500); // 500ms delay
    
    setMobileValidationTimeout(timeout);
  };
  

  return (
    <Box sx={{ p: 3 }}>

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Clients
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => {
            setCreateModalOpen(true);
            setEmailError(null);
            setMobileError(null);
            setCreateError(null);
            setEmailValidating(false);
            setMobileValidating(false);
          }}
        >
          Create New Client
        </Button>
      </Box>

      {/* Create Client Modal */}
      <Dialog 
        open={createModalOpen} 
        onClose={() => {
          setCreateModalOpen(false);
          setEmailError(null);
          setMobileError(null);
          setCreateError(null);
          setEmailValidating(false);
          setMobileValidating(false);
        }} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>Create New Client</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          {createError && (
            <Typography color="error" sx={{ mb: 1 }}>{createError}</Typography>
          )}
          <TextField
            label="Name"
            value={newClient.name}
            onChange={e => setNewClient({ ...newClient, name: e.target.value })}
            fullWidth
          />
          <TextField
            label="Email"
            value={newClient.email}
            onChange={e => {
              setNewClient({ ...newClient, email: e.target.value });
              validateEmail(e.target.value);
            }}
            onBlur={(e) => validateEmail(e.target.value)}
            error={!!emailError}
            helperText={emailError}
            fullWidth
            InputProps={{
              endAdornment: emailValidating ? (
                <CircularProgress size={20} sx={{ mr: 1 }} />
              ) : null
            }}
          />
          <TextField
            label="Mobile"
            value={newClient.mobile}
            onChange={e => {
              setNewClient({ ...newClient, mobile: e.target.value });
              validateMobile(e.target.value);
            }}
            onBlur={(e) => validateMobile(e.target.value)}
            error={!!mobileError}
            helperText={mobileError}
            fullWidth
            InputProps={{
              endAdornment: mobileValidating ? (
                <CircularProgress size={20} sx={{ mr: 1 }} />
              ) : null
            }}
          />
          <TextField
            label="Company"
            value={newClient.company}
            onChange={e => setNewClient({ ...newClient, company: e.target.value })}
            fullWidth
          />
          <TextField
            label="Password"
            value={newClient.password}
            onChange={e => setNewClient({ ...newClient, password: e.target.value })}
            fullWidth
          />
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              value={newClient.status}
              label="Status"
              onChange={e => setNewClient({ ...newClient, status: e.target.value })}
            >
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateModalOpen(false)}>Cancel</Button>
          <Tooltip 
            title={
              emailError || mobileError 
                ? 'Please fix the validation errors before creating the client'
                : !newClient.name || !newClient.email || !newClient.mobile || !newClient.password
                ? 'Please fill in all required fields'
                : emailValidating || mobileValidating
                ? 'Validating...'
                : ''
            }
          >
            <span>
              <Button 
                variant="contained" 
                onClick={handleCreateClient}
                disabled={
                  !!emailError || 
                  !!mobileError || 
                  !newClient.name || 
                  !newClient.email || 
                  !newClient.mobile || 
                  !newClient.password ||
                  emailValidating ||
                  mobileValidating
                }
              >
                Create
              </Button>
            </span>
          </Tooltip>
        </DialogActions>
      </Dialog>

      <Dialog open={editModalOpen} onClose={() => setEditModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Client</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          {editingClient && (
            <>
              <TextField
                label="Name"
                value={editingClient.name}
                onChange={e =>
                  setEditingClient({ ...editingClient, name: e.target.value })
                }
                fullWidth
              />
              <TextField
                label="Email"
                value={editingClient.email}
                disabled
                fullWidth
                sx={{
                  '& .MuiInputBase-input.Mui-disabled': {
                    WebkitTextFillColor: 'rgba(0, 0, 0, 0.6)',
                    backgroundColor: 'rgba(0, 0, 0, 0.04)'
                  }
                }}
              />
              <TextField
                label="Mobile"
                value={editingClient.mobile}
                onChange={e =>
                  setEditingClient({ ...editingClient, mobile: e.target.value })
                }
                fullWidth
              />
              <TextField
                label="Company"
                value={editingClient.company}
                onChange={e =>
                  setEditingClient({ ...editingClient, company: e.target.value })
                }
                fullWidth
              />
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={editingClient.status}
                  label="Status"
                  onChange={e =>
                    setEditingClient({
                      ...editingClient,
                      status: e.target.value as 'active' | 'inactive'
                    })
                  }
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditModalOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={async () => {
              try {
                if (editingClient) {
                  await axiosInstance.patch(`/api/users/clients/${editingClient.id}`, editingClient);
                  fetchClients(); // refresh
                  setEditModalOpen(false);
                }
              } catch (err) {
                console.error("Failed to update client", err);
              }
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={resetModalOpen} onClose={() => setResetModalOpen(false)}  maxWidth="sm" fullWidth>
        <DialogTitle>Reset Password</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="New Password"
            type="password"
            fullWidth
            variant="outlined"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetModalOpen(false)}>Cancel</Button>
          <Button onClick={() => handleResetPassword(selectedClientId)} variant="contained" color="primary">{isSuccess ? <CheckIcon /> : 'Submit'}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={urltModalOpen} onClose={() => setClientUrlModal(false)}  maxWidth="sm" fullWidth>
        <DialogTitle>Set URL for Client</DialogTitle>
         {(
          <Typography sx={{ ml: 3, mb: 0 }} color="textSecondary" variant="caption">
            <strong>Note:</strong> Ensure the URL starts with <code>https://</code> and ends with <code>.proptour.live</code>.
          </Typography>
        )}
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            placeholder='https://example.proptour.live'
            label="URL"
            type="text"
            fullWidth
            variant="outlined"
            value={clientUrl || ''}
            onChange={(e) => setClientUrl(e.target.value)}
          />
        </DialogContent>

        {clientUrlError && (
          <Typography color="error" sx={{ ml: 2, mb: 1 }} variant="caption">{clientUrlError}</Typography>
        )}
        {/* {clientUrl && (
          <Typography sx={{ ml: 2, mb: 1 }}>
            <strong>Preview:</strong> {clientUrl}
          </Typography>
        )} */}
        {isSuccess && (
          <Typography color="success.main" sx={{ ml: 2, mb: 1 }}>URL updated successfully!</Typography>
        )}
        <DialogActions>
          <Button onClick={() => setClientUrlModal(false)}>Cancel</Button>
          <Button onClick={() => handleSubmitUrl(selectedClientId)} variant="contained" color="primary">{isSuccess ? <CheckIcon /> : 'Submit'}</Button>
        </DialogActions>
      </Dialog>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 4 }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', md: 'row' },
          gap: 2,
          alignItems: 'center'
        }}>
          <Box sx={{ flex: { xs: '1 1 100%', md: '2 1 0' } }}>
            <TextField
              fullWidth
              label="Search"
              variant="outlined"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
          </Box>
          <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 0' } }}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status}
                label="Status"
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
            </FormControl>
          </Box>
          {/* <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 0' } }}>
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                value={filters.type}
                label="Type"
                onChange={(e) => handleFilterChange('type', e.target.value)}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="individual">Individual</MenuItem>
                <MenuItem value="corporate">Corporate</MenuItem>
              </Select>
            </FormControl>
          </Box> */}
        </Box>
      </Paper>

      {/* Table */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 'calc(100vh - 300px)' }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Company</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created At</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">Loading...</TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ color: 'error.main' }}>{error}</TableCell>
                </TableRow>
              ) : filteredClients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">No clients found</TableCell>
                </TableRow>
              ) : (
                filteredClients
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((client) => (
                    <TableRow
                      key={client.id}
                      hover
                      sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          {/* <Avatar 
                            src={client.avatar}
                            sx={{ 
                              width: 40, 
                              height: 40,
                              bgcolor: 'primary.main'
                            }}
                          >
                            {client.name.charAt(0)}
                          </Avatar> */}
                          <Typography variant="body1">{client.name}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{client.email}</TableCell>
                      <TableCell>{client.mobile}</TableCell>
                      <TableCell>
                        {client.company}
                        {/* <Chip 
                          label={client.type} 
                          size="small"
                          icon={client.type === 'corporate' ? <BusinessIcon /> : <PersonIcon />}
                          color={client.type === 'corporate' ? 'primary' : 'default'}
                        /> */}
                      </TableCell>
                      <TableCell>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={client.status === 'active'}
                              onChange={(e) => handleStatusChange(
                                client.id,
                                e.target.checked ? 'active' : 'inactive'
                              )}
                              color="success"
                            />
                          }
                          label={client.status}
                          sx={{
                            '& .MuiFormControlLabel-label': {
                              color: client.status === 'active' ? 'success.main' : 'error.main',
                              fontWeight: 500
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell>{new Date(client.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell align="right">
                        <IconButton 
                            size="small" 
                            onClick={() => handleSetUrl(client.id)}
                            color="secondary"
                          >
                            <HttpIcon />
                        </IconButton>
                        <IconButton 
                            size="small" 
                            onClick={() => handleResetClick(client.id)}
                            color="secondary"
                          >
                            <LockResetIcon />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          onClick={() => handleEdit(client.id)}
                          color="primary"
                        >
                          <EditIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredClients.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </Box>
  );
};

export default Clients; 