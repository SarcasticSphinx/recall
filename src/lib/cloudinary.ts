import "server-only";
import { v2 as cloudinary } from "cloudinary";
export function hasCloudinary() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET,
  );
}
export function cloudinaryClient() {
  if (!hasCloudinary())
    throw new Error("Cloudinary image uploads are not configured yet.");
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  return cloudinary;
}
