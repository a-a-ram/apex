/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React, { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { Ticket, Globe, Zap, Music, MapPin, Menu, X, Calendar, Play, ChevronLeft, ChevronRight, MessageSquare, Swords, Trophy, Users, Youtube, Upload, Sliders, RefreshCw, FileVideo, Sparkles, CheckCircle, AlertTriangle } from 'lucide-react';
import FluidBackground from './components/FluidBackground';
import GradientText from './components/GlitchText';
import CustomCursor from './components/CustomCursor';
import ArtistCard from './components/ArtistCard';
import CollaboratorCard from './components/CollaboratorCard';
import ThreePlanet from './components/ThreePlanet';
import MagnetText from './components/MagnetText';
import ThreeDWeaponCanvas from './components/ThreeDWeaponCanvas';
import { Artist } from './types';

// Dummy Data representing the moderators
const LINEUP: Artist[] = [
  { 
    id: '1', 
    name: 'Snipe Dogg', 
    genre: 'Founder', 
    day: 'FOUNDER', 
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1000&auto=format&fit=crop',
    description: 'The visionary founder of Apex Squad. Expert sniper, tactical strategist, and community leader who established the Apex Arena in 2025.',
    discord: 'indiansniper_'
  },
  { 
    id: '2', 
    name: 'Overlord', 
    genre: 'Squad Leader', 
    day: 'LEADER', 
    image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=1000&auto=format&fit=crop',
    description: 'Leading our front lines with absolute precision. Coordinates squad operations, competitive scrims, and guides members to victory.',
    discord: 'overlord022316'
  },
  { 
    id: '3', 
    name: 'Vinsole', 
    genre: 'Events Coordinator', 
    day: 'EVENTS', 
    image: 'https://images.unsplash.com/photo-1560253023-3ec5d502959f?q=80&w=1000&auto=format&fit=crop',
    description: 'Master organizer of community tournaments, custom matches, active live streams, and seasonal gaming events.',
    discord: 'vinsole0991'
  },
  { 
    id: '4', 
    name: 'Ghostpants', 
    genre: 'Community Moderator', 
    day: 'MODERATOR', 
    image: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?q=80&w=1000&auto=format&fit=crop',
    description: 'The guardian of our Discord community. Dedicated to maintaining a safe, active, and welcoming space for all squad members.',
    discord: 'muniraj6268'
  },
  { 
    id: '5', 
    name: 'Hammer Singh', 
    genre: 'Tactical Specialist', 
    day: 'COACH', 
    image: 'https://images.unsplash.com/photo-1563089145-599997674d42?q=80&w=1000&auto=format&fit=crop',
    description: 'Specializes in close-quarters combat training, map rotations, and coaching community players to reach Apex Predator status.',
    discord: 'vortex_apex'
  },
  { 
    id: '6', 
    name: 'Pingos Gaming', 
    genre: 'Scrims Organizer', 
    day: 'SCRIMS', 
    image: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=1000&auto=format&fit=crop',
    description: 'Organizes and coordinates daily competitive scrims and lobbies, ensuring fair play and high-level competition for all squads.',
    discord: 'specter_scrims'
  },
  { 
    id: '7', 
    name: 'Teen Up', 
    genre: 'Tournaments Admin', 
    day: 'TOURNAMENTS', 
    image: 'https://images.unsplash.com/photo-1612287230202-1bf1d85d1bdf?q=80&w=1000&auto=format&fit=crop',
    description: 'Handles tournament bracket administration, rule enforcement, and live score tracking during seasonal Apex Squad championships.',
    discord: 'reaper_tourneys'
  },
  { 
    id: '8', 
    name: 'Crisis', 
    genre: 'Community Lead', 
    day: 'COMMUNITY', 
    image: 'https://images.unsplash.com/photo-1548685913-fe6574340a49?q=80&w=1000&auto=format&fit=crop',
    description: 'Drives community engagement, designs social events, and manages the official squad recruitment pipelines.',
    discord: 'phoenix_squad'
  },
  { 
    id: '9', 
    name: 'Rocket', 
    genre: 'Tactical Analyst', 
    day: 'ANALYST', 
    image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1000&auto=format&fit=crop',
    description: 'Performs predictive meta analytics, optimizes weapon loadouts, and provides live squad performance feedback during competition.',
    discord: 'rocket_squad'
  },
  { 
    id: '10', 
    name: 'Zoro', 
    genre: 'Vanguard Duelist', 
    day: 'DUELIST', 
    image: 'https://images.unsplash.com/photo-1519074069444-1ba4e666440c?q=80&w=1000&auto=format&fit=crop',
    description: 'A frontline master swordsman with unparalleled reflex timing. Specializes in rapid team-wipes and aggressive offensive maneuvers.',
    discord: 'zoro_blade'
  },
  { 
    id: '11', 
    name: 'Ryvoric', 
    genre: 'Vanguard Warden', 
    day: 'WARDEN', 
    image: 'https://images.unsplash.com/photo-1618336753974-aae8e04506aa?q=80&w=1000&auto=format&fit=crop',
    description: 'The shield of Apex Squad. A frontline defender and tactical guardian who stands unwavering against any enemy squad onslaught.',
    discord: 'ryvoric_warden'
  },
];

// Animation variants for beautiful section transitions and entries
const sectionFadeIn = {
  hidden: { opacity: 0, y: 50, filter: "blur(8px)" },
  visible: { 
    opacity: 1, 
    y: 0, 
    filter: "blur(0px)",
    transition: { duration: 1.0, ease: [0.16, 1, 0.3, 1] } 
  }
};

const cardStaggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
    }
  }
};

const cardStaggerItem = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } 
  }
};

const App: React.FC = () => {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const [discordToast, setDiscordToast] = useState<string | null>(null);

  const [activeVirtualIdx, setActiveVirtualIdx] = useState(LINEUP.length);
  const [isResetting, setIsResetting] = useState(false);
  const activeIdx = activeVirtualIdx % LINEUP.length;

  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const carouselContainerRef = useRef<HTMLDivElement>(null);
  const [carouselWidth, setCarouselWidth] = useState(1200);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isResetting) {
      setIsResetting(false);
    }
  }, [isResetting]);

  useEffect(() => {
    if (selectedArtist === null) {
      setActiveVirtualIdx((prev) => (prev % LINEUP.length) + LINEUP.length);
    }
  }, [selectedArtist]);

  useEffect(() => {
    if (!carouselContainerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setCarouselWidth(entry.contentRect.width);
      }
    });
    observer.observe(carouselContainerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (selectedArtist !== null) return;
    const interval = setInterval(() => {
      setActiveVirtualIdx((prev) => prev + 1);
    }, 2200);
    return () => clearInterval(interval);
  }, [selectedArtist]);

  const [purchasingIndex, setPurchasingIndex] = useState<number | null>(null);
  const [purchasedIndex, setPurchasedIndex] = useState<number | null>(null);

  // Gaming Clip Uploader State variables
  const [uploadedClip, setUploadedClip] = useState<File | null>(null);
  const [clipPreviewUrl, setClipPreviewUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isCompiling, setIsCompiling] = useState(false);
  const [clipTitle, setClipTitle] = useState('');
  const [clipDescription, setClipDescription] = useState('');
  const [isDragActive, setIsDragActive] = useState(false);
  const [clipToast, setClipToast] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<{ message: string; details?: string; link?: string } | null>(null);

  // Auto revoke object URL to prevent memory leaks
  useEffect(() => {
    return () => {
      if (clipPreviewUrl) {
        URL.revokeObjectURL(clipPreviewUrl);
      }
    };
  }, [clipPreviewUrl]);

  const handleDriveUpload = async () => {
    if (!uploadedClip) return;
    setIsUploading(true);
    setUploadError(null);
    setClipToast("Initializing transmission...");
 
    try {
      const formData = new FormData();
      formData.append("video", uploadedClip);
      formData.append("title", clipTitle || `Apex Ilets Clutch Clip - ${new Date().toLocaleDateString()}`);
      formData.append("description", `Warzone Clutch highlight clip uploaded directly via Apex Ilets Tactical Hub.`);
 
      const response = await fetch("/api/upload-drive", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
 
      let data: any = {};
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const textResponse = await response.text();
        data = { error: "Server returned a non-JSON response", details: textResponse };
      }
 
      if (response.ok && data.success) {
        setClipToast("Mission complete. Video uploaded.");
        setTimeout(() => {
          setClipToast(null);
        }, 4000);

        // Open the uploaded video in a new tab if requested, or just showcase it
        setTimeout(() => {
          if (data.videoUrl) {
            window.open(data.videoUrl, '_blank');
          }
        }, 1500);
        
        // Reset states
        setUploadedClip(null);
        setClipTitle('');
        if (clipPreviewUrl) URL.revokeObjectURL(clipPreviewUrl);
        setClipPreviewUrl(null);
      } else if (response.status === 412 || data.status === 412) {
        setClipToast("Upload Halted: Credentials required.");
        setTimeout(() => {
          setClipToast(null);
        }, 6000);
        setUploadError({
          message: "Google Drive credentials not fully configured.",
          details: data.message || "GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REFRESH_TOKEN must be configured in AI Studio Env Variables."
        });
      } else {
        const errDetail = data.details ? (typeof data.details === 'object' ? JSON.stringify(data.details) : data.details) : '';
        console.error("Upload failed with error details:", errDetail);
        
        // Check if the error is Google Drive API disabled
        let extractedLink = "";
        if (errDetail && errDetail.includes("drive.googleapis.com")) {
          const match = errDetail.match(/(https:\/\/console\.[^\s"'\\]+project=\d+|https:\/\/console\.[^\s"'\\]+)/);
          if (match) {
            extractedLink = match[0];
          } else {
            extractedLink = "https://console.cloud.google.com/apis/library/drive.googleapis.com";
          }
        }

        setClipToast(`Error: ${data.error || 'Upload failed'}`);
        setTimeout(() => {
          setClipToast(null);
        }, 6000);
        setUploadError({
          message: data.error || "Failed to complete upload.",
          details: errDetail,
          link: extractedLink || undefined
        });
      }
    } catch (err: any) {
      console.error("Google Drive upload error:", err);
      setClipToast("Transmission offline! Check server logs.");
      setTimeout(() => {
        setClipToast(null);
      }, 6000);
      setUploadError({
        message: "Transmission offline!",
        details: err?.message || "Check server logs for unhandled errors."
      });
    } finally {
      setIsUploading(false);
    }
  };

  const startClipCompilation = (file: File) => {
    setUploadedClip(file);
    if (clipPreviewUrl) URL.revokeObjectURL(clipPreviewUrl);
    setClipPreviewUrl(URL.createObjectURL(file));
    setIsCompiling(true);
    setUploadProgress(0);

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsCompiling(false);
          return 100;
        }
        const step = Math.floor(Math.random() * 15) + 5;
        return Math.min(prev + step, 100);
      });
    }, 150);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('video/')) {
        startClipCompilation(file);
      } else {
        setClipToast("Invalid Format! Please upload a video clip.");
        setTimeout(() => setClipToast(null), 3000);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type.startsWith('video/')) {
        startClipCompilation(file);
      } else {
        setClipToast("Invalid Format! Please upload a video clip.");
        setTimeout(() => setClipToast(null), 3000);
      }
    }
  };

  // Map artist ID to weapon type
  const getWeaponType = (id: string): 'sniper' | 'rifle' | 'smg' | 'katana' | 'hammer' | 'pistol' | 'shotgun' | 'bow' | 'rocket' | 'dual_swords' | 'shield_sword' | null => {
    if (id === '1') return 'sniper';
    if (id === '2') return 'rifle';
    if (id === '3') return 'smg';
    if (id === '4') return 'katana';
    if (id === '5') return 'hammer';
    if (id === '6') return 'pistol';
    if (id === '7') return 'shotgun';
    if (id === '8') return 'bow';
    if (id === '9') return 'rocket';
    if (id === '10') return 'dual_swords';
    if (id === '11') return 'shield_sword';
    return null;
  };

  // Luxury top announcement banner messages
  const bannerMessages = [
    "Meta Apex for Clips and Game Attacks",
    "Join the Arena ● Dominate with Elite Tactical Squads",
    "Submit your clips to be featured in the Video of the Week"
  ];
  const [bannerIndex, setBannerIndex] = useState(0);
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('en-US', {
        timeZone: 'Asia/Kolkata',
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }));
    };
    updateClock();
    const clockInterval = setInterval(updateClock, 1000);
    return () => clearInterval(clockInterval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setBannerIndex((prev) => (prev + 1) % bannerMessages.length);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  // Handle keyboard navigation for artist modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedArtist) return;
      if (e.key === 'ArrowLeft') navigateArtist('prev');
      if (e.key === 'ArrowRight') navigateArtist('next');
      if (e.key === 'Escape') setSelectedArtist(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedArtist]);

  const handlePurchase = (index: number) => {
    setPurchasingIndex(index);
    setTimeout(() => {
      setPurchasingIndex(null);
      setPurchasedIndex(index);
    }, 3500);
  };

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      const headerOffset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const navigateArtist = (direction: 'next' | 'prev') => {
    if (!selectedArtist) return;
    const currentIndex = LINEUP.findIndex(a => a.id === selectedArtist.id);
    let nextIndex;
    if (direction === 'next') {
      nextIndex = (currentIndex + 1) % LINEUP.length;
      setActiveVirtualIdx((prev) => prev + 1);
    } else {
      nextIndex = (currentIndex - 1 + LINEUP.length) % LINEUP.length;
      setActiveVirtualIdx((prev) => prev - 1);
    }
    setSelectedArtist(LINEUP[nextIndex]);
  };

  const cardWidth = windowWidth < 768 ? 220 : 280;
  const gap = windowWidth < 768 ? 4 : 8;
  const translateX = (carouselWidth / 2) - (activeVirtualIdx * (cardWidth + gap)) - (cardWidth / 2);
  
  return (
    <div className="relative min-h-screen text-white selection:bg-[#8c1007] selection:text-[#fff0c4] cursor-auto md:cursor-none overflow-x-hidden">
      <CustomCursor />
      <FluidBackground />
      
      {/* Top Luxury Announcement Banner */}
      <div className="absolute top-0 left-0 right-0 z-55 h-9 bg-gradient-to-b from-[#060100] to-[#080201] flex items-center justify-center overflow-hidden">
        <div className="w-full max-w-7xl px-6 md:px-12 flex items-center justify-between">
          <div className="hidden md:flex items-center gap-2 text-[10px] font-mono text-[#fff0c4] uppercase tracking-[0.25em]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#8c1007] animate-pulse" />
            BROADCAST
          </div>
          
          <div className="flex-1 flex justify-center items-center h-9 relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={bannerIndex}
                initial={{ opacity: 0, filter: "blur(3px)", y: 4 }}
                animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                exit={{ opacity: 0, filter: "blur(3px)", y: -4 }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
                className="text-xs md:text-sm font-medium tracking-[0.15em] text-[#fff0c4]/95 uppercase font-mono text-center flex items-center gap-3"
              >
                <span className="text-[#8c1007]/60 font-bold">•</span>
                {bannerMessages[bannerIndex]}
                <span className="text-[#8c1007]/60 font-bold">•</span>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="hidden md:flex items-center gap-2 text-[10px] font-mono text-[#fff0c4]/40 uppercase tracking-[0.25em]">
            IST {timeStr}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="absolute top-9 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 py-5 bg-gradient-to-b from-[#080201] via-[#0a0201]/85 to-transparent transition-all duration-300">
        <div className="z-50 cursor-pointer">
          <MagnetText 
            text="APEX SQUAD" 
            className="text-lg md:text-xl font-bold tracking-tighter"
          />
        </div>
        
        {/* Desktop Menu */}
        <div className="hidden md:flex gap-8 text-xs md:text-sm font-bold tracking-widest uppercase items-center">
          {[
            { name: 'METAS', url: 'https://discord.com/channels/1511457449360752690/1511758689009270785' },
            { name: 'Clips & Streams', url: 'https://discord.com/channels/1511457449360752690/1511457452481187883' },
            { name: 'Gamer tags', url: 'https://discord.com/channels/1511457449360752690/1512613907284365403' }
          ].map((item) => (
            <a 
              key={item.name} 
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#fff0c4] hover:opacity-100 opacity-80 transition-colors text-white cursor-pointer decoration-none font-mono"
              data-hover="true"
              data-cursor-text="Go to Discord"
            >
              {item.name}
            </a>
          ))}
        </div>
        <button 
          onClick={() => scrollToSection('tickets')}
          className="hidden md:inline-block border border-[#8c1007]/60 px-6 py-2.5 rounded-full text-xs font-bold tracking-widest uppercase hover:bg-[#8c1007] hover:text-[#fff0c4] transition-all duration-300 text-[#fff0c4] cursor-pointer bg-transparent"
          data-hover="true"
          data-cursor-text="Join Our Community"
        >
          Join Our Discord
        </button>

        {/* Mobile Menu Toggle */}
        <button 
          className="md:hidden text-white z-50 relative w-10 h-10 flex items-center justify-center bg-black/30 rounded-full border border-white/10"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
           {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 bg-[#060100]/95 backdrop-blur-xl flex flex-col items-center justify-center gap-8 md:hidden"
          >
            {[
              { name: 'METAS', url: 'https://discord.com/channels/1511457449360752690/1511758689009270785' },
              { name: 'Clips & Streams', url: 'https://discord.com/channels/1511457449360752690/1511457452481187883' },
              { name: 'Gamer tags', url: 'https://discord.com/channels/1511457449360752690/1512613907284365403' }
            ].map((item) => (
              <a
                key={item.name}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileMenuOpen(false)}
                className="text-2xl font-heading font-bold text-white hover:text-[#fff0c4] transition-colors uppercase decoration-none font-mono"
              >
                {item.name}
              </a>
            ))}
            <button 
              onClick={() => {
                setMobileMenuOpen(false);
                scrollToSection('tickets');
              }}
              className="mt-8 border border-[#8c1007] px-8 py-3.5 rounded-full text-xs font-bold tracking-widest uppercase bg-[#8c1007] text-[#fff0c4] shadow-lg"
            >
              Join Our Discord
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HERO SECTION */}
      <header className="relative h-[100svh] min-h-[650px] flex items-center justify-center overflow-hidden px-6 md:px-12 pt-24 md:pt-28">
        <div className="z-10 w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center pb-24 md:pb-20">
          {/* Left Column: Title and details */}
          <motion.div 
            style={{ y, opacity }}
            className="lg:col-span-6 text-center lg:text-left flex flex-col items-center lg:items-start w-full"
          >
             {/* Since 2025 badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="flex items-center gap-3 text-xs md:text-sm font-mono text-[#fff0c4] tracking-[0.2em] md:tracking-[0.3em] uppercase mb-4 bg-black/40 px-4 py-2 rounded-full backdrop-blur-md border border-white/10"
            >
              <span>Since 2025</span>
              <span className="w-1.5 h-1.5 bg-[#8c1007] rounded-full animate-pulse"/>
              <span>Apex Arena</span>
            </motion.div>

            {/* Main Title with Letter Magnetism */}
            <div className="relative w-full flex lg:justify-start justify-center items-center mb-6">
              <MagnetText 
                text="APEX SQUAD" 
                className="text-[12vw] sm:text-[10vw] lg:text-[5.5vw] leading-[0.9] font-black tracking-tighter" 
              />
            </div>
            
            <motion.div
               initial={{ scaleX: 0 }}
               animate={{ scaleX: 1 }}
               transition={{ duration: 1.5, delay: 0.5, ease: "circOut" }}
               className="w-full max-w-md h-px bg-gradient-to-r from-transparent via-white/40 to-transparent lg:via-white/20 mt-2 mb-6"
            />

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 1 }}
              className="text-base md:text-xl font-light max-w-xl lg:mx-0 mx-auto text-white/90 leading-relaxed drop-shadow-lg"
            >
              The definitive hub for top-tier gameplay. Join tactical squads, review advanced metas, submit premium clips, and compete alongside elite gamers in the Apex Arena.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0, duration: 1 }}
              className="mt-8 flex gap-4"
            >
              <button 
                onClick={() => scrollToSection('tickets')}
                className="border-2 border-[#8c1007] hover:bg-[#8c1007] hover:text-[#fff0c4] text-[#fff0c4] px-8 py-3.5 rounded-full text-xs font-bold tracking-widest uppercase transition-all duration-300 bg-transparent hover:shadow-[0_0_20px_rgba(140,16,7,0.3)]"
                data-hover="true"
                data-cursor-text="JOIN DISCORD"
              >
                Join Discord
              </button>
            </motion.div>
          </motion.div>

          {/* Right Column: 3D Planet */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.5, delay: 0.4, ease: "easeOut" }}
            className="hidden lg:block lg:col-span-6 h-[500px] xl:h-[650px] relative"
          >
            <ThreePlanet />
          </motion.div>
        </div>

        {/* MARQUEE - Redesigned to blend seamlessly with feathered soft edges */}
        <div className="absolute bottom-12 md:bottom-16 left-0 w-full py-4 md:py-6 bg-gradient-to-r from-transparent via-[#8c1007]/12 to-transparent text-[#fff0c4] z-20 overflow-hidden border-y border-[#8c1007]/15 backdrop-blur-[2px]">
          {/* Soft feathered fading edge masks */}
          <div className="absolute left-0 top-0 bottom-0 w-24 md:w-56 bg-gradient-to-r from-[#060100] via-[#060100]/70 to-transparent pointer-events-none z-30" />
          <div className="absolute right-0 top-0 bottom-0 w-24 md:w-56 bg-gradient-to-l from-[#060100] via-[#060100]/70 to-transparent pointer-events-none z-30" />

          <motion.div 
            className="flex w-fit will-change-transform"
            animate={{ x: "-50%" }}
            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          >
            {/* Duplicate content for seamless loop */}
            {[0, 1].map((key) => (
              <div key={key} className="flex whitespace-nowrap shrink-0">
                {[...Array(2)].map((_, i) => (
                  <span key={i} className="text-3xl md:text-5xl font-heading font-black px-8 flex items-center gap-6">
                    WARZONE 
                    <svg viewBox="0 0 100 100" className="w-8 h-8 fill-none inline-block text-[#fff0c4]/40" xmlns="http://www.w3.org/2000/svg"><path d="M50 5 L15 30 V65 L50 95 L85 65 V30 Z" stroke="currentColor" strokeWidth="6" fill="none" /><path d="M50 20 V80 M20 50 H80" stroke="currentColor" strokeWidth="4" /></svg>
                    VALORANT 
                    <svg viewBox="0 0 100 100" className="w-8 h-8 fill-current inline-block text-[#fff0c4]/40" xmlns="http://www.w3.org/2000/svg"><path d="M10 20 L45 20 L25 80 Z M55 20 L90 20 L75 55 Z M75 62 L81 80 L55 80 Z" /></svg>
                    CODM 
                    <svg viewBox="0 0 100 100" className="w-8 h-8 fill-none inline-block text-[#fff0c4]/40" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="6" fill="none" /><path d="M30 40 L40 50 L30 60 M70 40 L60 50 L70 60 M50 25 V75 M25 50 H75" stroke="currentColor" strokeWidth="4" /></svg>
                    CALL OF DUTY 
                    <span className="text-[#fff0c4]/30 text-2xl md:text-4xl">●</span> 
                  </span>
                ))}
              </div>
            ))}
          </motion.div>
        </div>
      </header>

      {/* MODERATORS SECTION (Lineup) */}
      <section id="lineup" className="relative z-10 pt-10 md:pt-14 pb-4 md:pb-6 overflow-hidden">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          className="max-w-[1600px] mx-auto px-4 md:px-6 relative z-10"
        >
          <motion.div 
            variants={sectionFadeIn}
            className="flex flex-col md:flex-row justify-between items-end mb-2 md:mb-4 px-4"
          >
             <h2 className="text-5xl md:text-8xl font-heading font-bold uppercase leading-[0.9] drop-shadow-lg break-words w-full md:w-auto">
              <GradientText text="APEX SQUAD" className="text-5xl md:text-8xl" /> <br/> 
              <GradientText text="MODERATORS" className="text-5xl md:text-8xl" />
             </h2>
          </motion.div>
 
          <div ref={carouselContainerRef} className="relative w-full overflow-hidden py-4 md:py-6 px-4 md:px-0">
            <motion.div 
              className="flex items-center"
              animate={{ x: translateX }}
              transition={isResetting ? { duration: 0 } : { type: "spring", stiffness: 60, damping: 15 }}
              onAnimationComplete={() => {
                const N = LINEUP.length;
                if (activeVirtualIdx >= 2 * N) {
                  setIsResetting(true);
                  setActiveVirtualIdx(activeVirtualIdx - N);
                } else if (activeVirtualIdx < N) {
                  setIsResetting(true);
                  setActiveVirtualIdx(activeVirtualIdx + N);
                }
              }}
              style={{ 
                gap: `${gap}px`,
                width: "max-content"
              }}
            >
              {[...LINEUP, ...LINEUP, ...LINEUP].map((artist, index) => {
                const distance = Math.abs(index - activeVirtualIdx);
                const isCenter = distance === 0;
                const uniqueKey = `${artist.id}-${index}`;
                
                // Beautifully fade in and out of the flow progressively based on distance from the focal center
                const scale = distance === 0 ? 1.05 : distance === 1 ? 0.88 : distance === 2 ? 0.72 : 0.65;
                const opacity = distance === 0 ? 1 : distance === 1 ? 0.55 : distance === 2 ? 0.15 : 0;
                const zIndex = 10 - distance;

                return (
                  <motion.div 
                    key={uniqueKey} 
                    className="shrink-0 relative select-none"
                    style={{
                      width: `${cardWidth}px`,
                      zIndex: zIndex,
                    }}
                    animate={{
                      scale: scale,
                      opacity: opacity,
                      filter: isCenter ? "drop-shadow(0 0 35px rgba(140, 16, 7, 0.3))" : "drop-shadow(0 0 0px rgba(0,0,0,0))",
                    }}
                    transition={{ type: "spring", stiffness: 120, damping: 20 }}
                  >
                    <ArtistCard 
                      artist={artist} 
                      onClick={() => {
                        setActiveVirtualIdx(index);
                        setSelectedArtist(artist);
                      }} 
                    />
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* COLLABORATORS SECTION */}
      <section id="experience" className="relative z-10 pt-4 md:pt-6 pb-6 md:pb-8 overflow-hidden">
        {/* Decorative blurred circle */}
        <div className="absolute top-1/2 right-[-20%] w-[50vw] h-[50vw] bg-[#8c1007]/10 rounded-full blur-[40px] pointer-events-none will-change-transform" style={{ transform: 'translateZ(0)' }} />

        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          className="max-w-7xl mx-auto px-6 relative z-10"
        >
          <motion.div 
            variants={sectionFadeIn}
            className="text-center mb-16 max-w-3xl mx-auto"
          >
            <h2 className="text-4xl md:text-7xl font-heading font-bold mb-6 leading-tight">
              <GradientText text="OUR COLLABORATORS" className="text-4xl md:text-7xl" />
            </h2>
            <p className="text-lg md:text-xl text-gray-200 font-light leading-relaxed drop-shadow-md">
              Apex Squad is built alongside premium content creators, streamers, and competitive legends. Meet our official collaborators and see their feedback about the community.
            </p>
          </motion.div>
          
          <motion.div 
            variants={cardStaggerContainer}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {[
              { 
                icon: Youtube, 
                title: 'Hammer Singh', 
                desc: '"The absolute best gaming clan out there. Non-stop action, incredible teammates, and unmatched vibes!"',
                channel: 'https://www.youtube.com/@HammerSinghCOD' 
              },
              { 
                icon: Youtube, 
                title: 'Pingos Gaming', 
                desc: '"Joined since day one. The events are insanely coordinated, and the community is like a second family."',
                channel: 'https://www.youtube.com/@Pingosgaming1' 
              },
              { 
                icon: Youtube, 
                title: 'Snipe Dogg', 
                desc: '"If you are serious about Warzone and Valorant, this is the squad you want to be running with. Elite class."',
                channel: 'https://www.youtube.com/@SNIPE-DOGG' 
              },
              { 
                icon: Youtube, 
                title: 'Ryvoric', 
                desc: '"Absolutely premier gaming events and tactical squad coordination. The community\'s energy and passion is unrivaled!"',
                channel: 'https://www.youtube.com/@Ryvoric' 
              },
            ].map((feature, i) => (
              <motion.div key={i} variants={cardStaggerItem} className="h-full">
                <CollaboratorCard 
                  icon={feature.icon}
                  title={feature.title}
                  desc={feature.desc}
                  channel={feature.channel}
                />
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* VIDEO OF THE WEEK SECTION */}
      <section id="video-of-the-week" className="relative z-10 pt-6 md:pt-8 pb-16 md:pb-24 overflow-hidden">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          className="max-w-6xl mx-auto px-4 md:px-8 relative z-10"
        >
          <motion.div variants={sectionFadeIn} className="text-center mb-12">
            <div className="text-xs font-mono text-[#fff0c4] uppercase tracking-[0.3em] mb-3">
              Apex Highlights
            </div>
            <h2 className="text-4xl md:text-6xl font-heading font-black tracking-tight mb-4">
              <GradientText text="VIDEO OF THE WEEK" className="text-4xl md:text-6xl" />
            </h2>
            <p className="text-gray-300 text-sm md:text-base max-w-xl mx-auto font-light leading-relaxed">
              Check out our featured community showcase, presenting tactical maneuvers and god-tier clutches from the arena.
            </p>
          </motion.div>

          <motion.div variants={sectionFadeIn} className="relative mx-auto max-w-4xl">
            {/* Immersive Outer Cyber Glow Shell */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#8c1007]/20 via-[#660b05]/20 to-[#3e0703]/20 rounded-3xl blur-2xl opacity-70" />
            
            <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-black/80 shadow-2xl p-4 md:p-6 backdrop-blur-xl">
              {/* Embed YouTube player inside a flawless aspect-video container */}
              <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-white/15 bg-black group/video">
                <iframe
                  className="absolute inset-0 w-full h-full"
                  src="https://www.youtube.com/embed/ts35dysMOic?rel=0&modestbranding=1"
                  title="Video of the Week Player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
              
              <div className="mt-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#8c1007] animate-pulse" />
                    <span className="text-xs font-mono text-gray-400 uppercase tracking-widest">Featured High-Tier Gameplay</span>
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold font-heading text-white">
                    Apex Squad Live Stream & Community Showcase
                  </h3>
                </div>
                <div className="flex items-center gap-3">
                  <a 
                    href="https://www.youtube.com/@SNIPE-DOGG"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-mono font-bold px-4 py-2 rounded-full border border-red-600 bg-red-700/80 text-white hover:bg-red-600 hover:text-white hover:scale-105 transition-all duration-300 flex items-center gap-1.5 cursor-pointer uppercase tracking-wider"
                    data-hover="true"
                    data-cursor-text="SUBSCRIBE ON YOUTUBE"
                  >
                    <Youtube className="w-3.5 h-3.5" /> SUBSCRIBE
                  </a>
                </div>
              </div>
            </div>
          </motion.div>

          {/* DRAG-AND-DROP GAMING CLIP SUBMISSION COMPONENT */}
          <motion.div variants={sectionFadeIn} className="relative mx-auto max-w-4xl mt-16 md:mt-24">
            <div className="absolute inset-0 bg-gradient-to-r from-[#8c1007]/15 via-[#660b05]/10 to-transparent rounded-3xl blur-xl opacity-60" />
            
            <div className="relative rounded-3xl overflow-hidden border border-[#8c1007]/20 bg-black/85 shadow-2xl p-6 md:p-8 backdrop-blur-xl">
              <div className="flex items-center gap-2 mb-4">
                <span className="px-2.5 py-1 text-[9px] font-mono font-bold tracking-widest text-[#fff0c4] bg-[#8c1007]/30 border border-[#8c1007]/40 rounded">
                  TRANSMISSION HUB
                </span>
                <span className="text-xs font-mono text-gray-400 uppercase tracking-widest">SQUAD RECRUITS & CLIPS</span>
              </div>
              
              <h3 className="text-2xl md:text-3.5xl font-heading font-bold mb-3">
                <GradientText text="SUBMIT YOUR CLUTCH CLIPS" className="text-2xl md:text-3.5xl" />
              </h3>
              <p className="text-gray-300 text-sm font-light leading-relaxed mb-6 max-w-2xl">
                Executed a flawless team wipe or a 500m sniper headshot? Drag and drop your clip below. We'll automatically upload it directly to our secure Google Drive vault for clan commanders to review!
              </p>

              {/* Drag Zone or Player panel */}
              {!uploadedClip ? (
                <div 
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('clip-file-input')?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 md:p-12 text-center transition-all duration-300 cursor-pointer flex flex-col items-center justify-center min-h-[220px] ${
                    isDragActive 
                      ? 'border-[#fff0c4] bg-[#8c1007]/15 shadow-[0_0_25px_rgba(140,16,7,0.35)]' 
                      : 'border-[#8c1007]/35 bg-white/[0.02] hover:border-[#8c1007] hover:bg-white/[0.04]'
                  }`}
                >
                  <input 
                    id="clip-file-input"
                    type="file" 
                    accept="video/*" 
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  <div className="p-4 rounded-full bg-[#8c1007]/10 border border-[#8c1007]/25 text-[#fff0c4] mb-4 group-hover:scale-110 transition-transform">
                    <Upload className="w-8 h-8 text-[#fff0c4] animate-bounce" />
                  </div>
                  <h4 className="text-base font-bold text-white mb-1 uppercase tracking-wide">
                    Drag & Drop gameplay clip
                  </h4>
                  <p className="text-xs text-gray-400 max-w-md font-light">
                    or click to browse your storage. Supports MP4, MOV, WEBM up to 250MB.
                  </p>
                </div>
              ) : isCompiling ? (
                /* Scanning & compilation state */
                <div className="border-2 border-[#8c1007]/30 rounded-2xl p-8 md:p-12 text-center bg-black/90 flex flex-col items-center justify-center min-h-[220px]">
                  <RefreshCw className="w-8 h-8 text-[#fff0c4] animate-spin mb-4 animate-duration-[2.5s]" />
                  <h4 className="text-base font-mono font-bold text-white uppercase tracking-widest mb-2">
                    EXTRACTING STREAMING DATA
                  </h4>
                  <p className="text-xs text-gray-400 font-mono mb-4">
                    PREPARING ENCRYPTED DATAPACKS: {uploadProgress}%
                  </p>
                  
                  {/* High Tech Progress bar */}
                  <div className="w-full max-w-md h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/10 relative">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-[#8c1007] to-[#fff0c4]"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              ) : (
                /* Clip loaded and preview ready! */
                <div className="space-y-6">
                  {/* Dynamic Tactical Clip Player with futuristic details */}
                  <div className="relative rounded-2xl overflow-hidden border border-white/15 bg-black/95 aspect-video max-h-[380px] mx-auto flex items-center justify-center">
                    {clipPreviewUrl && (
                      <video 
                        src={clipPreviewUrl} 
                        controls 
                        className="w-full h-full object-contain max-h-[385px]"
                      />
                    )}
                    <div className="absolute top-4 left-4 pointer-events-none flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#8c1007] animate-ping" />
                      <span className="text-[10px] font-mono bg-black/80 px-2 py-0.5 rounded border border-white/10 text-white uppercase tracking-widest">
                        Tactical Stream Locked
                      </span>
                    </div>
                  </div>

                  {/* Metadata display */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl border border-white/5 bg-white/[0.02]">
                    <div>
                      <div className="text-[10px] font-mono text-gray-400 uppercase">File Name</div>
                      <div className="text-sm font-bold text-white truncate">{uploadedClip.name}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-mono text-gray-400 uppercase">Format & Weight</div>
                      <div className="text-sm font-bold text-[#fff0c4] font-mono">
                        {uploadedClip.type.split('/')[1]?.toUpperCase() || 'VIDEO'} / {(uploadedClip.size / (1024 * 1024)).toFixed(2)} MB
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-mono text-gray-400 uppercase">Dispatch Target</div>
                      <div className="text-sm font-bold text-[#fff0c4] font-mono">Google Drive Folder</div>
                    </div>
                  </div>

                  {/* Input description for Google Drive upload */}
                  <div className="space-y-2">
                    <label className="text-xs font-mono text-gray-400 uppercase tracking-wider block">
                      Video Title & Tactical Intel Details
                    </label>
                    <input 
                      type="text"
                      placeholder="e.g. Insane 1v4 clutch using TAQ-56 on Ashika Island!"
                      value={clipTitle}
                      onChange={(e) => setClipTitle(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-[#8c1007] transition-colors"
                      disabled={isUploading}
                    />
                  </div>

                  {/* Error banner */}
                  {uploadError && (
                    <div className="p-4 rounded-xl border border-red-900/40 bg-red-950/20 text-red-200 text-sm space-y-2">
                      <div className="flex items-start gap-2.5">
                        <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-white">{uploadError.message}</p>
                          {uploadError.details && (
                            <p className="text-xs text-red-400 font-mono mt-1 break-all max-h-[160px] overflow-y-auto bg-black/30 p-2 rounded border border-white/5">
                              {uploadError.details}
                            </p>
                          )}
                        </div>
                      </div>
                      {uploadError.link && (
                        <div className="mt-3 pt-2 border-t border-red-900/30 flex justify-end">
                          <a 
                            href={uploadError.link} 
                            target="_blank" 
                            rel="referrer"
                            className="text-xs font-bold text-red-400 hover:text-white underline inline-flex items-center gap-1 bg-red-900/30 px-3 py-1.5 rounded transition-all"
                          >
                            <span>Enable Google Drive API in your Cloud Console &rarr;</span>
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex flex-col sm:flex-row gap-4 pt-2">
                    <button 
                      onClick={() => {
                        // Reset Clip
                        setUploadedClip(null);
                        setClipTitle('');
                        if (clipPreviewUrl) URL.revokeObjectURL(clipPreviewUrl);
                        setClipPreviewUrl(null);
                      }}
                      className="px-6 py-3.5 rounded-xl border border-white/10 hover:border-white/20 text-gray-300 hover:text-white transition-all text-sm font-mono tracking-wider uppercase flex items-center justify-center gap-2 bg-white/5"
                      disabled={isUploading}
                    >
                      Clear Clip
                    </button>
                    
                    <button 
                      onClick={handleDriveUpload}
                      disabled={isUploading}
                      className="flex-1 px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#8c1007] to-[#b0160a] text-white font-bold text-sm uppercase tracking-widest hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#8c1007]/25 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isUploading ? (
                        <RefreshCw className="w-4 h-4 animate-spin text-[#fff0c4]" />
                      ) : (
                        <Sparkles className="w-4 h-4 animate-pulse text-[#fff0c4]" />
                      )}
                      <span>{isUploading ? "Uploading..." : "Just Upload"}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* JOIN SECTION (Tickets) */}
      <section id="tickets" className="relative z-10 pt-20 md:pt-32 pb-0 bg-black/40 backdrop-blur-md overflow-hidden">
        {/* Background YouTube Video */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 opacity-40">
          <iframe
            className="absolute top-1/2 left-1/2 w-[300%] h-[300%] -translate-x-1/2 -translate-y-1/2 aspect-video pointer-events-none"
            src="https://www.youtube.com/embed/P_G_NCD-6rE?autoplay=1&mute=1&loop=1&playlist=P_G_NCD-6rE&controls=0&showinfo=0&rel=0&iv_load_policy=3&playsinline=1&enablejsapi=1"
            title="HQ Portal Background Video"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
          {/* Subtle dark-red shadow overlay to maintain the professional theme and maximize contrast */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#060100]/95 via-[#060100]/70 to-[#060100]/95" />
        </div>

        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.25 }}
          variants={sectionFadeIn}
          className="max-w-6xl mx-auto relative z-10 px-4 md:px-6 pb-20 md:pb-28"
        >
          <div className="relative w-full flex justify-center items-center mb-12 md:mb-16">
             <MagnetText 
               text="HQ PORTAL" 
               className="text-[12vw] sm:text-[10vw] lg:text-[5.5vw] leading-[0.9] font-black tracking-tighter" 
             />
          </div>
          
          <div className="flex justify-center">
            {/* Contact Card */}
            <div className="w-full max-w-xl">
               <motion.div
                whileHover={{ y: -10 }}
                className="relative p-8 md:p-12 border border-[#8c1007]/30 backdrop-blur-md flex flex-col justify-between min-h-[400px] w-full bg-gradient-to-b from-[#3e0703]/60 to-[#060100]/90 shadow-[0_0_50px_rgba(140,16,7,0.15)] rounded-2xl"
                data-hover="true"
                data-cursor-text="JOIN APEX HQ"
              >
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-[#8c1007] to-transparent" />
                
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-2xl md:text-3xl font-heading font-bold mb-2">
                      <GradientText text="CONTACT US THROUGH DISCORD" className="text-2xl md:text-3xl" />
                    </h3>
                    <div className="text-xs font-mono text-[#fff0c4] mb-6 tracking-widest uppercase">
                       OFFICIAL INVITE PORTAL
                    </div>
                    
                    <ul className="space-y-4 text-sm text-gray-200">
                      <li className="flex items-center gap-3">
                        <Users className="w-5 h-5 text-[#fff0c4]" /> 
                        Instant community matchmaking & team recruitment
                      </li>
                      <li className="flex items-center gap-3">
                        <Trophy className="w-5 h-5 text-[#fff0c4]" /> 
                        Access to daily custom lobbies & squad events
                      </li>
                      <li className="flex items-center gap-3">
                        <MessageSquare className="w-5 h-5 text-[#fff0c4]" /> 
                        Dedicated channels for METAS, Clips, and Gamer tags
                      </li>
                      <li className="flex items-center gap-3">
                        <Swords className="w-5 h-5 text-[#8c1007]" /> 
                        24/7 direct moderation support & squad updates
                      </li>
                    </ul>
                  </div>
                </div>
                
                <a 
                  href="https://discord.gg/YvGcHHXtw"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-4 text-sm font-bold uppercase tracking-[0.2em] border border-[#8c1007]/40 bg-[#8c1007]/15 hover:bg-[#8c1007] hover:text-[#fff0c4] transition-all duration-300 mt-8 text-center rounded-xl text-[#fff0c4] hover:shadow-[0_0_20px_rgba(140,16,7,0.4)] block"
                >
                  Click here to join
                </a>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* FOOTER - nested inside for seamless background video flow */}
        <footer className="relative z-10 h-9 w-full bg-gradient-to-t from-[#060100] to-[#080201] border-t border-white/5 flex items-center justify-center overflow-hidden">
          <div className="w-full max-w-7xl px-6 md:px-12 flex items-center justify-between h-full">
            <div className="flex items-center justify-center">
               <MagnetText 
                 text="APEX SQUAD" 
                 className="text-xs md:text-sm font-bold tracking-tighter"
               />
            </div>
            
            <div className="flex items-center justify-end">
              <a href="https://discord.gg/YvGcHHXtw" target="_blank" rel="noopener noreferrer" className="text-[#fff0c4] hover:text-[#fff0c4]/80 font-bold uppercase text-[10px] md:text-xs tracking-widest transition-colors cursor-pointer decoration-none font-mono" data-hover="true" data-cursor-text="JOIN SERVER">
                Join Discord Server
              </a>
            </div>
          </div>
        </footer>
      </section>

      {/* Moderator Detail Modal */}
      <AnimatePresence>
        {selectedArtist && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedArtist(null)}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-md cursor-auto"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-[92%] max-w-lg md:max-w-4xl lg:max-w-5xl max-h-[85vh] md:max-h-[90vh] bg-[#060100] border border-[#8c1007]/15 flex flex-col md:flex-row shadow-2xl shadow-[#8c1007]/10 group/modal rounded-2xl overflow-hidden"
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedArtist(null)}
                className="absolute top-4 right-4 z-50 p-2.5 rounded-full bg-[#8c1007] text-[#fff0c4] hover:bg-red-700 transition-colors shadow-lg border border-[#fff0c4]/20"
                data-hover="true"
                data-cursor-text="Close"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Navigation Buttons */}
              <button
                onClick={(e) => { e.stopPropagation(); navigateArtist('prev'); }}
                className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-20 p-2 sm:p-2.5 rounded-full bg-black/60 text-white hover:bg-[#8c1007] hover:text-[#fff0c4] hover:scale-105 transition-all border border-white/10 backdrop-blur-sm shadow-lg"
                data-hover="true"
                data-cursor-text="Previous Moderator"
                aria-label="Previous Moderator"
              >
                <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>

              <button
                onClick={(e) => { e.stopPropagation(); navigateArtist('next'); }}
                className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-20 p-2 sm:p-2.5 rounded-full bg-black/60 text-white hover:bg-[#8c1007] hover:text-[#fff0c4] hover:scale-105 transition-all border border-white/10 backdrop-blur-sm shadow-lg"
                data-hover="true"
                data-cursor-text="Next Moderator"
                aria-label="Next Moderator"
              >
                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>

              {/* Image / Video Side */}
              <div className="w-full md:w-1/2 h-52 sm:h-64 md:h-auto relative overflow-hidden bg-black flex items-center justify-center p-6 md:p-8 bg-gradient-to-b from-black to-[#050100] flex-shrink-0">
                {selectedArtist && getWeaponType(selectedArtist.id) && (
                  <ThreeDWeaponCanvas type={getWeaponType(selectedArtist.id)!} isHovered={true} />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#060100] via-transparent to-transparent md:bg-gradient-to-r pointer-events-none z-20" />
              </div>

              {/* Content Side */}
              <div className="w-full md:w-1/2 p-6 sm:p-8 md:p-12 pb-8 md:pb-12 flex flex-col justify-center relative bg-[#0b0201]/95 overflow-y-auto max-h-[50vh] md:max-h-none flex-grow">
                <motion.div
                  key={selectedArtist.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                >
                  <div className="flex items-center gap-3 text-[#fff0c4]/70 mb-4">
                     <MessageSquare className="w-4 h-4" />
                     <span className="font-mono text-sm tracking-widest uppercase">{selectedArtist.day}</span>
                  </div>
                  
                  <h3 className="text-3xl sm:text-4xl md:text-5xl font-heading font-bold uppercase leading-none mb-2 text-white">
                    {selectedArtist.name}
                  </h3>
                  
                  <p className="text-base sm:text-lg text-[#fff0c4] font-medium tracking-widest uppercase mb-6">
                    {selectedArtist.genre}
                  </p>
                  
                  <div className="h-px w-20 bg-white/20 mb-6" />
                  
                  <p className="text-gray-300 leading-relaxed text-sm sm:text-base font-light mb-8">
                    {selectedArtist.description}
                  </p>

                  <div className="space-y-3 mb-6">
                    <button 
                      onClick={() => {
                        const username = selectedArtist.discord || '';
                        if (username) {
                          navigator.clipboard.writeText(username).then(() => {
                            setDiscordToast(username);
                            setTimeout(() => setDiscordToast(null), 3000);
                          }).catch(err => {
                            console.error('Failed to copy text: ', err);
                          });
                          // Open Discord's Direct Messages / Friend Addition hub in a new tab
                          window.open('https://discord.com/channels/@me', '_blank');
                        }
                      }}
                      className="border border-[#8c1007]/50 bg-[#8c1007]/15 hover:bg-[#8c1007] text-[#fff0c4] hover:text-white transition-all duration-300 px-7 py-3.5 rounded-full text-xs font-mono tracking-widest uppercase text-center font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#8c1007]/10 relative overflow-hidden group/discordbtn w-full sm:w-auto"
                      data-hover="true"
                      data-cursor-text="Copy Username"
                    >
                      <MessageSquare className="w-4 h-4 text-[#fff0c4] group-hover/discordbtn:scale-110 transition-transform" />
                      <span>Connect with @{selectedArtist.discord}</span>
                    </button>
                    <p className="text-[10px] font-mono text-gray-400 uppercase tracking-wider flex items-center gap-1.5 justify-center sm:justify-start">
                      <span className="w-1.5 h-1.5 bg-[#8c1007] rounded-full animate-ping" />
                      Click copies username & opens Discord friend portal
                    </p>
                  </div>


                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {discordToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] px-6 py-4 bg-black/95 border-2 border-[#8c1007] rounded-xl flex flex-col items-center gap-1.5 shadow-[0_0_20px_rgba(140,16,7,0.4)] backdrop-blur-md text-center max-w-sm w-[90%]"
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
              <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">TACTICAL TRANSMISSION LOCK</span>
            </div>
            <p className="text-sm font-heading font-bold text-[#fff0c4] uppercase tracking-wide">
              @{discordToast} Copied!
            </p>
            <p className="text-[10px] text-gray-400 font-mono uppercase tracking-widest leading-normal">
              PASTE IT IN DISCORD'S "ADD FRIEND" PORTAL TO ADD THEM DIRECTLY
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {clipToast && (
          <motion.div
            initial={{ opacity: 0, y: -30, x: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, x: 20, scale: 0.9 }}
            onClick={() => setClipToast(null)}
            className="fixed top-24 right-6 sm:right-10 z-[100] px-6 py-4 bg-black/95 border-2 border-[#8c1007] rounded-xl flex flex-col items-center gap-1.5 shadow-[0_0_20px_rgba(140,16,7,0.4)] backdrop-blur-md text-center max-w-sm w-[90%] sm:w-80 cursor-pointer hover:bg-black/80 transition-colors"
            title="Click to dismiss"
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
              <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">TRANSMISSION AUTHORIZED</span>
            </div>
            <p className="text-sm font-heading font-bold text-[#fff0c4] uppercase tracking-wide">
              {clipToast}
            </p>
            <p className="text-[10px] text-gray-400 font-mono uppercase tracking-widest leading-normal">
              CLICK TO DISMISS OR DRAG YOUR CLIP INTO THE CHANNEL NOW!
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;