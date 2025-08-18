import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Button,
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
} from '@mui/material';
import {
  CloudDownload as DownloadIcon,
  CloudUpload as UploadIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import axios from 'axios';

const DatabaseManagement = () => {
  const [dumps, setDumps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [createDumpLoading, setCreateDumpLoading] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [selectedDump, setSelectedDump] = useState(null);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [databaseInfo, setDatabaseInfo] = useState(null);

  useEffect(() => {
    fetchDumps();
    fetchDatabaseInfo();
  }, []);

  const fetchDumps = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/dumps');
      setDumps(response.data);
    } catch (err) {
      setError('Failed to fetch dumps');
      console.error('Dumps fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDatabaseInfo = async () => {
    try {
      const response = await axios.get('/api/health');
      setDatabaseInfo(response.data.database);
    } catch (err) {
      console.error('Database info fetch error:', err);
    }
  };

  const handleCreateDump = async () => {
    try {
      setCreateDumpLoading(true);
      await axios.post('/api/dump');
      await fetchDumps(); // Refresh the list
      setError(null);
    } catch (err) {
      setError('Failed to create dump');
      console.error('Create dump error:', err);
    } finally {
      setCreateDumpLoading(false);
    }
  };

  const handleRestore = async () => {
    if (!selectedDump) return;

    try {
      setRestoreLoading(true);
      await axios.post(`/api/restore/${selectedDump.filename}`);
      setRestoreDialogOpen(false);
      setSelectedDump(null);
      setError(null);
      // Show success message or refresh data
    } catch (err) {
      setError('Failed to restore from dump');
      console.error('Restore error:', err);
    } finally {
      setRestoreLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <Container>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Typography variant="h4" gutterBottom>
        Database Management
      </Typography>

      {/* Database Information */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <InfoIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Database Information
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="textSecondary">
                Schema
              </Typography>
              <Typography variant="body1">
                {databaseInfo?.schema || 'krs'}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="textSecondary">
                Table
              </Typography>
              <Typography variant="body1">
                {databaseInfo?.table || 'nonprod_all_data_all_v1'}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="textSecondary">
                Connection Status
              </Typography>
              <Typography variant="body1" color="success.main">
                Connected
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="textSecondary">
                Data Source
              </Typography>
              <Typography variant="body1">
                AWS RDS Aurora
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Important Notice */}
      <Alert severity="info" sx={{ mb: 4 }}>
        <Typography variant="body2">
          <strong>Note:</strong> This system connects to your existing AWS RDS Aurora database. 
          Dumps will contain data from the <code>{databaseInfo?.schema || 'krs'}.{databaseInfo?.table || 'nonprod_all_data_all_v1'}</code> table.
          Restore functionality may require table structure validation.
        </Typography>
      </Alert>

      {/* Dump Management */}
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
            <Typography variant="h6">
              Database Dumps
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateDump}
              disabled={createDumpLoading}
            >
              {createDumpLoading ? 'Creating...' : 'Create Dump'}
            </Button>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {dumps.length === 0 ? (
            <Box textAlign="center" py={4}>
              <Typography variant="h6" color="textSecondary">
                No dumps available
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Create your first dump to get started
              </Typography>
            </Box>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Filename</strong></TableCell>
                    <TableCell><strong>Size</strong></TableCell>
                    <TableCell><strong>Created</strong></TableCell>
                    <TableCell><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dumps.map((dump) => (
                    <TableRow key={dump.filename}>
                      <TableCell>{dump.filename}</TableCell>
                      <TableCell>{formatFileSize(dump.size)}</TableCell>
                      <TableCell>{formatDate(dump.created)}</TableCell>
                      <TableCell>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<UploadIcon />}
                          onClick={() => {
                            setSelectedDump(dump);
                            setRestoreDialogOpen(true);
                          }}
                          sx={{ mr: 1 }}
                        >
                          Restore
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<DownloadIcon />}
                          onClick={() => {
                            // Download functionality would go here
                            console.log('Download:', dump.filename);
                          }}
                        >
                          Download
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

      {/* Restore Dialog */}
      <Dialog open={restoreDialogOpen} onClose={() => setRestoreDialogOpen(false)}>
        <DialogTitle>
          Restore Database from Dump
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Are you sure you want to restore the database from:
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            {selectedDump?.filename}
          </Typography>
          <Alert severity="warning">
            <Typography variant="body2">
              <strong>Warning:</strong> This action will overwrite current data. 
              Make sure you have a backup before proceeding.
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRestoreDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleRestore}
            variant="contained"
            color="primary"
            disabled={restoreLoading}
          >
            {restoreLoading ? 'Restoring...' : 'Restore'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default DatabaseManagement;
