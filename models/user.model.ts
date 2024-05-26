require("dotenv").config();
import mongoose, { Document, Model, Schema } from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const emailRegexPattern: RegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface IUser extends Document {
  email: string;
  password?: string;
  comparePassword: (passwordBuff: string) => Promise<boolean>;
  SignAccessToken: () => string;
  SignRefreshToken: () => string;
  name: string;
  avatar: {
    public_id: string;
    url: string;
  };
  role: string;
  isVerified: boolean;
  courses: Array<{ courseId: string }>; //Array of course IDs that the user has enrolled in.
}

const UserSchema: Schema<IUser> = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      validate: {
        validator: function (value: string) {
          return emailRegexPattern.test(value);
        },
        message: "Please provide a valid Email",
      },
    },
    password: {
      type: String,
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },
    avatar: {
      public_id: String,
      url: String,
    },
    role: {
      type: String,
      default: "user",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    courses: [
      {
        courseId: String,
      },
    ],
  },
  { timestamps: true }
);

//Hash password
UserSchema.pre<IUser>("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  // const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

//sign access token
UserSchema.methods.SignAccessToken = function (){
  return jwt.sign({id: this._id, name:this.name, role: this. role}, process.env.ACCESS_TOKEN || '' ,{
    expiresIn:'5m'
  });
}

//sign access token
UserSchema.methods.SignRefreshToken = function (){
  return jwt.sign({id: this._id, name:this.name, role: this. role}, process.env.REFRESH_TOKEN || '' ,{
    expiresIn:'1d'
  });
}

//Compare password
UserSchema.methods.comparePassword = async function (enteredPassword: string): Promise<boolean> {
  return await bcrypt.compare(enteredPassword, this.password);
};

const userModel: Model<IUser> = mongoose.model("User", UserSchema);
export default userModel;
