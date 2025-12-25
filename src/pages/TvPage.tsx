import { useEffect, useRef } from 'react';

export function TvPage() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Убираем курсор и скроллбары
    document.body.style.overflow = 'hidden';
    document.body.style.cursor = 'none';
    
    // Автоплей при загрузке
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        // Если автоплей заблокирован, пробуем с muted
        if (videoRef.current) {
          videoRef.current.muted = true;
          videoRef.current.play();
        }
      });
    }

    // Полноэкранный режим при клике
    const handleClick = () => {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        document.documentElement.requestFullscreen();
      }
    };

    document.addEventListener('click', handleClick);

    return () => {
      document.body.style.overflow = '';
      document.body.style.cursor = '';
      document.removeEventListener('click', handleClick);
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center">
      <video
        ref={videoRef}
        src="/intro.mp4"
        autoPlay
        loop
        muted
        playsInline
        className="w-full h-full object-cover"
        style={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%'
        }}
      />
    </div>
  );
}
