import { ExampleFunction, calcDirectionalDerivative } from '../utils/math.js';
import { playClickSound } from '../utils/sound.js';
import { renderMath } from '../utils/latex.js';

export function renderModule3(container, { threeViewer, contourViewer }) {
  let compassDeg = 45; // 0 ~ 360도
  let curX = 1.0;
  let curY = 1.0;

  container.innerHTML = `
    <div class="pedagogy-panel">
      <!-- 1. 그래디언트 벡터의 탄생 -->
      <div class="concept-card">
        <div class="card-header">
          <div class="card-title-group">
            <span class="card-icon">🧭</span>
            <span class="card-title">그래디언트 벡터와 가장 가파른 방향</span>
          </div>
          <span class="card-tag tag-math">Gradient Vector</span>
        </div>

        <div class="story-box">
          <strong>"동서 기울기와 남북 기울기를 묶으면 무슨 일이 일어날까?"</strong><br>
          지호는 동쪽 기울기($\\frac{\\partial f}{\\partial x}$)와 북쪽 기울기($\\frac{\\partial f}{\\partial y}$) 두 수를 손에 넣었습니다.<br>
          이 두 수를 하나의 화살표(벡터)로 묶는 순간, 놀랍게도 <strong>'가장 가파르게 올라가는 방향'</strong>이 저절로 나옵니다!
        </div>

        <div class="math-box highlight">
          $$\\nabla f = \\left( \\frac{\\partial f}{\\partial x}, \\, \\frac{\\partial f}{\\partial y} \\right)$$
          <div style="font-size: 0.88rem; color: #a5b4fc; margin-top: 0.4rem;">
            벡터의 크기: $|\\nabla f| = \\sqrt{\\left(\\frac{\\partial f}{\\partial x}\\right)^2 + \\left(\\frac{\\partial f}{\\partial y}\\right)^2}$ (그 점에서 곡면의 최대 경사도)
          </div>
        </div>
      </div>

      <!-- 2. 360도 나침반 & 방향도함수 탐구 -->
      <div class="concept-card">
        <div class="card-header">
          <div class="card-title-group">
            <span class="card-icon">🎯</span>
            <span class="card-title">360° 나침반 실험: 방향도함수 ($D_u f$)</span>
          </div>
          <span class="card-tag tag-lab">Interactive Compass</span>
        </div>

        <p style="color: var(--text-muted); font-size: 0.88rem;">
          임의의 방향 단위벡터 $u = (\\cos\\theta, \\sin\\theta)$로 걸을 때의 경사는 
          두 편미분의 내적으로 계산됩니다: $D_u f = \\nabla f \\cdot u = |\\nabla f| \\cos\\theta$.
        </p>

        <!-- 나침반 각도 슬라이더 -->
        <div class="control-row">
          <div class="control-label-group">
            <span>진행 방향 각도 ($\\theta$)</span>
            <span class="control-value" id="val-compass-deg">${compassDeg}°</span>
          </div>
          <input type="range" id="slider-compass-deg" class="custom-slider" min="0" max="360" step="1" value="${compassDeg}">
        </div>

        <div class="btn-group">
          <button id="btn-snap-grad" class="btn-primary" style="background: rgba(244, 63, 94, 0.2); border-color: #f43f5e; color: #fda4af;">
            🚀 최대 오르막 ($\\nabla f$ 방향)
          </button>
          <button id="btn-snap-descent" class="btn-primary" style="background: rgba(16, 185, 129, 0.2); border-color: #10b981; color: #6ee7b7;">
            ⛷️ 최대 내리막 ($-\\nabla f$ 방향)
          </button>
          <button id="btn-snap-contour" class="btn-secondary">
            ⛰️ 등고선 걷기 (기울기 = 0)
          </button>
        </div>

        <!-- 실시간 방향도함수 측정 대시보드 -->
        <div class="math-box highlight" id="compass-calc-box">
          <!-- 계산식 주입 -->
        </div>

        <!-- 교재 표 Ⅲ-2 재현 -->
        <div class="data-table-wrapper">
          <table class="data-table" id="direction-table">
            <thead>
              <tr>
                <th>방향 $u$</th>
                <th>성분 $(u_1, u_2)$</th>
                <th>방향도함수 $D_u f$</th>
                <th>비고</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>동쪽 ($x$축)</td>
                <td>$(1.0, 0.0)$</td>
                <td>$5.00$</td>
                <td>편미분 $\\frac{\\partial f}{\\partial x}$</td>
              </tr>
              <tr>
                <td>북쪽 ($y$축)</td>
                <td>$(0.0, 1.0)$</td>
                <td>$7.00$</td>
                <td>편미분 $\\frac{\\partial f}{\\partial y}$</td>
              </tr>
              <tr>
                <td>대각선</td>
                <td>$(0.6, 0.8)$</td>
                <td>$8.60$</td>
                <td>$5(0.6) + 7(0.8)$</td>
              </tr>
              <tr class="highlight-row">
                <td>$\\nabla f$ 방향</td>
                <td>$(0.58, 0.81)$</td>
                <td>$8.602$</td>
                <td><strong>이론상 최대값 $(\\sqrt{74})$!</strong></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="insight-box">
          <span class="insight-icon">⭐</span>
          <div>
            <strong>핵심 정리 ― 그래디언트의 세 가지 얼굴:</strong><br>
            ① $\\nabla f$는 함숫값이 <strong>가장 빨리 증가하는 방향(최급 오르막)</strong>을 가리킨다.<br>
            ② $-\\nabla f$는 함숫값이 <strong>가장 빨리 감소하는 방향(최급 내리막)</strong>이다! AI는 바로 이 반대 방향으로 내려갑니다.<br>
            ③ $\\nabla f$는 <strong>그 점을 지나는 등고선과 항상 수직(90도)</strong>이다! (등고선을 따라 걸으면 높이 변화가 0이므로, 가장 가파른 방향은 등고선을 직각으로 가로질러야 합니다.)
          </div>
        </div>
      </div>
    </div>
  `;

  renderMath(container);

  function update() {
    const rad = (compassDeg * Math.PI) / 180;
    const gx = ExampleFunction.df_dx(curX, curY); // at (1, 1) -> 5
    const gy = ExampleFunction.df_dy(curX, curY); // at (1, 1) -> 7
    const result = calcDirectionalDerivative(gx, gy, rad);

    const valDegEl = container.querySelector('#val-compass-deg');
    const calcBox = container.querySelector('#compass-calc-box');

    if (valDegEl) valDegEl.textContent = `${compassDeg}°`;

    calcBox.innerHTML = `
      <div style="font-size: 0.9rem; color: #94a3b8; margin-bottom: 0.4rem;">
        현재 점 $(1, 1)$에서 $\\nabla f = (${gx.toFixed(1)}, ${gy.toFixed(1)})$, 크기 $|\\nabla f| = ${result.gradNorm.toFixed(3)}$ (약 $\\sqrt{74}$)
      </div>
      <div style="display: flex; justify-content: space-around; font-size: 1.05rem; font-weight: 700; margin: 0.5rem 0;">
        <span style="color: #a855f7;">진행 방향 $u = (${result.u1.toFixed(2)}, ${result.u2.toFixed(2)})$</span>
        <span style="color: ${result.slope >= 0 ? '#f43f5e' : '#10b981'};">방향도함수 $D_u f = ${result.slope.toFixed(3)}$</span>
      </div>
      <div style="font-size: 0.85rem; color: #38bdf8;">
        내적 계산: $5 \\times (${result.u1.toFixed(2)}) + 7 \\times (${result.u2.toFixed(2)}) = ${result.slope.toFixed(3)}$ 
        (최대치 $|\\nabla f| \\times \\cos\\theta = ${result.gradNorm.toFixed(2)} \\times ${result.cosTheta.toFixed(2)}$)
      </div>
    `;

    renderMath(calcBox);

    // 3D 뷰어 동기화
    threeViewer.setSurface((x, y) => ExampleFunction.f(x, y), { xMin: -1, xMax: 3, yMin: -1, yMax: 3 }, 0.08);
    threeViewer.clearSlice();
    threeViewer.setTrajectory([]);
    threeViewer.setCurrentPoint(curX, curY, true);
    threeViewer.showGradientArrows(curX, curY, gx, gy);

    // 2D 캔버스 동기화
    contourViewer.setBounds({ xMin: -1, xMax: 3, yMin: -1, yMax: 3 });
    contourViewer.setFunctions(
      (x, y) => ExampleFunction.f(x, y),
      (x, y) => ({ gx: ExampleFunction.df_dx(x, y), gy: ExampleFunction.df_dy(x, y) })
    );
    contourViewer.setTargetPoint(null, null);
    contourViewer.setSliceLine(null);
    contourViewer.setCurrentPoint(curX, curY);
    contourViewer.showOrthogonal = true;
    contourViewer.setCompass(rad, true);
  }

  // Event Listeners
  const sliderDeg = container.querySelector('#slider-compass-deg');
  const btnGrad = container.querySelector('#btn-snap-grad');
  const btnDescent = container.querySelector('#btn-snap-descent');
  const btnContour = container.querySelector('#btn-snap-contour');

  sliderDeg.addEventListener('input', (e) => {
    compassDeg = parseInt(e.target.value, 10);
    playClickSound();
    update();
  });

  btnGrad.addEventListener('click', () => {
    const deg = Math.round((Math.atan2(7, 5) * 180) / Math.PI);
    compassDeg = (deg + 360) % 360;
    sliderDeg.value = compassDeg;
    playClickSound();
    update();
  });

  btnDescent.addEventListener('click', () => {
    const deg = Math.round((Math.atan2(-7, -5) * 180) / Math.PI);
    compassDeg = (deg + 360) % 360;
    sliderDeg.value = compassDeg;
    playClickSound();
    update();
  });

  btnContour.addEventListener('click', () => {
    const deg = Math.round((Math.atan2(7, 5) * 180) / Math.PI) + 90;
    compassDeg = (deg + 360) % 360;
    sliderDeg.value = compassDeg;
    playClickSound();
    update();
  });

  update();
}
