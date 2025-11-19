import { useState, useEffect, useRef } from "react";

import { useNavigate } from "react-router-dom";

import PropTypes from "prop-types";

import { motion, AnimatePresence } from "framer-motion";

import { FaPlay } from "react-icons/fa";

import { PiStarFill } from "react-icons/pi";

import { BiChevronLeft, BiChevronRight } from "react-icons/bi";



export default function HeroSlider({ movieData, isMovieDataLoading }) {

  const navigate = useNavigate();



  const filteredMovieData = movieData?.filter(movie =>

    movie.backdrop &&

    movie.backdrop.trim() !== '' &&

    !movie.backdrop.includes('null') &&

    !movie.backdrop.includes('undefined')

  ) || [];



  // State for current hero index (auto-changing)

  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);



  // Auto-change hero banner every 5 seconds

  const [isPaused, setIsPaused] = useState(false);



  // Swipe gesture state

  const touchStartX = useRef(null);

  const touchStartY = useRef(null);

  const touchEndX = useRef(null);

  const touchEndY = useRef(null);

  const minSwipeDistance = 30; // Minimum distance for a swipe (reduced for better sensitivity)

  

  useEffect(() => {

    if (filteredMovieData.length === 0 || isPaused) return;



    const interval = setInterval(() => {

      setCurrentHeroIndex((prevIndex) => 

        (prevIndex + 1) % filteredMovieData.length

      );

    }, 5000); // Change every 5 seconds



    return () => clearInterval(interval);

  }, [filteredMovieData.length, isPaused]);



  // Navigation functions (moved before swipe handlers)

  const goToNext = () => {

    if (filteredMovieData.length === 0) return;

    setCurrentHeroIndex((prevIndex) => 

      (prevIndex + 1) % filteredMovieData.length

    );

    setIsPaused(true);

    setTimeout(() => setIsPaused(false), 10000); // Resume auto-scroll after 10 seconds

  };



  const goToPrevious = () => {

    if (filteredMovieData.length === 0) return;

    setCurrentHeroIndex((prevIndex) => 

      prevIndex === 0 ? filteredMovieData.length - 1 : prevIndex - 1

    );

    setIsPaused(true);

    setTimeout(() => setIsPaused(false), 10000); // Resume auto-scroll after 10 seconds

  };



  // Swipe gesture handlers

  const onTouchStart = (e) => {

    // Don't interfere with button clicks or if no movies

    if (e.target.closest('button') || e.target.closest('a') || filteredMovieData.length <= 1) {

      return;

    }

    touchEndX.current = null;

    touchEndY.current = null;

    touchStartX.current = e.targetTouches[0].clientX;

    touchStartY.current = e.targetTouches[0].clientY;

  };



  const onTouchMove = (e) => {

    if (!touchStartX.current) return;

    

    const currentX = e.targetTouches[0].clientX;

    const currentY = e.targetTouches[0].clientY;

    

    touchEndX.current = currentX;

    touchEndY.current = currentY;

    

    // Prevent scrolling if we're doing a horizontal swipe

    const distanceX = Math.abs(touchStartX.current - currentX);

    const distanceY = Math.abs((touchStartY.current || 0) - currentY);

    

    // If horizontal movement is greater than vertical, prevent default scrolling

    if (distanceX > distanceY && distanceX > 10) {

      e.preventDefault();

      e.stopPropagation();

    }

  };



  const onTouchEnd = (e) => {

    // Don't interfere with button clicks or if no movies

    if (e.target.closest('button') || e.target.closest('a') || filteredMovieData.length <= 1) {

      touchStartX.current = null;

      touchStartY.current = null;

      touchEndX.current = null;

      touchEndY.current = null;

      return;

    }



    if (!touchStartX.current) {

      touchStartX.current = null;

      touchStartY.current = null;

      touchEndX.current = null;

      touchEndY.current = null;

      return;

    }



    // Use changedTouches if available, otherwise use stored values

    const endX = touchEndX.current !== null ? touchEndX.current : (e.changedTouches?.[0]?.clientX || touchStartX.current);

    const endY = touchEndY.current !== null ? touchEndY.current : (e.changedTouches?.[0]?.clientY || touchStartY.current);



    const distanceX = touchStartX.current - endX;

    const distanceY = (touchStartY.current || 0) - (endY || 0);

    const absDistanceX = Math.abs(distanceX);

    const absDistanceY = Math.abs(distanceY);

    

    const isLeftSwipe = distanceX > minSwipeDistance;

    const isRightSwipe = distanceX < -minSwipeDistance;

    const isVerticalSwipe = absDistanceY > absDistanceX;



    // Only handle horizontal swipes, ignore vertical swipes (page scrolling)

    if (!isVerticalSwipe && (isLeftSwipe || isRightSwipe)) {

      if (isLeftSwipe) {

        goToNext();

      } else if (isRightSwipe) {

        goToPrevious();

      }

    }

    

    // Reset

    touchStartX.current = null;

    touchStartY.current = null;

    touchEndX.current = null;

    touchEndY.current = null;

  };



  // Mouse drag handlers for desktop

  const onMouseDown = (e) => {

    // Only start drag if clicking on the background, not on buttons

    if (e.target.closest('button') || e.target.closest('a')) return;

    touchEndX.current = null;

    touchEndY.current = null;

    touchStartX.current = e.clientX;

    touchStartY.current = e.clientY;

  };



  const onMouseMove = (e) => {

    if (touchStartX.current === null) return;

    touchEndX.current = e.clientX;

    touchEndY.current = e.clientY;

  };



  const onMouseUp = (e) => {

    if (!touchStartX.current || touchEndX.current === null) {

      touchStartX.current = null;

      touchStartY.current = null;

      touchEndX.current = null;

      touchEndY.current = null;

      return;

    }

    if (touchStartY.current === null || touchEndY.current === null) {

      touchStartX.current = null;

      touchStartY.current = null;

      touchEndX.current = null;

      touchEndY.current = null;

      return;

    }



    const distanceX = touchStartX.current - touchEndX.current;

    const distanceY = touchStartY.current - touchEndY.current;

    const isLeftSwipe = distanceX > minSwipeDistance;

    const isRightSwipe = distanceX < -minSwipeDistance;

    const isVerticalSwipe = Math.abs(distanceY) > Math.abs(distanceX);



    // Only handle horizontal swipes, ignore vertical swipes (page scrolling)

    if (!isVerticalSwipe) {

      if (isLeftSwipe) {

        goToNext();

      }

      if (isRightSwipe) {

        goToPrevious();

      }

    }

    

    // Reset

    touchStartX.current = null;

    touchStartY.current = null;

    touchEndX.current = null;

    touchEndY.current = null;

  };



  const goToSlide = (index) => {

    if (filteredMovieData.length === 0) return;

    setCurrentHeroIndex(index);

    setIsPaused(true);

    setTimeout(() => setIsPaused(false), 10000); // Resume auto-scroll after 10 seconds

  };



  // Get current hero movie

  const heroMovie = filteredMovieData.length > 0 ? filteredMovieData[currentHeroIndex] : null;



  // Preload next hero image for faster transitions

  useEffect(() => {

    if (filteredMovieData.length > 0) {

      const nextIndex = (currentHeroIndex + 1) % filteredMovieData.length;

      const nextMovie = filteredMovieData[nextIndex];

      if (nextMovie?.backdrop) {

        const link = document.createElement('link');

        link.rel = 'preload';

        link.as = 'image';

        link.href = nextMovie.backdrop;

        document.head.appendChild(link);

        return () => {

          document.head.removeChild(link);

        };

      }

    }

  }, [currentHeroIndex, filteredMovieData]);



  // Format metadata: "2025 • HI | WEBRip"

  const formatMetadata = (movie) => {

    const parts = [];

    if (movie.release_year) parts.push(movie.release_year);

    

    if (movie.languages && movie.languages.length > 0) {

      const lang = movie.languages[0].toUpperCase();

      parts.push(lang);

    }

    

    if (movie.rip) {

      parts.push(movie.rip);

    }

    

    if (parts.length === 0) return null;

    

    // Format: "2025 • HI | WEBRip"

    if (parts.length === 1) return parts[0];

    if (parts.length === 2) return `${parts[0]} • ${parts[1]}`;

    return `${parts[0]} • ${parts[1]} | ${parts[2]}`;

  };



  return (

    <div className="relative w-full mb-0 px-1.5 md:px-3">

      {!isMovieDataLoading && heroMovie ? (

        <div className="relative group">

          <AnimatePresence mode="wait">

            <motion.div

              key={`hero-${heroMovie.tmdb_id}-${currentHeroIndex}`}

              initial={{ opacity: 0 }}

              animate={{ opacity: 1 }}

              exit={{ opacity: 0 }}

              transition={{ duration: 0.5 }}

              className="w-full"

            >

              {/* Hero Banner with Background Image and Overlay Text */}

              <div 

                className="relative w-full mb-6 sm:mb-8 md:mb-10 rounded-2xl sm:rounded-3xl px-0 h-[25vh] sm:h-[28vh] md:h-[60vh] lg:h-[70vh] xl:h-[75vh] border-2 border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.5)] cursor-grab active:cursor-grabbing select-none" 

                style={{ paddingTop: '0', marginTop: '0', marginBottom: '1.5rem', overflow: 'hidden', userSelect: 'none' }}

                onTouchStart={onTouchStart}

                onTouchMove={onTouchMove}

                onTouchEnd={onTouchEnd}

                onMouseDown={onMouseDown}

                onMouseMove={onMouseMove}

                onMouseUp={onMouseUp}

                onMouseLeave={onMouseUp}

              >

            {/* Background Image */}

            <img

              src={heroMovie.backdrop || heroMovie.poster || ''}

              alt={heroMovie.title || 'Movie backdrop'}

              className="absolute inset-0 w-full h-full rounded-2xl sm:rounded-3xl"

              style={{ 

                width: '100%', 

                height: '100%',

                objectFit: 'cover',

                objectPosition: 'center top',

                padding: '0',

                margin: '0',

                display: 'block',

                backgroundColor: '#1a1a1a'

              }}

              loading="eager"

              onLoad={() => {

                // Image loaded successfully

              }}

              onError={(e) => {

                // Try to use poster if backdrop fails

                const currentSrc = e.target.src;

                if (heroMovie.poster && currentSrc !== heroMovie.poster && heroMovie.backdrop) {

                  e.target.src = heroMovie.poster;

                } else if (!heroMovie.backdrop && heroMovie.poster && currentSrc !== heroMovie.poster) {

                  e.target.src = heroMovie.poster;

                } else {

                  // If both fail, keep the image but show a dark background

                  e.target.style.opacity = '0.3';

                }

              }}

            />

            

            {/* Gradient Overlay for Better Text Readability */}

            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent z-0 md:from-black/70 md:via-black/40 md:to-transparent" />

            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-0" />

            

            {/* Overlay Text Content - Positioned at bottom left */}

            <div className="absolute inset-0 z-10 flex items-end justify-start px-2.5 sm:px-3 md:px-4 lg:px-6 pb-3 sm:pb-4 md:pb-6 lg:pb-8">

              <div className="max-w-2xl sm:max-w-3xl space-y-1 sm:space-y-1.5 md:space-y-2">

                {/* Title */}

                <h1 className="text-white font-extrabold text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl leading-tight line-clamp-2 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">

                  {heroMovie.title}

                </h1>



                {/* Description */}

                <p className="text-white/90 text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs leading-relaxed max-w-xl line-clamp-2 drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]">

                  {heroMovie.description || heroMovie.overview || "Inspired by real events, this fictional dramatization shows an incredible journey."}

                </p>



                {/* Action Buttons: Watch and Rating */}

                <div className="flex items-center gap-1.5 sm:gap-2 md:gap-2.5 flex-wrap pt-1 sm:pt-1.5">

                  {/* Watch Button */}

                  <button

                    onClick={() => navigate(`/mov/${heroMovie.tmdb_id}`)}

                    className="flex items-center gap-1.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-2 py-1 sm:px-2.5 sm:py-1.5 md:px-3 md:py-2 rounded-md transition-all duration-300 text-[10px] sm:text-xs md:text-sm font-medium shadow-lg shadow-red-500/50 hover:shadow-red-500/70 border border-red-400/30 hover:border-red-300/50 hover:scale-105"

                  >

                    <FaPlay className="text-[9px] sm:text-[10px] md:text-xs" />

                    <span>Watch</span>

                  </button>



                  {/* Rating */}

                  {heroMovie.rating && (

                    <div className="flex items-center gap-1 bg-black/80 backdrop-blur-sm border border-red-500/30 text-white px-2 py-1 sm:px-2.5 sm:py-1.5 md:px-3 md:py-1.5 rounded-md">

                      <PiStarFill className="text-yellow-400 text-[9px] sm:text-[10px] md:text-xs" />

                      <span className="font-medium text-[10px] sm:text-xs md:text-sm">{heroMovie.rating.toFixed(1)}</span>

                    </div>

                  )}

                </div>

              </div>

            </div>

          </div>

          </motion.div>

        </AnimatePresence>



        {/* Navigation Arrows */}

        {filteredMovieData.length > 1 && (

          <>

            <button

              onClick={goToPrevious}

              className="absolute left-2 top-1/2 transform -translate-y-1/2 z-20 p-2 bg-black/60 backdrop-blur-sm border border-red-500/30 rounded-full text-white hover:bg-black/80 transition-all duration-300 opacity-0 group-hover:opacity-100"

              aria-label="Previous movie"

            >

              <BiChevronLeft className="text-xl" />

            </button>

            <button

              onClick={goToNext}

              className="absolute right-2 top-1/2 transform -translate-y-1/2 z-20 p-2 bg-black/60 backdrop-blur-sm border border-red-500/30 rounded-full text-white hover:bg-black/80 transition-all duration-300 opacity-0 group-hover:opacity-100"

              aria-label="Next movie"

            >

              <BiChevronRight className="text-xl" />

            </button>

          </>

        )}



        {/* Navigation Dots */}

        {filteredMovieData.length > 1 && (

          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 z-20 flex gap-2">

            {filteredMovieData.map((_, index) => (

              <button

                key={index}

                onClick={() => goToSlide(index)}

                className={`w-2 h-2 rounded-full transition-all duration-300 ${

                  index === currentHeroIndex

                    ? 'bg-red-500 w-6'

                    : 'bg-white/40 hover:bg-white/60'

                }`}

                aria-label={`Go to slide ${index + 1}`}

              />

            ))}

          </div>

        )}

        </div>

      ) : (

        <div className="w-full">

          {/* Loading Hero Banner Skeleton */}

          <div className="relative w-full h-[60vh] sm:h-[70vh] md:h-[80vh] bg-gray-800 overflow-hidden animate-pulse">

            <div className="absolute inset-0 flex items-center px-4 sm:px-6 md:px-8 lg:px-12">

              <div className="max-w-3xl space-y-4 sm:space-y-6">

                <div className="h-12 bg-gray-700 rounded-lg w-3/4"></div>

                <div className="h-6 bg-gray-700 rounded-lg w-1/2"></div>

                <div className="flex gap-2">

                  <div className="h-8 bg-gray-700 rounded-lg w-24"></div>

                  <div className="h-8 bg-gray-700 rounded-lg w-24"></div>

                  <div className="h-8 bg-gray-700 rounded-lg w-24"></div>

                </div>

                <div className="h-24 bg-gray-700 rounded-lg w-full max-w-2xl"></div>

                <div className="flex gap-4">

                  <div className="h-10 bg-gray-700 rounded-lg w-32"></div>

                  <div className="h-10 bg-gray-700 rounded-lg w-24"></div>

                </div>

              </div>

            </div>

          </div>

          

        </div>

      )}



      <style>{`

        @keyframes fadeIn {

          from {

            opacity: 0;

            transform: translateY(10px);

          }

          to {

            opacity: 1;

            transform: translateY(0);

          }

        }

        .animate-fadeIn {

          animation: fadeIn 0.5s ease-in-out;

        }

        .scrollbar-hide {

          -ms-overflow-style: none;

          scrollbar-width: none;

        }

        .scrollbar-hide::-webkit-scrollbar {

          display: none;

        }

      `}</style>

    </div>

  );

}



HeroSlider.propTypes = {

  movieData: PropTypes.array,

  isMovieDataLoading: PropTypes.bool

};
