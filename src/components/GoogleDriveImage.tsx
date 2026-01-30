import { useState } from "react";
import { Loader2 } from "lucide-react";

interface GoogleDriveImageProps {
    link: string;
    alt?: string;
    className?: string;
    objectFit?: "cover" | "contain";
}

export const GoogleDriveImage = ({
    link,
    alt = "Gallery submission image",
    className = "",
    objectFit = "cover"
}: GoogleDriveImageProps) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    // Function to extract file ID from various Google Drive link formats
    const getFileId = (url: string | null | undefined) => {
        if (!url) return null;
        const regex = /[-\w]{25,}/;
        const match = url.match(regex);
        return match ? match[0] : null;
    };

    const fileId = getFileId(link);

    // Use the high-res thumbnail URL
    const src = fileId
        ? `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`
        : null;

    if (!src) {
        return (
            <div className={`flex items-center justify-center bg-muted rounded-lg p-4 text-xs text-muted-foreground ${className}`}>
                Invalid image link
            </div>
        );
    }

    return (
        <div className={`relative overflow-hidden group ${className}`}>
            {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted transition-opacity duration-300">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            )}

            {error ? (
                <div className="flex flex-col items-center justify-center bg-muted h-full w-full p-4 text-center">
                    <span className="text-xs text-muted-foreground">Failed to load from Drive</span>
                    <span className="text-[10px] text-muted-foreground mt-1">Ensure the file is shared as "Public"</span>
                </div>
            ) : (
                <img
                    src={src}
                    alt={alt}
                    className={`w-full h-full transition-opacity duration-500 ${loading ? 'opacity-0' : 'opacity-100'}`}
                    style={{ objectFit }}
                    onLoad={() => setLoading(false)}
                    onError={() => {
                        setLoading(false);
                        setError(true);
                    }}
                />
            )}
        </div>
    );
};
