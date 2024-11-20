// Human Tasks:
// 1. Verify Supabase storage bucket configuration and permissions
// 2. Ensure environment has sufficient storage capacity for expected file uploads
// 3. Monitor storage usage and implement cleanup policies for temporary files
// 4. Review file type whitelist against security requirements

// uuid v9.0.0
import { v4 as uuidv4 } from 'uuid';
import supabase from './supabase';
import { APIError } from '../types/api';

// Requirement: File Storage - Maximum file size limit for uploads
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Requirement: Security Controls - Whitelist of allowed file types
export const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/svg+xml',
  'application/pdf'
] as const;

/**
 * Validates file size and type against allowed configurations
 * Requirement: Security Controls - Input validation for file operations
 */
export const validateFile = (file: File): boolean => {
  if (!file) return false;

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File size exceeds maximum limit of ${MAX_FILE_SIZE / 1024 / 1024}MB`);
  }

  // Verify file type
  if (!ALLOWED_FILE_TYPES.includes(file.type as typeof ALLOWED_FILE_TYPES[number])) {
    throw new Error(`File type ${file.type} is not allowed. Allowed types: ${ALLOWED_FILE_TYPES.join(', ')}`);
  }

  return true;
};

/**
 * Uploads a file to Supabase storage with validation and error handling
 * Requirement: File Storage - Supabase Storage for user uploads
 */
export const uploadFile = async (file: File, bucket: string): Promise<string> => {
  try {
    // Validate file before upload
    validateFile(file);

    // Generate unique file name using UUID
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;

    // Upload file to specified bucket
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      throw {
        code: 'UPLOAD_ERROR',
        message: 'Failed to upload file',
        details: error
      } as APIError;
    }

    // Return public URL of uploaded file
    return getPublicUrl(fileName, bucket);
  } catch (error) {
    if (error instanceof Error) {
      throw {
        code: 'VALIDATION_ERROR',
        message: error.message,
        details: { fileName: file.name }
      } as APIError;
    }
    throw error;
  }
};

/**
 * Deletes a file from Supabase storage
 * Requirement: File Storage - Secure file handling
 */
export const deleteFile = async (path: string, bucket: string): Promise<void> => {
  try {
    // Validate path format
    if (!path || typeof path !== 'string') {
      throw new Error('Invalid file path');
    }

    // Delete file from specified bucket
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      throw {
        code: 'DELETE_ERROR',
        message: 'Failed to delete file',
        details: error
      } as APIError;
    }
  } catch (error) {
    if (error instanceof Error) {
      throw {
        code: 'VALIDATION_ERROR',
        message: error.message,
        details: { filePath: path }
      } as APIError;
    }
    throw error;
  }
};

/**
 * Generates a public URL for accessing a stored file
 * Requirement: File Storage - Public URL generation for stored files
 */
export const getPublicUrl = (path: string, bucket: string): string => {
  // Validate path format
  if (!path || typeof path !== 'string') {
    throw new Error('Invalid file path');
  }

  // Generate public URL using Supabase storage
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);

  return data.publicUrl;
};