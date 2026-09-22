/**
 * Generates a profile image with the user's initial.
 * @param {string} name - The name of the user (used to extract the initial).
 * @param {number} size - The size of the square image in pixels (default: 500).
 * @returns {Promise<Blob>} - A promise that resolves to the image Blob.
 */
export const generateProfileImage = (name, size = 500) => {
    return new Promise((resolve, reject) => {
        try {
            const canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');

            // Background
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, size, size);

            // Text
            const initial = name ? name.charAt(0).toUpperCase() : '?';
            ctx.fillStyle = '#333333'; // Dark grey text
            ctx.font = `bold ${size * 0.5}px Arial, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Adjust vertical alignment slightly for visual centering
            ctx.fillText(initial, size / 2, size / 2 + (size * 0.05));

            // Convert to Blob
            canvas.toBlob((blob) => {
                if (blob) {
                    resolve(blob);
                } else {
                    reject(new Error('Failed to generate image blob'));
                }
            }, 'image/jpeg', 0.9);
        } catch (error) {
            reject(error);
        }
    });
};

/**
 * Optimiza y comprime imágenes (especialmente fotos pesadas tomadas desde el móvil)
 * redimensionándolas a un máximo de 1200x1200 y calidad 0.85, reduciendo su peso
 * de 10-15MB a ~150-250KB para carga instantánea y compatibilidad con WhatsApp Open Graph.
 * 
 * @param {File|Blob} file - Archivo de imagen original
 * @param {number} maxWidth - Ancho máximo permitido (default: 1200)
 * @param {number} maxHeight - Alto máximo permitido (default: 1200)
 * @param {number} quality - Calidad JPEG (default: 0.85)
 * @returns {Promise<File>} Archivo File optimizado listo para subir
 */
export const compressImageForWeb = async (file, maxWidth = 1200, maxHeight = 1200, quality = 0.85) => {
    return new Promise((resolve) => {
        if (!file || !file.type || !file.type.startsWith('image/')) {
            resolve(file);
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                try {
                    let width = img.width;
                    let height = img.height;

                    if (width > maxWidth || height > maxHeight) {
                        const ratio = Math.min(maxWidth / width, maxHeight / height);
                        width = Math.round(width * ratio);
                        height = Math.round(height * ratio);
                    }

                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;

                    const ctx = canvas.getContext('2d');
                    // Fondo blanco para evitar fondos negros en caso de PNG/alfa
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(0, 0, width, height);
                    ctx.drawImage(img, 0, 0, width, height);

                    canvas.toBlob(
                        (blob) => {
                            if (blob) {
                                const cleanBase = (file.name || 'image')
                                    .replace(/\.[^/.]+$/, '')
                                    .replace(/[^a-zA-Z0-9_-]/g, '_');
                                const compressedFile = new File([blob], `${cleanBase}.jpg`, {
                                    type: 'image/jpeg',
                                    lastModified: Date.now()
                                });
                                resolve(compressedFile);
                            } else {
                                resolve(file);
                            }
                        },
                        'image/jpeg',
                        quality
                    );
                } catch (err) {
                    console.warn('[compressImageForWeb] Error en canvas, usando original:', err);
                    resolve(file);
                }
            };
            img.onerror = () => {
                console.warn('[compressImageForWeb] Error cargando imagen, usando original');
                resolve(file);
            };
            img.src = e.target.result;
        };
        reader.onerror = () => {
            console.warn('[compressImageForWeb] Error en FileReader, usando original');
            resolve(file);
        };
        reader.readAsDataURL(file);
    });
};
