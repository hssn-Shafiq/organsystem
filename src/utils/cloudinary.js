// utils/cloudinary.js
import axios from "axios";

const cloudName = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.REACT_APP_CLOUDINARY_API_KEY;
const uploadPreset = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET;
const folderName = "Hospitals Licenses";

export const uploadToCloudinary = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("cloud_name", cloudName);
  formData.append("api_key", apiKey);
  formData.append("upload_preset", uploadPreset); 
  formData.append("folder", folderName);
  try {
    const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        formData
      );
    return response.data.secure_url; // Returns the URL of the uploaded file
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
};