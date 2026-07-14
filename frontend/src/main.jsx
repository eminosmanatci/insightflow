import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import App from './App.jsx';
import Login from './Login.jsx';
import Register from './Register.jsx'; // Register bileşeni dahil edildi
import Datasets from './Datasets.jsx';
import './index.css';

// Giriş yapılmamışsa kullanıcıyı login sayfasına yönlendiren koruma bileşeni
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Herkese açık rotalar */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} /> {/* Yeni rota buraya eklendi */}
        
        {/* Sadece giriş yapmış kullanıcıların görebileceği korumalı rotalar */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <App />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/datasets" 
          element={
            <ProtectedRoute>
              <Datasets />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);