import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { UserProvider } from "./contexts/UserContext";
import PrivateRoute from "./components/PrivateRoute";
import Navbar from "./components/Navbar";
import Login from "./components/Login";
import Register from "./components/Register";
import DonorDashboard from "./components/donor/Dashboard";
import DoctorDashboard from "./components/doctor/Dashboard";
import Profile from "./components/donor/Profile";
import MedicalForm from "./components/donor/medicalForm";
import AdminDashboard from "./components/admin/Dashboard";
import DoctorManagement from "./components/admin/DoctorManagement";
import DonorManagement from "./components/admin/DonorManagement";
import Reports from "./components/admin/Reports";
import BecomeHospital from "./Pages/BecomeHospital";
import HospitalApplications from "./components/doctor/Application";
import NotFoundPage from "./Pages/NotFoundPage";
import Home from "./Pages/Home";


function App() {
  return (
    <UserProvider>
      <Router>
        <Navbar />
        <Routes>
        <Route path="*" element={<NotFoundPage />} />
        <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/register-as-hospital" element={<BecomeHospital />} />
          <Route
            path="/donor/dashboard"
            element={
              <PrivateRoute role="donor">
                <DonorDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/doctor/dashboard"
            element={
              <PrivateRoute role="doctor">
                <DoctorDashboard />
              </PrivateRoute>
            }
          />
            <Route
            path="/doctor/applications"
            element={
              <PrivateRoute role="doctor">
                <HospitalApplications />
              </PrivateRoute>
            }
          />
          <Route
            path="/donor/profile"
            element={
              <PrivateRoute role="donor">
                <Profile />
              </PrivateRoute>
            }
          />
          <Route
            path="/donor/medical-form"
            element={
              <PrivateRoute role="donor">
                <MedicalForm />
              </PrivateRoute>
            }
          />

          {/* admin routes */}
          <Route
            path="/admin/dashboard"
            element={
              <PrivateRoute role="admin">
                <AdminDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/doctor-management"
            element={
              <PrivateRoute role="admin">
                <DoctorManagement />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/donor-management"
            element={
              <PrivateRoute role="admin">
                <DonorManagement />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <PrivateRoute role="admin">
                <Reports />
              </PrivateRoute>
            }
          />
        </Routes>
      </Router>
    </UserProvider>
  );
}

export default App;
