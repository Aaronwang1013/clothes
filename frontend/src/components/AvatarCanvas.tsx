"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { BodyState } from "./BodyPanel";

interface AvatarCanvasProps {
  bodyState: BodyState;
  clothColor: string;
}

export default function AvatarCanvas({ bodyState, clothColor }: AvatarCanvasProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ bodyState, clothColor });
  const sceneRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    avatarGroup: THREE.Group;
    animId: number;
  } | null>(null);
  const dragRef = useRef({ isDragging: false, lastX: 0, lastY: 0, rotY: 0, rotX: 0, zoom: 1 });

  // Keep state ref in sync
  stateRef.current = { bodyState, clothColor };

  useEffect(() => {
    const canvas = canvasRef.current!;
    const wrap = wrapRef.current!;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
    camera.position.set(0, 1.5, 5.2);
    camera.lookAt(0, 1.2, 0);

    // Lights
    scene.add(new THREE.AmbientLight(0xFFF5E6, 0.6));
    const keyLight = new THREE.DirectionalLight(0xFFF5E6, 1.2);
    keyLight.position.set(2, 5, 3);
    keyLight.castShadow = true;
    scene.add(keyLight);
    const fillLight = new THREE.DirectionalLight(0xC4A882, 0.4);
    fillLight.position.set(-3, 2, -1);
    scene.add(fillLight);
    const rimLight = new THREE.DirectionalLight(0xE0D8CC, 0.6);
    rimLight.position.set(0, 3, -4);
    scene.add(rimLight);

    // Floor
    const floorGeo = new THREE.PlaneGeometry(8, 8);
    const floorMat = new THREE.MeshLambertMaterial({ color: 0xDDD8CE });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    const avatarGroup = new THREE.Group();
    scene.add(avatarGroup);

    function resize() {
      const w = wrap.clientWidth;
      const h = wrap.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }

    function buildAvatar() {
      while (avatarGroup.children.length) avatarGroup.remove(avatarGroup.children[0]);

      const s = stateRef.current.bodyState;
      const cc = stateRef.current.clothColor;
      const scaleH = s.height / 170;
      const scaleW = (s.weight / 65) * 0.5 + 0.5;
      const shoulderScale = s.shoulder / 42;
      const chestScale = s.chest / 90;
      const waistScale = s.waist / 75;
      const hipScale = s.hip / 95;

      const skinMat = new THREE.MeshLambertMaterial({ color: new THREE.Color(s.skinColor) });
      const hairMat = new THREE.MeshLambertMaterial({ color: new THREE.Color(s.hairColor) });
      const clothTopMat = new THREE.MeshLambertMaterial({ color: new THREE.Color(cc) });
      const clothBotMat = new THREE.MeshLambertMaterial({ color: new THREE.Color(cc) });

      // Feet
      for (const side of [-1, 1]) {
        const foot = new THREE.Mesh(
          new THREE.BoxGeometry(0.14 * scaleW, 0.08, 0.28),
          skinMat
        );
        foot.position.set(side * 0.18 * shoulderScale * 0.5, 0.04, 0.05);
        foot.castShadow = true;
        avatarGroup.add(foot);
      }

      // Legs
      const legHeight = 0.85 * scaleH;
      for (const side of [-1, 1]) {
        const legGeo = new THREE.CylinderGeometry(
          0.1 * hipScale * 0.6 * scaleW,
          0.09 * hipScale * 0.6 * scaleW,
          legHeight, 8
        );
        const leg = new THREE.Mesh(legGeo, clothBotMat);
        leg.position.set(side * 0.17 * hipScale * 0.5, legHeight / 2 + 0.08, 0);
        leg.castShadow = true;
        avatarGroup.add(leg);
      }

      // Hips
      const hipBase = 1 + legHeight + 0.08;
      const hipGeo = new THREE.SphereGeometry(0.24 * hipScale * scaleW, 12, 8);
      hipGeo.scale(1, 0.55, 0.75);
      const hipMesh = new THREE.Mesh(hipGeo, clothBotMat);
      hipMesh.position.set(0, hipBase, 0);
      hipMesh.castShadow = true;
      avatarGroup.add(hipMesh);

      // Torso
      const torsoH = 0.55 * scaleH;
      const torsoGeo = new THREE.CylinderGeometry(
        0.22 * chestScale * scaleW,
        0.17 * waistScale * scaleW,
        torsoH, 12
      );
      const torsoMesh = new THREE.Mesh(torsoGeo, clothTopMat);
      const torsoBase = hipBase + 0.12;
      torsoMesh.position.set(0, torsoBase + torsoH / 2, 0);
      torsoMesh.castShadow = true;
      avatarGroup.add(torsoMesh);

      // Arms
      const armH = 0.58 * scaleH;
      const armY = torsoBase + torsoH - 0.05;
      for (const side of [-1, 1]) {
        const armX = side * (0.28 * shoulderScale * scaleW + 0.075 * scaleW);

        // Upper arm (cloth)
        const upperGeo = new THREE.CylinderGeometry(0.075 * scaleW, 0.065 * scaleW, armH * 0.55, 8);
        const upper = new THREE.Mesh(upperGeo, clothTopMat);
        upper.position.set(armX, armY - armH * 0.28, 0);
        upper.castShadow = true;
        avatarGroup.add(upper);

        // Lower arm (skin)
        const lowerGeo = new THREE.CylinderGeometry(0.06 * scaleW, 0.055 * scaleW, armH * 0.45, 8);
        const lower = new THREE.Mesh(lowerGeo, skinMat);
        lower.position.set(armX, armY - armH * 0.28 - armH * 0.5, 0);
        lower.castShadow = true;
        avatarGroup.add(lower);

        // Hand
        const hand = new THREE.Mesh(new THREE.SphereGeometry(0.055 * scaleW, 8, 6), skinMat);
        hand.position.set(armX, armY - armH * 0.28 - armH * 0.5 - armH * 0.25, 0);
        hand.castShadow = true;
        avatarGroup.add(hand);
      }

      // Neck
      const neckGeo = new THREE.CylinderGeometry(0.08 * scaleW, 0.085 * scaleW, 0.12 * scaleH, 8);
      const neckMesh = new THREE.Mesh(neckGeo, skinMat);
      const neckY = torsoBase + torsoH + 0.06 * scaleH;
      neckMesh.position.set(0, neckY, 0);
      neckMesh.castShadow = true;
      avatarGroup.add(neckMesh);

      // Head
      const headY = neckY + 0.18 * scaleH;
      const headGeo = new THREE.SphereGeometry(0.18 * scaleH * 0.7, 16, 12);
      const headMesh = new THREE.Mesh(headGeo, skinMat);
      headMesh.position.set(0, headY, 0);
      headMesh.castShadow = true;
      avatarGroup.add(headMesh);

      // Hair
      const hairGeo = new THREE.SphereGeometry(
        0.185 * scaleH * 0.7, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55
      );
      const hair = new THREE.Mesh(hairGeo, hairMat);
      hair.position.set(0, headY + 0.02, 0);
      hair.castShadow = true;
      avatarGroup.add(hair);

      // Eyes
      const eyeMat = new THREE.MeshLambertMaterial({ color: 0x2C2C2C });
      for (const side of [-1, 1]) {
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 6), eyeMat);
        eye.position.set(side * 0.065, headY + 0.02, 0.165 * scaleH * 0.7);
        avatarGroup.add(eye);
      }

      // Adjust camera
      const totalH = headY + 0.22 * scaleH * 0.7;
      const midH = totalH * 0.48;
      camera.position.set(0, midH, totalH * 1.9 + 1.2);
      camera.lookAt(0, midH, 0);
    }

    buildAvatar();
    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    // Drag controls
    const d = dragRef.current;
    const onMouseDown = (e: MouseEvent) => { d.isDragging = true; d.lastX = e.clientX; d.lastY = e.clientY; };
    const onMouseUp = () => { d.isDragging = false; };
    const onMouseMove = (e: MouseEvent) => {
      if (!d.isDragging) return;
      d.rotY += (e.clientX - d.lastX) * 0.008;
      d.rotX += (e.clientY - d.lastY) * 0.004;
      d.rotX = Math.max(-0.3, Math.min(0.5, d.rotX));
      d.lastX = e.clientX;
      d.lastY = e.clientY;
    };
    const onWheel = (e: WheelEvent) => {
      d.zoom += e.deltaY * 0.001;
      d.zoom = Math.max(0.6, Math.min(2.0, d.zoom));
      e.preventDefault();
    };
    const onTouchStart = (e: TouchEvent) => { d.isDragging = true; d.lastX = e.touches[0].clientX; };
    const onTouchEnd = () => { d.isDragging = false; };
    const onTouchMove = (e: TouchEvent) => {
      if (!d.isDragging) return;
      d.rotY += (e.touches[0].clientX - d.lastX) * 0.01;
      d.lastX = e.touches[0].clientX;
    };

    canvas.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    canvas.addEventListener("touchstart", onTouchStart);
    canvas.addEventListener("touchend", onTouchEnd);
    canvas.addEventListener("touchmove", onTouchMove);

    // Animate
    let animId = 0;
    function animate() {
      animId = requestAnimationFrame(animate);
      buildAvatar();
      avatarGroup.rotation.y = d.rotY + Date.now() * 0.0002;
      avatarGroup.rotation.x = d.rotX;
      camera.fov = 55 * d.zoom;
      camera.updateProjectionMatrix();
      renderer.render(scene, camera);
    }
    animate();

    sceneRef.current = { renderer, scene, camera, avatarGroup, animId };

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
      canvas.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("wheel", onWheel);
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchend", onTouchEnd);
      canvas.removeEventListener("touchmove", onTouchMove);
      renderer.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={wrapRef}
      className="relative overflow-hidden"
      style={{ background: "linear-gradient(160deg, #EDECE8 0%, #E0DAD0 100%)" }}
    >
      <canvas ref={canvasRef} className="w-full h-full block" />

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-[rgba(28,28,28,0.7)] text-white backdrop-blur-[8px] px-[18px] py-2 text-[0.72rem] tracking-[0.1em] uppercase pointer-events-none opacity-80">
        拖曳旋轉 · 滾輪縮放
      </div>

      <div className="absolute top-5 right-5 text-[0.68rem] tracking-[0.08em] uppercase text-taupe flex items-center gap-1.5">
        <span className="text-base">↻</span> 360° 預覽
      </div>
    </div>
  );
}
