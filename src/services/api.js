import axios from "axios";

const BASE = import.meta.env.VITE_BASE_URL;

export const apiService = {
  getMovies: async (params = {}) => {
    try {
      const response = await axios.get(`${BASE}/api/movies`, { params });
      return response;
    } catch (error) {
      console.error("API Service Error:", error);
      throw error;
    }
  },

  getTvShows: async (params = {}) => {
    try {
      const response = await axios.get(`${BASE}/api/tvshows`, { params });
      return response;
    } catch (error) {
      console.error("API Service Error:", error);
      throw error;
    }
  },

  getTVShows: async (params = {}) => {
    try {
      const response = await axios.get(`${BASE}/api/tvshows`, { params });
      return response;
    } catch (error) {
      console.error("API Service Error:", error);
      throw error;
    }
  },

  getMovieById: async (id) => {
    try {
      const response = await axios.get(`${BASE}/api/id/${id}`);
      return response;
    } catch (error) {
      console.error("API Service Error:", error);
      throw error;
    }
  },

  search: async (query, params = {}) => {
    try {
      const response = await axios.get(`${BASE}/api/search/`, {
        params: { query, ...params }
      });
      return response;
    } catch (error) {
      console.error("API Service Error:", error);
      throw error;
    }
  },

  getSimilar: async (params = {}) => {
    try {
      const response = await axios.get(`${BASE}/api/similar/`, { params });
      return response;
    } catch (error) {
      console.error("API Service Error:", error);
      throw error;
    }
  }
};

