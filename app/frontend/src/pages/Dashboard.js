import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
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
      
      // Try to fetch from API first
      try {
        const [utilizationRes, summaryRes] = await Promise.all([
          axios.get('/api/resource-utilization'),
          axios.get('/api/stats/summary')
        ]);

        setData({
          resourceUtilization: utilizationRes.data,
          summary: summaryRes.data
        });
      } catch (apiError) {
        console.log('API call failed, using mock data:', apiError.message);
        
        // Use mock data if API fails
        const mockData = {
          resourceUtilization: [
            {
              app_name: 'Sample App 1',
              app_id: 'AP001',
              project: 'Project Alpha',
              env: 'DIT',
              max_cpu_utilz_percent: 45.2,
              req_cpu: 512,
              new_req_cpu: 256,
              max_cpu: 231.4,
              avg_cpu: 125.8
            },
            {
              app_name: 'Sample App 2',
              app_id: 'AP002',
              project: 'Project Beta',
              env: 'UAT',
              max_cpu_utilz_percent: 78.9,
              req_cpu: 1024,
              new_req_cpu: 768,
              max_cpu: 808.9,
              avg_cpu: 456.2
            },
            {
              app_name: 'Sample App 3',
              app_id: 'AP003',
              project: 'Project Gamma',
              env: 'DIT',
              max_cpu_utilz_percent: 23.1,
              req_cpu: 256,
              new_req_cpu: 128,
              max_cpu: 59.1,
              avg_cpu: 32.4
            }
          ],
          summary: {
            total_apps: 3,
            total_projects: 3,
            environments: ['DIT', 'UAT'],
            projects: ['Project Alpha', 'Project Beta', 'Project Gamma'],
            overprovisioned_count: 2,
            avg_cpu_utilization: 49.1,
            total_cpu_savings: 640
          }
        };
        
        setData(mockData);
      }
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
                 `${parseFloat(data.summary.avg_cpu_utilization || 0).toFixed(1)}%` :
                 data.resourceUtilization.length > 0 ?
                 `${(data.resourceUtilization.reduce((sum, app) => sum + parseFloat(app.max_cpu_utilz_percent || 0), 0) / data.resourceUtilization.length).toFixed(1)}%` :
                 '0%'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={4}>
                  <Card 
                    variant="outlined" 
                    sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' } }}
                    onClick={() => navigate('/app-optimization')}
                  >
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>
                        🚀 App Optimization
                      </Typography>
                      <Typography variant="body2" color="textSecondary" paragraph>
                        Search and optimize specific applications by ID
                      </Typography>
                      <Typography variant="body2" color="primary">
                        Go to App Optimization →
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Card 
                    variant="outlined" 
                    sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' } }}
                    onClick={() => navigate('/resource-utilization')}
                  >
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>
                        📊 Resource Analysis
                      </Typography>
                      <Typography variant="body2" color="textSecondary" paragraph>
                        View comprehensive resource utilization data
                      </Typography>
                      <Typography variant="body2" color="primary">
                        View Resource Utilization →
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Card 
                    variant="outlined" 
                    sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' } }}
                    onClick={() => navigate('/optimization-history')}
                  >
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>
                        📈 Optimization History
                      </Typography>
                      <Typography variant="body2" color="textSecondary" paragraph>
                        Track optimization recommendations and PR status
                      </Typography>
                      <Typography variant="body2" color="primary">
                        View History →
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
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
