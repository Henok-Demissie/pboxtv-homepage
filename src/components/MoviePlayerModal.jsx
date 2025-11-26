import React, { useState, useEffect, useRef } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody } from "@nextui-org/modal";
import { AiOutlineClose } from "react-icons/ai";
import { BiFullscreen, BiExitFullscreen, BiPlay, BiPause, BiVolumeFull, BiVolumeMute } from "react-icons/bi";
import { BiTime, BiCalendar, BiFont, BiStar } from "react-icons/bi";
import axios from "axios";
import TelegramButton from "./TelegramButtons";
import DownloadButton from "./Buttons";
import VLCStreamButton from "./VLCStreamButton";

const MoviePlayerModal = ({ isOpen, onClose, movieData, source }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const controlsTimeoutRef = useRef(null);

  const BASE = import.meta.env.VITE_BASE_URL;
  const API_URL = import.meta.env.VITE_API_URL;
  const API_KEY = import.meta.env.VITE_API_KEY;

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  // Load video URL when modal opens
  useEffect(() => {
    if (isOpen && source) {
      loadVideoUrl();
    } else {
      // Reset when modal closes
      setVideoUrl(null);
      setIsLoading(true);
      setError(null);
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    }
  }, [isOpen, source]);

  const shortenUrl = async (url) => {
    try {
      const response = await axios.get(API_URL, {
        params: {
          api: API_KEY,
          url: url,
          format: "json",
        },
      });
      const data = response.data;
      return data?.shortenedUrl || data?.short || data?.url || url;
    } catch (error) {
      console.error("Error shortening URL:", error);
      return url;
    }
  };

  const generateDownloadUrl = (id, name) => {
    return `${BASE}/dl/${id}/${encodeURIComponent(name)}`;
  };

  const loadVideoUrl = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const downloadUrl = generateDownloadUrl(source.id, source.name);
      const shortUrl = await shortenUrl(downloadUrl);
      setVideoUrl(shortUrl);
      setIsLoading(false);
    } catch (err) {
      console.error('Error loading video:', err);
      setError('Unable to load video. Please try again.');
      setIsLoading(false);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    const element = containerRef.current;

    if (!isFullscreen) {
      if (element.requestFullscreen) {
        element.requestFullscreen().catch(() => setIsFullscreen(true));
      } else if (element.webkitRequestFullscreen) {
        element.webkitRequestFullscreen().catch(() => setIsFullscreen(true));
      } else if (element.mozRequestFullScreen) {
        element.mozRequestFullScreen().catch(() => setIsFullscreen(true));
      } else if (element.msRequestFullscreen) {
        element.msRequestFullscreen().catch(() => setIsFullscreen(true));
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => setIsFullscreen(false));
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
      resetControlsTimeout();
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
      resetControlsTimeout();
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setIsMuted(newVolume === 0);
    }
    resetControlsTimeout();
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      setIsLoading(false);
    }
  };

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    if (videoRef.current) {
      videoRef.current.currentTime = pos * duration;
      setCurrentTime(pos * duration);
    }
    resetControlsTimeout();
  };

  const resetControlsTimeout = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '0:00';
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleClose = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setCurrentTime(0);
    setVideoUrl(null);
    setIsLoading(true);
    setError(null);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      resetControlsTimeout();
    }
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isOpen, isPlaying]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="5xl"
      scrollBehavior="inside"
      hideCloseButton={true}
      placement="center"
      classNames={{
        base: "bg-gray-900/95 backdrop-blur-xl border border-gray-800 m-0 sm:m-4 max-w-[100vw] sm:max-w-[95vw] md:max-w-[90vw] lg:max-w-[85vw] xl:max-w-[80vw] rounded-2xl",
        header: "border-b border-gray-800 px-4 sm:px-6 py-3 sm:py-4",
        body: "p-0",
        wrapper: "p-0 sm:p-4",
        backdrop: "bg-black/80"
      }}
      motionProps={{
        variants: {
          enter: {
            y: 0,
            opacity: 1,
            transition: {
              duration: 0.3,
              ease: "easeOut",
            },
          },
          exit: {
            y: -20,
            opacity: 0,
            transition: {
              duration: 0.2,
              ease: "easeIn",
            },
          },
        }
      }}
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-bold text-white truncate pr-2">
                {movieData?.title || 'Movie Player'}
              </h2>
              <button
                onClick={handleClose}
                className="text-white hover:text-red-500 transition-colors p-1 rounded-full hover:bg-white/10 flex-shrink-0"
              >
                <AiOutlineClose className="text-xl sm:text-2xl" />
              </button>
            </ModalHeader>
            <ModalBody className="!p-0">
              <div className="grid md:grid-cols-2 gap-0">
                {/* Left Side - Video Player */}
                <div 
                  ref={containerRef}
                  className="relative w-full bg-black overflow-hidden"
                  style={{ 
                    paddingBottom: '56.25%',
                    minHeight: '300px',
                  }}
                  onMouseMove={resetControlsTimeout}
                  onTouchStart={resetControlsTimeout}
                >
                  {isLoading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 z-10">
                      <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-3"></div>
                      <span className="text-white">Loading video...</span>
                    </div>
                  )}
                  
                  {error && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 z-10">
                      <div className="text-center text-white p-6">
                        <p className="text-lg mb-4">{error}</p>
                        <button
                          onClick={loadVideoUrl}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
                        >
                          Retry
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {videoUrl && !isLoading && (
                    <>
                      <video
                        ref={videoRef}
                        className="absolute top-0 left-0 w-full h-full object-contain"
                        src={videoUrl}
                        poster={movieData?.backdrop || movieData?.poster}
                        onLoadedMetadata={handleLoadedMetadata}
                        onTimeUpdate={handleTimeUpdate}
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                        onWaiting={() => setIsLoading(true)}
                        onCanPlay={() => setIsLoading(false)}
                        onError={() => setError('Failed to load video')}
                        playsInline
                        autoPlay
                        preload="metadata"
                      />

                      {/* Video Controls Overlay */}
                      <div 
                        className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent transition-opacity duration-300 z-20 ${showControls ? 'opacity-100' : 'opacity-0'}`}
                        onClick={togglePlayPause}
                      >
                        {/* Play/Pause Button - Center */}
                        {!isPlaying && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                togglePlayPause();
                              }}
                              className="bg-black/50 backdrop-blur-sm border border-white/20 hover:bg-black/70 p-4 md:p-6 rounded-full transition-all"
                            >
                              <BiPlay className="text-white text-4xl md:text-6xl ml-1" />
                            </button>
                          </div>
                        )}

                        {/* Bottom Controls */}
                        <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 space-y-2">
                          {/* Progress Bar */}
                          <div 
                            className="w-full h-1.5 bg-white/20 rounded-full cursor-pointer group"
                            onClick={handleSeek}
                            onMouseMove={(e) => {
                              if (e.buttons === 1) handleSeek(e);
                            }}
                          >
                            <div 
                              className="h-full bg-red-600 rounded-full transition-all"
                              style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                            />
                          </div>

                          {/* Control Buttons */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 md:gap-3">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  togglePlayPause();
                                }}
                                className="text-white hover:text-red-400 p-2 rounded-full hover:bg-white/10 transition-all"
                              >
                                {isPlaying ? <BiPause size={20} /> : <BiPlay size={20} />}
                              </button>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleMute();
                                }}
                                className="text-white hover:text-red-400 p-2 rounded-full hover:bg-white/10 transition-all"
                              >
                                {isMuted ? <BiVolumeMute size={18} /> : <BiVolumeFull size={18} />}
                              </button>

                              <span className="text-white text-xs font-medium">
                                {formatTime(currentTime)} / {formatTime(duration)}
                              </span>
                            </div>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFullscreen();
                              }}
                              className="text-white hover:text-red-400 p-2 rounded-full hover:bg-white/10 transition-all"
                            >
                              {isFullscreen ? <BiExitFullscreen size={20} /> : <BiFullscreen size={20} />}
                            </button>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Right Side - Movie Details */}
                <div className="p-4 sm:p-6 space-y-4 overflow-y-auto max-h-[70vh] md:max-h-[calc(56.25vw*0.5)]">
                  {/* Genres */}
                  {movieData?.genres && movieData.genres.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {movieData.genres.map((genre, index) => (
                        <span key={index} className="text-white bg-gray-800 px-3 py-1 rounded-full text-xs font-medium border border-gray-700">
                          {genre}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Title */}
                  <h1 className="text-2xl sm:text-3xl font-bold text-white">
                    {movieData?.title || 'Movie Title'}
                  </h1>

                  {/* Description */}
                  {movieData?.overview && (
                    <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
                      {movieData.overview}
                    </p>
                  )}

                  {/* Metadata */}
                  <div className="flex flex-wrap gap-4 text-gray-400 text-sm">
                    {movieData?.runtime && (
                      <div className="flex items-center gap-1">
                        <BiTime className="text-base" />
                        <span>{movieData.runtime} min</span>
                      </div>
                    )}
                    {movieData?.release_year && (
                      <div className="flex items-center gap-1">
                        <BiCalendar className="text-base" />
                        <span>{movieData.release_year}</span>
                      </div>
                    )}
                    {movieData?.language && (
                      <div className="flex items-center gap-1">
                        <BiFont className="text-base" />
                        <span>{movieData.language}</span>
                      </div>
                    )}
                    {movieData?.rating && (
                      <div className="flex items-center gap-1">
                        <BiStar className="text-base text-yellow-400" />
                        <span>{movieData.rating}</span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-3 pt-2">
                    <TelegramButton movieData={movieData} />
                    <DownloadButton movieData={movieData} />
                    <VLCStreamButton movieData={movieData} />
                  </div>
                </div>
              </div>
            </ModalBody>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default MoviePlayerModal;
