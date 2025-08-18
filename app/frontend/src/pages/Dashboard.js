import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Alert,
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
  Cell,
  LineChart,
  Line,
} from 'recharts';
import axios from 'axios';

const Dashboard = () => {
  const [data, setData] = useState({
    resourceUtilization: [],
    optimizationHistory: [],
    summary: {}
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [utilizationRes, historyRes, summaryRes] = await Promise.all([
        axios.get('/api/resource-utilization'),
        axios.get('/api/optimization-history'),
        axios.get('/api/stats/summary')
      ]);

      setData({
        resourceUtilization: utilizationRes.data,
        optimizationHistory: historyRes.data,
        summary: summaryRes.data
      });
    } catch (err) {
      setError('Failed to fetch dashboard data');
      console.error('Dashboard data fetch error:', err);
    } finally {
      setLoading(false);
    }
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

  // Prepare chart data
  const envData = data.resourceUtilization.reduce((acc, app) => {
    // Extract environment from app_uniq (e.g., 'uat', 'dit' from 'aaogateway-uat')
    const env = app.app_uniq.split('-').pop() || 'unknown';
    acc[env] = (acc[env] || 0) + 1;
    return acc;
  }, {});

  const pieData = Object.entries(envData).map(([env, count]) => ({
    name: env.toUpperCase(),
    value: count,
  }));

  // Updated to work with actual table structure
  const projectData = data.resourceUtilization.reduce((acc, app) => {
    acc[app.project] = (acc[app.project] || 0) + 1;
    return acc;
  }, {});

  const projectChartData = Object.entries(projectData).map(([project, count]) => ({
    name: project,
    count: count,
  }));

  // PR Status analysis
  const prStatusData = data.resourceUtilization.reduce((acc, app) => {
    acc[app.pr_status] = (acc[app.pr_status] || 0) + 1;
    return acc;
  }, {});

  const prStatusChartData = Object.entries(prStatusData).map(([status, count]) => ({
    name: status,
    count: count,
  }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  return (
    <div>
      <Typography variant="h4" gutterBottom>
        Resource Utilization Dashboard
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Applications
              </Typography>
              <Typography variant="h4">
                {data.summary.total_apps || data.resourceUtilization.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Projects
              </Typography>
              <Typography variant="h4">
                {data.summary.total_projects || Object.keys(projectData).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Open PRs
              </Typography>
              <Typography variant="h4" color="warning.main">
                {data.summary.open_prs || 
                 data.resourceUtilization.filter(app => app.pr_status === 'Open').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Merged PRs
              </Typography>
              <Typography variant="h4" color="success.main">
                {data.summary.merged_prs || 
                 data.resourceUtilization.filter(app => app.pr_status === 'Merged').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Applications by Environment
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

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                PR Status Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={prStatusChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#8884d8" name="Count" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Projects Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={projectChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#82CA9D" name="Applications" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Applications */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Applications
              </Typography>
              <Grid container spacing={2}>
                {data.resourceUtilization
                  .slice(0, 6)
                  .map((app, index) => (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="subtitle2" gutterBottom>
                            {app.app_uniq}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {app.project}
                          </Typography>
                          <Box sx={{ mt: 1 }}>
                            <Chip 
                              label={app.pr_status} 
                              color={app.pr_status === 'Open' ? 'warning' : 'success'} 
                              size="small" 
                              sx={{ mr: 1 }}
                            />
                            <Chip 
                              label={app.branch_nm || 'No Branch'} 
                              color="info" 
                              size="small"
                            />
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </div>
  );
};

export default Dashboard;
