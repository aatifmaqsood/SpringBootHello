import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Grid,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Divider,
  Chip,
  Stack
} from '@mui/material';
import {
  Search as SearchIcon,
  Memory as MemoryIcon,
  Speed as SpeedIcon,
  TrendingUp as TrendingUpIcon,
  Create as CreateIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

const AppOptimization = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [appId, setAppId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [appData, setAppData] = useState(null);
  const [searchPerformed, setSearchPerformed] = useState(false);

  // Initialize appId from URL params on component mount
  useEffect(() => {
    const urlAppId = searchParams.get('appId');
    if (urlAppId) {
      setAppId(urlAppId);
      setSearchPerformed(true);
      fetchAppData(urlAppId);
    }
  }, [searchParams]);

  const fetchAppData = async (id) => {
    setLoading(true);
    setError('');
    try {
      // Mock API call - replace with actual backend endpoint
      // const response = await axios.get(`/api/optimization/app/${id}`);
      
      // Simulating API response for now
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockData = {
        appId: id,
        environment: 'production',
        cpuRequest: '1000m',
        cpuLimit: '2000m',
        maxCpuUtilization: '45%',
        avgCpuUtilization: '28%',
        maxCpuUtilization30Days: '67%',
        avgCpuUtilization30Days: '32%',
        memoryRequest: '512Mi',
        memoryLimit: '1Gi',
        maxMemoryUtilization: '78%',
        avgMemoryUtilization: '65%',
        recommendations: [
          {
            type: 'CPU',
            current: '1000m',
            recommended: '600m',
            potentialSavings: '40%',
            risk: 'Low',
            reasoning: 'Average utilization is 32% with peaks at 67%'
          },
          {
            type: 'Memory',
            current: '512Mi',
            recommended: '384Mi',
            potentialSavings: '25%',
            risk: 'Medium',
            reasoning: 'Average utilization is 65% with peaks at 78%'
          }
        ],
        lastUpdated: new Date().toISOString()
      };
      
      setAppData(mockData);
    } catch (err) {
      setError('Failed to fetch application data. Please check the application ID and try again.');
      setAppData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (appId.trim()) {
      setSearchPerformed(true);
      setSearchParams({ appId: appId.trim() });
      fetchAppData(appId.trim());
    }
  };

  const handleCreatePR = async () => {
    if (!appData) return;
    
    try {
      setLoading(true);
      // Mock API call for PR creation
      // const response = await axios.post('/api/optimization/create-pr', {
      //   appId: appData.appId,
      //   recommendations: appData.recommendations
      // });
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      alert('Pull Request created successfully! Check your Git repository for the changes.');
    } catch (err) {
      setError('Failed to create Pull Request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    if (appId) {
      fetchAppData(appId);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Resource Optimization Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Search for an application by ID to view its resource utilization and optimization recommendations. Use the search below to get started.
      </Typography>

      {/* Search Form */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box component="form" onSubmit={handleSearch} sx={{ display: 'flex', gap: 2 }}>
          <TextField
            fullWidth
            label="Application ID"
            value={appId}
            onChange={(e) => setAppId(e.target.value)}
            placeholder="Enter application ID (e.g., myapp123)"
            variant="outlined"
            size="large"
          />
          <Button
            type="submit"
            variant="contained"
            size="large"
            startIcon={<SearchIcon />}
            disabled={!appId.trim() || loading}
          >
            Search
          </Button>
          {appData && (
            <Button
              variant="outlined"
              size="large"
              startIcon={<RefreshIcon />}
              onClick={handleRefresh}
              disabled={loading}
            >
              Refresh
            </Button>
          )}
        </Box>
      </Paper>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Loading State */}
      {loading && (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      )}

      {/* Application Data Display */}
      {appData && !loading && (
        <>
          {/* Header Info */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={6}>
                <Typography variant="h5" gutterBottom>
                  {appData.appId}
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip 
                    label={appData.environment} 
                    color="primary" 
                    size="small" 
                  />
                  <Typography variant="body2" color="text.secondary">
                    Last updated: {new Date(appData.lastUpdated).toLocaleString()}
                  </Typography>
                </Stack>
              </Grid>
              <Grid item xs={12} md={6} textAlign="right">
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  startIcon={<CreateIcon />}
                  onClick={handleCreatePR}
                  disabled={loading}
                >
                  Create Pull Request
                </Button>
              </Grid>
            </Grid>
          </Paper>

          {/* Resource Metrics */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            {/* CPU Metrics */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={2}>
                    <SpeedIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">CPU Utilization</Typography>
                  </Box>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Current Request
                      </Typography>
                      <Typography variant="h6">
                        {appData.cpuRequest}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Current Limit
                      </Typography>
                      <Typography variant="h6">
                        {appData.cpuLimit}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Max (30 days)
                      </Typography>
                      <Typography variant="h6" color="warning.main">
                        {appData.maxCpuUtilization30Days}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Average (30 days)
                      </Typography>
                      <Typography variant="h6" color="info.main">
                        {appData.avgCpuUtilization30Days}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Memory Metrics */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={2}>
                    <MemoryIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">Memory Utilization</Typography>
                  </Box>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Current Request
                      </Typography>
                      <Typography variant="h6">
                        {appData.memoryRequest}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Current Limit
                      </Typography>
                      <Typography variant="h6">
                        {appData.memoryLimit}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Max (30 days)
                      </Typography>
                      <Typography variant="h6" color="warning.main">
                        {appData.maxMemoryUtilization}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Average (30 days)
                      </Typography>
                      <Typography variant="h6" color="info.main">
                        {appData.avgMemoryUtilization}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Recommendations */}
          <Paper sx={{ p: 3 }}>
            <Box display="flex" alignItems="center" mb={3}>
              <TrendingUpIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Optimization Recommendations</Typography>
            </Box>
            
            {appData.recommendations.map((rec, index) => (
              <Card key={index} sx={{ mb: 2 }}>
                <CardContent>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={3}>
                      <Typography variant="h6" color="primary">
                        {rec.type}
                      </Typography>
                      <Chip 
                        label={rec.risk} 
                        color={rec.risk === 'Low' ? 'success' : 'warning'} 
                        size="small" 
                      />
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <Typography variant="body2" color="text.secondary">
                        Current
                      </Typography>
                      <Typography variant="body1">
                        {rec.current}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <Typography variant="body2" color="text.secondary">
                        Recommended
                      </Typography>
                      <Typography variant="body1" color="success.main">
                        {rec.recommended}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <Typography variant="body2" color="text.secondary">
                        Potential Savings
                      </Typography>
                      <Typography variant="body1" color="success.main">
                        {rec.potentialSavings}
                      </Typography>
                    </Grid>
                  </Grid>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="body2" color="text.secondary">
                    {rec.reasoning}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Paper>
        </>
      )}

      {/* No Results State */}
      {searchPerformed && !appData && !loading && !error && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No application found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Please check the application ID and try again.
          </Typography>
        </Paper>
      )}
    </Container>
  );
};

export default AppOptimization;
