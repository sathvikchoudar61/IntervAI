import React, { useEffect, useRef } from 'react';

export default function WaveVisualizer({ isRecording, stream }) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const audioContextRef = useRef(null);
  const sourceNodeRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas ? canvas.getContext('2d') : null;

    function cleanup() {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      if (sourceNodeRef.current) {
        sourceNodeRef.current.disconnect();
        sourceNodeRef.current = null;
      }
      if (audioContextRef.current) {
        if (audioContextRef.current.state !== 'closed') {
          audioContextRef.current.close();
        }
        audioContextRef.current = null;
      }
      if (canvas && ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }

    if (!isRecording || !stream || !canvas) {
      cleanup();
      return;
    }

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    try {
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 32;

      const sourceNode = audioContext.createMediaStreamSource(stream);
      sourceNodeRef.current = sourceNode;
      sourceNode.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      function draw() {
        if (!canvasRef.current) return;
        animationRef.current = requestAnimationFrame(draw);

        analyser.getByteFrequencyData(dataArray);
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const barWidth = canvas.width / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const barHeight = Math.min(canvas.height, (dataArray[i] / 255) * canvas.height * 1.3);
          
          // Draw wave in custom green brand HSL matching the LeetCode theme
          ctx.fillStyle = `hsla(134, 50%, ${35 + (barHeight / canvas.height) * 35}%, 0.85)`;
          ctx.shadowBlur = 4;
          ctx.shadowColor = 'rgba(47, 141, 70, 0.3)';
          
          const y = (canvas.height - barHeight) / 2;
          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(x, y, barWidth - 3, Math.max(4, barHeight), 2);
          } else {
            ctx.rect(x, y, barWidth - 3, Math.max(4, barHeight));
          }
          ctx.fill();

          x += barWidth;
        }
      }

      draw();
    } catch (e) {
      console.error("Audio visualizer failed:", e);
    }

    return cleanup;
  }, [isRecording, stream]);

  return (
    <canvas 
      ref={canvasRef} 
      width={120} 
      height={32} 
      className={`${isRecording ? 'block' : 'hidden'} mr-3 h-8 w-28`}
    />
  );
}
