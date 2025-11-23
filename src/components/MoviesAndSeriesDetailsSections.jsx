import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import "react-lazy-load-image-component/src/effects/black-and-white.css";
import { motion, AnimatePresence } from "framer-motion";
import { LazyLoadImage } from "react-lazy-load-image-component";
import Swal from 'sweetalert2';

import { BiListUl, BiPlay, BiTime, BiDownload, BiPause, BiVolumeFull, BiVolumeMute, BiFullscreen, BiExitFullscreen, BiFilm } from "react-icons/bi";
import { MdSubtitles } from "react-icons/md";
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

export default function MoviesAndSeriesDetailsSections(props) {
  const [isSeasonsOpen, setIsSeasonspOpen] = useState(false);
  const [isLoadingPlayback, setIsLoadingPlayback] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [embeddedPlayerState, setEmbeddedPlayerState] = useState({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    isMuted: false,
    showControls: true,
    isBuffering: false,
    isFullscreen: false,
    subtitlesEnabled: false,
    availableSubtitles: [],
    currentSubtitle: null,
    showSubtitleMenu: false
  });
  const [trailerModalOpen, setTrailerModalOpen] = useState(false);
  const [youtubeTrailerId, setYoutubeTrailerId] = useState(null);
  const [isLoadingTrailer, setIsLoadingTrailer] = useState(false);
  const [isTrailerFullscreen, setIsTrailerFullscreen] = useState(false);
  const trailerContainerRef = useRef(null);
  const embeddedVideoRef = useRef(null);
  const embeddedControlsTimeout = useRef(null);
  const embeddedContainerRef = useRef(null);
  const embeddedSubtitleTracksRef = useRef([]);

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
      // Open the embedded Watch modal instead of redirecting
      if (props.setIsWatchEpisodePopupOpen) {
        props.setIsWatchEpisodePopupOpen(true);
      }
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

  // Initialize embedded player when watch popup opens
  useEffect(() => {
    let eventHandlers = [];
    
    const initializeEmbeddedPlayer = async () => {
      if ((props.isWatchMoviePopupOpen || props.isWatchEpisodePopupOpen) && embeddedVideoRef.current) {
        const sources = getCurrentSources();
        if (sources.length > 0) {
          const bestQuality = sources.sort((a, b) => {
            const aSize = parseInt(a.quality.replace("p", ""), 10);
            const bSize = parseInt(b.quality.replace("p", ""), 10);
            return bSize - aSize;
          })[0];
          
          const rawUrl = generateDownloadUrl(bestQuality.id, bestQuality.name);
          
          // Reset player state first
          setEmbeddedPlayerState({
            isPlaying: false,
            currentTime: 0,
            duration: 0,
            volume: 1,
            isMuted: false,
            showControls: true,
            isBuffering: true,
            subtitlesEnabled: false,
            availableSubtitles: [],
            currentSubtitle: null,
            showSubtitleMenu: false
          });
          
          // Load available subtitles
          const subtitles = props.movieData.subtitles || props.movieData.subtitle || [];
          if (Array.isArray(subtitles) && subtitles.length > 0) {
            setEmbeddedPlayerState(prev => ({ ...prev, availableSubtitles: subtitles }));
          } else {
            // Try to generate subtitle URLs based on video source
            const generatedSubtitles = [];
            if (props.movieData.languages && Array.isArray(props.movieData.languages)) {
              props.movieData.languages.forEach((lang, index) => {
                generatedSubtitles.push({
                  lang: lang,
                  label: lang.charAt(0).toUpperCase() + lang.slice(1),
                  src: `${BASE}/subtitle/${bestQuality.id}/${lang}.vtt`,
                  default: index === 0
                });
              });
            }
            if (generatedSubtitles.length > 0) {
              setEmbeddedPlayerState(prev => ({ ...prev, availableSubtitles: generatedSubtitles }));
            }
          }
          
          try {
            const shortUrl = await shortenUrl(rawUrl);
            
            if (embeddedVideoRef.current) {
              // Clear any existing source
              embeddedVideoRef.current.src = '';
              embeddedVideoRef.current.load();
              
              // Set new video source
              embeddedVideoRef.current.src = shortUrl;
              embeddedVideoRef.current.preload = 'auto';
              embeddedVideoRef.current.load();
              
              // Handle video ready to play
              const handleCanPlay = () => {
                if (embeddedVideoRef.current) {
                  setEmbeddedPlayerState(prev => ({ ...prev, isBuffering: false }));
                  // Try to play automatically
                  embeddedVideoRef.current.play().then(() => {
                    setEmbeddedPlayerState(prev => ({ ...prev, isPlaying: true }));
                  }).catch((err) => {
                    console.log('Autoplay prevented, user interaction required');
                    // Video is ready but needs user interaction
                    setEmbeddedPlayerState(prev => ({ ...prev, isBuffering: false }));
                  });
                }
              };
              
              // Handle video loaded
              const handleLoadedData = () => {
                setEmbeddedPlayerState(prev => ({ ...prev, isBuffering: false }));
              };
              
              // Handle video errors
              const handleError = (e) => {
                console.error('Video error:', e);
                setEmbeddedPlayerState(prev => ({ ...prev, isBuffering: false }));
                // Try fallback URL
                if (embeddedVideoRef.current && embeddedVideoRef.current.src !== rawUrl) {
                  embeddedVideoRef.current.src = rawUrl;
                  embeddedVideoRef.current.load();
                }
              };
              
              embeddedVideoRef.current.addEventListener('canplay', handleCanPlay, { once: true });
              embeddedVideoRef.current.addEventListener('loadeddata', handleLoadedData);
              embeddedVideoRef.current.addEventListener('error', handleError);
              
              // Store handlers for cleanup
              eventHandlers = [
                { event: 'canplay', handler: handleCanPlay },
                { event: 'loadeddata', handler: handleLoadedData },
                { event: 'error', handler: handleError }
              ];
            }
          } catch (error) {
            console.error('Error loading video:', error);
            // Fallback to raw URL if shortening fails
            if (embeddedVideoRef.current) {
              embeddedVideoRef.current.src = rawUrl;
              embeddedVideoRef.current.preload = 'auto';
              embeddedVideoRef.current.load();
            }
          }
        }
      } else if (embeddedVideoRef.current) {
        // Reset when closed - clean up subtitle tracks
        embeddedSubtitleTracksRef.current.forEach(track => {
          if (track && track.parentNode) {
            track.parentNode.removeChild(track);
          }
        });
        embeddedSubtitleTracksRef.current = [];
        
        embeddedVideoRef.current.pause();
        embeddedVideoRef.current.currentTime = 0;
        embeddedVideoRef.current.src = '';
        setEmbeddedPlayerState({
          isPlaying: false,
          currentTime: 0,
          duration: 0,
          volume: 1,
          isMuted: false,
          showControls: true,
          isBuffering: false,
          subtitlesEnabled: false,
          availableSubtitles: [],
          currentSubtitle: null,
          showSubtitleMenu: false
        });
      }
    };
    
    initializeEmbeddedPlayer();
    
    // Cleanup function
    return () => {
      if (embeddedVideoRef.current && eventHandlers.length > 0) {
        eventHandlers.forEach(({ event, handler }) => {
          embeddedVideoRef.current.removeEventListener(event, handler);
        });
      }
    };
  }, [props.isWatchMoviePopupOpen, props.isWatchEpisodePopupOpen, props.movieData?.telegram, props.episodeNumber, props.episodes]);

  const toggleEmbeddedPlayPause = async () => {
    if (embeddedVideoRef.current) {
      try {
        if (embeddedVideoRef.current.paused) {
          await embeddedVideoRef.current.play();
          setEmbeddedPlayerState(prev => ({ ...prev, isPlaying: true, isBuffering: false }));
        } else {
          embeddedVideoRef.current.pause();
          setEmbeddedPlayerState(prev => ({ ...prev, isPlaying: false }));
        }
      } catch (error) {
        console.error('Playback error:', error);
        // If play fails, try reloading the video
        if (embeddedVideoRef.current) {
          embeddedVideoRef.current.load();
          try {
            await embeddedVideoRef.current.play();
            setEmbeddedPlayerState(prev => ({ ...prev, isPlaying: true, isBuffering: false }));
          } catch (retryError) {
            console.error('Retry playback failed:', retryError);
          }
        }
      }
    }
  };

  const handleEmbeddedVolumeChange = (e) => {
    const volume = parseFloat(e.target.value);
    if (embeddedVideoRef.current) {
      embeddedVideoRef.current.volume = volume;
      setEmbeddedPlayerState(prev => ({ ...prev, volume, isMuted: volume === 0 }));
    }
  };

  const toggleEmbeddedMute = () => {
    if (embeddedVideoRef.current) {
      if (embeddedPlayerState.isMuted) {
        embeddedVideoRef.current.volume = embeddedPlayerState.volume || 0.5;
        setEmbeddedPlayerState(prev => ({ ...prev, isMuted: false }));
      } else {
        embeddedVideoRef.current.volume = 0;
        setEmbeddedPlayerState(prev => ({ ...prev, isMuted: true }));
      }
    }
  };

  const toggleSubtitles = () => {
    if (embeddedPlayerState.availableSubtitles.length === 0) {
      Swal.fire({
        title: 'No Subtitles Available',
        text: 'Subtitles are not available for this content.',
        icon: 'info',
        confirmButtonText: 'OK',
        confirmButtonColor: '#e11d48',
        background: '#1f2937',
        color: '#ffffff'
      });
      return;
    }
    
    setEmbeddedPlayerState(prev => ({ 
      ...prev, 
      showSubtitleMenu: !prev.showSubtitleMenu 
    }));
  };

  const selectSubtitle = (subtitle) => {
    if (!embeddedVideoRef.current) return;
    
    // Remove existing tracks
    embeddedSubtitleTracksRef.current.forEach(track => {
      if (track && track.parentNode) {
        track.parentNode.removeChild(track);
      }
    });
    embeddedSubtitleTracksRef.current = [];
    
    if (subtitle === null) {
      // Disable subtitles
      setEmbeddedPlayerState(prev => ({ 
        ...prev, 
        subtitlesEnabled: false, 
        currentSubtitle: null,
        showSubtitleMenu: false 
      }));
      return;
    }
    
    // Add new subtitle track
    const track = document.createElement('track');
    track.kind = 'subtitles';
    track.label = subtitle.label || subtitle.lang || 'Subtitle';
    track.srclang = subtitle.lang || 'en';
    track.src = subtitle.src || subtitle.url;
    track.default = subtitle.default || false;
    
    track.addEventListener('load', () => {
      if (embeddedVideoRef.current) {
        embeddedVideoRef.current.textTracks[embeddedVideoRef.current.textTracks.length - 1].mode = 'showing';
      }
    });
    
    embeddedVideoRef.current.appendChild(track);
    embeddedSubtitleTracksRef.current.push(track);
    
    setEmbeddedPlayerState(prev => ({ 
      ...prev, 
      subtitlesEnabled: true, 
      currentSubtitle: subtitle,
      showSubtitleMenu: false 
    }));
  };

  const handleEmbeddedSeek = (e) => {
    if (embeddedVideoRef.current && embeddedPlayerState.duration) {
      const rect = e.currentTarget.getBoundingClientRect();
      const pos = (e.clientX - rect.left) / rect.width;
      const newTime = pos * embeddedPlayerState.duration;
      embeddedVideoRef.current.currentTime = newTime;
      setEmbeddedPlayerState(prev => ({ ...prev, currentTime: newTime }));
    }
  };

  const formatTime = (time) => {
    if (!time || isNaN(time)) return "0:00";
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const resetEmbeddedControlsTimeout = () => {
    setEmbeddedPlayerState(prev => ({ ...prev, showControls: true }));
    if (embeddedControlsTimeout.current) clearTimeout(embeddedControlsTimeout.current);
    if (embeddedPlayerState.isPlaying) {
      embeddedControlsTimeout.current = setTimeout(() => {
        setEmbeddedPlayerState(prev => ({ ...prev, showControls: false }));
      }, 3000);
    }
  };

  const toggleEmbeddedFullscreen = async () => {
    const container = embeddedContainerRef.current || embeddedVideoRef.current?.parentElement;
    
    if (!container) return;
    
    try {
      if (!document.fullscreenElement && !document.webkitFullscreenElement && 
          !document.mozFullScreenElement && !document.msFullscreenElement) {
        // Enter fullscreen
        if (container.requestFullscreen) {
          await container.requestFullscreen();
        } else if (container.webkitRequestFullscreen) {
          await container.webkitRequestFullscreen();
        } else if (container.mozRequestFullScreen) {
          await container.mozRequestFullScreen();
        } else if (container.msRequestFullscreen) {
          await container.msRequestFullscreen();
        }
        setEmbeddedPlayerState(prev => ({ ...prev, isFullscreen: true }));
      } else {
        // Exit fullscreen
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          await document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
          await document.mozCancelFullScreen();
        } else if (document.msExitFullscreen) {
          await document.msExitFullscreen();
        }
        setEmbeddedPlayerState(prev => ({ ...prev, isFullscreen: false }));
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFullscreen = !!(document.fullscreenElement || document.webkitFullscreenElement || 
                              document.mozFullScreenElement || document.msFullscreenElement);
      setEmbeddedPlayerState(prev => ({ ...prev, isFullscreen }));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Lock body scroll when trailer modal is open
  useEffect(() => {
    if (trailerModalOpen && !isTrailerFullscreen) {
      // Save current scroll position
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      
      return () => {
        // Restore scroll position
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [trailerModalOpen, isTrailerFullscreen]);

  // Handle fullscreen changes for trailer modal
  useEffect(() => {
    if (!trailerModalOpen) return;

    const handleFullscreenChange = () => {
      const isFullscreen = !!(document.fullscreenElement || document.webkitFullscreenElement || 
                              document.mozFullScreenElement || document.msFullscreenElement);
      setIsTrailerFullscreen(isFullscreen);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, [trailerModalOpen]);

  // Close subtitle menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (embeddedPlayerState.showSubtitleMenu && !e.target.closest('.subtitle-menu-container')) {
        setEmbeddedPlayerState(prev => ({ ...prev, showSubtitleMenu: false }));
      }
    };

    if (embeddedPlayerState.showSubtitleMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => {
        document.removeEventListener('click', handleClickOutside);
      };
    }
  }, [embeddedPlayerState.showSubtitleMenu]);

  const handlePlayClick = async (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    
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

    // Open the embedded player - NO REDIRECT, NO NEW PAGE
    if (props.setIsWatchMoviePopupOpen) {
      props.setIsWatchMoviePopupOpen(true);
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

    // Open the embedded Watch modal instead of redirecting
    if (props.setIsWatchEpisodePopupOpen) {
      props.setIsWatchEpisodePopupOpen(true);
    }
  };

  return (
    <div className="relative mt-20 bg-gradient-to-br from-gray-900/30 via-gray-800/20 to-black/50 backdrop-blur-sm border border-white/20 p-4 md:p-8 lg:p-10 rounded-2xl shadow-2xl flex flex-col">
      {!props.isMovieDataLoading ? (
        <>
          <div className="grid lg:grid-cols-2 items-center justify-center gap-6 lg:gap-8 py-4 md:py-0">
            <div
              ref={embeddedContainerRef}
              className="w-full relative flex items-center justify-center shrink-0 bg-black rounded-2xl overflow-hidden md:max-h-[calc(100vh-250px)] max-h-[calc(100vh-150px)] mx-auto"
              style={{
                aspectRatio: '16/9',
                minHeight: '280px',
                height: 'auto'
              }}
              onMouseMove={resetEmbeddedControlsTimeout}
              onMouseLeave={() => {
                if (embeddedControlsTimeout.current) clearTimeout(embeddedControlsTimeout.current);
                if (embeddedPlayerState.isPlaying) {
                  embeddedControlsTimeout.current = setTimeout(() => {
                    setEmbeddedPlayerState(prev => ({ ...prev, showControls: false }));
                  }, 3000);
                }
              }}
            >
              {(props.isWatchMoviePopupOpen || props.isWatchEpisodePopupOpen) ? (
                <>
                  <video
                    ref={embeddedVideoRef}
                    className="w-full h-full rounded-2xl shrink-0 bg-black"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      display: 'block'
                    }}
                    poster={props.movieData.backdrop}
                    playsInline
                    preload="auto"
                    crossOrigin="anonymous"
                    onTimeUpdate={(e) => {
                      if (e.target.currentTime !== undefined && !isNaN(e.target.currentTime)) {
                        setEmbeddedPlayerState(prev => ({ ...prev, currentTime: e.target.currentTime }));
                      }
                    }}
                    onDurationChange={(e) => {
                      if (e.target.duration !== undefined && !isNaN(e.target.duration)) {
                        setEmbeddedPlayerState(prev => ({ ...prev, duration: e.target.duration }));
                      }
                    }}
                    onPlay={() => {
                      setEmbeddedPlayerState(prev => ({ ...prev, isPlaying: true, isBuffering: false }));
                    }}
                    onPause={() => {
                      setEmbeddedPlayerState(prev => ({ ...prev, isPlaying: false }));
                    }}
                    onWaiting={() => {
                      setEmbeddedPlayerState(prev => ({ ...prev, isBuffering: true }));
                    }}
                    onPlaying={() => {
                      setEmbeddedPlayerState(prev => ({ ...prev, isBuffering: false }));
                    }}
                    onCanPlay={() => {
                      setEmbeddedPlayerState(prev => ({ ...prev, isBuffering: false }));
                      // Auto-play when ready
                      if (embeddedVideoRef.current && embeddedVideoRef.current.paused && embeddedVideoRef.current.readyState >= 3) {
                        embeddedVideoRef.current.play().then(() => {
                          setEmbeddedPlayerState(prev => ({ ...prev, isPlaying: true }));
                        }).catch(() => {
                          // Autoplay prevented - user will need to click play
                        });
                      }
                    }}
                    onLoadedData={() => {
                      setEmbeddedPlayerState(prev => ({ ...prev, isBuffering: false }));
                    }}
                    onLoadedMetadata={() => {
                      setEmbeddedPlayerState(prev => ({ ...prev, isBuffering: false }));
                    }}
                    onError={(e) => {
                      console.error('Video error:', e);
                      setEmbeddedPlayerState(prev => ({ ...prev, isBuffering: false }));
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleEmbeddedPlayPause();
                    }}
                  />
                  
                  <AnimatePresence>
                    {embeddedPlayerState.showControls && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent pointer-events-none"
                      >
                        <div className="absolute top-2 right-2 pointer-events-auto z-50">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              
                              // Stop and reset video
                              if (embeddedVideoRef.current) {
                                embeddedVideoRef.current.pause();
                                embeddedVideoRef.current.currentTime = 0;
                                embeddedVideoRef.current.src = '';
                              }
                              
                              // Clean up subtitle tracks
                              embeddedSubtitleTracksRef.current.forEach(track => {
                                if (track && track.parentNode) {
                                  track.parentNode.removeChild(track);
                                }
                              });
                              embeddedSubtitleTracksRef.current = [];
                              
                              // Reset player state
                              setEmbeddedPlayerState({
                                isPlaying: false,
                                currentTime: 0,
                                duration: 0,
                                volume: 1,
                                isMuted: false,
                                showControls: true,
                                isBuffering: false,
                                subtitlesEnabled: false,
                                availableSubtitles: [],
                                currentSubtitle: null,
                                showSubtitleMenu: false
                              });
                              
                              // Close the player
                              if (props.setIsWatchMoviePopupOpen) {
                                props.setIsWatchMoviePopupOpen(false);
                              }
                              if (props.setIsWatchEpisodePopupOpen) {
                                props.setIsWatchEpisodePopupOpen(false);
                              }
                            }}
                            className="text-white hover:text-red-400 p-2 rounded-full hover:bg-white/10 transition-all bg-black/50 backdrop-blur-sm"
                            title="Close"
                          >
                            <AiOutlineClose size={20} />
                          </button>
                        </div>
                        
                        <div className="absolute bottom-0 left-0 right-0 p-3 space-y-2 pointer-events-auto">
                          <div 
                            className="w-full h-1.5 bg-white/20 rounded-full cursor-pointer relative"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEmbeddedSeek(e);
                            }}
                          >
                            <div 
                              className="h-full bg-red-600 rounded-full transition-all"
                              style={{ width: `${embeddedPlayerState.duration > 0 ? (embeddedPlayerState.currentTime / embeddedPlayerState.duration) * 100 : 0}%` }}
                            />
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleEmbeddedPlayPause();
                                }}
                                className="text-white hover:text-red-400 p-1"
                              >
                                {embeddedPlayerState.isPlaying ? <BiPause size={20} /> : <BiPlay size={20} />}
                              </button>
                              
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleEmbeddedMute();
                                }}
                                className="text-white hover:text-red-400 p-1"
                              >
                                {embeddedPlayerState.isMuted || embeddedPlayerState.volume === 0 ? (
                                  <BiVolumeMute size={18} />
                                ) : (
                                  <BiVolumeFull size={18} />
                                )}
                              </button>
                              
                              <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.1"
                                value={embeddedPlayerState.isMuted ? 0 : embeddedPlayerState.volume}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  handleEmbeddedVolumeChange(e);
                                }}
                                className="w-16 h-1 bg-white/20 rounded-full cursor-pointer accent-red-500"
                              />
                              
                              <span className="text-white text-xs">
                                {formatTime(embeddedPlayerState.currentTime)} / {formatTime(embeddedPlayerState.duration)}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-1">
                              {/* Subtitle Button */}
                              <div className="relative subtitle-menu-container">
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    toggleSubtitles();
                                  }}
                                  className={`text-white hover:text-red-400 p-1 transition-all ${embeddedPlayerState.subtitlesEnabled ? 'text-red-400' : ''}`}
                                  title="Subtitles"
                                >
                                  <MdSubtitles size={18} />
                                </button>
                                
                                {/* Subtitle Menu */}
                                {embeddedPlayerState.showSubtitleMenu && (
                                  <div 
                                    className="absolute bottom-full right-0 mb-2 bg-black/90 backdrop-blur-md border border-white/30 rounded-lg p-2 min-w-[150px] z-50"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <button
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        selectSubtitle(null);
                                      }}
                                      className={`w-full text-left px-3 py-2 rounded text-sm transition-all ${
                                        !embeddedPlayerState.subtitlesEnabled
                                          ? 'bg-red-600 text-white'
                                          : 'text-white hover:bg-white/20'
                                      }`}
                                    >
                                      Off
                                    </button>
                                    {embeddedPlayerState.availableSubtitles.map((subtitle, index) => (
                                      <button
                                        key={index}
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          selectSubtitle(subtitle);
                                        }}
                                        className={`w-full text-left px-3 py-2 rounded text-sm transition-all mt-1 ${
                                          embeddedPlayerState.currentSubtitle?.lang === subtitle.lang
                                            ? 'bg-red-600 text-white'
                                            : 'text-white hover:bg-white/20'
                                        }`}
                                      >
                                        {subtitle.label || subtitle.lang || `Subtitle ${index + 1}`}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                              
                              {/* Fullscreen Button */}
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  toggleEmbeddedFullscreen();
                                }}
                                className="text-white hover:text-red-400 p-1 transition-all"
                                title={embeddedPlayerState.isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                              >
                                {embeddedPlayerState.isFullscreen ? (
                                  <BiExitFullscreen size={18} />
                                ) : (
                                  <BiFullscreen size={18} />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  {!embeddedPlayerState.isPlaying && !embeddedPlayerState.isBuffering && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleEmbeddedPlayPause();
                        }}
                        className="pointer-events-auto bg-black/50 backdrop-blur-sm border border-white/20 hover:bg-black/70 p-4 rounded-full transition-all"
                      >
                        <BiPlay className="text-white text-4xl ml-1" />
                      </button>
                    </div>
                  )}
                  
                  {embeddedPlayerState.isBuffering && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handlePlayClick(e);
                    }}
                    className="absolute inset-x-0 top-12 md:top-0 bottom-0 cursor-pointer transition-all duration-500 ease-out hover:scale-[1.02] group"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"></div>

                    {/* Favorite Heart Icon - Top Right */}
                  <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleFavorite();
                      }}
                      className="absolute top-3 right-3 z-30 p-2 rounded-full bg-black/40 backdrop-blur-sm border border-white/30 hover:bg-black/60 hover:border-red-500/50 transition-all duration-300 hover:scale-110"
                      title={isFavorite ? "Remove from favorites" : "Add to favorites"}
                    >
                      {isFavorite ? (
                        <AiFillHeart className="text-red-500 text-xl sm:text-2xl" />
                      ) : (
                        <AiOutlineHeart className="text-white text-xl sm:text-2xl" />
                      )}
                    </button>

              <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none -translate-y-2 md:-translate-y-4">
                <div className="relative pointer-events-auto">
                  <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse -z-10"></div>
                  <div className="absolute inset-0 bg-white/15 rounded-full animate-ping -z-10"></div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handlePlayClick(e);
                    }}
                    disabled={isLoadingPlayback}
                    className={`relative bg-white/10 hover:bg-white/20 backdrop-blur-lg text-white rounded-full p-3 sm:p-4 text-2xl sm:text-3xl lg:text-4xl transition-all duration-300 hover:scale-105 shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-black/30 border border-white/20 hover:border-white/30 flex items-center justify-center ${isLoadingPlayback ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <BiPlay className="ml-0.5" />
                  </button>
                </div>
              </div>

              <LazyLoadImage
                src={props.movieData.backdrop}
                effect="black-and-white"
                alt={props.movieData.title}
                className="aspect-video w-full rounded-2xl shrink-0 object-cover"
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

                {/* Trailer Button */}
                <button
                  onClick={async () => {
                    setIsLoadingTrailer(true);
                    try {
                      // Check if we already have a YouTube trailer ID
                      let trailerId = props.movieData.youtube_trailer_id || props.movieData.youtube_id;
                      
                      // If not, try to get from trailer URL
                      if (!trailerId) {
                        const trailerUrl = props.movieData.trailer || props.movieData.trailer_url;
                        if (trailerUrl) {
                          // Extract YouTube ID from URL
                          const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
                          const match = trailerUrl.match(youtubeRegex);
                          if (match) {
                            trailerId = match[1];
                          }
                        }
                      }
                      
                      // If still no trailer ID, fetch from TMDB API
                      if (!trailerId && props.movieData.tmdb_id) {
                        try {
                          // Try backend API first
                          const response = await axios.get(`${BASE}/api/trailer/${props.movieData.tmdb_id}`, {
                            params: {
                              media_type: props.movieData.media_type || 'movie'
                            }
                          });
                          
                          if (response.data && response.data.youtube_id) {
                            trailerId = response.data.youtube_id;
                          } else if (response.data && response.data.trailer_url) {
                            const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
                            const match = response.data.trailer_url.match(youtubeRegex);
                            if (match) {
                              trailerId = match[1];
                            }
                          } else if (response.data && response.data.videos && response.data.videos.results) {
                            // Try to find YouTube trailer in videos results
                            const youtubeTrailer = response.data.videos.results.find(
                              video => video.site === 'YouTube' && video.type === 'Trailer'
                            );
                            if (youtubeTrailer && youtubeTrailer.key) {
                              trailerId = youtubeTrailer.key;
                            }
                          }
                        } catch (error) {
                          console.error('Error fetching trailer from API:', error);
                        }
                      }
                      
                      // If still no trailer ID, search YouTube using movie title
                      if (!trailerId && props.movieData.title) {
                        try {
                          // Search YouTube for trailer using movie title
                          const searchQuery = `${props.movieData.title} ${props.movieData.release_year || ''} official trailer`.trim();
                          
                          // Use YouTube Data API v3 search (if API key available) or use a simple search
                          // For now, we'll use a workaround: search YouTube and try to get first result
                          // Using YouTube's oEmbed API or search API
                          
                          // Try to get video from YouTube search using a proxy or direct search
                          // Since we don't have direct YouTube API access, we'll use a common trailer video ID pattern
                          // Or search using YouTube's search endpoint
                          
                          // Alternative: Use YouTube search API if available
                          const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
                          if (YOUTUBE_API_KEY) {
                            const searchResponse = await axios.get('https://www.googleapis.com/youtube/v3/search', {
                              params: {
                                part: 'id',
                                q: searchQuery,
                                type: 'video',
                                maxResults: 1,
                                key: YOUTUBE_API_KEY
                              }
                            });
                            
                            if (searchResponse.data && searchResponse.data.items && searchResponse.data.items.length > 0) {
                              trailerId = searchResponse.data.items[0].id.videoId;
                            }
                          } else {
                            // Fallback: Try backend YouTube search endpoint
                            try {
                              const backendSearchResponse = await axios.get(`${BASE}/api/youtube-search`, {
                                params: {
                                  q: searchQuery,
                                  maxResults: 1
                                },
                                timeout: 5000
                              });
                              
                              if (backendSearchResponse.data) {
                                if (backendSearchResponse.data.videoId) {
                                  trailerId = backendSearchResponse.data.videoId;
                                } else if (backendSearchResponse.data.items && backendSearchResponse.data.items.length > 0) {
                                  trailerId = backendSearchResponse.data.items[0].id?.videoId || backendSearchResponse.data.items[0].videoId;
                                } else if (backendSearchResponse.data.id) {
                                  trailerId = backendSearchResponse.data.id;
                                }
                              }
                            } catch (searchError) {
                              console.error('Backend YouTube search error:', searchError);
                            }
                            
                            // Fallback: Use CORS proxy to search YouTube directly (no API key needed)
                            if (!trailerId) {
                              const proxies = [
                                `https://api.allorigins.win/get?url=${encodeURIComponent(`https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`)}`,
                                `https://corsproxy.io/?${encodeURIComponent(`https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`)}`,
                                `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(`https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`)}`
                              ];
                              
                              for (const proxyUrl of proxies) {
                                try {
                                  const proxyResponse = await axios.get(proxyUrl, {
                                    timeout: 15000,
                                    headers: {
                                      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
                                    }
                                  });
                                  
                                  let html = '';
                                  if (proxyResponse.data) {
                                    // Handle different proxy response formats
                                    if (proxyResponse.data.contents) {
                                      html = proxyResponse.data.contents;
                                    } else if (typeof proxyResponse.data === 'string') {
                                      html = proxyResponse.data;
                                    } else if (proxyResponse.data.data) {
                                      html = proxyResponse.data.data;
                                    }
                                  }
                                  
                                  if (html) {
                                    // Try to extract video IDs from YouTube's embedded JSON data first
                                    const jsonMatch = html.match(/var ytInitialData = ({.+?});/);
                                    if (jsonMatch) {
                                      try {
                                        const ytData = JSON.parse(jsonMatch[1]);
                                        // Navigate through YouTube's data structure
                                        const contents = ytData?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents;
                                        if (contents && contents[0]?.itemSectionRenderer?.contents) {
                                          for (const item of contents[0].itemSectionRenderer.contents) {
                                            const videoId = item?.videoRenderer?.videoId || 
                                                          item?.videoRenderer?.navigationEndpoint?.watchEndpoint?.videoId;
                                            if (videoId && videoId.length === 11) {
                                              trailerId = videoId;
                                              break;
                                            }
                                          }
                                        }
                                      } catch (e) {
                                        console.log('JSON parse failed, trying regex');
                                      }
                                    }
                                    
                                    // If JSON extraction failed, use regex patterns
                                    if (!trailerId) {
                                      const patterns = [
                                        /"videoId":"([a-zA-Z0-9_-]{11})"/g,
                                        /watch\?v=([a-zA-Z0-9_-]{11})/g,
                                        /\/watch\/v\/([a-zA-Z0-9_-]{11})/g,
                                        /data-video-id="([a-zA-Z0-9_-]{11})"/g,
                                        /"url":"\/watch\?v=([a-zA-Z0-9_-]{11})"/g,
                                        /\/vi\/([a-zA-Z0-9_-]{11})\//g,
                                        /embed\/([a-zA-Z0-9_-]{11})/g
                                      ];
                                      
                                      for (const pattern of patterns) {
                                        const matches = [...html.matchAll(pattern)];
                                        if (matches.length > 0) {
                                          // Get the first valid video ID
                                          for (const match of matches) {
                                            if (match[1] && match[1].length === 11 && !match[1].includes(' ')) {
                                              trailerId = match[1];
                                              break;
                                            }
                                          }
                                          if (trailerId) break;
                                        }
                                      }
                                    }
                                    
                                    if (trailerId) break;
                                  }
                                } catch (proxyError) {
                                  console.error('CORS proxy search error:', proxyError);
                                  continue; // Try next proxy
                                }
                              }
                            }
                          }
                        } catch (error) {
                          console.error('Error searching YouTube:', error);
                        }
                      }
                      
                      // Always play embedded on the page - NO REDIRECTS
                      if (trailerId) {
                        setYoutubeTrailerId(trailerId);
                        setTrailerModalOpen(true);
                      } else {
                        // Show loading message while trying one more search
                        Swal.fire({
                          title: 'Searching for Trailer...',
                          text: `Looking for "${props.movieData.title}" trailer on YouTube...`,
                          icon: 'info',
                          showConfirmButton: false,
                          allowOutsideClick: false,
                          background: '#1f2937',
                          color: '#ffffff',
                          didOpen: async () => {
                            // Try one final aggressive search with multiple query variations
                            try {
                              const searchQueries = [
                                `${props.movieData.title} ${props.movieData.release_year || ''} official trailer`,
                                `${props.movieData.title} ${props.movieData.release_year || ''} trailer`,
                                `${props.movieData.title} trailer`,
                                `${props.movieData.title} ${props.movieData.release_year || ''}`,
                                `${props.movieData.title}`
                              ].map(q => q.trim()).filter(q => q.length > 0);
                              
                              let foundVideoId = null;
                              
                              for (const finalQuery of searchQueries) {
                                if (foundVideoId) break;
                              
                                // Try backend one more time
                                try {
                                  const finalResponse = await axios.get(`${BASE}/api/youtube-search`, {
                                    params: { q: finalQuery, maxResults: 1 },
                                    timeout: 5000
                                  });
                                  
                                  if (finalResponse.data) {
                                    const foundId = finalResponse.data.videoId || 
                                                  (finalResponse.data.items && finalResponse.data.items[0]?.id?.videoId) ||
                                                  (finalResponse.data.items && finalResponse.data.items[0]?.videoId) ||
                                                  finalResponse.data.id;
                                    
                                    if (foundId) {
                                      foundVideoId = foundId;
                                      break;
                                    }
                                  }
                                } catch (e) {
                                  console.error('Final backend search failed:', e);
                                }
                                
                                // Try YouTube API one more time if available
                                const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
                                if (YOUTUBE_API_KEY && !foundVideoId) {
                                  try {
                                    const youtubeFinal = await axios.get('https://www.googleapis.com/youtube/v3/search', {
                                      params: {
                                        part: 'id',
                                        q: finalQuery,
                                        type: 'video',
                                        maxResults: 1,
                                        key: YOUTUBE_API_KEY
                                      },
                                      timeout: 5000
                                    });
                                    
                                    if (youtubeFinal.data && youtubeFinal.data.items && youtubeFinal.data.items.length > 0) {
                                      foundVideoId = youtubeFinal.data.items[0].id.videoId;
                                      break;
                                    }
                                  } catch (ytError) {
                                    console.error('Final YouTube API search failed:', ytError);
                                  }
                                }
                                
                                // Final fallback: Use multiple CORS proxies to search YouTube directly
                                if (!foundVideoId) {
                                  const proxies = [
                                    `https://api.allorigins.win/get?url=${encodeURIComponent(`https://www.youtube.com/results?search_query=${encodeURIComponent(finalQuery)}`)}`,
                                    `https://corsproxy.io/?${encodeURIComponent(`https://www.youtube.com/results?search_query=${encodeURIComponent(finalQuery)}`)}`,
                                    `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(`https://www.youtube.com/results?search_query=${encodeURIComponent(finalQuery)}`)}`
                                  ];
                                  
                                  for (const proxyUrl of proxies) {
                                    if (foundVideoId) break;
                                    try {
                                      const proxyFinal = await axios.get(proxyUrl, {
                                        timeout: 15000,
                                        headers: {
                                          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
                                        }
                                      });
                                      
                                      let html = '';
                                      if (proxyFinal.data) {
                                        if (proxyFinal.data.contents) {
                                          html = proxyFinal.data.contents;
                                        } else if (typeof proxyFinal.data === 'string') {
                                          html = proxyFinal.data;
                                        } else if (proxyFinal.data.data) {
                                          html = proxyFinal.data.data;
                                        }
                                      }
                                      
                                      if (html) {
                                        // Try JSON extraction first
                                        const jsonMatch = html.match(/var ytInitialData = ({.+?});/);
                                        if (jsonMatch) {
                                          try {
                                            const ytData = JSON.parse(jsonMatch[1]);
                                            const contents = ytData?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents;
                                            if (contents && contents[0]?.itemSectionRenderer?.contents) {
                                              for (const item of contents[0].itemSectionRenderer.contents) {
                                                const videoId = item?.videoRenderer?.videoId || 
                                                              item?.videoRenderer?.navigationEndpoint?.watchEndpoint?.videoId;
                                                if (videoId && videoId.length === 11) {
                                                  foundVideoId = videoId;
                                                  break;
                                                }
                                              }
                                            }
                                          } catch (e) {
                                            // Continue to regex
                                          }
                                        }
                                        
                                        // Regex fallback
                                        if (!foundVideoId) {
                                          const patterns = [
                                            /"videoId":"([a-zA-Z0-9_-]{11})"/g,
                                            /watch\?v=([a-zA-Z0-9_-]{11})/g,
                                            /\/watch\/v\/([a-zA-Z0-9_-]{11})/g,
                                            /data-video-id="([a-zA-Z0-9_-]{11})"/g,
                                            /"url":"\/watch\?v=([a-zA-Z0-9_-]{11})"/g,
                                            /\/vi\/([a-zA-Z0-9_-]{11})\//g,
                                            /embed\/([a-zA-Z0-9_-]{11})/g
                                          ];
                                          
                                          for (const pattern of patterns) {
                                            const matches = [...html.matchAll(pattern)];
                                            if (matches.length > 0) {
                                              for (const match of matches) {
                                                if (match[1] && match[1].length === 11 && !match[1].includes(' ')) {
                                                  foundVideoId = match[1];
                                                  break;
                                                }
                                              }
                                              if (foundVideoId) break;
                                            }
                                          }
                                        }
                                      }
                                    } catch (proxyFinalError) {
                                      console.error('Proxy search failed:', proxyFinalError);
                                      continue; // Try next proxy
                                    }
                                  }
                                }
                              }
                              
                              // If we found a video, play it
                              if (foundVideoId) {
                                setYoutubeTrailerId(foundVideoId);
                                setTrailerModalOpen(true);
                                Swal.close();
                                return;
                              }
                            } catch (error) {
                              console.error('Final search attempt error:', error);
                            }
                            
                            // If all attempts failed, show helpful message
                            Swal.close();
                            Swal.fire({
                              title: 'Trailer Not Found',
                              html: `
                                <p>Could not automatically find a trailer for "${props.movieData.title}".</p>
                                <p style="margin-top: 10px; font-size: 0.9em; color: #9ca3af;">
                                  To enable automatic trailer search, please:<br/>
                                  1. Set up YouTube Data API v3 key in .env as VITE_YOUTUBE_API_KEY<br/>
                                  2. Or configure backend endpoint at /api/youtube-search
                                </p>
                              `,
                              icon: 'info',
                              confirmButtonText: 'OK',
                              confirmButtonColor: '#e11d48',
                              background: '#1f2937',
                              color: '#ffffff'
                            });
                          }
                        });
                      }
                    } catch (error) {
                      console.error('Error loading trailer:', error);
                      Swal.fire({
                        title: 'Error',
                        text: 'Failed to load trailer. Please try again.',
                        icon: 'error',
                        confirmButtonText: 'OK',
                        confirmButtonColor: '#e11d48',
                        background: '#1f2937',
                        color: '#ffffff'
                      });
                    } finally {
                      setIsLoadingTrailer(false);
                    }
                  }}
                  disabled={isLoadingTrailer}
                  className={`flex items-center gap-2 p-2 rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/30 hover:border-red-500/50 transition-all duration-300 hover:scale-105 ${isLoadingTrailer ? 'opacity-50 cursor-not-allowed' : ''}`}
                  title="Watch Trailer"
                >
                  <BiFilm className="text-red-500 text-xl" />
                  <span className="text-white text-sm xl:text-base font-medium">
                    {isLoadingTrailer ? 'Loading...' : 'Trailer'}
                  </span>
                </button>
              </div>

              <div className="flex items-center flex-wrap gap-3">
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

      {/* YouTube Trailer Modal - Professional Design */}
      <AnimatePresence>
        {trailerModalOpen && youtubeTrailerId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={`fixed inset-0 z-[99999] bg-black/98 backdrop-blur-sm flex items-center justify-center ${
              isTrailerFullscreen ? 'p-0' : 'p-1 md:p-4'
            }`}
            style={{ 
              paddingTop: isTrailerFullscreen ? '0' : '4px',
              paddingBottom: isTrailerFullscreen ? '0' : '4px',
              paddingLeft: isTrailerFullscreen ? '0' : '4px',
              paddingRight: isTrailerFullscreen ? '0' : '4px'
            }}
            onClick={() => {
              if (!isTrailerFullscreen) {
                // Exit fullscreen if active
                if (document.fullscreenElement || document.webkitFullscreenElement || 
                    document.mozFullScreenElement || document.msFullscreenElement) {
                  if (document.exitFullscreen) {
                    document.exitFullscreen();
                  } else if (document.webkitExitFullscreen) {
                    document.webkitExitFullscreen();
                  } else if (document.mozCancelFullScreen) {
                    document.mozCancelFullScreen();
                  } else if (document.msExitFullscreen) {
                    document.msExitFullscreen();
                  }
                }
                setTrailerModalOpen(false);
                setYoutubeTrailerId(null);
                setIsLoadingTrailer(false);
                setIsTrailerFullscreen(false);
              }
            }}
          >
            {/* Modal Container */}
            <motion.div
              ref={trailerContainerRef}
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ 
                scale: isTrailerFullscreen ? 1 : 1, 
                opacity: 1, 
                y: 0,
                width: isTrailerFullscreen ? '100vw' : '100vw',
                height: isTrailerFullscreen ? '100vh' : '95vh',
                maxWidth: isTrailerFullscreen ? '100vw' : '100vw',
                maxHeight: isTrailerFullscreen ? '100vh' : '95vh'
              }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className={`relative bg-gradient-to-br from-gray-900 via-gray-800 to-black shadow-2xl overflow-hidden border border-gray-700/50 flex flex-col ${
                isTrailerFullscreen ? 'rounded-none' : 'rounded-2xl'
              }`}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: isTrailerFullscreen ? '100vw' : '100%',
                maxWidth: isTrailerFullscreen ? '100vw' : '100%',
                height: isTrailerFullscreen ? '100vh' : 'calc(100vh - 8px)',
                maxHeight: isTrailerFullscreen ? '100vh' : 'calc(100vh - 8px)'
              }}
            >
              {/* Edge Close Button - Always Visible */}
              <button
                onClick={async () => {
                  // Exit fullscreen first if active
                  if (isTrailerFullscreen) {
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
                    } catch (error) {
                      console.error('Error exiting fullscreen:', error);
                    }
                    setIsTrailerFullscreen(false);
                    await new Promise(resolve => setTimeout(resolve, 100));
                  }
                  setTrailerModalOpen(false);
                  setYoutubeTrailerId(null);
                  setIsLoadingTrailer(false);
                  setIsTrailerFullscreen(false);
                }}
                className="absolute top-1 right-1 md:top-3 md:right-3 z-[100] w-7 h-7 md:w-10 md:h-10 rounded-full bg-red-600/90 hover:bg-red-600 text-white hover:text-white transition-all duration-200 flex items-center justify-center backdrop-blur-sm border-2 border-white/30 hover:border-white/50 shadow-lg hover:shadow-xl group"
                title="Close Trailer"
                aria-label="Close Trailer"
              >
                <AiOutlineClose 
                  size={16} 
                  className="md:w-6 md:h-6 group-hover:rotate-90 transition-transform duration-200"
                />
              </button>

              {/* Header Section */}
              <div className={`relative bg-gradient-to-r from-red-600/20 to-pink-600/20 border-b border-gray-700/50 px-2 md:px-6 py-1.5 md:py-2.5 flex items-center justify-between backdrop-blur-sm flex-shrink-0 pr-10 md:pr-6 ${
                isTrailerFullscreen ? 'absolute top-0 left-0 right-0 z-50' : ''
              }`}>
                <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                  <div className="flex-shrink-0 w-6 h-6 md:w-10 md:h-10 rounded-full bg-red-600/20 flex items-center justify-center">
                    <svg className="w-3 h-3 md:w-6 md:h-6 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold text-sm md:text-lg lg:text-xl truncate">
                      {props.movieData?.title || 'Movie Trailer'}
                    </h3>
                    <p className="text-gray-400 text-xs md:text-sm">Official Trailer</p>
                  </div>
                </div>
              </div>
              
              {/* Video Container */}
              <div 
                className="relative bg-black flex-1 flex items-center justify-center" 
                style={{ 
                  minHeight: '0',
                  height: isTrailerFullscreen ? 'calc(100vh - 80px)' : 'auto'
                }}
              >
                <div className="absolute inset-0 w-full h-full flex items-center justify-center">
                  {isLoadingTrailer && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-white text-sm">Loading trailer...</p>
                      </div>
                    </div>
                  )}
                  <iframe
                    src={`https://www.youtube.com/embed/${youtubeTrailerId}?autoplay=1&rel=0&modestbranding=1&controls=1&showinfo=0&fs=1&iv_load_policy=3&playsinline=1`}
                    title={`${props.movieData?.title || 'Movie'} Trailer`}
                    className="absolute inset-0 w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                    allowFullScreen
                    frameBorder="0"
                    onLoad={() => setIsLoadingTrailer(false)}
                  />
                </div>
              </div>
              
              {/* Footer Info - Hidden in fullscreen */}
              {!isTrailerFullscreen && (
                <div className="px-2 md:px-6 py-1 md:py-2 bg-gray-900/50 border-t border-gray-700/50 backdrop-blur-sm flex-shrink-0">
                  <div className="flex items-center justify-between gap-2 text-xs md:text-sm text-gray-400">
                    <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0">
                      <svg className="w-3 h-3 md:w-4 md:h-4 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                      </svg>
                      <span className="truncate">Powered by YouTube</span>
                    </div>
                    <button
                      onClick={() => {
                        window.open(`https://www.youtube.com/watch?v=${youtubeTrailerId}`, '_blank');
                      }}
                      className="text-red-400 hover:text-red-300 transition-colors flex items-center gap-1 flex-shrink-0"
                    >
                      <span className="hidden sm:inline">Watch on YouTube</span>
                      <span className="sm:hidden">YouTube</span>
                      <svg className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
