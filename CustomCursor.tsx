/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface CollaboratorCardProps {
  icon: LucideIcon;
  title: string;
  desc: string;
  channel: string;
}

const CollaboratorCard: React.FC<CollaboratorCardProps> = ({
  icon: Icon,
  title,
  desc,
  channel,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Motion values for raw cursor coordinate (normalized 0 to 1)
  const xVal = useMotionValue(0.5);
  const yVal = useMotionValue(0.5);

  // Super smooth spring configuration representing physical mass/inertia
  const springConfig = { damping: 35, stiffness: 120, mass: 1.5 };
  const smoothX = useSpring(xVal, springConfig);
  const smoothY = useSpring(yVal, springConfig);

  // 3D Tilt rotations capped strictly at max ±10°
  // Mouse at top (y=0) -> rotateX = 10 (tilts forward)
  // Mouse at bottom (y=1) -> rotateX = -10 (tilts backward)
  const rotateX = useTransform(smoothY, [0, 1], [10, -10]);
  // Mouse at left (x=0) -> rotateY = -10 (tilts left)
  // Mouse at right (x=1) -> rotateY = 10 (tilts right)
  const rotateY = useTransform(smoothX, [0, 1], [-10, 10]);

  // Dynamic Spotlight coordinates (subtle lag matches spring physics)
  const shineX = useTransform(smoothX, [0, 1], ["0%", "100%"]);
  const shineY = useTransform(smoothY, [0, 1], ["0%", "100%"]);
  
  // Sleek glossy glare sweep
  const sheenX = useTransform(smoothX, [0, 1], ["-120%", "120%"]);

  // Subtle Internal Depth (Parallax offsets of only a few pixels)
  const iconX = useTransform(smoothX, [0, 1], [-4, 4]);
  const iconY = useTransform(smoothY, [0, 1], [-4, 4]);

  const titleX = useTransform(smoothX, [0, 1], [-2, 2]);
  const titleY = useTransform(smoothY, [0, 1], [-2, 2]);

  const descX = useTransform(smoothX, [0, 1], [-1.5, 1.5]);
  const descY = useTransform(smoothY, [0, 1], [-1.5, 1.5]);

  const btnX = useTransform(smoothX, [0, 1], [-3, 3]);
  const btnY = useTransform(smoothY, [0, 1], [-3, 3]);

  // Dynamic depth shadow offset that follows the 3D tilt
  const glowOpacity = useSpring(isHovered ? 0.25 : 0, { damping: 30, stiffness: 100 });
  const shadowStyle = useTransform(
    [smoothX, smoothY, glowOpacity],
    ([sx, sy, op]) => {
      const ox = ((sx as number) - 0.5) * 15;
      const oy = ((sy as number) - 0.5) * 15;
      return `0 ${20 + oy}px ${40 - ox}px rgba(140, 16, 7, ${op})`;
    }
  );

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    
    // Normalize coordinates strictly 0 to 1
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    xVal.set(x);
    yVal.set(y);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    // Smoothly spring back to center without snapping
    xVal.set(0.5);
    yVal.set(0.5);
  };

  return (
    <div className="perspective-1000 w-full h-full">
      <motion.div
        ref={cardRef}
        className="flex flex-col h-full justify-between p-8 rounded-3xl bg-gradient-to-b from-[#080202]/90 to-[#040101]/95 border border-white/10 hover:border-[#8c1007]/40 backdrop-blur-md relative group overflow-hidden cursor-pointer select-none"
        style={{
          rotateX,
          rotateY,
          boxShadow: shadowStyle,
          transformStyle: "preserve-3d",
        }}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        whileHover={{ y: -8, scale: 1.02 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        data-hover="true"
        data-cursor-text="VIEW PARTNER"
      >
        {/* Dynamic Spotlight Glow Backdrop (follows cursor with spring damping) */}
        <motion.div 
          className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0"
          style={{
            background: useTransform(
              [shineX, shineY],
              ([sx, sy]) => `radial-gradient(circle 240px at ${sx} ${sy}, rgba(140, 16, 7, 0.16) 0%, transparent 80%)`
            ),
            opacity: isHovered ? 1 : 0,
          }}
        />

        {/* Sleek Glossy Reflection Sheen (simulates premium glass glare) */}
        <motion.div 
          className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"
          style={{
            background: "linear-gradient(105deg, transparent 35%, rgba(255, 240, 196, 0.05) 45%, rgba(255, 255, 255, 0.12) 50%, rgba(255, 240, 196, 0.05) 55%, transparent 65%)",
            x: sheenX,
          }}
        />

        {/* Dynamic Glowing Border Overlay (high-precision mask clippings) */}
        <motion.div
          className="absolute inset-0 rounded-3xl pointer-events-none z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background: useTransform(
              [shineX, shineY],
              ([sx, sy]) => `radial-gradient(circle 180px at ${sx} ${sy}, rgba(255, 240, 196, 0.22) 0%, rgba(140, 16, 7, 0.45) 60%, transparent 100%)`
            ),
            mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            maskComposite: "exclude",
            WebkitMask: "linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)",
            WebkitMaskComposite: "destination-out",
            padding: "1px"
          }}
        />

        {/* Tactical Scanning Grid Pattern (with parallax transform) */}
        <div 
          className="absolute inset-0 opacity-10 pointer-events-none transition-opacity duration-500 z-0"
          style={{
            backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.08) 1.5px, transparent 1.5px)`,
            backgroundSize: '16px 16px',
            transform: isHovered ? `translateZ(10px) scale(1.05)` : `translateZ(0px) scale(1)`,
            transition: 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)'
          }}
        />

        {/* Glowing top accent border beam */}
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#fff0c4]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10" />
        
        <div style={{ transform: "translateZ(30px)", transformStyle: "preserve-3d" }} className="relative z-10">
          <div className="flex items-center gap-4 mb-6" style={{ transform: "translateZ(20px)" }}>
            <motion.div 
              style={{ x: iconX, y: iconY }}
              className="p-3 rounded-2xl bg-gradient-to-br from-[#8c1007]/20 to-[#660b05]/20 border border-[#8c1007]/20 text-[#fff0c4] transition-transform duration-300 group-hover:scale-110 shadow-[0_0_15px_rgba(140,16,7,0.3)]"
            >
              <Icon className="w-8 h-8" />
            </motion.div>
            <motion.div style={{ x: titleX, y: titleY }}>
              <h4 className="text-xl font-bold font-heading text-white transition-colors group-hover:text-[#fff0c4]">{title}</h4>
              <div className="text-xs text-[#fff0c4]/70 font-mono mt-0.5">Content Partner</div>
            </motion.div>
          </div>
          
          <motion.p 
            style={{ x: descX, y: descY }}
            className="text-gray-300 italic text-base leading-relaxed relative z-10 pl-3 border-l-2 border-[#8c1007]/30 transition-all duration-300 group-hover:border-[#fff0c4]/50 group-hover:text-white"
          >
            {desc}
          </motion.p>
        </div>

        <motion.div 
          className="mt-8 pt-6 border-t border-white/5 flex justify-end relative z-10"
          style={{ x: btnX, y: btnY }}
        >
          <a 
            href={channel} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="inline-flex items-center gap-2 text-xs text-[#fff0c4] hover:text-[#fff0c4]/90 font-mono transition-colors border border-[#8c1007]/30 hover:border-[#fff0c4] px-4 py-2 rounded-full bg-white/5"
            data-hover="true"
            data-cursor-text="VISIT YOUTUBE CHANNEL"
          >
            Visit Channel &rarr;
          </a>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default CollaboratorCard;
