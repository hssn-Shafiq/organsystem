import React, { useState, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { getAuth } from "firebase/auth";
// import { db } from "../firebase/config"; 
import { db } from "../../firebase";

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoading(true);
        
        // Get current user
        const auth = getAuth();
        const currentUser = auth.currentUser;
        
        if (!currentUser) {
          throw new Error("No user is signed in");
        }
        
        // Query appointments for the current user
        const appointmentsQuery = query(
          collection(db, "appointments"),
          where("donorId", "==", currentUser.uid)
        );
        
        const appointmentsSnapshot = await getDocs(appointmentsQuery);
        
        // Array to store appointments with hospital info
        const appointmentsWithHospitalInfo = [];
        
        // Fetch hospital info for each appointment
        for (const appointmentDoc of appointmentsSnapshot.docs) {
          const appointmentData = appointmentDoc.data();
          
          // Query hospitals collection to get hospital info
          const hospitalsQuery = query(
            collection(db, "hospitals"),
            where("userId", "==", appointmentData.doctorId)
          );
          
          const hospitalsSnapshot = await getDocs(hospitalsQuery);
          
          let hospitalInfo = { name: "Unknown Hospital" };
          
          if (!hospitalsSnapshot.empty) {
            hospitalInfo = hospitalsSnapshot.docs[0].data();
          }
          
          // Combine appointment data with hospital info
          appointmentsWithHospitalInfo.push({
            id: appointmentDoc.id,
            ...appointmentData,
            hospital: hospitalInfo
          });
        }
        
        setAppointments(appointmentsWithHospitalInfo);
      } catch (err) {
        console.error("Error fetching appointments:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAppointments();
  }, []);
  
  // Format date to a more readable format
  const formatDate = (dateString) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Format time (assuming time is in 24-hour format like "15:30")
  const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(':');
    return new Date(0, 0, 0, hours, minutes).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="w-16 h-16 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
        <p className="mt-4 text-lg font-medium text-gray-700">Loading your appointments...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 mx-auto mt-8 text-center max-w-md">
        <div className="p-6 bg-red-50 rounded-lg shadow-md">
          <h2 className="mb-4 text-xl font-bold text-red-600">Error</h2>
          <p className="text-red-700">{error}</p>
          <p className="mt-4 text-gray-700">Please try again later or contact support if the issue persists.</p>
        </div>
      </div>
    );
  }

  if (appointments.length === 0) {
    return (
      <div className="p-4 mx-auto mt-8 text-center max-w-md">
        <div className="p-6 bg-blue-50 rounded-lg shadow-md">
          <h2 className="mb-4 text-xl font-bold text-blue-600">No Appointments</h2>
          <p className="text-gray-700">You don't have any scheduled appointments.</p>
          <button className="px-4 py-2 mt-4 text-white bg-blue-500 rounded hover:bg-blue-600">
            Schedule an Appointment
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 mx-auto max-w-4xl">
      <h1 className="mb-6 text-2xl font-bold text-center text-gray-800">Your Appointments</h1>
      
      <div className="grid gap-6 md:grid-cols-1">
        {appointments.map((appointment) => (
          <div key={appointment.id} className="overflow-hidden bg-white rounded-lg shadow-md">
            <div className="p-1 text-white bg-blue-500 d-flex align-items-center justify-content-center">
              <p className="text-center font-medium text-light mb-0">Appointment Details</p>
            </div>
            <div className="p-4">
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-gray-800 text-center mb-2">{appointment.hospital.hospitalName || "Hospital Name"}</h2>
                <p className="text-sm text-gray-500 text-center">
                  ({appointment.hospital.address || "Hospital Address"})
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Date</p>
                  <p className="text-gray-800">{formatDate(appointment.date)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Time</p>
                  <p className="text-gray-800">{formatTime(appointment.time)}</p>
                </div>
              </div>
              
              {appointment.hospital.phone && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-500">Contact</p>
                  <p className="text-gray-800">{appointment.hospital.phone}</p>
                </div>
              )}
              
              <div className="flex justify-end gap-2 mt-4">
                <button className="px-3 py-1 text-sm text-blue-600 bg-blue-100 rounded hover:bg-blue-200">
                  Reschedule
                </button>
                <button className="px-3 py-1 text-sm text-red-600 bg-red-100 rounded hover:bg-red-200">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Appointments;