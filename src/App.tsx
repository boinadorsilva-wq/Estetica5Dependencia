import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Layout } from './components/layout/Layout';
import { Login } from './pages/Login';

import { ErrorBoundary } from './components/layout/ErrorBoundary';
import { Dashboard } from './pages/Dashboard';
import { Home } from './pages/Home';
import { Agenda } from './pages/Agenda';
import { Patients } from './pages/Patients';
import { Atendimentos } from './pages/Atendimentos';
import { Financeiro } from './pages/Financeiro';
import { Admin } from '../components/Admin/Admin';
import { Crm } from './pages/Crm';

function App() {
    return (
        <ErrorBoundary>
            <BrowserRouter>
                <Toaster position="top-right" />
                <Routes>
                    <Route path="/login" element={<Login />} />

                    <Route element={<Layout />}>
                        <Route path="/inicio" element={<Dashboard />} />
                        <Route path="/" element={<Home />} />
                        <Route path="/crm" element={<Crm />} />
                        <Route path="/agenda" element={<Agenda />} />
                        <Route path="/pacientes" element={<Patients />} />
                        <Route path="/atendimentos" element={<Atendimentos />} />
                        <Route path="/financeiro" element={<Financeiro />} />
                        <Route path="/admin" element={<Admin />} />
                    </Route>

                    <Route path="*" element={<Navigate to="/inicio" replace />} />
                </Routes>
            </BrowserRouter>
        </ErrorBoundary>
    );
}

export default App;
