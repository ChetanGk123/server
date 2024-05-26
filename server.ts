import { app } from "./app";
import http from "http";
import connectToDb from "./utils/db";
import {v2 as cloudinary} from "cloudinary";
import { initSocketServer } from "./socketServer";

require("dotenv").config();
const server = http.createServer(app);

//cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_SECRET_KEY,
  secure: true,
})

initSocketServer(server);

server.listen(process.env.PORT || 8000, () => {
  console.log(`Sever is connected with port ${process.env.PORT}`);
  connectToDb()
});
