import React from "react";

import { Link, useLocation } from "react-router-dom";

import { motion } from "framer-motion";

import { 

  BiHomeAlt2, 

  BiSolidMovie 

} from "react-icons/bi";

import { 

  BsTv, 

  BsTelegram 

} from "react-icons/bs";

import { 

  FiFilm,

  FiTv,

  FiPlayCircle,

  FiTrendingUp,

  FiStar,

  FiClock,

  FiGlobe

} from "react-icons/fi";

import { APP_CONFIG } from "../config/constants";



export default function Footer() {

  const location = useLocation();



  const whatWeOffer = [

    {

      title: "HD Movies",

      description: "Stream high-quality movies",

      icon: <FiFilm className="w-6 h-6" />,

      color: "from-blue-500 to-cyan-500"

    },

    {

      title: "TV Series",

      description: "Watch your favorite shows",

      icon: <FiTv className="w-6 h-6" />,

      color: "from-purple-500 to-pink-500"

    },

    {

      title: "Latest Releases",

      description: "New content updated daily",

      icon: <FiTrendingUp className="w-6 h-6" />,

      color: "from-red-500 to-orange-500"

    },

    {

      title: "Premium Quality",

      description: "Crystal clear streaming",

      icon: <FiStar className="w-6 h-6" />,

      color: "from-yellow-500 to-amber-500"

    }

  ];



  const quickAccess = [

    { name: "Home", path: "/", icon: BiHomeAlt2 },

    { name: "Movies", path: "/Movies", icon: BiSolidMovie },

    { name: "Series", path: "/Series", icon: BsTv },

    { name: "Telegram", path: APP_CONFIG.TG_URL || "#", icon: BsTelegram, external: true }

  ];



  const footerLinks = [

    {

      title: "Content",

      links: [

        { name: "Latest Movies", path: "/Movies" },

        { name: "Latest Series", path: "/Series" },

        { name: "Trending", path: "/" },

        { name: "Top Rated", path: "/" }

      ]

    },

    {

      title: "Support",

      links: [

        { name: "Help Center", path: APP_CONFIG.TG_URL || "#", external: true },

        { name: "Contact Us", path: APP_CONFIG.TG_URL || "#", external: true },

        { name: "Community", path: APP_CONFIG.TG_URL || "#", external: true },

        { name: "FAQ", path: "#" }

      ]

    }

  ];



  return (

    <footer className="relative bg-black border-t border-gray-900 overflow-hidden">

      {/* Animated Background Effects */}

      <div className="absolute inset-0 pointer-events-none overflow-hidden">

        {/* Animated Gradient Orbs */}

        <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-500/5 rounded-full blur-3xl animate-pulse"></div>

        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>

        

        {/* Moving Gradient Orbs */}

        <motion.div

          className="absolute top-1/4 left-0 w-72 h-72 bg-purple-500/4 rounded-full blur-3xl"

          animate={{

            x: [0, 100, 0],

            y: [0, -50, 0],

            scale: [1, 1.2, 1],

          }}

          transition={{

            duration: 8,

            repeat: Infinity,

            ease: "easeInOut",

          }}

        />

        <motion.div

          className="absolute bottom-1/4 right-0 w-72 h-72 bg-cyan-500/4 rounded-full blur-3xl"

          animate={{

            x: [0, -100, 0],

            y: [0, 50, 0],

            scale: [1, 1.2, 1],

          }}

          transition={{

            duration: 10,

            repeat: Infinity,

            ease: "easeInOut",

            delay: 2,

          }}

        />

        

        {/* Floating Particles */}

        {[...Array(6)].map((_, i) => (

          <motion.div

            key={i}

            className="absolute w-2 h-2 bg-white/10 rounded-full"

            style={{

              left: `${15 + i * 15}%`,

              top: `${20 + (i % 3) * 30}%`,

            }}

            animate={{

              y: [0, -30, 0],

              opacity: [0.1, 0.3, 0.1],

              scale: [1, 1.5, 1],

            }}

            transition={{

              duration: 3 + i * 0.5,

              repeat: Infinity,

              ease: "easeInOut",

              delay: i * 0.3,

            }}

          />

        ))}

        

        {/* Animated Grid Pattern */}

        <div className="absolute inset-0 opacity-5">

          <div className="absolute inset-0" style={{

            backgroundImage: `

              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),

              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)

            `,

            backgroundSize: '50px 50px',

          }}>

            <motion.div

              className="absolute inset-0"

              animate={{

                backgroundPosition: ['0 0', '50px 50px'],

              }}

              transition={{

                duration: 20,

                repeat: Infinity,

                ease: "linear",

              }}

            />

          </div>

        </div>

      </div>



      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        

        {/* Main Footer Content - Clean Layout */}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mb-10">

          

          {/* Brand Section - Simplified */}

          <div className="lg:col-span-1 space-y-4">

            <motion.div

              initial={{ opacity: 0, y: 20 }}

              whileInView={{ opacity: 1, y: 0 }}

              viewport={{ once: true }}

              transition={{ duration: 0.5 }}

            >

              <Link to="/" className="inline-block group mb-4">

                <div className="flex items-center gap-2">

                  <div className="bg-gradient-to-r from-red-500 to-red-600 p-2 rounded-lg group-hover:scale-105 transition-transform duration-300 group-hover:shadow-[0_0_20px_rgba(239,68,68,0.6)]">

                    <FiPlayCircle className="text-white text-xl group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] transition-all duration-300" />

                  </div>

                  <h2 className="text-xl font-netflix font-bold text-white group-hover:text-red-400 transition-all duration-300 group-hover:drop-shadow-[0_0_12px_rgba(239,68,68,0.8)]">

                    {APP_CONFIG.SITE_NAME}

                  </h2>

                </div>

              </Link>

              

              <p className="text-gray-400 text-xs leading-relaxed max-w-xs mb-4">

                Your ultimate destination for streaming movies and TV series.

              </p>

              

              <a

                href={APP_CONFIG.TG_URL || "https://t.me/pboxtv"}

                target="_blank"

                rel="noopener noreferrer"

                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900/50 rounded-lg border border-gray-800 hover:border-gray-700 hover:bg-gray-900 transition-all duration-300 group hover:shadow-[0_0_15px_rgba(59,130,246,0.4)]"

              >

                <BsTelegram className="text-lg text-gray-400 group-hover:text-blue-400 transition-all duration-300 group-hover:drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]" />

                <span className="text-xs text-gray-400 group-hover:text-white transition-all duration-300 group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]">Join Telegram</span>

              </a>

            </motion.div>

          </div>



          {/* Quick Links and Content - Same Line */}
          <div className="lg:col-span-2 flex flex-row gap-4 md:gap-8 lg:gap-12">
            {/* Quick Links - Left Side */}
            <div className="flex-1">

              <motion.div

                initial={{ opacity: 0, y: 20 }}

                whileInView={{ opacity: 1, y: 0 }}

                viewport={{ once: true }}

                transition={{ duration: 0.5, delay: 0.1 }}

              >

                <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider group-hover:text-shadow-[0_0_8px_rgba(255,255,255,0.5)]">

                  Quick Links

                </h3>

                

                <nav className="space-y-2">

                  {quickAccess.map((link) => {

                    const Icon = link.icon;

                    const isActive = location.pathname === link.path;

                    

                    if (link.external) {

                      return (

                        <a

                          key={link.name}

                          href={link.path}

                          target="_blank"

                          rel="noopener noreferrer"

                          className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-all duration-300 py-1.5 group relative"

                        >

                          <Icon className="text-sm opacity-60 group-hover:opacity-100 transition-opacity group-hover:text-red-400 group-hover:drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]" />

                          <span className="group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] transition-all duration-300">{link.name}</span>

                        </a>

                      );

                    }

                    

                    return (

                      <Link

                        key={link.name}

                        to={link.path}

                        className={`flex items-center gap-2 text-xs transition-all duration-300 py-1.5 group relative ${

                          isActive ? "text-white" : "text-gray-400 hover:text-white"

                        }`}

                      >

                        <Icon className={`text-sm transition-all duration-300 ${

                          isActive 

                            ? "opacity-100 text-red-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]" 

                            : "opacity-60 group-hover:opacity-100 group-hover:text-red-400 group-hover:drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]"

                        }`} />

                        <span className={`transition-all duration-300 ${

                          isActive 

                            ? "drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" 

                            : "group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]"

                        }`}>{link.name}</span>

                      </Link>

                    );

                  })}

                </nav>

              </motion.div>

            </div>



            {/* Content Links - Right Side */}
            <div className="flex-1">

            <motion.div

              initial={{ opacity: 0, y: 20 }}

              whileInView={{ opacity: 1, y: 0 }}

              viewport={{ once: true }}

              transition={{ duration: 0.5, delay: 0.15 }}

            >

              <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">

                Content

              </h3>

              <ul className="space-y-2">

                {footerLinks[0].links.map((link, index) => (

                  <li key={index}>

                    {link.external ? (

                      <a

                        href={link.path}

                        target="_blank"

                        rel="noopener noreferrer"

                        className="text-xs text-gray-400 hover:text-white transition-all duration-300 py-1.5 block group"

                      >

                        <span className="group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] transition-all duration-300">{link.name}</span>

                      </a>

                    ) : (

                      <Link

                        to={link.path}

                        className="text-xs text-gray-400 hover:text-white transition-all duration-300 py-1.5 block group"

                      >

                        <span className="group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] transition-all duration-300">{link.name}</span>

                      </Link>

                    )}

                  </li>

                ))}

              </ul>

            </motion.div>

            </div>

          </div>



          {/* Support Links */}

          <div className="lg:col-span-1">

            <motion.div

              initial={{ opacity: 0, y: 20 }}

              whileInView={{ opacity: 1, y: 0 }}

              viewport={{ once: true }}

              transition={{ duration: 0.5, delay: 0.2 }}

            >

              <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">

                Support

              </h3>

              <ul className="space-y-2">

                {footerLinks[1].links.map((link, index) => (

                  <li key={index}>

                    {link.external ? (

                      <a

                        href={link.path}

                        target="_blank"

                        rel="noopener noreferrer"

                        className="text-xs text-gray-400 hover:text-white transition-all duration-300 py-1.5 block group"

                      >

                        <span className="group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] transition-all duration-300">{link.name}</span>

                      </a>

                    ) : (

                      <Link

                        to={link.path}

                        className="text-xs text-gray-400 hover:text-white transition-all duration-300 py-1.5 block group"

                      >

                        <span className="group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] transition-all duration-300">{link.name}</span>

                      </Link>

                    )}

                  </li>

                ))}

              </ul>

            </motion.div>

          </div>

        </div>



        {/* Bottom Section - Minimal */}

        <motion.div

          initial={{ opacity: 0 }}

          whileInView={{ opacity: 1 }}

          viewport={{ once: true }}

          transition={{ duration: 0.5 }}

          className="pt-6 border-t border-gray-900"

        >

          <div className="flex flex-col md:flex-row items-center justify-between gap-4">

            <div className="text-xs text-gray-500">

              <p>© {new Date().getFullYear()} {APP_CONFIG.SITE_NAME}. All Rights Reserved.</p>

            </div>

            

            <div className="text-xs text-gray-500">

              <p>Made with <span className="text-red-500">❤️</span> for entertainment</p>

            </div>

          </div>

        </motion.div>

      </div>

    </footer>

  );

}
