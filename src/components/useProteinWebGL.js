import { useEffect } from "react";
import * as THREE from "three";
import { plddtColor, SITE_COLORS, SS_COLOR } from "./proteinViewerData.js";

const renderAtoms = atoms => {
  const budget = atoms.length > 8000 ? 6000 : atoms.length;
  const stride = Math.max(1, Math.ceil(atoms.length / budget));
  return stride === 1 ? atoms : atoms.filter((_, index) => index % stride === 0 || index === atoms.length - 1);
};

export default function useProteinWebGL({ canvasRef, stateRef, activeSites, selectedSite, advancedPrompt, sizeWarning, comparisonOpen }) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: "high-performance" });
    } catch {
      stateRef.current.gpuMode = false;
      return undefined;
    }

    stateRef.current.gpuMode = true;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 10000);
    camera.position.z = 180;
    const group = new THREE.Group();
    scene.add(group);
    let previousAtoms = null;
    let previousAlphaFoldMode = null;
    let siteObjects = [];
    let raf;

    const disposeObject = object => {
      object.children?.forEach(disposeObject);
      object.geometry?.dispose();
      if (Array.isArray(object.material)) object.material.forEach(material => material.dispose());
      else object.material?.dispose();
    };
    const disposeGroup = () => {
      while (group.children.length) {
        disposeObject(group.children.pop());
      }
    };

    const rebuild = () => {
      const atoms = stateRef.current.atoms;
      const alphaFoldMode = stateRef.current.alphaFoldMode;
      if (!atoms.length || (atoms === previousAtoms && alphaFoldMode === previousAlphaFoldMode)) return;
      previousAtoms = atoms;
      previousAlphaFoldMode = alphaFoldMode;
      disposeGroup();
      siteObjects = [];
      const displayed = renderAtoms(atoms);
      const center = stateRef.current.center;
      const positions = [];
      const colors = [];
      for (let index = 1; index < displayed.length; index++) {
        const previous = displayed[index - 1];
        const atom = displayed[index];
        const gap = Math.hypot(atom[0] - previous[0], atom[1] - previous[1], atom[2] - previous[2]);
        if (gap > 6) continue;
        const color = alphaFoldMode ? plddtColor(atom[5] || 0) : SS_COLOR[atom[3] || 0];
        const rgb = new THREE.Color(color);
        positions.push(previous[0] - center[0], previous[1] - center[1], previous[2] - center[2], atom[0] - center[0], atom[1] - center[1], atom[2] - center[2]);
        colors.push(rgb.r, rgb.g, rgb.b, rgb.r, rgb.g, rgb.b);
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
      geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
      group.add(new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.9 })));

      const residueMap = stateRef.current.residueMap || {};
      const markerRadius = THREE.MathUtils.clamp(stateRef.current.radius * 0.018, 0.55, 1.05);
      activeSites.forEach(site => {
        const atom = atoms[residueMap[site.position]];
        if (!atom) return;
        const color = SITE_COLORS[site.type] || SITE_COLORS.default;
        const marker = new THREE.Group();
        const halo = new THREE.Mesh(
          new THREE.SphereGeometry(markerRadius * 2.2, 12, 12),
          new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.14 }),
        );
        const orb = new THREE.Mesh(
          new THREE.SphereGeometry(markerRadius, 12, 12),
          new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.95 }),
        );
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(markerRadius * 1.9, markerRadius * 0.16, 8, 24),
          new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.8 }),
        );
        marker.add(halo, orb, ring);
        marker.renderOrder = 10;
        marker.position.set(atom[0] - center[0], atom[1] - center[1], atom[2] - center[2]);
        group.add(marker);
        siteObjects.push({ site, marker });
      });
    };

    const resize = () => {
      const width = canvas.clientWidth || canvas.width;
      const height = canvas.clientHeight || canvas.height;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.setSize(width, height, false);
      camera.aspect = width / Math.max(1, height);
      camera.updateProjectionMatrix();
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    const animate = () => {
      if (!advancedPrompt && !sizeWarning) {
        rebuild();
        const { rx, ry, zoom, radius } = stateRef.current;
        group.rotation.x = rx;
        group.rotation.y = ry;
        camera.position.z = Math.max(40, radius * 3.2 / zoom);
        camera.lookAt(0, 0, 0);
        stateRef.current.activeSiteProjections = [];
        siteObjects.forEach(({ site, marker }) => {
          const selected = selectedSite === site;
          marker.scale.setScalar(selected ? 1.45 : 1);
          marker.quaternion.copy(camera.quaternion);
          const position = marker.position.clone().applyEuler(group.rotation).project(camera);
          stateRef.current.activeSiteProjections.push({
            sx: (position.x + 1) * 0.5 * canvas.clientWidth,
            sy: (1 - position.y) * 0.5 * canvas.clientHeight,
            depth: position.z,
            site,
          });
        });
        renderer.render(scene, camera);
      }
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      observer.disconnect();
      disposeGroup();
      renderer.dispose();
      stateRef.current.gpuMode = false;
    };
  }, [canvasRef, stateRef, activeSites, selectedSite, advancedPrompt, sizeWarning, comparisonOpen]);
}
