import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import LoginFirebase from "./pages/LoginFirebase";

import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Signalements from "./pages/Signalements";
import SignalementDetails from "./pages/SignalementDetails";
import UsersManagement from "./pages/UsersManagement";
import MapView from "./pages/MapView";



function PrivateRoute({ children }) {
  const { user } = useAuth()
  return user ? children : <Navigate to="/login" />
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          
           <Route path="/login" element={<LoginFirebase />} /> 
          <Route path="/register" element={<Register />} />
          <Route path="/map" element={<MapView />} />
          <Route path="/dashboard" element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } />
          <Route path="/signalements" element={
            <PrivateRoute>
              <Signalements />
            </PrivateRoute>
          } />
          <Route path="/signalements/:id" element={
            <PrivateRoute>
              <SignalementDetails />
            </PrivateRoute>
          } />
          <Route path="/users" element={
            <PrivateRoute>
              <UsersManagement />
            </PrivateRoute>
          } />
          <Route path="/" element={<Navigate to="/map" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
