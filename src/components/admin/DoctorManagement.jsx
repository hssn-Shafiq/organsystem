import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';

function DoctorManagement() {
  const [doctors, setDoctors] = useState([]);
  const [newDoctor, setNewDoctor] = useState({
    name: '',
    specialization: '',
    email: '',
    phone: ''
  });

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      const doctorsQuery = query(
        collection(db, 'users'),
        where('role', '==', 'doctor')
      );
      const querySnapshot = await getDocs(doctorsQuery);
      const doctorsData = [];
      querySnapshot.forEach((doc) => {
        doctorsData.push({ id: doc.id, ...doc.data() });
      });
      setDoctors(doctorsData);
    } catch (error) {
      console.error('Error fetching doctors:', error);
    }
  };

  const addDoctor = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'users'), {
        ...newDoctor,
        role: 'doctor',
        createdAt: new Date()
      });
      setNewDoctor({ name: '', specialization: '', email: '', phone: '' });
      fetchDoctors();
    } catch (error) {
      console.error('Error adding doctor:', error);
    }
  };

  const updateDoctorStatus = async (doctorId, isActive) => {
    try {
      await updateDoc(doc(db, 'users', doctorId), {
        status: isActive ? 'active' : 'inactive',
        updatedAt: new Date()
      });
      fetchDoctors();
    } catch (error) {
      console.error('Error updating doctor status:', error);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Doctor Management</h2>

      {/* Add New Doctor Form */}
      <form onSubmit={addDoctor} className="bg-white p-4 rounded-lg shadow mb-6">
        <h3 className="text-xl font-semibold mb-4">Add New Doctor</h3>
        <div className="grid grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Name"
            value={newDoctor.name}
            onChange={(e) => setNewDoctor({ ...newDoctor, name: e.target.value })}
            className="p-2 border rounded"
            required
          />
          <input
            type="text"
            placeholder="Specialization"
            value={newDoctor.specialization}
            onChange={(e) => setNewDoctor({ ...newDoctor, specialization: e.target.value })}
            className="p-2 border rounded"
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={newDoctor.email}
            onChange={(e) => setNewDoctor({ ...newDoctor, email: e.target.value })}
            className="p-2 border rounded"
            required
          />
          <input
            type="tel"
            placeholder="Phone"
            value={newDoctor.phone}
            onChange={(e) => setNewDoctor({ ...newDoctor, phone: e.target.value })}
            className="p-2 border rounded"
            required
          />
        </div>
        <button
          type="submit"
          className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Add Doctor
        </button>
      </form>

      {/* Doctors List */}
      <div className="grid gap-4">
        {doctors.map((doctor) => (
          <div key={doctor.id} className="bg-white p-4 rounded-lg shadow">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold">{doctor.name}</h3>
                <p>Specialization: {doctor.specialization}</p>
                <p>Email: {doctor.email}</p>
                <p>Phone: {doctor.phone}</p>
              </div>
              <div className="space-x-2">
                <button
                  onClick={() => updateDoctorStatus(doctor.id, true)}
                  className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                >
                  Activate
                </button>
                <button
                  onClick={() => updateDoctorStatus(doctor.id, false)}
                  className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                >
                  Deactivate
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


export default DoctorManagement;