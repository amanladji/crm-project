import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import CustomerDetails from './pages/CustomerDetails';
import Leads from './pages/Leads';
import authService from './services/auth.service';

const PrivateRoute = ({ children }) => {
  const user = authService.getCurrentUser();
  return user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={
          <PrivateRoute>
             <Dashboard />
          </PrivateRoute>
        } />
        <Route path="/customers" element={
          <PrivateRoute>
             <Customers />
          </PrivateRoute>
        } />
        <Route path="/customers/:id" element={
          <PrivateRoute>
             <CustomerDetails />
          </PrivateRoute>
        } />
        <Route path="/leads" element={
          <PrivateRoute>
             <Leads />
          </PrivateRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;
