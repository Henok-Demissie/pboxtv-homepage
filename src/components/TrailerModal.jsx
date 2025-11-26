import React, { useState, useEffect, useRef } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody } from "@nextui-org/modal";
import { AiOutlineClose } from "react-icons/ai";
import { BiFullscreen, BiExitFullscreen } from "react-icons/bi";

const TrailerModal = ({ isOpen, onClose, movieTitle, releaseYear }) => {
  const [videoId, setVideoId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef(null);

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

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    const element = containerRef.current;

    if (!isFullscreen) {
      // Enter fullscreen - try native API first, then fallback to CSS fullscreen
      if (element.requestFullscreen) {
        element.requestFullscreen().catch(err => {
          console.log('Fullscreen API error, using CSS fallback:', err);
          setIsFullscreen(true);
        });
      } else if (element.webkitRequestFullscreen) {
        element.webkitRequestFullscreen().catch(() => setIsFullscreen(true));
      } else if (element.mozRequestFullScreen) {
        element.mozRequestFullScreen().catch(() => setIsFullscreen(true));
      } else if (element.msRequestFullscreen) {
        element.msRequestFullscreen().catch(() => setIsFullscreen(true));
      } else {
        // Fallback: Use CSS-based fullscreen for mobile
        setIsFullscreen(true);
      }
    } else {
      // Exit fullscreen
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(err => {
          console.log('Exit fullscreen error:', err);
          setIsFullscreen(false);
        });
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      } else {
        // Fallback: Use CSS-based fullscreen
        setIsFullscreen(false);
      }
    }
  };

  useEffect(() => {
    if (isOpen && movieTitle) {
      searchYouTubeTrailer();
    } else {
      // Reset when modal closes
      setVideoId(null);
      setIsLoading(true);
      setError(null);
    }
  }, [isOpen, movieTitle, releaseYear]);

  const searchYouTubeTrailer = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Construct search query
      const searchQuery = encodeURIComponent(`${movieTitle} ${releaseYear || ''} official trailer`);
      
      // Try YouTube Data API v3 first if API key is available
      const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
      
      if (API_KEY) {
        try {
          // Use YouTube Data API
          const response = await fetch(
            `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${searchQuery}&type=video&videoCategoryId=24&maxResults=1&key=${API_KEY}`
          );
          
          if (response.ok) {
            const data = await response.json();
            
            if (data.items && data.items.length > 0) {
              setVideoId(data.items[0].id.videoId);
              setIsLoading(false);
              return;
            }
          }
          
          // Fallback: try without category filter
          const fallbackResponse = await fetch(
            `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${searchQuery}&type=video&maxResults=1&key=${API_KEY}`
          );
          
          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            
            if (fallbackData.items && fallbackData.items.length > 0) {
              setVideoId(fallbackData.items[0].id.videoId);
              setIsLoading(false);
              return;
            }
          }
        } catch (apiError) {
          console.error('YouTube API error:', apiError);
        }
      }
      
      // Fallback: Use multiple CORS proxies to search YouTube (works without API key)
      const proxies = [
        'https://api.allorigins.win/get?url=',
        'https://corsproxy.io/?',
        'https://api.codetabs.com/v1/proxy?quest='
      ];
      
      const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${searchQuery}`;
      
      for (const proxyBase of proxies) {
        try {
          const proxyUrl = proxyBase === 'https://api.codetabs.com/v1/proxy?quest=' 
            ? `${proxyBase}${encodeURIComponent(youtubeSearchUrl)}`
            : `${proxyBase}${encodeURIComponent(youtubeSearchUrl)}`;
          
          const response = await fetch(proxyUrl, {
            method: 'GET',
            headers: {
              'Accept': 'text/html'
            }
          });
          
          if (response.ok) {
            let html = '';
            
            if (proxyBase.includes('allorigins')) {
              const data = await response.json();
              html = data.contents || '';
            } else {
              html = await response.text();
            }
            
            if (html) {
              // Try multiple extraction methods
              const extractionMethods = [
                // Method 1: Extract from ytInitialData JSON
                () => {
                  const ytInitialDataMatch = html.match(/var ytInitialData = ({.+?});/s);
                  if (ytInitialDataMatch) {
                    try {
                      const ytData = JSON.parse(ytInitialDataMatch[1]);
                      const contents = ytData?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents;
                      if (contents && contents.length > 0) {
                        for (const item of contents) {
                          const videoId = item?.videoRenderer?.videoId || 
                                         item?.videoRenderer?.navigationEndpoint?.watchEndpoint?.videoId;
                          if (videoId && videoId.length === 11) {
                            return videoId;
                          }
                        }
                      }
                    } catch (e) {
                      console.error('JSON parse error:', e);
                    }
                  }
                  return null;
                },
                // Method 2: Extract from videoRenderer patterns
                () => {
                  const videoRendererMatch = html.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
                  if (videoRendererMatch) {
                    return videoRendererMatch[1];
                  }
                  return null;
                },
                // Method 3: Extract from watch URLs
                () => {
                  const watchMatches = html.match(/\/watch\?v=([a-zA-Z0-9_-]{11})/g);
                  if (watchMatches && watchMatches.length > 0) {
                    const videoId = watchMatches[0].match(/\/watch\?v=([a-zA-Z0-9_-]{11})/)[1];
                    if (videoId && videoId.length === 11) {
                      return videoId;
                    }
                  }
                  return null;
                },
                // Method 4: Extract from embed URLs
                () => {
                  const embedMatches = html.match(/\/embed\/([a-zA-Z0-9_-]{11})/g);
                  if (embedMatches && embedMatches.length > 0) {
                    const videoId = embedMatches[0].match(/\/embed\/([a-zA-Z0-9_-]{11})/)[1];
                    if (videoId && videoId.length === 11) {
                      return videoId;
                    }
                  }
                  return null;
                },
                // Method 5: Generic videoId pattern
                () => {
                  const patterns = [
                    /"videoId":"([a-zA-Z0-9_-]{11})"/,
                    /videoId["\s]*:["\s]*"([a-zA-Z0-9_-]{11})"/,
                    /"v":"([a-zA-Z0-9_-]{11})"/
                  ];
                  
                  for (const pattern of patterns) {
                    const match = html.match(pattern);
                    if (match && match[1] && match[1].length === 11) {
                      return match[1];
                    }
                  }
                  return null;
                }
              ];
              
              for (const method of extractionMethods) {
                const videoId = method();
                if (videoId && videoId.length === 11) {
                  setVideoId(videoId);
                  setIsLoading(false);
                  return;
                }
              }
            }
          }
        } catch (proxyError) {
          console.error(`Proxy ${proxyBase} error:`, proxyError);
          continue; // Try next proxy
        }
      }
      
      // If all methods fail, show error with link to YouTube search
      setError('Unable to automatically load trailer.');
    } catch (err) {
      console.error('Error searching for trailer:', err);
      setError('Unable to load trailer. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setVideoId(null);
    setIsLoading(true);
    setError(null);
    onClose();
  };

  return (
    <Modal
          isOpen={isOpen}
          onClose={handleClose}
          size="5xl"
          scrollBehavior="inside"
          hideCloseButton={false}
          placement="center"
          classNames={{
            base: "bg-black/95 backdrop-blur-xl border border-gray-800 m-0 sm:m-4 max-w-[100vw] sm:max-w-[95vw] md:max-w-[90vw] lg:max-w-[85vw] xl:max-w-[80vw]",
            header: "border-b border-gray-800 px-3 sm:px-6 py-2 sm:py-4",
            body: "p-0 sm:p-4 pb-2 sm:pb-4",
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
              <h2 className="text-base sm:text-xl font-bold text-white truncate pr-2">
                {movieTitle} - Trailer
              </h2>
              <div className="flex items-center gap-2">
                {/* Fullscreen/Exit Fullscreen Button - Show when trailer is loaded, optimized for mobile */}
                {videoId && !isLoading && (
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
                  onClick={handleClose}
                  className="text-white hover:text-red-500 transition-colors p-1 rounded-full hover:bg-white/10 flex-shrink-0"
                >
                  <AiOutlineClose className="text-xl sm:text-2xl" />
                </button>
              </div>
            </ModalHeader>
            <ModalBody className="!pb-2 sm:!pb-4">
              <div 
                ref={containerRef}
                className="relative w-full bg-black rounded-lg overflow-hidden"
                style={{ 
                  paddingBottom: isMobile ? '56.25%' : '70%', // 16:9 on mobile, taller on desktop
                  minHeight: isMobile ? '200px' : '400px', // Smaller on mobile, larger on desktop
                  height: '0'
                }}
              > {/* Responsive height: fits mobile viewport, taller on desktop */}
                {isLoading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50">
                    <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-3"></div>
                    <span className="text-white">Loading trailer...</span>
                  </div>
                )}
                
                {error && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50">
                    <div className="text-center text-white p-6">
                      <p className="text-lg mb-4">{error}</p>
                      <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
                        <button
                          onClick={searchYouTubeTrailer}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
                        >
                          Retry Search
                        </button>
                        <a
                          href={`https://www.youtube.com/results?search_query=${encodeURIComponent(`${movieTitle} ${releaseYear || ''} trailer`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium"
                        >
                          Open YouTube Search
                        </a>
                      </div>
                      {!import.meta.env.VITE_YOUTUBE_API_KEY && (
                        <p className="text-sm text-gray-400 mt-4">
                          Tip: Add VITE_YOUTUBE_API_KEY to your .env file for more reliable results
                        </p>
                      )}
                    </div>
                  </div>
                )}
                
                {videoId && !isLoading && (
                  <iframe
                    className="absolute top-0 left-0 w-full h-full"
                    src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&playsinline=1&modestbranding=1&fs=1`}
                    title={`${movieTitle} Trailer`}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                    allowFullScreen
                  />
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
