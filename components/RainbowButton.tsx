"use client";

import React from 'react';
import { motion } from 'framer-motion';

interface RainbowButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  variant?: 'default' | 'outline' | 'ghost';
}

export default function RainbowButton({ 
  children, 
  onClick, 
  className = '', 
  disabled = false,
  variant = 'default'
}: RainbowButtonProps) {
  const rainbowGradient = 'linear-gradient(90deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3, #ff0000)';
  
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      className={`
        relative px-6 py-3 rounded-lg font-bold text-white
        overflow-hidden transition-all duration-300
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variant === 'outline' ? 'border-2' : ''}
        ${variant === 'ghost' ? 'bg-transparent' : ''}
        ${className}
      `}
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* 기본 배경 (호버 전) */}
      {variant === 'default' && (
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600" />
      )}
      
      {/* 무지개 그라데이션 배경 (호버 시) */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: rainbowGradient,
          backgroundSize: '200% 100%',
          opacity: 0,
        }}
        animate={{
          backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'linear',
        }}
        whileHover={{
          opacity: 1,
        }}
      />
      
      {/* 텍스트 레이어 (위에 표시) */}
      <span className="relative z-10 drop-shadow-lg">
        {children}
      </span>
      
      {/* 글로우 효과 (호버 시) */}
      <motion.div
        className="absolute -inset-1 opacity-0 blur-md -z-10"
        style={{
          background: rainbowGradient,
          backgroundSize: '200% 100%',
        }}
        animate={{
          backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'linear',
        }}
        whileHover={{
          opacity: 0.6,
        }}
      />
    </motion.button>
  );
}

