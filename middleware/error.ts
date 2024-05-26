import { Request, Response, NextFunction } from "express";
import ErrorHandler from "../utils/ErrorHandler";

export const ErrorMiddleware = (err: any, req: Request, res: Response, next: NextFunction) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || "Internal Server Error";

  console.log(err.name)
  console.log(err.code)
  // wrong mongodb id error handling
  if (err.name === "CastError") {
    const message = `Resource not found. Invalid: ${err.path}`;
    err = new ErrorHandler(message, err.statusCode,);
  }

  // Duplicate key error
  if (err.code === 11000) {
    const message = `Duplicate ${Object.keys(err.keyValue)} entered`;
    err = new ErrorHandler(message, err.statusCode);
  }

  //Wrong JWT error
  if (err.name === "JsonWebTokenError") {
    const message = "Json web token is invalid, try again";
    err = new ErrorHandler(message, err.statusCode);
  }

  //JWT expired error
  if (err.name === "TokenExpiredError") {
    const message = "Json web token is expired, try again";
    err = new ErrorHandler(message, err.statusCode);
  }

  console.log(err)
  res.status(err.statusCode).json({
    success: false,
    message: err.message,
  });
};
