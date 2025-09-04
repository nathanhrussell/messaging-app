import multer from "multer";

const storage = multer.memoryStorage();

// accept only common image mime types, max ~5MB
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.mimetype);
    if (!ok) return cb(new Error("Invalid file type"));
    return cb(null, true);
  },
});

export default upload;
