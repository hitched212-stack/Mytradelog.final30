import React, { useRef, useState, useEffect } from 'react';
import appIcon from '@/assets/app-icon.svg';

interface ImageComparisonSliderProps {
  beforeImage: string;
  afterImage: string;
  beforeLabel?: string;
  afterLabel?: string;
  className?: string;
}

export function ImageComparisonSlider({
  beforeImage,
  afterImage,
  beforeLabel = 'Light',
  afterLabel = 'Dark',
  className = '',
}: ImageComparisonSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = () => {
    setIsDragging(true);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  const handleTouchStart = () => {
    setIsDragging(true);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !containerRef.current) return;

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden rounded-lg cursor-ew-resize select-none ${className}`}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
    >
      {/* After image (base) */}
      <img src={afterImage} alt={afterLabel} className="w-full h-auto block" />

      {/* Before image (overlay) */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${sliderPosition}%` }}
      >
        <img src={beforeImage} alt={beforeLabel} className="absolute inset-0 w-full h-full object-cover" />
      </div>

      {/* Slider divider */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-white shadow-2xl"
        style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
      >
        {/* Slider handle */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full shadow-2xl flex items-center justify-center border-4 border-white bg-white">
          <img src="/images/mytradelog-icon.png" alt="MyTradeLog" className="w-7 h-7 invert pointer-events-none" draggable="false" />
        </div>
      </div>

      {/* Labels */}
      <div className="absolute top-4 left-4 text-white text-sm font-medium bg-black/40 px-3 py-1 rounded-full pointer-events-none">
        {beforeLabel}
      </div>
      <div className="absolute top-4 right-4 text-white text-sm font-medium bg-black/40 px-3 py-1 rounded-full pointer-events-none">
        {afterLabel}
      </div>
    </div>
  );
}
