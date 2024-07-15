// src/App.js
import React from 'react';
import './App.css';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import Detalhes from './components/Detalhes';
import MassiveEventsPage from './components/MassiveEventsPage';
import Login from './components/Login';
import PrivateRoute from './components/PrivateRoute';

function App() {
  return (
    <Router>
      <div className="App">
        <header className="App-header">
        </header>
        <main>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/detalhes" element={
              <PrivateRoute>
                <Detalhes />
              </PrivateRoute>
            } />
            <Route path="/massive-events" element={
              <PrivateRoute>
                <MassiveEventsPage />
              </PrivateRoute>
            } />
            <Route path="/" element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            } />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
