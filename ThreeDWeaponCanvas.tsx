import React, { useRef } from 'react';
import { motion, useSpring } from 'framer-motion';

interface MagnetLetterProps {
  char: string;
}

const MagnetLetter: React.FC<MagnetLetterProps> = ({ char }) => {
  const ref = useRef<HTMLSpanElement>(null);
  
  // Springs for organic, smooth cursor magnet movement
  const x = useSpring(0, { stiffness: 120, damping: 12 });
  const y = useSpring(0, { stiffness: 120, damping: 12 });

  const handleMouseMove = (e: React.MouseEvent<HTMLSpanElement>) => {
    if (!ref.current) return;
    
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    // Mouse coordinates relative to character center
    const mouseX = e.clientX - rect.left - width / 2;
    const mouseY = e.clientY - rect.top - height / 2;
    
    // Magnet pull factor (35% attraction with 18px maximum range)
    const pullX = mouseX * 0.35;
    const pullY = mouseY * 0.35;
    
    const clampX = Math.max(-18, Math.min(18, pullX));
    const clampY = Math.max(-18, Math.min(18, pullY));

    x.set(clampX);
    y.set(clampY);
  };

  const handleMouseLeave = () => {
    // Return smoothly to rest position
    x.set(0);
    y.set(0);
  };

  return (
    <motion.span
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ x, y }}
      className="inline-block cursor-pointer select-none font-black tracking-tight hover:text-white transition-colors duration-200 active:scale-95 text-[#fff0c4]"
      whileHover={{
        scale: 1.15,
        filter: "drop-shadow(0 0 8px rgba(255, 240, 196, 0.6))",
      }}
    >
      {char}
    </motion.span>
  );
};

interface MagnetTextProps {
  text: string;
  className?: string;
}

export const MagnetText: React.FC<MagnetTextProps> = ({ text, className = '' }) => {
  return (
    <div className={`flex flex-wrap gap-x-3 gap-y-1 select-none ${className}`}>
      {text.split(' ').map((word, wordIndex) => (
        <span key={wordIndex} className="inline-flex whitespace-nowrap">
          {word.split('').map((char, charIndex) => (
            <MagnetLetter key={charIndex} char={char} />
          ))}
        </span>
      ))}
    </div>
  );
};

export default MagnetText;
