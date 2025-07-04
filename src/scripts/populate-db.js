import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
import { User } from "../models/users.models.js";
import { Video } from "../models/videos.models.js";
import { Subscription } from "../models/subscription.models.js";
import sampleData from "../data/sample-data.json" assert { type: "json" };
import dotenv from "dotenv";

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(`${process.env.MONGO_URL}/${DB_NAME}`);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

const populateUsers = async () => {
  try {
    // Create users one by one to ensure pre-save hooks are triggered
    const users = [];
    for (const userData of sampleData.users) {
      const user = await User.create(userData);
      users.push(user);
    }
    console.log("Users created successfully");
    
    // Create a map of username to user ID for later use
    const userMap = {};
    users.forEach(user => {
      userMap[user.username] = user._id;
    });
    
    return userMap;
  } catch (error) {
    console.error("Error creating users:", error);
    throw error;
  }
};

const populateVideos = async (userMap) => {
  try {
    // Create videos with owner references
    const videos = await Video.create(
      sampleData.videos.map(video => ({
        ...video,
        owner: userMap[video.owner]
      }))
    );
    console.log("Videos created successfully");
    
    // Create a map of video title to video ID for later use
    const videoMap = {};
    videos.forEach(video => {
      videoMap[video.title] = video._id;
    });
    
    return videoMap;
  } catch (error) {
    console.error("Error creating videos:", error);
    throw error;
  }
};

const populateSubscriptions = async (userMap) => {
  try {
    // Create subscriptions with proper references
    await Subscription.create(
      sampleData.subscriptions.map(sub => ({
        subscriber: userMap[sub.subscriber],
        channel: userMap[sub.channel]
      }))
    );
    console.log("Subscriptions created successfully");
  } catch (error) {
    console.error("Error creating subscriptions:", error);
    throw error;
  }
};

const populateWatchHistory = async (userMap, videoMap) => {
  try {
    // Update users with watch history using video ObjectIds
    for (const history of sampleData.watchHistory) {
      const videoIds = history.videos.map(title => videoMap[title]);
      
      // Get current user
      const user = await User.findById(userMap[history.user]);
      if (!user) {
        console.warn(`User ${history.user} not found, skipping watch history`);
        continue;
      }

      // Add new video IDs to existing watch history
      const updatedWatchHistory = [...new Set([...user.watchHistory, ...videoIds])];
      
      await User.findByIdAndUpdate(
        userMap[history.user],
        { $set: { watchHistory: updatedWatchHistory } }
      );
    }
    console.log("Watch history created successfully");
  } catch (error) {
    console.error("Error creating watch history:", error);
    throw error;
  }
};

const populateDatabase = async () => {
  try {
    await connectDB();
    
    // Populate in order: users -> videos -> subscriptions -> watch history
    // user map is used to get the user id from the "username"
    // video map is used to get the video id from the "title"
    const userMap = await populateUsers();
    const videoMap = await populateVideos(userMap);
    await populateSubscriptions(userMap);
    await populateWatchHistory(userMap, videoMap);
    
    console.log("Database populated successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error populating database:", error);
    process.exit(1);
  }
};

populateDatabase(); 