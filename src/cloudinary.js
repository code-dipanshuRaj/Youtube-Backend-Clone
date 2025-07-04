import { v2 as cloudinary } from 'cloudinary';
import fs from "fs"
import dotenv from "dotenv"

dotenv.config()

// Configuration
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET 
});

// uploading
const uploadOnCloudinary = async (localpath) => {
  try {
    if(!localpath) {
      console.log("local path empty!")
      return null
    }
    
    console.log("local path",localpath)
    const response = await cloudinary.uploader.upload(
      localpath,
      { resource_type: "auto" }
    )
    
    // successfully uploaded on cloudinary 
    console.log("Uploaded file on cloudinary ", response.url, response.public_id)

    // deleting it from our server or personal storage
    try {
      fs.unlinkSync(localpath);
      console.log("Deleted temp file:", localpath);
    } catch (err) {
      console.error("Error deleting temp file:", localpath, err);
    }
    
    return response
  } catch (error) {
    fs.unlinkSync(localpath)
    return null
  }
}

const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId)
    console.log("Deleted from cloudinary",publicId)
  } catch (error) {
    console.log("Error deleting from cloudinary", error);
    return null
  }
}

export { uploadOnCloudinary, deleteFromCloudinary }