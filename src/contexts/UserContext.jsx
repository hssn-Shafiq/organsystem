import React, { createContext, useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hospitalStatus, setHospitalStatus] = useState(null); // Track hospital verification status

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          setUser({ ...user, ...userData });

          // If user is a doctor, check if they are linked to a hospital
          if (userData.role === "doctor") {
            const hospitalsRef = collection(db, "hospitals");
            const q = query(hospitalsRef, where("userId", "==", user.uid));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
              const hospitalData = querySnapshot.docs[0].data();
              setHospitalStatus(hospitalData.verificationStatus);
              console.log(hospitalData.verificationStatus);
            }
          }
        }
      } else {
        setUser(null);
        setHospitalStatus(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <UserContext.Provider value={{ user, loading, hospitalStatus }}>
      {!loading && children}
    </UserContext.Provider>
  );
};
