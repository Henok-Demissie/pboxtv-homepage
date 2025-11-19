// src/pages/Movies.jsx

import React, { useState, useEffect, useRef } from "react";

import { useLocation } from "react-router-dom";

import axios from "axios";

import { apiService } from "../services/api";

import { SORT_OPTIONS } from "../config/constants";

import MoviesAndSeriesSections from "../components/MoviesAndSeriesSections";

import Pagination from "../components/Pagination";

import SEO from "../components/SEO"; // import SEO



export default function Movies() {

  const BASE = import.meta.env.VITE_BASE_URL; // Base Url for backend

  const SITENAME = import.meta.env.VITE_SITENAME;

  const location = useLocation();

  const hasPreloadedRef = useRef(false);



  // States

  const [movies, setMovies] = useState([]);

  const [isMoviesDataLoading, setIsMoviesDataLoading] = useState(true);

  const [moviesDataForPageCount, setMoviesDataForPageCount] = useState("");

  const [currentPage, setCurrentPage] = useState(1);

  const [movieFilter, setMovieFilter] = useState("updated_on");

  const [movieFilterVal, setMovieFilterVal] = useState("updated_on");

  const [previousFilter, setPreviousFilter] = useState("updated_on");



  // FETCH MOVIE DATA SECTION

  useEffect(() => {

    setIsMoviesDataLoading(true);

    window.scrollTo(0, 0);

    



    // Check if filter is genre-based or year-based

    const isGenreFilter = movieFilter.startsWith("genre:");

    const isYearFilter = movieFilter.startsWith("year:");

    const genreName = isGenreFilter ? movieFilter.split(":")[1] : null;

    const yearValue = isYearFilter ? movieFilter.split(":")[1] : null;

    

    // Determine sort field and direction

    let sortBy = SORT_OPTIONS.UPDATED; // Default

    

    if (movieFilter === "title") {

      sortBy = "title:asc";

    } else if (movieFilter === "rating") {

      sortBy = SORT_OPTIONS.RATING;

    } else if (movieFilter === "views") {

      sortBy = "views:desc";

    } else if (isGenreFilter || isYearFilter) {

      sortBy = SORT_OPTIONS.UPDATED;

    } else if (movieFilter === "updated_on") {

      sortBy = SORT_OPTIONS.UPDATED;

    }



    // Build API params

    const params = {

      sort_by: sortBy,

      page: currentPage,

      page_size: 60, // Increased from 20 to 60 for more movies per page

    };



    // Add genre filter if genre is selected

    if (genreName) {

      params.genre = genreName;

    }



    // Add year filter if year is selected

    if (yearValue) {

      params.year = yearValue;

    }



    // Call database API - try direct axios first, then apiService

    if (BASE) {

      // Try direct API call first to ensure database is called

      axios

        .get(`${BASE}/api/movies`, { params })

        .then((response) => {

          const responseData = response.data || {};

          const moviesData = responseData.movies || responseData.results || [];

          const totalCount = responseData.total_count || responseData.total || moviesData.length || 0;

          

          setMovies(Array.isArray(moviesData) ? moviesData : []);

          setMoviesDataForPageCount(totalCount);

          setIsMoviesDataLoading(false);

        })

        .catch((error) => {

          // Fallback to apiService if direct call fails

          console.warn("Direct API call failed, trying apiService:", error.message);

          apiService.getMovies(params)

            .then((response) => {

              const responseData = response.data || response;

              const moviesData = responseData.movies || responseData.results || responseData || [];

              const totalCount = responseData.total_count || responseData.total || moviesData.length || 0;

              

              setMovies(Array.isArray(moviesData) ? moviesData : []);

              setMoviesDataForPageCount(totalCount);

              setIsMoviesDataLoading(false);

            })

            .catch((fallbackError) => {

              console.error("Error fetching movies:", fallbackError);

              setMovies([]);

              setMoviesDataForPageCount(0);

              setIsMoviesDataLoading(false);

            });

        });

    } else {

      // No BASE_URL, use apiService

      apiService.getMovies(params)

        .then((response) => {

          const responseData = response.data || response;

          const moviesData = responseData.movies || responseData.results || responseData || [];

          const totalCount = responseData.total_count || responseData.total || moviesData.length || 0;

          

          setMovies(Array.isArray(moviesData) ? moviesData : []);

          setMoviesDataForPageCount(totalCount);

          setIsMoviesDataLoading(false);

        })

        .catch((error) => {

          console.error("Error fetching movies:", error);

          setMovies([]);

          setMoviesDataForPageCount(0);

          setIsMoviesDataLoading(false);

        });

    }

  }, [movieFilter, currentPage]);



  // Preload ALL movie posters immediately when data is available - Maximum speed optimization

  useEffect(() => {

    const preloadPosters = () => {

      if (movies && movies.length > 0) {

        movies.forEach((movie, index) => {

          if (movie.poster) {

            const img = new Image();

            img.src = movie.poster;

            img.loading = 'eager';

            img.fetchPriority = index < 40 ? 'high' : 'auto';

            

            // Add preload link for first rows

            if (index < 40) {

              const existingLinks = document.querySelectorAll(`link[href="${movie.poster}"]`);

              existingLinks.forEach(link => link.remove());

              

              const link = document.createElement('link');

              link.rel = 'preload';

              link.as = 'image';

              link.href = movie.poster;

              link.setAttribute('fetchpriority', 'high');

              document.head.appendChild(link);

            }

          }

        });

      }

    };



    preloadPosters();

    const timeoutId = setTimeout(() => {

      preloadPosters();

    }, 100);



    return () => clearTimeout(timeoutId);

  }, [movies]);



  // Force preload on every navigation to movies page

  useEffect(() => {

    if (location.pathname === '/Movies') {

      hasPreloadedRef.current = false;

    }



    const preloadOnMount = () => {

      if (hasPreloadedRef.current) return;

      

      setTimeout(() => {

        if (movies && movies.length > 0) {

          movies.forEach((movie, index) => {

            if (movie.poster) {

              const img = new Image();

              img.src = movie.poster;

              img.loading = 'eager';

              img.fetchPriority = index < 40 ? 'high' : 'auto';

            }

          });

        }

        hasPreloadedRef.current = true;

      }, 50);

    };



    const handleVisibilityChange = () => {

      if (!document.hidden && location.pathname === '/Movies') {

        hasPreloadedRef.current = false;

        preloadOnMount();

      }

    };



    document.addEventListener('visibilitychange', handleVisibilityChange);

    preloadOnMount();



    return () => {

      document.removeEventListener('visibilitychange', handleVisibilityChange);

    };

  }, [location.pathname, movies]);



  return (

    <div>

      {/* SEO SECTION */}

      <SEO

        title={SITENAME}

        description={`Discover a world of entertainment where every show, movie, and exclusive content takes you on a journey beyond the screen. ${SITENAME} offers endless options for every mood, helping you relax, escape, and imagine more. Stream your favorites, dream big, and repeat the experience, only with ${SITENAME}.`}

        name={SITENAME}

        type="text/html"

        keywords="watch movies online, watch hd movies, watch full movies, streaming movies online, free streaming movie, watch movies free, watch hd movies online, watch series online, watch hd series free, free tv series, free movies online, tv online, tv links, tv links movies, free tv shows, watch tv shows online, watch tv shows online free, free hd movies, New Movie Releases, Top Movies of the Year, Watch Movies Online, Streaming Services, Movie Reviews, Upcoming Films, Best Movie Scenes, Classic Movies, HD Movie Streaming, Film Trailers, Action Movies, Drama Films, Comedy Movies, Sci-Fi Films, Horror Movie Picks, Family-Friendly Movies, Award-Winning Films, Movie Recommendations, Cinematic Experiences, Behind-the-Scenes, Director Spotlights, Actor Interviews, Film Festivals, Cult Classics, Top Box Office Hits, Celebrity News, Movie Soundtracks, Oscar-Winning Movies, Movie Trivia, Exclusive Film Content, Best Cinematography, Must-Watch Movies, Film Industry News, Filmmaking Tips, Top Movie Blogs, Latest Movie Gossip, Interactive Movie Quizzes, Red Carpet Moments, IMDb Ratings, Movie Fan Communities, fmovies, fmovies.to, fmovies to, fmovies is, fmovie, free movies, online movie, movie online, free movies online, watch movies online free, free hd movies, watch movies online"

        link={`https://${SITENAME}.com`}

      />

      {/* Movies component */}

      <MoviesAndSeriesSections

        movieData={movies}

        isMovieDataLoading={isMoviesDataLoading}

        dataType="movies"

        sectionTitle="Browse Movies"

        setMovieFilter={setMovieFilter}

        movieFilterVal={movieFilterVal}

        setMovieFilterVal={setMovieFilterVal}

        previousFilter={previousFilter}

        setPreviousFilter={setPreviousFilter}

      />



      {/* Call Pagination Component */}

      <Pagination

        currentPage={currentPage}

        total={moviesDataForPageCount} 

        pagesNum={Math.ceil(moviesDataForPageCount / 60)} 

        onPageChange={(p) => {

          setCurrentPage(p); 

        }}

        limit={60}

      />

    </div>

  );

}
