import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import ResourceUtilization from './pages/ResourceUtilization';
import OptimizationRecommendations from './pages/OptimizationRecommendations';
import OptimizationHistory from './pages/OptimizationHistory';
import DatabaseManagement from './pages/DatabaseManagement';
import './App.css';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <div className="App">
          <Navbar />
          <main style={{ padding: '20px', marginTop: '64px' }}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/resource-utilization" element={<ResourceUtilization />} />
              <Route path="/optimization-recommendations" element={<OptimizationRecommendations />} />
              <Route path="/optimization-history" element={<OptimizationHistory />} />
              <Route path="/database" element={<DatabaseManagement />} />
            </Routes>
          </main>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
