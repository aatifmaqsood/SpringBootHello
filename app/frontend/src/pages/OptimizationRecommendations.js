import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import axios from 'axios';

const OptimizationRecommendations = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchOptimizationData();
  }, []);

  const fetchOptimizationData = async () => {
    try {
      setLoading(true);
      const [recommendationsRes, utilizationRes] = await Promise.all([
        axios.get('/api/optimization-recommendations'),
        axios.get('/api/resource-utilization')
      ]);

      setData({
        recommendations: recommendationsRes.data,
        utilization: utilizationRes.data
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOptimize = (project) => {
    setSelectedProject(project);
    setDialogOpen(true);
  };

  const handleExecuteOptimization = () => {
    // Here you would implement the actual optimization logic
    console.log('Executing optimization for:', selectedProject);
    setDialogOpen(false);
    setSelectedProject(null);
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  if (loading) {
    return (
      <Container>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 2 }}>
          Error loading optimization recommendations: {error}
        </Alert>
      </Container>
    );
  }

  // Prepare chart data
  const chartData = data.recommendations.map(rec => ({
    name: rec.project,
    overprovisioned: rec.overprovisioned_apps,
    properly_provisioned: rec.properly_provisioned_apps,
    avg_cpu: parseFloat(rec.avg_cpu_utilization || 0).toFixed(1),
    potential_savings: rec.potential_cpu_savings
  }));

  const pieData = [
    {
      name: 'Overprovisioned',
      value: data.recommendations.reduce((sum, rec) => sum + rec.overprovisioned_apps, 0)
    },
    {
      name: 'Properly Provisioned',
      value: data.recommendations.reduce((sum, rec) => sum + rec.properly_provisioned_apps, 0)
    }
  ];

  return (
    <Container maxWidth="xl">
      <Typography variant="h4" gutterBottom>
        Optimization Recommendations
      </Typography>

      {/* Important Notice */}
      <Alert severity="info" sx={{ mb: 4 }}>
        <Typography variant="body2">
          <strong>Optimization Criteria:</strong> Applications are considered overprovisioned when their 
          maximum CPU utilization is below 50% of their requested CPU allocation. 
          This ensures we only recommend optimizations for truly underutilized resources.
        </Typography>
      </Alert>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Projects
              </Typography>
              <Typography variant="h4">
                {data.recommendations.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Overprovisioned Apps
              </Typography>
              <Typography variant="h4" color="warning.main">
                {data.recommendations.reduce((sum, rec) => sum + rec.overprovisioned_apps, 0)}
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
                {data.recommendations.reduce((sum, rec) => sum + (rec.potential_cpu_savings || 0), 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Avg CPU Utilization
              </Typography>
              <Typography variant="h4">
                {data.recommendations.length > 0 
                  ? `${(data.recommendations.reduce((sum, rec) => sum + parseFloat(rec.avg_cpu_utilization || 0), 0) / data.recommendations.length).toFixed(1)}%`
                  : '0%'
                }
              </Typography>
            </CardContent>
          </Card>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Provisioning Status by Project
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="overprovisioned" fill="#ff6b6b" name="Overprovisioned" />
                  <Bar dataKey="properly_provisioned" fill="#51cf66" name="Properly Provisioned" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Overall Provisioning Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        </Grid>
      </Grid>

      {/* Recommendations Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Detailed Optimization Recommendations
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Project</strong></TableCell>
                  <TableCell><strong>Total Apps</strong></TableCell>
                  <TableCell><strong>Overprovisioned</strong></TableCell>
                  <TableCell><strong>Avg CPU %</strong></TableCell>
                  <TableCell><strong>Potential Savings</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell><strong>Action</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.recommendations.map((rec, index) => (
                  <TableRow key={index}>
                    <TableCell>{rec.project}</TableCell>
                    <TableCell>{rec.total_apps}</TableCell>
                    <TableCell>
                      <Chip 
                        label={rec.overprovisioned_apps} 
                        color={rec.overprovisioned_apps > 0 ? "warning" : "success"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{parseFloat(rec.avg_cpu_utilization || 0).toFixed(1)}%</TableCell>
                    <TableCell>
                      <Chip 
                        label={`${rec.potential_cpu_savings || 0} CPU`}
                        color="info"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={rec.overprovisioned_apps > 0 ? "Needs Optimization" : "Optimized"}
                        color={rec.overprovisioned_apps > 0 ? "warning" : "success"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {rec.overprovisioned_apps > 0 && (
                        <Button
                          variant="contained"
                          size="small"
                          color="primary"
                          onClick={() => handleOptimize(rec)}
                        >
                          Optimize
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Optimization Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Execute Optimization for {selectedProject?.project}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            This will execute the optimization pipeline for the selected project.
          </Typography>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Optimization Details:
            </Typography>
            <Typography variant="body2">
              • Project: {selectedProject?.project}
            </Typography>
            <Typography variant="body2">
              • Overprovisioned Apps: {selectedProject?.overprovisioned_apps}
            </Typography>
            <Typography variant="body2">
              • Potential CPU Savings: {selectedProject?.potential_cpu_savings}
            </Typography>
            <Typography variant="body2">
              • Average CPU Utilization: {parseFloat(selectedProject?.avg_cpu_utilization || 0).toFixed(1)}%
            </Typography>
            <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
              • Criteria: Apps using less than 50% of requested CPU
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleExecuteOptimization} variant="contained" color="primary">
            Execute Optimization
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default OptimizationRecommendations;
