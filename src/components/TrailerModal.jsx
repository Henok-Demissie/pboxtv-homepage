import React, { useState, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
} from "@nextui-org/modal";
import { AiOutlineClose } from "react-icons/ai";
import axios from "axios";

const TrailerModal = ({ isOpen, onClose, movieTitle, releaseYear }) => {
  const [trailerVideoId, setTrailerVideoId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [videoError, setVideoError] = useState(false);
  const [videoIds, setVideoIds] = useState([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);

  useEffect(() => {
    if (isOpen && movieTitle) {
      fetchTrailer();
    } else {
      // Reset when modal closes
      setTrailerVideoId(null);
      setIsLoading(true);
      setError(null);
      setVideoError(false);
      setVideoIds([]);
      setCurrentVideoIndex(0);
    }
  }, [isOpen, movieTitle, releaseYear]);

  const extractVideoIdsFromHtml = (htmlContent) => {
    if (!htmlContent || typeof htmlContent !== 'string') return [];
    
    const videoIds = new Set(); // Use Set to avoid duplicates
    
    // Method 1: Extract from ytInitialData JSON (most reliable - get all videos)
    try {
      const ytInitialDataPatterns = [
        /var ytInitialData = ({.+?});/s,
        /window\["ytInitialData"\] = ({.+?});/s,
        /ytInitialData = ({.+?});/s
      ];
      
      for (const pattern of ytInitialDataPatterns) {
        const match = htmlContent.match(pattern);
        if (match && match[1]) {
          try {
            const ytData = JSON.parse(match[1]);
            const contents = ytData?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents;
            
            if (contents && Array.isArray(contents)) {
              for (const item of contents) {
                if (item?.videoRenderer?.videoId) {
                  const vid = item.videoRenderer.videoId;
                  if (vid && vid.length === 11 && /^[a-zA-Z0-9_-]{11}$/.test(vid)) {
                    videoIds.add(vid);
                  }
                }
              }
            }
          } catch (parseErr) {
            continue;
          }
        }
      }
    } catch (e) {
      // Continue to other methods
    }
    
    // Method 2: Extract all video IDs from "videoId":"VIDEO_ID" pattern
    const videoIdPattern = /"videoId":\s*"([a-zA-Z0-9_-]{11})"/g;
    let match;
    while ((match = videoIdPattern.exec(htmlContent)) !== null) {
      if (match[1] && match[1].length === 11 && /^[a-zA-Z0-9_-]{11}$/.test(match[1])) {
        videoIds.add(match[1]);
      }
    }
    
    // Method 3: Extract from /watch?v=VIDEO_ID pattern
    const watchPattern = /\/watch\?v=([a-zA-Z0-9_-]{11})/g;
    while ((match = watchPattern.exec(htmlContent)) !== null) {
      if (match[1] && match[1].length === 11 && /^[a-zA-Z0-9_-]{11}$/.test(match[1])) {
        videoIds.add(match[1]);
      }
    }
    
    return Array.from(videoIds);
  };

  const validateVideoId = async (videoId) => {
    // Quick validation - check if video ID format is valid
    if (!videoId || videoId.length !== 11 || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
      return false;
    }
    
    // Try to check if video is available by checking oEmbed
    try {
      const oEmbedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
      const response = await axios.get(oEmbedUrl, { timeout: 5000 });
      return response.data && response.data.html; // If oEmbed returns data, video exists
    } catch (err) {
      // If oEmbed fails, video might still be available (some videos don't support oEmbed)
      // Return true to try it anyway
      return true;
    }
  };

  const checkVideoAvailability = async (videoId) => {
    try {
      // Check if video is available using YouTube's oEmbed API
      const oEmbedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
      const response = await axios.get(oEmbedUrl, { timeout: 5000 });
      return response.data && response.data.html;
    } catch (err) {
      // If oEmbed fails, try checking the video page directly
      try {
        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(videoUrl)}`;
        const response = await axios.get(proxyUrl, { timeout: 5000 });
        const html = response.data?.contents || '';
        // Check if video is available (not showing "unavailable" message)
        return !html.includes('video is unavailable') && !html.includes('Video unavailable');
      } catch (e) {
        return false;
      }
    }
  };

  const fetchTrailer = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Build search queries - prioritize official trailers
      const searchQueries = [
        `${movieTitle} ${releaseYear || ''} official trailer`,
        `"${movieTitle}" ${releaseYear || ''} official trailer`,
        `${movieTitle} ${releaseYear || ''} trailer`,
        `"${movieTitle}" ${releaseYear || ''} trailer`,
        `${movieTitle} official trailer`,
        `"${movieTitle}" official trailer`,
        `${movieTitle} ${releaseYear || ''} teaser`,
        `${movieTitle} trailer ${releaseYear || ''}`,
        `${movieTitle} trailer`
      ];

      let allVideoIds = [];
      const proxies = [
        'https://api.allorigins.win/get?url=',
        'https://corsproxy.io/?',
        'https://api.codetabs.com/v1/proxy?quest='
      ];

      // Collect video IDs from all search queries
      for (const searchQuery of searchQueries) {
        if (allVideoIds.length >= 15) break; // Get more videos to try
        
        const encodedQuery = encodeURIComponent(searchQuery);
        const searchUrl = `https://www.youtube.com/results?search_query=${encodedQuery}&sp=EgIQAQ%253D%253D`;
        
        for (const proxyBase of proxies) {
          if (allVideoIds.length >= 15) break;
          
          try {
            let proxyUrl;
            if (proxyBase.includes('allorigins')) {
              proxyUrl = `${proxyBase}${encodeURIComponent(searchUrl)}`;
            } else if (proxyBase.includes('codetabs')) {
              proxyUrl = `${proxyBase}${searchUrl}`;
            } else {
              proxyUrl = `${proxyBase}${encodeURIComponent(searchUrl)}`;
            }
            
            const response = await axios.get(proxyUrl, { 
              timeout: 15000,
              headers: {
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
              }
            });
            
            let htmlContent = '';
            if (response.data) {
              if (typeof response.data === 'string') {
                htmlContent = response.data;
              } else if (response.data.contents) {
                htmlContent = response.data.contents;
              } else if (response.data.data) {
                htmlContent = response.data.data;
              } else {
                htmlContent = JSON.stringify(response.data);
              }
            }
            
            if (htmlContent) {
              const videoIds = extractVideoIdsFromHtml(htmlContent);
              videoIds.forEach(id => {
                if (!allVideoIds.includes(id)) {
                  allVideoIds.push(id);
                }
              });
              
              if (allVideoIds.length >= 10) break;
            }
          } catch (proxyErr) {
            continue;
          }
        }
        
        if (allVideoIds.length >= 10) break;
      }

      // Validate and find the first available video
      if (allVideoIds.length > 0) {
        setVideoIds(allVideoIds);
        setCurrentVideoIndex(0);
        
        // Try to validate the first video quickly
        const firstVideoId = allVideoIds[0];
        const isValid = await checkVideoAvailability(firstVideoId);
        
        if (isValid) {
          setTrailerVideoId(firstVideoId);
          setVideoError(false);
        } else {
          // If first video is invalid, try the next ones
          let foundValid = false;
          for (let i = 1; i < Math.min(allVideoIds.length, 5); i++) {
            const vid = allVideoIds[i];
            const valid = await checkVideoAvailability(vid);
            if (valid) {
              setTrailerVideoId(vid);
              setCurrentVideoIndex(i);
              setVideoError(false);
              foundValid = true;
              break;
            }
          }
          
          // If none are validated but we have IDs, use the first one anyway
          // (validation might fail due to CORS, but video might still work)
          if (!foundValid) {
            setTrailerVideoId(firstVideoId);
            setVideoError(false);
          }
        }
      } else {
        // Fallback: Use YouTube's search embed
        const searchQuery = `${movieTitle} ${releaseYear || ''} official trailer`;
        const encodedQuery = encodeURIComponent(searchQuery);
        setTrailerVideoId(`SEARCH:${encodedQuery}`);
        setVideoIds([]);
      }
    } catch (err) {
      console.error('Error fetching trailer:', err);
      // Fallback: Use YouTube's search embed
      const searchQuery = `${movieTitle} ${releaseYear || ''} official trailer`;
      const encodedQuery = encodeURIComponent(searchQuery);
      setTrailerVideoId(`SEARCH:${encodedQuery}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getYouTubeEmbedUrl = () => {
    if (!trailerVideoId) return null;
    
    // Check if it's a search embed fallback
    if (trailerVideoId.startsWith('SEARCH:')) {
      const searchQuery = trailerVideoId.replace('SEARCH:', '');
      // Simplified embed for mobile compatibility
      return `https://www.youtube.com/embed?listType=search&list=${searchQuery}&rel=0&modestbranding=1&playsinline=1&fs=1&controls=1`;
    }
    
    // Use regular YouTube domain - optimized for mobile playback
    const origin = typeof window !== 'undefined' ? encodeURIComponent(window.location.origin) : '';
    const isMobile = typeof window !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Mobile-optimized embed URL
    // Key parameters for mobile: playsinline=1 (iOS), controls=1, no autoplay
    // Remove autoplay for mobile - user must tap to play (required by mobile browsers)
    const baseUrl = `https://www.youtube.com/embed/${trailerVideoId}?rel=0&modestbranding=1&playsinline=1&fs=1&controls=1&iv_load_policy=3&cc_load_policy=0&enablejsapi=1`;
    const originParam = origin ? `&origin=${origin}` : '';
    const referrerParam = origin ? `&widget_referrer=${origin}` : '';
    
    return `${baseUrl}${originParam}${referrerParam}`;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="5xl"
      scrollBehavior="inside"
      placement="center"
      classNames={{
        base: "bg-black/95 backdrop-blur-xl border border-gray-800 max-h-[95vh] md:max-h-[85vh] w-[95vw] md:w-auto",
        wrapper: "items-center justify-center p-1 md:p-4",
        header: "border-b border-gray-800 px-3 md:px-4 py-2 md:py-3",
        body: "p-0 overflow-hidden",
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
        },
      }}
    >
      <ModalContent className="max-w-full w-full md:max-w-5xl">
        {(onClose) => (
          <>
            <ModalHeader className="flex items-center justify-between sticky top-0 z-10 bg-black/95 backdrop-blur-sm">
              <h2 className="text-lg md:text-xl font-bold text-white truncate pr-2">
                {movieTitle} - Trailer
              </h2>
              <button
                onClick={onClose}
                className="text-white hover:text-red-500 transition-colors p-1 rounded-full hover:bg-white/10 flex-shrink-0"
                aria-label="Close"
              >
                <AiOutlineClose className="text-xl md:text-2xl" />
              </button>
            </ModalHeader>
            <ModalBody className="overflow-hidden p-0">
              {/* Fixed container size for all states - prevents layout shift */}
              <div 
                className="relative w-full bg-black rounded-lg overflow-hidden"
                style={{ 
                  paddingBottom: '56.25%', // 16:9 aspect ratio
                  minHeight: '250px',
                  maxHeight: 'calc(90vh - 120px)',
                  width: '100%',
                  position: 'relative',
                  height: 0 // This with paddingBottom creates the aspect ratio
                }}
              >
                {isLoading ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-black">
                    <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : error ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6 bg-black">
                    <p className="text-base md:text-lg mb-4 text-center">{error}</p>
                    <a
                      href={`https://www.youtube.com/results?search_query=${encodeURIComponent(`${movieTitle} ${releaseYear || ''} trailer`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-red-500 hover:text-red-400 underline text-sm md:text-base"
                    >
                      Search on YouTube
                    </a>
                  </div>
                ) : (
                  <>
                    <iframe
                      key={trailerVideoId} // Force re-render when video ID changes
                      className="absolute top-0 left-0 w-full h-full rounded-lg"
                      src={getYouTubeEmbedUrl()}
                      title={`${movieTitle} Trailer`}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                      allowFullScreen={true}
                      style={{ 
                        border: 'none', 
                        width: '100%', 
                        height: '100%',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        display: 'block'
                      }}
                      loading="eager"
                      playsInline={true}
                      onLoad={() => {
                        setVideoError(false);
                      }}
                      onError={() => {
                        // If video fails to load, try next video
                        if (videoIds.length > currentVideoIndex + 1) {
                          const nextIndex = currentVideoIndex + 1;
                          setCurrentVideoIndex(nextIndex);
                          setTrailerVideoId(videoIds[nextIndex]);
                        } else {
                          setError('This trailer is unavailable. Please search on YouTube.');
                        }
                      }}
                    ></iframe>
                    
                    {/* Fallback message if video doesn't load */}
                    {videoError && videoIds.length > currentVideoIndex + 1 && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
                        <div className="text-center text-white">
                          <p className="mb-2">Trying next trailer...</p>
                          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </ModalBody>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default TrailerModal;

