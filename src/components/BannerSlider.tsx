import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import * as api from '../lib/api';

export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  image_url: string;
  link?: string;
  type: 'sale' | 'new' | 'delivery' | 'custom';
  active: boolean;
  created_at: string;
}

// Дефолтные баннеры
const DEFAULT_BANNERS: Banner[] = [
  {
    id: 'banner_1',
    title: 'Chegirmalar 20% gacha!',
    subtitle: 'Barcha maishiy texnikaga maxsus narxlar',
    image_url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&h=400&fit=crop&auto=format',
    type: 'sale',
    active: true,
    created_at: new Date().toISOString(),
  },
];

// Функция загрузки баннеров с API
export async function loadBanners(): Promise<Banner[]> {
  try {
    const banners = await api.getBanners();
    return banners || DEFAULT_BANNERS;
  } catch (e) {
    console.error('Error loading banners:', e);
    return DEFAULT_BANNERS;
  }
}

interface BannerSliderProps {
  isDark: boolean;
}

export function BannerSlider({ isDark }: BannerSliderProps) {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Для свайпа
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  useEffect(() => {
    const fetchBanners = async () => {
      const allBanners = await loadBanners();
      const activeBanners = allBanners.filter(b => b.active);
      setBanners(activeBanners.length > 0 ? activeBanners : DEFAULT_BANNERS);
    };
    fetchBanners();
  }, []);

  // Автопрокрутка
  useEffect(() => {
    if (banners.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % banners.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [banners.length]);

  if (banners.length === 0) return null;

  const currentBanner = banners[currentIndex];

  const goToPrev = () => {
    setCurrentIndex(prev => (prev - 1 + banners.length) % banners.length);
  };

  const goToNext = () => {
    setCurrentIndex(prev => (prev + 1) % banners.length);
  };

  // Touch handlers для свайпа
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50; // минимальное расстояние для свайпа

    if (Math.abs(diff) > minSwipeDistance) {
      if (diff > 0) {
        // Свайп влево - следующий
        goToNext();
      } else {
        // Свайп вправо - предыдущий
        goToPrev();
      }
    }
  };

  // Цвета по типу баннера
  const getGradient = (type: string) => {
    switch (type) {
      case 'sale':
        return isDark 
          ? 'from-red-600/90 via-orange-600/80 to-red-700/90' 
          : 'from-red-500/90 via-orange-500/80 to-red-600/90';
      case 'new':
        return isDark 
          ? 'from-blue-600/90 via-indigo-600/80 to-blue-700/90' 
          : 'from-blue-500/90 via-indigo-500/80 to-blue-600/90';
      case 'delivery':
        return isDark 
          ? 'from-green-600/90 via-emerald-600/80 to-green-700/90' 
          : 'from-green-500/90 via-emerald-500/80 to-green-600/90';
      default:
        return isDark 
          ? 'from-blue-600/90 via-purple-600/80 to-blue-700/90' 
          : 'from-blue-500/90 via-purple-500/80 to-blue-600/90';
    }
  };

  const getBadge = (type: string) => {
    switch (type) {
      case 'sale': return '🔥 Aksiya';
      case 'new': return '✨ Yangi';
      case 'delivery': return '🚚 Yetkazish';
      default: return '📢 E\'lon';
    }
  };

  return (
    <div className="relative w-full mb-4 sm:mb-8 lg:mb-12">
      {/* Main Banner */}
      <div 
        className={`relative overflow-hidden rounded-xl sm:rounded-2xl lg:rounded-3xl shadow-2xl ${
          isDark ? 'shadow-blue-500/20' : 'shadow-blue-300/30'
        }`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Background Image */}
        <div className="absolute inset-0">
          <img 
            src={currentBanner.image_url} 
            alt={currentBanner.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Gradient Overlay */}
        <div className={`absolute inset-0 bg-gradient-to-r ${getGradient(currentBanner.type)}`}></div>

        {/* Content - Responsive height */}
        <div className="relative z-10 px-4 py-5 sm:px-8 sm:py-10 lg:px-12 lg:py-16 min-h-[160px] sm:min-h-[220px] lg:min-h-[280px] flex flex-col justify-center">
          {/* Badge */}
          <div className="inline-flex self-start px-2 py-0.5 sm:px-3 sm:py-1 lg:px-4 lg:py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-white text-[10px] sm:text-xs lg:text-sm font-medium mb-2 sm:mb-3 lg:mb-4">
            {getBadge(currentBanner.type)}
          </div>

          {/* Title */}
          <h2 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-white mb-1 sm:mb-2 lg:mb-3 drop-shadow-lg leading-tight line-clamp-2">
            {currentBanner.title}
          </h2>

          {/* Subtitle */}
          <p className="text-white/90 text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl max-w-xl drop-shadow line-clamp-2 leading-snug">
            {currentBanner.subtitle}
          </p>

          {/* Link Button (if exists) */}
          {currentBanner.link && (
            <a
              href={currentBanner.link}
              className="inline-block self-start mt-3 sm:mt-4 lg:mt-6 px-3 py-1.5 sm:px-6 sm:py-2 lg:px-8 lg:py-3 bg-white text-gray-900 font-semibold rounded-lg sm:rounded-xl hover:bg-gray-100 transition-all shadow-lg text-xs sm:text-sm lg:text-base"
            >
              Batafsil →
            </a>
          )}
        </div>

        {/* Navigation Arrows - Hidden on mobile, use swipe instead */}
        {banners.length > 1 && (
          <>
            <button
              onClick={goToPrev}
              className="hidden sm:flex absolute left-3 lg:left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 lg:w-12 lg:h-12 bg-white/20 hover:bg-white/40 active:bg-white/50 backdrop-blur-sm rounded-full items-center justify-center text-white transition-all cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5 lg:w-6 lg:h-6" />
            </button>
            <button
              onClick={goToNext}
              className="hidden sm:flex absolute right-3 lg:right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 lg:w-12 lg:h-12 bg-white/20 hover:bg-white/40 active:bg-white/50 backdrop-blur-sm rounded-full items-center justify-center text-white transition-all cursor-pointer"
            >
              <ChevronRight className="w-5 h-5 lg:w-6 lg:h-6" />
            </button>
          </>
        )}

        {/* Dots indicator */}
        {banners.length > 1 && (
          <div className="absolute bottom-2 sm:bottom-3 lg:bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 sm:gap-1.5 lg:gap-2">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`h-1.5 sm:h-2 lg:h-3 rounded-full transition-all cursor-pointer ${
                  index === currentIndex 
                    ? 'bg-white w-4 sm:w-6 lg:w-8' 
                    : 'bg-white/50 hover:bg-white/70 w-1.5 sm:w-2 lg:w-3'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
