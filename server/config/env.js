// server/config/env.js
import dotenv from "dotenv";

dotenv.config(); // loads .env from the project root (based on process.cwd())

function required(name) {
  const val = process.env[name];
  if (!val) throw new Error(`Missing required env var: ${name}`);
  return val.trim();
}

export const CLOUDINARY = {
  cloudName: required("CLOUDINARY_CLOUD_NAME"),
  apiKey: required("CLOUDINARY_API_KEY"),
  apiSecret: required("CLOUDINARY_API_SECRET"),
};
