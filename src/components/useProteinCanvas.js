import { useEffect } from "react";

export default function useProteinCanvas({
  canvasRef,
  dragRef,
  stateRef,
  draw,
  autoRotate,
  advancedPrompt,
  sizeWarning,
  comparisonOpen,
  setSelectedSite,
}) {
  useEffect(() => {
    let raf;
    let lastDraw = 0;
    const loop = () => {
      if (autoRotate && !dragRef.current.on) stateRef.current.ry += 0.005;
      const atomCount = stateRef.current.atoms.length;
      const drawInterval = atomCount > 4000 ? 33 : 0;
      const now = performance.now();
      if (!advancedPrompt && !sizeWarning && now - lastDraw >= drawInterval) {
        lastDraw = now;
        draw();
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [autoRotate, draw, advancedPrompt, sizeWarning, dragRef, stateRef]);

  useEffect(() => {
    const resize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    let rafId;
    const debouncedResize = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(resize);
    };
    const observer = new ResizeObserver(debouncedResize);
    if (canvasRef.current) observer.observe(canvasRef.current);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(rafId);
    };
  }, [canvasRef, comparisonOpen]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const down = event => {
      dragRef.current = { on: true, lx: event.clientX, ly: event.clientY };
    };
    const move = event => {
      if (!dragRef.current.on) return;
      stateRef.current.ry += (event.clientX - dragRef.current.lx) * 0.007;
      stateRef.current.rx += (event.clientY - dragRef.current.ly) * 0.007;
      dragRef.current.lx = event.clientX;
      dragRef.current.ly = event.clientY;
    };
    const up = event => {
      if (dragRef.current.on) {
        const dx = Math.abs(event.clientX - dragRef.current.lx);
        const dy = Math.abs(event.clientY - dragRef.current.ly);
        if (dx < 4 && dy < 4) {
          const rect = canvas.getBoundingClientRect();
          const mx = event.clientX - rect.left;
          const my = event.clientY - rect.top;
          const projections = stateRef.current.activeSiteProjections || [];
          let hit = null;
          let bestDistance = Infinity;
          projections.forEach(projection => {
            const distance = Math.sqrt((mx - projection.sx) ** 2 + (my - projection.sy) ** 2);
            if (distance < 18 && distance < bestDistance) {
              bestDistance = distance;
              hit = projection.site;
            }
          });
          if (hit) setSelectedSite(previous => previous === hit ? null : hit);
        }
      }
      dragRef.current.on = false;
    };
    const wheel = event => {
      event.preventDefault();
      stateRef.current.zoom = Math.max(0.3, Math.min(4.5, stateRef.current.zoom - event.deltaY * 0.001));
    };

    canvas.addEventListener("mousedown", down);
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    canvas.addEventListener("wheel", wheel, { passive: false });
    return () => {
      canvas.removeEventListener("mousedown", down);
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
      canvas.removeEventListener("wheel", wheel);
    };
  }, [canvasRef, dragRef, stateRef, comparisonOpen, setSelectedSite]);
}
