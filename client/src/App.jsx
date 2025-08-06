import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import MainPage from './pages/MainPage';
import Map from './pages/Map';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainPage />} />
        {/* <Route path="/main" element={<MainPage />} /> */}
        <Route path="/map" element={<Map />} />
      </Routes>
    </Router>
  );
};

export default App;
