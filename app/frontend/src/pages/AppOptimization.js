import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
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
  Speed as SpeedIcon,
  TrendingUp as TrendingUpIcon,
  Create as CreateIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const AppOptimization = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [appId, setAppId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [appData, setAppData] = useState(null);
  const [searchPerformed, setSearchPerformed] = useState(false);

  // Generate recommendations based on real data
  const generateRecommendations = (appData) => {
    const recommendations = [];
    
    // CPU optimization recommendation
    if (appData.req_cpu && appData.max_cpu_utilz_percent) {
      const currentCpu = appData.req_cpu;
      const utilization = parseFloat(appData.max_cpu_utilz_percent);
      const actualCpuUsed = (utilization / 100.0) * currentCpu;
      const thresholdCpu = currentCpu * 0.5;
      
      if (actualCpuUsed < thresholdCpu) {
        const recommendedCpu = Math.max(Math.ceil(actualCpuUsed * 1.2), 100); // Add 20% buffer, minimum 100m
        const potentialSavings = Math.round(((currentCpu - recommendedCpu) / currentCpu) * 100);
        
        recommendations.push({
          type: 'CPU',
          current: `${currentCpu}m`,
          recommended: `${recommendedCpu}m`,
          potentialSavings: `${potentialSavings}%`,
          risk: potentialSavings > 50 ? 'High' : potentialSavings > 30 ? 'Medium' : 'Low',
          reasoning: `Current utilization is ${utilization.toFixed(1)}% with peaks. Recommended reduction from ${currentCpu}m to ${recommendedCpu}m for optimal resource usage.`
        });
      }
    }
    
    // Add new_req_cpu recommendation if available
    if (appData.new_req_cpu && appData.req_cpu && appData.new_req_cpu !== appData.req_cpu) {
      const currentCpu = appData.req_cpu;
      const newReqCpu = appData.new_req_cpu;
      const potentialSavings = Math.round(((currentCpu - newReqCpu) / currentCpu) * 100);
      
      recommendations.push({
        type: 'CPU (System Recommended)',
        current: `${currentCpu}m`,
        recommended: `${newReqCpu}m`,
        potentialSavings: `${potentialSavings}%`,
        risk: potentialSavings > 50 ? 'High' : potentialSavings > 30 ? 'Medium' : 'Low',
        reasoning: `System analysis suggests reducing CPU from ${currentCpu}m to ${newReqCpu}m based on historical usage patterns.`
      });
    }
    
    // If no specific recommendations, provide general guidance
    if (recommendations.length === 0) {
      recommendations.push({
        type: 'General',
        current: 'N/A',
        recommended: 'N/A',
        potentialSavings: '0%',
        risk: 'Low',
        reasoning: 'Current resource allocation appears to be appropriate based on utilization patterns.'
      });
    }
    
    return recommendations;
  };

  // Generate pie chart data for CPU over-provisioning visualization
  const generatePieChartData = (appData) => {
    if (!appData) {
      // Return sample data for demonstration when no real data is available
      return {
        currentData: [
          { name: 'Utilized CPU', value: 345, fill: '#4caf50' },
          { name: 'Over-Provisioned', value: 155, fill: '#ff9800' }
        ],
        recommendedData: [
          { name: 'Utilized CPU', value: 345, fill: '#4caf50' },
          { name: 'Buffer (20%)', value: 69, fill: '#2196f3' },
          { name: 'Savings', value: 86, fill: '#f44336' }
        ]
      };
    }
    
    // Extract numeric values from the transformed data
    const currentCpu = parseInt(appData.cpuRequest) || 0; // Remove 'm' and convert to number
    const maxCpuUsed = appData.maxCpu || 0;
    const avgCpuUsed = appData.avgCpu || 0;
    const newReqCpu = appData.newReqCpu || 0;
    
    // If we don't have enough data, return sample data
    if (currentCpu === 0) {
      return {
        currentData: [
          { name: 'Utilized CPU', value: 345, fill: '#4caf50' },
          { name: 'Over-Provisioned', value: 155, fill: '#ff9800' }
        ],
        recommendedData: [
          { name: 'Utilized CPU', value: 345, fill: '#4caf50' },
          { name: 'Buffer (20%)', value: 69, fill: '#2196f3' },
          { name: 'Savings', value: 86, fill: '#f44336' },
        ]
      };
    }
    
    // Calculate over-provisioned amount
    const overProvisioned = Math.max(0, currentCpu - maxCpuUsed);
    const utilized = Math.min(maxCpuUsed, currentCpu);
    
    // Data for current state
    const currentData = [
      { name: 'Utilized CPU', value: utilized, fill: '#4caf50' },
      { name: 'Over-Provisioned', value: overProvisioned, fill: '#ff9800' }
    ];
    
    // Data for recommended state - use newReqCpu if available, otherwise calculate
    let recommendedCpu = newReqCpu;
    if (newReqCpu === 0) {
      // Calculate recommended CPU based on max usage + 20% buffer
      recommendedCpu = Math.max(Math.ceil(maxCpuUsed * 1.2), 100);
    }
    
    const buffer = Math.ceil(maxCpuUsed * 0.2);
    const savings = Math.max(0, currentCpu - recommendedCpu);
    
    const recommendedData = [
      { name: 'Utilized CPU', value: utilized, fill: '#4caf50' },
      { name: 'Buffer (20%)', value: buffer, fill: '#2196f3' },
      { name: 'Savings', value: savings, fill: '#f44336' }
    ];
    
    return { currentData, recommendedData };
  };

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
      // Fetch real data from backend API
      const response = await axios.get(`/api/resource-utilization/app/${id}`);
      
      if (response.data && response.data.length > 0) {
        const appData = response.data[0]; // Get the first matching app
        
        // Transform backend data to frontend format
        const transformedData = {
          appId: appData.app_id || id,
          environment: appData.env || 'unknown',
          cpuRequest: `${appData.req_cpu || 0}m`,
          cpuLimit: `${(appData.req_cpu || 0) * 2}m`, // Assuming limit is 2x request
          maxCpuUtilization: `${appData.max_cpu_utilz_percent || 0}%`,
          avgCpuUtilization: `${appData.avg_cpu || 0}%`,
          maxCpuUtilization30Days: `${appData.max_cpu_utilz_percent || 0}%`,
          avgCpuUtilization30Days: `${appData.avg_cpu || 0}%`,
          // Add max_cpu and avg_cpu values from database
          maxCpu: appData.max_cpu || 0,
          avgCpu: appData.avg_cpu || 0,
          newReqCpu: appData.new_req_cpu || 0,
          recommendations: generateRecommendations(appData),
          lastUpdated: new Date().toISOString(),
          // Additional backend fields
          project: appData.project,
          appName: appData.app_name,
          tier: appData.tier,
          prStatus: appData.pr_status,
          prUrl: appData.pr_url
        };
        
        setAppData(transformedData);
      } else {
        setError('Application not found. Please check the application ID and try again.');
        setAppData(null);
      }
    } catch (err) {
      console.error('API Error:', err);
      if (err.response?.status === 404) {
        setError('Application not found. Please check the application ID and try again.');
      } else if (err.response?.status === 500) {
        setError('Backend service error. Please try again later.');
      } else {
        setError('Failed to fetch application data. Please check the application ID and try again.');
      }
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
      
      // Create PR with real data
      const prData = {
        appId: appData.appId,
        appName: appData.appName,
        project: appData.project,
        environment: appData.environment,
        currentCpu: appData.cpuRequest,
        recommendedCpu: appData.recommendations.find(r => r.type === 'CPU')?.recommended || appData.cpuRequest,
        recommendations: appData.recommendations,
        tier: appData.tier
      };
      
      // Call backend API to create PR
      const response = await axios.post('/api/optimization/create-pr', prData);
      
      if (response.data.success) {
        alert(`Pull Request created successfully! PR URL: ${response.data.prUrl || 'Check your Git repository'}`);
      } else {
        alert('Pull Request creation failed. Please try again.');
      }
    } catch (err) {
      console.error('PR Creation Error:', err);
      if (err.response?.status === 500) {
        setError('Backend service error during PR creation. Please try again later.');
      } else {
        setError('Failed to create Pull Request. Please try again.');
      }
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
            <Grid item xs={12}>
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
                        Max CPU Usage
                      </Typography>
                      <Typography variant="h6" color="warning.main">
                        {appData.maxCpu}m
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Avg CPU Usage
                      </Typography>
                      <Typography variant="h6" color="info.main">
                        {appData.avgCpu}m
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Max Utilization %
                      </Typography>
                      <Typography variant="h6" color="warning.main">
                        {appData.maxCpuUtilization30Days}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Avg Utilization %
                      </Typography>
                      <Typography variant="h6" color="info.main">
                        {appData.avgCpuUtilization30Days}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* CPU Over-Provisioning Visualization */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box display="flex" alignItems="center" mb={3}>
              <TrendingUpIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">CPU Over-Provisioning Analysis</Typography>
            </Box>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom align="center" color="primary">
                  Current State
                </Typography>
                {appData && generatePieChartData(appData).currentData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={generatePieChartData(appData).currentData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}m`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {generatePieChartData(appData).currentData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value, name) => [`${value}m`, name]}
                        labelFormatter={(label) => `${label}`}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <Box display="flex" justifyContent="center" alignItems="center" height={300}>
                    <Typography variant="body2" color="text.secondary">
                      No data available for chart
                    </Typography>
                  </Box>
                )}
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom align="center" color="success.main">
                  After Optimization
                </Typography>
                {appData && generatePieChartData(appData).recommendedData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={generatePieChartData(appData).recommendedData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}m`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {generatePieChartData(appData).recommendedData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value, name) => [`${value}m`, name]}
                        labelFormatter={(label) => `${label}`}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <Box display="flex" justifyContent="center" alignItems="center" height={300}>
                    <Typography variant="body2" color="text.secondary">
                      No data available for chart
                    </Typography>
                  </Box>
                )}
              </Grid>
            </Grid>
            
            <Box mt={2} p={2} bgcolor="grey.50" borderRadius={1}>
              <Typography variant="body2" color="text.secondary">
                <strong>Current State:</strong> Shows how much CPU is actually utilized vs. over-provisioned.
                <br />
                <strong>After Optimization:</strong> Shows the recommended allocation with buffer and potential savings.
              </Typography>
            </Box>
          </Paper>

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
