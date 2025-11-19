import { AiOutlineClose } from "react-icons/ai";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useRef, useCallback } from "react";
import { 
  BiPlay, BiPause, BiVolumeFull, BiVolumeMute, BiFullscreen, BiExitFullscreen,
  BiCog, BiRewind, BiFastForward, BiListUl
} from "react-icons/bi";
import { MdHd, MdSubtitles, MdRotate90DegreesCcw } from "react-icons/md";
import { IoIosCheckmark } from "react-icons/io";
import { FaCloudDownloadAlt } from "react-icons/fa";
import Swal from 'sweetalert2';
import axios from "axios";

export default function Watch(props) {
  const [state, setState] = useState({
    sources: [],
    poster: "",
    isPlayerVisible: false,
    isPlaying: false,
    volume: 1,
    isMuted: false,
    currentTime: 0,
    duration: 0,
    isFullscreen: false,
    showControls: true,
    currentQuality: 'auto',
    availableQualities: [],
    showSettings: false,
    isBuffering: false,
    playbackSpeed: 1,
    isRotated: false,
    videoError: false,
    skipAnimation: { type: '', show: false },
    isDragging: false,
    previewTime: 0,
    showPreview: false,
    isMobile: false
  });

  const refs = {
    video: useRef(null),
    container: useRef(null),
    controlsTimeout: useRef(null),
    progress: useRef(null)
  };

  const BASE = import.meta.env.VITE_BASE_URL;
  const API_URL = import.meta.env.VITE_API_URL;
  const API_KEY = import.meta.env.VITE_API_KEY;
  const speedOptions = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

  const updateState = useCallback((updates) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const isMobile = () => /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                     window.innerWidth <= 768 || ('ontouchstart' in window);

  const isLandscape = () => window.screen && window.screen.orientation ? 
    Math.abs(window.screen.orientation.angle) === 90 : window.innerWidth > window.innerHeight;

  const fullscreenAPI = {
    request: async (element) => {
      try {
        if (element.requestFullscreen) {
          await element.requestFullscreen();
        } else if (element.webkitRequestFullscreen) {
          await element.webkitRequestFullscreen();
        } else if (element.mozRequestFullScreen) {
          await element.mozRequestFullScreen();
        } else if (element.msRequestFullscreen) {
          await element.msRequestFullscreen();
        }
        return true;
      } catch (error) {
        console.error('Fullscreen error:', error);
        return false;
      }
    },
    exit: async () => {
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
        return true;
      } catch (error) {
        console.error('Exit fullscreen error:', error);
        return false;
      }
    },
    element: () => document.fullscreenElement || document.webkitFullscreenElement || 
                   document.mozFullScreenElement || document.msFullscreenElement
  };

  const resetControlsTimeout = useCallback(() => {
    updateState({ showControls: true });
    if (refs.controlsTimeout.current) clearTimeout(refs.controlsTimeout.current);
    if (state.isPlaying && !state.isDragging && !state.showSettings) {
      refs.controlsTimeout.current = setTimeout(() => updateState({ showControls: false }), 3000);
    }
  }, [state.isPlaying, state.isDragging, state.showSettings, updateState]);

  const showSkipAnimation = useCallback((type) => {
    updateState({ skipAnimation: { type, show: true } });
    setTimeout(() => updateState({ skipAnimation: { type: '', show: false } }), 800);
  }, [updateState]);

  const togglePlayPause = useCallback(async (e) => {
    e?.stopPropagation();
    if (state.videoError || !refs.video.current) return;
    
    try {
      if (refs.video.current.paused) {
        await refs.video.current.play();
        updateState({ isPlaying: true });
      } else {
        refs.video.current.pause();
        updateState({ isPlaying: false });
      }
    } catch (error) {
      console.error("Playback error:", error);
      updateState({ videoError: true });
    }
  }, [state.videoError, updateState]);

  const handleVolumeChange = useCallback((newVolume) => {
    if (refs.video.current) {
      refs.video.current.volume = newVolume;
      updateState({ volume: newVolume, isMuted: newVolume === 0 });
    }
  }, [updateState]);

  const toggleMute = useCallback(() => {
    if (!refs.video.current) return;
    
    if (state.isMuted) {
      const newVolume = state.volume || 0.5;
      refs.video.current.volume = newVolume;
      updateState({ volume: newVolume, isMuted: false });
    } else {
      refs.video.current.volume = 0;
      updateState({ isMuted: true });
    }
  }, [state.isMuted, state.volume, updateState]);

  const handleSeek = useCallback((time) => {
    if (refs.video.current && !state.videoError && !isNaN(time)) {
      const clampedTime = Math.max(0, Math.min(state.duration, time));
      refs.video.current.currentTime = clampedTime;
      updateState({ currentTime: clampedTime });
    }
  }, [state.videoError, state.duration, updateState]);

  const getTimeFromPosition = useCallback((clientX) => {
    if (!refs.progress.current || !state.duration) return 0;
    const rect = refs.progress.current.getBoundingClientRect();
    const percentage = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return state.duration * percentage;
  }, [state.duration]);

  const handleProgressClick = useCallback((e) => {
    const newTime = getTimeFromPosition(e.clientX);
    handleSeek(newTime);
  }, [getTimeFromPosition, handleSeek]);

  const startDragging = useCallback((e) => {
    updateState({ isDragging: true, showControls: true });
    handleProgressClick(e);
    
    const handleMouseMove = (e) => {
      const newTime = getTimeFromPosition(e.clientX);
      handleSeek(newTime);
    };

    const handleMouseUp = () => {
      updateState({ isDragging: false });
      resetControlsTimeout();
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [getTimeFromPosition, handleSeek, handleProgressClick, resetControlsTimeout, updateState]);

  const skip = useCallback((seconds) => {
    if (refs.video.current && !state.videoError && state.duration > 0) {
      const newTime = Math.max(0, Math.min(state.duration, state.currentTime + seconds));
      handleSeek(newTime);
      showSkipAnimation(seconds > 0 ? 'forward' : 'backward');
    }
  }, [state.videoError, state.duration, state.currentTime, handleSeek, showSkipAnimation]);

  const toggleFullscreen = useCallback(async () => {
    if (!fullscreenAPI.element()) {
      const success = await fullscreenAPI.request(refs.container.current);
      if (success) {
        updateState({ isFullscreen: true });
      }
    } else {
      const success = await fullscreenAPI.exit();
      if (success) {
        updateState({ isFullscreen: false });
      }
    }
  }, [updateState]);

  const toggleRotation = useCallback(() => {
    updateState({ isRotated: !state.isRotated });
  }, [state.isRotated, updateState]);

  const changeQuality = useCallback((quality) => {
    if (refs.video.current && quality !== 'auto' && !state.videoError) {
      const source = state.sources.find(s => s.quality === quality);
      if (source) {
        const currentTimeStamp = refs.video.current.currentTime;
        const wasPlaying = !refs.video.current.paused;
        
        refs.video.current.src = source.src;
        refs.video.current.addEventListener('loadedmetadata', () => {
          if (refs.video.current) {
            refs.video.current.currentTime = currentTimeStamp;
            if (wasPlaying) refs.video.current.play().catch(console.error);
          }
        }, { once: true });
      }
    }
    updateState({ currentQuality: quality, showSettings: false });
  }, [state.sources, state.videoError, updateState]);

  const changePlaybackSpeed = useCallback((speed) => {
    if (refs.video.current) {
      refs.video.current.playbackRate = speed;
      updateState({ playbackSpeed: speed });
    }
  }, [updateState]);

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

  const generateUrl = (id, name) => {
    return `${BASE}/dl/${id}/${encodeURIComponent(name)}`;
  };

  const triggerDownload = (url, filename) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || '';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownload = async (quality) => {
    const source = state.sources.find(s => s.quality === quality);
    if (source && source.telegramData) {
      try {
        const rawUrl = generateUrl(source.telegramData.id, source.telegramData.name);
        const shortUrl = await shortenUrl(rawUrl);
        triggerDownload(shortUrl, source.telegramData.name);
      } catch (error) {
        console.error("Download error:", error);
      }
    }
  };

  const openWithExternalPlayer = useCallback(() => {
    const currentSource = state.sources.find(s => s.quality === state.currentQuality) || state.sources[0];
    if (currentSource) {
      const vlcUrl = `vlc://${currentSource.src}`;
      window.location.href = vlcUrl;
      
      setTimeout(() => {
        if (confirm('VLC not installed? Download the file to play with your preferred media player.')) {
          const link = document.createElement('a');
          link.href = currentSource.src;
          link.download = '';
          link.click();
        }
      }, 2000);
    }
  }, [state.sources, state.currentQuality]);

  const closePlayer = useCallback(() => {
    if (fullscreenAPI.element()) fullscreenAPI.exit();
    if (refs.video.current) {
      refs.video.current.pause();
      refs.video.current.currentTime = 0;
    }
    
    updateState({
      isPlayerVisible: false,
      isPlaying: false,
      currentTime: 0,
      isRotated: false,
      videoError: false,
      showControls: true,
      showSettings: false,
      sources: [],
      availableQualities: []
    });
    
    if (props.popUpType === "movie") {
      props.setIsWatchMoviePopupOpen?.(false);
    } else {
      props.setIsWatchEpisodePopupOpen?.(false);
    }
  }, [props, updateState]);

  const showPlaybackOptions = useCallback(() => {
    const currentSource = state.sources.find(s => s.quality === state.currentQuality) || state.sources[0];
    
    Swal.fire({
      title: 'Choose Playback Option',
      text: 'For the best viewing experience, we recommend using an external player or downloading the file.',
      icon: 'question',
      showCancelButton: true,
      showDenyButton: true,
      confirmButtonText: '<i class="fas fa-external-link-alt"></i> Open with VLC',
      denyButtonText: '<i class="fas fa-download"></i> Download File',
      cancelButtonText: '<i class="fas fa-times"></i> Close Player',
      confirmButtonColor: '#e11d48',
      denyButtonColor: '#059669',
      cancelButtonColor: '#6b7280',
      background: '#1f2937',
      color: '#ffffff',
      backdrop: 'rgba(0,0,0,0.9)',
      customClass: {
        popup: 'border border-gray-600/30 rounded-lg',
        title: 'text-white text-lg font-bold',
        content: 'text-gray-300 text-sm',
        confirmButton: 'bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-lg text-sm font-medium mr-2',
        denyButton: 'bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium mr-2',
        cancelButton: 'bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm'
      },
      allowOutsideClick: false,
      allowEscapeKey: false
    }).then((result) => {
      if (result.isConfirmed) {
        openWithExternalPlayer();
        closePlayer();
      } else if (result.isDenied) {
        if (currentSource?.telegramData) {
          handleDownload(state.currentQuality);
        }
        closePlayer();
      } else if (result.isDismissed) {
        closePlayer();
      }
    });
  }, [state.sources, state.currentQuality, openWithExternalPlayer, closePlayer, handleDownload]);

  const formatTime = useCallback((time) => {
    if (!time || isNaN(time)) return "0:00";
    
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  useEffect(() => {
    const mobile = isMobile();
    updateState({ isMobile: mobile });

    const handleOrientationChange = () => {
      setTimeout(() => {
        updateState({ isMobile: isMobile() });
        if (mobile && isLandscape() && !fullscreenAPI.element()) {
          fullscreenAPI.request(refs.container.current);
        }
      }, 100);
    };

    const handleFullscreenChange = () => {
      updateState({ isFullscreen: !!fullscreenAPI.element() });
    };

    const handleKeyPress = (e) => {
      if (!state.isPlayerVisible) return;
      
      const actions = {
        'Space': () => { e.preventDefault(); togglePlayPause(); },
        'ArrowLeft': () => { e.preventDefault(); skip(-10); },
        'ArrowRight': () => { e.preventDefault(); skip(10); },
        'KeyF': () => { e.preventDefault(); toggleFullscreen(); },
        'KeyM': () => { e.preventDefault(); toggleMute(); }
      };
      
      actions[e.code]?.();
    };

    const events = [
      ['orientationchange', handleOrientationChange],
      ['fullscreenchange', handleFullscreenChange],
      ['webkitfullscreenchange', handleFullscreenChange],
      ['mozfullscreenchange', handleFullscreenChange],
      ['msfullscreenchange', handleFullscreenChange],
      ['keydown', handleKeyPress],
      ['mousemove', resetControlsTimeout],
      ['touchstart', resetControlsTimeout]
    ];

    events.forEach(([event, handler]) => {
      if (event.includes('orientation') && screen.orientation) {
        screen.orientation.addEventListener('change', handler);
      } else {
        (event.includes('fullscreen') ? document : window).addEventListener(event, handler);
      }
    });

    return () => {
      events.forEach(([event, handler]) => {
        if (event.includes('orientation') && screen.orientation) {
          screen.orientation.removeEventListener('change', handler);
        } else {
          (event.includes('fullscreen') ? document : window).removeEventListener(event, handler);
        }
      });
    };
  }, [state.isPlayerVisible, togglePlayPause, skip, toggleFullscreen, toggleMute, resetControlsTimeout, updateState]);

  useEffect(() => {
    const initializePlayer = async () => {
      if (props.isWatchMoviePopupOpen || props.isWatchEpisodePopupOpen) {
        try {
          let videoSources = [];
          let selectedPoster = "";

          if (props.popUpType === "movie") {
            videoSources = props.id.telegram?.map((q) => ({
              src: `${BASE}/dl/${q.id}/${q.name}`,
              quality: q.quality,
              size: parseInt(q.quality.replace("p", ""), 10),
              telegramData: q
            })) || [];
            selectedPoster = props.id.backdrop || "";
          } else if (props.popUpType === "episode") {
            let episode = null;
            
            if (props.episodes && props.episodes.length > 0) {
              episode = props.episodes.find(ep => ep.episode_number === props.episodeNumber);
            }
            
            if (!episode) {
              const season = props.id.seasons?.find(s => s.season_number === props.seasonNumber);
              episode = season?.episodes?.find(ep => ep.episode_number === props.episodeNumber);
            }

            if (episode) {
              videoSources = episode.telegram?.map((q) => ({
                src: `${BASE}/dl/${q.id}/${encodeURIComponent(q.name)}`,
                quality: q.quality,
                size: parseInt(q.quality.replace("p", ""), 10),
                telegramData: q
              })) || [];
              selectedPoster = episode.episode_backdrop || props.id.backdrop || "";
            }
          }

          if (videoSources.length === 0) {
            updateState({ videoError: true, isPlayerVisible: true });
            showPlaybackOptions();
            return;
          }

          videoSources.sort((a, b) => b.size - a.size);
          
          updateState({
            sources: videoSources,
            availableQualities: ['auto', ...videoSources.map(s => s.quality)],
            poster: selectedPoster,
            isPlayerVisible: true,
            videoError: false,
            currentQuality: videoSources[0]?.quality || 'auto'
          });
        } catch (error) {
          console.error("Error initializing player:", error);
          updateState({ videoError: true, isPlayerVisible: true });
          showPlaybackOptions();
        }
      }
    };
  
    initializePlayer();
  }, [
    props.isWatchMoviePopupOpen,
    props.isWatchEpisodePopupOpen,
    props.popUpType,
    props.id,
    props.seasonNumber,
    props.episodeNumber,
    props.episodes,
    BASE,
    updateState,
    showPlaybackOptions
  ]);

  const videoEvents = {
    onTimeUpdate: (e) => updateState({ currentTime: e.target.currentTime }),
    onDurationChange: (e) => updateState({ duration: e.target.duration }),
    onLoadedMetadata: (e) => updateState({ duration: e.target.duration }),
    onPlay: () => updateState({ isPlaying: true }),
    onPause: () => updateState({ isPlaying: false }),
    onWaiting: () => updateState({ isBuffering: true }),
    onCanPlay: () => updateState({ isBuffering: false }),
    onError: () => {
      updateState({ videoError: true, isBuffering: false });
      showPlaybackOptions();
    },
    onLoadedData: () => updateState({ isBuffering: false })
  };

  const progressPercentage = state.duration > 0 ? (state.currentTime / state.duration) * 100 : 0;
  const previewPercentage = state.duration > 0 ? (state.previewTime / state.duration) * 100 : 0;

  if (state.videoError) {
    return null;
  }

  return (
    <AnimatePresence>
      {state.isPlayerVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          ref={refs.container}
          className="fixed inset-0 z-[9999] bg-black flex items-center justify-center"
          onTouchStart={resetControlsTimeout}
          onMouseMove={resetControlsTimeout}
        >
          <div className="relative w-full h-full flex flex-col justify-between">
            <div className="flex-1 flex items-center justify-center min-h-0">
              <video
                ref={refs.video}
                className={`w-full h-full object-contain bg-black transition-transform duration-300 ${
                  state.isRotated ? 'rotate-90' : ''
                }`}
                poster={state.poster}
                preload="metadata"
                playsInline
                {...videoEvents}
                onClick={togglePlayPause}
                src={state.sources.find(s => s.quality === state.currentQuality)?.src || state.sources[0]?.src}
              />
            </div>

            <AnimatePresence>
              {state.skipAnimation.show && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
                >
                  <div className="bg-black/80 backdrop-blur-sm rounded-full p-4 md:p-6 border border-white/20">
                    <div className="flex items-center text-white text-lg md:text-xl font-bold">
                      {state.skipAnimation.type === 'forward' ? (
                        <><BiFastForward className="mr-2 text-2xl md:text-3xl" />+10s</>
                      ) : (
                        <><BiRewind className="mr-2 text-2xl md:text-3xl" />-10s</>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {state.isBuffering && (
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <div className="w-12 h-12 md:w-16 md:h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}

            {!state.isPlaying && !state.isBuffering && (
              <motion.button
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                onClick={togglePlayPause}
                className="absolute inset-0 flex items-center justify-center z-10"
              >
                <div className="bg-black/50 backdrop-blur-sm border border-white/20 hover:bg-black/70 p-4 md:p-6 rounded-full transition-all">
                  <BiPlay className="text-white text-4xl md:text-6xl ml-1" />
                </div>
              </motion.button>
            )}

            <AnimatePresence>
              {state.showControls && (
                <motion.div
                  initial={{ opacity: 0, y: 100 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 100 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/60 pointer-events-none"
                >
                  <div className="absolute top-0 left-0 right-0 p-3 md:p-4 pointer-events-auto">
                    <div className="flex justify-between items-center">
                      <h2 className="text-white text-sm md:text-lg font-semibold truncate flex-1 mr-4">
                        {props.popUpType === "movie" ? props.id.title : 
                         `${props.id.title} - S${props.seasonNumber}E${props.episodeNumber}`}
                      </h2>
                      
                      <div className="flex items-center space-x-2">
                        {state.isMobile && (
                          <button
                            onClick={toggleRotation}
                            className="text-white hover:text-red-400 p-2 rounded-full hover:bg-white/10 transition-all touch-manipulation"
                            onTouchStart={(e) => e.stopPropagation()}
                          >
                            <MdRotate90DegreesCcw size={18} />
                          </button>
                        )}
                        
                        <button
                          onClick={closePlayer}
                          className="text-white hover:text-red-400 p-2 rounded-full hover:bg-white/10 transition-all touch-manipulation"
                          onTouchStart={(e) => e.stopPropagation()}
                        >
                          <AiOutlineClose size={20} />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 space-y-3 pointer-events-auto">
                    <div className="relative group">
                      <div 
                        ref={refs.progress}
                        className="w-full h-1 md:h-2 bg-white/20 rounded-full cursor-pointer relative"
                        onClick={handleProgressClick}
                        onMouseDown={startDragging}
                        onMouseMove={(e) => {
                          if (!state.isDragging && !state.isMobile) {
                            const previewTime = getTimeFromPosition(e.clientX);
                            updateState({ previewTime, showPreview: true });
                          }
                        }}
                        onMouseLeave={() => updateState({ showPreview: false })}
                      >
                        <div 
                          className="h-full bg-red-600 rounded-full relative transition-all duration-100"
                          style={{ width: `${progressPercentage}%` }}
                        >
                          <div className="absolute right-0 top-1/2 w-3 h-3 md:w-4 md:h-4 bg-red-600 rounded-full transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"></div>
                        </div>
                        
                        {state.showPreview && !state.isMobile && (
                          <div 
                            className="absolute top-0 w-1 h-full bg-white/60 rounded-full"
                            style={{ left: `${previewPercentage}%` }}
                          />
                        )}
                      </div>
                      
                      {state.showPreview && !state.isMobile && (
                        <div 
                          className="absolute bottom-full mb-2 bg-black/90 text-white text-xs px-2 py-1 rounded whitespace-nowrap transform -translate-x-1/2"
                          style={{ left: `${previewPercentage}%` }}
                        >
                          {formatTime(state.previewTime)}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 md:space-x-3">
                        <button
                          onClick={togglePlayPause}
                          className="text-white hover:text-red-400 p-2 rounded-full hover:bg-white/10 transition-all"
                        >
                          {state.isPlaying ? <BiPause size={state.isMobile ? 20 : 24} /> : <BiPlay size={state.isMobile ? 20 : 24} />}
                        </button>

                        <button
                          onClick={() => skip(-10)}
                          className="text-white hover:text-red-400 p-2 rounded-full hover:bg-white/10 transition-all"
                        >
                          <BiRewind size={state.isMobile ? 16 : 20} />
                        </button>

                        <button
                          onClick={() => skip(10)}
                          className="text-white hover:text-red-400 p-2 rounded-full hover:bg-white/10 transition-all"
                        >
                          <BiFastForward size={state.isMobile ? 16 : 20} />
                        </button>

                        {!state.isMobile && (
                          <>
                            <button
                              onClick={toggleMute}
                              className="text-white hover:text-red-400 p-2 rounded-full hover:bg-white/10 transition-all"
                            >
                              {state.isMuted || state.volume === 0 ? <BiVolumeMute size={20} /> : <BiVolumeFull size={20} />}
                            </button>
                            
                            <input
                              type="range"
                              min="0"
                              max="1"
                              step="0.1"
                              value={state.isMuted ? 0 : state.volume}
                              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                              className="w-16 md:w-20 h-1 bg-white/20 rounded-full cursor-pointer accent-red-500"
                            />
                          </>
                        )}

                        <div className="text-white text-xs md:text-sm font-medium whitespace-nowrap">
                          {formatTime(state.currentTime)} / {formatTime(state.duration)}
                        </div>
                      </div>

                      <div className="flex items-center space-x-1">
                        {state.isMobile && (
                          <button
                            onClick={toggleMute}
                            className="text-white hover:text-red-400 p-1 rounded-full hover:bg-white/10 transition-all touch-manipulation"
                          >
                            {state.isMuted || state.volume === 0 ? <BiVolumeMute size={16} /> : <BiVolumeFull size={16} />}
                          </button>
                        )}

                        <button 
                          className="text-white hover:text-red-400 p-1 rounded-full hover:bg-white/10 transition-all touch-manipulation"
                          onTouchStart={(e) => e.stopPropagation()}
                        >
                          <MdSubtitles size={state.isMobile ? 16 : 20} />
                        </button>

                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateState({ showSettings: !state.showSettings });
                            }}
                            className="text-white hover:text-red-400 p-1 md:px-2 rounded-lg hover:bg-white/10 transition-all flex items-center gap-1 text-xs md:text-sm touch-manipulation"
                            onTouchStart={(e) => e.stopPropagation()}
                          >
                            <BiCog size={state.isMobile ? 16 : 18} />
                            <span className="hidden md:inline">
                              {props.popUpType === "series" 
                                ? `S${props.seasonNumber}E${props.episodeNumber}` 
                                : state.currentQuality
                              }
                            </span>
                          </button>
                        
                          <AnimatePresence>
                            {state.showSettings && (
                              <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute bottom-full right-0 mb-2 bg-card border border-video-border rounded-lg p-3 md:p-4 min-w-40 md:min-w-48 max-h-80 overflow-y-auto"
                              >
                                {props.popUpType === "series" && (
                                  <>
                                    <div className="mb-4">
                                      <h4 className="text-card-foreground text-xs md:text-sm font-semibold mb-3 flex items-center">
                                        <BiListUl className="mr-2 text-primary" size={14} /> 
                                        <span className="text-primary">Season {props.seasonNumber} • Episode {props.episodeNumber}</span>
                                      </h4>
                                      <div className="space-y-1">
                                        {props.id.seasons
                                          ?.filter(season => season.season_number !== 0)
                                          .sort((a, b) => a.season_number - b.season_number)
                                          .map((season) => (
                                            <button
                                              key={season.season_number}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                props.setSeasonNumber?.(season.season_number);
                                                updateState({ showSettings: false });
                                              }}
                                              className={`w-full text-left px-3 py-2 rounded text-sm transition-all flex items-center justify-between touch-manipulation ${
                                                props.seasonNumber === season.season_number
                                                  ? 'bg-red-600 text-white'
                                                  : 'text-muted-foreground hover:bg-red-600/20 hover:text-white'
                                              }`}
                                              onTouchStart={(e) => e.stopPropagation()}
                                            >
                                              <span>Season {season.season_number}</span>
                                              {props.seasonNumber === season.season_number && (
                                                <IoIosCheckmark className="text-primary-foreground text-lg" />
                                              )}
                                            </button>
                                          ))}
                                      </div>
                                    </div>
                                    <div className="border-t border-border mb-4"></div>
                                  </>
                                )}
                              
                                <div className="mb-4">
                                  <h4 className="text-card-foreground text-xs md:text-sm font-semibold mb-3 flex items-center">
                                    <MdHd className="mr-2" size={14} /> Quality: {state.currentQuality}
                                  </h4>
                                  <div className="space-y-1">
                                    {state.availableQualities.map((quality) => (
                                      <button
                                        key={quality}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          changeQuality(quality);
                                        }}
                                        className={`w-full text-left px-3 py-2 rounded text-sm transition-all touch-manipulation ${
                                          state.currentQuality === quality
                                            ? 'bg-red-600 text-white'
                                            : 'text-muted-foreground hover:bg-red-600/20 hover:text-white'
                                        }`}
                                        onTouchStart={(e) => e.stopPropagation()}
                                      >
                                        {quality === 'auto' ? 'Auto' : quality}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              
                                <div className="mb-4">
                                  <h4 className="text-card-foreground text-xs md:text-sm font-semibold mb-3">Speed: {state.playbackSpeed}x</h4>
                                  <div className="space-y-1">
                                    {speedOptions.map((speed) => (
                                      <button
                                        key={speed}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          changePlaybackSpeed(speed);
                                        }}
                                        className={`w-full text-left px-3 py-2 rounded text-sm transition-all touch-manipulation ${
                                          state.playbackSpeed === speed
                                            ? 'bg-red-600 text-white'
                                            : 'text-muted-foreground hover:bg-red-600/20 hover:text-white'
                                        }`}
                                        onTouchStart={(e) => e.stopPropagation()}
                                      >
                                        {speed}x {speed === 1 ? '(Normal)' : ''}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                <div className="space-y-1">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openWithExternalPlayer();
                                    }}
                                    className="w-full text-left px-3 py-2 rounded text-sm text-muted-foreground hover:bg-red-600/20 hover:text-white transition-all touch-manipulation"
                                    onTouchStart={(e) => e.stopPropagation()}
                                  >
                                    Open with External Player
                                  </button>
                                  
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDownload(state.currentQuality);
                                      updateState({ showSettings: false });
                                    }}
                                    className="w-full text-left px-3 py-2 rounded text-sm text-muted-foreground hover:bg-emerald-600/20 hover:text-emerald-400 transition-all touch-manipulation flex items-center"
                                    onTouchStart={(e) => e.stopPropagation()}
                                  >
                                    <FaCloudDownloadAlt className="mr-2" size={14} />
                                    Download Current Quality
                                  </button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                        
                        <button
                          onClick={toggleFullscreen}
                          className="text-white hover:text-primary p-1 md:p-2 rounded-full hover:bg-white/10 transition-all"
                        >
                          {state.isFullscreen ? <BiExitFullscreen size={state.isMobile ? 16 : 20} /> : <BiFullscreen size={state.isMobile ? 16 : 20} />}
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
