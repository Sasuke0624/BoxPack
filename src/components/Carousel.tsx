import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CarouselImage } from '../types/database';

interface CarouselProps {
  images: CarouselImage[];
}

export function Carousel({ images }: CarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Fixed image width to maintain consistent size across all devices
  const imageWidth = 400; // pixels
  const imageGap = 16; // pixels for spacing between images

  // Auto-scroll functionality - move one image at a time
  useEffect(() => {
    if (!autoPlayEnabled || images.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        const nextIndex = prev + 1;
        // If we've reached the end, loop back to start
        if (nextIndex >= images.length) {
          return 0;
        }
        return nextIndex;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [autoPlayEnabled, images.length]);

  // Scroll to current index when it changes
  useEffect(() => {
    if (scrollContainerRef.current) {
      const scrollPosition = currentIndex * (imageWidth + imageGap);
      scrollContainerRef.current.scrollTo({
        left: scrollPosition,
        behavior: 'smooth',
      });
    }
  }, [currentIndex, imageWidth, imageGap]);

  if (images.length === 0) {
    return null;
  }

  const goToPrevious = () => {
    setAutoPlayEnabled(false);
    setCurrentIndex((prev) => {
      const newIndex = prev - 1;
      return newIndex < 0 ? images.length - 1 : newIndex;
    });
  };

  const goToNext = () => {
    setAutoPlayEnabled(false);
    setCurrentIndex((prev) => {
      const nextIndex = prev + 1;
      return nextIndex >= images.length ? 0 : nextIndex;
    });
  };

  const goToSlide = (index: number) => {
    setAutoPlayEnabled(false);
    setCurrentIndex(index);
  };

  return (
    <div className="relative w-full bg-gray-50 overflow-hidden" style={{ height: '35vh' }}>
      <div className="relative h-full flex items-center">
        <button
          onClick={goToPrevious}
          className="group absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/90 shadow-lg shadow-black/20 border border-white/70 hover:bg-amber-500 hover:border-amber-500 transition-all focus:outline-none focus:ring-2 focus:ring-amber-400"
        >
          <ChevronLeft className="w-7 h-7 text-gray-700 group-hover:text-white transition-colors" />
        </button>

        <div
          ref={scrollContainerRef}
          className="flex h-full overflow-x-auto scrollbar-hide scroll-smooth px-4"
          style={{ gap: `${imageGap}px` }}
        >
          {images.map((image, index) => (
            <div
              key={index}
              className="flex-shrink-0 relative group rounded-lg overflow-hidden border-2 border-white/20 hover:border-white/40 transition-all"
              style={{
                width: `${imageWidth}px`,
                height: '100%',
              }}
            >
              <img
                src={`.${image.image_url}`}
                alt={image.title}
                className="w-full h-full object-contain"
              />
              {/* <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end">
                <div className="p-4 text-white w-full">
                  <h3 className="text-xl font-bold mb-1">{image.title}</h3>
                  <p className="text-sm text-gray-200 line-clamp-2">{image.description}</p>
                </div>
              </div> */}
            </div>
          ))}
        </div>

        <button
          onClick={goToNext}
          className="group absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/90 shadow-lg shadow-black/20 border border-white/70 hover:bg-amber-500 hover:border-amber-500 transition-all focus:outline-none focus:ring-2 focus:ring-amber-400"
        >
          <ChevronRight className="w-7 h-7 text-gray-700 group-hover:text-white transition-colors" />
        </button>
      </div>

      <div className="flex justify-center gap-2 p-4 bg-amber-600">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`h-3 rounded-full transition-all ${
              index === currentIndex ? 'bg-white w-8' : 'bg-white/40 hover:bg-white/60 w-3'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
