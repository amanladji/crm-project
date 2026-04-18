import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import CustomerDetails from './pages/CustomerDetails';
import Leads from './pages/Leads';
import ChatPage from './pages/ChatPage';
import ActivityPage from './pages/ActivityPage';
import Settings from './pages/Settings';
import authService from './services/auth.service';

const PrivateRoute = ({ children }) => {
  const user = authService.getCurrentUser();
  return user ? children : <Navigate to="/login" replace />;
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
        <Route path="/chat" element={
          <PrivateRoute>
             <ChatPage />
          </PrivateRoute>
        } />
        <Route path="/activity" element={
          <PrivateRoute>
             <ActivityPage />
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
        <Route path="/settings" element={
          <PrivateRoute>
             <Settings />
          </PrivateRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;
