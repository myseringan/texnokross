import { useState, useEffect, useRef } from 'react';

interface VideoIntroProps {
  onComplete: () => void;
  videoSrc?: string;
  maxDuration?: number; // Максимальная длительность в секундах
}

export function VideoIntro({ 
  onComplete, 
  videoSrc = '/intro.mp4',
  maxDuration = 15 // По умолчанию 15 секунд макс
}: VideoIntroProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isFading, setIsFading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Проверяем, показывали ли уже интро в этой сессии
    const hasSeenIntro = sessionStorage.getItem('hasSeenIntro');
    
    if (hasSeenIntro) {
      setIsVisible(false);
      onComplete();
      return;
    }

    // Максимальный таймер - скрыть через maxDuration секунд в любом случае
    timerRef.current = setTimeout(() => {
      handleClose();
    }, maxDuration * 1000);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [maxDuration, onComplete]);

  const handleClose = () => {
    if (isFading) return;
    
    setIsFading(true);
    sessionStorage.setItem('hasSeenIntro', 'true');
    
    // Плавное исчезновение
    setTimeout(() => {
      setIsVisible(false);
      onComplete();
    }, 800);
  };

  const handleVideoEnd = () => {
    handleClose();
  };

  const handleSkip = () => {
    handleClose();
  };

  if (!isVisible) return null;

  return (
    <div 
      className={`fixed inset-0 z-[9999] bg-black flex items-center justify-center transition-opacity duration-700 ${
        isFading ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Video Background */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        onEnded={handleVideoEnd}
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src={videoSrc} type="video/mp4" />
      </video>

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/20"></div>

      {/* Skip Button */}
      <button
        onClick={handleSkip}
        className="absolute bottom-8 right-8 sm:bottom-12 sm:right-12 z-10 px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white font-medium transition-all duration-300 border border-white/20 hover:border-white/40 group"
      >
        <span className="flex items-center gap-2">
          O'tkazib yuborish
          <svg 
            className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </span>
      </button>

      {/* Loading indicator (shows while video loads) */}
      <div className="absolute bottom-8 left-8 sm:bottom-12 sm:left-12 text-white/50 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          <span>TEXNOKROSS</span>
        </div>
      </div>
    </div>
  );
}
