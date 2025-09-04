import { v2 as cloudinary } from "cloudinary";
import { CLOUDINARY } from "./env.js";

cloudinary.config({
  cloud_name: CLOUDINARY.cloudName,
  api_key: CLOUDINARY.apiKey,
  api_secret: CLOUDINARY.apiSecret,
});

export default cloudinary;
