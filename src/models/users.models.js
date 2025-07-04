import mongoose, {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new Schema(
  {
    username : {
      type: String,
      requied: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    fullname : {
      type: String,
      requied: true,
      trim: true,
    },
    email: {
      type : String,
      requied : true,
      unique : true,
      trim : true,
      index : true
    },
    coverImage : {
      type : String, // Cloudinary URL
      required : true
    },
    avatar: {
      type : String, // CLoudinary URL
      required : true
    },
    watchHistory: [
      {
        type : Schema.Types.ObjectId, // direct ObjectId not supported
        ref : "Video", // schema to refer by user 
      }
    ],
    password : {
      type: String,
      required: [true, "Password is required!"]
    },
    refreshToken : {
      type: String
    }
  },
  // automatically add updatedAt and createdAt field 
  {
    timestamps: true 
  }
)

userSchema.pre("save", async function(next) { // middleware to encrypt the passcode 

  if(!this.isModified("password")) return next()
  
  this.password = await bcrypt.hash(this.password,12);

  next()
})

userSchema.methods.isPasswordCorrect =  async function(password){
  const result = await bcrypt.compare(password, this.password)
  return result
}

userSchema.methods.generateAccessToken = async function(){
  // generating a short-lived token
  return jwt.sign(
    { _id : this._id,
      username : this.username,
      email: this.email
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
  );
}

userSchema.methods.generateRefreshToken = async function(){
  return jwt.sign(
    { _id : this._id},
    process.env.REFRESH_TOKEN_SECRET,
    {expiresIn: process.env.REFRESH_TOKEN_EXPIRY}
  );
}

userSchema.plugin(mongooseAggregatePaginate)

export const User = mongoose.model("User", userSchema)