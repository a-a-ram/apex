/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React, { useEffect, useState } from 'react';
import { motion, useSpring, useMotionValue } from 'framer-motion';

const CustomCursor: React.FC = () => {
  const [isHovering, setIsHovering] = useState(false);
  const [cursorText, setCursorText] = useState('Go to Discord');
  
  // Initialize off-screen to prevent flash
  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);
  
  // Smooth spring animation
  const springConfig = { damping: 20, stiffness: 350, mass: 0.1 }; 
  const x = useSpring(mouseX, springConfig);
  const y = useSpring(mouseY, springConfig);

  useEffect(() => {
    const updateMousePosition = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);

      const target = e.target as HTMLElement;
      const clickable = target.closest('button') || 
                        target.closest('a') || 
                        target.closest('[data-hover="true"]');
      setIsHovering(!!clickable);
      if (clickable) {
        const text = clickable.getAttribute('data-cursor-text') || 'Go to Discord';
        setCursorText(text);
      } else {
        setCursorText('Go to Discord');
      }
    };

    window.addEventListener('mousemove', updateMousePosition, { passive: true });
    return () => window.removeEventListener('mousemove', updateMousePosition);
  }, [mouseX, mouseY]);

  return (
    <motion.div
      className="fixed top-0 left-0 z-[9999] pointer-events-none mix-blend-difference flex items-center justify-center hidden md:flex will-change-transform"
      style={{ x, y, translateX: '-50%', translateY: '-50%' }}
    >
      {/* This div is the actual cursor "body" and will handle the scaling and text centering */}
      <motion.div
        className="relative bg-white shadow-[0_0_15px_rgba(255,255,255,0.4)] flex items-center justify-center px-4"
        animate={{
          width: isHovering ? 180 : 24,
          height: isHovering ? 44 : 24,
          borderRadius: isHovering ? "22px" : "50%",
        }}
        transition={{ type: "spring", stiffness: 320, damping: 22 }}
      >
        {/* Text directly inside the scalable cursor body, centered by flex parent */}
        <motion.span 
          className="z-10 text-black font-black uppercase tracking-widest text-[9px] overflow-hidden whitespace-nowrap"
          initial={{ opacity: 0 }}
          animate={{ 
            opacity: isHovering ? 1 : 0,
          }}
          transition={{ duration: 0.2 }}
        >
          {cursorText}
        </motion.span>
      </motion.div>
    </motion.div>
  );
};

export default CustomCursor;