import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";

// DoodlePad: Lightweight HTML5 canvas drawing with strokes persistence
// Props: value (strokes[]), onChange(strokes[]), width, height
// Exposes via ref: toBlob(): Promise<Blob>, clear(): void

const DoodlePad = forwardRef(function DoodlePad(
  { value, onChange, width = 600, height = 250 },
  ref
) {
  const canvasRef = useRef(null);
  const [strokes, setStrokes] = useState(Array.isArray(value) ? value : []);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState(null);
  const [color, setColor] = useState("#111111");
  const [size, setSize] = useState(3);

  useEffect(() => {
    if (Array.isArray(value)) setStrokes(value);
  }, [value]);

  useEffect(() => {
    redraw();
  }, [strokes, width, height]);

  useImperativeHandle(ref, () => ({
    async toBlob() {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
    },
    clear() {
      setStrokes([]);
      onChange && onChange([]);
    },
  }));

  const getCtx = () => canvasRef.current?.getContext("2d");
  const clearCanvas = () => {
    const ctx = getCtx();
    if (!ctx) return;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  };
  const drawStroke = (ctx, stroke) => {
    if (!stroke || !stroke.points || stroke.points.length < 2) return;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.strokeStyle = stroke.color || color;
    ctx.lineWidth = stroke.size || size;
    ctx.beginPath();
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
    for (let i = 1; i < stroke.points.length; i++) ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
    ctx.stroke();
  };
  const redraw = () => {
    const ctx = getCtx();
    if (!ctx) return;
    clearCanvas();
    strokes.forEach((s) => drawStroke(ctx, s));
  };

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    const clientX = e.touches?.length ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches?.length ? e.touches[0].clientY : e.clientY;

    // Map from CSS pixels to canvas coordinate space to avoid offset when canvas is scaled
    const scaleX = canvas.width / rect.width || 1;
    const scaleY = canvas.height / rect.height || 1;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const onDown = (e) => {
    e.preventDefault();
    const pos = getPos(e);
    const stroke = { color, size, points: [pos] };
    setCurrentStroke(stroke);
    setIsDrawing(true);
  };
  const onMove = (e) => {
    if (!isDrawing || !currentStroke) return;
    const pos = getPos(e);
    const updated = { ...currentStroke, points: [...currentStroke.points, pos] };
    setCurrentStroke(updated);
    // incremental draw
    const ctx = getCtx();
    drawStroke(ctx, { ...updated, points: updated.points.slice(-2) });
  };
  const onUp = () => {
    if (currentStroke) {
      const next = [...strokes, currentStroke];
      setStrokes(next);
      onChange && onChange(next);
      setCurrentStroke(null);
    }
    setIsDrawing(false);
  };

  const undo = () => {
    if (!strokes.length) return;
    const next = strokes.slice(0, -1);
    setStrokes(next);
    onChange && onChange(next);
    redraw();
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 ,justifyContent: "center"}}>
        <label style={{ fontSize: 12 }}>Color</label>
        <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
        <label style={{ fontSize: 12 }}>Brush</label>
        <input type="range" min={1} max={20} value={size} onChange={(e) => setSize(Number(e.target.value))} />
        <button type="button" onClick={undo} style={{ fontSize: 12 }}>Undo</button>
        <button type="button" onClick={() => { setStrokes([]); onChange && onChange([]); }} style={{ fontSize: 12 }}>Clear</button>
      </div>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{ border: "1px dashed rgba(1,1,1,0.35)", borderRadius: 8, width: "100%", maxWidth: width }}
        onMouseDown={onDown}
        onMouseMove={onMove}
        onMouseUp={onUp}
        onMouseLeave={onUp}
        onTouchStart={onDown}
        onTouchMove={onMove}
        onTouchEnd={onUp}
      />
    </div>
  );
});

export default DoodlePad;


