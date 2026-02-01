import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ImagePlus, X, Clipboard, Image, FolderOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { useIsMobile } from '@/hooks/use-mobile';
import { ImageZoomDialog } from '@/components/ui/ImageZoomDialog';

interface ImageUploadProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
  timeframeLabel?: string;
}

export function ImageUpload({
  images,
  onChange,
  maxImages = 10,
  timeframeLabel
}: ImageUploadProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pasteZoneRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isPasteFocused, setIsPasteFocused] = useState(false);
  const [showMobileOptions, setShowMobileOptions] = useState(false);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [zoomIndex, setZoomIndex] = useState(0);
  const isMobile = useIsMobile();

  // No compression - preserve original quality
  const processImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => {
        const result = e.target?.result as string;
        if (result) {
          resolve(result);
        } else {
          reject(new Error('Failed to read file'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  // Process blob without compression - preserve original quality
  const processBlob = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => {
        const result = e.target?.result as string;
        if (result) {
          resolve(result);
        } else {
          reject(new Error('Failed to read blob'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read blob'));
      reader.readAsDataURL(blob);
    });
  };

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const imageFiles = fileArray.filter(file => file.type.startsWith('image/'));
    if (imageFiles.length === 0) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload image files only.',
        variant: 'destructive'
      });
      return;
    }
    const remaining = maxImages - images.length;
    if (remaining <= 0) {
      toast({
        title: 'Maximum images reached',
        description: `You can only upload up to ${maxImages} images.`,
        variant: 'destructive'
      });
      return;
    }
    const filesToProcess = imageFiles.slice(0, remaining);
    try {
      const newImages = await Promise.all(filesToProcess.map(file => processImage(file)));
      onChange([...images, ...newImages]);
      toast({
        title: 'Images added',
        description: `${newImages.length} image(s) uploaded successfully.`
      });
    } catch {
      toast({
        title: 'Upload failed',
        description: 'Failed to process one or more images.',
        variant: 'destructive'
      });
    }
  }, [images, maxImages, onChange, toast]);

  const handlePaste = useCallback(async (e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    const imageItems = Array.from(items).filter(item => item.type.startsWith('image/'));
    if (imageItems.length === 0) return;
    e.preventDefault();
    const files = imageItems.map(item => item.getAsFile()).filter((file): file is File => file !== null);
    if (files.length > 0) {
      await handleFiles(files);
    }
  }, [handleFiles]);

  const handlePasteFromClipboard = useCallback(async () => {
    try {
      if (!navigator.clipboard || !navigator.clipboard.read) {
        toast({
          title: 'Paste not supported',
          description: 'Your browser does not support clipboard paste. Try using Ctrl+V or Cmd+V instead.',
          variant: 'destructive'
        });
        return;
      }

      const clipboardItems = await navigator.clipboard.read();
      const imageBlobs: Blob[] = [];

      for (const item of clipboardItems) {
        const imageType = item.types.find(type => type.startsWith('image/'));
        if (imageType) {
          const blob = await item.getType(imageType);
          imageBlobs.push(blob);
        }
      }

      if (imageBlobs.length === 0) {
        toast({
          title: 'No image found',
          description: 'No image was found in your clipboard. Copy a chart image first.',
          variant: 'destructive'
        });
        return;
      }

      const remaining = maxImages - images.length;
      if (remaining <= 0) {
        toast({
          title: 'Maximum images reached',
          description: `You can only upload up to ${maxImages} images.`,
          variant: 'destructive'
        });
        return;
      }

      const blobsToProcess = imageBlobs.slice(0, remaining);
      const newImages = await Promise.all(blobsToProcess.map(blob => processBlob(blob)));
      onChange([...images, ...newImages]);
      setShowMobileOptions(false);
      toast({
        title: 'Images added',
        description: `${newImages.length} image(s) pasted successfully.`
      });
    } catch (error) {
      console.error('Paste error:', error);
      toast({
        title: 'Paste failed',
        description: 'Could not read clipboard. Make sure you have copied an image and granted clipboard permission.',
        variant: 'destructive'
      });
    }
  }, [images, maxImages, onChange, toast]);

  useEffect(() => {
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [handlePaste]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onChange(newImages);
  };

  const handleUploadZoneClick = () => {
    if (isMobile) {
      setShowMobileOptions(true);
    } else {
      fileInputRef.current?.click();
    }
  };

  // Desktop paste - directly paste from clipboard without asking for Ctrl+V
  const handleDesktopPasteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await handlePasteFromClipboard();
  };

  const handleImageClick = (index: number) => {
    setZoomIndex(index);
    setZoomOpen(true);
  };

  return (
    <div className="space-y-2">
      {/* Upload zone - only show when no images */}
      {images.length === 0 && (
        <div
          ref={pasteZoneRef}
          tabIndex={0}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onFocus={() => setIsPasteFocused(true)}
          onBlur={() => setIsPasteFocused(false)}
          className={cn(
            'flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-secondary/30 p-4 transition-all cursor-pointer',
            isDragging ? 'border-primary/40 bg-secondary/50' : 'hover:border-primary/30 hover:bg-secondary/40',
            isPasteFocused && 'ring-1 ring-ring/20'
          )}
          onClick={handleUploadZoneClick}
        >
          <Image className="h-5 w-5 text-muted-foreground" />
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              {isMobile 
                ? 'Tap to add chart' 
                : 'Drop, browse, or Ctrl+V'}
            </p>
          </div>
          {!isMobile && (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-muted-foreground hover:text-foreground"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                <FolderOpen className="mr-1 h-3 w-3" />
                Browse
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-muted-foreground hover:text-foreground"
                onClick={handleDesktopPasteClick}
              >
                <Clipboard className="mr-1 h-3 w-3" />
                Paste
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) {
            handleFiles(e.target.files);
            setShowMobileOptions(false);
          }
        }}
      />

      {/* Mobile options drawer */}
      <Drawer open={showMobileOptions} onOpenChange={setShowMobileOptions}>
        <DrawerContent className="px-4 pb-8">
          <DrawerHeader className="pb-2">
            <DrawerTitle className="text-center text-lg">Add Chart Image</DrawerTitle>
          </DrawerHeader>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border hover:bg-accent transition-colors active:scale-[0.98]"
              onClick={() => {
                fileInputRef.current?.click();
              }}
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted">
                <FolderOpen className="h-5 w-5 text-foreground" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-foreground">Choose from Gallery</p>
                <p className="text-xs text-muted-foreground">Select an image from your photos</p>
              </div>
            </button>
            <button
              type="button"
              className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border hover:bg-accent transition-colors active:scale-[0.98]"
              onClick={handlePasteFromClipboard}
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted">
                <Clipboard className="h-5 w-5 text-foreground" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-foreground">Paste from Clipboard</p>
                <p className="text-xs text-muted-foreground">Paste a copied chart image</p>
              </div>
            </button>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Image thumbnails */}
      {images.length > 0 && (
        <div className="space-y-2">
          <div className="flex flex-col gap-2">
            {images.map((image, index) => (
              <div key={index} className="group relative w-full rounded-lg border border-border overflow-hidden bg-muted/30">
                <img 
                  src={image} 
                  alt={`Trade chart ${index + 1}`} 
                  className="w-full h-auto object-contain block cursor-pointer hover:opacity-90 transition-opacity" 
                  style={{ 
                    imageRendering: 'auto',
                    maxWidth: '100%',
                    height: 'auto',
                  }}
                  loading="eager"
                  decoding="sync"
                  onClick={() => handleImageClick(index)}
                />
                <button 
                  type="button" 
                  onClick={(e) => {
                    e.stopPropagation();
                    removeImage(index);
                  }} 
                  className="absolute right-2 top-2 rounded-full bg-background/80 backdrop-blur-sm p-1.5 shadow-lg transition-all hover:bg-destructive hover:text-destructive-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
          {images.length < maxImages && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full text-xs text-muted-foreground"
              onClick={() => {
                if (isMobile) {
                  setShowMobileOptions(true);
                } else {
                  fileInputRef.current?.click();
                }
              }}
            >
              <ImagePlus className="mr-1.5 h-3.5 w-3.5" />
              Add more
            </Button>
          )}
        </div>
      )}

      {/* Zoom Dialog */}
      <ImageZoomDialog
        images={images}
        initialIndex={zoomIndex}
        open={zoomOpen}
        onOpenChange={setZoomOpen}
      />
    </div>
  );
}
