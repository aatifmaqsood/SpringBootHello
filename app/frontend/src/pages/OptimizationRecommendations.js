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
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  PlayArrow as PlayArrowIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import axios from 'axios';

const OptimizationRecommendations = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedApp, setSelectedApp] = useState(null);
  const [optimizeDialogOpen, setOptimizeDialogOpen] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [optimizationNotes, setOptimizationNotes] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/optimization-recommendations');
      setData(response.data);
    } catch (err) {
      setError('Failed to fetch optimization recommendations');
      console.error('Data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOptimize = (app) => {
    setSelectedApp(app);
    setOptimizationNotes('');
    setOptimizeDialogOpen(true);
  };

  const executeOptimization = async () => {
    if (!selectedApp) return;

    try {
      setOptimizing(true);
      
      // Create optimization record
      const optimizationData = {
        app_uniq: selectedApp.app_uniq,
        app_id: selectedApp.app_id,
        env: selectedApp.env,
        old_req_cpu: selectedApp.req_cpu,
        new_req_cpu: selectedApp.new_req_cpu,
        status: 'pending',
        notes: optimizationNotes
      };

      await axios.post('/api/optimization-history', optimizationData);
      
      // Close dialog and refresh data
      setOptimizeDialogOpen(false);
      setSelectedApp(null);
      setOptimizationNotes('');
      
      // Show success message
      setError(null);
      
      // Refresh recommendations (remove the optimized app)
      setData(data.filter(app => 
        !(app.app_id === selectedApp.app_id && app.env === selectedApp.env)
      ));
      
    } catch (err) {
      setError('Failed to execute optimization');
      console.error('Optimization error:', err);
    } finally {
      setOptimizing(false);
    }
  };

  const getSavingsColor = (savings) => {
    if (savings > 50) return 'success';
    if (savings > 25) return 'warning';
    return 'info';
  };

  const getUtilizationColor = (utilization) => {
    const value = parseFloat(utilization.replace(' API', ''));
    if (value > 100) return 'error';
    if (value > 80) return 'warning';
    return 'success';
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
        Optimization Recommendations
      </Typography>

      <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
        Applications that can be optimized for better resource utilization and cost savings.
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Recommendations
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
                Total CPU Savings
              </Typography>
              <Typography variant="h4" color="success.main">
                {data.reduce((sum, app) => sum + (app.req_cpu - app.new_req_cpu), 0).toFixed(0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Avg Savings %
              </Typography>
              <Typography variant="h4" color="warning.main">
                {data.length > 0 
                  ? (data.reduce((sum, app) => sum + app.cpu_savings_percent, 0) / data.length).toFixed(1)
                  : 0
                }%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                High Priority
              </Typography>
              <Typography variant="h4" color="error.main">
                {data.filter(app => app.cpu_savings_percent > 50).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recommendations Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Optimization Opportunities ({data.length} applications)
          </Typography>
          
          {data.length === 0 ? (
            <Box textAlign="center" py={4}>
              <CheckCircleIcon color="success" sx={{ fontSize: 64, mb: 2 }} />
              <Typography variant="h6" color="success.main">
                No optimization recommendations found
              </Typography>
              <Typography variant="body2" color="textSecondary">
                All applications are optimally provisioned!
              </Typography>
            </Box>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>App Name</TableCell>
                    <TableCell>Environment</TableCell>
                    <TableCell>Current CPU</TableCell>
                    <TableCell>Recommended CPU</TableCell>
                    <TableCell>Savings</TableCell>
                    <TableCell>Utilization</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.map((app) => (
                    <TableRow key={`${app.app_id}-${app.env}`}>
                      <TableCell>
                        <Box>
                          <Typography variant="subtitle2">
                            {app.app_name}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {app.app_id}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={app.env.toUpperCase()} 
                          size="small" 
                          color="primary" 
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {app.req_cpu}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="success.main">
                          {app.new_req_cpu}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={`${app.cpu_savings_percent}%`}
                          color={getSavingsColor(app.cpu_savings_percent)}
                          size="small"
                          icon={<TrendingUpIcon />}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={app.max_cpu_uti}
                          color={getUtilizationColor(app.max_cpu_uti)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<PlayArrowIcon />}
                          onClick={() => handleOptimize(app)}
                          color="primary"
                        >
                          Optimize
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

      {/* Optimization Dialog */}
      <Dialog 
        open={optimizeDialogOpen} 
        onClose={() => setOptimizeDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Execute Resource Optimization
        </DialogTitle>
        <DialogContent>
          {selectedApp && (
            <Box>
              <Typography variant="body1" gutterBottom>
                <strong>Application:</strong> {selectedApp.app_name} ({selectedApp.app_id})
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Environment:</strong> {selectedApp.env.toUpperCase()}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Current CPU Request:</strong> {selectedApp.req_cpu}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>New CPU Request:</strong> {selectedApp.new_req_cpu}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>CPU Savings:</strong> {selectedApp.cpu_savings_percent}%
              </Typography>
              
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Optimization Notes (Optional)"
                value={optimizationNotes}
                onChange={(e) => setOptimizationNotes(e.target.value)}
                placeholder="Add any notes about this optimization..."
                sx={{ mt: 2 }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOptimizeDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={executeOptimization}
            variant="contained"
            disabled={optimizing}
            startIcon={optimizing ? <CircularProgress size={20} /> : <PlayArrowIcon />}
          >
            {optimizing ? 'Executing...' : 'Execute Optimization'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default OptimizationRecommendations;
