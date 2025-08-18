import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
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
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
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

const PRStatusAnalysis = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterProject, setFilterProject] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterEnv, setFilterEnv] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/resource-utilization');
      setData(response.data);
    } catch (err) {
      setError('Failed to fetch PR status data');
      console.error('Data fetch error:', err);
    } finally {
      setLoading(false);
    }
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
          {error}
        </Alert>
      </Container>
    );
  }

  // Filter data based on selected filters
  const filteredData = data.filter(item => {
    if (filterProject && item.project !== filterProject) return false;
    if (filterStatus && item.pr_status !== filterStatus) return false;
    if (filterEnv && item.env !== filterEnv) return false;
    return true;
  });

  // Prepare chart data
  const statusData = data.reduce((acc, item) => {
    acc[item.pr_status] = (acc[item.pr_status] || 0) + 1;
    return acc;
  }, {});

  const statusChartData = Object.entries(statusData).map(([status, count]) => ({
    name: status,
    count: count,
  }));

  const projectStatusData = data.reduce((acc, item) => {
    if (!acc[item.project]) {
      acc[item.project] = { Open: 0, Merged: 0, Closed: 0 };
    }
    acc[item.project][item.pr_status] = (acc[item.project][item.pr_status] || 0) + 1;
    return acc;
  }, {});

  const projectChartData = Object.entries(projectStatusData).map(([project, statuses]) => ({
    name: project,
    ...statuses
  }));

  const pieData = Object.entries(statusData).map(([status, count]) => ({
    name: status,
    value: count,
  }));

  // Get unique values for filters
  const projects = [...new Set(data.map(item => item.project))];
  const statuses = [...new Set(data.map(item => item.pr_status))];
  const environments = [...new Set(data.map(item => item.env))];

  return (
    <Container maxWidth="xl">
      <Typography variant="h4" gutterBottom>
        PR Status Analysis
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total PRs
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
                Open PRs
              </Typography>
              <Typography variant="h4" color="warning.main">
                {data.filter(item => item.pr_status === 'Open').length}
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
                {data.filter(item => item.pr_status === 'Merged').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Projects
              </Typography>
              <Typography variant="h4">
                {projects.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Filters
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Project</InputLabel>
                <Select
                  value={filterProject}
                  label="Project"
                  onChange={(e) => setFilterProject(e.target.value)}
                >
                  <MenuItem value="">All Projects</MenuItem>
                  {projects.map(project => (
                    <MenuItem key={project} value={project}>{project}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filterStatus}
                  label="Status"
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <MenuItem value="">All Statuses</MenuItem>
                  {statuses.map(status => (
                    <MenuItem key={status} value={status}>{status}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Environment</InputLabel>
                <Select
                  value={filterEnv}
                  label="Environment"
                  onChange={(e) => setFilterEnv(e.target.value)}
                >
                  <MenuItem value="">All Environments</MenuItem>
                  {environments.map(env => (
                    <MenuItem key={env} value={env}>{env}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Charts */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                PR Status Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={statusChartData}>
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
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                PR Status by Project
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={projectChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Open" fill="#ff6b6b" name="Open" />
                  <Bar dataKey="Merged" fill="#51cf66" name="Merged" />
                  <Bar dataKey="Closed" fill="#868e96" name="Closed" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* PR Status Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            PR Status Details ({filteredData.length} records)
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Application</strong></TableCell>
                  <TableCell><strong>Project</strong></TableCell>
                  <TableCell><strong>Environment</strong></TableCell>
                  <TableCell><strong>PR Status</strong></TableCell>
                  <TableCell><strong>PR URL</strong></TableCell>
                  <TableCell><strong>CPU Utilization</strong></TableCell>
                  <TableCell><strong>Current CPU</strong></TableCell>
                  <TableCell><strong>Recommended CPU</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredData.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Box>
                        <Typography variant="subtitle2">
                          {item.app_name}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {item.app_uniq}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{item.project}</TableCell>
                    <TableCell>
                      <Chip 
                        label={item.env} 
                        size="small" 
                        color="primary" 
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={item.pr_status} 
                        color={item.pr_status === 'Open' ? 'warning' : 
                               item.pr_status === 'Merged' ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {item.pr_url ? (
                        <a href={item.pr_url} target="_blank" rel="noopener noreferrer">
                          View PR
                        </a>
                      ) : (
                        <Typography variant="body2" color="textSecondary">
                          No URL
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={`${item.max_cpu_utilz_percent}% CPU`} 
                        color={(item.max_cpu_utilz_percent / 100.0) * item.req_cpu < (item.req_cpu * 0.5) ? 'warning' : 'success'} 
                        size="small" 
                      />
                    </TableCell>
                    <TableCell>{item.req_cpu}</TableCell>
                    <TableCell>
                      <Typography variant="body2" color="success.main">
                        {item.new_req_cpu}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Container>
  );
};

export default PRStatusAnalysis;
