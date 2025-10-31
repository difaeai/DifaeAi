"use client";

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, UploadCloud } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

interface ImageUploaderProps {
  uploadPath: string;
  onUploadSuccess: (url: string) => void;
  onUploadError: (error: string) => void;
}

async function uploadImage(file: File, path: string): Promise<string> {
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    return url;
}


export function ImageUploader({
  uploadPath,
  onUploadSuccess,
  onUploadError,
}: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { user } = useAuth();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }

    if (!file) {
      return;
    }
    
    if (!user) {
        onUploadError("You must be logged in to upload an image.");
        return;
    }

    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > MAX_FILE_SIZE) {
      onUploadError("Image size must be less than 5MB.");
      return;
    }
    
    setIsUploading(true);
    
    const uniqueFileName = `${user.uid}_${Date.now()}_${file.name.replace(/\s/g, '_')}`;
    const fullPath = `${uploadPath}/${uniqueFileName}`;

    try {
        const downloadUrl = await uploadImage(file, fullPath);
        onUploadSuccess(downloadUrl);
    } catch (error: any) {
      console.error('Image Upload Error:', error);
      onUploadError(error.message || "An unexpected error occurred during upload.");
    } finally {
      setIsUploading(false);
    }
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex items-center gap-2">
      <Input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        disabled={isUploading || !user}
      />
      <Button
        type="button"
        onClick={triggerUpload}
        disabled={isUploading || !user}
        variant="outline"
      >
        {isUploading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <UploadCloud className="mr-2 h-4 w-4" />
        )}
        {isUploading ? 'Uploading...' : 'Upload Image'}
      </Button>
    </div>
  );
}
