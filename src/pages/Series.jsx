// src/pages/Series.jsx

import React, { useState, useEffect, useRef } from "react";

import { useLocation } from "react-router-dom";

import axios from "axios";

import { apiService } from "../services/api";

import { SORT_OPTIONS } from "../config/constants";

import Pagination from "../components/Pagination";

import MoviesAndSeriesSections from "../components/MoviesAndSeriesSections";

import SEO from "../components/SEO"; // import SEO



export default function Series() {

  const BASE = import.meta.env.VITE_BASE_URL; // Base URL for backend

  const SITENAME = import.meta.env.VITE_SITENAME;

  const location = useLocation();

  const hasPreloadedRef = useRef(false);



  // States

  const [series, setSeries] = useState([]);

  const [isSeriesDataLoading, setIsSeriesDataLoading] = useState(true); 

  const [seriesDataForPageCount, setSeriesDataForPageCount] = useState("");

  const [currentPage, setCurrentPage] = useState(1); 

  const [seriesFilter, setSeriesFilter] = useState("updated_on"); 

  const [seriesFilterVal, setSeriesFilterVal] = useState("updated_on");

  const [previousFilter, setPreviousFilter] = useState("updated_on"); 



  // FETCH SERIES DATA SECTION

  useEffect(() => {

    setIsSeriesDataLoading(true); 

    window.scrollTo(0, 0);

    



    // Check if filter is genre-based or year-based

    const isGenreFilter = seriesFilter && seriesFilter.startsWith("genre:");

    const isYearFilter = seriesFilter && seriesFilter.startsWith("year:");

    const genreName = isGenreFilter ? seriesFilter.split(":")[1] : null;

    const yearValue = isYearFilter ? seriesFilter.split(":")[1] : null;

    

    // Determine sort field and direction

    let sortBy = SORT_OPTIONS.UPDATED; // Default

    

    if (seriesFilter === "title") {

      sortBy = "title:asc";

    } else if (seriesFilter === "rating") {

      sortBy = SORT_OPTIONS.RATING;

    } else if (seriesFilter === "views") {

      sortBy = "views:desc";

    } else if (isGenreFilter || isYearFilter) {

      sortBy = SORT_OPTIONS.UPDATED;

    } else if (seriesFilter === "updated_on") {

      sortBy = SORT_OPTIONS.UPDATED;

    }



    // Build API params

    const params = {

      sort_by: sortBy,

      page: currentPage,

      page_size: 60, // Increased from 20 to 60 for more series per page

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

        .get(`${BASE}/api/tvshows`, { params })

        .then((response) => {

          const responseData = response.data || {};

          let seriesData = responseData.tv_shows || responseData.tvshows || responseData.results || [];

          // Perfect client-side genre filtering - always apply for accuracy
          if (genreName && seriesData.length > 0) {
            const formattedGenre = genreName.trim().toLowerCase();
            
            // Genre normalization map for better matching
            const genreMap = {
              'science fiction': ['science fiction', 'sci-fi', 'scifi', 'sf'],
              'sci-fi': ['science fiction', 'sci-fi', 'scifi', 'sf'],
              'tv movie': ['tv movie', 'tv', 'television movie'],
              'romance': ['romance', 'romantic'],
              'action': ['action'],
              'adventure': ['adventure'],
              'animation': ['animation', 'animated'],
              'comedy': ['comedy', 'comedies'],
              'crime': ['crime'],
              'documentary': ['documentary', 'documentaries'],
              'drama': ['drama', 'dramas'],
              'family': ['family'],
              'fantasy': ['fantasy'],
              'history': ['history', 'historical'],
              'horror': ['horror'],
              'music': ['music', 'musical'],
              'mystery': ['mystery', 'mysteries'],
              'thriller': ['thriller', 'thrillers'],
              'war': ['war'],
              'western': ['western', 'westerns']
            };
            
            const genreVariations = genreMap[formattedGenre] || [formattedGenre];
            
            const filteredSeries = seriesData.filter(series => {
              if (!series.genres || (Array.isArray(series.genres) && series.genres.length === 0)) {
                return false;
              }
              
              // Normalize series genres
              let seriesGenres = [];
              if (Array.isArray(series.genres)) {
                seriesGenres = series.genres.map(g => {
                  if (typeof g === 'string') {
                    return g.trim().toLowerCase();
                  } else if (g && typeof g === 'object') {
                    return (g.name || g.genre || '').trim().toLowerCase();
                  }
                  return '';
                }).filter(g => g.length > 0);
              } else if (typeof series.genres === 'string') {
                seriesGenres = series.genres.split(',').map(g => g.trim().toLowerCase()).filter(g => g.length > 0);
              }
              
              // Check for exact match or variation match
              return seriesGenres.some(seriesGenre => {
                // Exact match
                if (seriesGenre === formattedGenre) return true;
                
                // Check against genre variations
                return genreVariations.some(variation => {
                  if (seriesGenre === variation) return true;
                  // Handle compound genres like "Science Fiction" matching "Sci-Fi"
                  if (seriesGenre.includes(variation) || variation.includes(seriesGenre)) {
                    // Only match if it's a complete word match (not partial)
                    const regex = new RegExp(`\\b${variation.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
                    return regex.test(seriesGenre);
                  }
                  return false;
                });
              });
            });
            
            // Always use filtered results for perfect filtering
            seriesData = filteredSeries;
            
            console.log(`Perfect genre filter applied (Series): ${genreName}`, {
              originalCount: responseData.tv_shows?.length || responseData.tvshows?.length || responseData.results?.length || 0,
              filteredCount: filteredSeries.length,
              genreVariations: genreVariations
            });
          }

          const totalCount = genreName && seriesData.length < (responseData.total_count || responseData.total || 0)
            ? seriesData.length 
            : (responseData.total_count || responseData.total || seriesData.length || 0);

          setSeries(Array.isArray(seriesData) ? seriesData : []);

          setSeriesDataForPageCount(totalCount);

          setIsSeriesDataLoading(false);

        })

        .catch((error) => {

          // Fallback to apiService if direct call fails

          console.warn("Direct API call failed, trying apiService:", error.message);

          apiService.getTVShows(params)

            .then((response) => {

              const responseData = response.data || response;

              let seriesData = responseData.tv_shows || responseData.tvshows || responseData.results || responseData || [];

              // Perfect client-side genre filtering
              if (genreName && seriesData.length > 0) {
                const formattedGenre = genreName.trim().toLowerCase();
                
                const genreMap = {
                  'science fiction': ['science fiction', 'sci-fi', 'scifi', 'sf'],
                  'sci-fi': ['science fiction', 'sci-fi', 'scifi', 'sf'],
                  'tv movie': ['tv movie', 'tv', 'television movie'],
                  'romance': ['romance', 'romantic'],
                  'action': ['action'],
                  'adventure': ['adventure'],
                  'animation': ['animation', 'animated'],
                  'comedy': ['comedy', 'comedies'],
                  'crime': ['crime'],
                  'documentary': ['documentary', 'documentaries'],
                  'drama': ['drama', 'dramas'],
                  'family': ['family'],
                  'fantasy': ['fantasy'],
                  'history': ['history', 'historical'],
                  'horror': ['horror'],
                  'music': ['music', 'musical'],
                  'mystery': ['mystery', 'mysteries'],
                  'thriller': ['thriller', 'thrillers'],
                  'war': ['war'],
                  'western': ['western', 'westerns']
                };
                
                const genreVariations = genreMap[formattedGenre] || [formattedGenre];
                
                const filteredSeries = seriesData.filter(series => {
                  if (!series.genres || (Array.isArray(series.genres) && series.genres.length === 0)) {
                    return false;
                  }
                  
                  let seriesGenres = [];
                  if (Array.isArray(series.genres)) {
                    seriesGenres = series.genres.map(g => {
                      if (typeof g === 'string') {
                        return g.trim().toLowerCase();
                      } else if (g && typeof g === 'object') {
                        return (g.name || g.genre || '').trim().toLowerCase();
                      }
                      return '';
                    }).filter(g => g.length > 0);
                  } else if (typeof series.genres === 'string') {
                    seriesGenres = series.genres.split(',').map(g => g.trim().toLowerCase()).filter(g => g.length > 0);
                  }
                  
                  return seriesGenres.some(seriesGenre => {
                    if (seriesGenre === formattedGenre) return true;
                    return genreVariations.some(variation => {
                      if (seriesGenre === variation) return true;
                      if (seriesGenre.includes(variation) || variation.includes(seriesGenre)) {
                        const regex = new RegExp(`\\b${variation.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
                        return regex.test(seriesGenre);
                      }
                      return false;
                    });
                  });
                });
                
                seriesData = filteredSeries;
              }

              const totalCount = responseData.total_count || responseData.total || seriesData.length || 0;

              setSeries(Array.isArray(seriesData) ? seriesData : []);

              setSeriesDataForPageCount(totalCount);

              setIsSeriesDataLoading(false);

            })

            .catch((fallbackError) => {

              console.error("Error fetching series:", fallbackError);

              setSeries([]);

              setSeriesDataForPageCount(0);

              setIsSeriesDataLoading(false);

            });

        });

    } else {

      // No BASE_URL, use apiService

      apiService.getTVShows(params)

        .then((response) => {

          const responseData = response.data || response;

          let seriesData = responseData.tv_shows || responseData.tvshows || responseData.results || responseData || [];

          // Perfect client-side genre filtering
          if (genreName && seriesData.length > 0) {
            const formattedGenre = genreName.trim().toLowerCase();
            
            const genreMap = {
              'science fiction': ['science fiction', 'sci-fi', 'scifi', 'sf'],
              'sci-fi': ['science fiction', 'sci-fi', 'scifi', 'sf'],
              'tv movie': ['tv movie', 'tv', 'television movie'],
              'romance': ['romance', 'romantic'],
              'action': ['action'],
              'adventure': ['adventure'],
              'animation': ['animation', 'animated'],
              'comedy': ['comedy', 'comedies'],
              'crime': ['crime'],
              'documentary': ['documentary', 'documentaries'],
              'drama': ['drama', 'dramas'],
              'family': ['family'],
              'fantasy': ['fantasy'],
              'history': ['history', 'historical'],
              'horror': ['horror'],
              'music': ['music', 'musical'],
              'mystery': ['mystery', 'mysteries'],
              'thriller': ['thriller', 'thrillers'],
              'war': ['war'],
              'western': ['western', 'westerns']
            };
            
            const genreVariations = genreMap[formattedGenre] || [formattedGenre];
            
            const filteredSeries = seriesData.filter(series => {
              if (!series.genres || (Array.isArray(series.genres) && series.genres.length === 0)) {
                return false;
              }
              
              let seriesGenres = [];
              if (Array.isArray(series.genres)) {
                seriesGenres = series.genres.map(g => {
                  if (typeof g === 'string') {
                    return g.trim().toLowerCase();
                  } else if (g && typeof g === 'object') {
                    return (g.name || g.genre || '').trim().toLowerCase();
                  }
                  return '';
                }).filter(g => g.length > 0);
              } else if (typeof series.genres === 'string') {
                seriesGenres = series.genres.split(',').map(g => g.trim().toLowerCase()).filter(g => g.length > 0);
              }
              
              return seriesGenres.some(seriesGenre => {
                if (seriesGenre === formattedGenre) return true;
                return genreVariations.some(variation => {
                  if (seriesGenre === variation) return true;
                  if (seriesGenre.includes(variation) || variation.includes(seriesGenre)) {
                    const regex = new RegExp(`\\b${variation.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
                    return regex.test(seriesGenre);
                  }
                  return false;
                });
              });
            });
            
            seriesData = filteredSeries;
          }

          const totalCount = responseData.total_count || responseData.total || seriesData.length || 0;

          setSeries(Array.isArray(seriesData) ? seriesData : []);

          setSeriesDataForPageCount(totalCount);

          setIsSeriesDataLoading(false);

        })

        .catch((error) => {

          console.error("Error fetching series:", error);

          setSeries([]);

          setSeriesDataForPageCount(0);

          setIsSeriesDataLoading(false);

        });

    }

  }, [seriesFilter, currentPage, BASE]);

  // Reset to page 1 when filter changes
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [seriesFilter]);



  // Optimized preload - only preload visible items
  useEffect(() => {
    if (!series || series.length === 0) return;

    // Use Intersection Observer for lazy loading optimization
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
            imageObserver.unobserve(img);
          }
        }
      });
    }, {
      rootMargin: '50px'
    });

    // Preload only first 20 posters immediately
    series.slice(0, 20).forEach((item, index) => {
      if (item.poster) {
        const img = new Image();
        img.src = item.poster;
        img.loading = index < 10 ? 'eager' : 'lazy';
        img.fetchPriority = index < 10 ? 'high' : 'auto';
      }
    });

    return () => {
      imageObserver.disconnect();
    };
  }, [series]);



  // Optimized preload on navigation
  useEffect(() => {
    if (location.pathname === '/Series') {
      hasPreloadedRef.current = false;
      // Reset loading state when navigating to series page
      setIsSeriesDataLoading(true);
    }
  }, [location.pathname]);



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

      {/* Series component */}

      <MoviesAndSeriesSections

        movieData={series}

        isMovieDataLoading={isSeriesDataLoading}

        dataType="series"

        sectionTitle="Browse Series"

        setMovieFilter={setSeriesFilter}

        movieFilterVal={seriesFilterVal}

        setMovieFilterVal={setSeriesFilterVal}

        previousFilter={previousFilter}

        setPreviousFilter={setPreviousFilter}

      />



      {/* Call Pagination Component */}

      <Pagination

        currentPage={currentPage}

        total={seriesDataForPageCount} 

        pagesNum={Math.ceil(seriesDataForPageCount / 60)} 

        onPageChange={(p) => {

          setCurrentPage(p); 

        }}

        limit={60}

      />

    </div>

  );

}
