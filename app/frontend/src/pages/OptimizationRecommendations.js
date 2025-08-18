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
      
      // First, always fetch resource utilization data
      const utilizationRes = await axios.get('/api/resource-utilization');
      
      // Try to fetch optimization recommendations, but don't fail if it doesn't work
      let recommendationsData = [];
      let usingBackendData = false;
      try {
        const recommendationsRes = await axios.get('/api/optimization-recommendations');
        recommendationsData = recommendationsRes.data;
        usingBackendData = true;
      } catch (recError) {
        console.warn('Optimization recommendations endpoint failed, using resource utilization data:', recError.message);
        // If optimization recommendations fail, process the resource utilization data
        const utilizationData = utilizationRes.data;
        
        // Group by project and calculate optimization metrics
        const projectGroups = {};
        utilizationData.forEach(app => {
          if (!projectGroups[app.project]) {
            projectGroups[app.project] = {
              project: app.project,
              total_apps: 0,
              overprovisioned_apps: 0,
              properly_provisioned_apps: 0,
              total_cpu_utilization: 0,
              potential_cpu_savings: 0
            };
          }
          
          projectGroups[app.project].total_apps++;
          projectGroups[app.project].total_cpu_utilization += parseFloat(app.max_cpu_utilz_percent || 0);
          
          // Check if app is overprovisioned (using < 50% of requested CPU)
          const actualCpuUsed = (parseFloat(app.max_cpu_utilz_percent || 0) / 100.0) * parseInt(app.req_cpu || 0);
          const thresholdCpu = parseInt(app.req_cpu || 0) * 0.5;
          
          if (actualCpuUsed < thresholdCpu) {
            projectGroups[app.project].overprovisioned_apps++;
            projectGroups[app.project].potential_cpu_savings += (parseInt(app.req_cpu || 0) - parseInt(app.new_req_cpu || 0));
          } else {
            projectGroups[app.project].properly_provisioned_apps++;
          }
        });
        
        // Convert to array and calculate averages
        recommendationsData = Object.values(projectGroups).map(project => ({
          ...project,
          avg_cpu_utilization: project.total_apps > 0 ? (project.total_cpu_utilization / project.total_apps) : 0
        })).filter(project => project.overprovisioned_apps > 0); // Only show projects with overprovisioned apps
      }

      setData({
        recommendations: recommendationsData,
        utilization: utilizationRes.data,
        usingBackendData: usingBackendData
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

  // Check if data exists
  if (!data || !data.recommendations) {
    return (
      <Container>
        <Alert severity="warning" sx={{ mt: 2 }}>
          No optimization data available. Please check your database connection.
        </Alert>
      </Container>
    );
  }

  // Calculate summary values with proper type conversion
  const totalOverprovisioned = data.recommendations.reduce((sum, rec) => {
    const value = parseInt(rec.overprovisioned_apps || 0);
    return sum + value;
  }, 0);

  const totalCpuSavings = data.recommendations.reduce((sum, rec) => {
    const value = parseInt(rec.potential_cpu_savings || 0);
    return sum + value;
  }, 0);

  // Prepare chart data
  const chartData = data.recommendations.map(rec => ({
    name: rec.project,
    overprovisioned: parseInt(rec.overprovisioned_apps || 0),
    properly_provisioned: parseInt(rec.properly_provisioned_apps || 0),
    avg_cpu: parseFloat(rec.avg_cpu_utilization || 0).toFixed(1),
    potential_savings: parseInt(rec.potential_cpu_savings || 0)
  }));

  const totalProperlyProvisioned = data.recommendations.reduce((sum, rec) => sum + parseInt(rec.properly_provisioned_apps || 0), 0);

  const pieData = [
    {
      name: 'Overprovisioned',
      value: totalOverprovisioned
    },
    {
      name: 'Properly Provisioned',
      value: totalProperlyProvisioned
    }
  ].filter(item => item.value > 0); // Only show segments with values > 0

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
                {totalOverprovisioned}
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
                {totalCpuSavings}
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
                {pieData.length > 0 ? (
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
                ) : (
                  <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                    <Typography variant="body2" color="textSecondary">
                      No data available for pie chart
                    </Typography>
                  </Box>
                )}
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
                    <TableCell>{rec.total_apps || 0}</TableCell>
                    <TableCell>
                      <Chip 
                        label={rec.overprovisioned_apps || 0} 
                        color={(rec.overprovisioned_apps || 0) > 0 ? "warning" : "success"}
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
                        label={(rec.overprovisioned_apps || 0) > 0 ? "Needs Optimization" : "Optimized"}
                        color={(rec.overprovisioned_apps || 0) > 0 ? "warning" : "success"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {(rec.overprovisioned_apps || 0) > 0 && (
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
              • Overprovisioned Apps: {selectedProject?.overprovisioned_apps || 0}
            </Typography>
            <Typography variant="body2">
              • Potential CPU Savings: {selectedProject?.potential_cpu_savings || 0}
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
