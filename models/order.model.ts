import mongoose, { Document, Model, Schema } from "mongoose";
require("dotenv").config();

export interface IOrder extends Document {
    courseId: string,
    userId: string,
    payment_info: object
}

const ordersSchema = new Schema<IOrder>({
    courseId: { type: String, required: true },
    userId: { type: String, required: true},
    payment_info: {
        type: Object,
    }
},{timestamps:true});

const OrderModel: Model<IOrder> = mongoose.model('Order', ordersSchema);

export default OrderModel;