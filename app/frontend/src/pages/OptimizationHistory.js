import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Alert,
  CircularProgress,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  History as HistoryIcon,
  Edit as EditIcon,
  Link as LinkIcon,
} from '@mui/icons-material';
import axios from 'axios';

const OptimizationHistory = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [editData, setEditData] = useState({
    status: '',
    pr_url: '',
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/optimization-history');
      setData(response.data);
    } catch (err) {
      setError('Failed to fetch optimization history');
      console.error('Data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (record) => {
    setSelectedRecord(record);
    setEditData({
      status: record.status,
      pr_url: record.pr_url || '',
      notes: record.notes || ''
    });
    setEditDialogOpen(true);
  };

  const updateRecord = async () => {
    if (!selectedRecord) return;

    try {
      setUpdating(true);
      
      await axios.put(`/api/optimization-history/${selectedRecord.id}`, {
        status: editData.status,
        pr_url: editData.pr_url
      });
      
      // Update local data
      setData(data.map(record => 
        record.id === selectedRecord.id 
          ? { ...record, status: editData.status, pr_url: editData.pr_url, notes: editData.notes }
          : record
      ));
      
      // Close dialog
      setEditDialogOpen(false);
      setSelectedRecord(null);
      
      // Show success message
      setError(null);
      
    } catch (err) {
      setError('Failed to update optimization record');
      console.error('Update error:', err);
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'error';
      case 'in_progress':
        return 'info';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'pending':
        return 'Pending';
      case 'failed':
        return 'Failed';
      case 'in_progress':
        return 'In Progress';
      default:
        return status;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <div>
      <Typography variant="h4" gutterBottom>
        Optimization History
      </Typography>

      <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
        Track all resource optimization actions and their current status.
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Optimizations
              </Typography>
              <Typography variant="h4">
                {data.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Completed
              </Typography>
              <Typography variant="h4" color="success.main">
                {data.filter(record => record.status === 'completed').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Pending
              </Typography>
              <Typography variant="h4" color="warning.main">
                {data.filter(record => record.status === 'pending').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total CPU Saved
              </Typography>
              <Typography variant="h4" color="info.main">
                {data.reduce((sum, record) => sum + (record.old_req_cpu - record.new_req_cpu), 0).toFixed(0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* History Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Optimization Records ({data.length} records)
          </Typography>
          
          {data.length === 0 ? (
            <Box textAlign="center" py={4}>
              <HistoryIcon color="disabled" sx={{ fontSize: 64, mb: 2 }} />
              <Typography variant="h6" color="textSecondary">
                No optimization history found
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Start optimizing resources to see history here.
              </Typography>
            </Box>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>App Name</TableCell>
                    <TableCell>Environment</TableCell>
                    <TableCell>CPU Change</TableCell>
                    <TableCell>Savings</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        <Box>
                          <Typography variant="subtitle2">
                            {record.app_uniq}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {record.app_id}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={record.env.toUpperCase()} 
                          size="small" 
                          color="primary" 
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {record.old_req_cpu} → {record.new_req_cpu}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {((record.old_req_cpu - record.new_req_cpu) / record.old_req_cpu * 100).toFixed(1)}% reduction
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="success.main">
                          {record.old_req_cpu - record.new_req_cpu}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getStatusLabel(record.status)}
                          color={getStatusColor(record.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(record.optimization_date)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<EditIcon />}
                          onClick={() => handleEdit(record)}
                        >
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog 
        open={editDialogOpen} 
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Update Optimization Record
        </DialogTitle>
        <DialogContent>
          {selectedRecord && (
            <Box>
              <Typography variant="body1" gutterBottom>
                <strong>Application:</strong> {selectedRecord.app_uniq} ({selectedRecord.app_id})
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Environment:</strong> {selectedRecord.env.toUpperCase()}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>CPU Change:</strong> {selectedRecord.old_req_cpu} → {selectedRecord.new_req_cpu}
              </Typography>
              
              <Grid container spacing={2} sx={{ mt: 2 }}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    select
                    label="Status"
                    value={editData.status}
                    onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                  >
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="in_progress">In Progress</MenuItem>
                    <MenuItem value="completed">Completed</MenuItem>
                    <MenuItem value="failed">Failed</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="PR URL"
                    value={editData.pr_url}
                    onChange={(e) => setEditData({ ...editData, pr_url: e.target.value })}
                    placeholder="https://github.com/..."
                    InputProps={{
                      startAdornment: <LinkIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Notes"
                    value={editData.notes}
                    onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                    placeholder="Add any additional notes..."
                  />
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={updateRecord}
            variant="contained"
            disabled={updating}
            startIcon={updating ? <CircularProgress size={20} /> : <EditIcon />}
          >
            {updating ? 'Updating...' : 'Update Record'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default OptimizationHistory;
