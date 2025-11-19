import React from "react";

import { motion } from "framer-motion";

import { FaDownload, FaWifi } from "react-icons/fa";

import { HiOutlineRefresh } from "react-icons/hi";



export default function PromotionalBanner() {

  const features = [

    {

      title: "Offline Mode",

      subtitle: "Watch Anywhere",

      icon: <FaWifi className="text-base" />,

      delay: 0

    },

    {

      title: "100% Free",

      subtitle: "No Subscriptions",

      icon: <FaDownload className="text-base" />,

      delay: 0.1

    },

    {

      title: "Daily Updates",

      subtitle: "Fresh Content",

      icon: <HiOutlineRefresh className="text-base" />,

      delay: 0.2

    }

  ];



  return (

    <motion.div

      initial={{ opacity: 0, y: 20 }}

      animate={{ opacity: 1, y: 0 }}

      transition={{ delay: 0.3 }}

      className="relative max-w-7xl mx-auto px-4 sm:px-6 md:px-8 my-8"

    >

      <div className="relative">

        <div className="flex flex-col sm:grid sm:grid-cols-3 gap-4 sm:gap-6">

          {features.map((feature, index) => (

            <motion.div

              key={feature.title}

              initial={{ opacity: 0, y: 20 }}

              animate={{ opacity: 1, y: 0 }}

              transition={{ delay: 0.3 + feature.delay }}

              className="group relative"

            >

              <div className="relative p-4 sm:p-6 bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800/50 hover:border-white/30 transition-all duration-300 overflow-hidden">

                {/* Static White Side Glow - No Animation */}

                <div 

                  className="absolute left-0 top-0 bottom-0 w-[3px] bg-white rounded-r-md"

                  style={{

                    boxShadow: '0 0 10px rgba(255, 255, 255, 0.8), 0 0 20px rgba(255, 255, 255, 0.6), 0 0 30px rgba(255, 255, 255, 0.4)'

                  }}

                ></div>

                

                {/* Background Gradient on Hover - White Only */}

                <div 

                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"

                  style={{

                    background: 'linear-gradient(90deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.05))'

                  }}

                ></div>

                

                <div className="relative z-10 flex items-center gap-4">

                  <div className="relative flex-shrink-0">

                    <div className="p-3 bg-gray-800/50 rounded-xl border border-gray-700/50 group-hover:border-white/30 transition-all duration-300">

                      <div className="text-white transition-colors duration-300">

                        {feature.icon}

                      </div>

                    </div>

                    {/* Icon Glow Effect - White Only */}

                    <div className="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"></div>

                  </div>

                  

                  <div className="text-left min-w-0 flex-1">

                    <p className="text-white text-sm font-semibold mb-1 transition-colors duration-300">

                      {feature.title}

                    </p>

                    <p className="text-gray-400 text-xs">

                      {feature.subtitle}

                    </p>

                  </div>

                </div>



                {/* Corner Glow Effect - White Only */}

                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/10 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

              </div>

            </motion.div>

          ))}

        </div>

      </div>

    </motion.div>

  );

}
