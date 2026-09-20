import React from "react";

export default function ProteinCanvas({ canvasRef, autoRotate, onToggleAutoRotate, onReset }) {
  return (
    <>
      <canvas ref={canvasRef} className="mv-canvas pv-canvas" />
      <div className="pv-canvas-btns">
        <button className={`pv-ctrl${autoRotate ? " pv-ctrl--active" : ""}`} onClick={onToggleAutoRotate}>
          {autoRotate ? "⏸" : "▶"}
        </button>
        <button className="pv-ctrl" title="Reset view" onClick={onReset}>↺</button>
      </div>
    </>
  );
}
