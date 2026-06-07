/**
 * File upload utilities for Supabase Storage
 */

import { supabase } from "./supabase";
import { validateFileSize, validateLogoFile } from "./validation";

interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Upload logo to Supabase Storage
 * @param file - File to upload
 * @param userId - User ID for folder organization
 */
export const uploadLogo = async (
  file: File,
  userId: string
): Promise<UploadResult> => {
  // Validate file size (max 5MB)
  const sizeValidation = validateFileSize(file.size, 5);
  if (!sizeValidation.valid) {
    return { success: false, error: sizeValidation.error };
  }

  // Validate file type
  const typeValidation = validateLogoFile(file.name, file.type);
  if (!typeValidation.valid) {
    return { success: false, error: typeValidation.error };
  }

  try {
    // Create bucket if it doesn't exist (this will fail silently if it exists)
    // In production, ensure the bucket exists and is configured in Supabase

    // Generate unique filename
    const timestamp = Date.now();
    const extension = file.name.substring(file.name.lastIndexOf("."));
    const fileName = `${userId}-${timestamp}${extension}`;
    const filePath = `logos/${userId}/${fileName}`;

    // Delete previous logo if exists
    try {
      const { data: files } = await supabase.storage
        .from("company-logos")
        .list(`logos/${userId}`);

      if (files && files.length > 0) {
        // Delete all previous files
        const filesToDelete = files.map((f) => `logos/${userId}/${f.name}`);
        await supabase.storage
          .from("company-logos")
          .remove(filesToDelete);
      }
    } catch (error) {
      console.log("No previous logos to delete");
    }

    // Upload new file
    const { data, error } = await supabase.storage
      .from("company-logos")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      return { success: false, error: error.message };
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("company-logos").getPublicUrl(filePath);

    return { success: true, url: publicUrl };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return { success: false, error: message };
  }
};

/**
 * Delete logo from Supabase Storage
 * @param logoUrl - Current logo URL to identify the file to delete
 * @param userId - User ID for folder organization
 */
export const deleteLogo = async (
  logoUrl: string,
  userId: string
): Promise<UploadResult> => {
  try {
    // Extract filename from URL
    const urlParts = logoUrl.split("/");
    const fileName = urlParts[urlParts.length - 1];

    const { error } = await supabase.storage
      .from("company-logos")
      .remove([`logos/${userId}/${fileName}`]);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Delete failed";
    return { success: false, error: message };
  }
};
