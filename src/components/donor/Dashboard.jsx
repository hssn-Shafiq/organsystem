import React, { useContext, useEffect, useState } from "react";
import { UserContext } from "../../contexts/UserContext";
import { db } from "../../firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { Link } from "react-router-dom";

function DonorDashboard() {
  const { user } = useContext(UserContext);
  const [medicalStatus, setMedicalStatus] = useState(null);
  const [previousApplications, setPreviousApplications] = useState([]);

  useEffect(() => {
    const fetchMedicalStatus = async () => {
      if (!user) return;

      try {
        // Fetch current application
        const docRef = doc(db, "medicalRecords", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setMedicalStatus(docSnap.data());
        }

        // Fetch previous applications
        const applicationsRef = collection(db, "medicalRecords");
        const applicationsQuery = query(
          applicationsRef,
          where("donorId", "==", user.uid)
        );
        const querySnapshot = await getDocs(applicationsQuery);
        const applications = [];
        querySnapshot.forEach((doc) => {
          applications.push({ id: doc.id, ...doc.data() });
        });
        setPreviousApplications(applications);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchMedicalStatus();
  }, [user]);

  const formatSubmittedAt = (submittedAt) => {
    if (!submittedAt) return "N/A";

    try {
      // Handle Firestore Timestamp
      if (submittedAt.toDate) {
        return new Date(submittedAt.toDate()).toLocaleDateString();
      }

      // Handle Date object
      if (submittedAt instanceof Date) {
        return submittedAt.toLocaleDateString();
      }

      // Handle string (e.g., ISO date string)
      return new Date(submittedAt).toLocaleDateString();
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid Date";
    }
  };

  const canReapply = (rejectionDate) => {
    if (!rejectionDate) return false;
    const daysSinceRejection = Math.floor(
      (new Date() - new Date(rejectionDate.toDate())) / (1000 * 60 * 60 * 24)
    );
    return daysSinceRejection >= 15;
  };

  if (!user) return <p>Loading user information...</p>;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Donor Dashboard</h2>

      {/* Current Application Status */}
      {!medicalStatus ? (
        <div className="bg-yellow-100 p-4 rounded mb-6">
          <p>You haven't submitted your medical information yet.</p>
          <Link
            to="/donor/medical-form"
            className="mt-2 inline-block bg-blue-500 text-white px-4 py-2 rounded"
          >
            Submit Medical Information
          </Link>
        </div>
      ) : (
        <div className="bg-white p-4 rounded shadow mb-6">
          <h3 className="text-xl font-bold mb-4">Current Application Status</h3>
          <div
            className={`p-3 rounded mb-4 ${
              medicalStatus.status === "approved"
                ? "bg-green-100"
                : medicalStatus.status === "rejected"
                ? "bg-red-100"
                : "bg-yellow-100"
            }`}
          >
            Status:{" "}
            {medicalStatus.status.charAt(0).toUpperCase() +
              medicalStatus.status.slice(1)}
          </div>

          <table className="w-full border-collapse border border-gray-300">
            <tbody>
              {Object.entries(medicalStatus).map(([key, value]) => {
                if (
                  key !== "status" &&
                  key !== "donorId" &&
                  key !== "submittedAt"
                ) {
                  return (
                    <tr key={key}>
                      <td className="border border-gray-300 px-4 py-2 font-medium">
                        {key.charAt(0).toUpperCase() +
                          key.slice(1).replace(/([A-Z])/g, " $1")}
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        {typeof value === "object"
                          ? JSON.stringify(value)
                          : value || "N/A"}
                      </td>
                    </tr>
                  );
                }
                return null;
              })}
              <tr>
                <td className="border border-gray-300 px-4 py-2 font-medium">
                  Submitted At
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  {formatSubmittedAt(medicalStatus.submittedAt)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Previous Applications */}
      {previousApplications.length > 0 && (
        <div className="bg-white p-4 rounded shadow">
          <h3 className="text-xl font-bold mb-4">Previous Applications</h3>
          {previousApplications.map((application) => (
            <div key={application.id} className="mb-4 p-4 border rounded">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">
                  Submitted: {formatSubmittedAt(application.submittedAt)}
                </span>
                <span
                  className={`px-3 py-1 rounded ${
                    application.status === "approved"
                    ? "bg-green-100"
                      : application.status === "rejected"
                      ? "bg-red-100"
                      : "bg-yellow-100"
                  }`}
                >
                  {application.status.charAt(0).toUpperCase() +
                    application.status.slice(1)}
                </span>
              </div>

              {application.status === "rejected" && (
                <div className="mt-2">
                  {canReapply(application.submittedAt) ? (
                    <Link
                      to="/donor/medical-form"
                      className="inline-block bg-blue-500 text-white px-4 py-2 rounded"
                    >
                      Reapply Now
                    </Link>
                  ) : (
                    <p className="text-gray-600">
                      You can reapply 15 days after the rejection date.
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default DonorDashboard;
