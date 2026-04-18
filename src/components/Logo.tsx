import React from 'react';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  showText?: boolean;
  variant?: 'light' | 'dark';
}

export const Logo: React.FC<LogoProps> = ({ className, showText = true, variant = 'dark' }) => {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="relative flex items-center justify-center w-12 h-12">
        {/* Modern Minimalist Scissor/C Logo */}
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Background Circle/Shape */}
          <circle cx="50" cy="50" r="48" className="stroke-accent/10 fill-accent/5" strokeWidth="1" />
          
          {/* Stylized Scissor Blades forming a 'C' */}
          <path
            d="M75 30C70 25 60 20 50 20C33.4315 20 20 33.4315 20 50C20 66.5685 33.4315 80 50 80C60 80 70 75 75 70"
            className="stroke-accent"
            strokeWidth="4"
            strokeLinecap="round"
          />
          
          {/* Scissor Pivot Point */}
          <circle cx="50" cy="50" r="3" className="fill-accent" />
          
          {/* Scissor Blade Detail - Thin Elegant lines */}
          <path
            d="M50 50L80 20"
            className="stroke-accent"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.6"
          />
          <path
            d="M50 50L80 80"
            className="stroke-accent"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.6"
          />
        </svg>
      </div>
      
      {showText && (
        <div className="flex flex-col">
          <span className="font-heading text-2xl leading-none tracking-tight text-foreground uppercase pt-1">
            Chico
          </span>
          <span className="text-[9px] uppercase tracking-[0.4em] text-accent font-bold">
            Cabeleireiros
          </span>
        </div>
      )}
    </div>
  );
};
