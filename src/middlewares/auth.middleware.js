import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/users.models.js"
import ErrorApi from "../utils/ErrorApi.js";
import jwt from "jsonwebtoken";

// middleware designed for embedding user details in the body

const verifyToken = asyncHandler(async (req, _, next) => {
  const accessToken = req.cookies.accessToken || req.header("Authorization")?.replace("Bearer ","")

  try {
    const decodedToken = jwt.verify(
      accessToken,
      process.env.ACCESS_TOKEN_SECRET
    )
  
    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    )
  
    if(!user) 
      throw new ErrorApi(401, [], "Unauthorized")
  
    req.user = user
  
    next();
  } catch (error) {
    throw new ErrorApi(401, [], error?.message || "Invalid access token")
  }
})

export { verifyToken }