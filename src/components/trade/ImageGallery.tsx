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
        <DialogContent className="max-w-7xl border-0 bg-black/95 backdrop-blur-xl p-0 gap-0">
          <div className="relative h-[90vh] flex flex-col">
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4 bg-gradient-to-b from-black/60 to-transparent">
              <div className="text-sm font-medium text-white/90">
                {(selectedIndex ?? 0) + 1} / {images.length}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 text-white border-0"
                onClick={closeImage}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Main image container */}
            <div className="flex-1 flex items-center justify-center p-6 pt-20 pb-24">
              {selectedIndex !== null && (
                <img
                  src={images[selectedIndex]}
                  alt={`Chart ${selectedIndex + 1}`}
                  className="max-h-full max-w-full object-contain rounded-lg"
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
                <button
                  onClick={goToPrevious}
                  className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm flex items-center justify-center transition-all border border-white/10 text-white"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={goToNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm flex items-center justify-center transition-all border border-white/10 text-white"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}

            {/* Thumbnail strip at bottom */}
            {images.length > 1 && (
              <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/80 to-transparent p-4">
                <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2 px-4">
                  {images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedIndex(index)}
                      className={`flex-shrink-0 h-16 w-24 rounded-lg overflow-hidden transition-all border-2 ${
                        selectedIndex === index 
                          ? 'border-white scale-105 opacity-100' 
                          : 'border-white/20 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={image}
                        alt={`Thumbnail ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}