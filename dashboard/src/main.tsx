import React from 'react';
import './index.css';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DashboardPage } from './pages/DashboardPage';
import { ApiKeysPage } from './pages/ApiKeysPage';
import { BillingPage } from './pages/BillingPage';
import { DocsPage } from './pages/DocsPage';
import { Layout } from './components/Layout';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/keys" element={<ApiKeysPage />} />
          <Route path="/billing" element={<BillingPage />} />
          <Route path="/docs" element={<DocsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
