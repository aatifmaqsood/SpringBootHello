import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
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
} from '@mui/material';
import {
  CloudDownload as DownloadIcon,
  CloudUpload as UploadIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
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

  useEffect(() => {
    fetchDumps();
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
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <div>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          Database Management
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

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Available Dumps
          </Typography>
          
          {dumps.length === 0 ? (
            <Typography color="textSecondary" align="center" sx={{ py: 4 }}>
              No dumps available. Create your first dump to get started.
            </Typography>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Filename</TableCell>
                    <TableCell>Size</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Actions</TableCell>
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
                          size="small"
                          startIcon={<DownloadIcon />}
                          onClick={() => {
                            // Download functionality
                            const link = document.createElement('a');
                            link.href = `data:text/json;charset=utf-8,${encodeURIComponent(
                              JSON.stringify(dump, null, 2)
                            )}`;
                            link.download = dump.filename;
                            link.click();
                          }}
                          sx={{ mr: 1 }}
                        >
                          Download
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<UploadIcon />}
                          onClick={() => {
                            setSelectedDump(dump);
                            setRestoreDialogOpen(true);
                          }}
                        >
                          Restore
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

      {/* Restore Confirmation Dialog */}
      <Dialog open={restoreDialogOpen} onClose={() => setRestoreDialogOpen(false)}>
        <DialogTitle>Confirm Restore</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to restore the database from "{selectedDump?.filename}"?
          </Typography>
          <Typography color="warning.main" sx={{ mt: 2 }}>
            Warning: This will overwrite all current data in the database.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRestoreDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleRestore}
            variant="contained"
            color="warning"
            disabled={restoreLoading}
          >
            {restoreLoading ? 'Restoring...' : 'Restore'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default DatabaseManagement;
