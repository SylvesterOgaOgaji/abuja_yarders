import { useState } from 'react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { toast } from 'sonner';

export const useCamera = () => {
    const [photo, setPhoto] = useState<string | null>(null);
    const [blob, setBlob] = useState<Blob | null>(null);

    const takePhoto = async (source: CameraSource = CameraSource.Prompt) => {
        try {
            if (!Capacitor.isNativePlatform()) {
                // Return early or handle web fallbacks if needed,
                // but usually the caller handles the UI switch
                console.log("Not native, use file input");
                return null;
            }

            const image = await Camera.getPhoto({
                quality: 90,
                allowEditing: false,
                resultType: CameraResultType.Uri,
                source: source
            });

            if (image.webPath) {
                setPhoto(image.webPath);

                // Convert to Blob for upload
                const response = await fetch(image.webPath);
                const blob = await response.blob();
                setBlob(blob);

                return { webPath: image.webPath, blob, format: image.format };
            }
        } catch (error) {
            console.error('Camera error:', error);
            if (error !== 'User cancelled photos app') {
                toast.error('Failed to take photo');
            }
        }
        return null;
    };

    return {
        photo,
        blob,
        takePhoto,
        isNative: Capacitor.isNativePlatform()
    };
};
