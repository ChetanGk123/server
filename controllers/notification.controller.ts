require("dotenv").config();
import { Request, Response, NextFunction } from "express";
import ErrorHandler from "../utils/ErrorHandler";
import { CatchAsyncErrors } from "../middleware/catchAsyncErrors";
import NotificationModel from "../models/notification.model";
import cron from "node-cron";

// get all notifications -- only for admin
export const getAllNotification = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const notifications = await NotificationModel.find().sort({ createdAt: -1 });

      res.status(201).json({
        success: true,
        notifications,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// update notification status
export const updateNotification = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const notification = await NotificationModel.findById(req.params.id);

      if (!notification) throw new ErrorHandler("No such notification found", 404);

      notification.status ? (notification.status = "read") : notification.status;

      await notification.save();

      getAllNotification(req, res, next); // redirect to
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

//delete notification -- only for admin
cron.schedule("0 0 0 * * *", async () => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  await NotificationModel.deleteMany({ status: "read", createdAt: { $lt: thirtyDaysAgo } });
  console.log("Deleted read notifications");
});
