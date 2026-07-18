import React, { useRef, useEffect } from 'react';

const ThreePlanet: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = canvas.width;
    let height = canvas.height;

    // Track size of container
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width: entryWidth, height: entryHeight } = entry.contentRect;
        canvas.width = entryWidth * window.devicePixelRatio;
        canvas.height = entryHeight * window.devicePixelRatio;
        width = canvas.width;
        height = canvas.height;
      }
    });

    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }

    // Set initial size
    canvas.width = canvas.parentElement ? canvas.parentElement.clientWidth * window.devicePixelRatio : 500;
    canvas.height = canvas.parentElement ? canvas.parentElement.clientHeight * window.devicePixelRatio : 500;
    width = canvas.width;
    height = canvas.height;

    // Interactive Physics State
    let rotX = 0.3; // Initial tilt
    let rotY = 0;   // Initial spin
    
    const baseVelY = 0.0018; // Majestic slower automatic rotation speed around Y axis
    let velX = 0;            // Rotation speed around X axis
    let velY = baseVelY;     // Current rotation speed around Y axis

    let mouseX = 0; // Relative mouse X (-1 to 1)
    let mouseY = 0; // Relative mouse Y (-1 to 1)
    let isHovering = false;

    // Handle mouse movement across the parent container
    const handleMouseMove = (e: MouseEvent) => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      // Calculate relative position (-1 to 1) within the planet's radius
      mouseX = (e.clientX - centerX) / (rect.width / 2);
      mouseY = (e.clientY - centerY) / (rect.height / 2);
      
      // We are hovering if cursor is relatively close to the canvas area
      isHovering = Math.abs(mouseX) < 1.5 && Math.abs(mouseY) < 1.5;
    };

    const handleMouseLeave = () => {
      isHovering = false;
      mouseX = 0;
      mouseY = 0;
    };

    window.addEventListener('mousemove', handleMouseMove);
    canvas.parentElement?.addEventListener('mouseleave', handleMouseLeave);

    // --- 3D Model Procedural Assets ---
    // Generate dotted tech-continents on a unit sphere
    interface Point3D {
      x: number;
      y: number;
      z: number;
      color: string;
      size: number;
      isCapital?: boolean;
    }

    const continentPoints: Point3D[] = [];
    const sphereRadius = 1;

    // Procedural continent test based on detailed multi-frequency spherical noise
    const isContinent = (x: number, y: number, z: number) => {
      // Elegant multi-octave noise to build detailed, beautiful jagged landmasses
      const n1 = Math.sin(x * 2.5) * Math.cos(y * 2.5) * Math.sin(z * 2.5);
      const n2 = Math.cos(x * 5.5 + 1.2) * Math.sin(z * 5.5) * 0.45;
      const n3 = Math.sin(y * 11.0) * Math.cos(x * 11.0) * 0.25;
      const n4 = Math.sin(x * 22.0 + y * 15.0) * Math.cos(z * 22.0) * 0.12; // Fine detail
      const n5 = Math.cos(z * 35.0) * Math.sin(y * 35.0) * 0.05;           // Ultra-fine island detail
      return (n1 + n2 + n3 + n4 + n5) > -0.14;
    };

    // Distribute points evenly using Fibonacci Sphere algorithm (Dense and detailed)
    const totalPoints = 4200;
    for (let i = 0; i < totalPoints; i++) {
      const y = 1 - (i / (totalPoints - 1)) * 2; // y goes from 1 to -1
      const radiusAtY = Math.sqrt(1 - y * y); // radius at y

      const goldenRatio = (1 + Math.sqrt(5)) / 2;
      const theta = 2 * Math.PI * i / goldenRatio;

      const x = Math.cos(theta) * radiusAtY;
      const z = Math.sin(theta) * radiusAtY;

      if (isContinent(x, y, z)) {
        // High-fidelity details: varying sizes and colorful crimson gradient particles
        const rand = Math.random();
        let color = '#8c1007'; // Core tactical red
        let isCapital = false;
        let size = 0.9 + Math.random() * 1.3;

        if (rand > 0.97) {
          color = '#fff0c4'; // Golden tactical hub / major city
          isCapital = true;
          size = 1.6 + Math.random() * 1.0;
        } else if (rand > 0.82) {
          color = '#e63946'; // Bright active neon alert zone
          size = 1.1 + Math.random() * 0.7;
        } else if (rand > 0.55) {
          color = '#b0160a'; // Medium tactical crimson
        } else if (rand > 0.25) {
          color = '#5a0a04'; // Deep shadow burgundy
        } else {
          color = '#2d0301'; // Dark volcanic/crust shadow
        }

        continentPoints.push({
          x, y, z,
          color,
          size,
          isCapital
        });
      }
    }

    // Generate tech circuitry nodes and routes in warm gold/cream
    const techNodes: Point3D[] = [];
    const connections: [number, number][] = [];
    const numNodes = 55; // Increased node count for detailed grid

    for (let i = 0; i < numNodes; i++) {
      const phi = Math.random() * Math.PI * 2;
      const theta = Math.acos((Math.random() * 2) - 1);
      const x = Math.sin(theta) * Math.cos(phi);
      const y = Math.sin(theta) * Math.sin(phi);
      const z = Math.cos(theta);

      // Distribute some nodes on continents, some floating
      techNodes.push({
        x, y, z,
        color: Math.random() > 0.3 ? '#fff0c4' : '#e63946', // Golden and vibrant neon red nodes
        size: 1.8 + Math.random() * 1.6
      });
    }

    // Connect close nodes to form high-tech communication links
    for (let i = 0; i < numNodes; i++) {
      let nodeConnections = 0;
      for (let j = i + 1; j < numNodes; j++) {
        const dx = techNodes[i].x - techNodes[j].x;
        const dy = techNodes[i].y - techNodes[j].y;
        const dz = techNodes[i].z - techNodes[j].z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        // Connect if close and cap connections per node to keep lines clean yet intricate
        if (dist < 0.55 && nodeConnections < 3 && Math.random() > 0.2) {
          connections.push([i, j]);
          nodeConnections++;
        }
      }
    }

    // Star field space environment
    const stars: { x: number; y: number; z: number; size: number; alpha: number }[] = [];
    for (let i = 0; i < 110; i++) {
      stars.push({
        x: (Math.random() - 0.5) * 1000,
        y: (Math.random() - 0.5) * 1000,
        z: -200 - Math.random() * 300,
        size: 0.6 + Math.random() * 1.4,
        alpha: 0.15 + Math.random() * 0.75
      });
    }

    // High tech satellites circling the planet with glowing vectors
    interface Satellite {
      angle: number;
      speed: number;
      orbitRadius: number;
      tiltX: number;
      tiltZ: number;
      color: string;
      trail: { x: number; y: number; z: number }[];
    }
    const satellites: Satellite[] = [
      {
        angle: 0,
        speed: 0.007,
        orbitRadius: 1.35,
        tiltX: 0.4,
        tiltZ: 0.2,
        color: '#fff0c4',
        trail: []
      },
      {
        angle: Math.PI / 2,
        speed: -0.010,
        orbitRadius: 1.48,
        tiltX: -0.3,
        tiltZ: -0.5,
        color: '#e63946',
        trail: []
      },
      {
        angle: Math.PI,
        speed: 0.005,
        orbitRadius: 1.62,
        tiltX: 0.6,
        tiltZ: -0.2,
        color: '#8c1007',
        trail: []
      }
    ];

    // Flat Cyber Ring around the planet with multiple bands
    interface RingParticle {
      angle: number;
      distance: number;
      size: number;
      speed: number;
      color: string;
      yOffset: number;
    }
    const ringParticles: RingParticle[] = [];
    // Generated more particles for high density
    for (let i = 0; i < 320; i++) {
      const isInnerBand = Math.random() > 0.5;
      const baseDistance = isInnerBand 
        ? 1.15 + Math.random() * 0.25  // Inner dense golden-crimson band
        : 1.45 + Math.random() * 0.40; // Outer sparser red band

      ringParticles.push({
        angle: Math.random() * Math.PI * 2,
        distance: baseDistance,
        size: 0.5 + Math.random() * 1.6,
        speed: (0.0004 + Math.random() * 0.0008) * (isInnerBand ? 1.2 : 0.8), 
        color: Math.random() > 0.45 ? '#fff0c4' : '#8c1007', 
        yOffset: (Math.random() - 0.5) * 0.04
      });
    }

    // --- Dynamic 3D Matrix Rotation Helper ---
    const rotate3D = (x: number, y: number, z: number, thetaX: number, thetaY: number) => {
      // Rotation around X-axis
      const cosX = Math.cos(thetaX);
      const sinX = Math.sin(thetaX);
      const y1 = y * cosX - z * sinX;
      const z1 = y * sinX + z * cosX;
      const x1 = x;

      // Rotation around Y-axis
      const cosY = Math.cos(thetaY);
      const sinY = Math.sin(thetaY);
      const x2 = x1 * cosY + z1 * sinY;
      const z2 = -x1 * sinY + z1 * cosY;
      const y2 = y1;

      return { x: x2, y: y2, z: z2 };
    };

    // Main real-time render loop
    const render = () => {
      // 1. Calculate Target Velocities based on Cursor Magnet Position (with gentler scaling for slower speeds)
      let targetVelY = baseVelY;
      let targetVelX = 0;

      if (isHovering) {
        // Horizontal cursor speeds up rotation to the cursor side (significantly dampened for buttery luxury)
        targetVelY = baseVelY + mouseX * 0.012;
        
        // Vertical cursor tilts/rotates along the X axis
        targetVelX = mouseY * 0.012;
      }

      // Smooth interpolation for extreme luxury feel
      velY += (targetVelY - velY) * 0.04;
      velX += (targetVelX - velX) * 0.04;

      // Update angles
      rotY += velY;
      rotX += velX;

      // Clear Canvas
      ctx.clearRect(0, 0, width, height);

      const ctxWidth = width / window.devicePixelRatio;
      const ctxHeight = height / window.devicePixelRatio;

      const centerX = width / 2;
      const centerY = height / 2;
      const baseScale = Math.min(ctxWidth, ctxHeight) / 500;
      const planetRadius = 155 * baseScale; // Bigger premium planet size

      ctx.save();
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

      // Helper to draw beautiful, depth-sorted 3D circles (Latitude/Longitude lines)
      const draw3DRingOnSphereFull = (
        pointsGenerator: (t: number) => { x: number; y: number; z: number },
        frontColor: string,
        backColor: string,
        lineWidth: number,
        isDashed = false
      ) => {
        const steps = 72;
        const projectedPoints: { sx: number; sy: number; z: number }[] = [];
        
        for (let s = 0; s < steps; s++) {
          const t = (s / steps) * Math.PI * 2;
          const pt = pointsGenerator(t);
          const rotated = rotate3D(pt.x, pt.y, pt.z, rotX, rotY);
          projectedPoints.push({
            sx: (ctxWidth / 2) + rotated.x * planetRadius,
            sy: (ctxHeight / 2) + rotated.y * planetRadius,
            z: rotated.z
          });
        }
        
        if (isDashed) {
          ctx.setLineDash([2, 5]);
        } else {
          ctx.setLineDash([]);
        }

        ctx.lineWidth = lineWidth;

        // 1. Draw back sections (Z < 0) - thin and faint
        ctx.strokeStyle = backColor;
        ctx.beginPath();
        let drawingBack = false;
        for (let s = 0; s <= steps; s++) {
          const idx = s % steps;
          const p = projectedPoints[idx];
          if (p.z < 0) {
            if (!drawingBack) {
              ctx.moveTo(p.sx, p.sy);
              drawingBack = true;
            } else {
              ctx.lineTo(p.sx, p.sy);
            }
          } else {
            drawingBack = false;
          }
        }
        ctx.stroke();

        // 2. Draw front sections (Z >= 0) - brighter
        ctx.strokeStyle = frontColor;
        ctx.beginPath();
        let drawingFront = false;
        for (let s = 0; s <= steps; s++) {
          const idx = s % steps;
          const p = projectedPoints[idx];
          if (p.z >= 0) {
            if (!drawingFront) {
              ctx.moveTo(p.sx, p.sy);
              drawingFront = true;
            } else {
              ctx.lineTo(p.sx, p.sy);
            }
          } else {
            drawingFront = false;
          }
        }
        ctx.stroke();
        ctx.setLineDash([]); // Reset dash
      };

      // 1. Render Galactic Starfield Background
      stars.forEach(star => {
        // Dynamic twinkle
        star.alpha += (Math.random() - 0.5) * 0.04;
        star.alpha = Math.max(0.1, Math.min(0.9, star.alpha));
        
        ctx.fillStyle = `rgba(255, 240, 196, ${star.alpha * 0.6})`; // Warm starlight matching our theme
        const sx = (star.x * baseScale) + (ctxWidth / 2);
        const sy = (star.y * baseScale) + (ctxHeight / 2);
        
        ctx.beginPath();
        ctx.arc(sx, sy, star.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // 2. Beautiful Deep Atmospheric Space Aura (Behind)
      const auraGrad = ctx.createRadialGradient(
        ctxWidth / 2,
        ctxHeight / 2,
        planetRadius * 0.7,
        ctxWidth / 2,
        ctxHeight / 2,
        planetRadius * 1.5
      );
      auraGrad.addColorStop(0, 'rgba(102, 11, 5, 0.45)'); // Deep crimson center glow
      auraGrad.addColorStop(0.4, 'rgba(62, 7, 3, 0.35)'); // Dark crimson brown halo
      auraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = auraGrad;
      ctx.beginPath();
      ctx.arc(ctxWidth / 2, ctxHeight / 2, planetRadius * 1.6, 0, Math.PI * 2);
      ctx.fill();

      // 3. Render Background Half of the Flat Cyber Orbital Ring (Depth Z < 0)
      const ringTilt = 18 * Math.PI / 180; // Tilts orbit slightly
      ringParticles.forEach(p => {
        p.angle += p.speed;
        
        // 3D polar ring coordinates
        const rx = Math.cos(p.angle) * p.distance;
        const rz = Math.sin(p.angle) * p.distance;
        const ry = p.yOffset;

        // Apply 3D space rotation matching the planet's rotation & interactive tilt
        const rotated = rotate3D(rx, ry, rz, rotX + ringTilt, rotY);

        if (rotated.z < 0) {
          const screenX = (ctxWidth / 2) + rotated.x * planetRadius;
          const screenY = (ctxHeight / 2) + rotated.y * planetRadius;
          const size = p.size * (1 + rotated.z * 0.35) * baseScale;

          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(screenX, screenY, Math.max(0.6, size), 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // 4. DRAW PLANET SPHERE LAYER
      ctx.save();
      ctx.beginPath();
      ctx.arc(ctxWidth / 2, ctxHeight / 2, planetRadius, 0, Math.PI * 2);
      ctx.clip(); // Clip all continents/tech grids inside the planet boundary

      // 4a. Planet Core Dark Space Canvas
      ctx.fillStyle = '#060100'; // Darkest crimson-black background
      ctx.fillRect(
        (ctxWidth / 2) - planetRadius,
        (ctxHeight / 2) - planetRadius,
        planetRadius * 2,
        planetRadius * 2
      );

      // 4b. Draw Holographic Dotted Landmasses (Z >= 0)
      continentPoints.forEach(p => {
        const rotated = rotate3D(p.x, p.y, p.z, rotX, rotY);
        
        // Render only if on the front hemisphere
        if (rotated.z >= -0.1) {
          const screenX = (ctxWidth / 2) + rotated.x * planetRadius;
          const screenY = (ctxHeight / 2) + rotated.y * planetRadius;
          
          // Size scale based on depth for real 3D depth perception
          const dotSize = p.size * (1 + rotated.z * 0.45) * baseScale;
          const alpha = Math.max(0.15, Math.min(0.9, rotated.z + 0.15));

          ctx.fillStyle = p.color === '#fff0c4'
            ? `rgba(255, 240, 196, ${alpha * 0.9})`
            : p.color === '#e63946'
            ? `rgba(230, 57, 70, ${alpha * 0.85})`
            : p.color === '#8c1007' 
            ? `rgba(140, 16, 7, ${alpha})` 
            : `rgba(90, 10, 4, ${alpha * 0.75})`;

          ctx.beginPath();
          ctx.arc(screenX, screenY, dotSize, 0, Math.PI * 2);
          ctx.fill();

          // Extra neon halo glow for main cities (capitals)
          if (p.isCapital && alpha > 0.4) {
            ctx.fillStyle = `rgba(255, 240, 196, ${alpha * 0.25})`;
            ctx.beginPath();
            ctx.arc(screenX, screenY, dotSize * 2.8, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      });

      // 4c. Draw Holographic Rotating 3D Grid Lines (Latitude & Longitude)
      const frontGridColor = 'rgba(255, 240, 196, 0.15)'; // High-visibility golden front
      const backGridColor = 'rgba(140, 16, 7, 0.05)';     // Ultra-faint crimson back

      // Equator
      draw3DRingOnSphereFull(
        (t) => ({ x: Math.cos(t), y: 0, z: Math.sin(t) }),
        frontGridColor, backGridColor, 1.0, true
      );
      // Latitude 0.4
      draw3DRingOnSphereFull(
        (t) => ({ x: Math.cos(t) * Math.sqrt(1 - 0.16), y: 0.4, z: Math.sin(t) * Math.sqrt(1 - 0.16) }),
        frontGridColor, backGridColor, 0.8, true
      );
      // Latitude -0.4
      draw3DRingOnSphereFull(
        (t) => ({ x: Math.cos(t) * Math.sqrt(1 - 0.16), y: -0.4, z: Math.sin(t) * Math.sqrt(1 - 0.16) }),
        frontGridColor, backGridColor, 0.8, true
      );

      // Meridian 1 (0 deg)
      draw3DRingOnSphereFull(
        (t) => ({ x: Math.cos(t), y: Math.sin(t), z: 0 }),
        frontGridColor, backGridColor, 0.8, true
      );
      // Meridian 2 (60 deg)
      draw3DRingOnSphereFull(
        (t) => ({ x: Math.cos(t) * Math.cos(Math.PI / 3), y: Math.sin(t), z: Math.cos(t) * Math.sin(Math.PI / 3) }),
        frontGridColor, backGridColor, 0.8, true
      );
      // Meridian 3 (120 deg)
      draw3DRingOnSphereFull(
        (t) => ({ x: Math.cos(t) * Math.cos(2 * Math.PI / 3), y: Math.sin(t), z: Math.cos(t) * Math.sin(2 * Math.PI / 3) }),
        frontGridColor, backGridColor, 0.8, true
      );

      // 4d. Draw Cyber Circuits & Tech Nodes (Z >= 0)
      // Rotated Nodes list
      const rotatedNodes = techNodes.map(n => rotate3D(n.x, n.y, n.z, rotX, rotY));

      // Draw circuitry link connections
      ctx.strokeStyle = 'rgba(255, 240, 196, 0.18)'; // Gold circuitry lines
      ctx.lineWidth = 1.2;
      connections.forEach(([i, j]) => {
        const n1 = rotatedNodes[i];
        const n2 = rotatedNodes[j];

        // Draw if both nodes are relatively on the front side
        if (n1.z >= 0 && n2.z >= 0) {
          const x1 = (ctxWidth / 2) + n1.x * planetRadius;
          const y1 = (ctxHeight / 2) + n1.y * planetRadius;
          const x2 = (ctxWidth / 2) + n2.x * planetRadius;
          const y2 = (ctxHeight / 2) + n2.y * planetRadius;

          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
      });

      // Draw nodes themselves
      techNodes.forEach((node, idx) => {
        const rotated = rotatedNodes[idx];
        if (rotated.z >= 0) {
          const screenX = (ctxWidth / 2) + rotated.x * planetRadius;
          const screenY = (ctxHeight / 2) + rotated.y * planetRadius;
          const size = node.size * (1 + rotated.z * 0.3) * baseScale;

          // Glowing Core Node (White-gold)
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(screenX, screenY, size, 0, Math.PI * 2);
          ctx.fill();

          // Subtle Gold Aura glow around nodes
          ctx.fillStyle = 'rgba(255, 240, 196, 0.35)';
          ctx.beginPath();
          ctx.arc(screenX, screenY, size * 2.2, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // 4e. Matte Sphere Vignette Overlay (Gives spherical structure without reflective spotlight or gloss)
      const glossGrad = ctx.createRadialGradient(
        ctxWidth / 2,
        ctxHeight / 2,
        planetRadius * 0.3,
        ctxWidth / 2,
        ctxHeight / 2,
        planetRadius
      );
      glossGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');              // No spotlight specular point
      glossGrad.addColorStop(0.7, 'rgba(6, 1, 0, 0.4)');          // Soft dark border
      glossGrad.addColorStop(1, 'rgba(6, 1, 0, 0.95)');          // Smooth edge integration

      ctx.fillStyle = glossGrad;
      ctx.beginPath();
      ctx.arc(ctxWidth / 2, ctxHeight / 2, planetRadius, 0, Math.PI * 2);
      ctx.fill();

      // Flat Ambient Glow Edge Rim (Very soft, non-reflective rim)
      const rimGrad = ctx.createRadialGradient(
        ctxWidth / 2,
        ctxHeight / 2,
        planetRadius * 0.92,
        ctxWidth / 2,
        ctxHeight / 2,
        planetRadius * 1.01
      );
      rimGrad.addColorStop(0, 'rgba(102, 11, 5, 0)');
      rimGrad.addColorStop(0.85, 'rgba(140, 16, 7, 0.15)');
      rimGrad.addColorStop(1, 'rgba(255, 240, 196, 0.25)'); // Highly dimmed, soft warm golden contour

      ctx.fillStyle = rimGrad;
      ctx.beginPath();
      ctx.arc(ctxWidth / 2, ctxHeight / 2, planetRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore(); // Restore clip boundary

      // 5. Render Foreground Half of the Flat Cyber Orbital Ring (Depth Z >= 0)
      ringParticles.forEach(p => {
        const rx = Math.cos(p.angle) * p.distance;
        const rz = Math.sin(p.angle) * p.distance;
        const ry = p.yOffset;

        const rotated = rotate3D(rx, ry, rz, rotX + ringTilt, rotY);

        if (rotated.z >= 0) {
          const screenX = (ctxWidth / 2) + rotated.x * planetRadius;
          const screenY = (ctxHeight / 2) + rotated.y * planetRadius;
          const size = p.size * (1 + rotated.z * 0.35) * baseScale;

          // Drawing neon glow particle
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(screenX, screenY, Math.max(0.6, size), 0, Math.PI * 2);
          ctx.fill();

          // Particle outer glowing fog
          ctx.fillStyle = p.color === '#8c1007' ? 'rgba(140, 16, 7, 0.15)' : 'rgba(255, 240, 196, 0.15)';
          ctx.beginPath();
          ctx.arc(screenX, screenY, size * 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // 6. Draw High Tech Satellites with fading neon-vector trails
      satellites.forEach(sat => {
        sat.angle += sat.speed;

        // Calculate unrotated orbit position
        const sx = Math.cos(sat.angle) * sat.orbitRadius;
        const sz = Math.sin(sat.angle) * sat.orbitRadius;
        const sy = 0;

        // Apply orbital tilts
        const cosTX = Math.cos(sat.tiltX);
        const sinTX = Math.sin(sat.tiltX);
        const cosTZ = Math.cos(sat.tiltZ);
        const sinTZ = Math.sin(sat.tiltZ);

        // Apply X tilt
        const x1 = sx;
        const y1 = sy * cosTX - sz * sinTX;
        const z1 = sy * sinTX + sz * cosTX;

        // Apply Z tilt
        const x2 = x1 * cosTZ - y1 * sinTZ;
        const y2 = x1 * sinTZ + y1 * cosTZ;
        const z2 = z1;

        // Add to trailing history
        sat.trail.push({ x: x2, y: y2, z: z2 });
        if (sat.trail.length > 20) {
          sat.trail.shift();
        }

        // Draw trail with fading opacity
        if (sat.trail.length > 1) {
          ctx.beginPath();
          for (let k = 0; k < sat.trail.length; k++) {
            const pt = sat.trail[k];
            const rPt = rotate3D(pt.x, pt.y, pt.z, rotX, rotY);
            const screenX = (ctxWidth / 2) + rPt.x * planetRadius;
            const screenY = (ctxHeight / 2) + rPt.y * planetRadius;

            if (k === 0) {
              ctx.moveTo(screenX, screenY);
            } else {
              ctx.lineTo(screenX, screenY);
            }
          }
          ctx.strokeStyle = sat.color === '#fff0c4' ? 'rgba(255, 240, 196, 0.4)' : 'rgba(230, 57, 70, 0.4)';
          ctx.lineWidth = 1.5 * baseScale;
          ctx.stroke();
        }

        // Rotate current position to draw actual satellite head
        const currentRot = rotate3D(x2, y2, z2, rotX, rotY);
        const screenX = (ctxWidth / 2) + currentRot.x * planetRadius;
        const screenY = (ctxHeight / 2) + currentRot.y * planetRadius;

        // Draw satellite node with a flashing indicator
        const flashIntensity = 0.5 + Math.sin(Date.now() * 0.015) * 0.5;
        ctx.fillStyle = sat.color;
        ctx.beginPath();
        ctx.arc(screenX, screenY, 3.5 * baseScale, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = sat.color === '#fff0c4' 
          ? `rgba(255, 240, 196, ${0.15 + flashIntensity * 0.45})` 
          : `rgba(230, 57, 70, ${0.15 + flashIntensity * 0.45})`;
        ctx.beginPath();
        ctx.arc(screenX, screenY, 8 * baseScale, 0, Math.PI * 2);
        ctx.fill();
      });

      // 7. Tactical Sci-Fi HUD Overlays & Radar (Drawn on top)
      const radarRadius = planetRadius * 1.15;
      const hCenterX = ctxWidth / 2;
      const hCenterY = ctxHeight / 2;

      // Thin outer radar coordinate circle
      ctx.strokeStyle = 'rgba(255, 240, 196, 0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(hCenterX, hCenterY, radarRadius, 0, Math.PI * 2);
      ctx.stroke();

      // Outer ticker marks on radar ring
      ctx.strokeStyle = 'rgba(255, 240, 196, 0.15)';
      ctx.lineWidth = 0.8;
      const tickCount = 48;
      for (let i = 0; i < tickCount; i++) {
        const theta = (i / tickCount) * Math.PI * 2;
        const isMajor = i % 12 === 0;
        const tickLen = isMajor ? 6 * baseScale : 3 * baseScale;
        const startRad = radarRadius;
        const endRad = radarRadius + tickLen;

        ctx.beginPath();
        ctx.moveTo(hCenterX + Math.cos(theta) * startRad, hCenterY + Math.sin(theta) * startRad);
        ctx.lineTo(hCenterX + Math.cos(theta) * endRad, hCenterY + Math.sin(theta) * endRad);
        ctx.stroke();
      }

      // Slowly rotating sweep scan line
      const sweepAngle = (Date.now() * 0.0006) % (Math.PI * 2);
      ctx.strokeStyle = 'rgba(140, 16, 7, 0.18)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(hCenterX, hCenterY);
      ctx.lineTo(hCenterX + Math.cos(sweepAngle) * radarRadius, hCenterY + Math.sin(sweepAngle) * radarRadius);
      ctx.stroke();

      // Corner target-lock bracket ticks (gives visual boundary framing)
      const bDist = planetRadius * 1.30;
      const bLen = 12 * baseScale;
      ctx.strokeStyle = 'rgba(255, 240, 196, 0.12)';
      ctx.lineWidth = 1.2;

      // Top-Left Bracket
      ctx.beginPath();
      ctx.moveTo(hCenterX - bDist, hCenterY - bDist + bLen);
      ctx.lineTo(hCenterX - bDist, hCenterY - bDist);
      ctx.lineTo(hCenterX - bDist + bLen, hCenterY - bDist);
      ctx.stroke();

      // Top-Right Bracket
      ctx.beginPath();
      ctx.moveTo(hCenterX + bDist, hCenterY - bDist + bLen);
      ctx.lineTo(hCenterX + bDist, hCenterY - bDist);
      ctx.lineTo(hCenterX + bDist - bLen, hCenterY - bDist);
      ctx.stroke();

      // Bottom-Left Bracket
      ctx.beginPath();
      ctx.moveTo(hCenterX - bDist, hCenterY + bDist - bLen);
      ctx.lineTo(hCenterX - bDist, hCenterY + bDist);
      ctx.lineTo(hCenterX - bDist + bLen, hCenterY + bDist);
      ctx.stroke();

      // Bottom-Right Bracket
      ctx.beginPath();
      ctx.moveTo(hCenterX + bDist, hCenterY + bDist - bLen);
      ctx.lineTo(hCenterX + bDist, hCenterY + bDist);
      ctx.lineTo(hCenterX + bDist - bLen, hCenterY + bDist);
      ctx.stroke();

      // Small tactical HUD labels on four corners
      ctx.fillStyle = 'rgba(255, 240, 196, 0.35)';
      ctx.font = '8px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';

      // Top-Left text
      ctx.fillText('[ SYS STAT: SECURE ]', hCenterX - bDist, hCenterY - bDist - 6);

      // Bottom-Left text
      ctx.fillText(`[ LAT: ${rotX.toFixed(3)} | LNG: ${rotY.toFixed(3)} ]`, hCenterX - bDist, hCenterY + bDist + 12);

      ctx.textAlign = 'right';
      // Top-Right text
      ctx.fillText(`[ NODES: ${numNodes} ACTIVE ]`, hCenterX + bDist, hCenterY - bDist - 6);

      // Bottom-Right text
      ctx.fillText(`[ RADAR: ${satellites.length} SATELLITES ]`, hCenterX + bDist, hCenterY + bDist + 12);

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full min-h-[420px] md:min-h-[620px] flex items-center justify-center relative select-none cursor-crosshair">
      <canvas 
        ref={canvasRef} 
        className="w-full h-full max-w-[650px] max-h-[650px] object-contain drop-shadow-[0_0_70px_rgba(79,183,179,0.55)] transition-all duration-300"
      />
    </div>
  );
};

export default ThreePlanet;
