import React, { useEffect, useState } from "react";
import { db, auth } from "../../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  addDoc,
  orderBy,
} from "firebase/firestore";

function DoctorDashboard() {
  const [donors, setDonors] = useState({
    pending: [],
    approved: [],
    rejected: [],
  });
  const [selectedDonor, setSelectedDonor] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isSchedulingModalOpen, setIsSchedulingModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("pending");
  const [scheduleData, setScheduleData] = useState({
    date: "",
    time: "",
  });
  const [existingAppointments, setExistingAppointments] = useState([]);

  useEffect(() => {
    fetchDonors();
    fetchExistingAppointments();
  }, []);

  const fetchDonors = async () => {
    try {
      const statuses = ["pending", "approved", "rejected"];
      const donorsData = {};
      const currentUserId = auth.currentUser.uid;

      for (const status of statuses) {
        // Update query to include hospitalId filter
        const q = query(
          collection(db, "medicalRecords"),
          where("status", "==", status),
          where("hospitalId", "==", currentUserId),
          orderBy("submittedAt", "desc")
        );
        const querySnapshot = await getDocs(q);
        const donors = [];
        querySnapshot.forEach((doc) => {
          donors.push({ id: doc.id, ...doc.data() });
        });
        donorsData[status] = donors;
      }

      setDonors(donorsData);
    } catch (error) {
      console.error("Error fetching donors:", error);
      console.log("Error fetching donors:", error);
      alert("Error fetching donors. Please try again.");
    }
  };

  const fetchExistingAppointments = async () => {
    try {
      // Update to fetch only appointments for the current hospital
      const currentUserId = auth.currentUser.uid;
      const q = query(
        collection(db, "appointments"),
        where("doctorId", "==", currentUserId)
      );
      const appointmentsSnap = await getDocs(q);
      const appointments = [];
      appointmentsSnap.forEach((doc) => {
        appointments.push({ id: doc.id, ...doc.data() });
      });
      setExistingAppointments(appointments);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      alert("Error fetching appointments. Please try again.");
    }
  };

  const handleViewDetails = (donor) => {
    setSelectedDonor(donor);
    setIsDetailsModalOpen(true);
  };

  const isTimeSlotAvailable = (date, time) => {
    return !existingAppointments.some(
      (appointment) => appointment.date === date && appointment.time === time
    );
  };

  const handleScheduleSubmit = async (donorId) => {
    if (!scheduleData.date || !scheduleData.time) {
      alert("Please select both date and time");
      return;
    }

    if (!isTimeSlotAvailable(scheduleData.date, scheduleData.time)) {
      alert("This time slot is already booked. Please select another time.");
      return;
    }

    try {
      // Create appointment
      await addDoc(collection(db, "appointments"), {
        donorId,
        doctorId: auth.currentUser.uid,
        hospitalId: auth.currentUser.uid, // Add hospitalId to appointment
        date: scheduleData.date,
        time: scheduleData.time,
        createdAt: new Date(),
      });

      // Update donor status
      await updateDoc(doc(db, "medicalRecords", donorId), {
        status: "approved",
        verifiedBy: auth.currentUser.uid,
        verifiedAt: new Date(),
        appointmentDate: scheduleData.date,
        appointmentTime: scheduleData.time,
      });

      await fetchDonors(); // Refresh all donors lists
      setIsSchedulingModalOpen(false);
      setScheduleData({ date: "", time: "" });
      alert("Donor approved and appointment scheduled successfully!");
    } catch (error) {
      console.error("Error:", error);
      alert("Error scheduling appointment. Please try again.");
    }
  };

  const handleReject = async (donorId) => {
    try {
      await updateDoc(doc(db, "medicalRecords", donorId), {
        status: "rejected",
        verifiedBy: auth.currentUser.uid,
        verifiedAt: new Date(),
      });
      await fetchDonors(); // Refresh all donors lists
      alert("Donor rejected successfully");
    } catch (error) {
      console.error("Error:", error);
      alert("Error rejecting donor. Please try again.");
    }
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    if (date.seconds) {
      return new Date(date.seconds * 1000).toLocaleDateString();
    }
    return new Date(date).toLocaleDateString();
  };

  const DonorCard = ({ donor, status }) => {
    return (
      <div className="border p-4 rounded shadow bg-white">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <h3 className="font-bold">Blood Type: {donor.bloodType}</h3>
            <p>Age: {donor.age}</p>
            <p>Weight: {donor.weight} kg</p>
            <p>Height: {donor.height} cm</p>
            <p>Submitted: {formatDate(donor.submittedAt)}</p>
            {status !== "pending" && (
              <>
                <p>Verified At: {formatDate(donor.verifiedAt)}</p>
                {status === "approved" && (
                  <div className="mt-2 p-2 bg-green-50 rounded">
                    <p className="font-semibold">Appointment Details:</p>
                    <p>Date: {donor.appointmentDate}</p>
                    <p>Time: {donor.appointmentTime}</p>
                  </div>
                )}
              </>
            )}
          </div>
          <div className="space-x-2">
            <button
              onClick={() => handleViewDetails(donor)}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              View Details
            </button>
            {status === "pending" && (
              <>
                <button
                  onClick={() => {
                    setSelectedDonor(donor);
                    setIsSchedulingModalOpen(true);
                  }}
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                >
                  Approve & Schedule
                </button>
                <button
                  onClick={() => handleReject(donor.id)}
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                >
                  Reject
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  const DonorDetailsModal = () => {
    if (!selectedDonor) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <h2 className="text-2xl font-bold mb-4">Donor Details</h2>

          {/* Basic Information */}
          <section className="mb-6">
            <h3 className="text-xl font-semibold mb-2">Basic Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <p>
                <span className="font-medium">Blood Type:</span>{" "}
                {selectedDonor.bloodType}
              </p>
              <p>
                <span className="font-medium">Age:</span> {selectedDonor.age}
              </p>
              <p>
                <span className="font-medium">Weight:</span>{" "}
                {selectedDonor.weight} kg
              </p>
              <p>
                <span className="font-medium">Height:</span>{" "}
                {selectedDonor.height} cm
              </p>
              <p>
                <span className="font-medium">BMI:</span> {selectedDonor.bmi}
              </p>
            </div>
          </section>

          {/* Medical History */}
          <section className="mb-6">
            <h3 className="text-xl font-semibold mb-2">Medical History</h3>
            <p>
              <span className="font-medium">Medical History:</span>{" "}
              {selectedDonor.medicalHistory}
            </p>
            <p>
              <span className="font-medium">Current Medications:</span>{" "}
              {selectedDonor.currentMedications}
            </p>
            <p>
              <span className="font-medium">Surgical History:</span>{" "}
              {selectedDonor.surgicalHistory}
            </p>
            <p>
              <span className="font-medium">Allergies:</span>{" "}
              {selectedDonor.allergies}
            </p>
            <p>
              <span className="font-medium">Chronic Conditions:</span>{" "}
              {selectedDonor.chronicConditions}
            </p>
          </section>

          {/* Health Measurements */}
          <section className="mb-6">
            <h3 className="text-xl font-semibold mb-2">Health Measurements</h3>
            <div className="grid grid-cols-2 gap-4">
              <p>
                <span className="font-medium">Blood Pressure:</span>{" "}
                {selectedDonor.bloodPressure}
              </p>
              <p>
                <span className="font-medium">Pulse Rate:</span>{" "}
                {selectedDonor.pulseRate} bpm
              </p>
              <p>
                <span className="font-medium">Hemoglobin Level:</span>{" "}
                {selectedDonor.hemoglobinLevel} g/dL
              </p>
              <p>
                <span className="font-medium">Last Donation:</span>{" "}
                {selectedDonor.lastDonationDate}
              </p>
            </div>
          </section>

          {/* Lifestyle Information */}
          <section className="mb-6">
            <h3 className="text-xl font-semibold mb-2">
              Lifestyle Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <p>
                <span className="font-medium">Smoking Status:</span>{" "}
                {selectedDonor.smokingStatus}
              </p>
              <p>
                <span className="font-medium">Alcohol Consumption:</span>{" "}
                {selectedDonor.alcoholConsumption}
              </p>
              <p>
                <span className="font-medium">Exercise Frequency:</span>{" "}
                {selectedDonor.exerciseFrequency}
              </p>
            </div>
          </section>

          {/* Medical Conditions */}
          <section className="mb-6">
            <h3 className="text-xl font-semibold mb-2">Medical Conditions</h3>
            <div className="grid grid-cols-2 gap-2">
              <p>
                Heart Disease: {selectedDonor.hasHeartDisease ? "Yes" : "No"}
              </p>
              <p>Diabetes: {selectedDonor.hasDiabetes ? "Yes" : "No"}</p>
              <p>HIV: {selectedDonor.hasHIV ? "Yes" : "No"}</p>
              <p>Hepatitis: {selectedDonor.hasHepatitis ? "Yes" : "No"}</p>
              <p>Cancer: {selectedDonor.hasCancer ? "Yes" : "No"}</p>
            </div>
          </section>

          {/* Emergency Contact */}
          <section className="mb-6">
            <h3 className="text-xl font-semibold mb-2">Emergency Contact</h3>
            <div className="grid grid-cols-2 gap-4">
              <p>
                <span className="font-medium">Name:</span>{" "}
                {selectedDonor.emergencyContact?.name}
              </p>
              <p>
                <span className="font-medium">Relationship:</span>{" "}
                {selectedDonor.emergencyContact?.relationship}
              </p>
              <p>
                <span className="font-medium">Phone:</span>{" "}
                {selectedDonor.emergencyContact?.phone}
              </p>
            </div>
          </section>

          {/* Additional Notes */}
          {selectedDonor.additionalNotes && (
            <section className="mb-6">
              <h3 className="text-xl font-semibold mb-2">Additional Notes</h3>
              <p>{selectedDonor.additionalNotes}</p>
            </section>
          )}

          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setIsDetailsModalOpen(false)}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  const SchedulingModal = () => {
    if (!selectedDonor) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full">
          <h2 className="text-2xl font-bold mb-4">Schedule Medical Test</h2>
          <div className="space-y-4">
            <div>
              <label className="block mb-2">Date</label>
              <input
                type="date"
                className="w-full p-2 border rounded"
                value={scheduleData.date}
                onChange={(e) =>
                  setScheduleData({ ...scheduleData, date: e.target.value })
                }
                min={new Date().toISOString().split("T")[0]}
                required
              />
            </div>
            <div>
              <label className="block mb-2">Time</label>
              <input
                type="time"
                className="w-full p-2 border rounded"
                value={scheduleData.time}
                onChange={(e) =>
                  setScheduleData({ ...scheduleData, time: e.target.value })
                }
                required
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setIsSchedulingModalOpen(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={() => handleScheduleSubmit(selectedDonor.id)}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Schedule
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Doctor Dashboard</h2>

      {/* Status Tabs */}
      <div className="flex space-x-2 mb-4">
        <button
          className={`px-4 py-2 rounded ${
            activeTab === "pending"
              ? "bg-blue-500 text-white"
              : "bg-gray-200 hover:bg-gray-300"
          }`}
          onClick={() => setActiveTab("pending")}
        >
          Pending ({donors.pending.length})
        </button>
        <button
          className={`px-4 py-2 rounded ${
            activeTab === "approved"
              ? "bg-blue-500 text-white"
              : "bg-gray-200 hover:bg-gray-300"
          }`}
          onClick={() => setActiveTab("approved")}
        >
          Approved ({donors.approved.length})
        </button>
        <button
          className={`px-4 py-2 rounded ${
            activeTab === "rejected"
              ? "bg-blue-500 text-white"
              : "bg-gray-200 hover:bg-gray-300"
          }`}
          onClick={() => setActiveTab("rejected")}
        >
          Rejected ({donors.rejected.length})
        </button>
      </div>

      {/* Search and Filter Options */}
      <div className="mb-4 p-4 bg-gray-50 rounded-lg">
        <div className="text-sm text-gray-600 mb-2">
          Showing {donors[activeTab].length} {activeTab} applications
        </div>
      </div>

      {/* Donors List */}
      <div className="space-y-4">
        {donors[activeTab].length > 0 ? (
          donors[activeTab].map((donor) => (
            <DonorCard key={donor.id} donor={donor} status={activeTab} />
          ))
        ) : (
          <div className="text-center py-8 bg-white rounded-lg shadow">
            <p className="text-gray-500">No {activeTab} applications found</p>
          </div>
        )}
      </div>

      {/* Modals */}
      {isDetailsModalOpen && <DonorDetailsModal />}
      {isSchedulingModalOpen && <SchedulingModal />}
    </div>
  );
}

export default DoctorDashboard;
