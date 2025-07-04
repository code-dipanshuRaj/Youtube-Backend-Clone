import mongoose, {Schema} from "mongoose";

const subscriptionSchema = new Schema(
  {
    subscriber: {
      type: Schema.Types.ObjectId, // user_id(B) who is subscribing  
      ref: "User"
    },
    channel: {
      type: Schema.Types.ObjectId, // user_id(A) whose channel B is subscribing
      ref: "User"
    },

  },
  { timestamps:true }
)

export const Subscription = mongoose.model("Subscription",subscriptionSchema)