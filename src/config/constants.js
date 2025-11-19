export const APP_CONFIG = {
  TG_URL: import.meta.env.VITE_TG_URL || "https://t.me/pboxtv",
  SITE_NAME: import.meta.env.VITE_SITENAME || "PboxTV"
};

export const SORT_OPTIONS = {
  UPDATED: "updated_on:desc",
  RATING: "rating:desc",
  TITLE: "title:asc",
  VIEWS: "views:desc"
};

export const SEARCH_DEBOUNCE_MS = 300;
export const MAX_SEARCH_HISTORY = 10;

export const ROUTES = {
  HOME: () => '/',
  MOVIES: () => '/Movies',
  SERIES: () => '/Series',
  MOVIE_DETAILS: (id) => `/mov/${id}`,
  SERIES_DETAILS: (id) => `/ser/${id}`,
  SEARCH: (query) => `/search/${encodeURIComponent(query)}`,
  LOGIN: () => '/Login'
};
