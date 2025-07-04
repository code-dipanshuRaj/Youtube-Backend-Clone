import { asyncHandler } from "../utils/asyncHandler.js";
import { ResponseApi } from "../utils/ResponseApi.js";
import ErrorApi from "../utils/ErrorApi.js";
import { User } from "../models/users.models.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../cloudinary.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessAndRefreshToken = async function(userId){
  try {
    const user = await User.findById(userId)
    if(!user) throw new ErrorApi(404, [], "Invalid userId - User not found!")

    const accessToken = await user.generateAccessToken()
    const refreshToken = await user.generateRefreshToken()
    
    //console.log("AT before save:", accessToken);
    //console.log("RT before save:", refreshToken);
    //console.log("User doc refreshToken before save:", user.refreshToken);
    
    user.refreshToken = refreshToken
    await user.save({validateBeforeSave : false})
    console.log("User saved");
    
    //const updated = await User.findById(userId);
    //console.log(updated.refreshToken); // should show the saved token
    
    return {accessToken, refreshToken}
  } catch (error) {
    console.warn(error)
    throw new ErrorApi(500, [], "something went wrong while generating tokens")
  }
}

const registerUser = asyncHandler (async (req,res) => {
  const {username, email, password, fullname} = req.body
  
  //validation
  if([username,email,password,fullname].some(t => t?.trim() === "" || t===undefined))
    throw new ErrorApi(401,[],"All fields are required")

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ErrorApi(400, [], "Invalid email format");
  }

  // Password complexity validation
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!passwordRegex.test(password)) {
    throw new ErrorApi(400, [], "Password must be at least 8 characters long and contain uppercase, lowercase, number and special character");
  }
 
  const existedUser = await User.findOne(
    {
      $or: [ {email}, {username} ]
    }
  )

  if(existedUser) throw new ErrorApi(400, [], "User already exists")

  const avatarLocalPath = req.files?.avatar?.[0]?.path
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path
  
  // console.log("req,files : ",req.files)
  // console.log("avatarLocalPath",avatarLocalPath)
  // console.log("coverImageLocalPath",coverImageLocalPath)

  if(!avatarLocalPath)
    throw new ErrorApi(400,[],"Avatar file is missing")

  let coverImage = ""
  let avatar = ""
  try {
    avatar = await uploadOnCloudinary(avatarLocalPath)
    if(coverImageLocalPath)
      coverImage = await uploadOnCloudinary(coverImageLocalPath)
  } catch (error) {
      console.warn("Error uploading the avatar file",error)
      throw new ErrorApi(501,[],"Error uploading files")
  }
  
  try {
    const user = await User.create(
      {
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
      }
    ) 
    const userCheck = await User.findById(user._id).select(
      "-password -refreshToken"
    )

    if(!userCheck) throw new ErrorApi(401,[],"Something went wrong whlie registering the user")

    return res
    .status(200)
    .json(new ResponseApi(200,user,"User Successfully registered"))

  } catch (error) {
    console.log("Error creating user",error)
    if(avatar)
      await deleteFromCloudinary(avatar.public_id);
    if(coverImage)
      await deleteFromCloudinary(coverImage.public_id)

    throw new ErrorApi(500,[],"something went wrong while creating the user & images were deleted")
  }

})

const loginUser = asyncHandler(async (req,res) => {
  const {email, password} = req.body;
  if(!email) throw new ErrorApi(400, [], "email is required")

  const user = await User.findOne({ email })
  if(!user) throw new ErrorApi(404,[],"User not found")

  // console.log(typeof user); // Should be "object"
  // console.log(user instanceof mongoose.Model); // Should be true
  // console.log(typeof user.isPasswordCorrect); // Should be "function"

  const isPasswordValid = await user.isPasswordCorrect(password)
  if(!isPasswordValid) throw new ErrorApi(400,[],"Invalid password!")

  const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id)

  const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
  if(!loggedInUser) throw new ErrorApi(404,[]," User not found! ")

  const options = {
    httpOnly: true, // user cannot modify the cookies
    secure: process.env.NODE_ENV === "production"
  }

  return res
  .status(200)
  .cookie("accessToken", accessToken, options)
  .cookie("refreshToken", refreshToken, options)
  .json(new ResponseApi(201,loggedInUser,"User Logged in Successfully"))
})

const refreshAccessToken = asyncHandler( async(req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
  if(!incomingRefreshToken) throw new ErrorApi(400,"Refresh token is required")

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    )
    if(!decodedToken)
      throw new ErrorApi(401,[],"Error in decoding the refresh token")

  const user = await User.findById(decodedToken?._id)
  if(!user) throw new ErrorApi(401,[],"Invalid refresh token")
    
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production"
  }

  const {accessToken, refreshToken: newRefreshToken} = 
  await generateAccessAndRefreshToken(user._id)

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", newRefreshToken, options)
    .json(
      new ResponseApi(
        200,
        {
          accessToken,
          refreshToken: newRefreshToken
        },
        "Access token refreshed successfully"
      )
    )
  } catch (error) {
    throw new ErrorApi(401, [], error?.message || "Invalid refresh token")
  }
})

const logoutUser = asyncHandler( async (req,res) => {
  console.log(req.user)
  
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined
      }
    },
    {new: true} // returns updated data
  )
  if(!user)
    throw new ErrorApi(401,[]," Something went wrong while updaing refresh token ")

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production"
  }

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json( new ResponseApi(200,{},"User logged out successfully"))
})

const getChannel = asyncHandler( async (req, res) => {
  const {username} = req.params
  if(!username) throw new ErrorApi(400,[],"Username is required")

  const userId = typeof req.user._id === "string"
  ? new mongoose.Types.ObjectId(req.user._id)
  : req.user._id;

  console.log(typeof req.user._id)

  const channel = await User.aggregate([
    {
      $match: {
        username: username.toLowerCase()
      }
    },
    {
      $lookup: {
        from: "subscription",
        localField: "_id",
        foreignField: "channel",
        as: "mySubscribers"
      }
    },
    {
      $lookup: {
        from: "subscription",
        localField: "_id",
        foreignField: "subscriber",
        as: "mySubscriptions"
      }
    },
    {
      $addFields:{
        subscribersCount: { $size: "$mySubscribers"},
        subscriptionsCount: { $size: "$mySubscriptions"},
        isSubscribed: {
          $in: [
            req.user._id, // already ObjectId
            {
              $map: {
                input: "$mySubscriptions", // input is array of objects
                as: "sub",                 // each object as sub
                in: "$$sub.subscriber"     // access sub.subscriber
              }
            }
          ]
        }
      }
    },
    {
      $project: {
        fullname: 1,
        username: 1,
        subscribersCount: 1,
        subscriptionsCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1
      }
    }
  ])

  if (!channel?.length) {
    throw new ErrorApi(404, [], "Channel does not exist")
  }

  return res
    .status(200)
    .json(
      new ResponseApi(200, channel[0], "Channel fetched successfully")
    )
})

const getWatchHistory = asyncHandler(async (req, res) => {
  const { username } = req.params;
  if (!username) throw new ErrorApi(401, [], "Username is required");

  const userAgg = await User.aggregate([
    // Stage 1: match the user by username
    {
      $match: { username: username }
    },
    // Stage 2: lookup videos whose _id is in this user's watchHistory array
    {
      $lookup: {
        from: "video",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          // Nested Stage 2.1: for each matched video, lookup its owner details
          {
            $lookup: {
              from: "user",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    _id: 1,       // include if you want the id; can omit if not needed
                    username: 1,
                    fullname: 1,
                    avatar: 1
                  }
                }
              ]
            }
          },
          // Nested Stage 2.2: flatten owner array to single object (or null)
          {
            $addFields: {
              owner: { $first: "$owner" }
            }
          }
          // You could add more stages here (e.g., project only certain video fields)
        ]
      }
    }
  ]);

  if (!userAgg?.length) throw new ErrorApi(404, [], "User not found");

  const watchHistory = userAgg[0].watchHistory;
  return res
    .status(200)
    .json(new ResponseApi(200, watchHistory, "Watch History fetched successfully"));
});


// diff technique used for securing the route
const updatePassword = asyncHandler( async (req, res) => {
  const { oldPassword, newPassword } = req.body
  
  if(!oldPassword || !newPassword) 
    throw new ErrorApi(400,[],"Both the old and new Password is required")
  
  const user = await User.findById(req?.user._id)
  if(!user) 
    throw new ErrorApi(404,[],"user not found")

  const isValid = await user.isPasswordCorrect(oldPassword)

  if(!isValid) throw new ErrorApi(401,[],"Old Password Incorrect")

  // this method was not triggering the pre-save hook
  
  // const updatedUser = await User.findByIdAndUpdate(
  //   req.user._id,
  //   {
  //     $set: {
  //       password: newPassword
  //     }
  //   },
  //   {new: true}
  // )

  user.password = newPassword
  await user.save( {validateBeforeSave : false} )

  return res
  .status(200)
  .json( new ResponseApi(200,{ user },"Password updated successfully"))
})

// not validating the user - directly doing db call coz user is already 
// validated by the auth middleware!
const updateFullname = asyncHandler( async (req,res) => {
  const {fullname} = req.body

  if(!fullname) throw new ErrorApi(400,[],"new name is required!")
  
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        fullname: fullname
      }
    },
    { new: true }
  )

  if(!user) throw new ErrorApi(401,[],"Error updating user's fullname")

  return res
  .status(200)
  .json( new ResponseApi(200,user,"fullname updated successfully") )
})

const updateAvatar = asyncHandler( async (req, res) => {
  
  // get new avatar local path 
  // upload it on cloudinary
  // update the db with the new response.url
  // return response

  const currentUser = await findById(req.user._id)
  const avatarLocalPath = req?.file?.path // only one file so no need to write avatar[0]
  
  if(!avatarLocalPath) throw new ErrorApi(400,[],"Local Path not found")

  const response = await uploadOnCloudinary(avatarLocalPath)
  if(!response) throw new ErrorApi(401,[],"Error uploading to cloudinary")

  // Delete old avatar from cloudinary if it exists
  if (currentUser.avatar) {
    const oldAvatarPublicId = currentUser.avatar.split('/').pop().split('.')[0];
    await deleteFromCloudinary(oldAvatarPublicId);
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        avatar: response.url
      }
    },
    {new : true}
  )

  if(!user) 
    throw new ErrorApi(401,[],"Something went wrong while updating the avatar")

  return res
  .status(200)
  .json( new ResponseApi(200,{ user },"avatar updated successfully") )
})

export {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  updatePassword,
  updateFullname,
  updateAvatar,
}

// todos

// make get channels and subscribers routes
// check all routes thoroughly
// make notes -> just like user is instance and User is like a class and internal methods are static
// download cursor - done
// upload resume - deleted deadline passed - already fucked
// design routes for subscription and videos - in progress
// user subscribes channel and update watchistory if user watches a video
// and channel / user posts videos
// user and subscriptions relation is now clear as a crystal ! 