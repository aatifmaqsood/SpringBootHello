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
      const [utilizationRes, summaryRes] = await Promise.all([
        axios.get('/api/resource-utilization'),
        axios.get('/api/stats/summary')
      ]);

      setData({
        resourceUtilization: utilizationRes.data,
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
    // Use the actual env column from your table
    const env = app.env || 'unknown';
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

  // CPU Utilization analysis using actual data
  const cpuUtilizationData = data.resourceUtilization
    .filter(app => (app.max_cpu_utilz_percent / 100.0) * app.req_cpu < (app.req_cpu * 0.5))
    .map(app => ({
      app_name: app.app_name,
      max_cpu_utilz_percent: app.max_cpu_utilz_percent,
      req_cpu: app.req_cpu,
      new_req_cpu: app.new_req_cpu,
      project: app.project,
      env: app.env,
      actual_cpu_used: (app.max_cpu_utilz_percent / 100.0) * app.req_cpu,
      threshold_cpu: app.req_cpu * 0.5
    }))
    .sort((a, b) => (b.req_cpu - b.actual_cpu_used) - (a.req_cpu - a.actual_cpu_used))
    .slice(0, 10);

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
                Overprovisioned Apps
              </Typography>
              <Typography variant="h4" color="warning.main">
                {data.summary.overprovisioned_count || 
                 data.resourceUtilization.filter(app => (app.max_cpu_utilz_percent / 100.0) * app.req_cpu < (app.req_cpu * 0.5)).length}
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
              <Typography variant="h4" color="success.main">
                {data.summary.avg_cpu_utilization ? 
                 `${data.summary.avg_cpu_utilization.toFixed(1)}%` :
                 `${(data.resourceUtilization.reduce((sum, app) => sum + (app.max_cpu_utilz_percent || 0), 0) / data.resourceUtilization.length).toFixed(1)}%`}
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
                CPU Utilization by Application
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={cpuUtilizationData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="app_name" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="max_cpu_utilz_percent" fill="#8884d8" name="Max CPU %" />
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
                            {app.app_name}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {app.project} - {app.env}
                          </Typography>
                          <Box sx={{ mt: 1 }}>
                            <Chip 
                              label={`${app.max_cpu_utilz_percent}% CPU`} 
                              color={(app.max_cpu_utilz_percent / 100.0) * app.req_cpu < (app.req_cpu * 0.5) ? 'warning' : 'success'} 
                              size="small" 
                              sx={{ mr: 1 }}
                            />
                            <Chip 
                              label={`${app.req_cpu} → ${app.new_req_cpu}`} 
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
