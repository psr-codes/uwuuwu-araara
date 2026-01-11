'use client';

import { useEffect, useRef } from 'react';

export default function VideoPlayer({ stream, muted = false, label, isLocal = false }) {
  const videoRef = useRef();

  useEffect(() => {
    console.log(`[VIDEO ${label}] Stream changed:`, stream?.id, 'tracks:', stream?.getTracks()?.length);
    
    if (videoRef.current && stream) {
      console.log(`[VIDEO ${label}] Setting srcObject`);
      videoRef.current.srcObject = stream;
      
      // Force play for browsers that need it
      videoRef.current.play().catch(err => {
        console.log(`[VIDEO ${label}] Autoplay failed, user interaction needed:`, err);
      });
    }
    
    return () => {
      if (videoRef.current) {
        console.log(`[VIDEO ${label}] Cleaning up srcObject`);
        videoRef.current.srcObject = null;
      }
    };
  }, [stream, label]);

  return (
    <div className="relative w-full h-full bg-gray-900 rounded-lg overflow-hidden border border-gray-700 shadow-lg">
      {stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={muted}
          className={`w-full h-full object-cover ${isLocal ? 'scale-x-[-1]' : ''}`}
        />
      ) : (
        <div className="flex items-center justify-center w-full h-full text-gray-500">
          <div className="text-center">
            <div className="animate-pulse mb-2">⏳</div>
            <p className="text-sm">{label || 'Waiting for video...'}</p>
          </div>
        </div>
      )}
      
      {/* Label Badge */}
      <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-1 rounded text-xs text-white font-medium">
        {label}
      </div>
      
      {/* Stream Debug Info */}
      {stream && (
        <div className="absolute top-2 left-2 bg-black/70 px-2 py-1 rounded text-[10px] text-green-400 font-mono">
          {stream.getTracks().map(t => t.kind[0]).join('+')} | {stream.id.slice(0, 8)}
        </div>
      )}
    </div>
  );
}
