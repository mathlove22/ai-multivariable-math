import { ParametricSurface } from '../utils/math.js';
import { playClickSound } from '../utils/sound.js';
import { renderMath } from '../utils/latex.js';

export function renderModule6(container, { threeViewer, contourViewer }) {
  let paramK = 1.0;

  container.innerHTML = `
    <div class="pedagogy-panel">
      <!-- 1. 말안장 감자칩 이야기 -->
      <div class="concept-card">
        <div class="card-header">
          <div class="card-title-group">
            <span class="card-icon">🥔</span>
            <span class="card-title">감자칩 실험실: 극소 · 극대 · 안장점</span>
          </div>
          <span class="card-tag tag-story">Story & Mystery</span>
        </div>

        <div class="story-box">
          <strong>"기울기가 0인 세 곳, 운명은 왜 다를까?"</strong><br>
          하산을 마친 지호는 매점에서 말안장 모양으로 휘어진 감자칩(프링글스)을 집어 들었습니다.<br>
          <em>"앞뒤 방향으로는 가운데가 푹 꺼져 있는데, 좌우 방향으로는 불룩 솟아 있네? 같은 점인데 방향에 따라 골짜기이기도 하고 언덕이기도 하잖아!"</em><br><br>
          그릇의 바닥, 언덕의 꼭대기, 말안장의 한가운데 ― <strong>세 곳 모두 기울기(그래디언트)는 0입니다.</strong> 
          그런데 왜 최솟값은 그릇 바닥뿐일까요?
        </div>

        <div class="math-box highlight">
          행렬식 판별법: $H = \\begin{pmatrix} p & q \\\\[4pt] q & r \\end{pmatrix}$ 일 때, $\\det H = pr - q^2$<br><br>
          ① $\\det H > 0$ 이고 $p > 0$ $\\rightarrow$ <strong>아래로 볼록 (극소, 그릇 바닥)</strong><br>
          ② $\\det H > 0$ 이고 $p < 0$ $\\rightarrow$ <strong>위로 볼록 (극대, 언덕 꼭대기)</strong><br>
          ③ $\\det H < 0$ $\\rightarrow$ <strong>안장점 (말안장 감자칩, Saddle Point)</strong><br>
          ④ $\\det H = 0$ $\\rightarrow$ 판별 불가 (경계, 바닥이 평평한 홈통)
        </div>
      </div>

      <!-- 2. 교재 탐구활동: k 슬라이더 지형 변신 실험실 -->
      <div class="concept-card">
        <div class="card-header">
          <div class="card-title-group">
            <span class="card-icon">🎛️</span>
            <span class="card-title">교재 탐구 활동: $z = x^2 + kxy + y^2$ 지형 변신</span>
          </div>
          <span class="card-tag tag-lab">Interactive Morph</span>
        </div>

        <p style="color: var(--text-muted); font-size: 0.88rem;">
          슬라이더로 $k$ 값을 바꾸며 3D 곡면이 <strong>그릇 $\\rightarrow$ 홈통 $\\rightarrow$ 말안장</strong>으로 변신하는 모습을 실시간으로 관찰해 보세요!
        </p>

        <!-- k 슬라이더 -->
        <div class="control-row">
          <div class="control-label-group">
            <span>얽힘 계수 ($k$)</span>
            <span class="control-value" id="val-k">${paramK.toFixed(1)}</span>
          </div>
          <input type="range" id="slider-k" class="custom-slider" min="0" max="3" step="0.1" value="${paramK}">
        </div>

        <div class="btn-group">
          <button id="btn-k-0" class="btn-secondary">k = 0 (둥근 그릇)</button>
          <button id="btn-k-1" class="btn-secondary">k = 1 (타원 그릇)</button>
          <button id="btn-k-2" class="btn-primary" style="background: rgba(245, 158, 11, 0.2); border-color: #f59e0b; color: #fbbf24;">
            k = 2 (홈통 경계, det=0)
          </button>
          <button id="btn-k-3" class="btn-primary" style="background: rgba(236, 72, 153, 0.2); border-color: #ec4899; color: #f472b6;">
            k = 3 (말안장 감자칩, det < 0)
          </button>
        </div>

        <!-- 실시간 판정 대시보드 -->
        <div class="math-box highlight" id="saddle-result-box">
          <!-- 동적 주입 -->
        </div>

        <div class="insight-box">
          <span class="insight-icon">🧠</span>
          <div>
            <strong>현대 인공지능(AI)의 거대한 난제: 안장점 문제</strong><br>
            • 변수가 수억 개에 달하는 <strong>심층 신경망(Deep Learning)</strong>의 손실 지형에는 극소점보다 
            <strong>안장점(Saddle Point)이 압도적으로 많다</strong>는 사실이 규명되었습니다 (Dauphin et al., NIPS 2014).<br>
            • 안장점 근처에서는 그래디언트가 $0$에 가까워지기 때문에, AI는 최솟값을 찾았다고 착각하여 
            <strong>학습이 멈칫거리며 발이 묶이는 현상</strong>이 발생합니다! 현대 최적화 알고리즘(Adam, Momentum 등)은 이 안장점을 탈출하기 위해 고안되었습니다.
          </div>
        </div>
      </div>
    </div>
  `;

  renderMath(container);

  function update() {
    const valKEl = container.querySelector('#val-k');
    const resBox = container.querySelector('#saddle-result-box');

    if (valKEl) valKEl.textContent = paramK.toFixed(1);

    const info = ParametricSurface.hessian(paramK);
    const fn = (x, y) => ParametricSurface.f(x, y, paramK);
    const gradFn = (x, y) => ParametricSurface.gradient(x, y, paramK);

    let badgeColor = '#38bdf8';
    if (info.typeCode === 'min') badgeColor = '#34d399';
    else if (info.typeCode === 'saddle') badgeColor = '#f472b6';
    else if (info.typeCode === 'degenerate') badgeColor = '#fbbf24';

    resBox.innerHTML = `
      <div style="font-size: 0.9rem; color: #94a3b8; margin-bottom: 0.4rem;">
        현재 헤시안 행렬: $H = \\begin{pmatrix} 2 & ${paramK.toFixed(1)} \\\\[4pt] ${paramK.toFixed(1)} & 2 \\end{pmatrix}$, 
        행렬식 $\\det H = 2 \\times 2 - (${paramK.toFixed(1)})^2 = \\mathbf{${info.det.toFixed(2)}}$
      </div>
      <div style="font-size: 1.15rem; font-weight: 700; color: ${badgeColor}; margin-top: 0.4rem;">
        지형 판별 결과: ${info.type}
      </div>
      <div style="font-size: 0.85rem; color: #cbd5e1; margin-top: 0.4rem;">
        ${
          info.typeCode === 'min'
            ? '대각 곱($4$)이 얽힘($k^2$)을 이겨 곡면이 사방으로 오목하게 파인 안정적인 그릇입니다.'
            : info.typeCode === 'degenerate'
            ? '경계 상태! $z = (x+y)^2$이 되어 직선 $y = -x$ 위의 모든 점이 바닥인 홈통(Trough) 모양입니다.'
            : '얽힘($k^2$)이 대각 곱($4$)을 압도하여, 한쪽 방향($y=-x$)으로는 아래로 푹 꺼지고 다른 쪽($y=x$)으로는 위로 솟는 말안장 감자칩입니다!'
        }
      </div>
    `;

    renderMath(resBox);

    // 3D 뷰어 동기화
    threeViewer.setSurface(fn, { xMin: -2.5, xMax: 2.5, yMin: -2.5, yMax: 2.5 }, 0.15);
    threeViewer.clearSlice();
    threeViewer.clearArrows();
    threeViewer.setCurrentPoint(0, 0, true);

    // 2D 캔버스 동기화
    contourViewer.setBounds({ xMin: -2.5, xMax: 2.5, yMin: -2.5, yMax: 2.5 });
    contourViewer.setFunctions(fn, gradFn);
    contourViewer.setTargetPoint(0, 0);
    contourViewer.setSliceLine(null);
    contourViewer.setCurrentPoint(0, 0);
    contourViewer.showCompass = false;
  }

  // Event Listeners
  const sliderK = container.querySelector('#slider-k');
  const btnK0 = container.querySelector('#btn-k-0');
  const btnK1 = container.querySelector('#btn-k-1');
  const btnK2 = container.querySelector('#btn-k-2');
  const btnK3 = container.querySelector('#btn-k-3');

  sliderK.addEventListener('input', (e) => {
    paramK = parseFloat(e.target.value);
    playClickSound();
    update();
  });

  btnK0.addEventListener('click', () => {
    paramK = 0;
    sliderK.value = paramK;
    playClickSound();
    update();
  });

  btnK1.addEventListener('click', () => {
    paramK = 1.0;
    sliderK.value = paramK;
    playClickSound();
    update();
  });

  btnK2.addEventListener('click', () => {
    paramK = 2.0;
    sliderK.value = paramK;
    playClickSound();
    update();
  });

  btnK3.addEventListener('click', () => {
    paramK = 3.0;
    sliderK.value = paramK;
    playClickSound();
    update();
  });

  update();
}
