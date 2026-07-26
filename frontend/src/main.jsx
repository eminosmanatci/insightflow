import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import App from "./App.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Datasets from "./Datasets.jsx";
import Login from "./Login.jsx";
import Register from "./Register.jsx";
import "./index.css";

// Giriş yapılmamışsa kullanıcıyı login sayfasına yönlendiren koruma bileşeni

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Herkese açık rotalar */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />{" "}
        {/* Yeni rota buraya eklendi */}
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
