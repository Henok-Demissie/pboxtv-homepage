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
      setIsMobile(window.innerWidth < 640);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement || 
        document.webkitFullscreenElement || 
        document.mozFullScreenElement || 
        document.msFullscreenElement ||
        document.webkitCurrentFullScreenElement
      );
      setIsFullscreen(isCurrentlyFullscreen);
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

  // Hide body scroll and adjust styles when in fullscreen on mobile
  useEffect(() => {
    if (isFullscreen && isMobile) {
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.height = '100%';
    } else {
      // Restore body scroll
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
    }

    return () => {
      // Cleanup: restore body scroll
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
    };
  }, [isFullscreen, isMobile]);

  // Load video URL when modal opens
  useEffect(() => {
    if (isOpen && source) {
      console.log('Loading video for source:', source);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, source]);

  // Automatically enter fullscreen on mobile when modal opens
  useEffect(() => {
    if (isOpen && isMobile && !isFullscreen) {
      // Set fullscreen state immediately for mobile
      setIsFullscreen(true);
      
      // Also try to enter native fullscreen if container is ready
      if (containerRef.current) {
        const timer = setTimeout(() => {
          toggleFullscreen();
        }, 50);
        return () => clearTimeout(timer);
      }
    }
  }, [isOpen, isMobile]);

  // Auto-play video on mobile when video is ready
  useEffect(() => {
    if (isMobile && videoRef.current && videoUrl && !isPlaying) {
      const video = videoRef.current;
      // Try to play when video is ready
      if (video.readyState >= 2) { // HAVE_CURRENT_DATA or higher
        video.play().then(() => {
          setIsPlaying(true);
        }).catch(err => {
          console.error('Auto-play failed:', err);
        });
      } else {
        // Wait for video to be ready
        const playWhenReady = () => {
          video.play().then(() => {
            setIsPlaying(true);
          }).catch(err => {
            console.error('Auto-play failed:', err);
          });
        };
        video.addEventListener('canplay', playWhenReady, { once: true });
        video.addEventListener('loadeddata', playWhenReady, { once: true });
      }
    }
  }, [isMobile, videoUrl, isPlaying]);

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
      if (!source) {
        console.error('No source provided');
        setError('No video source available.');
        setIsLoading(false);
        return;
      }

      if (!source.id || !source.name) {
        console.error('Invalid source:', source);
        setError('Invalid video source.');
        setIsLoading(false);
        return;
      }

      if (!BASE) {
        console.error('BASE URL not configured');
        setError('Server configuration error.');
        setIsLoading(false);
        return;
      }

      const downloadUrl = generateDownloadUrl(source.id, source.name);
      console.log('Generated download URL:', downloadUrl);
      
      // Try to shorten URL, but if it fails, use the original URL
      let finalUrl = downloadUrl;
      try {
        if (API_URL && API_KEY) {
          finalUrl = await shortenUrl(downloadUrl);
          console.log('Shortened URL:', finalUrl);
        } else {
          console.log('URL shortening not configured, using direct URL');
        }
      } catch (shortenErr) {
        console.warn('URL shortening failed, using direct URL:', shortenErr);
        finalUrl = downloadUrl;
      }
      
      setVideoUrl(finalUrl);
      console.log('Video URL set:', finalUrl);
      setIsLoading(false);
      
      // Verify the video element gets the URL
      setTimeout(() => {
        if (videoRef.current) {
          console.log('Video element src:', videoRef.current.src);
          console.log('Video element readyState:', videoRef.current.readyState);
        }
      }, 100);
    } catch (err) {
      console.error('Error loading video:', err);
      setError('Unable to load video. Please try again.');
      setIsLoading(false);
    }
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const video = videoRef.current;

    if (!isFullscreen) {
      // Enter fullscreen
      try {
        // Try to fullscreen the video first (works better for video elements)
        if (video) {
          if (video.requestFullscreen) {
            await video.requestFullscreen();
            return;
          } else if (video.webkitRequestFullscreen) {
            await video.webkitRequestFullscreen();
            return;
          } else if (video.mozRequestFullScreen) {
            await video.mozRequestFullScreen();
            return;
          } else if (video.msRequestFullscreen) {
            await video.msRequestFullscreen();
            return;
          }
        }

        // Fallback: Try to fullscreen the container
        if (container.requestFullscreen) {
          await container.requestFullscreen();
        } else if (container.webkitRequestFullscreen) {
          await container.webkitRequestFullscreen();
        } else if (container.mozRequestFullScreen) {
          await container.mozRequestFullScreen();
        } else if (container.msRequestFullscreen) {
          await container.msRequestFullscreen();
        } else {
          // CSS fallback for browsers that don't support fullscreen API
          container.style.position = 'fixed';
          container.style.top = '0';
          container.style.left = '0';
          container.style.right = '0';
          container.style.bottom = '0';
          container.style.width = '100vw';
          container.style.height = '100vh';
          container.style.zIndex = '9999';
          container.style.paddingBottom = '0';
          container.style.minHeight = '100vh';
          container.style.maxHeight = '100vh';
          container.style.borderRadius = '0';
          container.style.margin = '0';
          setIsFullscreen(true);
        }
      } catch (err) {
        console.error('Fullscreen error:', err);
        // CSS fallback
        if (container) {
          container.style.position = 'fixed';
          container.style.top = '0';
          container.style.left = '0';
          container.style.right = '0';
          container.style.bottom = '0';
          container.style.width = '100vw';
          container.style.height = '100vh';
          container.style.zIndex = '9999';
          container.style.paddingBottom = '0';
          container.style.minHeight = '100vh';
          container.style.maxHeight = '100vh';
          container.style.borderRadius = '0';
          container.style.margin = '0';
          setIsFullscreen(true);
        }
      }
    } else {
      // Exit fullscreen
      try {
      if (document.exitFullscreen) {
          await document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
          await document.webkitExitFullscreen();
      } else if (document.mozCancelFullScreen) {
          await document.mozCancelFullScreen();
      } else if (document.msExitFullscreen) {
          await document.msExitFullscreen();
        } else {
          // CSS fallback: Reset styles
          if (container) {
            container.style.position = '';
            container.style.top = '';
            container.style.left = '';
            container.style.right = '';
            container.style.bottom = '';
            container.style.width = '';
            container.style.height = '';
            container.style.zIndex = '';
            container.style.paddingBottom = '';
            container.style.minHeight = '';
            container.style.maxHeight = '';
            container.style.borderRadius = '';
            container.style.margin = '';
            setIsFullscreen(false);
          }
        }
      } catch (err) {
        console.error('Exit fullscreen error:', err);
        // CSS fallback: Reset styles
        if (container) {
          container.style.position = '';
          container.style.top = '';
          container.style.left = '';
          container.style.right = '';
          container.style.bottom = '';
          container.style.width = '';
          container.style.height = '';
          container.style.zIndex = '';
          container.style.paddingBottom = '';
          container.style.minHeight = '';
          container.style.maxHeight = '';
          container.style.borderRadius = '';
          container.style.margin = '';
          setIsFullscreen(false);
        }
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
      
      // Auto-play on mobile
      if (isMobile) {
        videoRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch(err => {
          console.error('Auto-play failed:', err);
        });
      }
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

  const handleClose = async () => {
    // Exit fullscreen if active
    if (isFullscreen) {
      try {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          await document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
          await document.mozCancelFullScreen();
        } else if (document.msExitFullscreen) {
          await document.msExitFullscreen();
        }
        // Reset CSS fallback styles
        if (containerRef.current) {
          containerRef.current.style.position = '';
          containerRef.current.style.top = '';
          containerRef.current.style.left = '';
          containerRef.current.style.right = '';
          containerRef.current.style.bottom = '';
          containerRef.current.style.width = '';
          containerRef.current.style.height = '';
          containerRef.current.style.zIndex = '';
          containerRef.current.style.paddingBottom = '';
          containerRef.current.style.minHeight = '';
          containerRef.current.style.maxHeight = '';
          containerRef.current.style.borderRadius = '';
          containerRef.current.style.margin = '';
        }
        setIsFullscreen(false);
      } catch (err) {
        console.error('Error exiting fullscreen:', err);
        // Reset CSS fallback styles anyway
        if (containerRef.current) {
          containerRef.current.style.position = '';
          containerRef.current.style.top = '';
          containerRef.current.style.left = '';
          containerRef.current.style.right = '';
          containerRef.current.style.bottom = '';
          containerRef.current.style.width = '';
          containerRef.current.style.height = '';
          containerRef.current.style.zIndex = '';
          containerRef.current.style.paddingBottom = '';
          containerRef.current.style.minHeight = '';
          containerRef.current.style.maxHeight = '';
          containerRef.current.style.borderRadius = '';
          containerRef.current.style.margin = '';
        }
        setIsFullscreen(false);
      }
    }
    
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setCurrentTime(0);
    setVideoUrl(null);
    setIsLoading(true);
    setError(null);
    setIsFullscreen(false);
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
        base: `bg-gray-900/95 backdrop-blur-xl border border-gray-800 m-0 sm:m-4 max-w-[100vw] sm:max-w-[95vw] md:max-w-[90vw] lg:max-w-[85vw] xl:max-w-[80vw] ${isMobile ? '!fixed !inset-0 !m-0 !max-w-none !w-screen !h-screen !rounded-none !border-0 !bg-transparent !backdrop-blur-none' : 'rounded-2xl'}`,
        header: `border-b border-gray-800 px-3 sm:px-6 py-2 sm:py-4 ${isMobile ? '!hidden' : ''}`,
        body: `p-0 sm:p-4 pb-2 sm:pb-4 ${isMobile ? '!p-0' : ''}`,
        wrapper: `p-0 sm:p-4 ${isMobile ? '!p-0' : ''}`,
        backdrop: `${isMobile ? '!bg-transparent !hidden' : 'bg-black/80'}`
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
            <ModalHeader className={`flex items-center justify-between ${isMobile ? 'hidden' : ''}`}>
              <h2 className="text-base sm:text-xl font-bold text-white truncate pr-2">
                {movieData?.title || 'Movie Player'}
              </h2>
              <div className="flex items-center gap-2">
                {/* Fullscreen/Exit Fullscreen Button - Show when video is loaded */}
                {videoUrl && !isLoading && !isMobile && (
                  <button
                    onClick={toggleFullscreen}
                    className="text-white hover:text-red-500 active:text-red-400 transition-colors p-2 sm:p-1.5 rounded-full hover:bg-white/10 active:bg-white/20 flex-shrink-0 z-50 touch-manipulation"
                    title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                  >
                    {isFullscreen ? (
                      <BiExitFullscreen className="text-xl sm:text-2xl" />
                    ) : (
                      <BiFullscreen className="text-xl sm:text-2xl" />
                    )}
                  </button>
                )}
              <button
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    handleClose();
                  }}
                  onTouchStart={(e) => {
                    e.stopPropagation();
                    handleClose();
                  }}
                  className="text-white hover:text-red-500 active:text-red-400 transition-colors p-1 sm:p-2 rounded-full hover:bg-white/10 active:bg-white/20 flex-shrink-0 touch-manipulation z-50"
                  title="Close"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                <AiOutlineClose className="text-xl sm:text-2xl" />
              </button>
              </div>
            </ModalHeader>
            <ModalBody className={`!p-0 ${isFullscreen && isMobile ? '!p-0' : ''}`}>
              {/* Exit Fullscreen Button - Only visible on mobile */}
              {isMobile && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      handleClose();
                    }}
                    onTouchStart={(e) => {
                      e.stopPropagation();
                      handleClose();
                    }}
                    className="absolute top-4 left-4 z-[10000] text-white hover:text-red-500 active:text-red-400 transition-colors p-3 rounded-full bg-black/70 backdrop-blur-md border border-white/30 hover:bg-black/80 flex-shrink-0 touch-manipulation"
                    title="Close"
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                  >
                    <AiOutlineClose className="text-2xl" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      toggleFullscreen();
                    }}
                    onTouchStart={(e) => {
                      e.stopPropagation();
                      toggleFullscreen();
                    }}
                    className="absolute top-4 right-4 z-[10000] text-white hover:text-red-500 active:text-red-400 transition-colors p-3 rounded-full bg-black/70 backdrop-blur-md border border-white/30 hover:bg-black/80 flex-shrink-0 touch-manipulation"
                    title="Exit Fullscreen"
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                  >
                    <BiExitFullscreen className="text-2xl" />
                  </button>
                </>
              )}
              <div className={`grid ${isMobile ? 'grid-cols-1' : 'md:grid-cols-2'} gap-0`}>
                {/* Left Side - Video Player */}
                <div 
                  ref={containerRef}
                  className={`relative w-full bg-black ${isMobile ? 'fixed inset-0 w-screen h-screen z-[9999] rounded-none' : 'overflow-hidden'}`}
                  style={isMobile ? {
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    width: '100vw',
                    height: '100vh',
                    zIndex: 9999,
                    paddingBottom: 0,
                    minHeight: '100vh',
                    maxHeight: '100vh',
                    borderRadius: 0,
                    margin: 0
                  } : {
                    paddingBottom: '56.25%',
                    minHeight: '300px',
                    height: '0'
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
                        className={`absolute top-0 left-0 ${isMobile ? 'w-screen h-screen' : 'w-full h-full'} object-contain`}
                        src={videoUrl}
                        poster={movieData?.backdrop || movieData?.poster}
                        onLoadedMetadata={handleLoadedMetadata}
                        onTimeUpdate={handleTimeUpdate}
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                        onWaiting={() => setIsLoading(true)}
                        onCanPlay={() => {
                          setIsLoading(false);
                          // Auto-play on mobile
                          if (isMobile && videoRef.current && videoRef.current.paused) {
                            videoRef.current.play().then(() => {
                              setIsPlaying(true);
                            }).catch(err => {
                              console.error('Auto-play failed:', err);
                            });
                          }
                        }}
                        onError={(e) => {
                          console.error('Video error:', e);
                          const video = e.target;
                          if (video.error) {
                            console.error('Video error code:', video.error.code, 'Message:', video.error.message);
                            switch (video.error.code) {
                              case 1: // MEDIA_ERR_ABORTED
                                setError('Video loading was aborted.');
                                break;
                              case 2: // MEDIA_ERR_NETWORK
                                setError('Network error. Please check your connection.');
                                break;
                              case 3: // MEDIA_ERR_DECODE
                                setError('Video decoding error.');
                                break;
                              case 4: // MEDIA_ERR_SRC_NOT_SUPPORTED
                                setError('Video format not supported.');
                                break;
                              default:
                                setError('Failed to load video. Please try again.');
                            }
                          } else {
                            setError('Failed to load video. Please try again.');
                          }
                        }}
                        playsInline
                        autoPlay
                        preload="metadata"
                        style={isMobile ? {
                          width: '100vw',
                          height: '100vh',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          border: 'none',
                          borderRadius: 0
                        } : {}}
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
                <div className={`p-4 sm:p-6 space-y-4 overflow-y-auto max-h-[70vh] md:max-h-[calc(56.25vw*0.5)] ${isMobile ? 'hidden' : ''}`}>
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
