import React, { useEffect, useState } from "react";
import axios from "axios";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";

export default function AdsSlider() {
  const [ads, setAds] = useState([]);

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_BASE_URL}/api/poster`)
      .then((res) => setAds(res.data.ads || []))
      .catch((err) => console.error("Failed to load ads", err));
  }, []);

  if (!ads.length) return null;

  const isVideo = (url) => url.toLowerCase().endsWith(".mp4");

  return (
    <div className="relative mb-4" style={{ 
      width: '100vw', 
      marginLeft: 'calc(-50vw + 50%)',
      marginRight: 'calc(-50vw + 50%)'
    }}>
      <Swiper
        modules={[Autoplay]}
        spaceBetween={0}
        slidesPerView={1}
        loop={true}
        autoplay={{ delay: 3000, disableOnInteraction: false }}
        className="w-full"
      >
        {ads.map((ad, idx) => (
          <SwiperSlide key={idx} className="flex justify-center items-center">
            <a
              href={ad.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full"
            >
              {isVideo(ad.poster) ? (
                <video
                  src={ad.poster}
                  className="w-full h-[100px] sm:h-[120px] md:h-[160px] lg:h-[200px] xl:h-[240px] object-contain object-center"
                  muted
                  loop
                  autoPlay
                  playsInline
                />
              ) : (
                <img
                  src={ad.poster}
                  alt={`ad-${idx}`}
                  className="w-full h-[100px] sm:h-[120px] md:h-[160px] lg:h-[200px] xl:h-[240px] object-contain object-center"
                />
              )}
            </a>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
