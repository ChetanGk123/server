require("dotenv").config();
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { ErrorMiddleware } from "./middleware/error";
import userRouter from "./routes/user.route";
import courseRouter from "./routes/course.route";
import orderRouter from "./routes/order.route";
import notificationRouter from "./routes/notification.route";
import analyticsRouter from "./routes/analytics.route";
import layoutRouter from "./routes/layout.route";
export const app = express();
// body parser
app.use(express.json({ limit: "50mb" }));

//cookie parser
app.use(cookieParser());

// cors => cross origin resource sharing
app.use(
  cors({
    //origin: process.env.ORIGIN,
    origin: "http://localhost:3000",
    credentials: true,
  })
);

//routes
app.use(
  "/api/v1",
  userRouter,
  courseRouter,
  orderRouter,
  notificationRouter,
  analyticsRouter,
  layoutRouter
);

// testing api
app.get("/test", (req: Request, res: Response, next: NextFunction) => {
  return res.status(200).json({
    success: true,
    message: "Welcome to API",
  });
});

// unknown route
app.all("*", (req: Request, res: Response, next: NextFunction) => {
  const err = new Error(`Not Found - ${req.originalUrl}`) as any;
  err.status = 404;
  next(err);
});

app.use(ErrorMiddleware); // error handling middleware must be at the end of all routes
