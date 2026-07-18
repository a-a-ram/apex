/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Artist } from '../types';
import { ArrowUpRight, Crosshair, Shield, Cpu, Activity } from 'lucide-react';
import ThreeDWeaponCanvas from './ThreeDWeaponCanvas';

interface ArtistCardProps {
  artist: Artist;
  onClick: () => void;
}

const ArtistCard: React.FC<ArtistCardProps> = ({ 
  artist, 
  onClick,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Motion values for 3D tilt
  const xVal = useMotionValue(0.5);
  const yVal = useMotionValue(0.5);

  // Smooth springs for tilt angles
  const tiltX = useSpring(useTransform(yVal, [0, 1], [15, -15]), { damping: 25, stiffness: 220 });
  const tiltY = useSpring(useTransform(xVal, [0, 1], [-15, 15]), { damping: 25, stiffness: 220 });

  // Shine position following cursor
  const shineX = useTransform(xVal, [0, 1], ["0%", "100%"]);
  const shineY = useTransform(yVal, [0, 1], ["0%", "100%"]);

  // Local state for coordinate text to avoid slow text rendering in high frequency
  const [coords, setCoords] = useState({ x: 0, y: 0 });

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

  const weaponType = getWeaponType(artist.id);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    
    // Relative position from 0 to 1
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    xVal.set(x);
    yVal.set(y);

    // Pixel coordinates relative to center
    const pxX = Math.round(e.clientX - rect.left - rect.width / 2);
    const pxY = Math.round(e.clientY - rect.top - rect.height / 2);
    setCoords({ x: pxX, y: pxY });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    // Smoothly reset tilt back to center
    xVal.set(0.5);
    yVal.set(0.5);
    setCoords({ x: 0, y: 0 });
  };

  return (
    <div className="perspective-1000 w-full max-w-[340px] md:max-w-none mx-auto h-[340px] md:h-[430px]">
      <motion.div
        ref={cardRef}
        className="relative w-full h-full rounded-2xl overflow-hidden bg-gradient-to-b from-[#080202] to-[#040101] border border-white/10 hover:border-[#8c1007]/50 cursor-pointer shadow-lg hover:shadow-2xl hover:shadow-[#8c1007]/10 transition-all duration-300 flex flex-col justify-between"
        style={{
          rotateX: tiltX,
          rotateY: tiltY,
          transformStyle: "preserve-3d",
        }}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        onClick={onClick}
        data-hover="true"
        data-cursor-text={`Lock ${artist.name}`}
      >
        {/* Dynamic Spotlight Glow Backdrop */}
        <motion.div 
          className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0"
          style={{
            background: useTransform(
              [shineX, shineY],
              ([sx, sy]) => `radial-gradient(circle 220px at ${sx} ${sy}, rgba(140, 16, 7, 0.15) 0%, transparent 80%)`
            ),
            opacity: isHovered ? 1 : 0,
          }}
        />

        {/* Tactical Scanning Grid Pattern (Creates rich depth / parallax) */}
        <div 
          className="absolute inset-0 opacity-20 pointer-events-none transition-opacity duration-500 z-0"
          style={{
            backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.08) 1.5px, transparent 1.5px)`,
            backgroundSize: '18px 18px',
            transform: isHovered ? `translateZ(10px) scale(1.05)` : `translateZ(0px) scale(1)`,
            transition: 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)'
          }}
        />

        {/* Rotating Concentric HUD Dials (Aesthetic sci-fi radar) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden z-0 opacity-15">
          <motion.div 
            className="w-80 h-80 rounded-full border border-dashed border-[#8c1007]/40 flex items-center justify-center"
            animate={{ rotate: isHovered ? 360 : 0 }}
            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          >
            <div className="w-64 h-64 rounded-full border border-double border-[#fff0c4]/25 flex items-center justify-center">
              <motion.div 
                className="w-48 h-48 rounded-full border border-dashed border-[#8c1007]/30"
                animate={{ rotate: isHovered ? -360 : 0 }}
                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
              />
            </div>
          </motion.div>
        </div>

        {/* Animated Scanning Laser Line */}
        {isHovered && (
          <motion.div 
            className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#8c1007] to-transparent shadow-[0_0_8px_rgba(140,16,7,0.8)] z-10 pointer-events-none"
            initial={{ top: "0%" }}
            animate={{ top: "100%" }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
          />
        )}

        {/* 3D Wireframe Animated Weapon Component */}
        {weaponType && (
          <div 
            className="absolute inset-0 z-10 pointer-events-none"
            style={{ transform: "translateZ(30px)" }}
          >
            <ThreeDWeaponCanvas type={weaponType} isHovered={isHovered} />
          </div>
        )}

        {/* TOP PANEL: ID, Status, and Tech Indicators */}
        <div 
          className="relative z-20 p-4 md:p-5 flex justify-between items-start pointer-events-none select-none"
          style={{ transform: "translateZ(15px)" }}
        >
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-mono border border-white/20 px-2.5 py-0.5 rounded-md backdrop-blur-md text-[#fff0c4] bg-black/40 tracking-widest uppercase">
              MOD {artist.id}
            </span>
            <div className="flex items-center gap-1.5 text-[9px] font-mono text-gray-400">
              <span className={`w-1.5 h-1.5 rounded-full ${isHovered ? 'bg-[#8c1007] animate-pulse' : 'bg-green-500'}`} />
              {isHovered ? 'TRACKING_LOCK' : 'ONLINE'}
            </div>
          </div>

          <div className="flex flex-col items-end gap-1.5 font-mono text-[9px] text-gray-400">
            <div className="flex items-center gap-1">
              <Crosshair className="w-3 h-3 text-[#8c1007]" />
              <span>X: {coords.x} Y: {coords.y}</span>
            </div>
            <div className="flex items-center gap-1 text-[8px] text-[#fff0c4]/40">
              <Activity className="w-3 h-3 text-[#fff0c4]/30" />
              <span>SYS_OK</span>
            </div>
          </div>
        </div>

        {/* BOTTOM PANEL: Title, Description, and Link indicator */}
        <div 
          className="relative z-20 p-4 md:p-5 flex flex-col pointer-events-none select-none"
          style={{ transform: "translateZ(25px)" }}
        >
          {/* Subtle line divider */}
          <div className="w-12 h-[1px] bg-[#8c1007] mb-3 transition-all duration-300 group-hover:w-full" />

          <div className="flex justify-between items-end">
            <div>
              <div className="overflow-hidden">
                <h3 className="font-heading text-xl md:text-2xl font-bold uppercase text-white tracking-tight">
                  {artist.name}
                </h3>
              </div>
              <p className="text-[10px] md:text-xs font-semibold uppercase tracking-widest text-[#fff0c4] mt-1 flex items-center gap-1.5">
                <Cpu className="w-3 h-3 text-[#8c1007]" />
                {artist.genre}
              </p>
            </div>

            <motion.div
              variants={{
                rest: { opacity: 0, scale: 0.8 },
                hover: { opacity: 1, scale: 1 }
              }}
              animate={isHovered ? "hover" : "rest"}
              className="bg-[#8c1007] text-[#fff0c4] rounded-full p-2 shadow-lg border border-[#fff0c4]/20 transition-all duration-300"
            >
              <ArrowUpRight className="w-4 h-4" />
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ArtistCard;
