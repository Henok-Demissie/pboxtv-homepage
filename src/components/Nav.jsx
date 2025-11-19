import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LazyLoadImage } from "react-lazy-load-image-component";
import "react-lazy-load-image-component/src/effects/black-and-white.css";

import { FiSearch } from "react-icons/fi";
import { VscClose } from "react-icons/vsc";
import { BiHomeAlt2, BiSolidMovie, BiStar, BiBot, BiListUl, BiUser, BiPlay, BiMenu } from "react-icons/bi";
import { BsTv, BsTelegram } from "react-icons/bs";
import { RiMovie2Line, RiRobot2Fill } from "react-icons/ri";
import { IoTvOutline, IoClose, IoPaperPlaneOutline } from "react-icons/io5";
import { AiOutlineHome, AiOutlineQuestionCircle, AiFillHeart, AiOutlineHeart } from "react-icons/ai";
import { MdPlayArrow, MdKeyboardArrowRight, MdSupportAgent, MdHistory, MdPlayCircleOutline, MdPause, MdSettings, MdAccountCircle } from "react-icons/md";
import posterPlaceholder from "../assets/images/poster-placeholder.png";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { getFromStorage, saveToStorage } from "../utils/helpers";
import { useAuth } from "../context/AuthContext";

export default function Nav() {
  const BASE = import.meta.env.VITE_BASE_URL;
  const SITENAME = import.meta.env.VITE_SITENAME;
  const navigate = useNavigate();
  const location = useLocation();

  const [query, setQuery] = React.useState("");
  const [debouncedVal, setDebouncedVal] = React.useState("");
  const [searcResult, setSearchResult] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [navStatus, setNavStatus] = useState("Home");
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [showQuickResults, setShowQuickResults] = useState(false);
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  const [favorites, setFavorites] = useLocalStorage('favorites', []);
  const [recentlyViewed, setRecentlyViewed] = useLocalStorage('recentlyViewed', []);
  const [resumeWatching, setResumeWatching] = useLocalStorage('resumeWatching', []);
  const [resumeMovies, setResumeMovies] = useLocalStorage('resumeMovies', []);
  const [myListDropdownOpen, setMyListDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const myListDropdownRef = useRef();
  const userDropdownRef = useRef();
  const mobileMenuRef = useRef();
  
  // Get auth context (will use default values if AuthProvider is not available)
  const { logout, user, userProfile, isAuthenticated } = useAuth();

  // Load search history from localStorage on component mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('searchHistory');
    if (savedHistory) {
      setSearchHistory(JSON.parse(savedHistory));
    }
  }, []);

  // Listen for favorites updates
  useEffect(() => {
    const handleFavoritesUpdate = () => {
      const updatedFavorites = getFromStorage('favorites', []);
      setFavorites(updatedFavorites);
    };
    
    window.addEventListener('favoritesUpdated', handleFavoritesUpdate);
    window.addEventListener('storage', handleFavoritesUpdate);
    
    return () => {
      window.removeEventListener('favoritesUpdated', handleFavoritesUpdate);
      window.removeEventListener('storage', handleFavoritesUpdate);
    };
  }, [setFavorites]);

  // Listen for recently viewed updates
  useEffect(() => {
    const handleRecentlyViewedUpdate = () => {
      const updatedRecentlyViewed = getFromStorage('recentlyViewed', []);
      setRecentlyViewed(updatedRecentlyViewed);
    };
    
    window.addEventListener('recentlyViewedUpdated', handleRecentlyViewedUpdate);
    window.addEventListener('storage', handleRecentlyViewedUpdate);
    
    return () => {
      window.removeEventListener('recentlyViewedUpdated', handleRecentlyViewedUpdate);
      window.removeEventListener('storage', handleRecentlyViewedUpdate);
    };
  }, [setRecentlyViewed]);

  // Listen for resume movies updates
  useEffect(() => {
    const handleResumeMoviesUpdate = () => {
      const updatedResumeMovies = getFromStorage('resumeMovies', []);
      setResumeMovies(updatedResumeMovies);
    };
    
    window.addEventListener('resumeMoviesUpdated', handleResumeMoviesUpdate);
    window.addEventListener('storage', handleResumeMoviesUpdate);
    
    return () => {
      window.removeEventListener('resumeMoviesUpdated', handleResumeMoviesUpdate);
      window.removeEventListener('storage', handleResumeMoviesUpdate);
    };
  }, [setResumeMovies]);

  // Save search to history
  const saveToHistory = (searchTerm) => {
    if (!searchTerm.trim()) return;

    const newHistory = [searchTerm, ...searchHistory.filter(term => term !== searchTerm)].slice(0, 10);
    setSearchHistory(newHistory);
    localStorage.setItem('searchHistory', JSON.stringify(newHistory));
  };

  // Clear search history
  const clearSearchHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('searchHistory');
  };

  // Remove single history item
  const removeHistoryItem = (index) => {
    const newHistory = searchHistory.filter((_, i) => i !== index);
    setSearchHistory(newHistory);
    localStorage.setItem('searchHistory', JSON.stringify(newHistory));
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const path = location.pathname;
    if (path === "/") {
      setNavStatus("Home");
    } else if (path.startsWith("/mov") || path.startsWith("/Movies")) {
      setNavStatus("Movies");
    } else if (path.startsWith("/ser") || path.startsWith("/Series")) {
      setNavStatus("Series");
    } else if (path.startsWith("/mylist")) {
      setNavStatus("My List");
    } else if (path.startsWith("/search")) {
      setNavStatus("Search");
    }
  }, [location.pathname]);

  useEffect(() => {
    if (debouncedVal.trim()) {
      setIsLoading(true);
      setShowQuickResults(true);
      fetch(`${BASE}/api/search/?query=${debouncedVal}&page=1`)
        .then((search_res) => search_res.json())
        .then((search_data) => {
          setSearchResult(search_data.results || []);
          setIsLoading(false);
        })
        .catch((error) => {
          console.error("Search error:", error);
          setIsLoading(false);
          setSearchResult([]);
        });
    } else {
      setSearchResult([]);
      setShowQuickResults(false);
      setIsLoading(false);
    }
  }, [debouncedVal, BASE]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedVal(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      saveToHistory(query.trim());
      navigate(`/search/${encodeURIComponent(query.trim())}`);
      setQuery("");
      setShowQuickResults(false);
      setMobileSearchOpen(false);
      setSearchDialogOpen(false);
    }
  };

  const handleHistorySearch = (searchTerm) => {
    navigate(`/search/${encodeURIComponent(searchTerm)}`);
    setQuery("");
    setSearchDialogOpen(false);
    setMobileSearchOpen(false);
  };

  const handleQuickResultClick = (result) => {
    setQuery("");
    setShowQuickResults(false);
    setMobileSearchOpen(false);
    navigate(
      result.media_type === "movie"
        ? `/mov/${result.tmdb_id}`
        : `/ser/${result.tmdb_id}`
    );
  };

  const handleViewAllResults = () => {
    if (debouncedVal.trim()) {
      navigate(`/search/${encodeURIComponent(debouncedVal.trim())}`);
      setQuery("");
      setShowQuickResults(false);
      setMobileSearchOpen(false);
    }
  };

  let closeSearchResultsDropDown = useRef();
  let searchDialogRef = useRef();
  let searchInputRef = useRef();

  useEffect(() => {
    let closeSearchResultsDropdownHandler = (event) => {
      if (
        closeSearchResultsDropDown.current &&
        !closeSearchResultsDropDown.current.contains(event.target)
      ) {
        setShowQuickResults(false);
      }

      // Close search dialog when clicking outside
      if (
        searchDialogRef.current &&
        !searchDialogRef.current.contains(event.target) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target)
      ) {
        setSearchDialogOpen(false);
      }

      // Close my list dropdown when clicking outside
      if (
        myListDropdownRef.current &&
        !myListDropdownRef.current.contains(event.target)
      ) {
        setMyListDropdownOpen(false);
      }

      // Close user dropdown when clicking outside
      if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(event.target)
      ) {
        setUserDropdownOpen(false);
      }

      // Close mobile menu when clicking outside
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target)
      ) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", closeSearchResultsDropdownHandler);
    return () => {
      document.removeEventListener("mousedown", closeSearchResultsDropdownHandler);
    };
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSearch(e);
    } else if (e.key === "Escape") {
      setShowQuickResults(false);
      setMobileSearchOpen(false);
      setSearchDialogOpen(false);
      setMyListDropdownOpen(false);
      setUserDropdownOpen(false);
      setMobileMenuOpen(false);
    }
  };

  // Handle favorite click - track as recently viewed
  const handleFavoriteClick = (fav) => {
    setMyListDropdownOpen(false);
    const currentRecentlyViewed = getFromStorage('recentlyViewed', []);
    const updatedRecentlyViewed = [
      {
        tmdb_id: fav.tmdb_id,
        title: fav.title,
        poster: fav.poster,
        release_year: fav.release_year,
        media_type: fav.media_type || 'movie',
        viewed_at: new Date().toISOString()
      },
      ...currentRecentlyViewed.filter(item => item.tmdb_id !== fav.tmdb_id)
    ].slice(0, 20);
    saveToStorage('recentlyViewed', updatedRecentlyViewed);
    setRecentlyViewed(updatedRecentlyViewed);
    // Dispatch event for cross-component updates
    window.dispatchEvent(new CustomEvent('recentlyViewedUpdated'));
  };

  // Handle recently viewed click - update timestamp
  const handleRecentlyViewedClick = (item) => {
    setMyListDropdownOpen(false);
    const currentRecentlyViewed = getFromStorage('recentlyViewed', []);
    const updatedRecentlyViewed = [
      {
        ...item,
        viewed_at: new Date().toISOString()
      },
      ...currentRecentlyViewed.filter(i => i.tmdb_id !== item.tmdb_id)
    ].slice(0, 20);
    saveToStorage('recentlyViewed', updatedRecentlyViewed);
    setRecentlyViewed(updatedRecentlyViewed);
    // Dispatch event for cross-component updates
    window.dispatchEvent(new CustomEvent('recentlyViewedUpdated'));
  };

  // Handle resume watching click
  const handleResumeWatchingClick = (item) => {
    setMyListDropdownOpen(false);
    const currentRecentlyViewed = getFromStorage('recentlyViewed', []);
    const updatedRecentlyViewed = [
      {
        tmdb_id: item.tmdb_id,
        title: item.title,
        poster: item.poster,
        release_year: item.release_year,
        media_type: item.media_type || 'movie',
        viewed_at: new Date().toISOString()
      },
      ...currentRecentlyViewed.filter(i => i.tmdb_id !== item.tmdb_id)
    ].slice(0, 20);
    saveToStorage('recentlyViewed', updatedRecentlyViewed);
    setRecentlyViewed(updatedRecentlyViewed);
    // Dispatch event for cross-component updates
    window.dispatchEvent(new CustomEvent('recentlyViewedUpdated'));
  };

  const navItems = [
    { icon: BiHomeAlt2, mobileIcon: AiOutlineHome, name: "Home", path: "/" },
    { icon: BiSolidMovie, mobileIcon: RiMovie2Line, name: "Movies", path: "/Movies" },
    { icon: BsTv, mobileIcon: IoTvOutline, name: "Series", path: "/Series" },
    { icon: BiListUl, mobileIcon: BiListUl, name: "My List", path: "#", isMyList: true },
  ];

  const mobileNavItems = [
    { icon: AiOutlineHome, name: "Home", path: "/" },
    { icon: RiMovie2Line, name: "Movies", path: "/Movies" },
    { icon: RiRobot2Fill, name: "Bot", path: "https://t.me/pboxmoviebot", external: true },
    { icon: IoTvOutline, name: "Series", path: "/Series" },
    { icon: MdSupportAgent, name: "Support", path: "https://t.me/pboxtv", external: true },
  ];

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed flex items-center justify-between w-screen z-50 top-0 left-0 py-4 text-white bg-black"
      >
        {/* Left Section - Branding */}
        <Link
          to="/"
          className="hidden md:flex items-center gap-3 pl-4 lg:pl-6"
        >
          <div className="bg-red-600 p-2.5 rounded-md">
            <MdPlayArrow className="text-white text-xl" />
          </div>
          <div>
            <h1 className="text-xl lg:text-2xl font-bold">
              <span className="text-red-500">Pbox</span><span className="text-white">Tv</span>
            </h1>
            <p className="text-xs text-white -mt-1">Your Movie Hub</p>
          </div>
        </Link>

        {/* Middle Section - Primary Navigation */}
        <nav className="hidden lg:flex items-center gap-2 ml-8">
          {navItems.map((navItem, index) => {
            if (navItem.isMyList) {
              return (
                <div key={index} className="relative" ref={myListDropdownRef}>
                  <button
                    onClick={() => {
                      setNavStatus("My List");
                      setMyListDropdownOpen(!myListDropdownOpen);
                    }}
                    className={`relative flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                      navStatus === "My List"
                        ? "text-white"
                        : "text-white hover:bg-white/5"
                    }`}
                  >
                    {navStatus === "My List" && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-red-900 rounded-lg border-2 border-red-500 shadow-[0_0_20px_rgba(239,68,68,1),0_0_40px_rgba(239,68,68,0.5)]"
                        initial={false}
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 35,
                          duration: 0.6
                        }}
                      />
                    )}
                    <navItem.icon className="text-lg relative z-10" />
                    <span className="text-sm font-medium relative z-10">{navItem.name}</span>
                  </button>

                  {/* My List Dropdown */}
                  <AnimatePresence>
                    {myListDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="absolute top-full right-0 mt-2 w-72 z-50"
                      >
                        <div className="bg-black border-2 border-red-500/60 rounded-xl shadow-2xl shadow-red-500/20 shadow-black/50 overflow-hidden max-h-[400px] flex flex-col">
                          {/* Header */}
                          <div className="p-2 bg-black border-b border-red-500/30 flex-shrink-0">
                            <div className="flex items-center gap-2">
                              <div className="p-1 bg-red-500/20 rounded-lg border border-red-500/30">
                                <BiListUl className="text-red-400 text-sm" />
                              </div>
                              <div>
                                <h2 className="text-white font-bold text-xs">My List</h2>
                                <p className="text-gray-500 text-[9px]">Your personal collection</p>
                              </div>
                            </div>
                          </div>

                          {/* Scrollable Content */}
                          <div className="overflow-y-auto scrollbar-hide flex-1">
                            {/* Favorites Section */}
                            <div className="p-2 border-b border-red-500/20 bg-black">
                              <motion.div 
                                className="flex items-center gap-1.5 mb-2"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 }}
                              >
                                <div className="p-0.5 bg-red-500/20 rounded border border-red-500/30">
                                  <AiFillHeart className="text-red-400 text-xs" />
                                </div>
                                <h3 className="text-white font-bold text-[10px] flex-1">Favorites</h3>
                                <span className="px-1 py-0.5 bg-red-500/20 border border-red-500/30 rounded-full text-red-300 text-[9px] font-semibold">
                                  {favorites.length}
                                </span>
                              </motion.div>
                              {favorites.length > 0 ? (
                                <div className="space-y-1.5 max-h-[150px] overflow-y-auto scrollbar-hide pr-1">
                                  {favorites.map((fav, idx) => (
                                    <motion.div
                                      key={idx}
                                      initial={{ opacity: 0, x: -10 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: 0.15 + idx * 0.05 }}
                                      className="group relative"
                                    >
                                      <Link
                                        to={fav.media_type === 'movie' ? `/mov/${fav.tmdb_id}` : `/ser/${fav.tmdb_id}`}
                                        onClick={() => handleFavoriteClick(fav)}
                                        className="flex items-center gap-1.5 p-1.5 rounded-lg hover:bg-gray-900 border border-transparent hover:border-red-500/20 transition-all duration-300"
                                      >
                                        <div className="relative flex-shrink-0">
                                          <LazyLoadImage
                                            src={fav.poster || posterPlaceholder}
                                            className="w-10 h-14 object-cover rounded shadow-lg group-hover:scale-105 transition-transform duration-300"
                                            alt={fav.title}
                                            effect="black-and-white"
                                          />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <h4 className="text-white text-[10px] font-semibold truncate group-hover:text-red-400 transition-colors">
                                            {fav.title}
                                          </h4>
                                          {fav.release_year && (
                                            <p className="text-gray-500 text-[9px] mt-0.5">{fav.release_year}</p>
                                          )}
                                        </div>
                                      </Link>
                                      {/* Remove Favorite Button */}
                                      <button
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          const updatedFavorites = favorites.filter(f => f.tmdb_id !== fav.tmdb_id);
                                          saveToStorage('favorites', updatedFavorites);
                                          setFavorites(updatedFavorites);
                                          window.dispatchEvent(new CustomEvent('favoritesUpdated'));
                                        }}
                                        className="absolute top-1 right-1 p-1 bg-black/90 hover:bg-red-500 rounded-full transition-all duration-300 hover:scale-110 z-10 flex items-center justify-center"
                                        title="Remove from favorites"
                                      >
                                        <IoClose className="text-white text-xs" />
                                      </button>
                                    </motion.div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center py-4 text-gray-500">
                                  <AiOutlineHeart className="mx-auto mb-1 text-lg" />
                                  <p className="text-[10px]">No favorites yet</p>
                                </div>
                              )}
                            </div>

                            {/* Recently Viewed Section */}
                            <div className="p-2 border-b border-red-500/20 bg-black">
                              <motion.div 
                                className="flex items-center gap-1.5 mb-2"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 }}
                              >
                                <div className="p-0.5 bg-blue-500/20 rounded border border-blue-500/30">
                                  <MdHistory className="text-blue-400 text-xs" />
                                </div>
                                <h3 className="text-white font-bold text-[10px] flex-1">Recently Viewed</h3>
                                <span className="px-1 py-0.5 bg-blue-500/20 border border-blue-500/30 rounded-full text-blue-300 text-[9px] font-semibold">
                                  {recentlyViewed.length}
                                </span>
                                {recentlyViewed.length > 0 && (
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      saveToStorage('recentlyViewed', []);
                                      setRecentlyViewed([]);
                                      window.dispatchEvent(new CustomEvent('recentlyViewedUpdated'));
                                    }}
                                    className="ml-1 p-0.5 rounded text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-300"
                                    title="Clear all recently viewed"
                                  >
                                    <VscClose className="text-xs" />
                                  </button>
                                )}
                              </motion.div>
                              {recentlyViewed.length > 0 ? (
                                <div className="space-y-1.5 max-h-[150px] overflow-y-auto scrollbar-hide pr-1">
                                  {recentlyViewed.slice(0, 10).map((item, idx) => (
                                    <motion.div
                                      key={idx}
                                      initial={{ opacity: 0, x: -10 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: 0.25 + idx * 0.05 }}
                                      className="group relative"
                                    >
                                      <Link
                                        to={item.media_type === 'movie' ? `/mov/${item.tmdb_id}` : `/ser/${item.tmdb_id}`}
                                        onClick={() => handleRecentlyViewedClick(item)}
                                        className="flex items-center gap-1.5 p-1.5 rounded-lg hover:bg-gray-900 border border-transparent hover:border-blue-500/20 transition-all duration-300"
                                      >
                                        <div className="relative flex-shrink-0">
                                          <LazyLoadImage
                                            src={item.poster || posterPlaceholder}
                                            className="w-10 h-14 object-cover rounded shadow-lg group-hover:scale-105 transition-transform duration-300"
                                            alt={item.title}
                                            effect="black-and-white"
                                          />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <h4 className="text-white text-[10px] font-semibold truncate group-hover:text-blue-400 transition-colors">
                                            {item.title}
                                          </h4>
                                          {item.release_year && (
                                            <p className="text-gray-500 text-[9px] mt-0.5">{item.release_year}</p>
                                          )}
                                        </div>
                                      </Link>
                                      {/* Remove Recently Viewed Button */}
                                      <button
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          const updatedRecentlyViewed = recentlyViewed.filter(i => i.tmdb_id !== item.tmdb_id);
                                          saveToStorage('recentlyViewed', updatedRecentlyViewed);
                                          setRecentlyViewed(updatedRecentlyViewed);
                                          window.dispatchEvent(new CustomEvent('recentlyViewedUpdated'));
                                        }}
                                        className="absolute top-1 right-1 p-1 bg-black/90 hover:bg-red-500 rounded-full transition-all duration-300 hover:scale-110 z-10 flex items-center justify-center"
                                        title="Remove from recently viewed"
                                      >
                                        <IoClose className="text-white text-xs" />
                                      </button>
                                    </motion.div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center py-4 text-gray-500">
                                  <MdHistory className="mx-auto mb-1 text-lg" />
                                  <p className="text-[10px]">No recently viewed</p>
                                </div>
                              )}
                            </div>

                            {/* Resume Movies Section - Movies paused in the middle */}
                            {resumeMovies.length > 0 && (
                              <div className="p-2 border-b border-red-500/20 bg-gradient-to-br from-orange-950/10 via-black to-black">
                                <motion.div 
                                  className="flex items-center gap-1.5 mb-2"
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: 0.25 }}
                                >
                                  <div className="p-0.5 bg-gradient-to-br from-orange-500/30 to-orange-600/20 rounded-lg border border-orange-500/40 shadow-lg shadow-orange-500/20">
                                    <MdPause className="text-orange-400 text-xs" />
                                  </div>
                                  <h3 className="text-white font-bold text-[10px] flex-1 bg-gradient-to-r from-orange-400 to-orange-300 bg-clip-text text-transparent">Resume Movie</h3>
                                  <span className="px-1 py-0.5 bg-gradient-to-r from-orange-500/30 to-orange-600/20 border border-orange-500/40 rounded-full text-orange-300 text-[9px] font-bold shadow-md shadow-orange-500/20">
                                    {resumeMovies.length}
                                  </span>
                                  {resumeMovies.length > 0 && (
                                    <button
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        saveToStorage('resumeMovies', []);
                                        setResumeMovies([]);
                                        window.dispatchEvent(new CustomEvent('resumeMoviesUpdated'));
                                      }}
                                      className="ml-1 p-0.5 rounded text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-300"
                                      title="Clear all resume movies"
                                    >
                                      <VscClose className="text-xs" />
                                    </button>
                                  )}
                                </motion.div>
                                <div className="space-y-2 max-h-[150px] overflow-y-auto scrollbar-hide pr-1">
                                  {resumeMovies
                                    .filter(item => {
                                      // Only show movies paused in the middle (10% - 90% progress)
                                      const progress = item.progress || 0;
                                      return progress >= 10 && progress <= 90;
                                    })
                                    .slice(0, 10)
                                    .map((item, idx) => {
                                      const progress = item.progress || 0;
                                      const progressPercentage = Math.min(100, Math.max(0, progress));
                                      
                                      return (
                                        <motion.div
                                          key={idx}
                                          initial={{ opacity: 0, x: -10, scale: 0.95 }}
                                          animate={{ opacity: 1, x: 0, scale: 1 }}
                                          transition={{ delay: 0.3 + idx * 0.05, type: "spring", stiffness: 200 }}
                                          className="group relative"
                                        >
                                          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-900/80 to-black border border-orange-500/20 hover:border-orange-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-orange-500/20 hover:scale-[1.02]">
                                            <Link
                                              to={item.media_type === 'movie' ? `/mov/${item.tmdb_id}` : `/ser/${item.tmdb_id}`}
                                              onClick={() => {
                                                const currentRecentlyViewed = getFromStorage('recentlyViewed', []);
                                                const updatedRecentlyViewed = [
                                                  {
                                                    tmdb_id: item.tmdb_id,
                                                    title: item.title,
                                                    poster: item.poster,
                                                    release_year: item.release_year,
                                                    media_type: item.media_type || 'movie',
                                                    viewed_at: new Date().toISOString()
                                                  },
                                                  ...currentRecentlyViewed.filter(i => i.tmdb_id !== item.tmdb_id)
                                                ].slice(0, 20);
                                                saveToStorage('recentlyViewed', updatedRecentlyViewed);
                                                setRecentlyViewed(updatedRecentlyViewed);
                                                window.dispatchEvent(new CustomEvent('recentlyViewedUpdated'));
                                              }}
                                              className="flex items-center gap-2 p-1.5"
                                            >
                                              {/* Poster with Progress Overlay */}
                                              <div className="relative flex-shrink-0">
                                                <div className="relative w-12 h-16 rounded-lg overflow-hidden shadow-2xl group-hover:shadow-orange-500/30 transition-all duration-300">
                                                  <LazyLoadImage
                                                    src={item.poster || posterPlaceholder}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                    alt={item.title}
                                                    effect="black-and-white"
                                                  />
                                                  {/* Gradient Overlay */}
                                                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                                  
                                                  {/* Progress Bar at Bottom */}
                                                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50">
                                                    <div 
                                                      className="h-full bg-gradient-to-r from-orange-500 to-orange-400 shadow-lg shadow-orange-500/50 transition-all duration-300"
                                                      style={{ width: `${progressPercentage}%` }}
                                                    />
                                                  </div>
                                                  
                                                  {/* Play Button Overlay */}
                                                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-sm">
                                                    <motion.button
                                                      onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        navigate(item.media_type === 'movie' ? `/mov/${item.tmdb_id}` : `/ser/${item.tmdb_id}`);
                                                      }}
                                                      whileHover={{ scale: 1.1 }}
                                                      whileTap={{ scale: 0.95 }}
                                                      className="p-2 bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 rounded-full shadow-2xl shadow-orange-500/50 transition-all duration-300 border-2 border-white/20"
                                                      title="Resume movie"
                                                    >
                                                      <BiPlay className="text-white text-sm ml-0.5" />
                                                    </motion.button>
                                                  </div>
                                                </div>
                                                
                                                {/* Progress Percentage Badge */}
                                                <div className="absolute -bottom-1 -right-1 px-1 py-0.5 bg-gradient-to-r from-orange-500/90 to-orange-600/90 backdrop-blur-sm rounded-full border border-orange-400/50 shadow-lg">
                                                  <span className="text-[8px] font-bold text-white">{Math.round(progressPercentage)}%</span>
                                                </div>
                                              </div>
                                              
                                              {/* Content */}
                                              <div className="flex-1 min-w-0 space-y-1">
                                                <h4 className="text-white text-[10px] font-bold truncate group-hover:text-orange-400 transition-colors duration-300 leading-tight">
                                                  {item.title}
                                                </h4>
                                                {item.release_year && (
                                                  <p className="text-gray-400 text-[9px] font-medium">{item.release_year}</p>
                                                )}
                                                
                                                {/* Progress Bar */}
                                                <div className="relative w-full h-1 bg-gray-800 rounded-full overflow-hidden">
                                                  <motion.div 
                                                    className="absolute left-0 top-0 h-full bg-gradient-to-r from-orange-500 via-orange-400 to-orange-300 rounded-full shadow-sm shadow-orange-500/50"
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${progressPercentage}%` }}
                                                    transition={{ duration: 0.5, delay: 0.1 + idx * 0.05 }}
                                                  />
                                                  <div className="absolute right-0 top-0 h-full w-[2px] bg-orange-500/30" />
                                                </div>
                                              </div>
                                              
                                              {/* Resume Button */}
                                              <button
                                                onClick={(e) => {
                                                  e.preventDefault();
                                                  e.stopPropagation();
                                                  navigate(item.media_type === 'movie' ? `/mov/${item.tmdb_id}` : `/ser/${item.tmdb_id}`);
                                                }}
                                                className="p-1.5 bg-gradient-to-br from-orange-500/20 to-orange-600/10 hover:from-orange-500/30 hover:to-orange-600/20 border border-orange-500/40 hover:border-orange-500/60 rounded-lg transition-all duration-300 hover:scale-110 flex-shrink-0 shadow-md shadow-orange-500/10 hover:shadow-orange-500/30 group-hover:shadow-lg"
                                                title="Resume movie"
                                              >
                                                <BiPlay className="text-orange-400 text-xs group-hover:text-orange-300 transition-colors" />
                                              </button>
                                            </Link>
                                            {/* Remove Resume Movie Button */}
                                            <button
                                              onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                const currentResumeMovies = getFromStorage('resumeMovies', []);
                                                const updatedResumeMovies = currentResumeMovies.filter(m => m.tmdb_id !== item.tmdb_id);
                                                saveToStorage('resumeMovies', updatedResumeMovies);
                                                setResumeMovies(updatedResumeMovies);
                                                window.dispatchEvent(new CustomEvent('resumeMoviesUpdated'));
                                              }}
                                              className="absolute top-1 right-1 p-1 bg-black/90 hover:bg-red-500 rounded-full transition-all duration-300 hover:scale-110 z-10 flex items-center justify-center"
                                              title="Remove from resume movies"
                                            >
                                              <IoClose className="text-white text-xs" />
                                            </button>
                                          </div>
                                        </motion.div>
                                      );
                                    })}
                                </div>
                              </div>
                            )}

                            {/* Resume Watching Section */}
                            {resumeWatching.length > 0 && (
                              <div className="p-2 bg-gradient-to-br from-green-950/10 via-black to-black border-t border-green-500/10">
                                <motion.div 
                                  className="flex items-center gap-2 mb-3"
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: 0.3 }}
                                >
                                  <div className="p-1 bg-gradient-to-br from-green-500/30 to-green-600/20 rounded-lg border border-green-500/40 shadow-lg shadow-green-500/20">
                                    <MdPlayCircleOutline className="text-green-400 text-sm" />
                                  </div>
                                  <h3 className="text-white font-bold text-xs flex-1 bg-gradient-to-r from-green-400 to-green-300 bg-clip-text text-transparent">Resume Watching</h3>
                                  <span className="px-1.5 py-0.5 bg-gradient-to-r from-green-500/30 to-green-600/20 border border-green-500/40 rounded-full text-green-300 text-[9px] font-bold shadow-md shadow-green-500/20">
                                    {resumeWatching.length}
                                  </span>
                                  {resumeWatching.length > 0 && (
                                    <button
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        saveToStorage('resumeWatching', []);
                                        setResumeWatching([]);
                                        window.dispatchEvent(new CustomEvent('resumeWatchingUpdated'));
                                      }}
                                      className="ml-1 p-0.5 rounded text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-300"
                                      title="Clear all resume watching"
                                    >
                                      <VscClose className="text-xs" />
                                    </button>
                                  )}
                                </motion.div>
                                <div className="space-y-2.5 max-h-[180px] overflow-y-auto scrollbar-hide pr-1">
                                  {resumeWatching.slice(0, 10).map((item, idx) => {
                                    // Calculate progress percentage (default to 30% if not available)
                                    const progress = item.progress || 30;
                                    const progressPercentage = Math.min(100, Math.max(0, progress));
                                    
                                    return (
                                      <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, x: -10, scale: 0.95 }}
                                        animate={{ opacity: 1, x: 0, scale: 1 }}
                                        transition={{ delay: 0.35 + idx * 0.05, type: "spring", stiffness: 200 }}
                                        className="group relative"
                                      >
                                        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-900/80 to-black border border-green-500/20 hover:border-green-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-green-500/20 hover:scale-[1.02]">
                                          <Link
                                            to={item.media_type === 'movie' ? `/mov/${item.tmdb_id}` : `/ser/${item.tmdb_id}`}
                                            onClick={() => handleResumeWatchingClick(item)}
                                            className="flex items-center gap-2.5 p-2"
                                          >
                                            {/* Poster with Progress Overlay */}
                                            <div className="relative flex-shrink-0">
                                              <div className="relative w-14 h-20 rounded-lg overflow-hidden shadow-2xl group-hover:shadow-green-500/30 transition-all duration-300">
                                                <LazyLoadImage
                                                  src={item.poster || posterPlaceholder}
                                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                  alt={item.title}
                                                  effect="black-and-white"
                                                />
                                                {/* Gradient Overlay */}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                                
                                                {/* Progress Bar at Bottom */}
                                                <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50">
                                                  <div 
                                                    className="h-full bg-gradient-to-r from-green-500 to-green-400 shadow-lg shadow-green-500/50 transition-all duration-300"
                                                    style={{ width: `${progressPercentage}%` }}
                                                  />
                                                </div>
                                                
                                                {/* Play Button Overlay */}
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-sm">
                                                  <motion.button
                                                    onClick={(e) => {
                                                      e.preventDefault();
                                                      e.stopPropagation();
                                                      handleResumeWatchingClick(item);
                                                      navigate(item.media_type === 'movie' ? `/mov/${item.tmdb_id}` : `/ser/${item.tmdb_id}`);
                                                    }}
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    className="p-2.5 bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-full shadow-2xl shadow-red-500/50 transition-all duration-300 border-2 border-white/20"
                                                    title="Resume watching"
                                                  >
                                                    <BiPlay className="text-white text-base ml-0.5" />
                                                  </motion.button>
                                                </div>
                                              </div>
                                              
                                              {/* Progress Percentage Badge */}
                                              <div className="absolute -bottom-1 -right-1 px-1.5 py-0.5 bg-gradient-to-r from-green-500/90 to-green-600/90 backdrop-blur-sm rounded-full border border-green-400/50 shadow-lg">
                                                <span className="text-[8px] font-bold text-white">{Math.round(progressPercentage)}%</span>
                                              </div>
                                            </div>
                                            
                                            {/* Content */}
                                            <div className="flex-1 min-w-0 space-y-1">
                                              <h4 className="text-white text-xs font-bold truncate group-hover:text-green-400 transition-colors duration-300 leading-tight">
                                                {item.title}
                                              </h4>
                                              <div className="flex items-center gap-2">
                                                {item.release_year && (
                                                  <p className="text-gray-400 text-[9px] font-medium">{item.release_year}</p>
                                                )}
                                                {item.episode_title && (
                                                  <>
                                                    <span className="text-gray-600 text-[8px]">•</span>
                                                    <p className="text-green-400/80 text-[9px] font-medium truncate max-w-[100px]">{item.episode_title}</p>
                                                  </>
                                                )}
                                              </div>
                                              
                                              {/* Progress Bar */}
                                              <div className="relative w-full h-1 bg-gray-800 rounded-full overflow-hidden">
                                                <motion.div 
                                                  className="absolute left-0 top-0 h-full bg-gradient-to-r from-green-500 via-green-400 to-green-300 rounded-full shadow-sm shadow-green-500/50"
                                                  initial={{ width: 0 }}
                                                  animate={{ width: `${progressPercentage}%` }}
                                                  transition={{ duration: 0.5, delay: 0.1 + idx * 0.05 }}
                                                />
                                                <div className="absolute right-0 top-0 h-full w-[2px] bg-green-500/30" />
                                              </div>
                                            </div>
                                            
                                            {/* Resume Button */}
                                            <button
                                              onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handleResumeWatchingClick(item);
                                                navigate(item.media_type === 'movie' ? `/mov/${item.tmdb_id}` : `/ser/${item.tmdb_id}`);
                                              }}
                                              className="p-2 bg-gradient-to-br from-green-500/20 to-green-600/10 hover:from-green-500/30 hover:to-green-600/20 border border-green-500/40 hover:border-green-500/60 rounded-lg transition-all duration-300 hover:scale-110 flex-shrink-0 shadow-md shadow-green-500/10 hover:shadow-green-500/30 group-hover:shadow-lg"
                                              title="Resume watching"
                                            >
                                              <BiPlay className="text-green-400 text-sm group-hover:text-green-300 transition-colors" />
                                            </button>
                                          </Link>
                                          {/* Remove Resume Watching Button */}
                                          <button
                                            onClick={(e) => {
                                              e.preventDefault();
                                              e.stopPropagation();
                                              const currentResumeWatching = getFromStorage('resumeWatching', []);
                                              const updatedResumeWatching = currentResumeWatching.filter(m => 
                                                !(m.tmdb_id === item.tmdb_id && 
                                                  (item.season_number ? m.season_number === item.season_number : true) &&
                                                  (item.episode_number ? m.episode_number === item.episode_number : true))
                                              );
                                              saveToStorage('resumeWatching', updatedResumeWatching);
                                              setResumeWatching(updatedResumeWatching);
                                              window.dispatchEvent(new CustomEvent('resumeWatchingUpdated'));
                                            }}
                                            className="absolute top-1 right-1 p-1 bg-black/90 hover:bg-red-500 rounded-full transition-all duration-300 hover:scale-110 z-10 flex items-center justify-center"
                                            title="Remove from resume watching"
                                          >
                                            <IoClose className="text-white text-xs" />
                                          </button>
                                        </div>
                                      </motion.div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            }
            return (
              <Link
                key={index}
                to={navItem.path}
                className="relative flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300"
                onClick={() => setNavStatus(navItem.name)}
              >
                {navStatus === navItem.name && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-red-900 rounded-lg border-2 border-red-500 shadow-[0_0_20px_rgba(239,68,68,1),0_0_40px_rgba(239,68,68,0.5)]"
                    initial={false}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 35,
                      duration: 0.6
                    }}
                  />
                )}
                <navItem.icon className={`text-lg relative z-10 ${navStatus === navItem.name ? "text-white" : "text-white"}`} />
                <span className={`text-sm font-medium relative z-10 ${navStatus === navItem.name ? "text-white" : "text-white"}`}>{navItem.name}</span>
              </Link>
            );
          })}
          {/* Search Button */}
          <button
            onClick={() => setSearchDialogOpen(!searchDialogOpen)}
            className="p-2.5 rounded-lg bg-gray-800 hover:bg-gray-700 transition-all duration-300"
          >
            <FiSearch className="text-white text-lg" />
          </button>
        </nav>

        {/* Right Section - Utility/User Actions */}
        <div className="hidden md:flex items-center gap-2 pr-4 lg:pr-6">
          {/* Send Button */}
          <button
            onClick={() => window.open("https://t.me/pboxtv", "_blank")}
            className="p-2.5 rounded-lg bg-gray-600 hover:bg-gray-500 transition-all duration-300"
          >
            <IoPaperPlaneOutline className="text-gray-800 text-lg" />
          </button>

          {/* User Profile Button with Dropdown */}
          <div className="relative" ref={userDropdownRef}>
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="p-2.5 rounded-lg bg-gray-800 hover:bg-gray-700 transition-all duration-300 relative"
            >
              <BiUser className="text-white text-lg" />
              {userDropdownOpen && (
                <motion.div
                  layoutId="userActiveIndicator"
                  className="absolute inset-0 rounded-lg bg-red-500/20 border border-red-500/30"
                  initial={false}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 35,
                    duration: 0.6
                  }}
                />
              )}
            </button>

            {/* User Dropdown */}
            <AnimatePresence>
              {userDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="absolute top-full right-0 mt-2 w-64 z-50"
                >
                  <div className="bg-black border-2 border-red-500/60 rounded-xl shadow-2xl shadow-red-500/20 shadow-black/50 overflow-hidden">
                    {/* Header */}
                    <div className="p-4 bg-gradient-to-br from-gray-900 to-black border-b border-red-500/30">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-gradient-to-br from-red-500/30 to-red-600/20 rounded-xl border border-red-500/40 shadow-lg shadow-red-500/20">
                          <BiUser className="text-red-400 text-xl" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-400 text-xs font-medium mb-0.5">Account</p>
                          <p className="text-white text-sm font-bold truncate">
                            {isAuthenticated && user ? (userProfile?.name || user.email?.split('@')[0] || "User") : "User"}
                          </p>
                          {isAuthenticated && user && userProfile?.email && (
                            <p className="text-gray-500 text-[10px] truncate mt-0.5">{userProfile.email}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="p-2 space-y-1">
                      {/* Manage Account */}
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          // Navigate to account settings or show account management
                          if (isAuthenticated) {
                            // Add navigation to account settings page if available
                            console.log("Navigate to account settings");
                          } else {
                            navigate("/login");
                          }
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gray-900/50 hover:bg-gray-800/70 border border-gray-800 hover:border-red-500/60 hover:shadow-[0_0_10px_rgba(239,68,68,0.5)] transition-all duration-300 hover:scale-[1.02] group relative"
                      >
                        <div className="p-1.5 bg-gray-700/30 rounded-lg border border-gray-700/40 group-hover:bg-gray-700/50 transition-colors">
                          <MdAccountCircle className="text-gray-300 text-base group-hover:text-white transition-colors" />
                        </div>
                        <span className="text-white text-sm font-medium flex-1 text-left group-hover:text-gray-100 transition-colors">Manage Account</span>
                        <MdKeyboardArrowRight className="text-gray-500 text-lg group-hover:text-gray-300 group-hover:translate-x-1 transition-all" />
                      </button>

                      {/* Settings */}
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          // Navigate to settings or show settings modal
                          console.log("Navigate to settings");
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gray-900/50 hover:bg-gray-800/70 border border-gray-800 hover:border-red-500/60 hover:shadow-[0_0_10px_rgba(239,68,68,0.5)] transition-all duration-300 hover:scale-[1.02] group relative"
                      >
                        <div className="p-1.5 bg-gray-700/30 rounded-lg border border-gray-700/40 group-hover:bg-gray-700/50 transition-colors">
                          <MdSettings className="text-gray-300 text-base group-hover:text-white transition-colors" />
                        </div>
                        <span className="text-white text-sm font-medium flex-1 text-left group-hover:text-gray-100 transition-colors">Settings</span>
                        <MdKeyboardArrowRight className="text-gray-500 text-lg group-hover:text-gray-300 group-hover:translate-x-1 transition-all" />
                      </button>

                      {/* Divider */}
                      <div className="h-px bg-gray-800 my-2" />

                      {/* Sign Up - Only show when not authenticated */}
                      {!isAuthenticated && (
                        <button
                          onClick={() => {
                            setUserDropdownOpen(false);
                            navigate("/login", { state: { initialTab: "sign-up" } });
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gray-900/50 hover:bg-gray-800/70 border border-gray-800 hover:border-red-500/60 hover:shadow-[0_0_10px_rgba(239,68,68,0.5)] transition-all duration-300 hover:scale-[1.02] group relative"
                        >
                          <div className="p-1.5 bg-gray-700/30 rounded-lg border border-gray-700/40 group-hover:bg-gray-700/50 transition-colors">
                            <BiUser className="text-gray-300 text-base group-hover:text-white transition-colors" />
                          </div>
                          <span className="text-white text-sm font-semibold flex-1 text-left group-hover:text-gray-100 transition-colors">
                            Sign Up
                          </span>
                          <MdKeyboardArrowRight className="text-gray-500 text-lg group-hover:text-gray-300 group-hover:translate-x-1 transition-all" />
                        </button>
                      )}

                        {/* Sign In / Sign Out */}
                        <button
                          onClick={async () => {
                            setUserDropdownOpen(false);
                            if (isAuthenticated) {
                              try {
                                await logout();
                                navigate("/login");
                              } catch (error) {
                                console.error("Logout error:", error);
                              }
                            } else {
                              navigate("/login");
                            }
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gray-900/50 hover:bg-gray-800/70 border border-gray-800 hover:border-red-500/60 hover:shadow-[0_0_10px_rgba(239,68,68,0.5)] transition-all duration-300 hover:scale-[1.02] group relative"
                        >
                          <div className="p-1.5 bg-gray-700/30 rounded-lg border border-gray-700/40 group-hover:bg-gray-700/50 transition-colors">
                            <BiUser className="text-gray-300 text-base group-hover:text-white transition-colors" />
                          </div>
                          <span className="text-white text-sm font-semibold flex-1 text-left group-hover:text-gray-100 transition-colors">
                            {isAuthenticated ? "Sign Out" : "Sign In"}
                          </span>
                          <MdKeyboardArrowRight className="text-gray-500 text-lg group-hover:text-gray-300 group-hover:translate-x-1 transition-all" />
                        </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Desktop Search Dialog */}
        <AnimatePresence>
          {searchDialogOpen && (
            <motion.div
              ref={searchDialogRef}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="fixed top-20 right-4 md:right-6 w-80 bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-2xl shadow-2xl z-[60] max-h-80 overflow-hidden"
            >
              <div className="p-4">
                <form onSubmit={handleSearch} className="mb-4">
                  <div className="relative">
                    <input
                      ref={searchInputRef}
                      type="text"
                      name="search"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Search movies, TV shows..."
                      className="w-full py-2.5 px-4 pl-10 bg-gray-800/80 border border-gray-700/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all duration-300"
                    />
                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
                  </div>
                </form>

                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-300">Search History</h3>
                  {searchHistory.length > 0 && (
                    <button
                      onClick={clearSearchHistory}
                      className="text-xs text-gray-500 hover:text-red-400 transition-colors duration-300"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                {searchHistory.length > 0 ? (
                  <div className="space-y-1 max-h-60 overflow-y-auto">
                    {searchHistory.map((term, index) => (
                      <div key={index} className="flex items-center gap-3 group">
                        <button
                          onClick={() => handleHistorySearch(term)}
                          className="flex-1 text-left px-3 py-2 rounded-xl text-gray-300 hover:bg-gray-800/50 hover:text-white transition-all duration-300 flex items-center gap-3"
                        >
                          <FiSearch className="text-gray-500 group-hover:text-red-400 transition-colors duration-300" />
                          <span className="flex-1 truncate">{term}</span>
                        </button>
                        <button
                          onClick={() => removeHistoryItem(index)}
                          className="p-1 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-300"
                        >
                          <VscClose className="text-sm" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FiSearch className="mx-auto mb-2 text-2xl" />
                    <p className="text-sm">No search history yet</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile View */}
        <div className="flex md:hidden items-center justify-between w-full px-4">
          {/* Left Side - Logo */}
          <Link
            to="/"
            className="flex items-center gap-2"
          >
            <div className="bg-red-600 p-2 rounded-md">
              <MdPlayArrow className="text-white text-lg" />
            </div>
            <div>
              <h1 className="text-lg font-bold">
                <span className="text-red-500">Pbox</span><span className="text-white">Tv</span>
              </h1>
              <p className="text-xs text-white -mt-1">Your Movie Hub</p>
            </div>
          </Link>

          {/* Right Side - Icons */}
          <div className="flex items-center gap-2">
            {/* Hamburger Menu */}
            <div className="relative" ref={mobileMenuRef}>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg bg-transparent hover:bg-gray-800/50 transition-all duration-300"
              >
                <BiMenu className="text-white text-xl" />
              </button>

              {/* Mobile Menu Dropdown - My List */}
              <AnimatePresence>
                {mobileMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="fixed top-16 left-4 right-4 w-auto max-w-sm mx-auto z-50"
                  >
                    <div className="bg-black border-2 border-red-500/60 rounded-xl shadow-2xl shadow-red-500/20 shadow-black/50 overflow-hidden max-h-[400px] flex flex-col">
                      {/* Header */}
                      <div className="p-2 bg-black border-b border-red-500/30 flex-shrink-0">
                        <div className="flex items-center gap-2">
                          <div className="p-1 bg-red-500/20 rounded-lg border border-red-500/30">
                            <BiListUl className="text-red-400 text-sm" />
                          </div>
                          <div>
                            <h2 className="text-white font-bold text-xs">My List</h2>
                            <p className="text-gray-500 text-[9px]">Your personal collection</p>
                          </div>
                        </div>
                      </div>

                      {/* Scrollable Content */}
                      <div className="overflow-y-auto scrollbar-hide flex-1">
                        {/* Favorites Section */}
                        <div className="p-2 border-b border-red-500/20 bg-black">
                          <motion.div 
                            className="flex items-center gap-1.5 mb-2"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                          >
                            <div className="p-0.5 bg-red-500/20 rounded border border-red-500/30">
                              <AiFillHeart className="text-red-400 text-xs" />
                            </div>
                            <h3 className="text-white font-bold text-[10px] flex-1">Favorites</h3>
                            <span className="px-1 py-0.5 bg-red-500/20 border border-red-500/30 rounded-full text-red-300 text-[9px] font-semibold">
                              {favorites.length}
                            </span>
                          </motion.div>
                          {favorites.length > 0 ? (
                            <div className="space-y-1.5 max-h-[150px] overflow-y-auto scrollbar-hide pr-1">
                              {favorites.map((fav, idx) => (
                                <motion.div
                                  key={idx}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: 0.15 + idx * 0.05 }}
                                  className="group relative"
                                >
                                  <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-gray-900/80 to-black border border-gray-800 hover:border-red-500/50 transition-all duration-300">
                                    <Link
                                      to={fav.media_type === 'movie' ? `/mov/${fav.tmdb_id}` : `/ser/${fav.tmdb_id}`}
                                      onClick={() => {
                                        setMobileMenuOpen(false);
                                        handleFavoriteClick(fav);
                                      }}
                                      className="flex items-center gap-2 p-1.5"
                                    >
                                      <div className="relative w-10 h-14 rounded overflow-hidden flex-shrink-0">
                                        <LazyLoadImage
                                          src={fav.poster || posterPlaceholder}
                                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                          alt={fav.title}
                                          effect="black-and-white"
                                        />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <h4 className="text-white text-[10px] font-bold truncate group-hover:text-red-400 transition-colors">
                                          {fav.title}
                                        </h4>
                                        {fav.release_year && (
                                          <p className="text-gray-400 text-[9px]">{fav.release_year}</p>
                                        )}
                                      </div>
                                    </Link>
                                    <button
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleRemoveFavorite(fav.tmdb_id);
                                      }}
                                      className="absolute top-1 right-1 p-1 bg-black/90 hover:bg-red-500 rounded-full transition-all duration-300 hover:scale-110 z-10 flex items-center justify-center"
                                      title="Remove from favorites"
                                    >
                                      <IoClose className="text-white text-xs" />
                                    </button>
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-4 text-gray-500">
                              <AiOutlineHeart className="mx-auto mb-1 text-lg" />
                              <p className="text-[10px]">No favorites yet</p>
                            </div>
                          )}
                        </div>

                        {/* Recently Viewed Section */}
                        <div className="p-2 border-b border-red-500/20 bg-black">
                          <motion.div 
                            className="flex items-center gap-1.5 mb-2"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                          >
                            <div className="p-0.5 bg-blue-500/20 rounded border border-blue-500/30">
                              <MdHistory className="text-blue-400 text-xs" />
                            </div>
                            <h3 className="text-white font-bold text-[10px] flex-1">Recently Viewed</h3>
                            <span className="px-1 py-0.5 bg-blue-500/20 border border-blue-500/30 rounded-full text-blue-300 text-[9px] font-semibold">
                              {recentlyViewed.length}
                            </span>
                          </motion.div>
                          {recentlyViewed.length > 0 ? (
                            <div className="space-y-1.5 max-h-[150px] overflow-y-auto scrollbar-hide pr-1">
                              {recentlyViewed.slice(0, 10).map((item, idx) => (
                                <motion.div
                                  key={idx}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: 0.25 + idx * 0.05 }}
                                  className="group relative"
                                >
                                  <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-gray-900/80 to-black border border-gray-800 hover:border-red-500/50 transition-all duration-300">
                                    <Link
                                      to={item.media_type === 'movie' ? `/mov/${item.tmdb_id}` : `/ser/${item.tmdb_id}`}
                                      onClick={() => {
                                        setMobileMenuOpen(false);
                                        handleRecentlyViewedClick(item);
                                      }}
                                      className="flex items-center gap-2 p-1.5"
                                    >
                                      <div className="relative w-10 h-14 rounded overflow-hidden flex-shrink-0">
                                        <LazyLoadImage
                                          src={item.poster || posterPlaceholder}
                                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                          alt={item.title}
                                          effect="black-and-white"
                                        />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <h4 className="text-white text-[10px] font-bold truncate group-hover:text-red-400 transition-colors">
                                          {item.title}
                                        </h4>
                                        {item.release_year && (
                                          <p className="text-gray-400 text-[9px]">{item.release_year}</p>
                                        )}
                                      </div>
                                    </Link>
                                    <button
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleRemoveRecentlyViewed(item.tmdb_id);
                                      }}
                                      className="absolute top-1 right-1 p-1 bg-black/90 hover:bg-red-500 rounded-full transition-all duration-300 hover:scale-110 z-10 flex items-center justify-center"
                                      title="Remove from recently viewed"
                                    >
                                      <IoClose className="text-white text-xs" />
                                    </button>
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-4 text-gray-500">
                              <MdHistory className="mx-auto mb-1 text-lg" />
                              <p className="text-[10px]">No recently viewed</p>
                            </div>
                          )}
                        </div>

                        {/* Resume Movies Section */}
                        {resumeMovies.length > 0 && (
                          <div className="p-2 border-b border-red-500/20 bg-gradient-to-br from-orange-950/10 via-black to-black">
                            <motion.div 
                              className="flex items-center gap-1.5 mb-2"
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.25 }}
                            >
                              <div className="p-0.5 bg-gradient-to-br from-orange-500/30 to-orange-600/20 rounded-lg border border-orange-500/40 shadow-lg shadow-orange-500/20">
                                <MdPause className="text-orange-400 text-xs" />
                              </div>
                              <h3 className="text-white font-bold text-[10px] flex-1 bg-gradient-to-r from-orange-400 to-orange-300 bg-clip-text text-transparent">Resume Movie</h3>
                              <span className="px-1 py-0.5 bg-gradient-to-r from-orange-500/30 to-orange-600/20 border border-orange-500/40 rounded-full text-orange-300 text-[9px] font-bold shadow-md shadow-orange-500/20">
                                {resumeMovies.filter(item => {
                                  const progress = item.progress || 0;
                                  return progress >= 10 && progress <= 90;
                                }).length}
                              </span>
                            </motion.div>
                            <div className="space-y-2 max-h-[150px] overflow-y-auto scrollbar-hide pr-1">
                              {resumeMovies
                                .filter(item => {
                                  const progress = item.progress || 0;
                                  return progress >= 10 && progress <= 90;
                                })
                                .slice(0, 10)
                                .map((item, idx) => {
                                  const progress = item.progress || 0;
                                  const progressPercentage = Math.min(100, Math.max(0, progress));
                                  
                                  return (
                                    <motion.div
                                      key={idx}
                                      initial={{ opacity: 0, x: -10, scale: 0.95 }}
                                      animate={{ opacity: 1, x: 0, scale: 1 }}
                                      transition={{ delay: 0.3 + idx * 0.05, type: "spring", stiffness: 200 }}
                                      className="group relative"
                                    >
                                      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-900/80 to-black border border-orange-500/20 hover:border-orange-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-orange-500/20 hover:scale-[1.02]">
                                        <Link
                                          to={item.media_type === 'movie' ? `/mov/${item.tmdb_id}` : `/ser/${item.tmdb_id}`}
                                          onClick={() => {
                                            setMobileMenuOpen(false);
                                            const currentRecentlyViewed = getFromStorage('recentlyViewed', []);
                                            const updatedRecentlyViewed = [
                                              {
                                                tmdb_id: item.tmdb_id,
                                                title: item.title,
                                                poster: item.poster,
                                                release_year: item.release_year,
                                                media_type: item.media_type || 'movie',
                                                viewed_at: new Date().toISOString()
                                              },
                                              ...currentRecentlyViewed.filter(i => i.tmdb_id !== item.tmdb_id)
                                            ].slice(0, 20);
                                            saveToStorage('recentlyViewed', updatedRecentlyViewed);
                                            setRecentlyViewed(updatedRecentlyViewed);
                                            window.dispatchEvent(new CustomEvent('recentlyViewedUpdated'));
                                          }}
                                          className="flex items-center gap-2 p-1.5"
                                        >
                                          <div className="relative flex-shrink-0">
                                            <div className="relative w-12 h-16 rounded-lg overflow-hidden shadow-2xl group-hover:shadow-orange-500/30 transition-all duration-300">
                                              <LazyLoadImage
                                                src={item.poster || posterPlaceholder}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                alt={item.title}
                                                effect="black-and-white"
                                              />
                                              <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50">
                                                <div 
                                                  className="h-full bg-gradient-to-r from-orange-500 to-orange-400 shadow-lg shadow-orange-500/50 transition-all duration-300"
                                                  style={{ width: `${progressPercentage}%` }}
                                                />
                                              </div>
                                            </div>
                                            <div className="absolute -bottom-1 -right-1 px-1 py-0.5 bg-gradient-to-r from-orange-500/90 to-orange-600/90 backdrop-blur-sm rounded-full border border-orange-400/50 shadow-lg">
                                              <span className="text-[8px] font-bold text-white">{Math.round(progressPercentage)}%</span>
                                            </div>
                                          </div>
                                          <div className="flex-1 min-w-0 space-y-1">
                                            <h4 className="text-white text-[10px] font-bold truncate group-hover:text-orange-400 transition-colors duration-300 leading-tight">
                                              {item.title}
                                            </h4>
                                            {item.release_year && (
                                              <p className="text-gray-400 text-[9px] font-medium">{item.release_year}</p>
                                            )}
                                            <div className="relative w-full h-1 bg-gray-800 rounded-full overflow-hidden">
                                              <motion.div 
                                                className="absolute left-0 top-0 h-full bg-gradient-to-r from-orange-500 via-orange-400 to-orange-300 rounded-full shadow-sm shadow-orange-500/50"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${progressPercentage}%` }}
                                                transition={{ duration: 0.5, delay: 0.1 + idx * 0.05 }}
                                              />
                                            </div>
                                          </div>
                                        </Link>
                                      </div>
                                    </motion.div>
                                  );
                                })}
                            </div>
                          </div>
                        )}

                        {/* Resume Watching Section */}
                        {resumeWatching.length > 0 && (
                          <div className="p-2 bg-gradient-to-br from-green-950/10 via-black to-black border-t border-green-500/10">
                            <motion.div 
                              className="flex items-center gap-2 mb-3"
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.3 }}
                            >
                              <div className="p-1 bg-green-500/20 rounded-lg border border-green-500/30">
                                <BiPlay className="text-green-400 text-sm" />
                              </div>
                              <h3 className="text-white font-bold text-[10px] flex-1 bg-gradient-to-r from-green-400 to-green-300 bg-clip-text text-transparent">Resume Watching</h3>
                              <span className="px-1.5 py-0.5 bg-gradient-to-r from-green-500/30 to-green-600/20 border border-green-500/40 rounded-full text-green-300 text-[9px] font-bold shadow-md shadow-green-500/20">
                                {resumeWatching.length}
                              </span>
                            </motion.div>
                            <div className="space-y-2 max-h-[150px] overflow-y-auto scrollbar-hide pr-1">
                              {resumeWatching.slice(0, 10).map((item, idx) => {
                                const progress = item.progress || 30;
                                const progressPercentage = Math.min(100, Math.max(0, progress));

                                return (
                                  <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, x: -10, scale: 0.95 }}
                                    animate={{ opacity: 1, x: 0, scale: 1 }}
                                    transition={{ delay: 0.35 + idx * 0.05, type: "spring", stiffness: 200 }}
                                    className="group relative"
                                  >
                                    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-900/80 to-black border border-green-500/20 hover:border-green-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-green-500/20 hover:scale-[1.02]">
                                      <Link
                                        to={item.media_type === 'movie' ? `/mov/${item.tmdb_id}` : `/ser/${item.tmdb_id}`}
                                        onClick={() => {
                                          setMobileMenuOpen(false);
                                          handleResumeWatchingClick(item);
                                        }}
                                        className="flex items-center gap-2.5 p-2"
                                      >
                                        <div className="relative flex-shrink-0">
                                          <div className="relative w-14 h-20 rounded-lg overflow-hidden shadow-2xl group-hover:shadow-green-500/30 transition-all duration-300">
                                            <LazyLoadImage
                                              src={item.poster || posterPlaceholder}
                                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                              alt={item.title}
                                              effect="black-and-white"
                                            />
                                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50">
                                              <div
                                                className="h-full bg-gradient-to-r from-green-500 to-green-400 shadow-lg shadow-green-500/50 transition-all duration-300"
                                                style={{ width: `${progressPercentage}%` }}
                                              />
                                            </div>
                                          </div>
                                          <div className="absolute -bottom-1 -right-1 px-1.5 py-0.5 bg-gradient-to-r from-green-500/90 to-green-600/90 backdrop-blur-sm rounded-full border border-green-400/50 shadow-lg">
                                            <span className="text-[8px] font-bold text-white">{Math.round(progressPercentage)}%</span>
                                          </div>
                                        </div>
                                        <div className="flex-1 min-w-0 space-y-1">
                                          <h4 className="text-white text-xs font-bold truncate group-hover:text-green-400 transition-colors duration-300 leading-tight">
                                            {item.title}
                                          </h4>
                                          <div className="flex items-center gap-2">
                                            {item.release_year && (
                                              <p className="text-gray-400 text-[9px] font-medium">{item.release_year}</p>
                                            )}
                                            {item.episode_title && (
                                              <>
                                                <span className="text-gray-600 text-[8px]">•</span>
                                                <p className="text-green-400/80 text-[9px] font-medium truncate max-w-[100px]">{item.episode_title}</p>
                                              </>
                                            )}
                                          </div>
                                          <div className="relative w-full h-1 bg-gray-800 rounded-full overflow-hidden">
                                            <motion.div 
                                              className="absolute left-0 top-0 h-full bg-gradient-to-r from-green-500 via-green-400 to-green-300 rounded-full shadow-sm shadow-green-500/50"
                                              initial={{ width: 0 }}
                                              animate={{ width: `${progressPercentage}%` }}
                                              transition={{ duration: 0.5, delay: 0.1 + idx * 0.05 }}
                                            />
                                          </div>
                                        </div>
                                      </Link>
                                    </div>
                                  </motion.div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Search Icon */}
            <button
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              className="p-2 rounded-lg bg-transparent hover:bg-gray-800/50 transition-all duration-300"
            >
              <FiSearch className="text-white text-xl" />
            </button>

            {/* User Profile Icon */}
            <div className="relative" ref={userDropdownRef}>
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="p-2 rounded-lg bg-transparent hover:bg-gray-800/50 transition-all duration-300"
              >
                <BiUser className="text-white text-xl" />
              </button>

              {/* Mobile User Dropdown */}
              <AnimatePresence>
                {userDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="absolute top-full right-0 mt-2 w-64 z-50"
                  >
                    <div className="bg-black border-2 border-red-500/60 rounded-xl shadow-2xl shadow-red-500/20 shadow-black/50 overflow-hidden">
                      {/* Header */}
                      <div className="p-4 bg-gradient-to-br from-gray-900 to-black border-b border-red-500/30">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-gradient-to-br from-red-500/30 to-red-600/20 rounded-xl border border-red-500/40 shadow-lg shadow-red-500/20">
                            <BiUser className="text-red-400 text-xl" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-gray-400 text-xs font-medium mb-0.5">Account</p>
                            <p className="text-white text-sm font-bold truncate">
                              {isAuthenticated && user ? (userProfile?.name || user.email?.split('@')[0] || "User") : "User"}
                            </p>
                            {isAuthenticated && user && userProfile?.email && (
                              <p className="text-gray-500 text-[10px] truncate mt-0.5">{userProfile.email}</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Menu Items */}
                      <div className="p-2 space-y-1">
                        {/* Manage Account */}
                        <button
                          onClick={() => {
                            setUserDropdownOpen(false);
                            if (isAuthenticated) {
                              console.log("Navigate to account settings");
                            } else {
                              navigate("/login");
                            }
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gray-900/50 hover:bg-gray-800/70 border border-gray-800 hover:border-red-500/60 hover:shadow-[0_0_10px_rgba(239,68,68,0.5)] transition-all duration-300 hover:scale-[1.02] group relative"
                        >
                          <div className="p-1.5 bg-gray-700/30 rounded-lg border border-gray-700/40 group-hover:bg-gray-700/50 transition-colors">
                            <MdAccountCircle className="text-gray-300 text-base group-hover:text-white transition-colors" />
                          </div>
                          <span className="text-white text-sm font-medium flex-1 text-left group-hover:text-gray-100 transition-colors">Manage Account</span>
                          <MdKeyboardArrowRight className="text-gray-500 text-lg group-hover:text-gray-300 group-hover:translate-x-1 transition-all" />
                        </button>

                        {/* Settings */}
                        <button
                          onClick={() => {
                            setUserDropdownOpen(false);
                            console.log("Navigate to settings");
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gray-900/50 hover:bg-gray-800/70 border border-gray-800 hover:border-red-500/60 hover:shadow-[0_0_10px_rgba(239,68,68,0.5)] transition-all duration-300 hover:scale-[1.02] group relative"
                        >
                          <div className="p-1.5 bg-gray-700/30 rounded-lg border border-gray-700/40 group-hover:bg-gray-700/50 transition-colors">
                            <MdSettings className="text-gray-300 text-base group-hover:text-white transition-colors" />
                          </div>
                          <span className="text-white text-sm font-medium flex-1 text-left group-hover:text-gray-100 transition-colors">Settings</span>
                          <MdKeyboardArrowRight className="text-gray-500 text-lg group-hover:text-gray-300 group-hover:translate-x-1 transition-all" />
                        </button>

                        {/* Divider */}
                        <div className="h-px bg-gray-800 my-2" />

                        {/* Sign Up - Only show when not authenticated */}
                        {!isAuthenticated && (
                          <button
                            onClick={() => {
                              setUserDropdownOpen(false);
                              navigate("/login", { state: { initialTab: "sign-up" } });
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gray-900/50 hover:bg-gray-800/70 border border-gray-800 hover:border-red-500/60 hover:shadow-[0_0_10px_rgba(239,68,68,0.5)] transition-all duration-300 hover:scale-[1.02] group relative"
                          >
                            <div className="p-1.5 bg-gray-700/30 rounded-lg border border-gray-700/40 group-hover:bg-gray-700/50 transition-colors">
                              <BiUser className="text-gray-300 text-base group-hover:text-white transition-colors" />
                            </div>
                            <span className="text-white text-sm font-semibold flex-1 text-left group-hover:text-gray-100 transition-colors">
                              Sign Up
                            </span>
                            <MdKeyboardArrowRight className="text-gray-500 text-lg group-hover:text-gray-300 group-hover:translate-x-1 transition-all" />
                          </button>
                        )}

                        {/* Sign In / Sign Out */}
                        <button
                          onClick={async () => {
                            setUserDropdownOpen(false);
                            if (isAuthenticated) {
                              try {
                                await logout();
                                navigate("/login");
                              } catch (error) {
                                console.error("Logout error:", error);
                              }
                            } else {
                              navigate("/login");
                            }
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gray-900/50 hover:bg-gray-800/70 border border-gray-800 hover:border-red-500/60 hover:shadow-[0_0_10px_rgba(239,68,68,0.5)] transition-all duration-300 hover:scale-[1.02] group relative"
                        >
                          <div className="p-1.5 bg-gray-700/30 rounded-lg border border-gray-700/40 group-hover:bg-gray-700/50 transition-colors">
                            <BiUser className="text-gray-300 text-base group-hover:text-white transition-colors" />
                          </div>
                          <span className="text-white text-sm font-semibold flex-1 text-left group-hover:text-gray-100 transition-colors">
                            {isAuthenticated ? "Sign Out" : "Sign In"}
                          </span>
                          <MdKeyboardArrowRight className="text-gray-500 text-lg group-hover:text-gray-300 group-hover:translate-x-1 transition-all" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {mobileSearchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-xl md:hidden"
          >
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-4 border-b border-gray-800">
                <h2 className="text-lg font-semibold text-white">Search</h2>
                <button
                  onClick={() => setMobileSearchOpen(false)}
                  className="p-2 rounded-xl bg-gray-800/60 hover:bg-gray-700/60 transition-all duration-300"
                >
                  <IoClose className="text-gray-300 text-xl" />
                </button>
              </div>

              <div className="p-4 flex-1 overflow-hidden flex flex-col">
                <form onSubmit={handleSearch} className="mb-6">
                  <div className="relative">
                    <input
                      type="text"
                      name="search"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Search movies, TV shows..."
                      className="w-full py-4 px-6 pl-14 bg-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all duration-300"
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-400 transition-colors duration-300"
                    >
                      <FiSearch className="text-lg" />
                    </button>
                  </div>
                </form>

                {/* Mobile Search History */}
                <div className="flex-1 overflow-hidden">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-semibold text-gray-300">Recent Searches</h3>
                    {searchHistory.length > 0 && (
                      <button
                        onClick={clearSearchHistory}
                        className="text-sm text-gray-500 hover:text-red-400 transition-colors duration-300"
                      >
                        Clear All
                      </button>
                    )}
                  </div>

                  {searchHistory.length > 0 ? (
                    <div className="space-y-2 overflow-y-auto flex-1">
                      {searchHistory.map((term, index) => (
                        <div key={index} className="flex items-center gap-3 group">
                          <button
                            onClick={() => handleHistorySearch(term)}
                            className="flex-1 text-left p-4 rounded-2xl bg-gray-900/50 hover:bg-gray-800/50 transition-all duration-300 flex items-center gap-4 border border-gray-800/30"
                          >
                            <div className="p-2 rounded-xl bg-gray-800/50 group-hover:bg-red-500/20 transition-all duration-300">
                              <FiSearch className="text-gray-400 group-hover:text-red-400 transition-colors duration-300" />
                            </div>
                            <span className="flex-1 text-gray-300 group-hover:text-white transition-colors duration-300 truncate">
                              {term}
                            </span>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          </button>
                          <button
                            onClick={() => removeHistoryItem(index)}
                            className="p-2 rounded-xl text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-300"
                          >
                            <VscClose className="text-lg" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <div className="p-4 rounded-full bg-gray-800/30 inline-block mb-4">
                        <FiSearch className="text-3xl" />
                      </div>
                      <p className="text-base font-medium mb-2">No search history</p>
                      <p className="text-sm">Your recent searches will appear here</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed bottom-0 left-0 right-0 z-[9999] bg-black/95 backdrop-blur-xl border-t border-gray-800/50 md:hidden"
      >
        <nav className="flex items-center justify-between px-4 py-3 gap-3">
          {/* Left Side - Quick Links */}
          <div className="flex items-center gap-1 flex-1 overflow-x-auto scrollbar-hide min-w-0">
            {mobileNavItems.map((navItem, index) => (
              navItem.external ? (
                <a
                  key={index}
                  href={navItem.path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all duration-300 whitespace-nowrap flex-shrink-0 text-gray-400 hover:text-red-400 hover:bg-red-500/10"
                >
                  <navItem.icon className="text-base flex-shrink-0" />
                  <span className="text-xs font-medium">{navItem.name}</span>
                </a>
              ) : (
                <Link
                  key={index}
                  to={navItem.path}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all duration-300 whitespace-nowrap flex-shrink-0 ${
                    navStatus === navItem.name
                      ? "text-red-400 bg-red-500/10"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                  onClick={() => setNavStatus(navItem.name)}
                >
                  <navItem.icon className="text-base flex-shrink-0" />
                  <span className="text-xs font-medium">{navItem.name}</span>
                </Link>
              )
            ))}
          </div>

          {/* Right Side - Icons (Search & User) */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Search Icon */}
            <button
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              className="p-2 rounded-lg bg-transparent hover:bg-gray-800/50 transition-all duration-300"
            >
              <FiSearch className="text-white text-xl" />
            </button>

            {/* User Profile Icon */}
            <div className="relative" ref={userDropdownRef}>
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="p-2 rounded-lg bg-transparent hover:bg-gray-800/50 transition-all duration-300 relative"
              >
                <BiUser className="text-white text-xl" />
                {userDropdownOpen && (
                  <motion.div
                    layoutId="userActiveIndicator"
                    className="absolute inset-0 rounded-lg bg-red-500/20 border border-red-500/30"
                    initial={false}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 35,
                      duration: 0.6
                    }}
                  />
                )}
              </button>
            </div>
          </div>
        </nav>
      </motion.div>
    </>
  );
}
