/**
 * Validation functions for Settings and other forms
 */

export interface ValidationError {
  valid: boolean;
  error?: string;
}

/**
 * Validate phone number
 * - Only digits and optional leading "+"
 * - Min 10 digits, Max 15 digits
 */
export const validatePhone = (phone: string): ValidationError => {
  if (!phone) return { valid: true }; // Optional field

  const cleaned = phone.replace(/\s/g, "");
  const phoneRegex = /^\+?[0-9]{10,15}$/;

  if (!phoneRegex.test(cleaned)) {
    return {
      valid: false,
      error: "Phone must contain 10-15 digits (optional leading +)",
    };
  }

  return { valid: true };
};

/**
 * Validate website URL
 * - Must start with http:// or https://
 */
export const validateWebsite = (website: string): ValidationError => {
  if (!website) return { valid: true }; // Optional field

  const websiteRegex = /^https?:\/\/.+\..+/;

  if (!websiteRegex.test(website)) {
    return {
      valid: false,
      error: "Website must start with http:// or https://",
    };
  }

  return { valid: true };
};

/**
 * Validate company name
 * - Required
 * - Minimum 2 characters
 */
export const validateCompanyName = (name: string): ValidationError => {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: "Company name is required" };
  }

  if (name.trim().length < 2) {
    return { valid: false, error: "Company name must be at least 2 characters" };
  }

  return { valid: true };
};

/**
 * Validate password strength
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 */
export const validatePasswordStrength = (password: string): ValidationError => {
  if (!password) {
    return { valid: false, error: "Password is required" };
  }

  if (password.length < 8) {
    return { valid: false, error: "Password must be at least 8 characters" };
  }

  if (!/[A-Z]/.test(password)) {
    return {
      valid: false,
      error: "Password must contain at least one uppercase letter",
    };
  }

  if (!/[a-z]/.test(password)) {
    return {
      valid: false,
      error: "Password must contain at least one lowercase letter",
    };
  }

  if (!/[0-9]/.test(password)) {
    return { valid: false, error: "Password must contain at least one number" };
  }

  return { valid: true };
};

/**
 * Validate email format
 */
export const validateEmail = (email: string): ValidationError => {
  if (!email) {
    return { valid: false, error: "Email is required" };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    return { valid: false, error: "Invalid email format" };
  }

  return { valid: true };
};

/**
 * Validate file size
 * @param sizeInBytes - File size in bytes
 * @param maxSizeInMB - Maximum allowed size in MB
 */
export const validateFileSize = (
  sizeInBytes: number,
  maxSizeInMB: number = 5
): ValidationError => {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;

  if (sizeInBytes > maxSizeInBytes) {
    return {
      valid: false,
      error: `File size must be less than ${maxSizeInMB}MB`,
    };
  }

  return { valid: true };
};

/**
 * Validate file type for logo
 * @param fileName - Name of the file
 * @param mimeType - MIME type of the file
 */
export const validateLogoFile = (
  fileName: string,
  mimeType: string
): ValidationError => {
  const allowedTypes = ["image/jpeg", "image/png", "image/svg+xml", "image/webp"];
  const allowedExtensions = [".jpg", ".jpeg", ".png", ".svg", ".webp"];

  if (!allowedTypes.includes(mimeType)) {
    return {
      valid: false,
      error: "Only JPG, PNG, SVG, and WEBP images are allowed",
    };
  }

  const fileExtension = fileName.substring(fileName.lastIndexOf(".")).toLowerCase();
  if (!allowedExtensions.includes(fileExtension)) {
    return {
      valid: false,
      error: "Only JPG, PNG, SVG, and WEBP images are allowed",
    };
  }

  return { valid: true };
};

/**
 * Get password strength level (0-4)
 */
export const getPasswordStrength = (password: string): number => {
  let strength = 0;

  if (!password) return strength;

  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;

  return Math.min(strength, 4);
};

/**
 * Get password strength label
 */
export const getPasswordStrengthLabel = (strength: number): string => {
  switch (strength) {
    case 0:
    case 1:
      return "Weak";
    case 2:
      return "Fair";
    case 3:
      return "Good";
    case 4:
      return "Strong";
    default:
      return "Unknown";
  }
};

/**
 * Get password strength color
 */
export const getPasswordStrengthColor = (strength: number): string => {
  switch (strength) {
    case 0:
    case 1:
      return "text-red-500";
    case 2:
      return "text-yellow-500";
    case 3:
      return "text-blue-500";
    case 4:
      return "text-green-500";
    default:
      return "text-gray-500";
  }
};

/**
 * Get password strength background
 */
export const getPasswordStrengthBg = (strength: number): string => {
  switch (strength) {
    case 0:
    case 1:
      return "bg-red-500";
    case 2:
      return "bg-yellow-500";
    case 3:
      return "bg-blue-500";
    case 4:
      return "bg-green-500";
    default:
      return "bg-gray-500";
  }
};
