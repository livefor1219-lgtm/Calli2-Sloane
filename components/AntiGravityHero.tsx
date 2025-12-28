"use client";

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Matter from 'matter-js';

interface AntiGravityHeroProps {
  title?: string;
  className?: string;
}

export default function AntiGravityHero({ 
  title = "Welcome to Future",
  className = ""
}: AntiGravityHeroProps) {
  const sceneRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const renderRef = useRef<Matter.Render | null>(null);
  const runnerRef = useRef<Matter.Runner | null>(null);
  const shapesRef = useRef<Matter.Body[]>([]);
  const mouseConstraintRef = useRef<Matter.MouseConstraint | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!sceneRef.current) return;

    // Matter.js 엔진 생성
    const engine = Matter.Engine.create();
    engine.world.gravity.y = 0; // 무중력 설정
    engine.world.gravity.x = 0;
    engineRef.current = engine;

    // 렌더러 생성
    const render = Matter.Render.create({
      element: sceneRef.current,
      engine: engine,
      options: {
        width: sceneRef.current.offsetWidth,
        height: sceneRef.current.offsetHeight,
        wireframes: false,
        background: 'transparent',
        pixelRatio: window.devicePixelRatio || 1,
      }
    });
    renderRef.current = render;

    // 도형 색상 배열 (알록달록한 색상)
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
      '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#E74C3C'
    ];

    // 도형 생성 (10개)
    const shapes: Matter.Body[] = [];
    const shapesCount = 10;

    for (let i = 0; i < shapesCount; i++) {
      const x = Math.random() * sceneRef.current.offsetWidth;
      const y = Math.random() * sceneRef.current.offsetHeight;
      const size = 30 + Math.random() * 40; // 30-70px 크기
      
      let body: Matter.Body;
      
      // 다양한 도형 타입 (원, 사각형, 다각형)
      if (i % 3 === 0) {
        // 원
        body = Matter.Bodies.circle(x, y, size / 2, {
          restitution: 0.8,
          friction: 0.1,
          frictionAir: 0.01,
          density: 0.001,
          render: {
            fillStyle: colors[i % colors.length],
            strokeStyle: '#fff',
            lineWidth: 2,
          }
        });
      } else if (i % 3 === 1) {
        // 사각형
        body = Matter.Bodies.rectangle(x, y, size, size, {
          restitution: 0.8,
          friction: 0.1,
          frictionAir: 0.01,
          density: 0.001,
          render: {
            fillStyle: colors[i % colors.length],
            strokeStyle: '#fff',
            lineWidth: 2,
          }
        });
      } else {
        // 다각형 (5각형)
        body = Matter.Bodies.polygon(x, y, 5, size / 2, {
          restitution: 0.8,
          friction: 0.1,
          frictionAir: 0.01,
          density: 0.001,
          render: {
            fillStyle: colors[i % colors.length],
            strokeStyle: '#fff',
            lineWidth: 2,
          }
        });
      }

      // 초기 속도 부여 (둥둥 떠다니는 효과)
      Matter.Body.setVelocity(body, {
        x: (Math.random() - 0.5) * 2,
        y: (Math.random() - 0.5) * 2,
      });
      Matter.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.1);

      shapes.push(body);
      Matter.World.add(engine.world, body);
    }
    shapesRef.current = shapes;

    // 벽 생성 (화면 경계)
    const wallThickness = 50;
    const walls = [
      Matter.Bodies.rectangle(sceneRef.current.offsetWidth / 2, -wallThickness / 2, sceneRef.current.offsetWidth, wallThickness, { isStatic: true }),
      Matter.Bodies.rectangle(sceneRef.current.offsetWidth / 2, sceneRef.current.offsetHeight + wallThickness / 2, sceneRef.current.offsetWidth, wallThickness, { isStatic: true }),
      Matter.Bodies.rectangle(-wallThickness / 2, sceneRef.current.offsetHeight / 2, wallThickness, sceneRef.current.offsetHeight, { isStatic: true }),
      Matter.Bodies.rectangle(sceneRef.current.offsetWidth + wallThickness / 2, sceneRef.current.offsetHeight / 2, wallThickness, sceneRef.current.offsetHeight, { isStatic: true }),
    ];
    Matter.World.add(engine.world, walls);

    // 마우스 드래그 앤 드롭
    const mouse = Matter.Mouse.create(render.canvas);
    const mouseConstraint = Matter.MouseConstraint.create(engine, {
      mouse: mouse,
      constraint: {
        stiffness: 0.2,
        render: {
          visible: false
        }
      }
    });
    Matter.World.add(engine.world, mouseConstraint);
    render.mouse = mouse;
    mouseConstraintRef.current = mouseConstraint;

    // 주기적으로 무작위 힘 추가 (둥둥 떠다니는 효과)
    const interval = setInterval(() => {
      shapesRef.current.forEach(shape => {
        if (Math.random() > 0.7) {
          Matter.Body.applyForce(shape, {
            x: shape.position.x,
            y: shape.position.y
          }, {
            x: (Math.random() - 0.5) * 0.0001,
            y: (Math.random() - 0.5) * 0.0001,
          });
        }
      });
    }, 100);

    // 렌더러 실행
    Matter.Render.run(render);
    const runner = Matter.Runner.create();
    Matter.Runner.run(runner, engine);
    runnerRef.current = runner;

    setIsReady(true);

    // 리사이즈 핸들러
    const handleResize = () => {
      if (!sceneRef.current) return;
      render.options.width = sceneRef.current.offsetWidth;
      render.options.height = sceneRef.current.offsetHeight;
      Matter.Render.setPixelRatio(render, window.devicePixelRatio || 1);
    };
    window.addEventListener('resize', handleResize);

    // 클린업
    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', handleResize);
      if (renderRef.current) {
        Matter.Render.stop(renderRef.current);
        renderRef.current.canvas.remove();
      }
      if (runnerRef.current) {
        Matter.Runner.stop(runnerRef.current);
      }
      if (engineRef.current) {
        Matter.Engine.clear(engineRef.current);
      }
    };
  }, []);

  return (
    <div 
      ref={sceneRef}
      className={`relative w-full h-screen overflow-hidden bg-gradient-to-b from-gray-900 via-gray-800 to-black ${className}`}
    >
      {/* Matter.js 캔버스는 자동으로 여기에 렌더링됩니다 */}
      
      {/* 중앙 텍스트 (고정) */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
      >
        <h1 className="text-6xl md:text-8xl font-bold text-white drop-shadow-2xl">
          {title}
        </h1>
      </motion.div>

      {/* 로딩 인디케이터 */}
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <motion.div
            className="w-16 h-16 border-4 border-white border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        </div>
      )}
    </div>
  );
}

