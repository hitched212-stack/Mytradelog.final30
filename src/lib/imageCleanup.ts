import { supabase } from '@/integrations/supabase/client';

/**
 * Helper function to cleanup images from Supabase Storage
 * Currently images are stored as base64 in database, but this is ready
 * for migration to Supabase Storage buckets for better storage optimization
 */

/**
 * Extract storage URLs from base64 or URLs
 * Returns array of storage paths to delete
 */
export function extractStoragePaths(images: string[]): string[] {
  return images
    .filter(img => img && !img.startsWith('data:')) // Filter out base64 images
    .map(url => {
      try {
        // Extract path from Supabase storage URL
        const urlObj = new URL(url);
        const pathMatch = urlObj.pathname.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)/);
        return pathMatch ? pathMatch[1] : null;
      } catch {
        return null;
      }
    })
    .filter((path): path is string => path !== null);
}

/**
 * Delete images from Supabase Storage bucket
 * Use this when migrating from base64 to storage buckets
 */
export async function deleteImagesFromStorage(
  images: string[],
  bucketName: string = 'trading-media'
): Promise<{ success: boolean; errors: string[] }> {
  const paths = extractStoragePaths(images);
  
  if (paths.length === 0) {
    return { success: true, errors: [] };
  }

  const errors: string[] = [];

  try {
    const { error } = await supabase.storage
      .from(bucketName)
      .remove(paths);

    if (error) {
      console.error('Storage deletion error:', error);
      errors.push(error.message);
      return { success: false, errors };
    }

    return { success: true, errors: [] };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to delete images from storage:', error);
    errors.push(errorMsg);
    return { success: false, errors };
  }
}

/**
 * Cleanup all images associated with a trade
 * Call this before deleting a trade to prevent orphaned images
 */
export async function cleanupTradeImages(
  images: string[],
  preMarketImages: string[] = [],
  postMarketImages: string[] = []
): Promise<{ success: boolean; errors: string[] }> {
  const allImages = [...images, ...preMarketImages, ...postMarketImages];
  
  // Currently a no-op since images are base64 in database
  // When migrating to storage buckets, uncomment:
  // return await deleteImagesFromStorage(allImages);
  
  return { success: true, errors: [] };
}

/**
 * Calculate total storage size of base64 images
 * Useful for displaying storage usage to users
 */
export function calculateBase64Size(base64String: string): number {
  if (!base64String || !base64String.startsWith('data:')) {
    return 0;
  }
  
  // Remove data URL prefix
  const base64Data = base64String.split(',')[1] || base64String;
  
  // Calculate size in bytes
  // Base64 encoding increases size by ~33%, so actual size is ~75% of encoded length
  const padding = (base64Data.match(/=/g) || []).length;
  const bytes = (base64Data.length * 3) / 4 - padding;
  
  return bytes;
}

/**
 * Calculate total storage used by all images in a trade
 */
export function calculateTradeStorageSize(
  images: string[],
  preMarketImages: string[] = [],
  postMarketImages: string[] = []
): { totalBytes: number; totalMB: number; imageCount: number } {
  const allImages = [...images, ...preMarketImages, ...postMarketImages];
  const totalBytes = allImages.reduce((sum, img) => sum + calculateBase64Size(img), 0);
  const totalMB = totalBytes / (1024 * 1024);
  
  return {
    totalBytes,
    totalMB,
    imageCount: allImages.length
  };
}
