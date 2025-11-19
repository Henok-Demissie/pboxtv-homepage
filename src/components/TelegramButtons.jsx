import React, { useState } from "react";
import { Popover, PopoverTrigger, PopoverContent } from "@nextui-org/popover";
import { PiTelegramLogo } from "react-icons/pi";
import axios from "axios";
import { Button } from "@nextui-org/button";
import Spinner from "./svg/Spinner";
import { useLocation } from "react-router-dom";

const TelegramButton = ({ movieData }) => {
  const USERNAME = import.meta.env.VITE_TG_USERNAME;
  const API_URL = import.meta.env.VITE_API_URL;
  const API_KEY = import.meta.env.VITE_API_KEY;

  const [shortenedUrls, setShortenedUrls] = useState({});
  const [loading, setLoading] = useState({});
  const location = useLocation();

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

  const handleButtonClick = async (originalUrl, quality) => {
    setLoading((prev) => ({ ...prev, [quality]: true }));
    let shortUrl = originalUrl;

    try {
      shortUrl = await shortenUrl(originalUrl);
      setShortenedUrls((prev) => ({ ...prev, [originalUrl]: shortUrl }));
    } catch (error) {
      console.error("Error processing URL:", error);
    } finally {
      setLoading((prev) => ({ ...prev, [quality]: false }));
      window.open(shortUrl, "_blank", "noopener noreferrer");
    }
  };

  const renderQualityButtons = (qualityDetails) =>
    qualityDetails.map(({ quality }, index) => (
      <Button
        key={index}
        onClick={() =>
          handleButtonClick(
            `https://t.me/${USERNAME}?start=file_${movieData.tmdb_id}_${quality}`,
            quality
          )
        }
        size="sm"
        className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-medium rounded-full border border-red-500/30 shadow-lg shadow-red-500/20 hover:shadow-xl hover:shadow-red-500/30 transition-all duration-300"
        isLoading={loading[quality]}
        spinner={<Spinner />}
      >
        {quality}
      </Button>
    ));

  const renderSeasonButtons = () =>
    movieData.seasons.map((season, seasonIndex) => {
      const availableQualities = new Set();
      season.episodes.forEach((episode) => {
        episode.telegram?.forEach(({ quality }) =>
          availableQualities.add(quality)
        );
      });

      return (
        <Popover
          key={seasonIndex}
          placement="left"
          showArrow={true}
          offset={20}
        >
          <PopoverTrigger>
            <button className="text-left bg-gradient-to-r from-red-600/80 to-red-700/80 hover:from-red-500/90 hover:to-red-600/90 text-white font-medium py-2 px-4 rounded-full border border-red-500/30 shadow-lg shadow-red-500/20 hover:shadow-xl hover:shadow-red-500/30 transition-all duration-300 hover:scale-105">
              Season {season.season_number}
            </button>
          </PopoverTrigger>
          <PopoverContent className="bg-gradient-to-br from-red-900/90 to-black/90 backdrop-blur-lg border border-red-600/30 rounded-xl shadow-2xl">
            <div className="px-2 py-3 flex gap-2 flex-wrap">
              {Array.from(availableQualities).map((quality, qualityIndex) => (
                <Button
                  key={qualityIndex}
                  onClick={() =>
                    handleButtonClick(
                      `https://t.me/${USERNAME}?start=file_${movieData.tmdb_id}_${season.season_number}_${quality}`,
                      quality
                    )
                  }
                  size="sm"
                  className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-medium rounded-full border border-red-500/30 shadow-lg shadow-red-500/20 hover:shadow-xl hover:shadow-red-500/30 transition-all duration-300"
                  isLoading={loading[quality]}
                  spinner={<Spinner />}
                >
                  {quality}
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      );
    });

  return (
    <Popover placement="bottom" showArrow={true}>
      <PopoverTrigger>
        <button className="group uppercase flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/30 hover:border-red-500/50 text-white font-medium text-xs rounded-lg py-2 px-4 lg:text-sm sm:px-6 sm:max-w-[15rem] sm:py-3 transition-all duration-300 hover:scale-105">
          <PiTelegramLogo className="text-lg group-hover:scale-110 transition-transform duration-300" />
          Telegram
        </button>
      </PopoverTrigger>
      <PopoverContent className="bg-gradient-to-br from-red-900/90 to-black/90 backdrop-blur-lg border border-red-600/30 rounded-xl shadow-2xl">
        <div className="px-2 py-3 flex gap-2 flex-wrap flex-col">
          {movieData.media_type === "movie"
            ? renderQualityButtons(movieData.telegram || [])
            : renderSeasonButtons()}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default TelegramButton;
