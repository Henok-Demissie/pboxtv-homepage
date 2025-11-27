import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "react-lazy-load-image-component/src/effects/black-and-white.css";
import { motion, AnimatePresence } from "framer-motion";
import { LazyLoadImage } from "react-lazy-load-image-component";
import Swal from 'sweetalert2';
import Plyr from 'plyr-react';
import 'plyr/dist/plyr.css';

import { BiListUl, BiPlay, BiTime, BiDownload, BiFilm, BiPause, BiVolumeFull, BiVolumeMute, BiFullscreen, BiExitFullscreen, BiSkipNext, BiSkipPrevious } from "react-icons/bi";
import { IoIosArrowDown, IoIosCheckmark } from "react-icons/io";
import { FiCalendar } from "react-icons/fi";
import { BsListStars } from "react-icons/bs";
import { PiStarFill } from "react-icons/pi";
import { LuLanguages } from "react-icons/lu";
import { AiFillHeart, AiOutlineHeart, AiOutlineClose } from "react-icons/ai";
import { getFromStorage, saveToStorage } from "../utils/helpers";
import TelegramButton from "./TelegramButtons";
import DownloadButton from "./Buttons";
import VLCStreamButton from "./VLCStreamButton";
import TrailerModal from "./TrailerModal";

export default function MoviesAndSeriesDetailsSections(props) {
  const [isSeasonsOpen, setIsSeasonspOpen] = useState(false);
  const [isLoadingPlayback, setIsLoadingPlayback] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isTrailerModalOpen, setIsTrailerModalOpen] = useState(false);
  const [isPlayingMovie, setIsPlayingMovie] = useState(false);
  const [selectedSource, setSelectedSource] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [videoError, setVideoError] = useState(null);
  const errorTimeoutRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const controlsTimeoutRef = useRef(null);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto-play video on mobile when URL is set and video element is ready
  useEffect(() => {
    if (isMobile && videoUrl && isPlayingMovie) {
      const video = videoRef.current;
      
      if (!video) {
        // Video element not rendered yet, check again soon
        const checkInterval = setInterval(() => {
          if (videoRef.current) {
            clearInterval(checkInterval);
            // Retry setup when video element appears
            const v = videoRef.current;
            if (v && v.src !== videoUrl) {
              v.src = videoUrl;
              v.load();
            }
          }
        }, 50);
        
        // Clear interval after 2 seconds to avoid infinite checking
        setTimeout(() => clearInterval(checkInterval), 2000);
        return;
      }
      
      // Ensure video has src set and is configured
      if (video.src !== videoUrl) {
        video.src = videoUrl;
        video.preload = 'auto';
        video.playbackRate = 1;
        video.muted = false;
        video.playsInline = true;
        video.setAttribute('webkit-playsinline', 'true');
        video.setAttribute('playsinline', 'true');
        video.setAttribute('x5-playsinline', 'true');
        video.setAttribute('x5-video-player-fullscreen', 'false');
        video.removeAttribute('crossOrigin');
        video.load();
      }
      
      // Ensure video is visible and properly positioned
      video.style.display = 'block';
      video.style.visibility = 'visible';
      video.style.opacity = '1';
      video.style.position = 'absolute';
      video.style.top = '0';
      video.style.left = '0';
      video.style.width = '100%';
      video.style.height = '100%';
      video.style.maxWidth = '100%';
      video.style.maxHeight = '100%';
      video.style.zIndex = '1';
      video.style.objectFit = 'contain';
      video.style.backgroundColor = '#000';
      
      // Try to play if video is ready
      const tryPlay = () => {
        if (video && video.src && video.paused && !video.error) {
          const playPromise = video.play();
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                setIsPlaying(true);
                setIsLoadingPlayback(false);
                console.log('✅ Video auto-played successfully via useEffect');
              })
              .catch((err) => {
                console.log('⚠️ Play failed in useEffect:', err.message);
                // Will retry in event handlers
              });
          }
        }
      };
      
      // Try immediately if video has some data
      if (video.readyState >= 1) {
        tryPlay();
      }
      
      // Also try after delays
      setTimeout(tryPlay, 200);
      setTimeout(tryPlay, 500);
      setTimeout(tryPlay, 1000);
    }
  }, [videoUrl, isPlayingMovie, isMobile]);

  // Additional effect to ensure video plays when element is rendered
  useEffect(() => {
    if (isMobile && isPlayingMovie && videoUrl) {
      const checkVideo = () => {
        const video = videoRef.current;
        const container = containerRef.current;
        
        if (video && video.src === videoUrl) {
          // Ensure video is visible
          video.style.display = 'block';
          video.style.visibility = 'visible';
          video.style.opacity = '1';
          video.style.position = 'absolute';
          video.style.top = '0';
          video.style.left = '0';
          video.style.width = '100%';
          video.style.height = '100%';
          video.style.zIndex = '1';
          
          // Ensure container is visible
          if (container) {
            container.style.display = 'block';
            container.style.visibility = 'visible';
            container.style.opacity = '1';
            container.style.position = 'absolute';
            container.style.top = '0';
            container.style.left = '0';
            container.style.width = '100%';
            container.style.height = '100%';
            container.style.zIndex = '1';
          }
          
          if (video.paused && !video.error) {
            // Video is ready but paused - try to play
            video.play()
              .then(() => {
                setIsPlaying(true);
                setIsLoadingPlayback(false);
                console.log('✅ Video started playing via element check');
              })
              .catch((err) => {
                console.log('⚠️ Play failed in element check:', err.message);
              });
          }
        }
      };
      
      // Check immediately and periodically
      checkVideo();
      const interval = setInterval(checkVideo, 500);
      
      // Clear after 5 seconds
      setTimeout(() => clearInterval(interval), 5000);
      
      return () => clearInterval(interval);
    }
  }, [isPlayingMovie, videoUrl, isMobile]);

  // Check if movie is in favorites
  useEffect(() => {
    const favorites = getFromStorage('favorites', []);
    const isFav = favorites.some(fav => fav.tmdb_id === props.movieData.tmdb_id);
    setIsFavorite(isFav);
  }, [props.movieData.tmdb_id]);

  // Listen for favorites updates
  useEffect(() => {
    const handleFavoritesUpdate = () => {
      const favorites = getFromStorage('favorites', []);
      const isFav = favorites.some(fav => fav.tmdb_id === props.movieData.tmdb_id);
      setIsFavorite(isFav);
    };
    
    window.addEventListener('favoritesUpdated', handleFavoritesUpdate);
    window.addEventListener('storage', handleFavoritesUpdate);
    
    return () => {
      window.removeEventListener('favoritesUpdated', handleFavoritesUpdate);
      window.removeEventListener('storage', handleFavoritesUpdate);
    };
  }, [props.movieData.tmdb_id]);

  const toggleFavorite = () => {
    const favorites = getFromStorage('favorites', []);
    const isFav = favorites.some(fav => fav.tmdb_id === props.movieData.tmdb_id);
    
    if (isFav) {
      // Remove from favorites
      const updatedFavorites = favorites.filter(fav => fav.tmdb_id !== props.movieData.tmdb_id);
      saveToStorage('favorites', updatedFavorites);
      setIsFavorite(false);
      Swal.fire({
        title: 'Removed from Favorites',
        text: `${props.movieData.title} has been removed from your favorites.`,
        icon: 'info',
        confirmButtonText: 'OK',
        confirmButtonColor: '#e11d48',
        background: '#1f2937',
        color: '#ffffff',
        timer: 2000,
        timerProgressBar: true
      });
    } else {
      // Add to favorites
      const newFavorite = {
        tmdb_id: props.movieData.tmdb_id,
        title: props.movieData.title,
        poster: props.movieData.poster,
        release_year: props.movieData.release_year,
        media_type: props.movieData.media_type || 'movie'
      };
      const updatedFavorites = [newFavorite, ...favorites];
      saveToStorage('favorites', updatedFavorites);
      setIsFavorite(true);
      Swal.fire({
        title: 'Added to Favorites',
        text: `${props.movieData.title} has been added to your favorites.`,
        icon: 'success',
        confirmButtonText: 'OK',
        confirmButtonColor: '#e11d48',
        background: '#1f2937',
        color: '#ffffff',
        timer: 2000,
        timerProgressBar: true
      });
    }
    
    // Dispatch custom event for cross-component updates
    window.dispatchEvent(new CustomEvent('favoritesUpdated'));
  };

  const handleTrailerClick = () => {
    setIsTrailerModalOpen(true);
  };

  const loadVideoUrl = async (source, userGesture = false) => {
    setIsLoadingPlayback(true);
    setVideoError(null);
    setShowControls(true);
    
    // Clear any error timeout
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
      errorTimeoutRef.current = null;
    }
    
    // Clear any previous video state for smoother loading
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.removeAttribute('crossOrigin');
      videoRef.current.src = '';
      videoRef.current.load();
    }
    
    // Clear any previous errors
    setVideoError(null);
    
    try {
      const downloadUrl = generateDownloadUrl(source.id, source.name);
      // Try URL shortening, but don't wait too long - use direct URL as fallback
      let shortUrl = downloadUrl;
      try {
        if (!isMobile) {
          shortUrl = await Promise.race([
            shortenUrl(downloadUrl),
            new Promise((resolve) => setTimeout(() => resolve(downloadUrl), 2000))
          ]);
        }
      } catch (shortenErr) {
        console.warn('URL shortening failed, using direct URL:', shortenErr);
        shortUrl = downloadUrl;
      }
      
      setVideoUrl(shortUrl);
      setIsPlayingMovie(true);
      
      // On mobile with user gesture, try to play immediately
      if (isMobile && userGesture && videoRef.current) {
        // Set src immediately and synchronously
        const video = videoRef.current;
        video.src = shortUrl;
        video.preload = 'auto';
        video.playbackRate = 1;
        video.muted = false;
        video.removeAttribute('crossOrigin');
        
        // Load the video
        video.load();
        
        // Try to play immediately while user gesture is still valid
        // Use requestAnimationFrame to ensure DOM is updated but still within gesture context
        requestAnimationFrame(() => {
          if (video && video.src) {
            const playPromise = video.play();
            if (playPromise !== undefined) {
              playPromise
                .then(() => {
                  setIsPlaying(true);
                  setIsLoadingPlayback(false);
                  console.log('Video playing successfully on mobile');
                })
                .catch((err) => {
                  console.log('Initial play failed, will retry in handlers:', err);
                  // Will retry in event handlers (onCanPlay, onLoadedData, etc.)
                });
            }
          }
        });
        
        // Also try after a very short delay (still within gesture context window)
        setTimeout(() => {
          if (video && video.src && video.paused && !video.error) {
            video.play()
              .then(() => {
                setIsPlaying(true);
                setIsLoadingPlayback(false);
                console.log('Video playing successfully on mobile (delayed attempt)');
              })
              .catch(() => {
                // Will retry in event handlers
              });
          }
        }, 100);
      } else {
        // Wait for video element to update with new src
        setTimeout(() => {
          if (videoRef.current) {
            // Set optimal buffering settings
            videoRef.current.preload = isMobile ? 'metadata' : 'auto';
            // Ensure smooth playback
            videoRef.current.playbackRate = 1;
            // Remove crossOrigin if it causes issues
            if (videoRef.current.hasAttribute('crossOrigin')) {
              videoRef.current.removeAttribute('crossOrigin');
            }
          }
        }, 100);
      }
      // Keep loading state true, video events will handle it
    } catch (err) {
      console.error('Error loading video:', err);
      setIsLoadingPlayback(false);
      Swal.fire({
        title: 'Error',
        text: 'Unable to load video. Please try again.',
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: '#e11d48',
        background: '#1f2937',
        color: '#ffffff'
      });
    }
  };

  const stopPlaying = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
    setIsPlayingMovie(false);
    setVideoUrl(null);
    setSelectedSource(null);
    setVideoError(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds) || !isFinite(seconds) || seconds < 0) return '0:00';
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Fullscreen handlers
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement || 
        document.webkitFullscreenElement || 
        document.mozFullScreenElement || 
        document.msFullscreenElement ||
        (videoRef.current && videoRef.current.webkitDisplayingFullscreen)
      );
      setIsFullscreen(isCurrentlyFullscreen);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
    
    // iOS specific events
    const video = videoRef.current;
    if (video) {
      video.addEventListener('webkitbeginfullscreen', handleFullscreenChange);
      video.addEventListener('webkitendfullscreen', handleFullscreenChange);
    }

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
      if (video) {
        video.removeEventListener('webkitbeginfullscreen', handleFullscreenChange);
        video.removeEventListener('webkitendfullscreen', handleFullscreenChange);
      }
    };
  }, []);

  const toggleFullscreen = () => {
    if (!videoRef.current) return;

    // Mobile-specific fullscreen handling
    if (isMobile) {
      if (!isFullscreen) {
        // For iOS Safari - use native fullscreen
        if (videoRef.current.webkitEnterFullscreen) {
          videoRef.current.webkitEnterFullscreen();
          setIsFullscreen(true);
          return;
        }
        // For Android Chrome and other mobile browsers - use container for better control
        const element = containerRef.current || videoRef.current;
        if (element) {
          if (element.requestFullscreen) {
            element.requestFullscreen().catch(err => {
              console.error('Fullscreen error:', err);
              // Fallback: try video element
              if (videoRef.current?.requestFullscreen) {
                videoRef.current.requestFullscreen().catch(() => {});
              }
            });
          } else if (element.webkitRequestFullscreen) {
            element.webkitRequestFullscreen();
          }
        }
      } else {
        // Exit fullscreen
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        } else if (document.webkitCancelFullScreen) {
          document.webkitCancelFullScreen();
        }
      }
      return;
    }

    // Desktop fullscreen handling - use container for better control
    const element = containerRef.current || videoRef.current;
    if (!element) return;

    if (!isFullscreen) {
      if (element.requestFullscreen) {
        element.requestFullscreen().catch(() => {});
      } else if (element.webkitRequestFullscreen) {
        element.webkitRequestFullscreen();
      } else if (element.mozRequestFullScreen) {
        element.mozRequestFullScreen();
      } else if (element.msRequestFullscreen) {
        element.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setIsMuted(newVolume === 0);
    }
  };

  const skipForward = () => {
    if (videoRef.current) {
      const newTime = Math.min(videoRef.current.currentTime + 10, videoRef.current.duration || Infinity);
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const skipBackward = () => {
    if (videoRef.current) {
      const newTime = Math.max(videoRef.current.currentTime - 10, 0);
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
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
    }
  };

  const handleVideoError = (e) => {
    console.error('Video error:', e);
    const video = videoRef.current;
    
    if (!video || !videoUrl) {
      // On mobile, wait longer before showing error (10 seconds)
      // On desktop, wait 5 seconds
      const errorDelay = isMobile ? 10000 : 5000;
      errorTimeoutRef.current = setTimeout(() => {
        if (videoRef.current && (!videoRef.current.src || videoRef.current.error)) {
          setVideoError('Unable to play video directly. Please use an external player.');
          setIsLoadingPlayback(false);
        }
      }, errorDelay);
      return;
    }

    // Check error code
    const error = video.error;
    if (error) {
      console.error('Video error code:', error.code, 'Message:', error.message);
      
      // Error code 4 (MEDIA_ERR_SRC_NOT_SUPPORTED) - try alternative approach
      if (error.code === 4) {
        // Try removing crossOrigin and reload - give more time on mobile
        const retryDelay = isMobile ? 1000 : 500;
        setTimeout(() => {
          if (video && videoUrl) {
            video.removeAttribute('crossOrigin');
            video.src = '';
            video.load();
            setTimeout(() => {
              video.src = videoUrl;
              video.load();
              video.play().catch(() => {
                // On mobile, wait much longer before showing error (15 seconds)
                // On desktop, wait 8 seconds
                const finalErrorDelay = isMobile ? 15000 : 8000;
                errorTimeoutRef.current = setTimeout(() => {
                  if (video && video.error && !video.paused && video.readyState === 0) {
                    setVideoError('Unable to play video directly. Please use an external player.');
                    setIsLoadingPlayback(false);
                  }
                }, finalErrorDelay);
              });
            }, retryDelay);
          }
        }, retryDelay);
        return;
      }
    }

    // Try to reload the video once - don't show error immediately
    // On mobile, be more patient (wait 2 seconds before retry)
    const reloadDelay = isMobile ? 2000 : 1000;
    setTimeout(() => {
      if (video && videoUrl && video.error) {
        // Retry loading the video with fresh state
        const currentSrc = video.src || videoUrl;
        video.removeAttribute('crossOrigin');
        video.src = '';
        video.load();
        setTimeout(() => {
          if (video) {
            video.src = currentSrc;
            video.load();
            video.play().catch(() => {
              // On mobile, wait much longer before showing error (20 seconds total)
              // On desktop, wait 10 seconds
              const finalErrorDelay = isMobile ? 18000 : 10000;
              errorTimeoutRef.current = setTimeout(() => {
                // Only show error if video is still in error state AND hasn't started playing
                if (video && video.error && video.readyState === 0 && !video.paused === false) {
                  setVideoError('Unable to play video directly. Please use an external player.');
                  setIsLoadingPlayback(false);
                }
              }, finalErrorDelay);
            });
          }
        }, reloadDelay);
      } else if (video && !video.error) {
        // Video recovered, clear error
        setVideoError(null);
        setIsLoadingPlayback(false);
      }
    }, reloadDelay);
  };

  const openInVLC = async () => {
    if (!selectedSource) return;
    await openWithVLC(selectedSource);
  };

  const openInNewTab = () => {
    if (videoUrl) {
      window.open(videoUrl, '_blank', 'noopener noreferrer');
    }
  };

  const downloadVideo = async () => {
    if (!selectedSource) return;
    await downloadFile(selectedSource);
  };

  const BASE = import.meta.env.VITE_BASE_URL;
  const API_URL = import.meta.env.VITE_API_URL;
  const API_KEY = import.meta.env.VITE_API_KEY;

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

  const isAndroid = () => /Android/i.test(navigator.userAgent);
  const isIOS = () => /iPhone|iPad|iPod/i.test(navigator.userAgent);

  const getValidSources = (telegramData) => {
    return telegramData?.filter(q =>
      q && q.quality && q.quality.trim() !== "" && q.id && q.name
    ) || [];
  };

  const getMovieSources = () => {
    return getValidSources(props.movieData.telegram);
  };

  const getEpisodeSources = () => {
    if (props.episodes && props.episodeNumber) {
      const episode = props.episodes.find(ep => ep.episode_number === props.episodeNumber);
      return getValidSources(episode?.telegram);
    }
    return [];
  };

  const getCurrentSources = () => {
    return props.detailType === "movie" ? getMovieSources() : getEpisodeSources();
  };

  const showFallbackOptions = async (source, title) => {
    const { value: action } = await Swal.fire({
      title: 'Choose Playback Option',
      text: 'Direct playback failed. How would you like to continue?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Open in VLC',
      cancelButtonText: 'Download File',
      showDenyButton: true,
      denyButtonText: 'Try Direct Link',
      confirmButtonColor: '#e11d48',
      cancelButtonColor: '#6b7280',
      denyButtonColor: '#059669',
      background: '#1f2937',
      color: '#ffffff',
      customClass: {
        actions: 'flex-col gap-2'
      }
    });

    if (action === true) {
      await openWithVLC(source);
    } else if (action === false) {
      await downloadFile(source);
    } else if (action === 'deny') {
      const downloadUrl = generateDownloadUrl(source.id, source.name);
      const shortUrl = await shortenUrl(downloadUrl);
      window.open(shortUrl, "_blank", "noopener noreferrer");
    }
  };

  const showSeriesSourceSelector = async () => {
    const seasons = props.movieData.seasons
      .filter(s => s.season_number > 0)
      .sort((a, b) => a.season_number - b.season_number);

    if (seasons.length === 0) {
      await Swal.fire({
        title: 'No Seasons Available',
        text: 'No seasons found for this series.',
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: '#e11d48',
        background: '#1f2937',
        color: '#ffffff'
      });
      return;
    }

    let selectedSeason = null;
    let selectedEpisode = null;
    let selectedQuality = null;

    const { value: seasonChoice } = await Swal.fire({
      title: 'Select Season',
      input: 'select',
      inputOptions: seasons.reduce((acc, season) => {
        acc[season.season_number] = `Season ${season.season_number}`;
        return acc;
      }, {}),
      inputPlaceholder: 'Choose a season',
      showCancelButton: true,
      confirmButtonText: 'Next',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#e11d48',
      cancelButtonColor: '#6b7280',
      background: '#1f2937',
      color: '#ffffff',
      inputValidator: (value) => {
        if (!value) {
          return 'Please select a season';
        }
      }
    });

    if (!seasonChoice) return;

    selectedSeason = seasons.find(s => s.season_number === parseInt(seasonChoice));
    const episodes = selectedSeason.episodes
      .filter(e => e.episode_number > 0)
      .sort((a, b) => a.episode_number - b.episode_number);

    if (episodes.length === 0) {
      await Swal.fire({
        title: 'No Episodes Available',
        text: 'No episodes found for this season.',
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: '#e11d48',
        background: '#1f2937',
        color: '#ffffff'
      });
      return;
    }

    const { value: episodeChoice } = await Swal.fire({
      title: 'Select Episode',
      input: 'select',
      inputOptions: episodes.reduce((acc, episode) => {
        acc[episode.episode_number] = `Episode ${episode.episode_number}${episode.title ? ` - ${episode.title}` : ''}`;
        return acc;
      }, {}),
      inputPlaceholder: 'Choose an episode',
      showCancelButton: true,
      confirmButtonText: 'Next',
      cancelButtonText: 'Back',
      confirmButtonColor: '#e11d48',
      cancelButtonColor: '#6b7280',
      background: '#1f2937',
      color: '#ffffff',
      inputValidator: (value) => {
        if (!value) {
          return 'Please select an episode';
        }
      }
    });

    if (!episodeChoice) {
      return showSeriesSourceSelector();
    }

    selectedEpisode = episodes.find(e => e.episode_number === parseInt(episodeChoice));
    const qualities = getValidSources(selectedEpisode.telegram);

    if (qualities.length === 0) {
      await Swal.fire({
        title: 'No Sources Available',
        text: 'No playable sources found for this episode.',
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: '#e11d48',
        background: '#1f2937',
        color: '#ffffff'
      });
      return;
    }

    if (qualities.length === 1) {
      selectedQuality = qualities[0];
    } else {
      const { value: qualityChoice } = await Swal.fire({
        title: 'Select Quality',
        input: 'select',
        inputOptions: qualities.reduce((acc, quality) => {
          acc[quality.quality] = quality.quality;
          return acc;
        }, {}),
        inputPlaceholder: 'Choose quality',
        showCancelButton: true,
        confirmButtonText: 'Play',
        cancelButtonText: 'Back',
        confirmButtonColor: '#e11d48',
        cancelButtonColor: '#6b7280',
        background: '#1f2937',
        color: '#ffffff',
        inputValidator: (value) => {
          if (!value) {
            return 'Please select a quality';
          }
        }
      });

      if (!qualityChoice) {
        return showSeriesSourceSelector();
      }

      selectedQuality = qualities.find(q => q.quality === qualityChoice);
    }

    if (selectedQuality) {
      props.setSeasonNumber(selectedSeason.season_number);
      props.setEpisodeNumber(selectedEpisode.episode_number);
      setSelectedSource(selectedQuality);
      await loadVideoUrl(selectedQuality);
    }
  };

  const openWithVLC = async (source) => {
    const downloadUrl = generateDownloadUrl(source.id, source.name);
    const shortUrl = await shortenUrl(downloadUrl);

    if (isAndroid()) {
      const vlcIntent = `intent:${shortUrl}#Intent;package=org.videolan.vlc;type=video/*;action=android.intent.action.VIEW;S.title=${encodeURIComponent(source.name)};end;`;
      window.location.href = vlcIntent;
    } else if (isIOS()) {
      const vlcUrl = `vlc-x-callback://x-callback-url/stream?url=${encodeURIComponent(shortUrl)}`;
      window.location.href = vlcUrl;
    } else {
      window.open(shortUrl, '_blank', 'noopener noreferrer');
    }
  };

  const downloadFile = async (source) => {
    const downloadUrl = generateDownloadUrl(source.id, source.name);
    const shortUrl = await shortenUrl(downloadUrl);

    const link = document.createElement('a');
    link.href = shortUrl;
    link.download = source.name;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const tryDirectPlay = async (source, title) => {
    setIsLoadingPlayback(true);

    try {
      const downloadUrl = generateDownloadUrl(source.id, source.name);
      const shortUrl = await shortenUrl(downloadUrl);

      const newWindow = window.open('', '_blank', 'width=1200,height=800');
      if (!newWindow) {
        setIsLoadingPlayback(false);
        await showFallbackOptions(source, title);
        return;
      }

      newWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${title || source.name}</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body { 
                margin: 0; 
                padding: 0; 
                background: #000; 
                display: flex; 
                flex-direction: column;
                justify-content: center; 
                align-items: center; 
                min-height: 100vh; 
                font-family: Arial, sans-serif;
              }
              video { 
                width: 100%; 
                height: 100vh; 
                max-width: 100vw; 
                object-fit: contain; 
              }
              .loading {
                color: white;
                text-align: center;
                padding: 20px;
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                z-index: 100;
                display: none;
              }
              .title-overlay {
                position: absolute;
                top: 20px;
                left: 20px;
                color: white;
                font-size: 18px;
                font-weight: bold;
                background: rgba(0, 0, 0, 0.7);
                padding: 10px 15px;
                border-radius: 5px;
                z-index: 100;
                transition: opacity 0.5s ease;
                max-width: calc(100% - 40px);
                word-wrap: break-word;
              }
              .fallback-options {
                position: absolute;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                display: none;
                gap: 10px;
                z-index: 100;
              }
              .fallback-btn {
                background: rgba(239, 68, 68, 0.8);
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 5px;
                cursor: pointer;
                font-size: 14px;
                transition: background 0.3s;
              }
              .fallback-btn:hover {
                background: rgba(239, 68, 68, 1);
              }
              .show-fallback {
                display: flex;
              }
            </style>
          </head>
          <body>
            <div class="loading" id="loadingMsg"></div>
            <div class="title-overlay" id="titleOverlay">${title || source.name}</div>
            <video controls preload="metadata" id="videoPlayer">
              <source src="${shortUrl}" type="video/mp4">
              <source src="${shortUrl}" type="video/mkv">
              <source src="${shortUrl}" type="video/webm">
              Your browser does not support the video tag.
            </video>
            <div class="fallback-options" id="fallbackOptions">
              <button class="fallback-btn" onclick="openVLC()">Open in VLC</button>
              <button class="fallback-btn" onclick="downloadFile()">Download</button>
              <button class="fallback-btn" onclick="openDirect()">Direct Link</button>
            </div>
            <script>
              const video = document.getElementById('videoPlayer');
              const loading = document.getElementById('loadingMsg');
              const titleOverlay = document.getElementById('titleOverlay');
              const fallbackOptions = document.getElementById('fallbackOptions');
              let hasStartedPlaying = false;
              let timeoutId;

              video.addEventListener('loadstart', () => {
                timeoutId = setTimeout(() => {
                  if (!hasStartedPlaying) {
                    loading.innerHTML = 'Having trouble loading? Try alternative options below:';
                    loading.style.display = 'block';
                    fallbackOptions.classList.add('show-fallback');
                  }
                }, 20000);
              });

              video.addEventListener('loadeddata', () => {
                loading.style.display = 'none';
                clearTimeout(timeoutId);
              });

              video.addEventListener('playing', () => {
                hasStartedPlaying = true;
                loading.style.display = 'none';
                fallbackOptions.classList.remove('show-fallback');
                clearTimeout(timeoutId);
                
                setTimeout(() => {
                  titleOverlay.style.opacity = '0';
                }, 3000);
              });

              video.addEventListener('error', (e) => {
                loading.innerHTML = 'Failed to load video. Try alternative options:';
                loading.style.display = 'block';
                fallbackOptions.classList.add('show-fallback');
                clearTimeout(timeoutId);
              });

              function openVLC() {
                const userAgent = navigator.userAgent;
                if (/Android/i.test(userAgent)) {
                  window.location.href = 'intent:${shortUrl}#Intent;package=org.videolan.vlc;type=video/*;action=android.intent.action.VIEW;S.title=${encodeURIComponent(source.name)};end;';
                } else if (/iPhone|iPad|iPod/i.test(userAgent)) {
                  window.location.href = 'vlc-x-callback://x-callback-url/stream?url=${encodeURIComponent(shortUrl)}';
                } else {
                  window.open('${shortUrl}', '_blank');
                }
              }

              function downloadFile() {
                const a = document.createElement('a');
                a.href = '${shortUrl}';
                a.download = '${source.name}';
                a.target = '_blank';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
              }

              function openDirect() {
                window.open('${shortUrl}', '_blank');
              }

              setTimeout(() => {
                video.play().catch(() => {});
              }, 1000);
            </script>
          </body>
        </html>
      `);
      newWindow.document.close();

    } catch (error) {
      console.error("Direct play failed:", error);
      await showFallbackOptions(source, title);
    } finally {
      setIsLoadingPlayback(false);
    }
  };

  const handlePlayClick = async () => {
    if (props.detailType === "series") {
      await showSeriesSourceSelector();
      return;
    }

    const sources = getCurrentSources();

    if (sources.length === 0) {
      await Swal.fire({
        title: 'No Sources Available',
        text: 'No playable sources found for this content.',
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: '#e11d48',
        background: '#1f2937',
        color: '#ffffff'
      });
      return;
    }

    // On mobile, auto-play the first/best quality without showing dialog
    if (isMobile) {
      const bestSource = sources[0];
      setSelectedSource(bestSource);
      
      // CRITICAL: On mobile, play MUST happen synchronously within user gesture
      const downloadUrl = generateDownloadUrl(bestSource.id, bestSource.name);
      
      // Set states immediately to render video element
      setIsLoadingPlayback(true);
      setVideoError(null);
      setShowControls(true);
      setIsPlayingMovie(true);
      setVideoUrl(downloadUrl);
      
      // Use a more direct approach - wait for video element, then play immediately
      const setupAndPlayVideo = () => {
        const video = videoRef.current;
        
        if (!video) {
          // Video element not ready yet, try again very soon
          setTimeout(setupAndPlayVideo, 10);
          return;
        }
        
        // Video element exists - configure it immediately
        if (!video.src || video.src !== downloadUrl) {
          video.src = downloadUrl;
        }
        
        // Set all mobile-friendly attributes
        video.preload = 'auto';
        video.muted = false;
        video.playsInline = true;
        video.setAttribute('webkit-playsinline', 'true');
        video.setAttribute('playsinline', 'true');
        video.setAttribute('x5-playsinline', 'true');
        video.setAttribute('x5-video-player-fullscreen', 'false');
        video.removeAttribute('crossOrigin');
        video.controls = false;
        
        // Ensure container is properly sized
        const container = containerRef.current;
        if (container) {
          container.style.display = 'block';
          container.style.visibility = 'visible';
          container.style.opacity = '1';
          container.style.position = 'absolute';
          container.style.top = '0';
          container.style.left = '0';
          container.style.width = '100%';
          container.style.height = '100%';
          container.style.zIndex = '1';
        }
        
        // Ensure video is visible and properly positioned
        video.style.display = 'block';
        video.style.visibility = 'visible';
        video.style.opacity = '1';
        video.style.position = 'absolute';
        video.style.top = '0';
        video.style.left = '0';
        video.style.width = '100%';
        video.style.height = '100%';
        video.style.maxWidth = '100%';
        video.style.maxHeight = '100%';
        video.style.zIndex = '1';
        video.style.objectFit = 'contain';
        video.style.backgroundColor = '#000';
        
        // Prevent automatic native fullscreen on iOS
        if (video.webkitEnterFullscreen) {
          const originalEnterFullscreen = video.webkitEnterFullscreen.bind(video);
          video.webkitEnterFullscreen = () => {
            console.log('Prevented automatic fullscreen - using custom fullscreen instead');
            toggleFullscreen();
          };
        }
        
        // Load the video
        video.load();
        
        // Wait for video to be ready, then play
        const tryPlay = () => {
          if (!video || !video.src) return;
          
          // If video is already playing, we're done
          if (!video.paused && video.readyState >= 2) {
            setIsPlaying(true);
            setIsLoadingPlayback(false);
            return;
          }
          
          // Try to play
          const playPromise = video.play();
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                setIsPlaying(true);
                setIsLoadingPlayback(false);
                console.log('✅ Mobile video playing successfully');
              })
              .catch((err) => {
                console.log('⚠️ Play failed:', err.message);
                // Retry when video has more data loaded
                if (video.readyState < 2) {
                  video.addEventListener('loadeddata', () => {
                    video.play()
                      .then(() => {
                        setIsPlaying(true);
                        setIsLoadingPlayback(false);
                        console.log('✅ Mobile video playing after loadeddata');
                      })
                      .catch(() => {});
                  }, { once: true });
                } else {
                  // Video has data but play failed - try again
                  setTimeout(() => {
                    if (video && video.readyState >= 1) {
                      video.play()
                        .then(() => {
                          setIsPlaying(true);
                          setIsLoadingPlayback(false);
                        })
                        .catch(() => {});
                    }
                  }, 500);
                }
              });
          }
        };
        
        // Try immediately
        tryPlay();
        
        // Also try after short delays
        setTimeout(tryPlay, 100);
        setTimeout(tryPlay, 300);
        setTimeout(tryPlay, 600);
      };
      
      // Start setup immediately
      setupAndPlayVideo();
      
      // Also use requestAnimationFrame as backup
      requestAnimationFrame(() => {
        requestAnimationFrame(setupAndPlayVideo);
      });
      
      return;
    }

    // If multiple qualities, let user choose (desktop only)
    if (sources.length > 1) {
      const { value: qualityChoice } = await Swal.fire({
        title: 'Select Quality',
        input: 'select',
        inputOptions: sources.reduce((acc, source) => {
          acc[source.quality] = source.quality;
          return acc;
        }, {}),
        inputPlaceholder: 'Choose quality',
        showCancelButton: true,
        confirmButtonText: 'Play',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#e11d48',
        cancelButtonColor: '#6b7280',
        background: '#1f2937',
        color: '#ffffff',
        inputValidator: (value) => {
          if (!value) {
            return 'Please select a quality';
          }
        }
      });

      if (!qualityChoice) {
        return;
      }

      const selectedSource = sources.find(s => s.quality === qualityChoice);
      setSelectedSource(selectedSource);
      await loadVideoUrl(selectedSource);
    } else {
      // Single quality, play directly
      setSelectedSource(sources[0]);
      await loadVideoUrl(sources[0]);
    }
  };

  const handleEpisodeClick = async (episode) => {
    props.setEpisodeNumber(episode.episode_number);

    const sources = getValidSources(episode.telegram);
    if (sources.length === 0) {
      await Swal.fire({
        title: 'No Sources Available',
        text: 'No playable sources found for this episode.',
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: '#e11d48',
        background: '#1f2937',
        color: '#ffffff'
      });
      return;
    }

    // If multiple qualities, let user choose
    if (sources.length > 1) {
      const { value: qualityChoice } = await Swal.fire({
        title: 'Select Quality',
        input: 'select',
        inputOptions: sources.reduce((acc, source) => {
          acc[source.quality] = source.quality;
          return acc;
        }, {}),
        inputPlaceholder: 'Choose quality',
        showCancelButton: true,
        confirmButtonText: 'Play',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#e11d48',
        cancelButtonColor: '#6b7280',
        background: '#1f2937',
        color: '#ffffff',
        inputValidator: (value) => {
          if (!value) {
            return 'Please select a quality';
          }
        }
      });

      if (!qualityChoice) {
        return;
      }

      const selectedSource = sources.find(s => s.quality === qualityChoice);
      setSelectedSource(selectedSource);
      await loadVideoUrl(selectedSource);
    } else {
      // Single quality, play directly
      setSelectedSource(sources[0]);
      await loadVideoUrl(sources[0]);
    }
  };

  return (
    <div className="relative mt-4 sm:mt-6 md:mt-8 bg-gradient-to-br from-gray-900/30 via-gray-800/20 to-black/50 backdrop-blur-sm border border-white/20 p-4 md:p-8 lg:p-10 rounded-2xl shadow-2xl">
      {!props.isMovieDataLoading ? (
        <>
          <div className="grid lg:grid-cols-2 content-center items-center gap-6 lg:gap-8">
            <div
              className="w-full relative shrink-0 bg-black rounded-2xl overflow-hidden"
              style={isMobile ? {
                aspectRatio: '16/9',
                height: '50vh',
                maxHeight: '50vh',
                minHeight: '200px',
                position: 'relative'
              } : {
                aspectRatio: '16/9',
                height: '60vh',
                maxHeight: '60vh',
                minHeight: '300px',
                position: 'relative'
              }}
            >
              {/* Favorite Button - Upper Right Corner */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite();
                }}
                className="absolute top-3 right-3 z-30 p-2.5 rounded-full bg-black/70 backdrop-blur-md border border-white/30 hover:border-red-500/50 text-white transition-all duration-300 hover:scale-110 hover:bg-black/80 shadow-lg"
                title={isFavorite ? "Remove from favorites" : "Add to favorites"}
              >
                {isFavorite ? (
                  <AiFillHeart className="text-red-500 text-xl sm:text-2xl" />
                ) : (
                  <AiOutlineHeart className="text-red-400 text-xl sm:text-2xl" />
                )}
              </button>

              {/* Video Player - Show when playing */}
              {isPlayingMovie && videoUrl ? (
                <>
                  {videoError && (!videoRef.current || videoRef.current.error || videoRef.current.readyState === 0) ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 z-20 p-6">
                      <div className="text-center text-white mb-4 max-w-md">
                        <p className="text-lg font-semibold mb-2">{videoError}</p>
                        <p className="text-sm text-gray-400 mb-6">Try one of these options:</p>
                        <div className="flex flex-wrap gap-3 justify-center">
                          <button
                            onClick={openInVLC}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium text-sm"
                          >
                            Open in VLC
                          </button>
                          <button
                            onClick={openInNewTab}
                            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium text-sm"
                          >
                            Open in New Tab
                          </button>
                          <button
                            onClick={downloadVideo}
                            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium text-sm"
                          >
                            Download
                          </button>
                          <button
                            onClick={stopPlaying}
                            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors font-medium text-sm"
                          >
                            Close
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div 
                        ref={containerRef} 
                        className={`absolute inset-0 w-full h-full bg-black ${isFullscreen ? 'fixed z-50' : ''}`}
                        style={{
                          ...(isFullscreen ? {
                            width: '100vw',
                            height: '100vh',
                            minHeight: '100vh',
                            maxHeight: '100vh',
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            zIndex: 9999
                          } : {
                            width: '100%',
                            height: '100%',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            display: 'block',
                            visibility: 'visible',
                            opacity: 1,
                            zIndex: 1,
                            overflow: 'hidden'
                          })
                        }}
                        onTouchStart={() => {
                          setShowControls(true);
                          if (controlsTimeoutRef.current) {
                            clearTimeout(controlsTimeoutRef.current);
                          }
                          controlsTimeoutRef.current = setTimeout(() => {
                            if (isPlaying) {
                              setShowControls(false);
                            }
                          }, 4000);
                        }}
                        onMouseMove={() => {
                          setShowControls(true);
                          if (controlsTimeoutRef.current) {
                            clearTimeout(controlsTimeoutRef.current);
                          }
                          controlsTimeoutRef.current = setTimeout(() => {
                            if (isPlaying) {
                              setShowControls(false);
                            }
                          }, 3000);
                        }}
                      >
                        <video
                          ref={videoRef}
                          className={`${isFullscreen ? 'object-cover' : 'object-contain'}`}
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            maxWidth: '100%',
                            maxHeight: '100%',
                            backgroundColor: '#000',
                            objectFit: isFullscreen ? 'cover' : 'contain',
                            display: 'block',
                            visibility: 'visible',
                            opacity: 1,
                            zIndex: 1,
                            // Optimize for mobile performance
                            ...(isMobile && {
                              willChange: 'auto',
                              transform: 'translateZ(0)',
                              WebkitTransform: 'translateZ(0)',
                              backfaceVisibility: 'visible',
                              WebkitBackfaceVisibility: 'visible',
                              WebkitPlaysinline: true,
                              playsInline: true
                            })
                          }}
                          src={videoUrl}
                          poster={props.movieData.backdrop}
                          autoPlay
                          playsInline
                          preload={isMobile ? "metadata" : "auto"}
                          crossOrigin={null}
                          webkit-playsinline="true"
                          x5-playsinline="true"
                          x5-video-player-type="h5"
                          x5-video-player-fullscreen="false"
                          x5-video-orientation="portrait"
                          controls={false}
                          muted={false}
                          loop={false}
                          disablePictureInPicture={true}
                          disableRemotePlayback={true}
                          onEnded={stopPlaying}
                          onError={handleVideoError}
                          onLoadStart={() => {
                            // Start loading indicator immediately
                            setIsLoadingPlayback(true);
                          }}
                          onLoadedMetadata={() => {
                            if (videoRef.current) {
                              setDuration(videoRef.current.duration);
                              // On mobile, try to play immediately after metadata loads - be aggressive
                              if (isMobile && videoRef.current.readyState >= 1) {
                                // Try multiple times with increasing delays
                                let attempts = 0;
                                const tryPlay = () => {
                                  attempts++;
                                  if (videoRef.current && videoRef.current.readyState >= 1 && attempts <= 5) {
                                    videoRef.current.play().then(() => {
                                      setIsPlaying(true);
                                      setIsLoadingPlayback(false);
                                    }).catch(() => {
                                      // Retry with delay
                                      if (attempts < 5) {
                                        setTimeout(tryPlay, 200 * attempts);
                                      }
                                    });
                                  }
                                };
                                tryPlay();
                              }
                            }
                          }}
                          onCanPlay={() => {
                            setIsLoadingPlayback(false);
                            setVideoError(null); // Clear any previous errors
                            // Clear any pending error timeouts
                            if (errorTimeoutRef.current) {
                              clearTimeout(errorTimeoutRef.current);
                              errorTimeoutRef.current = null;
                            }
                            if (videoRef.current) {
                              setDuration(videoRef.current.duration);
                              // Force play immediately - user already clicked play button
                              // On mobile, be very aggressive with play attempts
                              if (isMobile) {
                                // Try to play immediately, multiple times if needed
                                let playAttempts = 0;
                                const forcePlay = () => {
                                  playAttempts++;
                                  if (videoRef.current && playAttempts <= 8) {
                                    const playPromise = videoRef.current.play();
                                    if (playPromise !== undefined) {
                                      playPromise
                                        .then(() => {
                                          setIsPlaying(true);
                                          setIsLoadingPlayback(false);
                                        })
                                        .catch(err => {
                                          console.log(`Play attempt ${playAttempts} failed:`, err);
                                          // Retry with increasing delays
                                          if (playAttempts < 8) {
                                            setTimeout(() => {
                                              if (videoRef.current && !videoRef.current.error) {
                                                forcePlay();
                                              }
                                            }, 150 * playAttempts);
                                          } else {
                                            // Last resort: wait longer and try once more
                                            setTimeout(() => {
                                              if (videoRef.current && !videoRef.current.error) {
                                                videoRef.current.play()
                                                  .then(() => {
                                                    setIsPlaying(true);
                                                    setIsLoadingPlayback(false);
                                                  })
                                                  .catch(() => {
                                                    // Only show error after all retries fail
                                                    errorTimeoutRef.current = setTimeout(() => {
                                                      if (videoRef.current && videoRef.current.error && videoRef.current.readyState === 0) {
                                                        setVideoError('Unable to play video directly. Please use an external player.');
                                                        setIsLoadingPlayback(false);
                                                      }
                                                    }, 10000);
                                                  });
                                              }
                                            }, 2000);
                                          }
                                        });
                                    }
                                  }
                                };
                                // Start playing immediately
                                forcePlay();
                              } else {
                                // Desktop: standard play attempt
                                const playPromise = videoRef.current.play();
                                if (playPromise !== undefined) {
                                  playPromise.catch(err => {
                                    console.error('Play error:', err);
                                    setTimeout(() => {
                                      if (videoRef.current && !videoRef.current.error) {
                                        videoRef.current.play().catch(() => {
                                          errorTimeoutRef.current = setTimeout(() => {
                                            if (videoRef.current && videoRef.current.error && videoRef.current.readyState === 0) {
                                              setVideoError('Unable to play video directly. Please use an external player.');
                                              setIsLoadingPlayback(false);
                                            }
                                          }, 5000);
                                        });
                                      }
                                    }, 200);
                                  });
                                }
                              }
                            }
                          }}
                          onCanPlayThrough={() => {
                            // Video can play through without buffering
                            setIsLoadingPlayback(false);
                          }}
                          onLoadedData={() => {
                            setIsLoadingPlayback(false);
                            setVideoError(null); // Clear errors when data loads
                            // Clear any pending error timeouts
                            if (errorTimeoutRef.current) {
                              clearTimeout(errorTimeoutRef.current);
                              errorTimeoutRef.current = null;
                            }
                            if (videoRef.current) {
                              setDuration(videoRef.current.duration);
                              // On mobile, ensure play if still paused - be very aggressive
                              if (isMobile && videoRef.current.paused && videoRef.current.readyState >= 2) {
                                // Try to play immediately, multiple times
                                let playAttempts = 0;
                                const tryPlay = () => {
                                  playAttempts++;
                                  if (videoRef.current && videoRef.current.paused && playAttempts <= 5) {
                                    videoRef.current.play()
                                      .then(() => {
                                        setIsPlaying(true);
                                        setIsLoadingPlayback(false);
                                      })
                                      .catch(() => {
                                        if (playAttempts < 5) {
                                          setTimeout(tryPlay, 300 * playAttempts);
                                        }
                                      });
                                  }
                                };
                                // Try immediately
                                tryPlay();
                                // Also try after a short delay
                                setTimeout(() => {
                                  if (videoRef.current && videoRef.current.paused) {
                                    tryPlay();
                                  }
                                }, 300);
                              }
                            }
                          }}
                          onWaiting={() => {
                            // Show loading when buffering
                            setIsLoadingPlayback(true);
                            // On mobile, try to improve buffering by reducing playback rate temporarily
                            if (isMobile && videoRef.current && !videoRef.current.paused) {
                              const currentRate = videoRef.current.playbackRate;
                              if (currentRate === 1) {
                                // Slightly reduce rate to help buffer catch up
                                videoRef.current.playbackRate = 0.95;
                                setTimeout(() => {
                                  if (videoRef.current && !videoRef.current.paused) {
                                    videoRef.current.playbackRate = 1;
                                  }
                                }, 1000);
                              }
                            }
                          }}
                          onProgress={() => {
                            // Hide loading when enough data is buffered
                            if (videoRef.current && videoRef.current.buffered.length > 0) {
                              const bufferedEnd = videoRef.current.buffered.end(0);
                              const currentTime = videoRef.current.currentTime;
                              // On mobile, require more buffer (5 seconds) for smoother playback
                              const bufferThreshold = isMobile ? 5 : 3;
                              if (bufferedEnd - currentTime > bufferThreshold) {
                                setIsLoadingPlayback(false);
                              }
                            }
                          }}
                          onPlaying={() => {
                            setIsLoadingPlayback(false);
                            setIsPlaying(true);
                            setVideoError(null); // Clear any errors when video starts playing
                            // Clear any pending error timeouts since video is playing
                            if (errorTimeoutRef.current) {
                              clearTimeout(errorTimeoutRef.current);
                              errorTimeoutRef.current = null;
                            }
                            
                            // On mobile, ensure video stays visible and in viewport
                            if (isMobile && videoRef.current) {
                              const video = videoRef.current;
                              video.style.display = 'block';
                              video.style.visibility = 'visible';
                              video.style.opacity = '1';
                              video.style.position = 'absolute';
                              video.style.top = '0';
                              video.style.left = '0';
                              video.style.width = '100%';
                              video.style.height = '100%';
                              video.style.maxWidth = '100%';
                              video.style.maxHeight = '100%';
                              video.style.zIndex = '1';
                              video.style.objectFit = 'contain';
                              video.style.backgroundColor = '#000';
                              
                              // Ensure container is visible
                              if (containerRef.current) {
                                containerRef.current.style.display = 'block';
                                containerRef.current.style.visibility = 'visible';
                                containerRef.current.style.opacity = '1';
                                containerRef.current.style.position = 'relative';
                                containerRef.current.style.zIndex = '1';
                                containerRef.current.style.width = '100%';
                                containerRef.current.style.height = '50vh';
                                containerRef.current.style.minHeight = '200px';
                                containerRef.current.style.maxHeight = '50vh';
                              }
                              
                              // Scroll video into view if needed
                              if (containerRef.current) {
                                containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              }
                            }
                            
                            setShowControls(true);
                            if (controlsTimeoutRef.current) {
                              clearTimeout(controlsTimeoutRef.current);
                            }
                            // On mobile, show controls longer
                            controlsTimeoutRef.current = setTimeout(() => {
                              if (isPlaying) {
                                setShowControls(false);
                              }
                            }, isMobile ? 5000 : 3000);
                          }}
                          onStalled={() => {
                            // Video stalled, show loading
                            setIsLoadingPlayback(true);
                            // On mobile, try to recover from stall
                            if (isMobile && videoRef.current) {
                              setTimeout(() => {
                                if (videoRef.current && videoRef.current.readyState < 4) {
                                  // Try to reload the video source
                                  const currentSrc = videoRef.current.src;
                                  const currentTime = videoRef.current.currentTime;
                                  videoRef.current.load();
                                  videoRef.current.addEventListener('loadeddata', () => {
                                    if (videoRef.current) {
                                      videoRef.current.currentTime = currentTime;
                                      videoRef.current.play().catch(() => {});
                                    }
                                  }, { once: true });
                                }
                              }, 2000);
                            }
                          }}
                          onSuspend={() => {
                            // Loading suspended, might be buffering
                            if (videoRef.current && videoRef.current.readyState < 3) {
                              setIsLoadingPlayback(true);
                            }
                          }}
                          onRateChange={() => {
                            // Ensure playback rate is correct
                            if (videoRef.current && videoRef.current.playbackRate !== 1 && !isLoadingPlayback) {
                              videoRef.current.playbackRate = 1;
                            }
                          }}
                          onPause={() => {
                            setIsPlaying(false);
                            setShowControls(true);
                            if (controlsTimeoutRef.current) {
                              clearTimeout(controlsTimeoutRef.current);
                            }
                          }}
                          onTimeUpdate={() => {
                            if (videoRef.current) {
                              setCurrentTime(videoRef.current.currentTime);
                              if (!duration || isNaN(duration)) {
                                setDuration(videoRef.current.duration);
                              }
                              // If video is playing and has currentTime > 0, clear any errors
                              if (videoRef.current.currentTime > 0 && !videoRef.current.error) {
                                setVideoError(null);
                                setIsLoadingPlayback(false);
                              }
                            }
                          }}
                        />
                        
                        {/* Custom Controls Overlay */}
                        <div 
                          className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent ${isMobile ? 'p-3' : 'p-4'} z-20 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}
                          style={{
                            pointerEvents: showControls ? 'auto' : 'none'
                          }}
                          onTouchStart={(e) => {
                            e.stopPropagation();
                            setShowControls(true);
                            if (controlsTimeoutRef.current) {
                              clearTimeout(controlsTimeoutRef.current);
                            }
                            controlsTimeoutRef.current = setTimeout(() => {
                              if (isPlaying) {
                                setShowControls(false);
                              }
                            }, 4000);
                          }}
                        >
                          {/* Progress Bar with Time Display */}
                          <div className="flex items-center gap-2 mb-3">
                            <input
                              type="range"
                              min="0"
                              max={duration || 100}
                              value={currentTime || 0}
                              onChange={(e) => {
                                if (videoRef.current) {
                                  const newTime = parseFloat(e.target.value);
                                  videoRef.current.currentTime = newTime;
                                  setCurrentTime(newTime);
                                }
                              }}
                              onTouchStart={(e) => {
                                e.stopPropagation();
                                setShowControls(true);
                              }}
                              className="flex-1 h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-red-600 touch-manipulation"
                              style={{
                                background: `linear-gradient(to right, #dc2626 0%, #dc2626 ${duration ? (currentTime / duration) * 100 : 0}%, rgba(255,255,255,0.2) ${duration ? (currentTime / duration) * 100 : 0}%, rgba(255,255,255,0.2) 100%)`,
                                WebkitTapHighlightColor: 'transparent'
                              }}
                            />
                            {/* Time Display */}
                            <span className={`text-white ${isMobile ? 'text-xs' : 'text-sm'} font-medium ${isMobile ? 'min-w-[80px]' : 'min-w-[100px]'} text-right flex-shrink-0`}>
                              {formatTime(currentTime)} / {formatTime(duration)}
                            </span>
                          </div>
                          
                          {/* Control Buttons */}
                          <div className="flex items-center justify-between w-full">
                            <div className={`flex items-center ${isMobile ? 'gap-2' : 'gap-3'} flex-shrink-0`}>
                              {/* Play/Pause */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  togglePlayPause();
                                }}
                                onTouchStart={(e) => {
                                  e.stopPropagation();
                                  setShowControls(true);
                                }}
                                className="text-white hover:text-red-400 active:text-red-500 transition-colors p-2 touch-manipulation"
                                title={isPlaying ? "Pause" : "Play"}
                                style={{ WebkitTapHighlightColor: 'transparent' }}
                              >
                                {isPlaying ? <BiPause size={isMobile ? 22 : 24} /> : <BiPlay size={isMobile ? 22 : 24} />}
                              </button>

                              {/* Skip Backward 10s */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  skipBackward();
                                }}
                                onTouchStart={(e) => {
                                  e.stopPropagation();
                                  setShowControls(true);
                                }}
                                className="text-white hover:text-red-400 active:text-red-500 transition-colors p-2 touch-manipulation"
                                title="Rewind 10 seconds"
                                style={{ WebkitTapHighlightColor: 'transparent' }}
                              >
                                <BiSkipPrevious size={isMobile ? 22 : 24} />
                              </button>

                              {/* Skip Forward 10s */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  skipForward();
                                }}
                                onTouchStart={(e) => {
                                  e.stopPropagation();
                                  setShowControls(true);
                                }}
                                className="text-white hover:text-red-400 active:text-red-500 transition-colors p-2 touch-manipulation"
                                title="Forward 10 seconds"
                                style={{ WebkitTapHighlightColor: 'transparent' }}
                              >
                                <BiSkipNext size={isMobile ? 22 : 24} />
                              </button>

                              {/* Volume Control */}
                              <div className={`flex items-center ${isMobile ? 'gap-1' : 'gap-2'}`}>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleMute();
                                  }}
                                  onTouchStart={(e) => {
                                    e.stopPropagation();
                                    setShowControls(true);
                                  }}
                                  className="text-white hover:text-red-400 active:text-red-500 transition-colors p-2 touch-manipulation"
                                  title={isMuted ? "Unmute" : "Mute"}
                                  style={{ WebkitTapHighlightColor: 'transparent' }}
                                >
                                  {isMuted ? <BiVolumeMute size={isMobile ? 18 : 20} /> : <BiVolumeFull size={isMobile ? 18 : 20} />}
                                </button>
                                {!isMobile && (
                                  <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.01"
                                    value={isMuted ? 0 : volume}
                                    onChange={(e) => {
                                      e.stopPropagation();
                                      handleVolumeChange(e);
                                    }}
                                    onTouchStart={(e) => {
                                      e.stopPropagation();
                                      setShowControls(true);
                                    }}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-20 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-red-600 touch-manipulation"
                                    style={{
                                      background: `linear-gradient(to right, #dc2626 0%, #dc2626 ${(isMuted ? 0 : volume) * 100}%, rgba(255,255,255,0.2) ${(isMuted ? 0 : volume) * 100}%, rgba(255,255,255,0.2) 100%)`,
                                      WebkitTapHighlightColor: 'transparent'
                                    }}
                                  />
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0">
                              {/* Fullscreen - Always visible on mobile */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFullscreen();
                                }}
                                onTouchStart={(e) => {
                                  e.stopPropagation();
                                  setShowControls(true);
                                }}
                                className="text-white hover:text-red-400 active:text-red-500 transition-colors p-2 touch-manipulation"
                                title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                                style={{ 
                                  WebkitTapHighlightColor: 'transparent',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  minWidth: isMobile ? '44px' : 'auto',
                                  minHeight: isMobile ? '44px' : 'auto'
                                }}
                              >
                                {isFullscreen ? <BiExitFullscreen size={isMobile ? 22 : 20} /> : <BiFullscreen size={isMobile ? 22 : 20} />}
                              </button>
                            </div>
                          </div>
                        </div>

                        {isLoadingPlayback && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                            <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        )}
                      </div>
                      
                      {/* Stop Button */}
                      <button
                        onClick={stopPlaying}
                        onTouchStart={(e) => e.stopPropagation()}
                        className="absolute top-3 left-3 z-30 p-2 rounded-full bg-black/70 backdrop-blur-md border border-white/30 hover:border-red-500/50 active:border-red-500 text-white transition-all duration-300 hover:scale-110 active:scale-105 hover:bg-black/80 shadow-lg touch-manipulation"
                        title="Stop playing"
                        style={{ WebkitTapHighlightColor: 'transparent' }}
                      >
                        <AiOutlineClose className="text-white text-lg" />
                      </button>
                    </>
                  )}
                </>
              ) : (
                <>
                  {/* Play Button Overlay - Show when not playing */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlayClick();
                    }}
                    onTouchStart={(e) => {
                      e.stopPropagation();
                      // On mobile, ensure immediate response
                      if (isMobile) {
                        handlePlayClick();
                      }
                    }}
                    onTouchEnd={(e) => {
                      e.stopPropagation();
                      // Also handle on touch end for better mobile support
                      if (isMobile && !isPlayingMovie) {
                        handlePlayClick();
                      }
                    }}
                    className="absolute inset-0 cursor-pointer transition-all duration-500 ease-out hover:scale-[1.02] hover:shadow-xl hover:shadow-white/20 group bg-gradient-to-br from-gray-700/20 to-gray-900/40 touch-manipulation"
                    style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"></div>

              <div className="absolute z-20 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="relative">
                  <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse"></div>
                  <div className="absolute inset-0 bg-white/15 rounded-full animate-ping"></div>
                  <button
                    disabled={isLoadingPlayback}
                    className={`relative bg-white/10 hover:bg-white/20 backdrop-blur-lg text-white rounded-full p-3 sm:p-4 text-2xl sm:text-3xl lg:text-4xl transition-all duration-300 hover:scale-105 shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-black/30 border border-white/20 hover:border-white/30 ${isLoadingPlayback ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <BiPlay className="ml-0.5" />
                  </button>
                </div>
              </div>

              <LazyLoadImage
                src={props.movieData.backdrop}
                effect="black-and-white"
                alt={props.movieData.title}
                      className="w-full h-full rounded-2xl shrink-0 object-cover"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  </div>
                </>
              )}
            </div>

            <div className="space-y-4 sm:p-2">
              {props.movieData.genres && (
                <div className="flex gap-2 flex-wrap">
                  {props.movieData.genres.map((genre, index) => (
                    <span key={index} className="text-white bg-white/10 px-3 py-1 rounded-full text-xs xl:text-sm font-medium border border-white/30 backdrop-blur-sm">
                      {genre}
                    </span>
                  ))}

                  {props.movieData.media_type == "tv" && (
                    <span className="text-white bg-white/10 px-3 py-1 rounded-full text-xs xl:text-sm font-medium border border-white/30 backdrop-blur-sm">{props.movieData.status}</span>
                  )}
                </div>
              )}

              <h1 className="text-white font-bold line-clamp-2 text-2xl xl:text-3xl 2xl:text-4xl leading-tight">
                {props.movieData.title}
              </h1>

              {/* {props.movieData.media_type == "tv" && (
                <div className="bg-gradient-to-r from-white/10 to-white/20 text-white px-4 py-2 rounded-full w-fit border border-white/30 backdrop-blur-sm">
                  <span className="text-sm xl:text-base font-medium">{props.movieData.status}</span>
                </div>
              )} */}

              <p className="text-white/80 line-clamp-3 text-sm xl:text-base leading-relaxed">
                {props.movieData.description}
              </p>

              <div className="flex flex-wrap gap-4 text-white text-sm xl:text-base">
                <div className="flex items-center gap-2">
                  {props.movieData.media_type === "movie" ? (
                    <>
                      <BiTime className="text-white/80 text-xl" />
                      <span>{props.movieData.runtime} min</span>
                    </>
                  ) : (
                    <>
                      <BsListStars className="text-white/80 text-xl" />
                      <span>{props.movieData.total_seasons} Seasons</span>
                      <span className="text-white/60">•</span>
                      <span>{props.movieData.total_episodes} Episodes</span>
                    </>
                  )}
                </div>

                {props.movieData.media_type === "movie" && props.movieData.release_year && (
                  <div className="flex items-center gap-2">
                    <FiCalendar className="text-white/80 text-xl" />
                    <span>{props.movieData.release_year}</span>
                  </div>
                )}

                {props.movieData.languages && (
                  <div className="flex items-center gap-2">
                    <LuLanguages className="text-white/80 text-xl" />
                    <span>
                      {props.movieData.languages
                        .map(lang => lang.charAt(0).toUpperCase() + lang.slice(1))
                        .join(", ")}
                    </span>
                  </div>
                )}

                {props.movieData.rating && (
                  <div className="flex items-center gap-2">
                    <PiStarFill className="text-yellow-400 text-xl" />
                    <span>{props.movieData.rating.toFixed(1)}</span>
                  </div>
                )}

                {/* Trailer Button - Inline with rating */}
                <button
                  onClick={handleTrailerClick}
                  className="group flex items-center justify-center gap-1.5 bg-transparent border-2 border-red-600 text-white font-medium text-xs rounded-lg py-1.5 px-3 hover:bg-red-600/10 hover:border-red-500 transition-all duration-300 hover:scale-105"
                >
                  <BiFilm className="text-red-600 text-base group-hover:scale-110 transition-transform duration-300" />
                  <span>Trailer</span>
                </button>
              </div>

              {/* Action Buttons Section - All on same line */}
              <div className="flex items-center flex-wrap gap-3 mt-4">
                <TelegramButton movieData={props.movieData} />
                <DownloadButton movieData={props.movieData} />
                <VLCStreamButton movieData={props.movieData} />
              </div>
            </div>
          </div>

          {props.detailType === "series" && (
            <div className="text-primaryTextColor mt-8 lg:mt-10 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Episodes</h2>
                <div className="relative">
                  <button
                    onClick={() => setIsSeasonspOpen(prev => !prev)}
                    className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/30 hover:border-white/50 px-4 py-2 rounded-full transition-all duration-300 flex items-center gap-3 text-sm xl:text-base min-w-[140px] justify-between shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-white/10 hover:scale-105"
                  >
                    <div className="flex items-center gap-2">
                      <BiListUl className="text-xl text-white" />
                      <span className="text-white font-medium">Season {props.seasonNumber}</span>
                    </div>
                    <IoIosArrowDown className={`text-xl text-white transition-transform duration-300 ${isSeasonsOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {isSeasonsOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="absolute top-full mt-2 right-0 z-50 max-h-60 overflow-y-auto bg-gradient-to-br from-black/90 to-gray-900/90 backdrop-blur-lg border border-white/30 rounded-xl shadow-2xl min-w-[200px] max-w-[90vw] sm:max-w-[300px]"
                      >
                        {props.movieData.seasons
                          .filter(season => season.season_number !== 0)
                          .sort((a, b) => a.season_number - b.season_number)
                          .map((season, index) => (
                            <div
                              key={index}
                              onClick={() => {
                                props.setSeasonNumber(season.season_number);
                                setIsSeasonspOpen(false);
                              }}
                              className={`py-3 px-4 flex items-center justify-between transition-all duration-300 cursor-pointer border-b border-white/10 last:border-0 text-white hover:bg-white/20 hover:text-white ${props.seasonNumber === season.season_number
                                ? 'bg-white/20 text-white border-l-4 border-l-white/60'
                                : 'hover:scale-[1.02]'
                                }`}
                            >
                              <div className="flex items-center gap-3">
                                <BiListUl className="text-white/80" />
                                <span className="font-medium">Season {season.season_number}</span>
                              </div>
                              {props.seasonNumber === season.season_number && (
                                <IoIosCheckmark className="text-white text-lg" />
                              )}
                            </div>
                          ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="bg-gradient-to-br from-black/90 to-gray-900/90 backdrop-blur-lg border border-white/30 rounded-xl p-4 md:p-6 shadow-2xl">
                {!props.isEpisodesLoading ? (
                  <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                    {props.episodes &&
                      props.episodes
                        .sort((a, b) => a.episode_number - b.episode_number)
                        .map((eps, index) => (
                          <motion.div
                            key={index}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleEpisodeClick(eps)}
                            className={`group flex items-center gap-3 p-3 border rounded-lg transition-all duration-300 cursor-pointer min-h-[60px] ${props.episodeNumber === eps.episode_number
                              ? 'bg-white/20 border-white/60 shadow-lg shadow-white/20'
                              : 'bg-white/10 hover:bg-white/20 border-white/30 hover:border-white/50 shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-white/10'
                              }`}
                          >
                            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-300 ${props.episodeNumber === eps.episode_number
                              ? 'bg-white/40 text-white'
                              : 'bg-white/20 group-hover:bg-white/30 text-white/80 group-hover:text-white'
                              }`}>
                              <BiPlay />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className={`font-medium text-sm xl:text-base ${props.episodeNumber === eps.episode_number
                                ? 'text-white'
                                : 'text-white'
                                }`}>
                                Ep {eps.episode_number}
                              </div>
                              <div className={`text-xs xl:text-sm line-clamp-1 transition-colors duration-300 ${props.episodeNumber === eps.episode_number
                                ? 'text-white/80'
                                : 'text-white/70 group-hover:text-white/90'
                                }`}>
                                {eps.title}
                              </div>
                            </div>
                            {props.episodeNumber === eps.episode_number && (
                              <IoIosCheckmark className="text-white text-lg flex-shrink-0" />
                            )}
                          </motion.div>
                        ))}
                  </div>
                ) : (
                  <div className="flex justify-center items-center py-20">
                    <div className="loader"></div>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="min-h-[50vh] flex justify-center items-center">
          <div className="loader"></div>
        </div>
      )}

      {/* Trailer Modal */}
      <TrailerModal
        isOpen={isTrailerModalOpen}
        onClose={() => setIsTrailerModalOpen(false)}
        movieTitle={props.movieData?.title}
        releaseYear={props.movieData?.release_year}
      />
    </div>
  );
}
