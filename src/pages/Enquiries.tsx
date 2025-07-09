import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Box,
  Chip,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TablePagination,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import axiosInstance from '../utils/axios';

interface Enquiry {
  id: string;
  project: { name: string };
  unit: { name: string };
  first_name: string;
  last_name: string;
  email: string;
  mobile: string;
  status: string;
  type: string;
}

const statusColors: Record<string, 'success' | 'warning' | 'error'> = {
  pending: 'warning',
  confirmed: 'success',
  cancelled: 'error',
};

const typeColors: Record<string, 'error' | 'warning' | 'info'> = {
  hot: 'error',
  warm: 'warning',
  cold: 'info',
};

const Enquiries: React.FC = () => {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);

  const fetchEnquiries = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/api/enquiries', {
        params: {
          page: page + 1,
          limit: rowsPerPage,
          search: search || undefined,
          status: status !== 'all' ? status : undefined,
        },
      });
      setEnquiries(response.data.enquiries || []);
      setTotal(response.data.total || 0);
    } catch (error) {
      console.error('Error fetching enquiries:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnquiries();
    // eslint-disable-next-line
  }, [page, rowsPerPage, search, status]);

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
    setPage(0);
  };

  const handleStatusChange = (event: any) => {
    setStatus(event.target.value);
    setPage(0);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" gutterBottom>
          Enquiries
        </Typography>
        <Button
          variant="outlined"
          color="primary"
          startIcon={<RefreshIcon />}
          onClick={fetchEnquiries}
        >
          Refresh
        </Button>
      </Box>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
          <Box sx={{ flex: 1, minWidth: 220 }}>
            <TextField
              fullWidth
              label="Search"
              variant="outlined"
              value={search}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          </Box>
          <Box sx={{ minWidth: 180 }}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={status}
                label="Status"
                onChange={handleStatusChange}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="confirmed">Confirmed</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>
      </Paper>
      <TableContainer component={Paper}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Project</TableCell>
                  <TableCell>Unit</TableCell>
                  <TableCell>Client</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Mobile</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Type</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {enquiries.length === 0 && !loading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      No Enquiries Found
                    </TableCell>
                  </TableRow>
                ) : (
                  enquiries.map((enquiry) => (
                    <TableRow key={enquiry.id}>
                      <TableCell>{enquiry.project?.name}</TableCell>
                      <TableCell>{enquiry.unit?.name}</TableCell>
                      <TableCell>{enquiry.first_name} {enquiry.last_name}</TableCell>
                      <TableCell>{enquiry.email}</TableCell>
                      <TableCell>{enquiry.mobile}</TableCell>
                      <TableCell>
                        <Chip
                          label={enquiry.status.charAt(0).toUpperCase() + enquiry.status.slice(1)}
                          color={statusColors[enquiry.status] || 'info'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={enquiry.type.charAt(0).toUpperCase() + enquiry.type.slice(1)}
                          color={typeColors[enquiry.type] || 'info'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={total}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </>
        )}
      </TableContainer>
    </Container>
  );
};

export default Enquiries; 