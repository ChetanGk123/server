import { Response } from "express";
import userModel from "../models/user.model";
import ErrorHandler from "../utils/ErrorHandler";
import { redis } from "../utils/redis";
import { CatchAsyncErrors } from "../middleware/catchAsyncErrors";
import CourseModel from "../models/course.model";

// create course
export const createCourse = CatchAsyncErrors(async (data: any, res: Response) => {
  const course = await CourseModel.create(data);
  res.status(200).json({
    success: true,
    course,
  });
});

// GEt All Courses
export const getAllCourseService = async (res: Response) => {
  const courses = await CourseModel.find().sort({ createdAt: -1 });
  res.status(200).json({
    success: true,
    courses,
  });
};
