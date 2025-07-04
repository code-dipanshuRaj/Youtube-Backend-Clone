import mongoose, {Schema} from "mongoose";

// in this collection one of the filed is taken 
// i.e video, comment, tweet rest will be null
const likeSchema = new Schema(
  {
    video: {
      type: Schema.Types.ObjectId,
      ref: "Video"
    },
    comment: {
      type: Schema.Types.ObjectId,
      ref: "Comment"
    },
    tweet: {
      type: Schema.Types.ObjectId,
      ref: "Tweet"
    },
    likedBy: {
      type: Schema.Types.ObjectId,
      ref: "User" 
    }
  },
  {timestamps: true}
)

export const Like = mongoose.model("Like",likeSchema)