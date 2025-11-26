import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, A11y, FreeMode } from "swiper/modules";
import MovieCard from "./MovieCard";
import MovieCardSkeleton from "./MovieCardSkeleton";

import "swiper/css";
import "swiper/css/free-mode";
import "react-lazy-load-image-component/src/effects/black-and-white.css";

import { BiChevronRight, BiChevronLeft } from "react-icons/bi";

export default function HomeSection(props) {
  const [isHovered, setIsHovered] = useState({ row1: false, row2: false, row3: false, row4: false });
  const swiperRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

  const slideNext = (rowNumber) => {
    const swiperRef = swiperRefs[rowNumber - 1];
    if (swiperRef.current) {
      swiperRef.current.slideNext();
    }
  };

  const slidePrev = (rowNumber) => {
    const swiperRef = swiperRefs[rowNumber - 1];
    if (swiperRef.current) {
      swiperRef.current.slidePrev();
    }
  };

  const getRowData = (rowNumber) => {
    if (!props.movieData || props.movieData.length === 0) return [];
    
    const maxItemsPerRow = Math.min(15, Math.ceil(props.movieData.length / 4));
    const startIndex = (rowNumber - 1) * maxItemsPerRow;
    const endIndex = startIndex + maxItemsPerRow;
    
    return props.movieData.slice(startIndex, endIndex);
  };

  const renderRow = (rowNumber, rowData) => (
    <div 
      key={rowNumber}
      className="relative group w-screen overflow-hidden mb-2"
      style={{ marginLeft: 'calc(-50vw + 50%)' }}
      onMouseEnter={() => setIsHovered(prev => ({ ...prev, [`row${rowNumber}`]: true }))}
      onMouseLeave={() => setIsHovered(prev => ({ ...prev, [`row${rowNumber}`]: false }))}
    >
      <Swiper
        modules={[Navigation, A11y, FreeMode]}
        spaceBetween={8}
        slidesPerView={3}
        freeMode={true}
        grabCursor={true}
        onSwiper={(swiper) => {
          swiperRefs[rowNumber - 1].current = swiper;
        }}
        breakpoints={{
          480: {
            slidesPerView: 4,
            spaceBetween: 12,
          },
          640: {
            slidesPerView: 5,
            spaceBetween: 16,
          },
          768: {
            slidesPerView: 6,
            spaceBetween: 18,
          },
          1024: {
            slidesPerView: 7,
            spaceBetween: 20,
          },
          1280: {
            slidesPerView: 8,
            spaceBetween: 22,
          },
          1536: {
            slidesPerView: 9,
            spaceBetween: 24,
          },
          1920: {
            slidesPerView: 10,
            spaceBetween: 24,
          },
        }}
        className="movie-slider w-full px-4 md:px-6 lg:px-8"
      >
        {rowData.map((movie, index) => (
          <SwiperSlide key={`${movie.tmdb_id || movie.id || index}`}>
            <MovieCard movie={movie} />
          </SwiperSlide>
        ))}
      </Swiper>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered[`row${rowNumber}`] ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        onClick={() => slidePrev(rowNumber)}
        className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10 p-2 md:p-3 bg-black/80 backdrop-blur-sm border border-white/20 rounded-full text-white hover:bg-black/90 transition-all duration-300"
      >
        <BiChevronLeft className="text-xl md:text-2xl" />
      </motion.button>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered[`row${rowNumber}`] ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        onClick={() => slideNext(rowNumber)}
        className="absolute right-2 top-1/2 transform -translate-y-1/2 z-10 p-2 md:p-3 bg-black/80 backdrop-blur-sm border border-white/20 rounded-full text-white hover:bg-black/90 transition-all duration-300"
      >
        <BiChevronRight className="text-xl md:text-2xl" />
      </motion.button>
    </div>
  );

  return (
    <div className="py-4 md:py-6 movie-section">
      <div className="w-screen px-4 md:px-6 lg:px-8" style={{ marginLeft: 'calc(-50vw + 50%)' }}>
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 md:h-8 bg-red-600 rounded-full" />
            <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-white">
              {props.sectionTitle}
            </h2>
          </div>
          
          <Link
            to={props.sectionSeeMoreButtonLink}
            className="group flex items-center gap-2 text-gray-400 hover:text-white transition-colors duration-300"
          >
            <span className="text-sm font-medium">See All</span>
            <BiChevronRight className="text-lg group-hover:transform group-hover:translate-x-1 transition-transform duration-300" />
          </Link>
        </div>
      </div>

      {!props.isMovieDataLoading && props.movieData?.length > 0 ? (
        <div className="space-y-1">
          {[1, 2, 3, 4].map(rowNumber => {
            const rowData = getRowData(rowNumber);
            return rowData.length > 0 ? renderRow(rowNumber, rowData) : null;
          })}
        </div>
      ) : (
        <div className="w-screen px-4 md:px-6 lg:px-8" style={{ marginLeft: 'calc(-50vw + 50%)' }}>
          <MovieCardSkeleton />
        </div>
      )}
    </div>
  );
}
