'use strict';
const cloudinary = require('cloudinary').v2;
const fs = require('fs');

/**
 * Checks if Cloudinary is configured via environment variables.
 * Can be explicitly overridden with STORAGE_TYPE=local (e.g. on Webuzo/cPanel).
 */
const isCloudinaryEnabled = () => {
  if (process.env.STORAGE_TYPE === 'local') return false;
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
};

// Initialize Cloudinary only if credentials are present
if (isCloudinaryEnabled()) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

/**
 * Uploads a file to Cloudinary and cleans up the temporary local file.
 * Returns the permanent HTTPS secure URL or null.
 */
const uploadToCloudinary = async (filePath, folder = 'general') => {
  if (!isCloudinaryEnabled() || !filePath) return null;

  // Re-configure in case env variables were loaded dynamically
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });

  const baseFolder = process.env.CLOUDINARY_FOLDER || 'aadhya_garments';
  const targetFolder = `${baseFolder}/${folder}`.replace(/\/+/g, '/');

  const result = await cloudinary.uploader.upload(filePath, {
    folder: targetFolder,
    resource_type: 'auto',
  });

  // Delete local temporary file after successful cloud upload
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (e) {}

  return result.secure_url;
};

/**
 * Safely deletes a file from Cloudinary given its URL.
 */
const deleteFromCloudinary = async (imageUrl) => {
  if (!isCloudinaryEnabled() || !imageUrl || typeof imageUrl !== 'string') return;
  if (!imageUrl.includes('cloudinary.com')) return;

  try {
    const parts = imageUrl.split('/upload/');
    if (parts.length > 1) {
      let publicIdWithExt = parts[1].replace(/^v\d+\//, '');
      const lastDot = publicIdWithExt.lastIndexOf('.');
      const publicId = lastDot !== -1 ? publicIdWithExt.substring(0, lastDot) : publicIdWithExt;
      await cloudinary.uploader.destroy(publicId);
      console.log(`[Cloudinary] Deleted asset: ${publicId}`);
    }
  } catch (err) {
    console.error(`[Cloudinary Delete Error]:`, err.message);
  }
};

/**
 * Universal helper:
 * - If Cloudinary is configured (Render) -> uploads to Cloudinary CDN and returns HTTPS URL.
 * - If Cloudinary is NOT configured (Webuzo / Local) -> keeps local file and returns /uploads/... relative path.
 * Zero hardcoding.
 */
const getUploadedUrl = async (file, folder = 'others') => {
  if (!file) return null;

  if (isCloudinaryEnabled()) {
    try {
      const cloudUrl = await uploadToCloudinary(file.path, folder);
      if (cloudUrl) return cloudUrl;
    } catch (err) {
      console.error(`[Cloudinary Upload Error, falling back to local storage]:`, err.message);
    }
  }

  // Fallback / Webuzo mode: preserve local path under /uploads/...
  const normalizedPath = file.path.replace(/\\/g, '/');
  const uploadsIndex = normalizedPath.indexOf('uploads');
  if (uploadsIndex !== -1) {
    return '/' + normalizedPath.substring(uploadsIndex);
  }
  return `/uploads/${folder}/${file.filename}`;
};

module.exports = {
  isCloudinaryEnabled,
  uploadToCloudinary,
  deleteFromCloudinary,
  getUploadedUrl,
};
