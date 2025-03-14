import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  getDoc,
  addDoc,
  serverTimestamp
} from "firebase/firestore";
import { db, auth } from "../../firebase";
import { CalendarIcon, ClockIcon, UserIcon, CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";

const HospitalAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [approvedDonors, setApprovedDonors] = useState([]);
  const [activeTab, setActiveTab] = useState("current");
  const [loading, setLoading] = useState(true);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [statusNotes, setStatusNotes] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [processingStatus, setProcessingStatus] = useState(false);

  // Fetch donor name from medicalRecord by donorId
  const fetchDonorName = async (donorId) => {
    try {
      console.log("Fetching name for donor ID:", donorId);

      if (!donorId) {
        console.log("Invalid donor ID");
        return "Unknown Name";
      }

      // Query the medicalRecord collection
      const medicalRecordsRef = collection(db, "medicalRecords");
      const q = query(medicalRecordsRef, where("donorId", "==", donorId));
      const querySnapshot = await getDocs(q);

      console.log("Query results count:", querySnapshot.size);

      if (!querySnapshot.empty) {
        // Get the medical record document
        const medicalRecord = querySnapshot.docs[0].data();
        console.log("Full medical record:", medicalRecord);

        // Get donor name from the medical record
        if (medicalRecord.name) {
          return medicalRecord.name;
        } else if (medicalRecord.donorName) {
          return medicalRecord.donorName;
        } else if (
          medicalRecord.emergencyContact &&
          medicalRecord.emergencyContact.name
        ) {
          return medicalRecord.emergencyContact.name;
        } else {
          console.log("No name field found in medical record");
          return donorId; // Fall back to showing the ID if name isn't found
        }
      } else {
        console.log("No medical records found for donorId:", donorId);
        return donorId; // Fall back to showing the ID
      }
    } catch (error) {
      console.error("Error fetching donor name:", error);
      return "Unknown Name";
    }
  };

  // Get medical record details for a donor
  const fetchMedicalRecord = async (donorId) => {
    try {
      const medicalRecordsRef = collection(db, "medicalRecords");
      const q = query(medicalRecordsRef, where("donorId", "==", donorId));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        return {
          id: querySnapshot.docs[0].id,
          ...querySnapshot.docs[0].data()
        };
      }
      return null;
    } catch (error) {
      console.error("Error fetching medical record:", error);
      return null;
    }
  };

  // Fetch appointments from Firestore
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoading(true);
        const currentUser = auth.currentUser;
        if (!currentUser) {
          console.log("No current user found");
          setLoading(false);
          return;
        }

        console.log("Current user ID:", currentUser.uid);

        // Fetch regular appointments
        const appointmentsRef = collection(db, "appointments");
        const q = query(
          appointmentsRef,
          where("hospitalId", "==", currentUser.uid)
        );
        const querySnapshot = await getDocs(q);

        console.log("Appointments found:", querySnapshot.size);

        const appointmentsData = [];

        // Process each appointment and fetch donor names
        for (const docSnapshot of querySnapshot.docs) {
          const appointmentData = {
            id: docSnapshot.id,
            ...docSnapshot.data(),
          };

          console.log("Processing appointment:", appointmentData);

          // Fetch donor name from medicalRecord for this appointment
          const donorName = await fetchDonorName(appointmentData.donorId);
          appointmentData.donorName = donorName;

          console.log("Donor name fetched:", donorName);

          appointmentsData.push(appointmentData);
        }

        // Process the appointments to determine if they're current, upcoming, or past
        const today = new Date();
        const processedAppointments = appointmentsData.map((apt) => {
          const appointmentDate = new Date(`${apt.date}T${apt.time}`);
          let status = "upcoming";

          if (appointmentDate < today) {
            status = "past";
          } else if (
            appointmentDate.getDate() === today.getDate() &&
            appointmentDate.getMonth() === today.getMonth() &&
            appointmentDate.getFullYear() === today.getFullYear()
          ) {
            status = "current";
          }

          return { ...apt, status };
        });

        setAppointments(processedAppointments);

        // Fetch approved donors
        const approvedDonorsRef = collection(db, "approvedDonors");
        const approvedQuery = query(
          approvedDonorsRef,
          where("doctorId", "==", currentUser.uid)
        );
        const approvedSnapshot = await getDocs(approvedQuery);
        
        const approvedData = approvedSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setApprovedDonors(approvedData);
        
      } catch (error) {
        console.error("Error fetching appointments:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  // Filter appointments based on search term and active tab
  const filteredItems = () => {
    if (activeTab === "approved") {
      return approvedDonors.filter(donor => 
        searchTerm === "" ||
        donor.donorId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        donor.donorName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    } else {
      return appointments.filter(appointment => {
        const matchesSearch =
          searchTerm === "" ||
          appointment.donorId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          appointment.donorName?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesTab =
          (activeTab === "current" && appointment.status === "current") ||
          (activeTab === "upcoming" && appointment.status === "upcoming") ||
          (activeTab === "past" && appointment.status === "past");

        return matchesSearch && matchesTab;
      });
    }
  };

  // Handle rescheduling
  const handleReschedule = (appointment) => {
    setSelectedAppointment(appointment);
    setNewDate(appointment.date);
    setNewTime(appointment.time);
    setShowRescheduleModal(true);
  };

  // Handle status update
  const handleStatusUpdate = (appointment) => {
    setSelectedAppointment(appointment);
    setStatusNotes("");
    setShowStatusModal(true);
  };

  // Save rescheduled appointment
  const saveReschedule = async () => {
    if (!selectedAppointment || !newDate || !newTime) return;

    try {
      const appointmentRef = doc(db, "appointments", selectedAppointment.id);
      await updateDoc(appointmentRef, {
        date: newDate,
        time: newTime,
      });

      // Update local state
      const updatedAppointments = appointments.map((apt) =>
        apt.id === selectedAppointment.id
          ? { ...apt, date: newDate, time: newTime }
          : apt
      );

      setAppointments(updatedAppointments);
      setShowRescheduleModal(false);
    } catch (error) {
      console.error("Error updating appointment:", error);
    }
  };

  // Update appointment status
  const updateAppointmentStatus = async (status) => {
    if (!selectedAppointment) return;
    
    try {
      setProcessingStatus(true);
      
      const appointmentRef = doc(db, "appointments", selectedAppointment.id);
      await updateDoc(appointmentRef, {
        status: status,
        notes: statusNotes,
        updatedAt: serverTimestamp()
      });

      // If approved, add to approvedDonors collection
      if (status === "approved") {
        // Get detailed medical record
        const medicalRecord = await fetchMedicalRecord(selectedAppointment.donorId);
        
        if (medicalRecord) {
          // Add to approvedDonors collection
          await addDoc(collection(db, "approvedDonors"), {
            donorId: selectedAppointment.donorId,
            donorName: selectedAppointment.donorName,
            doctorId: auth.currentUser.uid,
            hospitalId: selectedAppointment.hospitalId,
            appointmentId: selectedAppointment.id,
            appointmentDate: selectedAppointment.date,
            donorType: medicalRecord.donorType || "",
            notes: statusNotes,
            approvedAt: serverTimestamp(),
            medicalDetails: {
              height: medicalRecord.height || "",
              weight: medicalRecord.weight || "",
              hemoglobinLevel: medicalRecord.hemoglobinLevel || "",
              pulseRate: medicalRecord.pulseRate || "",
              hasDiabetes: medicalRecord.hasDiabetes || false,
              hasHeartDisease: medicalRecord.hasHeartDisease || false,
              hasHIV: medicalRecord.hasHIV || false,
              hasCancer: medicalRecord.hasCancer || false,
              hasHepatitis: medicalRecord.hasHepatitis || false,
              smokingStatus: medicalRecord.smokingStatus || "",
              exerciseFrequency: medicalRecord.exerciseFrequency || "",
              lastDonationDate: medicalRecord.lastDonationDate || ""
            }
          });
          
          // Fetch updated approved donors list
          const approvedDonorsRef = collection(db, "approvedDonors");
          const approvedQuery = query(
            approvedDonorsRef,
            where("doctorId", "==", auth.currentUser.uid)
          );
          const approvedSnapshot = await getDocs(approvedQuery);
          
          const approvedData = approvedSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          setApprovedDonors(approvedData);
        }
      }
      
      // Update local appointments state
      const updatedAppointments = appointments.map((apt) =>
        apt.id === selectedAppointment.id
          ? { ...apt, status: status, notes: statusNotes }
          : apt
      );
      
      setAppointments(updatedAppointments);
      setShowStatusModal(false);
      setProcessingStatus(false);
      
    } catch (error) {
      console.error("Error updating appointment status:", error);
      setProcessingStatus(false);
    }
  };

  // Rendering tab counts
  const currentCount = appointments.filter(a => a.status === "current").length;
  const upcomingCount = appointments.filter(a => a.status === "upcoming").length;
  const pastCount = appointments.filter(a => a.status === "past").length;
  const approvedCount = approvedDonors.length;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
        Hospital Appointments Management
      </h2>

      {/* Search Bar */}
      <div className="mb-6 bg-gray-50 p-4 rounded-md">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div className="w-full md:w-1/2">
            <input
              type="text"
              placeholder="Search by donor name or donor ID..."
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8 overflow-x-auto">
          <button
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "current"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
            onClick={() => setActiveTab("current")}
          >
            Current
            <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {currentCount}
            </span>
          </button>
          <button
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "upcoming"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
            onClick={() => setActiveTab("upcoming")}
          >
            Upcoming
            <span className="ml-2 bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {upcomingCount}
            </span>
          </button>
          <button
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "past"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
            onClick={() => setActiveTab("past")}
          >
            Past
            <span className="ml-2 bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {pastCount}
            </span>
          </button>
          <button
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "approved"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
            onClick={() => setActiveTab("approved")}
          >
            Approved Donors
            <span className="ml-2 bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {approvedCount}
            </span>
          </button>
        </nav>
      </div>

      {/* Appointments Table */}
      {loading ? (
        <div className="text-center py-10">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading data...</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          {activeTab !== "approved" ? (
            // Regular appointments table
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Donor Name
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Donor ID
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Date
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Time
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredItems().length > 0 ? (
                  filteredItems().map((appointment) => (
                    <tr key={appointment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <UserIcon className="h-5 w-5 text-gray-400 mr-2" />
                          <div className="text-sm font-medium text-gray-900">
                            {appointment.donorName}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <UserIcon className="h-5 w-5 text-blue-400 mr-2" />
                          <div className="text-sm text-gray-900">
                            {appointment.donorId}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <CalendarIcon className="h-5 w-5 text-gray-400 mr-2" />
                          <div className="text-sm text-gray-900">
                            {appointment.date}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <ClockIcon className="h-5 w-5 text-gray-400 mr-2" />
                          <div className="text-sm text-gray-900">
                            {appointment.time}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                          ${
                            appointment.status === "current"
                              ? "bg-yellow-100 text-yellow-800"
                              : appointment.status === "upcoming"
                              ? "bg-green-100 text-green-800"
                              : appointment.status === "approved"
                              ? "bg-blue-100 text-blue-800"
                              : appointment.status === "rejected"
                              ? "bg-red-100 text-red-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {appointment.status.charAt(0).toUpperCase() +
                            appointment.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          {appointment.status !== "approved" && appointment.status !== "rejected" && (
                            <>
                              <button
                                onClick={() => handleStatusUpdate(appointment)}
                                className="text-green-600 hover:text-green-900 mr-2"
                              >
                                Verify
                              </button>
                              <button
                                onClick={() => handleReschedule(appointment)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                Reschedule
                              </button>
                            </>
                          )}
                          {(appointment.status === "approved" || appointment.status === "rejected") && (
                            <span className="text-gray-500">
                              {appointment.status === "approved" ? "Approved" : "Rejected"}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-6 py-10 text-center text-sm text-gray-500"
                    >
                      No appointments found in this category.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            // Approved donors table
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Donor Name
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Donor ID
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Donor Type
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Approval Date
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Medical Details
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredItems().length > 0 ? (
                  filteredItems().map((donor) => (
                    <tr key={donor.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <UserIcon className="h-5 w-5 text-gray-400 mr-2" />
                          <div className="text-sm font-medium text-gray-900">
                            {donor.donorName}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <UserIcon className="h-5 w-5 text-blue-400 mr-2" />
                          <div className="text-sm text-gray-900">
                            {donor.donorId}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {donor.donorType || "Not specified"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {donor.approvedAt?.toDate().toLocaleDateString() || donor.appointmentDate || "Unknown"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          className="text-blue-600 hover:text-blue-900"
                          onClick={() => {
                            // Here you could add a modal to show detailed medical info
                            alert(
                              `Medical Details for ${donor.donorName}:\n` +
                              `Height: ${donor.medicalDetails?.height || "N/A"}\n` +
                              `Weight: ${donor.medicalDetails?.weight || "N/A"}\n` +
                              `Blood Type: ${donor.medicalDetails?.bloodType || "N/A"}\n` +
                              `Last Donation: ${donor.medicalDetails?.lastDonationDate || "N/A"}`
                            );
                          }}
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-6 py-10 text-center text-sm text-gray-500"
                    >
                      No approved donors found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Reschedule Modal */}
      {showRescheduleModal && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity"
              aria-hidden="true"
            >
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span
              className="hidden sm:inline-block sm:align-middle sm:h-screen"
              aria-hidden="true"
            >
              &#8203;
            </span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                      Reschedule Appointment
                    </h3>
                    <div className="mt-2">
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Donor ID
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          value={selectedAppointment?.donorId || ""}
                          disabled
                        />
                      </div>
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Donor Name
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          value={selectedAppointment?.donorName || ""}
                          disabled
                        />
                      </div>
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          New Date
                        </label>
                        <input
                          type="date"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          value={newDate}
                          onChange={(e) => setNewDate(e.target.value)}
                          min={new Date().toISOString().split("T")[0]}
                        />
                      </div>
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          New Time
                        </label>
                        <input
                          type="time"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          value={newTime}
                          onChange={(e) => setNewTime(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={saveReschedule}
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setShowRescheduleModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity"
              aria-hidden="true"
            >
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span
              className="hidden sm:inline-block sm:align-middle sm:h-screen"
              aria-hidden="true"
            >
              &#8203;
            </span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                      Update Donor Status
                    </h3>
                    <div className="mt-2">
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Donor Name
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          value={selectedAppointment?.donorName || ""}
                          disabled
                        />
                      </div>
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Notes
                        </label>
                        <textarea
                          rows="4"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Add any notes about this verification..."
                          value={statusNotes}
                          onChange={(e) => setStatusNotes(e.target.value)}
                        ></textarea>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => updateAppointmentStatus("approved")}
                  disabled={processingStatus}
                >
                  {processingStatus ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <CheckCircleIcon className="h-4 w-4 mr-1" />
                      Approve
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => updateAppointmentStatus("rejected")}
                  disabled={processingStatus}
                >
                  {processingStatus ? (
                    <span className="flex items-center">Processing...</span>
                  ) : (
                    <span className="flex items-center">
                      <XCircleIcon className="h-4 w-4 mr-1" />
                      Reject
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setShowStatusModal(false)}
                  disabled={processingStatus}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HospitalAppointments;