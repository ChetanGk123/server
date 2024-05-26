import { Response } from "express";
import userModel from "../models/user.model";
import ErrorHandler from "../utils/ErrorHandler";
import { redis } from "../utils/redis";

//get user by id
export const getUserById = async (id: string, res: Response) => {
  try {
    const userJson = await redis.get(id);
    if (userJson) {
      const user = JSON.parse(userJson);
      res.status(200).json({
        success: true,
        user,
      });
    }
  } catch (error: any) {
    return new ErrorHandler(error.message, 400);
  }
};

// Get All Users
export const getAllUsersService = async (res: Response) => {
  const users = await userModel.find().sort({ createdAt: -1 });
  res.status(200).json({
    success: true,
    users,
  });
};

//Update user role
export const updateUserRoleService = async (res: Response, id: string, role: string) => {
  const user = await userModel.findByIdAndUpdate(id, { role }, { new: true });
  console.log(id);
  res.status(200).json({
    success: true,
    user,
  });
};
