/* ===================================
   IMAGE OPTIMIZATION UTILITY
   Compress images to thumbnails (~100KB) and full images (~500KB) in WebP format
   =================================== */

/**
 * Optimize image for web use
 * @param {File} file - Image file to optimize
 * @param {string} type - 'thumbnail' or 'full'
 * @returns {Promise<{blob: Blob, url: string, size: number}>}
 */
export async function optimizeImage(file, type = 'full') {
    return new Promise((resolve, reject) => {
        // Validate file type
        if (!file.type.startsWith('image/')) {
            reject(new Error('File must be an image'));
            return;
        }

        // Validate file size (max 5MB original)
        const maxOriginalSize = 5 * 1024 * 1024;
        if (file.size > maxOriginalSize) {
            reject(new Error('Image size must be less than 5MB'));
            return;
        }

        const reader = new FileReader();

        reader.onload = (e) => {
            const img = new Image();

            img.onload = () => {
                try {
                    const result = compressImage(img, type);
                    resolve(result);
                } catch (error) {
                    reject(error);
                }
            };

            img.onerror = () => {
                reject(new Error('Failed to load image'));
            };

            img.src = e.target.result;
        };

        reader.onerror = () => {
            reject(new Error('Failed to read file'));
        };

        reader.readAsDataURL(file);
    });
}

/**
 * Compress image to specified quality and dimensions
 * @param {HTMLImageElement} img - Image element
 * @param {string} type - 'thumbnail' or 'full'
 * @returns {{blob: Blob, url: string, size: number}}
 */
function compressImage(img, type) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Target dimensions and quality based on type
    let maxWidth, maxHeight, quality, targetSize;

    if (type === 'thumbnail') {
        maxWidth = 400;
        maxHeight = 400;
        quality = 0.7;
        targetSize = 100 * 1024; // 100KB
    } else {
        maxWidth = 1200;
        maxHeight = 1200;
        quality = 0.8;
        targetSize = 500 * 1024; // 500KB
    }

    // Calculate new dimensions maintaining aspect ratio
    let width = img.width;
    let height = img.height;

    if (width > height) {
        if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
        }
    } else {
        if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
        }
    }

    // Set canvas dimensions
    canvas.width = width;
    canvas.height = height;

    // Draw image on canvas with smoothing
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, width, height);

    // Try to compress to target size
    let blob = null;
    let dataURL = null;

    // Attempt compression with decreasing quality if needed
    for (let q = quality; q >= 0.5; q -= 0.1) {
        dataURL = canvas.toDataURL('image/webp', q);
        blob = dataURLToBlob(dataURL);

        if (blob.size <= targetSize || q <= 0.5) {
            break;
        }
    }

    // If still too large, reduce dimensions
    if (blob.size > targetSize * 1.2) {
        const scale = 0.8;
        canvas.width = width * scale;
        canvas.height = height * scale;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        dataURL = canvas.toDataURL('image/webp', 0.7);
        blob = dataURLToBlob(dataURL);
    }

    return {
        blob: blob,
        url: dataURL,
        size: blob.size
    };
}

/**
 * Convert data URL to Blob
 * @param {string} dataURL - Data URL
 * @returns {Blob}
 */
function dataURLToBlob(dataURL) {
    const parts = dataURL.split(',');
    const mime = parts[0].match(/:(.*?);/)[1];
    const bstr = atob(parts[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);

    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }

    return new Blob([u8arr], { type: mime });
}

/**
 * Format file size to human readable
 * @param {number} bytes - Size in bytes
 * @returns {string}
 */
export function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Validate image file
 * @param {File} file - File to validate
 * @returns {{valid: boolean, error: string}}
 */
export function validateImageFile(file) {
    // Check if file exists
    if (!file) {
        return { valid: false, error: 'No file selected' };
    }

    // Check file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
        return { valid: false, error: 'Only JPEG, PNG, and WebP images are allowed' };
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
        return { valid: false, error: 'Image size must be less than 5MB' };
    }

    return { valid: true, error: null };
}

/**
 * Create image preview
 * @param {File} file - Image file
 * @returns {Promise<string>} Data URL for preview
 */
export function createImagePreview(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            resolve(e.target.result);
        };

        reader.onerror = () => {
            reject(new Error('Failed to read file'));
        };

        reader.readAsDataURL(file);
    });
}

console.log('Image optimizer utility loaded');
