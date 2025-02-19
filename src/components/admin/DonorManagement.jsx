import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';

function DonorManagement() {
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('all');

  useEffect(() => {
    fetchDonors();
  }, [selectedStatus]);

  const fetchDonors = async () => {
    try {
      let donorsQuery;
      if (selectedStatus === 'all') {
        donorsQuery = query(collection(db, 'medicalRecords'));
      } else {
        donorsQuery = query(
          collection(db, 'medicalRecords'),
          where('status', '==', selectedStatus)
        );
      }

      const querySnapshot = await getDocs(donorsQuery);
      const donorsData = [];
      querySnapshot.forEach((doc) => {
        donorsData.push({ id: doc.id, ...doc.data() });
      });
      setDonors(donorsData);
    } catch (error) {
      console.error('Error fetching donors:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateDonorStatus = async (donorId, newStatus) => {
    try {
      await updateDoc(doc(db, 'medicalRecords', donorId), {
        status: newStatus,
        updatedAt: new Date(),
        updatedBy: 'admin' // You might want to use actual admin ID
      });
      
      // Refresh the donors list
      fetchDonors();
    } catch (error) {
      console.error('Error updating donor status:', error);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Donor Management</h2>

      {/* Filters */}
      <div className="mb-6">
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="p-2 border rounded"
        >
          <option value="all">All Donors</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Donors List */}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="grid gap-4">
          {donors.map((donor) => (
            <div key={donor.id} className="bg-white p-4 rounded-lg shadow">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{donor.name}</h3>
                  <p>Blood Type: {donor.bloodType}</p>
                  <p>Status: {donor.status}</p>
                  <p className="text-sm text-gray-600">
                    {/* Submitted: {new Date(donor.submittedAt?.toDate()).toLocaleDateString()} */}
                  </p>
                </div>
                <div className="space-x-2">
                  <button
                    onClick={() => updateDonorStatus(donor.id, 'approved')}
                    className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => updateDonorStatus(donor.id, 'rejected')}
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default DonorManagement;