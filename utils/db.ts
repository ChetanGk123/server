import mongoose from "mongoose";
require("dotenv").config();
const db: string = process.env.DB_URL || "";
const connectToDb = async () => {
  try {
    await mongoose.connect(db).then((data: any) => {
      console.log(`connected to ${db}`);
    });
  } catch (error: any) {
    console.log(error.message);
    setTimeout(connectToDb, 5000);
  }
};

export default connectToDb;
