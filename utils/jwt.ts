require("dotenv").config();
import { Response } from "express";
import { IUser } from "../models/user.model";
import { redis } from "./redis";

interface ITokenOptions {
  expires: Date;
  maxAge: number;
  httpOnly: boolean;
  sameSite: boolean | "lax" | "strict" | "none";
  secure?: boolean;
}

  //parse env variables to integrate with fallback values
  const accessTokenExpire = parseInt(process.env.ACCESS_TOKEN_EXPIRY || "300", 10);
  const refreshTokenExpire = parseInt(process.env.REFRESH_TOKEN_EXPIRY || "1200", 10);

  //options for cookies
  export const accessTokenOptions: ITokenOptions = {
    expires: new Date(Date.now() + accessTokenExpire * 60 * 60 * 1000),
    maxAge: accessTokenExpire * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: "lax",
  };

  export const refreshTokenOptions: ITokenOptions = {
    expires: new Date(Date.now() + refreshTokenExpire * 24 * 60 * 60 * 1000),
    maxAge: refreshTokenExpire * 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: "lax",
  };

export const sendToken = (user: IUser, statusCode: number, res: Response, payload:any) => {
  const accessToken = user.SignAccessToken();
  const refreshToken = user.SignRefreshToken();

  // Upload sessions to redis
  redis.set(user._id, JSON.stringify(user) as any)

  //only set secure to true in production
  if (process.env.NODE_ENV === "production") {
    accessTokenOptions.secure = true;
    refreshTokenOptions.secure = true;
  }

  res.cookie("access_token", accessToken, accessTokenOptions);
  res.cookie("refresh_token", refreshToken, refreshTokenOptions);
  
  res.status(statusCode).json({
    message:"Logged in successfully.",
    success: true,
    user:payload,
    accessToken,
  });
};
