import React, { useState, useEffect } from "react";
import { Select, SelectItem } from "@nextui-org/select";
import { Popover, PopoverTrigger, PopoverContent } from "@nextui-org/popover";
import { Button } from "@nextui-org/button";
import { FaPlay } from "react-icons/fa";
import Spinner from "./svg/Spinner";
import Swal from 'sweetalert2';

const VLCStreamButton = ({ movieData }) => {
  const BASE = import.meta.env.VITE_BASE_URL;

  const [selectedSeason, setSelectedSeason] = useState("");
  const [selectedEpisode, setSelectedEpisode] = useState("");
  const [selectedQuality, setSelectedQuality] = useState("");
  const [episodes, setEpisodes] = useState([]);
  const [qualities, setQualities] = useState([]);
  const [loading, setLoading] = useState({});

  const isAndroid = () => /Android/i.test(navigator.userAgent);
  const isIOS = () => /iPhone|iPad|iPod/i.test(navigator.userAgent);
  const isMobile = () => /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

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

  const generateStreamUrl = (id, name) => {
    return `${BASE}/dl/${id}/${encodeURIComponent(name)}`;
  };

  const openInVLC = async (url, fileName) => {
    if (isAndroid()) {
      const vlcIntent = `intent:${url}#Intent;package=org.videolan.vlc;type=video/*;action=android.intent.action.VIEW;S.title=${encodeURIComponent(fileName)};end;`;
      window.location.href = vlcIntent;
      
      setTimeout(() => {
        Swal.fire({
          title: 'VLC Not Installed?',
          text: 'Install VLC Media Player from Google Play Store for better streaming experience.',
          icon: 'info',
          showCancelButton: true,
          confirmButtonText: 'Install VLC',
          cancelButtonText: 'Close',
          confirmButtonColor: '#ff9500',
          background: '#1f2937',
          color: '#ffffff'
        }).then((result) => {
          if (result.isConfirmed) {
            window.open('https://play.google.com/store/apps/details?id=org.videolan.vlc', '_blank');
          }
        });
      }, 3000);
      
    } else if (isIOS()) {
      const vlcUrl = `vlc-x-callback://x-callback-url/stream?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(fileName)}`;
      window.location.href = vlcUrl;
      
      setTimeout(() => {
        Swal.fire({
          title: 'VLC Not Installed?',
          text: 'Install VLC for Mobile from App Store for better streaming experience.',
          icon: 'info',
          showCancelButton: true,
          confirmButtonText: 'Install VLC',
          cancelButtonText: 'Close',
          confirmButtonColor: '#ff9500',
          background: '#1f2937',
          color: '#ffffff'
        }).then((result) => {
          if (result.isConfirmed) {
            window.open('https://apps.apple.com/app/vlc-for-mobile/id650377962', '_blank');
          }
        });
      }, 3000);
      
    } else {
      const vlcUrl = `vlc://${url.replace(/^https?:\/\//, '')}`;
      window.location.href = vlcUrl;
      
      setTimeout(() => {
        const link = document.createElement('a');
        link.href = url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }, 2000);
    }
  };

  const handleVLCStream = async (id, name, quality) => {
    setLoading((prev) => ({ ...prev, [quality]: true }));
    try {
      const streamUrl = generateStreamUrl(id, name);
      await openInVLC(streamUrl, name);
    } catch (error) {
      console.error("VLC stream error:", error);
      Swal.fire({
        title: 'Streaming Error',
        text: 'Failed to open stream in VLC. Please try again.',
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: '#e11d48',
        background: '#1f2937',
        color: '#ffffff'
      });
    } finally {
      setTimeout(() => {
        setLoading((prev) => ({ ...prev, [quality]: false }));
      }, 1000);
    }
  };

  const renderMovieButtons = () => {
    const validQualities = filterValidQualities(movieData.telegram);
    return validQualities.map((q, i) => (
      <Button
        key={i}
        onClick={() => handleVLCStream(q.id, q.name, q.quality)}
        size="sm"
        className="bg-orange-500/20 hover:bg-orange-500/30 backdrop-blur-md text-orange-200 hover:text-orange-100 font-medium rounded-full border border-orange-400/30 hover:border-orange-400/50 shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-orange-500/10 transition-all duration-300 hover:scale-105"
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
          trigger: "bg-orange-500/10 backdrop-blur-md border-orange-400/30 hover:border-orange-400/50 transition-all duration-300",
          value: "text-orange-200 font-medium",
          label: "text-orange-300/80"
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
          trigger: "bg-gradient-to-r from-orange-800/20 to-orange-900/20 border-orange-500/30 hover:border-orange-400/50 transition-all duration-300",
          value: "text-orange-200 font-medium",
          label: "text-orange-300"
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
          trigger: "bg-gradient-to-r from-orange-800/20 to-orange-900/20 border-orange-500/30 hover:border-orange-400/50 transition-all duration-300",
          value: "text-orange-200 font-medium",
          label: "text-orange-300"
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
          if (q) handleVLCStream(q.id, q.name, q.quality);
        }}
        size="sm"
        className="bg-orange-500/20 hover:bg-orange-500/30 backdrop-blur-md text-orange-200 hover:text-orange-100 font-medium rounded-full border border-orange-400/30 hover:border-orange-400/50 shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-orange-500/10 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        disabled={!selectedQuality || qualities.length === 0}
        isLoading={loading[selectedQuality]}
        spinner={<Spinner />}
      >
        Stream on VLC
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
        <button className="group uppercase flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white font-medium text-xs rounded-lg py-2 px-4 lg:text-sm sm:px-6 sm:max-w-[15rem] sm:py-3 transition-all duration-300 hover:scale-105">
          <FaPlay className="text-white text-lg group-hover:scale-110 transition-transform duration-300" />
          Stream on VLC
        </button>
      </PopoverTrigger>
      <PopoverContent className="bg-gradient-to-br from-black/90 to-gray-900/90 backdrop-blur-lg border border-orange-400/30 rounded-xl shadow-2xl">
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

export default VLCStreamButton;
