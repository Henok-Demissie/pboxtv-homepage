import React, { useState, useEffect, useRef } from "react";

import MovieCard from "./MovieCard";

import MovieCardSkeleton from "./MovieCardSkeleton";

import { AnimatePresence, motion } from "framer-motion";



export default function MoviesAndSeriesSections(props) {

  const [isGenreDropdownOpen, setIsGenreDropdownOpen] = useState(false);

  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);

  const genreDropdownRef = useRef(null);

  const yearDropdownRef = useRef(null);



  // Generate years list (current year back to 1980)

  const currentYear = new Date().getFullYear();

  const years = Array.from({ length: currentYear - 1979 }, (_, i) => currentYear - i);



  // Close dropdowns when clicking outside

  useEffect(() => {

    const handleClickOutside = (event) => {

      // Close genre dropdown

      if (

        genreDropdownRef.current &&

        !genreDropdownRef.current.contains(event.target) &&

        !event.target.closest('button[class*="rounded-xl"]')

      ) {

        setIsGenreDropdownOpen(false);

      }



      // Close year dropdown

      if (

        yearDropdownRef.current &&

        !yearDropdownRef.current.contains(event.target) &&

        !event.target.closest('button[class*="rounded-xl"]')

      ) {

        setIsYearDropdownOpen(false);

      }

    };



    if (isGenreDropdownOpen || isYearDropdownOpen) {

      document.addEventListener("mousedown", handleClickOutside);

    }



    return () => {

      document.removeEventListener("mousedown", handleClickOutside);

    };

  }, [isGenreDropdownOpen, isYearDropdownOpen]);

  

  const filterOptions = [

    { name: "Latest", value: "updated_on" },

    { name: "Top Rated", value: "rating" },

    { name: "Genre", value: "genre" },

    { name: "Most Watched", value: "views" },

    { name: "A-Z", value: "title" },

    { name: "Year", value: "release_year" },

  ];



  const genres = [

    "Action", "Adventure", "Animation", "Comedy", "Crime", "Documentary",

    "Drama", "Family", "Fantasy", "History", "Horror", "Music", "Mystery",

    "Romance", "Science Fiction", "TV Movie", "Thriller", "War", "Western"

  ];

  

  return (

    <div className="px-4 md:px-6 lg:px-8 movie-section">

      <div className="mb-8">

        <div className="flex items-center justify-between flex-wrap gap-6">

          <div className="flex items-center">

            <div className="w-1 h-8 bg-red-600 rounded-full mr-4"></div>

            <h1 className="text-2xl md:text-3xl font-heading font-bold text-white tracking-wide">

              {props.sectionTitle}

            </h1>

          </div>

          

          {(props.dataType === "movies" || props.dataType === "series") && (

            <div className="flex items-center gap-2 bg-gray-900/60 backdrop-blur-md rounded-2xl p-2 border border-gray-800 overflow-x-auto scrollbar-hide">

              <div className="flex items-center gap-2 min-w-max">

                {filterOptions.map((item, index) => (

                  <button

                    key={index}

                    onClick={() => {

                      if (item.value === "genre") {

                        setIsGenreDropdownOpen(!isGenreDropdownOpen);

                        setIsYearDropdownOpen(false);

                        // Keep genre selected when dropdown opens

                        if (!isGenreDropdownOpen) {

                          props.setMovieFilterVal(item.value);

                        }

                      } else if (item.value === "release_year") {

                        setIsYearDropdownOpen(!isYearDropdownOpen);

                        setIsGenreDropdownOpen(false);

                        // Keep year selected when dropdown opens

                        if (!isYearDropdownOpen) {

                          props.setMovieFilterVal(item.value);

                        }

                      } else if (item.value === "title") {

                        // Toggle A-Z filter

                        if (props.movieFilterVal === "title") {

                          // If A-Z is already selected, undo and go back to previous filter

                          props.setMovieFilterVal(props.previousFilter);

                          props.setMovieFilter(props.previousFilter);

                        } else {

                          // Save current filter as previous, then apply A-Z

                          props.setPreviousFilter(props.movieFilterVal);

                          setIsGenreDropdownOpen(false);

                          setIsYearDropdownOpen(false);

                          props.setMovieFilterVal(item.value);

                          props.setMovieFilter(item.value);

                        }

                      } else {

                        setIsGenreDropdownOpen(false);

                        setIsYearDropdownOpen(false);

                        // Don't save non-A-Z filters as previous if coming from A-Z

                        if (props.movieFilterVal !== "title") {

                          props.setPreviousFilter(props.movieFilterVal);

                        }

                        props.setMovieFilterVal(item.value);

                        props.setMovieFilter(item.value);

                      }

                    }}

                    className={`

                      px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ease-out whitespace-nowrap

                      ${item.value === props.movieFilterVal

                        ? 'bg-red-600 text-white shadow-lg shadow-red-600/25 scale-105'

                        : 'text-gray-300 hover:text-white hover:bg-gray-800'

                      }

                    `}

                  >

                    {item.name}

                  </button>

                ))}

              </div>

            </div>

          )}

        </div>



        {/* Genre Dropdown - Horizontal */}

        <AnimatePresence>

          {isGenreDropdownOpen && props.movieFilterVal === "genre" && (

            <motion.div

              ref={genreDropdownRef}

              initial={{ opacity: 0, y: -10 }}

              animate={{ opacity: 1, y: 0 }}

              exit={{ opacity: 0, y: -10 }}

              transition={{ duration: 0.2 }}

              className="mt-4 mb-4"

            >

              <div className="bg-gray-900/60 backdrop-blur-md rounded-2xl p-4 border border-gray-800">

                <div className="flex items-center gap-2 mb-3">

                  <div className="w-1 h-6 bg-red-600 rounded-full"></div>

                  <h3 className="text-sm font-semibold text-white">Select Genre</h3>

                </div>

                <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2">

                  <div className="flex items-center gap-2 min-w-max">

                    {genres.map((genre, index) => {
                      const isSelected = props.movieFilter === `genre:${genre}`;
                      return (
                        <button
                          key={index}
                          onClick={() => {
                            props.setMovieFilter(`genre:${genre}`);
                            props.setMovieFilterVal("genre");
                            setIsGenreDropdownOpen(false);
                          }}
                          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ease-out whitespace-nowrap border ${
                            isSelected
                              ? 'bg-red-600 text-white border-red-500 shadow-lg shadow-red-600/25 scale-105'
                              : 'bg-gray-800/50 text-gray-300 hover:text-white hover:bg-red-600/50 hover:border-red-500/50 border-gray-700'
                          }`}
                        >
                          {genre}
                        </button>
                      );
                    })}

                  </div>

                </div>

              </div>

            </motion.div>

          )}

        </AnimatePresence>



        {/* Year Dropdown - Horizontal */}

        <AnimatePresence>

          {isYearDropdownOpen && props.movieFilterVal === "release_year" && (

            <motion.div

              ref={yearDropdownRef}

              initial={{ opacity: 0, y: -10 }}

              animate={{ opacity: 1, y: 0 }}

              exit={{ opacity: 0, y: -10 }}

              transition={{ duration: 0.2 }}

              className="mt-4 mb-4"

            >

              <div className="bg-gray-900/60 backdrop-blur-md rounded-2xl p-4 border border-gray-800">

                <div className="flex items-center gap-2 mb-3">

                  <div className="w-1 h-6 bg-red-600 rounded-full"></div>

                  <h3 className="text-sm font-semibold text-white">Select Year</h3>

                </div>

                <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2">

                  <div className="flex items-center gap-2 min-w-max">

                    {years.map((year, index) => (

                      <button

                        key={index}

                        onClick={() => {

                          props.setMovieFilter(`year:${year}`);

                          props.setMovieFilterVal("release_year");

                          setIsYearDropdownOpen(false);

                        }}

                        className="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ease-out whitespace-nowrap bg-gray-800/50 text-gray-300 hover:text-white hover:bg-red-600/50 hover:border-red-500/50 border border-gray-700"

                      >

                        {year}

                      </button>

                    ))}

                  </div>

                </div>

              </div>

            </motion.div>

          )}

        </AnimatePresence>

      </div>

      <div className="relative w-full min-h-screen">

        {!props.isMovieDataLoading && props.movieData?.length > 0 ? (

          <div className="w-full">

            <div className="grid gap-x-2 gap-y-6 grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8">

              {props.movieData.map((movie, index) => {

                // Ensure movie has required properties

                if (!movie) return null;

                return (

                  <div 

                    key={`${movie.tmdb_id || movie.id || index}`} 

                    className="transform transition-all duration-300 hover:scale-105 hover:z-10 group w-full"

                  >

                    <MovieCard movie={movie} delay={index % 20} />

                  </div>

                );

              })}

            </div>

            <div className="mt-8 text-center text-gray-400 text-sm">

              Showing {props.movieData.length} items

            </div>

          </div>

        ) : !props.isMovieDataLoading && (!props.movieData || props.movieData.length === 0) ? (

          <div className="w-full py-12 text-center">

            <p className="text-gray-400 text-lg">No movies or series found.</p>

          </div>

        ) : (

          <MovieCardSkeleton />

        )}

      </div>

    </div>

  );

}
