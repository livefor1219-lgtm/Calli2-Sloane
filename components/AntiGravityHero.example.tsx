"use client";

import React from 'react';
import AntiGravityHero from './AntiGravityHero';

/**
 * AntiGravityHero 사용 예제
 * 
 * Matter.js를 사용한 무중력 히어로 섹션
 * - 알록달록한 공/도형 10개가 둥둥 떠다님
 * - 마우스로 드래그 앤 드롭 가능
 * - 어두운 배경에 중앙 텍스트 고정
 */
export default function AntiGravityHeroExample() {
  return (
    <div>
      {/* 기본 사용 */}
      <AntiGravityHero title="Welcome to Future" />
      
      {/* 커스텀 타이틀 */}
      {/* <AntiGravityHero title="Hello World" className="min-h-[80vh]" /> */}
    </div>
  );
}

