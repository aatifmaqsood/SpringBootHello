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
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
} from '@mui/material';
import axios from 'axios';

const ResourceUtilization = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filteredData, setFilteredData] = useState([]);
  const [filters, setFilters] = useState({
    env: '',
    project: '',
    search: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [data, filters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/resource-utilization');
      setData(response.data);
    } catch (err) {
      setError('Failed to fetch resource utilization data');
      console.error('Data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...data];

    if (filters.env) {
      filtered = filtered.filter(app => app.env === filters.env);
    }

    if (filters.project) {
      filtered = filtered.filter(app => app.project === filters.project);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(app => 
        app.app_name.toLowerCase().includes(searchLower) ||
        app.app_id.toLowerCase().includes(searchLower) ||
        app.project.toLowerCase().includes(searchLower)
      );
    }

    setFilteredData(filtered);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Merged':
        return 'success';
      case 'Open':
        return 'warning';
      default:
        return 'default';
    }
  };

  const environments = [...new Set(data.map(app => app.env))];
  const projects = [...new Set(data.map(app => app.project))];

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
        Resource Utilization
      </Typography>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Filters
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Search Apps"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="Search by app name, ID, or project"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Environment</InputLabel>
                <Select
                  value={filters.env}
                  label="Environment"
                  onChange={(e) => setFilters({ ...filters, env: e.target.value })}
                >
                  <MenuItem value="">All Environments</MenuItem>
                  {environments.map(env => (
                    <MenuItem key={env} value={env}>{env.toUpperCase()}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Project</InputLabel>
                <Select
                  value={filters.project}
                  label="Project"
                  onChange={(e) => setFilters({ ...filters, project: e.target.value })}
                >
                  <MenuItem value="">All Projects</MenuItem>
                  {projects.map(project => (
                    <MenuItem key={project} value={project}>{project}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box display="flex" alignItems="center" height="100%">
                <Typography variant="body2" color="textSecondary">
                  Showing {filteredData.length} of {data.length} applications
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Resource Utilization Details ({filteredData.length} applications)
          </Typography>
          
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>App Name</TableCell>
                  <TableCell>App ID</TableCell>
                  <TableCell>Project</TableCell>
                  <TableCell>Environment</TableCell>
                  <TableCell>Max CPU</TableCell>
                  <TableCell>Avg CPU</TableCell>
                  <TableCell>Requested CPU</TableCell>
                  <TableCell>New CPU</TableCell>
                  <TableCell>Utilization</TableCell>
                  <TableCell>PR Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredData.map((app) => (
                  <TableRow key={`${app.app_id}-${app.env}`}>
                    <TableCell>
                      <Typography variant="subtitle2">
                        {app.app_name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={app.app_id} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>{app.project}</TableCell>
                    <TableCell>
                      <Chip 
                        label={app.env.toUpperCase()} 
                        size="small" 
                        color="primary" 
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{app.max_cpu}</TableCell>
                    <TableCell>{app.avg_cpu}</TableCell>
                    <TableCell>{app.req_cpu}</TableCell>
                    <TableCell>
                      <Typography 
                        variant="body2" 
                        color={app.req_cpu > app.new_req_cpu ? 'success.main' : 'text.primary'}
                      >
                        {app.new_req_cpu}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={`${app.max_cpu_utilz_percent}%`}
                        color={(app.max_cpu_utilz_percent / 100.0) * app.req_cpu < (app.req_cpu * 0.5) ? 'warning' : 'success'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={app.pr_status}
                        color={getStatusColor(app.pr_status)}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResourceUtilization;
