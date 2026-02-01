import { useState } from 'react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImageGalleryProps {
  images: string[];
  thumbnailSize?: 'sm' | 'md' | 'lg';
}

export function ImageGallery({ images, thumbnailSize = 'sm' }: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  if (images.length === 0) return null;

  const sizeClasses = {
    sm: 'h-12 w-16',
    md: 'h-16 w-24',
    lg: 'h-24 w-32',
  };

  const openImage = (index: number) => {
    setSelectedIndex(index);
  };

  const closeImage = () => {
    setSelectedIndex(null);
  };

  const goToPrevious = () => {
    if (selectedIndex === null) return;
    setSelectedIndex(selectedIndex > 0 ? selectedIndex - 1 : images.length - 1);
  };

  const goToNext = () => {
    if (selectedIndex === null) return;
    setSelectedIndex(selectedIndex < images.length - 1 ? selectedIndex + 1 : 0);
  };

  return (
    <>
      {/* Thumbnail grid */}
      <div className="flex flex-wrap gap-1.5">
        {images.map((image, index) => (
          <button
            key={index}
            onClick={() => openImage(index)}
            className={`${sizeClasses[thumbnailSize]} overflow-hidden rounded border border-border bg-muted transition-transform hover:scale-105`}
          >
            <img
              src={image}
              alt={`Chart ${index + 1}`}
              className="h-full w-full object-cover"
            />
          </button>
        ))}
      </div>

      {/* Expanded view dialog */}
      <Dialog open={selectedIndex !== null} onOpenChange={() => closeImage()}>
        <DialogContent className="max-w-4xl border-border bg-background p-0">
          <div className="relative">
            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2 z-10 bg-background/80"
              onClick={closeImage}
            >
              <X className="h-4 w-4" />
            </Button>

            {/* Image */}
            <div className="flex items-center justify-center p-4">
              {selectedIndex !== null && (
                <img
                  src={images[selectedIndex]}
                  alt={`Chart ${selectedIndex + 1}`}
                  className="max-h-[80vh] max-w-full rounded-lg object-contain"
                  style={{ 
                    imageRendering: 'auto',
                    maxWidth: '100%',
                    height: 'auto',
                  }}
                  loading="eager"
                  decoding="sync"
                />
              )}
            </div>

            {/* Navigation arrows */}
            {images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80"
                  onClick={goToPrevious}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80"
                  onClick={goToNext}
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </>
            )}

            {/* Image counter */}
            {images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-background/80 px-3 py-1 text-sm text-foreground">
                {(selectedIndex ?? 0) + 1} / {images.length}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}