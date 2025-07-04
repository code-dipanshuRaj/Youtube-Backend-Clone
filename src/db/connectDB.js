import { DB_NAME } from "../constants.js";
import mongoose from "mongoose";

const connectDB = async () => {
  try {
    console.log(`${process.env.MONGO_URL}`);
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGO_URL}/${DB_NAME}`
    );
    console.log(`Connected to the database: ${connectionInstance.connection.name}
      Host: ${connectionInstance.connection.host}`);
  } catch (error) {
    console.log("Error connecting to the database:", error);
    process.exit(1); // Exit the process with failure // intentional exit
  }
};

export default connectDB;
