import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CarouselImage } from '../types/database';

interface CarouselProps {
  images: CarouselImage[];
}

export function Carousel({ images }: CarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(true);

  useEffect(() => {
    if (!autoPlayEnabled || images.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [autoPlayEnabled, images.length]);

  if (images.length === 0) {
    return null;
  }

  const goToPrevious = () => {
    setAutoPlayEnabled(false);
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const goToNext = () => {
    setAutoPlayEnabled(false);
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const goToSlide = (index: number) => {
    setAutoPlayEnabled(false);
    setCurrentIndex(index);
  };

  const currentImage = images[currentIndex];

  return (
    <div className="relative w-full bg-gray-900 overflow-hidden">
      <div className="aspect-video relative">
        <img
          src={currentImage.image_url}
          alt={currentImage.title}
          className="w-full h-full object-cover"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end">
          <div className="p-8 text-white w-full">
            <h2 className="text-3xl font-bold mb-2">{currentImage.title}</h2>
            <p className="text-lg text-gray-200">{currentImage.description}</p>
          </div>
        </div>

        <button
          onClick={goToPrevious}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2 bg-white/20 hover:bg-white/40 rounded-full transition-all"
        >
          <ChevronLeft className="w-8 h-8 text-white" />
        </button>

        <button
          onClick={goToNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2 bg-white/20 hover:bg-white/40 rounded-full transition-all"
        >
          <ChevronRight className="w-8 h-8 text-white" />
        </button>
      </div>

      <div className="flex justify-center gap-2 p-4 bg-gray-900">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-all ${
              index === currentIndex ? 'bg-white w-8' : 'bg-white/40 hover:bg-white/60'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
