"use client";

import React from 'react';
import RainbowButton from './RainbowButton';

/**
 * RainbowButton 사용 예제
 * 
 * Framer Motion을 사용한 무지개 그라데이션 버튼 컴포넌트
 * 마우스를 올리면 무지개 색으로 빛나는 효과가 나타납니다.
 */
export default function RainbowButtonExample() {
  return (
    <div className="min-h-screen bg-gray-900 p-8 flex flex-col gap-8 items-center justify-center">
      <h1 className="text-3xl font-bold text-white mb-8">Rainbow Button Examples</h1>
      
      {/* 기본 버튼 */}
      <RainbowButton onClick={() => alert('기본 버튼 클릭!')}>
        Click Me!
      </RainbowButton>
      
      {/* 아웃라인 버튼 */}
      <RainbowButton 
        variant="outline" 
        onClick={() => alert('아웃라인 버튼 클릭!')}
        className="border-white"
      >
        Outline Button
      </RainbowButton>
      
      {/* 고스트 버튼 */}
      <RainbowButton 
        variant="ghost" 
        onClick={() => alert('고스트 버튼 클릭!')}
      >
        Ghost Button
      </RainbowButton>
      
      {/* 커스텀 스타일 */}
      <RainbowButton 
        onClick={() => alert('커스텀 버튼 클릭!')}
        className="px-8 py-4 text-xl rounded-full"
      >
        Custom Style
      </RainbowButton>
      
      {/* 비활성화 버튼 */}
      <RainbowButton 
        disabled
        onClick={() => alert('이 메시지는 표시되지 않습니다')}
      >
        Disabled Button
      </RainbowButton>
    </div>
  );
}

