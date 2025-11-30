import React, { useState, useEffect } from "react";
import axios from "axios";
import "react-lazy-load-image-component/src/effects/black-and-white.css";
import { motion, AnimatePresence } from "framer-motion";
import { LazyLoadImage } from "react-lazy-load-image-component";
import Swal from 'sweetalert2';

import { BiListUl, BiPlay, BiTime, BiDownload, BiPlayCircle } from "react-icons/bi";
import { IoIosArrowDown, IoIosCheckmark } from "react-icons/io";
import { FiCalendar } from "react-icons/fi";
import { BsListStars } from "react-icons/bs";
import { PiStarFill } from "react-icons/pi";
import { LuLanguages } from "react-icons/lu";
import { AiFillHeart, AiOutlineHeart } from "react-icons/ai";
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
      await tryDirectPlay(selectedQuality, `${props.movieData.title} S${selectedSeason.season_number}E${selectedEpisode.episode_number}`);
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

    const bestQuality = sources.sort((a, b) => {
      const aSize = parseInt(a.quality.replace("p", ""), 10);
      const bSize = parseInt(b.quality.replace("p", ""), 10);
      return bSize - aSize;
    })[0];

    await tryDirectPlay(bestQuality, props.movieData.title);
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

    const bestQuality = sources.sort((a, b) => {
      const aSize = parseInt(a.quality.replace("p", ""), 10);
      const bSize = parseInt(b.quality.replace("p", ""), 10);
      return bSize - aSize;
    })[0];

    await tryDirectPlay(bestQuality, `${props.movieData.title} S${props.seasonNumber}E${episode.episode_number}`);
  };

  return (
    <div className="relative mt-20 bg-gradient-to-br from-gray-900/30 via-gray-800/20 to-black/50 backdrop-blur-sm border border-white/20 p-4 md:p-8 lg:p-10 rounded-2xl shadow-2xl">
      {!props.isMovieDataLoading ? (
        <>
          <div className="grid lg:grid-cols-2 content-center items-center gap-6 lg:gap-8">
            <div
              onClick={handlePlayClick}
              className="aspect-video w-full relative flex items-center shrink-0 bg-gradient-to-br from-gray-700/20 to-gray-900/40 rounded-2xl cursor-pointer transition-all duration-500 ease-out hover:scale-[1.02] hover:shadow-xl hover:shadow-white/20 group overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"></div>

              {/* Favorite Heart Icon - Top Right Corner */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite();
                }}
                className="absolute top-3 right-3 z-30 p-2 rounded-full backdrop-blur-xl bg-black/70 border border-red-400/40 text-red-400 transition-all duration-300 hover:bg-black/80 hover:border-red-300/50 hover:shadow-red-400/20 hover:scale-110"
                title={isFavorite ? "Remove from favorites" : "Add to favorites"}
              >
                {isFavorite ? (
                  <AiFillHeart className="text-red-500 text-xl sm:text-2xl" />
                ) : (
                  <AiOutlineHeart className="text-red-400 text-xl sm:text-2xl" />
                )}
              </button>

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
                className="aspect-video w-full rounded-2xl shrink-0 object-cover"
              />
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

                {/* Trailer Play Button */}
                <button
                  onClick={() => setIsTrailerModalOpen(true)}
                  className="flex items-center gap-2 p-2 rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/30 hover:border-red-500/50 transition-all duration-300 hover:scale-105"
                  title="Watch Trailer"
                >
                  <BiPlayCircle className="text-red-500 text-xl" />
                  <span className="text-white text-sm xl:text-base font-medium">
                    Trailer
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

      {/* Trailer Modal */}
      <TrailerModal
        isOpen={isTrailerModalOpen}
        onClose={() => setIsTrailerModalOpen(false)}
        movieTitle={props.movieData.title}
        releaseYear={props.movieData.release_year}
      />
    </div>
  );
}
