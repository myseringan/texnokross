import { useState, useEffect, useRef } from 'react';

interface VideoIntroProps {
  onComplete: () => void;
  videoSrc?: string;
  maxDuration?: number;
}

export function VideoIntro({ 
  onComplete, 
  videoSrc = '/intro.mp4',
  maxDuration = 15
}: VideoIntroProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isFading, setIsFading] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const hasSeenIntro = sessionStorage.getItem('hasSeenIntro');
    
    if (hasSeenIntro) {
      setIsVisible(false);
      onComplete();
      return;
    }

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

  const handleVideoLoaded = () => {
    setVideoLoaded(true);
  };

  if (!isVisible) return null;

  return (
    <div 
      className={`fixed inset-0 z-[9999] bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center transition-opacity duration-700 ${
        isFading ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Video Background - адаптивное */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        onEnded={handleVideoEnd}
        onLoadedData={handleVideoLoaded}
        className="absolute inset-0 w-full h-full object-contain sm:object-cover"
        style={{ backgroundColor: '#0a1628' }}
      >
        <source src={videoSrc} type="video/mp4" />
      </video>

      {/* Gradient Overlay для мобилки */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20 sm:bg-black/10"></div>

      {/* Loading Spinner - пока видео грузится */}
      {!videoLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
          <div className="text-center">
            <svg className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 text-blue-500 animate-pulse" viewBox="0 0 2834.65 2834.65">
              <path fill="currentColor" d="M1714.6,822.47h-594.54c-164.3,0-297.74,133.13-297.74,297.74v594.54c0,164.3,133.44,297.43,297.74,297.43h594.54c164.3,0,297.74-133.13,297.74-297.43v-594.54c0-164.61-133.44-297.74-297.74-297.74ZM1417.17,1880.3c-255.65,0-462.67-207.32-462.67-462.97s207.01-462.66,462.67-462.66,462.97,207.01,462.97,462.66-207.33,462.97-462.97,462.97Z"/>
              <path fill="currentColor" d="M1419.06,1126.67c-36.5,0-66.09,29.59-66.09,66.09v207.62c0,36.5,29.59,66.09,66.09,66.09s66.09-29.59,66.09-66.09v-207.62c0-36.5-29.59-66.09-66.09-66.09Z"/>
            </svg>
            <p className="text-blue-400 text-lg font-medium animate-pulse">TEXNOKROSS</p>
          </div>
        </div>
      )}

      {/* Skip Button - адаптивный */}
      <button
        onClick={handleSkip}
        className="absolute bottom-4 right-4 sm:bottom-8 sm:right-8 md:bottom-12 md:right-12 z-10 
                   px-4 py-2 sm:px-6 sm:py-3 
                   bg-white/10 hover:bg-white/20 active:bg-white/30
                   backdrop-blur-md rounded-full 
                   text-white text-sm sm:text-base font-medium 
                   transition-all duration-300 
                   border border-white/20 hover:border-white/40 
                   group touch-manipulation"
      >
        <span className="flex items-center gap-1.5 sm:gap-2">
          <span className="hidden xs:inline">O'tkazib yuborish</span>
          <span className="xs:hidden">O'tkazish</span>
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

      {/* Logo Badge - адаптивный */}
      <div className="absolute bottom-4 left-4 sm:bottom-8 sm:left-8 md:bottom-12 md:left-12 text-white/60 text-xs sm:text-sm">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          <span className="font-medium tracking-wider">TEXNOKROSS</span>
        </div>
      </div>

      {/* Tap to skip hint - только на мобилке */}
      <div 
        className="absolute inset-0 sm:hidden" 
        onClick={handleSkip}
      >
        <p className="absolute top-1/2 left-1/2 transform -translate-x-1/2 translate-y-32 text-white/30 text-xs animate-pulse">
          Bosib o'tkazish
        </p>
      </div>
    </div>
  );
}
