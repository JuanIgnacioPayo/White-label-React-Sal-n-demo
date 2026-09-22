export const hexToRgba = (hex, opacityPercent) => {
  if (!hex) return `rgba(0,0,0,${opacityPercent / 100})`;
  let cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(char => char + char).join('');
  }
  const r = parseInt(cleanHex.substring(0, 2), 16) || 0;
  const g = parseInt(cleanHex.substring(2, 4), 16) || 0;
  const b = parseInt(cleanHex.substring(4, 6), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${opacityPercent / 100})`;
};

export const getOverlayShadow = (ov, mode = 'text') => {
  const color = ov.shadowColor || '#000000';
  const offsetX = ov.shadowOffsetX !== undefined ? ov.shadowOffsetX : (ov.shadowOffset !== undefined ? ov.shadowOffset : 4);
  const offsetY = ov.shadowOffsetY !== undefined ? ov.shadowOffsetY : (ov.shadowOffset !== undefined ? ov.shadowOffset : 4);
  const blur = ov.shadowBlur !== undefined ? ov.shadowBlur : 6;
  const opacity = ov.shadowOpacity !== undefined ? ov.shadowOpacity : 35;
  const thickness = ov.shadowThickness !== undefined ? ov.shadowThickness : 1;

  const rgbaColor = hexToRgba(color, opacity);

  if (mode === 'filter') {
    const shadows = [];
    for (let i = 0; i < thickness; i++) {
      shadows.push(`drop-shadow(${offsetX}px ${offsetY}px ${blur}px ${rgbaColor})`);
    }
    return shadows.join(' ');
  } else {
    const shadows = [];
    for (let i = 0; i < thickness; i++) {
      shadows.push(`${offsetX}px ${offsetY}px ${blur}px ${rgbaColor}`);
    }
    return shadows.join(', ');
  }
};

export const fetchImageBlob = async (url) => {
  let response;
  let fetchError = null;

  // Intentar descargar usando el proxy robusto de AllOrigins
  try {
    const allOriginsUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    response = await fetch(allOriginsUrl);
  } catch (err) {
    fetchError = err;
    console.warn("AllOrigins proxy fetch failed. Retrying direct fetch...", err);
  }

  // Fallback: descargar directo sin proxy si AllOrigins falla
  if (!response || !response.ok) {
    const directSafeUrl = url + (url.includes('?') ? '&' : '?') + `cb=${Date.now()}`;
    response = await fetch(directSafeUrl);
  }

  if (!response || !response.ok) {
    throw new Error(`Failed to fetch image blob (status: ${response?.status}). Primary error: ${fetchError?.message}`);
  }

  return await response.blob();
};

export const removeColorBackground = (imgElement, targetR = 255, targetG = 255, targetB = 255, tolerance = 45) => {
  const canvas = document.createElement('canvas');
  canvas.width = imgElement.naturalWidth || imgElement.width;
  canvas.height = imgElement.naturalHeight || imgElement.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(imgElement, 0, 0);
  
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i+1];
    const b = data[i+2];
    
    // Calculate Euclidean distance from target color (white by default)
    const distance = Math.sqrt(
      Math.pow(r - targetR, 2) +
      Math.pow(g - targetG, 2) +
      Math.pow(b - targetB, 2)
    );
    
    if (distance < tolerance) {
      // Transparent replacement
      data[i+3] = 0; 
    } else if (distance < tolerance + 15) {
      // Soft edge anti-aliasing feathering
      const ratio = (distance - tolerance) / 15;
      data[i+3] = Math.round(data[i+3] * ratio);
    }
  }
  
  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/png');
};
