import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase/firebase';

export const uploadToFirebaseStorage = async (file) => {
  try {
    const rawName = file.name || 'upload.jpg';
    const cleanName = rawName
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .toLowerCase();
    const filename = `${Date.now()}_${cleanName}`;
    const storageRef = ref(storage, `uploads/${filename}`);
    
    const metadata = {
      contentType: file.type || 'image/jpeg',
      cacheControl: 'public, max-age=31536000'
    };

    const snapshot = await uploadBytes(storageRef, file, metadata);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error("[StorageUpload] Error:", error);
    throw error;
  }
};
