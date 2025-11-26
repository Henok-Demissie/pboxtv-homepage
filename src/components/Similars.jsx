import { React, useState } from "react";
import { Link } from "react-router-dom";
import MovieCard from "./MovieCard";
import MovieCardSkeleton from "./MovieCardSkeleton";
import "react-lazy-load-image-component/src/effects/black-and-white.css";
import { BiArrowFromLeft } from "react-icons/bi";

export default function HomeSection(props) {
  // States
  const [showPlayBtn, setShowPlayBtn] = useState(false);
  const [openId, setOpenId] = useState();
  
  // PLAY Button Show/hide Function
  const showPlay = (i) => {
    setOpenId(i);
    setShowPlayBtn(true);
  };
  const hidePlay = (i) => {
    setOpenId(i);
    setShowPlayBtn(false);
  };
  
  return (
    <div className="w-full px-4 sm:px-6 lg:px-8">
      {/* Title */}
      <div className="mt-[2.5rem] flex items-center flex-wrap gap-5 text-primaryTextColor pb-[1.5rem] md:mt-[5rem]">
        <div className="pl-[1rem] border-l-2 border-red-600">
          <p className="text-[0.8rem] uppercase font-bold sm:text-[1rem]">
            {props.sectionTitle}
          </p>
        </div>
        {/* See All Button */}
        <Link
          to={props.seeMoreButtonLink}
          className="group flex gap-2 items-center py-2 px-4 text-sm font-medium rounded-full bg-gradient-to-r from-red-600/10 to-red-700/10 border border-red-500/30 text-red-400 hover:from-red-600/20 hover:to-red-700/20 hover:border-red-400/50 hover:text-red-300 transition-all duration-300 ease-in-out hover:scale-105 backdrop-blur-sm"
          style={{ textDecoration: "none" }}
        >
          <span>See more</span>
          <BiArrowFromLeft className="text-base group-hover:translate-x-1 transition-transform duration-300" />
        </Link>
      </div>
      
      {/* Similar Movies Section */}
      <div className="w-full">
        {!props.isMovieDataLoading ? (
          <div className="relative w-full">
            <div className="grid w-full gap-x-2 gap-y-2 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 3xl:grid-cols-8">
              {props.movieData.map((movie, index) => {
                return (
                  <MovieCard key={index} movie={movie} />
                );
              })}
            </div>
          </div>
        ) : (
          <>
            <MovieCardSkeleton />
          </>
        )}
      </div>
    </div>
  );
}
