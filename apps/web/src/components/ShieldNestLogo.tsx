import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface ShieldNestLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | 'xxxl';
  enableMouseFollow?: boolean;
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12', 
  lg: 'w-16 h-16',
  xl: 'w-24 h-24',
  xxl: 'w-32 h-32',
  xxxl: 'w-40 h-40'
};

export default function ShieldNestLogo({ 
  className = '', 
  size = 'md', 
  enableMouseFollow = true 
}: ShieldNestLogoProps) {
  const { isDark } = useTheme();
  const logoRef = useRef<HTMLDivElement>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [rotationX, setRotationX] = useState(0);
  const [rotationY, setRotationY] = useState(0);
  const [rotationZ, setRotationZ] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const animationFrameRef = useRef<number>();
  
  // Use dark logo for light mode, light logo for dark mode
  const logoSrc = isDark ? '/shieldnest-logo.svg' : '/shieldnest-logo-dark.svg';

  // Throttled mouse move handler for better performance
  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!enableMouseFollow || !logoRef.current || !isVisible) return;

    // Cancel previous animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    animationFrameRef.current = requestAnimationFrame(() => {
      const logoElement = logoRef.current;
      if (!logoElement) return;

      const rect = logoElement.getBoundingClientRect();
      const logoCenterX = rect.left + rect.width / 2;
      const logoCenterY = rect.top + rect.height / 2;
      const mouseX = event.clientX;
      const mouseY = event.clientY;

      // Horizontal flip: Determine if mouse is to the right of logo center
      const shouldFlip = mouseX > logoCenterX;
      
      // Calculate deltas from logo center
      const deltaX = mouseX - logoCenterX;
      const deltaY = mouseY - logoCenterY;
      const maxRotation = 25; // Reduced rotation for more subtle movement
      const rotationRange = 100; // Less sensitive for smoother movement
      
      // Calculate the angle from logo center to mouse position
      const angle = Math.atan2(deltaY, deltaX);
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      
      // Normalize distance for rotation intensity
      const normalizedDistance = Math.min(distance / rotationRange, 1);
      
      // X-axis rotation (vertical tilt): Invert the deltaY to flip up/down behavior
      // Mouse up (negative deltaY) = look up (positive rotation)
      // Mouse down (positive deltaY) = look down (negative rotation)
      const invertedDeltaY = -deltaY; // Flip the Y direction completely
      let newRotationX = (invertedDeltaY / rotationRange) * (maxRotation * 0.6);
      newRotationX = Math.max(-maxRotation * 0.6, Math.min(maxRotation * 0.6, newRotationX));
      
      // Y-axis rotation (depth tilt): Based on horizontal position but adjusted for flip
      // When flipped, we want the rotation to feel natural from the viewer's perspective
      let newRotationY = 0;
      if (!shouldFlip) {
        // Normal state: positive X = rotate right
        newRotationY = (deltaX / rotationRange) * (maxRotation * 0.4);
      } else {
        // Flipped state: we want the same visual effect, so we adjust the rotation
        newRotationY = -(deltaX / rotationRange) * (maxRotation * 0.4);
      }
      newRotationY = Math.max(-maxRotation * 0.4, Math.min(maxRotation * 0.4, newRotationY));
      
      // Z-axis rotation: Subtle roll based on the angle to mouse
      let newRotationZ = Math.sin(angle) * normalizedDistance * (maxRotation * 0.3);
      newRotationZ = Math.max(-maxRotation * 0.3, Math.min(maxRotation * 0.3, newRotationZ));
      
      // Only update if states change to avoid unnecessary re-renders
      setIsFlipped(prev => prev !== shouldFlip ? shouldFlip : prev);
      setRotationX(prev => Math.abs(prev - newRotationX) > 0.1 ? newRotationX : prev);
      setRotationY(prev => Math.abs(prev - newRotationY) > 0.1 ? newRotationY : prev);
      setRotationZ(prev => Math.abs(prev - newRotationZ) > 0.1 ? newRotationZ : prev);
    });
  }, [enableMouseFollow, isVisible]);

  // Intersection Observer to track visibility
  useEffect(() => {
    if (!enableMouseFollow || !logoRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    observer.observe(logoRef.current);
    // Set visible immediately for better responsiveness
    setIsVisible(true);

    return () => {
      observer.disconnect();
    };
  }, [enableMouseFollow]);

  // Mouse event listeners
  useEffect(() => {
    if (!enableMouseFollow) return;

    document.addEventListener('mousemove', handleMouseMove, { passive: true });

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [handleMouseMove, enableMouseFollow]);

  return (
    <div 
      ref={logoRef}
      className={`${sizeClasses[size]} ${className} transition-transform duration-300 ease-out`}
      style={{
        transform: enableMouseFollow 
          ? `scaleX(${isFlipped ? -1 : 1}) rotateX(${rotationX}deg) rotateY(${rotationY}deg) rotateZ(${rotationZ}deg)`
          : 'scaleX(1) rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
        transformStyle: 'preserve-3d',
        transformOrigin: 'center center',
      }}
    >
      <img 
        src={logoSrc} 
        alt="ShieldNest Logo" 
        className="w-full h-full select-none"
        draggable={false}
      />
    </div>
  );
}

