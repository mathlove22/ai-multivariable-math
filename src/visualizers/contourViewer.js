// 고정밀 2D 등고선, 그래디언트 벡터, 단면 절단선, 360도 나침반 및 하산 궤적 캔버스 뷰어

export class ContourViewer {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');

    this.xMin = -0.5;
    this.xMax = 2.5;
    this.yMin = -1;
    this.yMax = 5;

    this.fn = (x, y) => x * x + y * y;
    this.gradFn = (x, y) => ({ gx: 2 * x, gy: 2 * y });

    this.currentPoint = { x: 0, y: 0 };
    this.targetPoint = null; // 최적점
    this.compassAngle = 0;   // 라디안
    this.showCompass = false;
    this.showGradient = true;
    this.showDescent = true;
    this.showOrthogonal = false;
    this.sliceLine = null;   // { axis: 'x' | 'y', val: number, label: string }
    this.trajectory = [];

    this.onPointChange = null; // 외부 콜백 (드래그 시)
    this.isDragging = false;

    this.width = 400;
    this.height = 300;

    this.initEvents();
    this.resize();
  }

  resize() {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.width = Math.max(280, rect.width || 400);
    this.height = Math.max(200, rect.height || 300);

    this.canvas.width = Math.round(this.width * dpr);
    this.canvas.height = Math.round(this.height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // scale 누적 방지
    this.draw();
  }

  setBounds(bounds) {
    this.xMin = bounds.xMin;
    this.xMax = bounds.xMax;
    this.yMin = bounds.yMin;
    this.yMax = bounds.yMax;
    this.draw();
  }

  setFunctions(fn, gradFn) {
    this.fn = fn;
    this.gradFn = gradFn;
    this.draw();
  }

  setCurrentPoint(x, y) {
    this.currentPoint = { x, y };
    this.draw();
  }

  setTargetPoint(x, y) {
    this.targetPoint = (x !== null && y !== null) ? { x, y } : null;
    this.draw();
  }

  setTrajectory(points) {
    this.trajectory = points || [];
    this.draw();
  }

  setCompass(angleRad, show = true) {
    this.compassAngle = angleRad;
    this.showCompass = show;
    this.draw();
  }

  setSliceLine(sliceInfo) {
    // sliceInfo: { axis: 'x' | 'y', val: number, label: string } or null
    this.sliceLine = sliceInfo;
    this.draw();
  }

  // 좌표 변환: 수학 좌표 (x, y) -> 캔버스 픽셀 (px, py)
  toPixel(x, y) {
    const px = ((x - this.xMin) / (this.xMax - this.xMin)) * this.width;
    const py = ((this.yMax - y) / (this.yMax - this.yMin)) * this.height;
    return { px, py };
  }

  // 역변환: 캔버스 픽셀 -> 수학 좌표
  toMath(px, py) {
    const x = this.xMin + (px / this.width) * (this.xMax - this.xMin);
    const y = this.yMax - (py / this.height) * (this.yMax - this.yMin);
    return { x, y };
  }

  initEvents() {
    const getPos = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const px = (clientX - rect.left) * (this.width / rect.width);
      const py = (clientY - rect.top) * (this.height / rect.height);
      return this.toMath(px, py);
    };

    const handleStart = (e) => {
      this.isDragging = true;
      const m = getPos(e);
      m.x = Math.max(this.xMin, Math.min(this.xMax, m.x));
      m.y = Math.max(this.yMin, Math.min(this.yMax, m.y));
      this.currentPoint = m;
      if (this.onPointChange) this.onPointChange(m.x, m.y);
      this.draw();
    };

    const handleMove = (e) => {
      if (!this.isDragging) return;
      const m = getPos(e);
      m.x = Math.max(this.xMin, Math.min(this.xMax, m.x));
      m.y = Math.max(this.yMin, Math.min(this.yMax, m.y));
      this.currentPoint = m;
      if (this.onPointChange) this.onPointChange(m.x, m.y);
      this.draw();
    };

    const handleEnd = () => {
      this.isDragging = false;
    };

    this.canvas.addEventListener('mousedown', handleStart);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);

    this.canvas.addEventListener('touchstart', handleStart, { passive: true });
    window.addEventListener('touchmove', handleMove, { passive: true });
    window.addEventListener('touchend', handleEnd);

    window.addEventListener('resize', () => this.resize());
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // 1. 배경
    ctx.fillStyle = '#080d1a';
    ctx.fillRect(0, 0, this.width, this.height);

    // 2. 축 & 격자 그리기
    this.drawGrid();

    // 3. 등고선 그리기
    this.drawContours();

    // 4. 단면 절단선 그리기 (02 편미분 자르기용)
    if (this.sliceLine) {
      this.drawSliceLine();
    }

    // 5. 최적점 마커
    if (this.targetPoint) {
      this.drawTargetMarker(this.targetPoint.x, this.targetPoint.y);
    }

    // 6. 경사하강법 궤적 선
    if (this.trajectory && this.trajectory.length > 0) {
      this.drawTrajectory();
    }

    // 7. 현재 점 & 벡터들
    if (this.currentPoint) {
      this.drawCurrentPointAndVectors();
    }
  }

  drawGrid() {
    const ctx = this.ctx;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;

    // 수직선
    const xSpan = this.xMax - this.xMin;
    const xStep = xSpan > 6 ? 1 : 0.5;
    const xStart = Math.ceil(this.xMin / xStep) * xStep;
    for (let x = xStart; x <= this.xMax; x += xStep) {
      const { px } = this.toPixel(x, 0);
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px, this.height);
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.fillText(x.toFixed(xStep < 1 ? 1 : 0), px + 3, this.height - 5);
    }

    // 수평선
    const ySpan = this.yMax - this.yMin;
    const yStep = ySpan > 6 ? 1 : 0.5;
    const yStart = Math.ceil(this.yMin / yStep) * yStep;
    for (let y = yStart; y <= this.yMax; y += yStep) {
      const { py } = this.toPixel(0, y);
      ctx.beginPath();
      ctx.moveTo(0, py);
      ctx.lineTo(this.width, py);
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.fillText(y.toFixed(yStep < 1 ? 1 : 0), 4, py - 3);
    }

    // 0축 강조선
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1.5;
    const { px: zeroX } = this.toPixel(0, 0);
    const { py: zeroY } = this.toPixel(0, 0);

    if (zeroX >= 0 && zeroX <= this.width) {
      ctx.beginPath();
      ctx.moveTo(zeroX, 0);
      ctx.lineTo(zeroX, this.height);
      ctx.stroke();
    }
    if (zeroY >= 0 && zeroY <= this.height) {
      ctx.beginPath();
      ctx.moveTo(0, zeroY);
      ctx.lineTo(this.width, zeroY);
      ctx.stroke();
    }
  }

  // 02 편미분 자르기용 절단선 렌더링
  drawSliceLine() {
    const ctx = this.ctx;
    const { axis, val, label } = this.sliceLine;

    ctx.save();
    ctx.setLineDash([6, 4]);

    if (axis === 'y') {
      // y = val 고정 수평선 (x 방향 미분)
      const { py } = this.toPixel(0, val);
      ctx.strokeStyle = '#06b6d4'; // Cyan
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, py);
      ctx.lineTo(this.width, py);
      ctx.stroke();

      // 라벨
      ctx.setLineDash([]);
      ctx.fillStyle = '#06b6d4';
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.fillText(label || `y = ${val.toFixed(2)} 고정 절단선`, 10, py - 6);
    } else {
      // x = val 고정 수직선 (y 방향 미분)
      const { px } = this.toPixel(val, 0);
      ctx.strokeStyle = '#ec4899'; // Pink
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px, this.height);
      ctx.stroke();

      // 라벨
      ctx.setLineDash([]);
      ctx.fillStyle = '#ec4899';
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.fillText(label || `x = ${val.toFixed(2)} 고정 절단선`, px + 6, 18);
    }
    ctx.restore();
  }

  // 고정밀 등고선(Contour lines) 렌더링
  drawContours() {
    const ctx = this.ctx;
    const resX = 80;
    const resY = 70;
    const grid = [];
    let minVal = Infinity;
    let maxVal = -Infinity;

    for (let i = 0; i <= resY; i++) {
      grid[i] = [];
      const y = this.yMax - (i / resY) * (this.yMax - this.yMin);
      for (let j = 0; j <= resX; j++) {
        const x = this.xMin + (j / resX) * (this.xMax - this.xMin);
        const v = this.fn(x, y);
        grid[i][j] = v;
        if (v < minVal) minVal = v;
        if (v > maxVal) maxVal = v;
      }
    }

    if (!isFinite(minVal) || !isFinite(maxVal)) return;

    // 등고선 레벨 결정: 최솟값 근처를 촘촘히 잡음
    const levels = [];
    const count = 12;
    for (let k = 1; k <= count; k++) {
      // 거듭제곱 분포로 중심부 등고선을 촘촘하게
      const t = Math.pow(k / count, 1.8);
      levels.push(minVal + t * (maxVal - minVal));
    }

    // 현재 위치의 등고선도 반드시 추가
    let curZ = null;
    if (this.currentPoint) {
      curZ = this.fn(this.currentPoint.x, this.currentPoint.y);
      if (isFinite(curZ)) {
        levels.push(curZ);
      }
    }

    const dx = this.width / resX;
    const dy = this.height / resY;

    const interp = (v1, v2, lvl) => {
      if (Math.abs(v1 - v2) < 1e-7) return 0.5;
      return Math.max(0, Math.min(1, (lvl - v1) / (v2 - v1)));
    };

    levels.forEach((lvl) => {
      const isCurrentLevel = curZ !== null && Math.abs(lvl - curZ) < 1e-5;

      ctx.strokeStyle = isCurrentLevel ? '#38bdf8' : 'rgba(99, 102, 241, 0.45)';
      ctx.lineWidth = isCurrentLevel ? 2.5 : 1.2;
      ctx.beginPath();

      for (let i = 0; i < resY; i++) {
        for (let j = 0; j < resX; j++) {
          const vTL = grid[i][j];
          const vTR = grid[i][j + 1];
          const vBR = grid[i + 1][j + 1];
          const vBL = grid[i + 1][j];

          let cellIndex = 0;
          if (vTL >= lvl) cellIndex |= 8;
          if (vTR >= lvl) cellIndex |= 4;
          if (vBR >= lvl) cellIndex |= 2;
          if (vBL >= lvl) cellIndex |= 1;

          if (cellIndex === 0 || cellIndex === 15) continue;

          const top = { x: (j + interp(vTL, vTR, lvl)) * dx, y: i * dy };
          const right = { x: (j + 1) * dx, y: (i + interp(vTR, vBR, lvl)) * dy };
          const bottom = { x: (j + interp(vBL, vBR, lvl)) * dx, y: (i + 1) * dy };
          const left = { x: j * dx, y: (i + interp(vTL, vBL, lvl)) * dy };

          const drawLine = (p1, p2) => {
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
          };

          switch (cellIndex) {
            case 1: case 14: drawLine(left, bottom); break;
            case 2: case 13: drawLine(bottom, right); break;
            case 3: case 12: drawLine(left, right); break;
            case 4: case 11: drawLine(top, right); break;
            case 5: drawLine(left, top); drawLine(bottom, right); break;
            case 6: case 9: drawLine(top, bottom); break;
            case 7: case 8: drawLine(left, top); break;
            case 10: drawLine(top, right); drawLine(left, bottom); break;
          }
        }
      }
      ctx.stroke();
    });
  }

  drawTargetMarker(x, y) {
    const ctx = this.ctx;
    const { px, py } = this.toPixel(x, y);

    ctx.save();
    ctx.strokeStyle = '#f59e0b';
    ctx.fillStyle = '#fbbf24';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.arc(px, py, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.fillText(`최적점 (${x.toFixed(1)}, ${y.toFixed(1)})`, px + 8, py + 4);
    ctx.restore();
  }

  drawTrajectory() {
    const ctx = this.ctx;
    if (this.trajectory.length < 1) return;

    ctx.save();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;
    ctx.beginPath();

    this.trajectory.forEach((pt, idx) => {
      const { px, py } = this.toPixel(pt.a, pt.b);
      if (idx === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    });
    ctx.stroke();

    this.trajectory.forEach((pt, idx) => {
      const { px, py } = this.toPixel(pt.a, pt.b);
      ctx.beginPath();
      ctx.arc(px, py, idx === 0 ? 5 : 3.5, 0, Math.PI * 2);
      ctx.fillStyle = idx === 0 ? '#f59e0b' : idx === this.trajectory.length - 1 ? '#ef4444' : '#10b981';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();
    });
    ctx.restore();
  }

  drawCurrentPointAndVectors() {
    const ctx = this.ctx;
    const { x, y } = this.currentPoint;
    const { px, py } = this.toPixel(x, y);
    const grad = this.gradFn(x, y);

    const norm = Math.hypot(grad.gx, grad.gy);
    const arrowLen = Math.min(80, Math.max(35, norm * 4));

    // 1. 나침반 회전 모드인 경우
    if (this.showCompass) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.arc(px, py, 60, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      const uX = Math.cos(this.compassAngle);
      const uY = Math.sin(this.compassAngle);
      const endUX = px + uX * 60;
      const endUY = py - uY * 60; // 캔버스 y축 반전

      this.drawArrow(px, py, endUX, endUY, '#a855f7', 3, 'u (진행방향)');

      if (this.showOrthogonal && norm > 0.01) {
        const thetaGrad = Math.atan2(grad.gy, grad.gx);
        const tanAngle = thetaGrad + Math.PI / 2;
        const tanLen = 50;
        const tx1 = px + Math.cos(tanAngle) * tanLen;
        const ty1 = py - Math.sin(tanAngle) * tanLen;
        const tx2 = px - Math.cos(tanAngle) * tanLen;
        const ty2 = py + Math.sin(tanAngle) * tanLen;

        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(tx1, ty1);
        ctx.lineTo(tx2, ty2);
        ctx.stroke();

        const s = 12;
        const gX = Math.cos(thetaGrad);
        const gY = Math.sin(thetaGrad);
        const tX = Math.cos(tanAngle);
        const tY = Math.sin(tanAngle);

        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(px + gX * s, py - gY * s);
        ctx.lineTo(px + (gX + tX) * s, py - (gY + tY) * s);
        ctx.lineTo(px + tX * s, py - tY * s);
        ctx.stroke();

        ctx.fillStyle = '#facc15';
        ctx.font = '10px Inter, sans-serif';
        ctx.fillText('90° 수직', px + (gX + tX) * s + 5, py - (gY + tY) * s);
      }
    }

    // 2. 그래디언트 벡터 ∇f 화살표 (오르막: 빨강)
    if (this.showGradient && norm > 0.01) {
      const gX = (grad.gx / norm) * arrowLen;
      const gY = (grad.gy / norm) * arrowLen;
      this.drawArrow(px, py, px + gX, py - gY, '#f43f5e', 3, '∇f (오르막)');
    }

    // 3. 최급강하 벡터 -∇f 화살표 (내리막: 녹색/청록)
    if (this.showDescent && norm > 0.01) {
      const dX = (-grad.gx / norm) * arrowLen;
      const dY = (-grad.gy / norm) * arrowLen;
      this.drawArrow(px, py, px + dX, py - dY, '#10b981', 3.5, '-∇f (최급내리막)');
    }

    // 4. 현재 위치 점 표시
    ctx.beginPath();
    ctx.arc(px, py, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#38bdf8';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(px, py, 11, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 현재 위치 좌표 텍스트
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px JetBrains Mono, monospace';
    ctx.fillText(`(${x.toFixed(2)}, ${y.toFixed(2)})`, px + 12, py - 8);
  }

  drawArrow(fromX, fromY, toX, toY, color, width, label) {
    const ctx = this.ctx;
    const headLen = 10;
    const angle = Math.atan2(toY - fromY, toX - fromX);

    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = width;

    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(
      toX - headLen * Math.cos(angle - Math.PI / 6),
      toY - headLen * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      toX - headLen * Math.cos(angle + Math.PI / 6),
      toY - headLen * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fill();

    if (label) {
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.fillStyle = color;
      ctx.fillText(label, toX + 6, toY - 6);
    }
    ctx.restore();
  }
}
