import mongoose, { Document, Model, Schema } from "mongoose";
require("dotenv").config();

export interface INotification extends Document {
    title: string,
    message: string,
    status: string,
    userId: string
}

const notificationSchema  = new Schema<INotification>({
    title: { type: String, required: true },
    message: { type: String, required: true },
    status: { type: String, required: true, default: 'unread' }, // pending | sent | read
}, {timestamps: true})

const  NotificationModel = mongoose.model('Notification', notificationSchema);
export default  NotificationModel;