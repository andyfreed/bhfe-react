'use client';
import { useEffect, useRef } from 'react';

interface BackgroundEffectProps {
  className?: string;
  intensity?: 'light' | 'medium' | 'strong';
  color?: 'primary' | 'accent' | 'secondary';
}

export default function BackgroundEffect({ 
  className = '', 
  intensity = 'medium',
  color = 'primary'
}: BackgroundEffectProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas dimensions
    const setDimensions = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    setDimensions();
    window.addEventListener('resize', setDimensions);
    
    // Define colors based on theme
    let colors: string[] = [];
    switch (color) {
      case 'primary':
        colors = ['#2563eb', '#1e40af', '#3b82f6'];
        break;
      case 'accent':
        colors = ['#f59e0b', '#d97706', '#fbbf24'];
        break;
      case 'secondary':
        colors = ['#10b981', '#059669', '#34d399'];
        break;
      default:
        colors = ['#2563eb', '#1e40af', '#3b82f6'];
    }
    
    // Define intensity
    let particleCount = 20;
    let opacityFactor = 0.1;
    let sizeFactor = 1;
    
    switch (intensity) {
      case 'light':
        particleCount = 10;
        opacityFactor = 0.05;
        sizeFactor = 0.75;
        break;
      case 'medium':
        particleCount = 20;
        opacityFactor = 0.1;
        sizeFactor = 1;
        break;
      case 'strong':
        particleCount = 30;
        opacityFactor = 0.15;
        sizeFactor = 1.25;
        break;
    }
    
    // Create particles
    const particles: {
      x: number;
      y: number;
      size: number;
      color: string;
      speedX: number;
      speedY: number;
    }[] = [];
    
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 200 * sizeFactor + 100,
        color: colors[Math.floor(Math.random() * colors.length)],
        speedX: (Math.random() - 0.5) * 0.2,
        speedY: (Math.random() - 0.5) * 0.2
      });
    }
    
    // Animation function
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw particles
      particles.forEach(particle => {
        ctx.beginPath();
        
        // Create radial gradient
        const gradient = ctx.createRadialGradient(
          particle.x,
          particle.y,
          0,
          particle.x,
          particle.y,
          particle.size
        );
        
        // Format opacity as 2-digit hex
        const opacityHex = Math.floor(opacityFactor * 255).toString(16).padStart(2, '0');
        
        gradient.addColorStop(0, `${particle.color}${opacityHex}`);
        gradient.addColorStop(1, `${particle.color}00`);
        
        ctx.fillStyle = gradient;
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Move particles
        particle.x += particle.speedX;
        particle.y += particle.speedY;
        
        // Boundary check
        if (particle.x < -particle.size) particle.x = canvas.width + particle.size;
        if (particle.x > canvas.width + particle.size) particle.x = -particle.size;
        if (particle.y < -particle.size) particle.y = canvas.height + particle.size;
        if (particle.y > canvas.height + particle.size) particle.y = -particle.size;
      });
      
      requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      window.removeEventListener('resize', setDimensions);
    };
  }, [intensity, color]);
  
  return (
    <canvas
      ref={canvasRef}
      className={`fixed top-0 left-0 -z-10 h-full w-full ${className}`}
    />
  );
} 