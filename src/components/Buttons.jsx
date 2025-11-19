import axios from "axios";
import React, { useState, useEffect } from "react";
import { Select, SelectItem } from "@nextui-org/select";
import { Popover, PopoverTrigger, PopoverContent } from "@nextui-org/popover";
import { Button } from "@nextui-org/button";
import { FaCloudDownloadAlt } from "react-icons/fa";
import Spinner from "./svg/Spinner";

const DownloadButton = ({ movieData }) => {
  const BASE = import.meta.env.VITE_BASE_URL;
  const API_URL = import.meta.env.VITE_API_URL;
  const API_KEY = import.meta.env.VITE_API_KEY;

  const [selectedSeason, setSelectedSeason] = useState("");
  const [selectedEpisode, setSelectedEpisode] = useState("");
  const [selectedQuality, setSelectedQuality] = useState("");
  const [episodes, setEpisodes] = useState([]);
  const [qualities, setQualities] = useState([]);
  const [loading, setLoading] = useState({});

  const isValidQuality = (quality) => {
    return quality && 
           quality.quality && 
           quality.quality.trim() !== "" && 
           quality.id && 
           quality.name;
  };

  const filterValidQualities = (qualityArray) => {
    return qualityArray?.filter(isValidQuality) || [];
  };

  useEffect(() => {
    if (selectedSeason) {
      const season = movieData.seasons.find(
        (s) => s.season_number === parseInt(selectedSeason)
      );
      if (season) {
        setEpisodes(season.episodes);
        setSelectedEpisode("");
        setQualities([]);
        setSelectedQuality("");
      }
    }
  }, [selectedSeason, movieData.seasons]);

  useEffect(() => {
    if (selectedEpisode) {
      const episode = episodes.find(
        (e) => e.episode_number === parseInt(selectedEpisode)
      );
      if (episode) {
        const validQualities = filterValidQualities(episode.telegram);
        setQualities(validQualities);
        setSelectedQuality("");
      }
    }
  }, [selectedEpisode, episodes]);

  const shortenUrl = async (url) => {
    try {
      const response = await axios.get(API_URL, {
        params: {
          api: API_KEY,
          url: url,
          format: "json",
        },
      });

      const data = response.data;
      return data?.shortenedUrl || data?.short || data?.url || url;
    } catch (error) {
      console.error("Error shortening URL:", error);
      return url;
    }
  };

  const generateUrl = (id, name) => {
    return `${BASE}/dl/${id}/${encodeURIComponent(name)}`;
  };

  const triggerDownload = (url, filename) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || '';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleButtonClick = async (id, name, quality) => {
    setLoading((prev) => ({ ...prev, [quality]: true }));
    try {
      const rawUrl = generateUrl(id, name);
      const shortUrl = await shortenUrl(rawUrl);
      
      if (movieData.media_type === "movie") {
        triggerDownload(shortUrl, name);
      } else {
        window.open(shortUrl, "_blank", "noopener noreferrer");
      }
    } catch (error) {
      console.error("Download error:", error);
    } finally {
      setLoading((prev) => ({ ...prev, [quality]: false }));
    }
  };

  const renderMovieButtons = () => {
    const validQualities = filterValidQualities(movieData.telegram);
    return validQualities.map((q, i) => (
      <Button
        key={i}
        onClick={() => handleButtonClick(q.id, q.name, q.quality)}
        size="sm"
        className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-medium rounded-full border border-white/30 hover:border-white/50 shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-white/10 transition-all duration-300 hover:scale-105"
        isLoading={loading[q.quality]}
        spinner={<Spinner />}
      >
        {q.quality}
      </Button>
    ));
  };

  const renderShowSelectors = () => (
    <div className="px-2 py-3 flex flex-col gap-3">
      <Select
        isRequired
        variant="bordered"
        aria-label="Select season"
        placeholder="Select season"
        className="w-48"
        classNames={{
          trigger: "bg-white/10 backdrop-blur-md border-white/30 hover:border-white/50 transition-all duration-300",
          value: "text-white font-medium",
          label: "text-white/80"
        }}
        onChange={(e) => setSelectedSeason(e.target.value)}
        value={selectedSeason}
      >
        {movieData.seasons
          .filter(s => s.season_number > 0)
          .sort((a, b) => a.season_number - b.season_number)
          .map((s) => (
            <SelectItem 
              key={s.season_number} 
              value={s.season_number}
              textValue={`Season ${s.season_number}`}
            >
              Season {s.season_number}
            </SelectItem>
          ))}
      </Select>
      <Select
        isRequired
        variant="bordered"
        aria-label="Select episode"
        placeholder="Select episode"
        className="w-48"
        classNames={{
          trigger: "bg-gradient-to-r from-slate-800/90 to-slate-900/90 border-blue-500/30 hover:border-blue-400/50 transition-all duration-300",
          value: "text-white font-medium",
          label: "text-blue-300"
        }}
        onChange={(e) => setSelectedEpisode(e.target.value)}
        value={selectedEpisode}
        disabled={!selectedSeason}
      >
        {episodes
          .filter(e => e.episode_number > 0)
          .sort((a, b) => a.episode_number - b.episode_number)
          .map((e) => (
            <SelectItem 
              key={e.episode_number} 
              value={e.episode_number}
              textValue={`Episode ${e.episode_number}`}
            >
              Episode {e.episode_number}
            </SelectItem>
          ))}
      </Select>
      <Select
        isRequired
        variant="bordered"
        aria-label="Select quality"
        placeholder="Select quality"
        className="w-48"
        classNames={{
          trigger: "bg-gradient-to-r from-slate-800/90 to-slate-900/90 border-blue-500/30 hover:border-blue-400/50 transition-all duration-300",
          value: "text-white font-medium",
          label: "text-blue-300"
        }}
        onChange={(e) => setSelectedQuality(e.target.value)}
        value={selectedQuality}
        disabled={!selectedEpisode || qualities.length === 0}
      >
        {qualities.map((q) => (
          <SelectItem 
            key={q.quality} 
            value={q.quality}
            textValue={q.quality}
          >
            {q.quality}
          </SelectItem>
        ))}
      </Select>
      <Button
        onClick={() => {
          const q = qualities.find((q) => q.quality === selectedQuality);
          if (q) handleButtonClick(q.id, q.name, q.quality);
        }}
        size="sm"
        className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-medium rounded-full border border-white/30 hover:border-white/50 shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-white/10 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        disabled={!selectedQuality || qualities.length === 0}
        isLoading={loading[selectedQuality]}
        spinner={<Spinner />}
      >
        Download
      </Button>
    </div>
  );

  const hasValidContent = () => {
    if (movieData.media_type === "movie") {
      return filterValidQualities(movieData.telegram).length > 0;
    }
    return movieData.seasons && movieData.seasons.length > 0;
  };

  if (!hasValidContent()) {
    return null;
  }

  return (
    <Popover placement="bottom" showArrow={true}>
      <PopoverTrigger>
        <button className="group uppercase flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/30 hover:border-red-500/50 text-white font-medium text-xs rounded-lg py-2 px-4 lg:text-sm sm:px-6 sm:max-w-[15rem] sm:py-3 transition-all duration-300 hover:scale-105">
          <FaCloudDownloadAlt className="text-lg group-hover:scale-110 transition-transform duration-300" />
          Download
        </button>
      </PopoverTrigger>
      <PopoverContent className="bg-gradient-to-br from-black/90 to-gray-900/90 backdrop-blur-lg border border-white/30 rounded-xl shadow-2xl">
        {movieData.media_type === "movie" ? (
          <div className="px-2 py-3 flex gap-2 flex-wrap">
            {renderMovieButtons()}
          </div>
        ) : (
          renderShowSelectors()
        )}
      </PopoverContent>
    </Popover>
  );
};

export default DownloadButton;
