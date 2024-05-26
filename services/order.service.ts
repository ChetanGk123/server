import { NextFunction, Response } from "express";
import { CatchAsyncErrors } from "../middleware/catchAsyncErrors";
import OrderModel from "../models/order.model";

// create new order
export const newOrder = CatchAsyncErrors(async (data: any, res: Response) => {
  const order = await OrderModel.create(data);
  res.status(201).json({
    success: true,
    order,
  });
});

// GEt All orders
export const getAllOrderService = async (res: Response) => {
  const orders = await OrderModel.find().sort({ createdAt: -1 });
  res.status(200).json({
    success: true,
    orders,
  });
};
