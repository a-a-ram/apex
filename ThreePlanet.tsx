import React, { useRef, useEffect } from 'react';

interface ThreeDWeaponCanvasProps {
  type: 'sniper' | 'rifle' | 'smg' | 'katana' | 'hammer' | 'pistol' | 'shotgun' | 'bow' | 'rocket' | 'dual_swords' | 'shield_sword';
  isHovered: boolean;
}

interface Point3D {
  x: number;
  y: number;
  z: number;
}

interface Line3D {
  p1: Point3D;
  p2: Point3D;
  color: string;
  width: number;
  glow?: boolean;
  isSword?: boolean;
}

interface Particle3D {
  x: number;
  y: number;
  z: number;
  size: number;
  color: string;
  speed: number;
  angle: number;
  distance: number;
  yOffset: number;
  life?: number;
}

const ThreeDWeaponCanvas: React.FC<ThreeDWeaponCanvasProps> = ({ type, isHovered }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
    canvas.width = canvas.parentElement ? canvas.parentElement.clientWidth * window.devicePixelRatio : 300;
    canvas.height = canvas.parentElement ? canvas.parentElement.clientHeight * window.devicePixelRatio : 300;
    width = canvas.width;
    height = canvas.height;

    // Interactive Physics State
    let rotX = 0.25; // Initial tilt
    let rotY = 0;    // Initial spin
    
    const baseVelY = 0.006; // Automatic rotation speed around Y axis
    let velX = 0;
    let velY = baseVelY;

    let mouseX = 0; // Relative mouse X (-1 to 1)
    let mouseY = 0; // Relative mouse Y (-1 to 1)
    let isMouseInCard = false;

    // Listen to mouse movement relative to parent element
    const handleMouseMove = (e: MouseEvent) => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      mouseX = (e.clientX - centerX) / (rect.width / 2);
      mouseY = (e.clientY - centerY) / (rect.height / 2);
      isMouseInCard = Math.abs(mouseX) < 1.2 && Math.abs(mouseY) < 1.2;
    };

    const handleMouseLeave = () => {
      isMouseInCard = false;
      mouseX = 0;
      mouseY = 0;
    };

    // Weapon Action / Recoil States
    let recoilX = 0;
    let recoilRot = 0;
    let muzzleFlashLife = 0;
    let bashProgress = 0;
    let bashShockwave = 0;

    interface Projectile {
      x: number;
      y: number;
      z: number;
      vx: number;
      vy: number;
      vz: number;
      life: number;
      maxLife: number;
      color: string;
    }

    interface Casing {
      x: number;
      y: number;
      z: number;
      vx: number;
      vy: number;
      vz: number;
      rx: number;
      ry: number;
      rz: number;
      vrx: number;
      vry: number;
      vrz: number;
      life: number;
    }

    interface SlashSweep {
      progress: number;
      color: string;
      angleOffset: number;
    }

    const activeProjectiles: Projectile[] = [];
    const activeCasings: Casing[] = [];
    let activeSlash: SlashSweep | null = null;

    const triggerFire = () => {
      if (type === 'sniper') {
        // Heavy sniper kick back and climb
        recoilX = -0.28;
        recoilRot = 0.12;
        muzzleFlashLife = 1.0;

        // One heavy fast golden tracer bullet
        activeProjectiles.push({
          x: 0.8, y: 0, z: 0,
          vx: 0.22, vy: 0, vz: 0,
          life: 1.0, maxLife: 15,
          color: '#fff0c4'
        });

        // Heavy shell casing ejecting backwards
        activeCasings.push({
          x: -0.15, y: 0.05, z: 0.05,
          vx: -0.015 - Math.random() * 0.015,
          vy: 0.02 + Math.random() * 0.02,
          vz: 0.015 + Math.random() * 0.015,
          rx: Math.random() * Math.PI, ry: Math.random() * Math.PI, rz: Math.random() * Math.PI,
          vrx: 0.1, vry: 0.18, vrz: 0.12,
          life: 1.0
        });
      } else if (type === 'rifle') {
        // Fast 3-round burst
        let shotCount = 0;
        const fireShot = () => {
          recoilX = -0.12;
          recoilRot = 0.05;
          muzzleFlashLife = 1.0;

          activeProjectiles.push({
            x: 0.72, y: 0, z: 0,
            vx: 0.25, vy: (Math.random() - 0.5) * 0.005, vz: (Math.random() - 0.5) * 0.005,
            life: 1.0, maxLife: 12,
            color: '#fff0c4'
          });

          activeCasings.push({
            x: -0.15, y: 0.08, z: 0.05,
            vx: -0.02 - Math.random() * 0.015,
            vy: 0.025 + Math.random() * 0.02,
            vz: 0.02 + Math.random() * 0.015,
            rx: Math.random() * Math.PI, ry: Math.random() * Math.PI, rz: Math.random() * Math.PI,
            vrx: 0.18, vry: 0.25, vrz: 0.18,
            life: 1.0
          });

          shotCount++;
          if (shotCount < 3) {
            setTimeout(fireShot, 110);
          }
        };
        fireShot();
      } else if (type === 'smg') {
        // Ultra-rapid 5-round burst spray
        let shotCount = 0;
        const fireShot = () => {
          recoilX = -0.07;
          recoilRot = 0.03;
          muzzleFlashLife = 1.0;

          activeProjectiles.push({
            x: 0.4, y: 0, z: 0,
            vx: 0.28, vy: (Math.random() - 0.5) * 0.015, vz: (Math.random() - 0.5) * 0.015,
            life: 1.0, maxLife: 10,
            color: '#fff0c4'
          });

          activeCasings.push({
            x: -0.1, y: 0.08, z: 0.04,
            vx: -0.025 - Math.random() * 0.02,
            vy: 0.03 + Math.random() * 0.02,
            vz: 0.025 + Math.random() * 0.02,
            rx: Math.random() * Math.PI, ry: Math.random() * Math.PI, rz: Math.random() * Math.PI,
            vrx: 0.25, vry: 0.35, vrz: 0.25,
            life: 1.0
          });

          shotCount++;
          if (shotCount < 5) {
            setTimeout(fireShot, 60);
          }
        };
        fireShot();
      } else if (type === 'katana') {
        // Holographic arc slice
        recoilX = 0.2; // thrust forward
        recoilRot = -0.45; // rotate forward swing

        activeSlash = {
          progress: 0.01,
          color: '#fff0c4',
          angleOffset: (Math.random() - 0.5) * 0.4
        };
      } else if (type === 'hammer') {
        // Massive downward smash swing
        recoilX = 0.15; 
        recoilRot = -0.6; // Heavy downward tilt

        activeSlash = {
          progress: 0.01,
          color: '#8c1007',
          angleOffset: -0.2 // downward slam direction
        };
      } else if (type === 'pistol') {
        // Single rapid revolver shot
        recoilX = -0.15;
        recoilRot = 0.18;
        muzzleFlashLife = 1.0;

        activeProjectiles.push({
          x: 0.45, y: 0.05, z: 0,
          vx: 0.26, vy: 0, vz: 0,
          life: 1.0, maxLife: 10,
          color: '#fff0c4'
        });

        activeCasings.push({
          x: -0.05, y: 0.05, z: 0.03,
          vx: -0.01 - Math.random() * 0.01,
          vy: 0.03 + Math.random() * 0.02,
          vz: 0.02 + Math.random() * 0.02,
          rx: Math.random() * Math.PI, ry: Math.random() * Math.PI, rz: Math.random() * Math.PI,
          vrx: 0.3, vry: 0.2, vrz: 0.3,
          life: 1.0
        });
      } else if (type === 'shotgun') {
        // Heavy blast with 5 spreading projectiles
        recoilX = -0.25;
        recoilRot = 0.15;
        muzzleFlashLife = 1.0;

        for (let i = 0; i < 5; i++) {
          activeProjectiles.push({
            x: 0.6, y: 0.03, z: 0,
            vx: 0.22,
            vy: (i - 2) * 0.015 + (Math.random() - 0.5) * 0.005,
            vz: (Math.random() - 0.5) * 0.015,
            life: 1.0, maxLife: 8,
            color: '#fff0c4'
          });
        }

        // Thick shotgun red-gold shell casing
        activeCasings.push({
          x: -0.1, y: 0.05, z: 0.04,
          vx: -0.015 - Math.random() * 0.015,
          vy: 0.04 + Math.random() * 0.02,
          vz: 0.03 + Math.random() * 0.02,
          rx: Math.random() * Math.PI, ry: Math.random() * Math.PI, rz: Math.random() * Math.PI,
          vrx: 0.1, vry: 0.1, vrz: 0.4,
          life: 1.0
        });
      } else if (type === 'bow') {
        // Silent bow string release
        recoilX = 0.08;
        recoilRot = -0.05;

        // Long single arrow projectile
        activeProjectiles.push({
          x: 0.35, y: 0, z: 0,
          vx: 0.18, vy: 0, vz: 0,
          life: 1.0, maxLife: 20,
          color: '#fff0c4'
        });
      } else if (type === 'rocket') {
        // Slow massive launcher rocket fire
        recoilX = -0.3;
        recoilRot = 0.08;
        muzzleFlashLife = 1.0;

        // Large high-density rocket projectile (slower speed)
        activeProjectiles.push({
          x: 0.5, y: 0, z: 0,
          vx: 0.08, vy: 0, vz: 0,
          life: 1.0, maxLife: 30,
          color: '#8c1007'
        });
      } else if (type === 'dual_swords') {
        // Fast dual slashing sweeps
        recoilX = 0.18;
        recoilRot = -0.3;

        activeSlash = {
          progress: 0.01,
          color: '#fff0c4',
          angleOffset: -0.35
        };

        setTimeout(() => {
          activeSlash = {
            progress: 0.01,
            color: '#8c1007',
            angleOffset: 0.35
          };
        }, 150);
      } else if (type === 'shield_sword') {
        // Shield and sword heavy bash action
        bashProgress = 1.0;
        bashShockwave = 0.01;

        // Spark particles flying out from shield impact!
        for (let i = 0; i < 28; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 0.015 + Math.random() * 0.025;
          particles.push({
            x: 0, y: 0, z: 0.06,
            size: 1.5 + Math.random() * 2.8,
            color: Math.random() > 0.4 ? accentGold : primaryCrimson,
            speed: speed,
            angle: angle,
            distance: 0.05 + Math.random() * 0.1,
            yOffset: (Math.random() - 0.5) * 0.3,
            life: 1.0
          });
        }
      }
    };

    const handleParentClick = () => {
      triggerFire();
    };

    // Attach to canvas parent
    const parent = canvas.parentElement;
    if (parent) {
      parent.addEventListener('mousemove', handleMouseMove);
      parent.addEventListener('mouseleave', handleMouseLeave);
      parent.addEventListener('click', handleParentClick);
    }

    // --- PROCEDURAL 3D SHAPE BUILDERS ---
    const lines: Line3D[] = [];
    const particles: Particle3D[] = [];

    // Color Palette
    const primaryCrimson = '#8c1007';
    const accentGold = '#fff0c4';
    const softRed = '#cc1c10';

    // Helper to add line segments
    const addLine = (
      x1: number, y1: number, z1: number,
      x2: number, y2: number, z2: number,
      color = primaryCrimson, width = 1.5, glow = false,
      isSword = false
    ) => {
      lines.push({
        p1: { x: x1, y: y1, z: z1 },
        p2: { x: x2, y: y2, z: z2 },
        color,
        width,
        glow,
        isSword
      });
    };

    // Helper to draw a 3D circle/cylinder ring
    const add3DCircle = (
      centerX: number, centerY: number, centerZ: number,
      radius: number, axis: 'x' | 'y' | 'z',
      segments = 12, color = primaryCrimson, width = 1.0
    ) => {
      const pts: Point3D[] = [];
      for (let i = 0; i < segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        let x = 0, y = 0, z = 0;
        if (axis === 'x') {
          x = centerX;
          y = centerY + Math.cos(theta) * radius;
          z = centerZ + Math.sin(theta) * radius;
        } else if (axis === 'y') {
          x = centerX + Math.cos(theta) * radius;
          y = centerY;
          z = centerZ + Math.sin(theta) * radius;
        } else {
          x = centerX + Math.cos(theta) * radius;
          y = centerY + Math.sin(theta) * radius;
          z = centerZ;
        }
        pts.push({ x, y, z });
      }

      for (let i = 0; i < segments; i++) {
        const p1 = pts[i];
        const p2 = pts[(i + 1) % segments];
        addLine(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z, color, width);
      }
    };

    // 1. GENERATE SNIPER MODEL (Snipe-Dogg)
    if (type === 'sniper') {
      // Main Barrel
      addLine(-0.75, 0, 0, 0.75, 0, 0, accentGold, 2, true);
      
      // Flash Hider/Muzzle Break
      addLine(0.75, 0.03, 0.03, 0.8, 0.03, 0.03, accentGold, 1);
      addLine(0.75, -0.03, -0.03, 0.8, -0.03, -0.03, accentGold, 1);
      addLine(0.75, 0.03, -0.03, 0.8, 0.03, -0.03, accentGold, 1);
      addLine(0.75, -0.03, 0.03, 0.8, -0.03, 0.03, accentGold, 1);
      add3DCircle(0.75, 0, 0, 0.04, 'x', 8, accentGold, 1.2);
      add3DCircle(0.8, 0, 0, 0.04, 'x', 8, accentGold, 1.2);

      // Suppressor/Heavy Barrel Rings
      add3DCircle(0.2, 0, 0, 0.045, 'x', 8, primaryCrimson, 1.5);
      add3DCircle(0.4, 0, 0, 0.045, 'x', 8, primaryCrimson, 1.5);
      add3DCircle(0.6, 0, 0, 0.045, 'x', 8, primaryCrimson, 1.5);

      // Scope Body
      addLine(-0.25, 0.12, 0, 0.25, 0.12, 0, accentGold, 2, true);
      // Scope Mounts
      addLine(-0.15, 0, 0, -0.15, 0.12, 0, primaryCrimson, 1.5);
      addLine(0.15, 0, 0, 0.15, 0.12, 0, primaryCrimson, 1.5);
      // Scope Ends
      add3DCircle(0.25, 0.12, 0, 0.06, 'x', 10, accentGold, 1.5);
      add3DCircle(-0.25, 0.12, 0, 0.07, 'x', 10, accentGold, 1.5);
      // Lens Details
      add3DCircle(0.2, 0.12, 0, 0.05, 'x', 8, primaryCrimson, 1);
      add3DCircle(-0.2, 0.12, 0, 0.06, 'x', 8, primaryCrimson, 1);

      // Receiver/Bolt Action
      addLine(-0.35, 0.06, 0.05, 0.05, 0.06, 0.05, primaryCrimson, 2);
      addLine(-0.35, -0.06, 0.05, 0.05, -0.06, 0.05, primaryCrimson, 2);
      addLine(-0.35, 0.06, -0.05, 0.05, 0.06, -0.05, primaryCrimson, 2);
      addLine(-0.35, -0.06, -0.05, 0.05, -0.06, -0.05, primaryCrimson, 2);
      // Bolt Handle
      addLine(-0.15, 0.03, 0.05, -0.12, 0.1, 0.12, accentGold, 2);
      add3DCircle(-0.12, 0.1, 0.12, 0.025, 'y', 6, accentGold, 1.5);

      // Bipod
      addLine(0.45, 0, 0, 0.35, -0.28, 0.12, primaryCrimson, 1.5);
      addLine(0.45, 0, 0, 0.35, -0.28, -0.12, primaryCrimson, 1.5);
      addLine(0.35, -0.28, 0.12, 0.35, -0.28, 0.06, primaryCrimson, 1.5);
      addLine(0.35, -0.28, -0.12, 0.35, -0.28, -0.06, primaryCrimson, 1.5);

      // Tactical Magazine
      addLine(-0.1, 0, 0.04, -0.1, -0.18, 0.04, primaryCrimson, 1.5);
      addLine(0.05, 0, 0.04, 0.02, -0.18, 0.04, primaryCrimson, 1.5);
      addLine(-0.1, -0.18, 0.04, 0.02, -0.18, 0.04, primaryCrimson, 1.5);
      addLine(-0.1, 0, -0.04, -0.1, -0.18, -0.04, primaryCrimson, 1.5);
      addLine(0.05, 0, -0.04, 0.02, -0.18, -0.04, primaryCrimson, 1.5);
      addLine(-0.1, -0.18, -0.04, 0.02, -0.18, -0.04, primaryCrimson, 1.5);
      // Connect mag sides
      addLine(-0.1, -0.18, -0.04, -0.1, -0.18, 0.04, primaryCrimson, 1);
      addLine(0.02, -0.18, -0.04, 0.02, -0.18, 0.04, primaryCrimson, 1);

      // Pistol Grip
      addLine(-0.32, -0.05, 0, -0.42, -0.22, 0, primaryCrimson, 2);
      addLine(-0.35, -0.22, 0, -0.42, -0.22, 0, primaryCrimson, 1.5);

      // Sniper Buttstock (Wireframe skeleton)
      addLine(-0.35, 0.04, 0, -0.75, 0.02, 0, accentGold, 2);
      addLine(-0.35, -0.06, 0, -0.55, -0.22, 0, primaryCrimson, 1.5);
      addLine(-0.55, -0.22, 0, -0.72, -0.22, 0, primaryCrimson, 1.5);
      addLine(-0.72, -0.22, 0, -0.75, 0.02, 0, accentGold, 2);
      // Cheek pad
      addLine(-0.45, 0.03, 0.03, -0.65, 0.03, 0.03, primaryCrimson, 1.5);
      addLine(-0.45, 0.03, -0.03, -0.65, 0.03, -0.03, primaryCrimson, 1.5);
      addLine(-0.45, 0.08, 0, -0.65, 0.08, 0, primaryCrimson, 1);

      // Holographic Red Laser scope sight line
      addLine(0.8, 0, 0, 2.5, 0, 0, softRed, 1.2, true);

      // Generate digital floating cyber-sparks
      for (let i = 0; i < 35; i++) {
        particles.push({
          x: 0, y: 0, z: 0,
          size: 1.0 + Math.random() * 1.8,
          color: Math.random() > 0.4 ? primaryCrimson : accentGold,
          speed: 0.002 + Math.random() * 0.003,
          angle: Math.random() * Math.PI * 2,
          distance: 0.5 + Math.random() * 0.6,
          yOffset: (Math.random() - 0.5) * 0.4
        });
      }
    }

    // 2. GENERATE ASSAULT RIFLE MODEL (Overlord)
    if (type === 'rifle') {
      // Barrel
      addLine(-0.6, 0, 0, 0.65, 0, 0, accentGold, 2, true);
      add3DCircle(0.65, 0, 0, 0.03, 'x', 6, accentGold, 1);
      
      // Muzzle Device
      addLine(0.65, 0.03, 0, 0.72, 0.02, 0, accentGold, 1);
      addLine(0.65, -0.03, 0, 0.72, -0.02, 0, accentGold, 1);

      // Heavy Shroud / Quad Rail Handguard
      add3DCircle(0.05, 0, 0, 0.08, 'x', 8, primaryCrimson, 1.5);
      add3DCircle(0.2, 0, 0, 0.08, 'x', 8, primaryCrimson, 1.5);
      add3DCircle(0.35, 0, 0, 0.08, 'x', 8, primaryCrimson, 1.5);
      add3DCircle(0.5, 0, 0, 0.08, 'x', 8, primaryCrimson, 1.5);
      // Rail guide lines
      addLine(0.05, 0.08, 0, 0.5, 0.08, 0, primaryCrimson, 1.5);
      addLine(0.05, -0.08, 0, 0.5, -0.08, 0, primaryCrimson, 1.5);
      addLine(0.05, 0, 0.08, 0.5, 0, 0.08, primaryCrimson, 1);
      addLine(0.05, 0, -0.08, 0.5, 0, -0.08, primaryCrimson, 1);

      // Receiver / Magazine Well
      addLine(-0.35, 0.08, 0.05, 0.05, 0.08, 0.05, primaryCrimson, 2);
      addLine(-0.35, -0.08, 0.05, 0.05, -0.08, 0.05, primaryCrimson, 2);
      addLine(-0.35, 0.08, -0.05, 0.05, 0.08, -0.05, primaryCrimson, 2);
      addLine(-0.35, -0.08, -0.05, 0.05, -0.08, -0.05, primaryCrimson, 2);
      // Connect vertical
      addLine(0.05, 0.08, 0.05, 0.05, -0.08, 0.05, primaryCrimson, 1);
      addLine(-0.35, 0.08, 0.05, -0.35, -0.08, 0.05, primaryCrimson, 1);

      // Tactical Curved Magazine
      let prevX = -0.05;
      let prevY = -0.08;
      const magPoints = [
        { x: -0.03, y: -0.2 },
        { x: 0.02, y: -0.32 },
        { x: 0.08, y: -0.42 }
      ];
      magPoints.forEach(pt => {
        addLine(prevX, prevY, 0.03, pt.x, pt.y, 0.03, accentGold, 1.5);
        addLine(prevX, prevY, -0.03, pt.x, pt.y, -0.03, accentGold, 1.5);
        // Connect sides
        addLine(pt.x, pt.y, 0.03, pt.x, pt.y, -0.03, accentGold, 1);
        prevX = pt.x;
        prevY = pt.y;
      });
      // Back of magazine
      prevX = -0.15;
      prevY = -0.08;
      const magBackPoints = [
        { x: -0.12, y: -0.2 },
        { x: -0.07, y: -0.32 },
        { x: -0.01, y: -0.42 }
      ];
      magBackPoints.forEach(pt => {
        addLine(prevX, prevY, 0.03, pt.x, pt.y, 0.03, accentGold, 1.5);
        addLine(prevX, prevY, -0.03, pt.x, pt.y, -0.03, accentGold, 1.5);
        prevX = pt.x;
        prevY = pt.y;
      });
      // Close the bottom of the curved mag
      addLine(0.08, -0.42, 0.03, -0.01, -0.42, 0.03, accentGold, 1.5);
      addLine(0.08, -0.42, -0.03, -0.01, -0.42, -0.03, accentGold, 1.5);

      // Carry Handle / Sight Rails on Top
      addLine(-0.25, 0.08, 0, -0.22, 0.16, 0, accentGold, 1.5);
      addLine(-0.22, 0.16, 0, 0.05, 0.16, 0, accentGold, 2, true);
      addLine(0.05, 0.16, 0, 0.05, 0.08, 0, accentGold, 1.5);
      // Inner handle opening
      addLine(-0.16, 0.12, 0, -0.02, 0.12, 0, primaryCrimson, 1);

      // Pistol Grip
      addLine(-0.3, -0.08, 0, -0.38, -0.25, 0, primaryCrimson, 2);
      addLine(-0.34, -0.25, 0, -0.38, -0.25, 0, primaryCrimson, 1.5);

      // Full Stock (M4/M16 style)
      addLine(-0.35, 0.06, 0, -0.62, 0.03, 0, accentGold, 2);
      addLine(-0.35, -0.08, 0, -0.48, -0.18, 0, primaryCrimson, 1.5);
      addLine(-0.48, -0.18, 0, -0.62, -0.18, 0, primaryCrimson, 1.5);
      addLine(-0.62, -0.18, 0, -0.65, 0.03, 0, accentGold, 2);

      // Orbiting red stars/energy rings
      for (let i = 0; i < 35; i++) {
        particles.push({
          x: 0, y: 0, z: 0,
          size: 1.0 + Math.random() * 1.5,
          color: Math.random() > 0.45 ? accentGold : primaryCrimson,
          speed: 0.003 + Math.random() * 0.003,
          angle: Math.random() * Math.PI * 2,
          distance: 0.45 + Math.random() * 0.55,
          yOffset: (Math.random() - 0.5) * 0.35
        });
      }
    }

    // 3. GENERATE SMG MODEL (Vinsole)
    if (type === 'smg') {
      // Silencer / Short Barrel
      addLine(-0.4, 0, 0, 0.4, 0, 0, accentGold, 2, true);
      add3DCircle(0.4, 0, 0, 0.07, 'x', 8, accentGold, 1.5);
      add3DCircle(0.18, 0, 0, 0.07, 'x', 8, accentGold, 1.5);
      addLine(0.18, 0.07, 0, 0.4, 0.07, 0, accentGold, 1);
      addLine(0.18, -0.07, 0, 0.4, -0.07, 0, accentGold, 1);

      // Compact Frame / Receiver
      addLine(-0.32, 0.08, 0.04, 0.15, 0.08, 0.04, primaryCrimson, 2);
      addLine(-0.32, -0.08, 0.04, 0.15, -0.08, 0.04, primaryCrimson, 2);
      addLine(-0.32, 0.08, -0.04, 0.15, 0.08, -0.04, primaryCrimson, 2);
      addLine(-0.32, -0.08, -0.04, 0.15, -0.08, -0.04, primaryCrimson, 2);
      // Connect corners
      addLine(0.15, 0.08, 0.04, 0.15, -0.08, 0.04, primaryCrimson, 1);
      addLine(-0.32, 0.08, 0.04, -0.32, -0.08, 0.04, primaryCrimson, 1);

      // Straight Tactical Magazine extending vertically down
      addLine(-0.02, -0.08, 0.03, -0.02, -0.38, 0.03, accentGold, 1.8);
      addLine(0.05, -0.08, 0.03, 0.05, -0.38, 0.03, accentGold, 1.8);
      addLine(-0.02, -0.38, 0.03, 0.05, -0.38, 0.03, accentGold, 1.8);

      addLine(-0.02, -0.08, -0.03, -0.02, -0.38, -0.03, accentGold, 1.8);
      addLine(0.05, -0.08, -0.03, 0.05, -0.38, -0.03, accentGold, 1.8);
      addLine(-0.02, -0.38, -0.03, 0.05, -0.38, -0.03, accentGold, 1.8);
      // Bottom closure
      addLine(-0.02, -0.38, -0.03, -0.02, -0.38, 0.03, accentGold, 1);
      addLine(0.05, -0.38, -0.03, 0.05, -0.38, 0.03, accentGold, 1);

      // Holo Reflex Sight
      addLine(-0.12, 0.08, 0, -0.1, 0.15, 0, accentGold, 1.2);
      addLine(0.02, 0.08, 0, 0.0, 0.15, 0, accentGold, 1.2);
      add3DCircle(-0.05, 0.15, 0, 0.04, 'x', 8, accentGold, 1.5);
      // Floating laser red reticle dot
      addLine(-0.05, 0.15, 0, -0.05, 0.15, 0.01, softRed, 2, true);

      // Pistol Grip
      addLine(-0.2, -0.08, 0, -0.26, -0.24, 0, primaryCrimson, 2);
      addLine(-0.22, -0.24, 0, -0.26, -0.24, 0, primaryCrimson, 1.5);

      // Collapsible Wire Stock (Skeleton MP5 style)
      addLine(-0.32, 0.05, 0.04, -0.58, 0.04, 0.04, primaryCrimson, 1.5);
      addLine(-0.32, -0.05, -0.04, -0.58, -0.04, -0.04, primaryCrimson, 1.5);
      // Shoulder pad
      addLine(-0.58, 0.04, 0.04, -0.6, -0.15, 0, accentGold, 2);
      addLine(-0.58, -0.04, -0.04, -0.6, -0.15, 0, accentGold, 2);

      // Orbiting particles
      for (let i = 0; i < 30; i++) {
        particles.push({
          x: 0, y: 0, z: 0,
          size: 1.0 + Math.random() * 1.5,
          color: Math.random() > 0.4 ? primaryCrimson : accentGold,
          speed: 0.0035 + Math.random() * 0.003,
          angle: Math.random() * Math.PI * 2,
          distance: 0.4 + Math.random() * 0.5,
          yOffset: (Math.random() - 0.5) * 0.35
        });
      }
    }

    // 4. GENERATE KATANA MODEL (Ghostpants)
    if (type === 'katana') {
      // Blade - Long curved wireframe
      // Let's generate a beautiful smooth curved spine and blade edge
      const bladeSegments = 16;
      const bladeSpinePoints: Point3D[] = [];
      const bladeEdgePoints: Point3D[] = [];

      for (let i = 0; i <= bladeSegments; i++) {
        const t = i / bladeSegments;
        // Blade goes from x = -0.2 to x = 0.7
        const x = -0.25 + t * 1.0;
        // Blade curves slightly upwards as t increases
        const y = -0.04 + Math.pow(t, 2) * 0.12;
        // Blade is ultra thin in Z
        bladeSpinePoints.push({ x, y, z: 0 });
        // The edge is slightly wider in Y
        bladeEdgePoints.push({ x, y: y - 0.04 + (1 - t) * 0.01, z: 0 });
      }

      // Draw the blade spine
      for (let i = 0; i < bladeSegments; i++) {
        const p1 = bladeSpinePoints[i];
        const p2 = bladeSpinePoints[i + 1];
        addLine(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z, accentGold, 1.8, true);
      }
      // Draw the blade cutting edge (sleek razor line)
      for (let i = 0; i < bladeSegments; i++) {
        const p1 = bladeEdgePoints[i];
        const p2 = bladeEdgePoints[i + 1];
        addLine(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z, accentGold, 1.0, false);
        // Add vertical bevel lines linking them
        if (i % 3 === 0) {
          const spine = bladeSpinePoints[i];
          addLine(spine.x, spine.y, spine.z, p1.x, p1.y, p1.z, primaryCrimson, 0.8);
        }
      }
      // Connect Tip
      const spineTip = bladeSpinePoints[bladeSegments];
      const edgeTip = bladeEdgePoints[bladeSegments];
      addLine(spineTip.x, spineTip.y, spineTip.z, edgeTip.x, edgeTip.y, edgeTip.z, accentGold, 1.2);

      // Guard (Tsuba) - Sleek high-tech gold disc perpendicular to the blade
      add3DCircle(-0.25, -0.04, 0, 0.09, 'x', 12, accentGold, 2);
      add3DCircle(-0.25, -0.04, 0, 0.06, 'x', 8, primaryCrimson, 1);
      // Spokes of Tsuba
      addLine(-0.25, -0.13, 0, -0.25, 0.05, 0, primaryCrimson, 1.2);
      addLine(-0.25, -0.04, -0.09, -0.25, -0.04, 0.09, primaryCrimson, 1.2);

      // Handle (Tsuka) - Elegant grip extending back
      const handleSegments = 6;
      const handlePoints: Point3D[] = [];
      for (let i = 0; i <= handleSegments; i++) {
        const t = i / handleSegments;
        const x = -0.25 - t * 0.35;
        const y = -0.04 - t * 0.02; // aligns with curved blade angle
        handlePoints.push({ x, y, z: 0 });
      }

      // Draw outer bounds of handle
      for (let i = 0; i < handleSegments; i++) {
        const p1 = handlePoints[i];
        const p2 = handlePoints[i + 1];
        addLine(p1.x, p1.y, 0.025, p2.x, p2.y, 0.025, primaryCrimson, 1.8);
        addLine(p1.x, p1.y, -0.025, p2.x, p2.y, -0.025, primaryCrimson, 1.8);
        
        // Wrap/Ito diamond pattern details in gold
        if (i < handleSegments) {
          addLine(p1.x, p1.y, 0.025, p2.x, p2.y, -0.025, accentGold, 0.8);
          addLine(p1.x, p1.y, -0.025, p2.x, p2.y, 0.025, accentGold, 0.8);
        }
      }
      // Kashira (Butt cap)
      const handleEnd = handlePoints[handleSegments];
      add3DCircle(handleEnd.x, handleEnd.y, 0, 0.026, 'x', 6, accentGold, 1.5);

      // Elegant cherry blossom cyber-particles / floating embers orbiting the blade
      for (let i = 0; i < 40; i++) {
        particles.push({
          x: 0, y: 0, z: 0,
          size: 1.2 + Math.random() * 2.2,
          color: Math.random() > 0.35 ? softRed : accentGold,
          speed: 0.0025 + Math.random() * 0.003,
          angle: Math.random() * Math.PI * 2,
          distance: 0.35 + Math.random() * 0.65,
          yOffset: (Math.random() - 0.5) * 0.3
        });
      }
    }

    // 5. GENERATE GRAVITY HAMMER MODEL (Hammer Singh)
    if (type === 'hammer') {
      // Shaft / Handle
      addLine(-0.7, -0.15, 0, 0.35, 0.1, 0, primaryCrimson, 2.2);
      add3DCircle(-0.7, -0.15, 0, 0.03, 'x', 6, accentGold, 1.5);
      add3DCircle(0.35, 0.1, 0, 0.03, 'x', 6, accentGold, 1.5);

      // Grip wraps
      for (let i = 0; i < 6; i++) {
        const t = i / 6;
        const x = -0.5 + t * 0.4;
        const y = -0.11 + t * 0.08;
        add3DCircle(x, y, 0, 0.032, 'x', 6, accentGold, 1.0);
      }

      // Giant Hammer Head
      const hx = 0.35;
      const hy = 0.1;
      const hz = 0;

      // Outer block borders
      const halfW = 0.18; // length of hammer head along X axis
      const halfH = 0.22; // height of hammer head along Y axis
      const halfD = 0.16; // depth of hammer head along Z axis

      // Draw box representing hammer head
      const corners = [
        { x: hx - halfW, y: hy - halfH, z: hz - halfD },
        { x: hx + halfW, y: hy - halfH, z: hz - halfD },
        { x: hx + halfW, y: hy + halfH, z: hz - halfD },
        { x: hx - halfW, y: hy + halfH, z: hz - halfD },
        { x: hx - halfW, y: hy - halfH, z: hz + halfD },
        { x: hx + halfW, y: hy - halfH, z: hz + halfD },
        { x: hx + halfW, y: hy + halfH, z: hz + halfD },
        { x: hx - halfW, y: hy + halfH, z: hz + halfD }
      ];

      // Front Face
      addLine(corners[0].x, corners[0].y, corners[0].z, corners[1].x, corners[1].y, corners[1].z, accentGold, 2.0, true);
      addLine(corners[1].x, corners[1].y, corners[1].z, corners[2].x, corners[2].y, corners[2].z, accentGold, 2.0, true);
      addLine(corners[2].x, corners[2].y, corners[2].z, corners[3].x, corners[3].y, corners[3].z, accentGold, 2.0, true);
      addLine(corners[3].x, corners[3].y, corners[3].z, corners[0].x, corners[0].y, corners[0].z, accentGold, 2.0, true);

      // Back Face
      addLine(corners[4].x, corners[4].y, corners[4].z, corners[5].x, corners[5].y, corners[5].z, accentGold, 2.0, true);
      addLine(corners[5].x, corners[5].y, corners[5].z, corners[6].x, corners[6].y, corners[6].z, accentGold, 2.0, true);
      addLine(corners[6].x, corners[6].y, corners[6].z, corners[7].x, corners[7].y, corners[7].z, accentGold, 2.0, true);
      addLine(corners[7].x, corners[7].y, corners[7].z, corners[4].x, corners[4].y, corners[4].z, accentGold, 2.0, true);

      // Connectors
      for (let i = 0; i < 4; i++) {
        addLine(corners[i].x, corners[i].y, corners[i].z, corners[i+4].x, corners[i+4].y, corners[i+4].z, primaryCrimson, 1.5);
      }

      // Add high tech impact circles on both sides of hammer head
      add3DCircle(hx + halfW, hy, hz, 0.12, 'x', 8, accentGold, 1.5);
      add3DCircle(hx - halfW, hy, hz, 0.12, 'x', 8, accentGold, 1.5);

      // Spikes on the hammer head back
      addLine(hx - halfW, hy, hz, hx - halfW - 0.12, hy, hz, softRed, 2.0, true);

      // Gravity particles orbiting the heavy hammer head
      for (let i = 0; i < 35; i++) {
        particles.push({
          x: hx, y: hy, z: hz,
          size: 1.5 + Math.random() * 2.0,
          color: Math.random() > 0.45 ? softRed : accentGold,
          speed: 0.004 + Math.random() * 0.003,
          angle: Math.random() * Math.PI * 2,
          distance: 0.3 + Math.random() * 0.4,
          yOffset: (Math.random() - 0.5) * 0.5
        });
      }
    }

    // 6. GENERATE HIGH-TECH REVOLVER MODEL (Pingos Gaming)
    if (type === 'pistol') {
      // Short heavy barrel
      addLine(-0.15, 0.05, 0, 0.45, 0.05, 0, accentGold, 2.0, true);
      add3DCircle(0.45, 0.05, 0, 0.03, 'x', 6, accentGold, 1.5);

      // Under-barrel tactical rail
      addLine(0.0, -0.01, 0, 0.35, -0.01, 0, primaryCrimson, 1.5);
      addLine(0.1, -0.01, 0, 0.1, -0.05, 0, primaryCrimson, 1.0);
      addLine(0.2, -0.01, 0, 0.2, -0.05, 0, primaryCrimson, 1.0);

      // Cyber cylinder / drum
      const cx = -0.1;
      const cy = 0.05;
      const cz = 0;
      add3DCircle(cx - 0.08, cy, cz, 0.07, 'x', 8, accentGold, 1.8);
      add3DCircle(cx + 0.08, cy, cz, 0.07, 'x', 8, accentGold, 1.8);
      // Chamber lines
      for (let i = 0; i < 6; i++) {
        const theta = (i / 6) * Math.PI * 2;
        const dy = Math.sin(theta) * 0.05;
        const dz = Math.cos(theta) * 0.05;
        addLine(cx - 0.08, cy + dy, cz + dz, cx + 0.08, cy + dy, cz + dz, primaryCrimson, 1.2);
      }

      // Grip
      addLine(-0.18, 0.0, 0, -0.32, -0.22, 0, primaryCrimson, 2.0);
      addLine(-0.25, -0.22, 0, -0.32, -0.22, 0, primaryCrimson, 1.5);

      // Trigger guard
      addLine(-0.12, -0.02, 0, -0.12, -0.1, 0, accentGold, 1.2);
      addLine(-0.12, -0.1, 0, -0.2, -0.06, 0, accentGold, 1.2);

      // Cyber sparks
      for (let i = 0; i < 25; i++) {
        particles.push({
          x: 0.1, y: 0.05, z: 0,
          size: 1.0 + Math.random() * 1.5,
          color: Math.random() > 0.5 ? accentGold : primaryCrimson,
          speed: 0.005 + Math.random() * 0.003,
          angle: Math.random() * Math.PI * 2,
          distance: 0.25 + Math.random() * 0.35,
          yOffset: (Math.random() - 0.5) * 0.3
        });
      }
    }

    // 7. GENERATE TACTICAL SHOTGUN MODEL (Teen Up)
    if (type === 'shotgun') {
      // Twin-bore Heavy Barrel
      addLine(-0.6, 0.05, 0.02, 0.62, 0.05, 0.02, accentGold, 2.0, true);
      addLine(-0.6, 0.05, -0.02, 0.62, 0.05, -0.02, accentGold, 2.0, true);
      add3DCircle(0.62, 0.05, 0, 0.045, 'x', 8, accentGold, 1.5);

      // Magazine tube beneath barrel
      addLine(-0.3, -0.02, 0, 0.45, -0.02, 0, primaryCrimson, 1.8);
      add3DCircle(0.45, -0.02, 0, 0.035, 'x', 6, primaryCrimson, 1.2);

      // Sliding Pump Handle
      const pxStart = 0.05;
      const pxEnd = 0.35;
      for (let i = 0; i < 5; i++) {
        const px = pxStart + (i / 4) * (pxEnd - pxStart);
        add3DCircle(px, -0.02, 0, 0.048, 'x', 8, accentGold, 1.5);
      }
      addLine(pxStart, -0.02, 0.045, pxEnd, -0.02, 0.045, accentGold, 1.2);
      addLine(pxStart, -0.02, -0.045, pxEnd, -0.02, -0.045, accentGold, 1.2);

      // Receiver / Frame
      addLine(-0.4, 0.08, 0.05, -0.05, 0.08, 0.05, primaryCrimson, 2.0);
      addLine(-0.4, -0.06, 0.05, -0.05, -0.06, 0.05, primaryCrimson, 2.0);
      addLine(-0.4, 0.08, -0.05, -0.05, 0.08, -0.05, primaryCrimson, 2.0);
      addLine(-0.4, -0.06, -0.05, -0.05, -0.06, -0.05, primaryCrimson, 2.0);
      addLine(-0.05, 0.08, 0.05, -0.05, -0.06, 0.05, primaryCrimson, 1.5);
      addLine(-0.4, 0.08, 0.05, -0.4, -0.06, 0.05, primaryCrimson, 1.5);

      // Pistol grip and full stock
      addLine(-0.4, -0.05, 0, -0.48, -0.22, 0, primaryCrimson, 1.8);
      addLine(-0.4, 0.06, 0, -0.75, -0.02, 0, accentGold, 2.0);
      addLine(-0.48, -0.22, 0, -0.72, -0.22, 0, primaryCrimson, 1.5);
      addLine(-0.72, -0.22, 0, -0.75, -0.02, 0, accentGold, 2.0);

      // Sparks
      for (let i = 0; i < 30; i++) {
        particles.push({
          x: 0, y: 0, z: 0,
          size: 1.0 + Math.random() * 1.8,
          color: Math.random() > 0.4 ? primaryCrimson : accentGold,
          speed: 0.003 + Math.random() * 0.003,
          angle: Math.random() * Math.PI * 2,
          distance: 0.45 + Math.random() * 0.45,
          yOffset: (Math.random() - 0.5) * 0.4
        });
      }
    }

    // 8. GENERATE CYBER COMPOUND BOW MODEL (Crisis)
    if (type === 'bow') {
      // Main curved limbs
      const limbSegments = 10;
      const upperLimb: Point3D[] = [];
      const lowerLimb: Point3D[] = [];

      for (let i = 0; i <= limbSegments; i++) {
        const t = i / limbSegments;
        // Sweeps from center x=-0.3, y=0 forward to x=-0.05, y=0.55
        const ux = -0.35 + Math.sin(t * Math.PI / 2) * 0.35;
        const uy = t * 0.55;
        upperLimb.push({ x: ux, y: uy, z: 0 });

        const lx = -0.35 + Math.sin(t * Math.PI / 2) * 0.35;
        const ly = -t * 0.55;
        lowerLimb.push({ x: lx, y: ly, z: 0 });
      }

      // Draw upper and lower limbs
      for (let i = 0; i < limbSegments; i++) {
        addLine(upperLimb[i].x, upperLimb[i].y, 0, upperLimb[i+1].x, upperLimb[i+1].y, 0, primaryCrimson, 2.0, true);
        addLine(lowerLimb[i].x, lowerLimb[i].y, 0, lowerLimb[i+1].x, lowerLimb[i+1].y, 0, primaryCrimson, 2.0, true);
      }

      // Bow pulleys/cams at tips
      const tipU = upperLimb[limbSegments];
      const tipL = lowerLimb[limbSegments];
      add3DCircle(tipU.x, tipU.y, 0, 0.045, 'z', 6, accentGold, 1.5);
      add3DCircle(tipL.x, tipL.y, 0, 0.045, 'z', 6, accentGold, 1.5);

      // Bowstring
      addLine(tipU.x, tipU.y, 0, tipL.x, tipL.y, 0, accentGold, 1.0, true);

      // Loaded glowing cyber energy arrow
      addLine(-0.4, 0, 0, 0.4, 0, 0, softRed, 1.8, true);
      // Arrowhead
      addLine(0.4, 0, 0, 0.32, 0.04, 0, softRed, 1.5, true);
      addLine(0.4, 0, 0, 0.32, -0.04, 0, softRed, 1.5, true);

      // Bow string release energy rings/particles
      for (let i = 0; i < 30; i++) {
        particles.push({
          x: -0.1, y: 0, z: 0,
          size: 1.0 + Math.random() * 1.5,
          color: Math.random() > 0.4 ? softRed : accentGold,
          speed: 0.003 + Math.random() * 0.003,
          angle: Math.random() * Math.PI * 2,
          distance: 0.35 + Math.random() * 0.45,
          yOffset: (Math.random() - 0.5) * 0.6
        });
      }
    }

    // 9. GENERATE CYBER ROCKET LAUNCHER MODEL (Rocket)
    if (type === 'rocket') {
      // Main huge tube
      addLine(-0.7, 0, 0, 0.65, 0, 0, primaryCrimson, 3.0, true);
      add3DCircle(-0.7, 0, 0, 0.11, 'x', 8, primaryCrimson, 2.0);
      add3DCircle(-0.4, 0, 0, 0.11, 'x', 8, primaryCrimson, 1.5);
      add3DCircle(0.0, 0, 0, 0.11, 'x', 8, primaryCrimson, 1.5);
      add3DCircle(0.4, 0, 0, 0.11, 'x', 8, primaryCrimson, 1.5);
      add3DCircle(0.65, 0, 0, 0.13, 'x', 8, accentGold, 2.0);

      // Shroud rails on side
      addLine(-0.65, 0.11, 0, 0.6, 0.11, 0, accentGold, 1.5);
      addLine(-0.65, -0.11, 0, 0.6, -0.11, 0, accentGold, 1.5);

      // Scope / targeting radar on top
      addLine(-0.15, 0.11, 0, -0.1, 0.22, 0, primaryCrimson, 1.5);
      addLine(-0.1, 0.22, 0, 0.15, 0.22, 0, accentGold, 1.8, true);
      addLine(0.15, 0.22, 0, 0.1, 0.11, 0, primaryCrimson, 1.5);
      add3DCircle(0.15, 0.22, 0, 0.045, 'x', 6, accentGold, 1.2);

      // Front & rear grips
      addLine(-0.3, -0.11, 0, -0.35, -0.26, 0, primaryCrimson, 2.0);
      addLine(0.2, -0.11, 0, 0.15, -0.26, 0, primaryCrimson, 2.0);

      // Jet exhaust vent bells at rear
      addLine(-0.7, 0, 0, -0.85, 0.05, 0.05, accentGold, 1.5);
      addLine(-0.7, 0, 0, -0.85, -0.05, -0.05, accentGold, 1.5);
      add3DCircle(-0.85, 0, 0, 0.075, 'x', 6, accentGold, 1.5);

      // Rocket energy fire particles
      for (let i = 0; i < 40; i++) {
        particles.push({
          x: -0.4, y: 0, z: 0,
          size: 1.5 + Math.random() * 2.2,
          color: Math.random() > 0.35 ? softRed : accentGold,
          speed: 0.004 + Math.random() * 0.003,
          angle: Math.random() * Math.PI * 2,
          distance: 0.3 + Math.random() * 0.5,
          yOffset: (Math.random() - 0.5) * 0.4
        });
      }
    }

    // 10. GENERATE DUAL SWORDS MODEL (Zoro)
    if (type === 'dual_swords') {
      // Blade 1 (crossed up-right)
      const segments = 10;
      for (let i = 0; i < segments; i++) {
        const t1 = i / segments;
        const t2 = (i + 1) / segments;
        // Sword 1 points towards bottom-left to top-right
        const x1 = -0.5 + t1 * 1.05;
        const y1 = -0.3 + t1 * 0.65;
        const x2 = -0.5 + t2 * 1.05;
        const y2 = -0.3 + t2 * 0.65;
        addLine(x1, y1, -0.03, x2, y2, -0.03, accentGold, 1.8, true);
        addLine(x1, y1 - 0.02, -0.03, x2, y2 - 0.02, -0.03, accentGold, 0.8, false);
      }
      // Hilt 1 & guard 1
      add3DCircle(-0.25, -0.15, -0.03, 0.065, 'z', 6, primaryCrimson, 1.5);
      addLine(-0.25, -0.15, -0.03, -0.42, -0.25, -0.03, primaryCrimson, 2.0);

      // Blade 2 (crossed down-right)
      for (let i = 0; i < segments; i++) {
        const t1 = i / segments;
        const t2 = (i + 1) / segments;
        // Sword 2 points towards top-left to bottom-right
        const x1 = -0.5 + t1 * 1.05;
        const y1 = 0.3 - t1 * 0.65;
        const x2 = -0.5 + t2 * 1.05;
        const y2 = 0.3 - t2 * 0.65;
        addLine(x1, y1, 0.03, x2, y2, 0.03, accentGold, 1.8, true);
        addLine(x1, y1 + 0.02, 0.03, x2, y2 + 0.02, 0.03, accentGold, 0.8, false);
      }
      // Hilt 2 & guard 2
      add3DCircle(-0.25, 0.15, 0.03, 0.065, 'z', 6, primaryCrimson, 1.5);
      addLine(-0.25, 0.15, 0.03, -0.42, 0.25, 0.03, primaryCrimson, 2.0);

      // Floating wind sparks orbiting the dual blades
      for (let i = 0; i < 40; i++) {
        particles.push({
          x: 0, y: 0, z: 0,
          size: 1.0 + Math.random() * 2.0,
          color: Math.random() > 0.4 ? accentGold : softRed,
          speed: 0.003 + Math.random() * 0.004,
          angle: Math.random() * Math.PI * 2,
          distance: 0.35 + Math.random() * 0.55,
          yOffset: (Math.random() - 0.5) * 0.5
        });
      }
    }

    // 11. GENERATE SHIELD & SWORD MODEL (Ryvoric)
    if (type === 'shield_sword') {
      // OUTER SHIELD BORDER (Beautiful glowing ivory/gold)
      addLine(0.0, 0.44, 0.08, -0.35, 0.38, 0.0, accentGold, 2.2, true, false);
      addLine(0.0, 0.44, 0.08, 0.35, 0.38, 0.0, accentGold, 2.2, true, false);
      addLine(-0.35, 0.38, 0.0, -0.38, 0.15, 0.02, accentGold, 2.2, true, false);
      addLine(0.35, 0.38, 0.0, 0.38, 0.15, 0.02, accentGold, 2.2, true, false);
      addLine(-0.38, 0.15, 0.02, -0.34, -0.15, 0.04, accentGold, 2.2, true, false);
      addLine(0.38, 0.15, 0.02, 0.34, -0.15, 0.04, accentGold, 2.2, true, false);
      addLine(-0.34, -0.15, 0.04, 0.0, -0.52, 0.09, accentGold, 2.2, true, false);
      addLine(0.34, -0.15, 0.04, 0.0, -0.52, 0.09, accentGold, 2.2, true, false);

      // INNER INSET SHIELD BORDER (Double layered, high-tech structure)
      addLine(0.0, 0.38, 0.06, -0.28, 0.32, 0.01, softRed, 1.5, false, false);
      addLine(0.0, 0.38, 0.06, 0.28, 0.32, 0.01, softRed, 1.5, false, false);
      addLine(-0.28, 0.32, 0.01, -0.31, 0.12, 0.02, softRed, 1.5, false, false);
      addLine(0.28, 0.32, 0.01, 0.31, 0.12, 0.02, softRed, 1.5, false, false);
      addLine(-0.31, 0.12, 0.02, -0.27, -0.12, 0.034, softRed, 1.5, false, false);
      addLine(0.31, 0.12, 0.02, 0.27, -0.12, 0.034, softRed, 1.5, false, false);
      addLine(-0.27, -0.12, 0.034, 0.0, -0.42, 0.07, softRed, 1.5, false, false);
      addLine(0.27, -0.12, 0.034, 0.0, -0.42, 0.07, softRed, 1.5, false, false);

      // CROSS-BRACING CONNECTIVES (Adds detailed depth)
      addLine(-0.35, 0.38, 0.0, -0.28, 0.32, 0.01, softRed, 1.2, false, false);
      addLine(0.35, 0.38, 0.0, 0.28, 0.32, 0.01, softRed, 1.2, false, false);
      addLine(-0.38, 0.15, 0.02, -0.31, 0.12, 0.02, softRed, 1.2, false, false);
      addLine(0.38, 0.15, 0.02, 0.31, 0.12, 0.02, softRed, 1.2, false, false);
      addLine(-0.34, -0.15, 0.04, -0.27, -0.12, 0.034, softRed, 1.2, false, false);
      addLine(0.34, -0.15, 0.04, 0.27, -0.12, 0.034, softRed, 1.2, false, false);
      addLine(0.0, 0.44, 0.08, 0.0, 0.38, 0.06, softRed, 1.2, false, false);
      addLine(0.0, -0.52, 0.09, 0.0, -0.42, 0.07, softRed, 1.2, false, false);

      // SHIELD CENTER VERTICAL SPINE (Raised 3D Ridge)
      addLine(0.0, 0.38, 0.06, 0.0, 0.0, 0.09, accentGold, 2.2, true, false);
      addLine(0.0, 0.0, 0.09, 0.0, -0.42, 0.07, accentGold, 2.2, true, false);

      // --- REGAL 3D CROWNED LION CREST ---
      const lz = 0.08;  // Base depth on top of shield face
      const lzi = 0.095; // Inward raised depth (features like forehead & muzzle)
      const lzo = 0.11;  // Nose tip and crown peaks (highest depth)

      // 1. THE REGAL CROWN (Sits atop the lion head: y = 0.19 to y = 0.28)
      // Crown Peaks
      addLine(0.0, 0.28, lzo, -0.06, 0.24, lzi, accentGold, 1.8, true, false); // Center to left peak
      addLine(0.0, 0.28, lzo, 0.06, 0.24, lzi, accentGold, 1.8, true, false);  // Center to right peak
      addLine(-0.06, 0.24, lzi, -0.09, 0.25, lz, accentGold, 1.5, true, false); // Left peak to far left spike
      addLine(0.06, 0.24, lzi, 0.09, 0.25, lz, accentGold, 1.5, true, false);  // Right peak to far right spike

      // Crown Base
      addLine(-0.09, 0.25, lz, -0.05, 0.18, lzi, accentGold, 1.5, false, false);
      addLine(0.09, 0.25, lz, 0.05, 0.18, lzi, accentGold, 1.5, false, false);
      addLine(-0.05, 0.18, lzi, 0.05, 0.18, lzi, accentGold, 1.8, true, false); // Base horizontal connection

      // Crown Inner Facet lines
      addLine(0.0, 0.28, lzo, 0.0, 0.18, lzi, accentGold, 1.2, false, false);
      addLine(-0.06, 0.24, lzi, 0.0, 0.18, lzi, accentGold, 1.0, false, false);
      addLine(0.06, 0.24, lzi, 0.0, 0.18, lzi, accentGold, 1.0, false, false);

      // 2. THE LION FACE MASK
      // Forehead
      addLine(-0.05, 0.18, lzi, -0.05, 0.10, lzi, accentGold, 1.5, false, false);
      addLine(0.05, 0.18, lzi, 0.05, 0.10, lzi, accentGold, 1.5, false, false);
      addLine(-0.05, 0.10, lzi, 0.0, 0.14, lzo, accentGold, 1.5, false, false);
      addLine(0.05, 0.10, lzi, 0.0, 0.14, lzo, accentGold, 1.5, false, false);
      addLine(0.0, 0.18, lzi, 0.0, 0.14, lzo, accentGold, 1.8, true, false); // Raised middle brow

      // Nose Bridge & Snout
      addLine(0.0, 0.14, lzo, 0.0, 0.02, lzo, accentGold, 2.0, true, false); // Vertical nose ridge
      addLine(-0.05, 0.10, lzi, -0.04, 0.02, lzi, accentGold, 1.5, false, false);
      addLine(0.05, 0.10, lzi, 0.04, 0.02, lzi, accentGold, 1.5, false, false);
      
      // Nose Tip & Muzzle
      addLine(0.0, 0.02, lzo, -0.03, -0.02, lzi, accentGold, 1.8, false, false); // Left muzzle
      addLine(0.0, 0.02, lzo, 0.03, -0.02, lzi, accentGold, 1.8, false, false);  // Right muzzle
      addLine(-0.03, -0.02, lzi, 0.03, -0.02, lzi, accentGold, 1.5, false, false); // Muzzle bottom
      addLine(-0.04, 0.02, lzi, -0.03, -0.02, lzi, accentGold, 1.2, false, false);
      addLine(0.04, 0.02, lzi, 0.03, -0.02, lzi, accentGold, 1.2, false, false);

      // Chin / Jaw
      addLine(-0.03, -0.02, lzi, 0.0, -0.07, lzi, accentGold, 1.8, false, false);
      addLine(0.03, -0.02, lzi, 0.0, -0.07, lzi, accentGold, 1.8, false, false);
      addLine(0.0, -0.07, lzi, 0.0, -0.07, lz, accentGold, 1.2, false, false);

      // Cheeks
      addLine(-0.05, 0.10, lzi, -0.11, 0.05, lz, accentGold, 1.5, false, false);
      addLine(0.05, 0.10, lzi, 0.11, 0.05, lz, accentGold, 1.5, false, false);
      addLine(-0.11, 0.05, lz, -0.08, -0.02, lz, accentGold, 1.5, false, false);
      addLine(0.11, 0.05, lz, 0.08, -0.02, lz, accentGold, 1.5, false, false);
      addLine(-0.08, -0.02, lz, -0.03, -0.02, lzi, accentGold, 1.5, false, false);
      addLine(0.08, -0.02, lz, 0.03, -0.02, lzi, accentGold, 1.5, false, false);

      // 3. GLOWING RED LION EYES (Highly aesthetic laser eyes)
      // Left Eye
      addLine(-0.015, 0.08, lzi + 0.005, -0.035, 0.09, lzi + 0.005, softRed, 2.0, true, false);
      addLine(-0.035, 0.09, lzi + 0.005, -0.03, 0.075, lzi + 0.005, softRed, 1.5, true, false);
      addLine(-0.03, 0.075, lzi + 0.005, -0.015, 0.08, lzi + 0.005, softRed, 1.5, true, false);

      // Right Eye
      addLine(0.015, 0.08, lzi + 0.005, 0.035, 0.09, lzi + 0.005, softRed, 2.0, true, false);
      addLine(0.035, 0.09, lzi + 0.005, 0.03, 0.075, lzi + 0.005, softRed, 1.5, true, false);
      addLine(0.03, 0.075, lzi + 0.005, 0.015, 0.08, lzi + 0.005, softRed, 1.5, true, false);

      // 4. THE MAJESTIC OUTWARD LION MANE (Spikes extending around the face mask)
      // Mane Left Spikes
      addLine(-0.05, 0.18, lzi, -0.15, 0.20, lz, accentGold, 1.5, true, false); // Upper Left Spike 1
      addLine(-0.15, 0.20, lz, -0.11, 0.14, lz, accentGold, 1.2, false, false);
      addLine(-0.11, 0.14, lz, -0.20, 0.12, lz, accentGold, 1.5, true, false); // Mid Left Spike 2
      addLine(-0.20, 0.12, lz, -0.14, 0.06, lz, accentGold, 1.2, false, false);
      addLine(-0.14, 0.06, lz, -0.21, 0.02, lz, accentGold, 1.5, true, false); // Lower Left Spike 3
      addLine(-0.21, 0.02, lz, -0.13, -0.04, lz, accentGold, 1.2, false, false);
      addLine(-0.13, -0.04, lz, -0.16, -0.11, lz, accentGold, 1.5, true, false); // Bottom Left Spike 4
      addLine(-0.16, -0.11, lz, -0.06, -0.10, lz, accentGold, 1.2, false, false);
      addLine(-0.06, -0.10, lz, 0.0, -0.07, lzi, accentGold, 1.5, false, false); // Close back to chin

      // Mane Right Spikes
      addLine(0.05, 0.18, lzi, 0.15, 0.20, lz, accentGold, 1.5, true, false);  // Upper Right Spike 1
      addLine(0.15, 0.20, lz, 0.11, 0.14, lz, accentGold, 1.2, false, false);
      addLine(0.11, 0.14, lz, 0.20, 0.12, lz, accentGold, 1.5, true, false);  // Mid Right Spike 2
      addLine(0.20, 0.12, lz, 0.14, 0.06, lz, accentGold, 1.2, false, false);
      addLine(0.14, 0.06, lz, 0.21, 0.02, lz, accentGold, 1.5, true, false);  // Lower Right Spike 3
      addLine(0.21, 0.02, lz, 0.13, -0.04, lz, accentGold, 1.2, false, false);
      addLine(0.13, -0.04, lz, 0.16, -0.11, lz, accentGold, 1.5, true, false);  // Bottom Right Spike 4
      addLine(0.16, -0.11, lz, 0.06, -0.10, lz, accentGold, 1.2, false, false);
      addLine(0.06, -0.10, lz, 0.0, -0.07, lzi, accentGold, 1.5, false, false);  // Close back to chin

      // Inner mane connectives
      addLine(-0.11, 0.14, lz, -0.05, 0.10, lzi, accentGold, 1.0, false, false);
      addLine(0.11, 0.14, lz, 0.05, 0.10, lzi, accentGold, 1.0, false, false);
      addLine(-0.14, 0.06, lz, -0.11, 0.05, lz, accentGold, 1.0, false, false);
      addLine(0.14, 0.06, lz, 0.11, 0.05, lz, accentGold, 1.0, false, false);
      addLine(-0.13, -0.04, lz, -0.08, -0.02, lz, accentGold, 1.0, false, false);
      addLine(0.13, -0.04, lz, 0.08, -0.02, lz, accentGold, 1.0, false, false);

      // GUARDIAN LOWER WINGS / EMBELLISHMENTS (Left Wing)
      const wy = -0.15;
      const wz = 0.06;
      addLine(-0.06, wy, wz, -0.26, wy - 0.04, wz, accentGold, 1.5, true, false);
      addLine(-0.26, wy - 0.04, wz, -0.18, wy - 0.09, wz, accentGold, 1.5, true, false);
      addLine(-0.18, wy - 0.09, wz, -0.06, wy, wz, accentGold, 1.5, true, false);
      // Feather 2
      addLine(-0.18, wy - 0.09, wz, -0.22, wy - 0.15, wz, accentGold, 1.2, false, false);
      addLine(-0.22, wy - 0.15, wz, -0.06, wy, wz, accentGold, 1.2, false, false);
      // Feather 3
      addLine(-0.22, wy - 0.15, wz, -0.15, wy - 0.20, wz, accentGold, 1.0, false, false);
      addLine(-0.15, wy - 0.20, wz, 0.0, -0.32, wz + 0.01, accentGold, 1.0, false, false);

      // GUARDIAN LOWER WINGS / EMBELLISHMENTS (Right Wing)
      addLine(0.06, wy, wz, 0.26, wy - 0.04, wz, accentGold, 1.5, true, false);
      addLine(0.26, wy - 0.04, wz, 0.18, wy - 0.09, wz, accentGold, 1.5, true, false);
      addLine(0.18, wy - 0.09, wz, 0.06, wy, wz, accentGold, 1.5, true, false);
      // Feather 2
      addLine(0.18, wy - 0.09, wz, 0.22, wy - 0.15, wz, accentGold, 1.2, false, false);
      addLine(0.22, wy - 0.15, wz, 0.06, wy, wz, accentGold, 1.2, false, false);
      // Feather 3
      addLine(0.22, wy - 0.15, wz, 0.15, wy - 0.20, wz, accentGold, 1.0, false, false);
      addLine(0.15, wy - 0.20, wz, 0.0, -0.32, wz + 0.01, accentGold, 1.0, false, false);

      // DIAGONAL GUARDIAN GREATSWORD (Behind shield, passes isSword: true)
      // Blade lines
      const swordSegments = 10;
      for (let i = 0; i < swordSegments; i++) {
        const t1 = i / swordSegments;
        const t2 = (i + 1) / swordSegments;
        
        // Blade goes from bottom-left (-0.60, -0.60, -0.05) to top-right (0.18, 0.18, -0.05)
        const x1 = -0.60 + t1 * 0.78;
        const y1 = -0.60 + t1 * 0.78;
        const x2 = -0.60 + t2 * 0.78;
        const y2 = -0.60 + t2 * 0.78;
        
        // Central thicker glowing blade ridge
        addLine(x1, y1, -0.05, x2, y2, -0.05, accentGold, 2.5, true, true);
        
        // Blade sharp outer cutting edges
        addLine(x1 - 0.018, y1 + 0.018, -0.05, x2 - 0.018, y2 + 0.018, -0.05, accentGold, 1.0, false, true);
        addLine(x1 + 0.018, y1 - 0.018, -0.05, x2 + 0.018, y2 - 0.018, -0.05, accentGold, 1.0, false, true);
      }
      
      // Sword sharp tip at (-0.63, -0.63)
      addLine(-0.60 - 0.018, -0.60 + 0.018, -0.05, -0.63, -0.63, -0.05, accentGold, 1.2, false, true);
      addLine(-0.60 + 0.018, -0.60 - 0.018, -0.05, -0.63, -0.63, -0.05, accentGold, 1.2, false, true);

      // Winged Crossguard at (0.18, 0.18, -0.05)
      const hx = 0.18;
      const hy = 0.18;
      // Perpendicular wings (-0.707, 0.707) and (0.707, -0.707)
      addLine(hx, hy, -0.05, hx - 0.12, hy + 0.12, -0.05, softRed, 2.8, true, true);
      addLine(hx, hy, -0.05, hx + 0.12, hy - 0.12, -0.05, softRed, 2.8, true, true);
      // Sharp guard spike-tips pointing slightly up
      addLine(hx - 0.12, hy + 0.12, -0.05, hx - 0.14, hy + 0.16, -0.05, softRed, 1.8, true, true);
      addLine(hx + 0.12, hy - 0.12, -0.05, hx + 0.14, hy - 0.16, -0.05, softRed, 1.8, true, true);

      // Sword Grip Handle with geometric textures
      addLine(hx, hy, -0.05, 0.40, 0.40, -0.05, softRed, 3.2, false, true);
      // Grip rings (spiral wire wrap)
      for (let j = 1; j <= 3; j++) {
        const gt = j / 4;
        const gx = hx + (0.40 - hx) * gt;
        const gy = hy + (0.40 - hy) * gt;
        addLine(gx - 0.02, gy + 0.02, -0.05, gx + 0.02, gy - 0.02, accentGold, 1.5, false, true);
      }

      // Royal Diamond Pommel
      const px = 0.40;
      const py = 0.40;
      const pz = -0.05;
      addLine(px, py, pz, px + 0.03, py + 0.03, pz, accentGold, 1.8, true, true);
      addLine(px, py, pz, px + 0.03, py - 0.03, pz, accentGold, 1.8, true, true);
      addLine(px + 0.03, py + 0.03, pz, px + 0.06, py, pz, accentGold, 1.8, true, true);
      addLine(px + 0.03, py - 0.03, pz, px + 0.06, py, pz, accentGold, 1.8, true, true);

      // Floating particles / magical shield protection aura
      for (let i = 0; i < 40; i++) {
        particles.push({
          x: 0, y: 0, z: 0,
          size: 0.8 + Math.random() * 2.0,
          color: Math.random() > 0.3 ? accentGold : softRed,
          speed: 0.002 + Math.random() * 0.004,
          angle: Math.random() * Math.PI * 2,
          distance: 0.28 + Math.random() * 0.52,
          yOffset: (Math.random() - 0.5) * 0.6
        });
      }
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

    // --- MAIN RENDER LOOP ---
    let lastAutoFireTime = Date.now() - Math.random() * 2000;
    const autoFirePeriod = type === 'sniper' ? 2400 : type === 'rifle' ? 1900 : type === 'smg' ? 1400 : 2100;

    const render = () => {
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;
      const isActive = isHovered || isMobile;

      // Adjust rotation speed depending on hover/active state
      let targetVelY = isActive || isMouseInCard ? baseVelY * 3.5 : baseVelY;
      let targetVelX = 0;

      if (isMouseInCard) {
        // Horizontal cursor speeds up/reverses rotation (smooth luxury feedback)
        targetVelY = baseVelY + mouseX * 0.05;
        // Vertical cursor tilts weapon along X-axis
        targetVelX = mouseY * 0.04;
      }

      // Smooth interpolation
      velY += (targetVelY - velY) * 0.06;
      velX += (targetVelX - velX) * 0.06;

      rotY += velY;
      // Gently return rotX to stable tilt when mouse leaves
      const baseTilt = 0.22;
      rotX += (baseTilt + velX - rotX) * 0.06;

      // Dynamic auto-fire when card is hovered or active in mobile view
      const now = Date.now();
      if (isActive && now - lastAutoFireTime > autoFirePeriod) {
        triggerFire();
        lastAutoFireTime = now;
      }

      // Decay physical recoil offsets back to zero
      recoilX += (0 - recoilX) * 0.15;
      recoilRot += (0 - recoilRot) * 0.15;

      if (bashProgress > 0) {
        bashProgress -= 0.045; // Smooth decay
        if (bashProgress < 0) bashProgress = 0;
      }
      if (bashShockwave > 0) {
        bashShockwave += 0.045; // Smoothly expand shockwave
        if (bashShockwave > 1.2) bashShockwave = 0;
      }

      ctx.clearRect(0, 0, width, height);

      const ctxWidth = width / window.devicePixelRatio;
      const ctxHeight = height / window.devicePixelRatio;

      const centerX = width / 2;
      const centerY = height / 2;
      // Keep model size constrained nicely within card bounds using CSS pixels
      const baseScale = Math.min(ctxWidth, ctxHeight) / 320;
      const isMobileDevice = typeof window !== 'undefined' && window.innerWidth < 768;
      const isTabletDevice = typeof window !== 'undefined' && window.innerWidth >= 768 && window.innerWidth < 1024;
      const sizeMultiplier = isMobileDevice ? 0.55 : isTabletDevice ? 0.72 : 0.88;
      const modelScale = 110 * baseScale * sizeMultiplier;

      ctx.save();
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

      const screenCenterX = ctxWidth / 2;
      const screenCenterY = ctxHeight / 2;

      // 1. Draw glowing digital ring behind weapons (just like the planet)
      const ringTilt = -10 * Math.PI / 180;
      ctx.strokeStyle = 'rgba(140, 16, 7, 0.12)';
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      for (let i = 0; i <= 36; i++) {
        const theta = (i / 36) * Math.PI * 2;
        const rx = Math.cos(theta) * 0.85;
        const rz = Math.sin(theta) * 0.85;
        const ry = 0;
        const rotated = rotate3D(rx, ry, rz, rotX + ringTilt, rotY);
        const sx = screenCenterX + rotated.x * modelScale;
        const sy = screenCenterY - rotated.y * modelScale; // Subtracting makes Y straight (upward)
        if (i === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.stroke();

      // Update particles and remove expired ones
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.angle += p.speed;
        if (p.life !== undefined) {
          p.life -= 0.02; // Smoothly fade over ~50 frames
          // Make spark particles expand outward in an explosion/burst instead of building up in the center
          p.distance += 0.012;
          if (p.life <= 0) {
            particles.splice(i, 1);
          }
        }
      }

      // 2. Render particles behind weapon (depth Z < 0)
      particles.forEach(p => {
        const rx = Math.cos(p.angle) * p.distance;
        const rz = Math.sin(p.angle) * p.distance;
        const ry = p.yOffset;

        const rotated = rotate3D(rx, ry, rz, rotX + ringTilt, rotY);

        if (rotated.z < 0) {
          const sx = screenCenterX + rotated.x * modelScale;
          const sy = screenCenterY - rotated.y * modelScale; // Correct straight coordinate
          const size = p.size * (1 + rotated.z * 0.3) * baseScale * (p.life !== undefined ? p.life : 1.0);
          const baseAlpha = isActive || isMouseInCard ? 0.85 : 0.45;
          const alpha = baseAlpha * (p.life !== undefined ? p.life : 1.0);

          ctx.fillStyle = p.color === accentGold 
            ? `rgba(255, 240, 196, ${alpha * (1 + rotated.z * 0.5)})` 
            : `rgba(140, 16, 7, ${alpha * (1 + rotated.z * 0.5)})`;

          ctx.beginPath();
          ctx.arc(sx, sy, Math.max(0.5, size), 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // 3. Draw 3D Model Wireframe Lines
      // Sort lines slightly by depth of their midpoints for beautiful drawing
      const projectedLines = lines.map(line => {
        let rx1 = line.p1.x;
        let ry1 = line.p1.y;
        let rz1 = line.p1.z;
        let rx2 = line.p2.x;
        let ry2 = line.p2.y;
        let rz2 = line.p2.z;

        if (type === 'katana') {
          // Katana swings forward and rotates around Z axis (slashing swing)
          const swingAngle = recoilRot;
          const cosS = Math.cos(swingAngle);
          const sinS = Math.sin(swingAngle);

          const tx1 = rx1 * cosS - ry1 * sinS;
          const ty1 = rx1 * sinS + ry1 * cosS;
          rx1 = tx1 + recoilX;
          ry1 = ty1;

          const tx2 = rx2 * cosS - ry2 * sinS;
          const ty2 = rx2 * sinS + ry2 * cosS;
          rx2 = tx2 + recoilX;
          ry2 = ty2;
        } else if (type === 'shield_sword') {
          // Shield & Sword custom animation
          if (line.isSword) {
            // High-fidelity pull-back, swing-slam, and return-to-rest cycle
            let swordSlam = 0;
            let rotSlam = 0;
            if (bashProgress > 0) {
              const angle = (1.0 - bashProgress) * Math.PI * 2;
              swordSlam = Math.sin(angle) * 0.16; // slides along diagonal
              rotSlam = -Math.sin(angle) * 0.25;  // rotates to slash/clash
            }
            
            // Pivot rotation centered on the crossguard (0.18, 0.18)
            const pivotX = 0.18;
            const pivotY = 0.18;
            
            const cosR = Math.cos(rotSlam);
            const sinR = Math.sin(rotSlam);
            
            // Offset along diagonal direction (-0.707, -0.707)
            const dx = swordSlam * 0.707;
            const dy = swordSlam * 0.707;
            
            const tx1 = (rx1 - pivotX) * cosR - (ry1 - pivotY) * sinR + pivotX + dx;
            const ty1 = (rx1 - pivotX) * sinR + (ry1 - pivotY) * cosR + pivotY + dy;
            rx1 = tx1;
            ry1 = ty1;

            const tx2 = (rx2 - pivotX) * cosR - (ry2 - pivotY) * sinR + pivotX + dx;
            const ty2 = (rx2 - pivotX) * sinR + (ry2 - pivotY) * cosR + pivotY + dy;
            rx2 = tx2;
            ry2 = ty2;
          } else {
            // Shield shudders slightly on impact
            const shudder = Math.sin(bashProgress * Math.PI * 3.5) * 0.016 * bashProgress;
            rx1 += shudder;
            rx2 += shudder;
          }
        } else {
          // Guns kick backward in X and climb slightly
          rx1 += recoilX;
          rx2 += recoilX;
          const cosR = Math.cos(recoilRot);
          const sinR = Math.sin(recoilRot);
          const ty1 = ry1 * cosR - rz1 * sinR;
          const tz1 = ry1 * sinR + rz1 * cosR;
          ry1 = ty1 + recoilRot * 0.35;
          rz1 = tz1;

          const ty2 = ry2 * cosR - rz2 * sinR;
          const tz2 = ry2 * sinR + rz2 * cosR;
          ry2 = ty2 + recoilRot * 0.35;
          rz2 = tz2;
        }

        const p1Rot = rotate3D(rx1, ry1, rz1, rotX, rotY);
        const p2Rot = rotate3D(rx2, ry2, rz2, rotX, rotY);
        const midZ = (p1Rot.z + p2Rot.z) / 2;
        return {
          line,
          p1: p1Rot,
          p2: p2Rot,
          midZ
        };
      });

      // Sort back-to-front
      projectedLines.sort((a, b) => a.midZ - b.midZ);

      projectedLines.forEach(({ line, p1, p2 }) => {
        const x1 = screenCenterX + p1.x * modelScale;
        const y1 = screenCenterY - p1.y * modelScale; // Correct straight coordinate
        const x2 = screenCenterX + p2.x * modelScale;
        const y2 = screenCenterY - p2.y * modelScale; // Correct straight coordinate

        // Depth-based fade and width
        const alpha = isActive || isMouseInCard ? 0.9 : 0.65;
        const depthAlpha = Math.max(0.2, (alpha * (1.1 + (p1.z + p2.z) * 0.4)));

        ctx.strokeStyle = line.color === accentGold 
          ? `rgba(255, 240, 196, ${depthAlpha})` 
          : `rgba(140, 16, 7, ${depthAlpha * 0.8})`;

        ctx.lineWidth = line.width * baseScale * (1 + (p1.z + p2.z) * 0.2);

        // Neon Glow effect if specified
        if (line.glow && (isActive || isMouseInCard)) {
          ctx.shadowColor = line.color === accentGold ? 'rgba(255, 240, 196, 0.8)' : 'rgba(140, 16, 7, 0.8)';
          ctx.shadowBlur = 12 * baseScale;
        } else {
          ctx.shadowBlur = 0;
        }

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        
        // Reset shadow
        ctx.shadowBlur = 0;
      });

      // 4. Render particles in front of weapon (depth Z >= 0)
      particles.forEach(p => {
        const rx = Math.cos(p.angle) * p.distance;
        const rz = Math.sin(p.angle) * p.distance;
        const ry = p.yOffset;

        const rotated = rotate3D(rx, ry, rz, rotX + ringTilt, rotY);

        if (rotated.z >= 0) {
          const sx = screenCenterX + rotated.x * modelScale;
          const sy = screenCenterY - rotated.y * modelScale; // Correct straight coordinate
          const size = p.size * (1 + rotated.z * 0.3) * baseScale * (p.life !== undefined ? p.life : 1.0);
          const baseAlpha = isActive || isMouseInCard ? 0.9 : 0.5;
          const alpha = baseAlpha * (p.life !== undefined ? p.life : 1.0);

          ctx.fillStyle = p.color === accentGold 
            ? `rgba(255, 240, 196, ${alpha * (1 + rotated.z * 0.5)})` 
            : `rgba(140, 16, 7, ${alpha * (1 + rotated.z * 0.5)})`;

          ctx.beginPath();
          ctx.arc(sx, sy, Math.max(0.5, size), 0, Math.PI * 2);
          ctx.fill();

          // Particle outer soft glow if active
          if (isActive || isMouseInCard) {
            ctx.fillStyle = p.color === accentGold ? 'rgba(255, 240, 196, 0.15)' : 'rgba(140, 16, 7, 0.15)';
            ctx.beginPath();
            ctx.arc(sx, sy, size * 2.5, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      });

      // 4.5. Draw Shield Bash Shockwave
      if (type === 'shield_sword' && bashShockwave > 0) {
        // Project shockwave center (0, 0, 0.06) to screen coordinates
        const centerRot = rotate3D(0, 0, 0.06, rotX, rotY);
        const scx = screenCenterX + centerRot.x * modelScale;
        const scy = screenCenterY - centerRot.y * modelScale;

        ctx.save();
        ctx.strokeStyle = `rgba(255, 240, 196, ${1.0 - bashShockwave})`;
        ctx.lineWidth = 3.5 * baseScale * (1.0 - bashShockwave * 0.4);
        ctx.shadowColor = 'rgba(255, 240, 196, 0.7)';
        ctx.shadowBlur = 15 * baseScale * (1.0 - bashShockwave * 0.2);

        ctx.beginPath();
        ctx.arc(scx, scy, bashShockwave * modelScale * 0.82, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // 5. Draw Muzzle Flash at barrel tip
      if (muzzleFlashLife > 0) {
        const flashSize = muzzleFlashLife * 0.18;
        const barrelTipX = type === 'sniper' ? 0.8 : type === 'rifle' ? 0.72 : type === 'shotgun' ? 0.62 : type === 'rocket' ? 0.65 : type === 'pistol' ? 0.45 : 0.4;
        
        // Project barrel tip with weapon recoil offset
        const tipRot = rotate3D(barrelTipX + recoilX, recoilRot * 0.35, 0, rotX, rotY);
        const tx = screenCenterX + tipRot.x * modelScale;
        const ty = screenCenterY - tipRot.y * modelScale;

        ctx.save();
        ctx.strokeStyle = `rgba(255, 240, 196, ${muzzleFlashLife})`;
        ctx.lineWidth = 2.5 * baseScale;
        ctx.shadowColor = 'rgba(255, 240, 196, 0.8)';
        ctx.shadowBlur = 15 * baseScale;

        ctx.beginPath();
        // Dynamic cross star
        ctx.moveTo(tx - flashSize * modelScale, ty);
        ctx.lineTo(tx + flashSize * modelScale, ty);
        ctx.moveTo(tx, ty - flashSize * modelScale);
        ctx.lineTo(tx, ty + flashSize * modelScale);
        ctx.stroke();

        ctx.fillStyle = `rgba(255, 255, 255, ${muzzleFlashLife})`;
        ctx.beginPath();
        ctx.arc(tx, ty, flashSize * 0.45 * modelScale, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        muzzleFlashLife -= 0.14; // Fast decay
      }

      // 6. Draw active projectiles/bullet tracer lines
      activeProjectiles.forEach((p, index) => {
        p.x += p.vx;
        p.y += p.vy;
        p.z += p.vz;
        p.life -= 1 / p.maxLife;

        if (p.life <= 0) {
          activeProjectiles.splice(index, 1);
          return;
        }

        const pCurr = rotate3D(p.x, p.y, p.z, rotX, rotY);
        const pPrev = rotate3D(p.x - p.vx * 1.5, p.y - p.vy * 1.5, p.z - p.vz * 1.5, rotX, rotY);

        const x1 = screenCenterX + pCurr.x * modelScale;
        const y1 = screenCenterY - pCurr.y * modelScale;
        const x2 = screenCenterX + pPrev.x * modelScale;
        const y2 = screenCenterY - pPrev.y * modelScale;

        ctx.save();
        ctx.strokeStyle = `rgba(255, 240, 196, ${p.life * 0.95})`;
        ctx.lineWidth = 3.0 * baseScale;
        ctx.shadowColor = 'rgba(255, 240, 196, 0.9)';
        ctx.shadowBlur = 12 * baseScale;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.restore();
      });

      // 7. Draw active ejecting shell casings
      activeCasings.forEach((c, index) => {
        c.vx *= 0.98;
        c.vy -= 0.0022; // Falls down (Y decreases in straight space)
        c.x += c.vx;
        c.y += c.vy;
        c.z += c.vz;

        c.rx += c.vrx;
        c.ry += c.vry;
        c.rz += c.vrz;

        c.life -= 0.025;
        if (c.life <= 0) {
          activeCasings.splice(index, 1);
          return;
        }

        const length = 0.035;
        const p1 = { x: -length/2, y: 0, z: 0 };
        const p2 = { x: length/2, y: 0, z: 0 };

        const rotC1 = rotate3D(p1.x, p1.y, p1.z, c.rx, c.ry);
        const rotC2 = rotate3D(p2.x, p2.y, p2.z, c.rx, c.ry);

        const s1 = rotate3D(c.x + rotC1.x, c.y + rotC1.y, c.z + rotC1.z, rotX, rotY);
        const s2 = rotate3D(c.x + rotC2.x, c.y + rotC2.y, c.z + rotC2.z, rotX, rotY);

        const x1 = screenCenterX + s1.x * modelScale;
        const y1 = screenCenterY - s1.y * modelScale;
        const x2 = screenCenterX + s2.x * modelScale;
        const y2 = screenCenterY - s2.y * modelScale;

        ctx.save();
        ctx.strokeStyle = `rgba(255, 240, 196, ${c.life})`;
        ctx.lineWidth = 2.0 * baseScale;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.restore();
      });

      // 8. Draw active Katana slash sweep
      if (activeSlash) {
        activeSlash.progress += 0.07;
        if (activeSlash.progress >= 1.0) {
          activeSlash = null;
        } else {
          const p = activeSlash.progress;
          ctx.save();
          ctx.strokeStyle = `rgba(255, 240, 196, ${(1 - p) * 0.95})`;
          ctx.lineWidth = 4.5 * baseScale * (1 - p);
          ctx.shadowColor = 'rgba(255, 240, 196, 0.9)';
          ctx.shadowBlur = 18 * baseScale;
          ctx.beginPath();

          const segments = 15;
          for (let i = 0; i <= segments; i++) {
            const ratio = i / segments;
            const angle = -Math.PI / 3 + ratio * (Math.PI * 1.25) + activeSlash.angleOffset;
            const radius = 0.45 + p * 0.55;

            const sx = Math.cos(angle) * radius;
            const sy = Math.sin(angle) * radius * 0.5 + 0.08;
            const sz = Math.sin(angle) * radius;

            const rotS = rotate3D(sx, sy, sz, rotX, rotY);
            const x = screenCenterX + rotS.x * modelScale;
            const y = screenCenterY - rotS.y * modelScale;

            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
          ctx.restore();
        }
      }

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      if (parent) {
        parent.removeEventListener('mousemove', handleMouseMove);
        parent.removeEventListener('mouseleave', handleMouseLeave);
        parent.removeEventListener('click', handleParentClick);
      }
    };
  }, [type, isHovered]);

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 select-none">
      <canvas 
        ref={canvasRef} 
        className="w-full h-full object-contain filter drop-shadow-[0_0_15px_rgba(140,16,7,0.15)] group-hover:drop-shadow-[0_0_25px_rgba(255,240,196,0.3)] transition-all duration-500"
      />
    </div>
  );
};

export default ThreeDWeaponCanvas;
