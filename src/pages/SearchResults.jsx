import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FiSearch, FiFilter, FiGrid, FiList } from "react-icons/fi";
import { BiSortAlt2 } from "react-icons/bi";
import { MdClear } from "react-icons/md";
import MovieCard from "../components/MovieCard";
import SEO from "../components/SEO";

export default function SearchResults() {
  const BASE = import.meta.env.VITE_BASE_URL;
  const SITENAME = import.meta.env.VITE_SITENAME;

  const [movies, setMovies] = useState([]);
  const [isMoviesDataLoading, setIsMoviesDataLoading] = useState(true);
  const [moviesDataForPageCount, setMoviesDataForPageCount] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState("grid");
  const [sortBy, setSortBy] = useState("relevance");
  const [filterType, setFilterType] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [allResults, setAllResults] = useState([]);
  const [clientSearchQuery, setClientSearchQuery] = useState("");
  const [filteredResults, setFilteredResults] = useState([]);

  let { searchResult } = useParams();

  const sortResults = (results, sortType) => {
    const sorted = [...results];
    switch (sortType) {
      case "rating":
        return sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      case "year":
        return sorted.sort((a, b) => (b.release_year || 0) - (a.release_year || 0));
      case "title":
        return sorted.sort((a, b) => a.title.localeCompare(b.title));
      case "relevance": {
        // Sort by relevance based on client search query if available, otherwise use original search term
        const searchTerm = clientSearchQuery.trim() || searchResult;
        if (searchTerm) {
          return sorted.sort((a, b) => {
            const aScore = calculateRelevanceScore(a, searchTerm);
            const bScore = calculateRelevanceScore(b, searchTerm);
            return bScore - aScore;
          });
        }
        return sorted;
      }
      default:
        return sorted;
    }
  };

  const calculateRelevanceScore = (item, query) => {
    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
    let score = 0;

    const title = item.title?.toLowerCase() || '';
    const description = item.description?.toLowerCase() || '';
    const genres = Array.isArray(item.genres) ? item.genres.join(' ').toLowerCase() : '';

    // If no search terms match at all, return 0
    let hasAnyMatch = false;

    searchTerms.forEach(term => {
      let termMatched = false;

      // Create regex for more flexible matching
      const regex = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      const wordBoundaryRegex = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');

      // Title matches get highest score
      if (regex.test(title)) {
        termMatched = true;
        hasAnyMatch = true;

        if (title === term) {
          score += 100; // Exact title match
        } else if (wordBoundaryRegex.test(title)) {
          score += 80; // Exact word boundary match
        } else if (title.startsWith(term)) {
          score += 60; // Title starts with search term
        } else if (title.split(' ').some(word => word === term)) {
          score += 50; // Exact word match in title
        } else if (title.split(' ').some(word => word.startsWith(term))) {
          score += 40; // Word starts with search term
        } else {
          score += 30; // Any title match
        }
      }

      // Description matches get medium score
      if (regex.test(description)) {
        termMatched = true;
        hasAnyMatch = true;
        if (wordBoundaryRegex.test(description)) {
          score += 15; // Word boundary match in description
        } else if (description.split(' ').some(word => word === term)) {
          score += 12; // Exact word match in description
        } else {
          score += 8; // Any description match
        }
      }

      // Genre matches get lower score
      if (regex.test(genres)) {
        termMatched = true;
        hasAnyMatch = true;
        if (wordBoundaryRegex.test(genres)) {
          score += 10; // Word boundary match in genres
        } else {
          score += 5; // Any genre match
        }
      }

      // Bonus for multiple term matches
      if (termMatched) {
        score += 3;
      }
    });

    // If no search terms match anywhere, return 0 to show all results but with lowest priority
    if (!hasAnyMatch) {
      return 0;
    }

    // Bonus for matching more search terms
    const matchedTermsCount = searchTerms.filter(term => {
      const regex = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      return regex.test(title) || regex.test(description) || regex.test(genres);
    }).length;

    score += matchedTermsCount * 10;

    return score;
  };

  const performClientSideSearch = (results, query) => {
    if (!query.trim()) return results;

    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);

    return results.filter(item => {
      const title = item.title?.toLowerCase() || '';
      const description = item.description?.toLowerCase() || '';
      const genres = Array.isArray(item.genres) ? item.genres.join(' ').toLowerCase() : '';

      return searchTerms.every(term =>
        title.includes(term) ||
        description.includes(term) ||
        genres.includes(term)
      );
    });
  };

  const applyFiltersAndSort = (results) => {
    let filtered = results;

    // Apply client-side search first
    if (clientSearchQuery.trim()) {
      filtered = performClientSideSearch(filtered, clientSearchQuery);
    }

    // Apply type filter
    if (filterType !== "all") {
      filtered = filtered.filter(movie => movie.media_type === filterType);
    }

    return sortResults(filtered, sortBy);
  };

  useEffect(() => {
    setIsMoviesDataLoading(true);
    window.scrollTo(0, 0);

    axios
      .get(`${BASE}/api/search/`, {
        params: {
          query: searchResult,
          page: currentPage,
          page_size: 20,
        },
      })
      .then((response) => {
        const results = response.data.results;
        setAllResults(results);
        setMoviesDataForPageCount(response.data.total_count);
        setIsMoviesDataLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching movie data:", error);
        setIsMoviesDataLoading(false);
      });
  }, [searchResult, currentPage, BASE]);

  useEffect(() => {
    if (allResults.length > 0) {
      let filtered = allResults;

      // Apply type filter only (no client search filtering)
      if (filterType !== "all") {
        filtered = filtered.filter(movie => movie.media_type === filterType);
      }

      // Apply sorting - show ALL results but order by relevance
      const sorted = [...filtered];
      switch (sortBy) {
        case "rating":
          sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
          break;
        case "year":
          sorted.sort((a, b) => (b.release_year || 0) - (a.release_year || 0));
          break;
        case "title":
          sorted.sort((a, b) => a.title.localeCompare(b.title));
          break;
        case "relevance": {
          const searchTerm = clientSearchQuery.trim() || searchResult;
          if (searchTerm) {
            // Sort by relevance score - show all results but most relevant first
            sorted.sort((a, b) => {
              const aScore = calculateRelevanceScore(a, searchTerm);
              const bScore = calculateRelevanceScore(b, searchTerm);
              // Put exact matches first, then partial matches, then non-matches last
              if (bScore !== aScore) {
                return bScore - aScore;
              }
              // Secondary sort by title for consistent ordering
              return a.title.localeCompare(b.title);
            });
          }
          break;
        }
        default:
          break;
      }

      setMovies(sorted);
      setFilteredResults(sorted);
    }
  }, [allResults, sortBy, filterType, clientSearchQuery, searchResult]);

  const totalPages = Math.ceil(moviesDataForPageCount / 20);
  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, startPage + 4);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearFilters = () => {
    setSortBy("relevance");
    setFilterType("all");
    setClientSearchQuery("");
    setCurrentPage(1);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900" style={{ margin: 0, padding: 0, width: '100vw', position: 'relative', left: '50%', right: '50%', marginLeft: '-50vw', marginRight: '-50vw' }}>
      <SEO
        title={`${searchResult} - Search Results | ${SITENAME}`}
        description={`Search results for "${searchResult}" on ${SITENAME}. Find movies, TV shows, and series matching your search.`}
        name={SITENAME}
        type="text/html"
        keywords="search movies, find movies, movie search, tv show search, streaming search"
        link={`https://${SITENAME}.com/search/${searchResult}`}
      />

      <div className="w-full pt-20 pb-20 md:pb-8">
        <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 max-w-none">

          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-2">
                  Search Results
                </h1>
                <p className="text-gray-400 text-sm md:text-base">
                  {isMoviesDataLoading ? (
                    "Searching..."
                  ) : (
                    <>
                      {movies.length} of {moviesDataForPageCount} results for{" "}
                      <span className="text-red-400 font-semibold">"{searchResult}"</span>
                      {clientSearchQuery && (
                        <>
                          {" "}filtered by{" "}
                          <span className="text-blue-400 font-semibold">"{clientSearchQuery}"</span>
                        </>
                      )}
                    </>
                  )}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2 bg-gray-800/50 rounded-xl p-1">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 rounded-lg transition-all duration-300 ${viewMode === "grid"
                        ? "bg-red-500 text-white"
                        : "text-gray-400 hover:text-white"
                      }`}
                  >
                    <FiGrid className="text-lg" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 rounded-lg transition-all duration-300 ${viewMode === "list"
                        ? "bg-red-500 text-white"
                        : "text-gray-400 hover:text-white"
                      }`}
                  >
                    <FiList className="text-lg" />
                  </button>
                </div>

                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 rounded-xl text-gray-300 hover:text-white hover:bg-gray-700/50 transition-all duration-300"
                >
                  <FiFilter className="text-lg" />
                  <span className="hidden sm:inline">Filters</span>
                </button>
              </div>
            </div>
          </motion.div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 overflow-hidden"
              >
                <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-gray-700/50">
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div className="flex flex-col sm:flex-row gap-4 flex-1">
                      <div className="flex items-center gap-3 flex-1 max-w-md">
                        <FiSearch className="text-gray-400 text-lg" />
                        <div className="relative flex-1">
                          <input
                            type="text"
                            value={clientSearchQuery}
                            onChange={(e) => setClientSearchQuery(e.target.value)}
                            placeholder="Filter results..."
                            className="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-3 py-2 pl-10 pr-10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50"
                          />
                          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                          {clientSearchQuery && (
                            <button
                              onClick={() => setClientSearchQuery("")}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                            >
                              <MdClear className="text-sm" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <BiSortAlt2 className="text-gray-400 text-lg" />
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value)}
                          className="bg-gray-900/50 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50"
                        >
                          <option value="relevance">Relevance</option>
                          <option value="rating">Rating</option>
                          <option value="year">Year</option>
                          <option value="title">Title</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-3">
                        <FiFilter className="text-gray-400 text-lg" />
                        <select
                          value={filterType}
                          onChange={(e) => setFilterType(e.target.value)}
                          className="bg-gray-900/50 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50"
                        >
                          <option value="all">All Types</option>
                          <option value="movie">Movies</option>
                          <option value="tv">TV Shows</option>
                        </select>
                      </div>
                    </div>

                    <button
                      onClick={clearFilters}
                      className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-400 hover:text-red-300 transition-all duration-300"
                    >
                      <MdClear className="text-lg" />
                      <span className="text-sm">Clear</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {isMoviesDataLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center py-20"
              >
                <div className="text-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-500 mx-auto mb-4"></div>
                  <p className="text-gray-400 text-lg">Searching for "{searchResult}"...</p>
                </div>
              </motion.div>
            ) : movies.length > 0 ? (
              <motion.div
                key="results"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className={`grid gap-4 md:gap-6 ${viewMode === "grid"
                    ? "grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 3xl:grid-cols-9"
                    : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6"
                  }`}
              >
                {movies.map((movie, index) => (
                  <motion.div
                    key={`${movie.tmdb_id}-${index}`}
                    variants={itemVariants}
                    className={`${viewMode === "list" ? "transform hover:scale-105" : ""
                      } transition-transform duration-300`}
                  >
                    <MovieCard movie={movie} />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="no-results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center py-20"
              >
                <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-8 max-w-md mx-auto border border-gray-700/50">
                  <FiSearch className="text-6xl text-gray-600 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-white mb-2">No Results Found</h2>
                  <p className="text-gray-400 mb-6">
                    We couldn't find any results for "{searchResult}". Try adjusting your search terms or filters.
                  </p>
                  <button
                    onClick={clearFilters}
                    className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors duration-300"
                  >
                    Clear Filters
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!isMoviesDataLoading && movies.length > 0 && totalPages > 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-12 flex justify-center"
            >
              <div className="flex items-center gap-2 bg-gray-800/30 backdrop-blur-sm rounded-2xl p-2 border border-gray-700/50">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${currentPage === 1
                      ? "text-gray-500 cursor-not-allowed"
                      : "text-white hover:bg-gray-700/50"
                    }`}
                >
                  Previous
                </button>

                {Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${currentPage === page
                        ? "bg-red-500 text-white"
                        : "text-gray-300 hover:text-white hover:bg-gray-700/50"
                      }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${currentPage === totalPages
                      ? "text-gray-500 cursor-not-allowed"
                      : "text-white hover:bg-gray-700/50"
                    }`}
                >
                  Next
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
