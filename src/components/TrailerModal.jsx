import React, { useState, useEffect, useRef } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody } from "@nextui-org/modal";
import { AiOutlineClose } from "react-icons/ai";
import { BiFullscreen, BiExitFullscreen } from "react-icons/bi";

const TrailerModal = ({ isOpen, onClose, movieTitle, releaseYear }) => {
  const [videoId, setVideoId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isFullscreen, setnbnIsFullscreen] = useState(false);
  const containerRef = useRef(null);
  const iframeRef = useRef(null);

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

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const iframe = iframeRef.current;

    if (!isFullscreen) {
      // Enter fullscreen
      try {
        // Try to fullscreen the iframe first (works better for YouTube)
        if (iframe) {
          if (iframe.requestFullscreen) {
            await iframe.requestFullscreen();
            return;
          } else if (iframe.webkitRequestFullscreen) {
            await iframe.webkitRequestFullscreen();
            return;
          } else if (iframe.mozRequestFullScreen) {
            await iframe.mozRequestFullScreen();
            return;
          } else if (iframe.msRequestFullscreen) {
            await iframe.msRequestFullscreen();
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
    setVideoId(null);
    setIsLoading(true);
    setError(null);
    setIsFullscreen(false);
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
            base: `bg-black/95 backdrop-blur-xl border border-gray-800 m-0 sm:m-4 max-w-[100vw] sm:max-w-[95vw] md:max-w-[90vw] lg:max-w-[85vw] xl:max-w-[80vw] ${isFullscreen && isMobile ? '!fixed !inset-0 !m-0 !max-w-none !w-screen !h-screen !rounded-none !border-0' : ''}`,
            header: `border-b border-gray-800 px-3 sm:px-6 py-2 sm:py-4 ${isFullscreen && isMobile ? '!hidden' : ''}`,
            body: `p-0 sm:p-4 pb-2 sm:pb-4 ${isFullscreen && isMobile ? '!p-0' : ''}`,
            wrapper: `p-0 sm:p-4 ${isFullscreen && isMobile ? '!p-0' : ''}`,
            backdrop: `bg-black/80 ${isFullscreen && isMobile ? '!bg-black' : ''}`
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
            <ModalHeader className={`flex items-center justify-between ${isFullscreen && isMobile ? 'hidden' : ''}`}>
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
            <ModalBody className={`!pb-2 sm:!pb-4 ${isFullscreen && isMobile ? '!p-0' : ''}`}>
              {/* Exit Fullscreen Button - Only visible in fullscreen on mobile */}
              {isFullscreen && isMobile && (
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
              <div 
                ref={containerRef}
                className={`relative w-full bg-black ${isFullscreen && isMobile ? 'fixed inset-0 w-screen h-screen z-[9999] rounded-none' : 'rounded-lg overflow-hidden'}`}
                style={isFullscreen && isMobile ? {
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
                  paddingBottom: isMobile ? '56.25%' : '70%',
                  minHeight: isMobile ? '200px' : '400px',
                  height: '0'
                }}
              >
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
                    ref={iframeRef}
                    className={`absolute top-0 left-0 ${isFullscreen && isMobile ? 'w-screen h-screen' : 'w-full h-full'}`}
                    src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&playsinline=1&modestbranding=1&fs=1&enablejsapi=1`}
                    title={`${movieTitle} Trailer`}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                    allowFullScreen
                    style={isFullscreen && isMobile ? {
                      width: '100vw',
                      height: '100vh',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      border: 'none',
                      borderRadius: 0
                    } : {}}
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
