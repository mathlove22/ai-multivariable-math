import { Model1D, Model2D } from '../utils/math.js';
import { playClickSound } from '../utils/sound.js';
import { renderMath } from '../utils/latex.js';

export function renderModule0(container, { threeViewer, contourViewer }) {
  let paramA = 1.0;
  let paramB = 1.0;
  let showIntercept = true;

  container.innerHTML = `
    <div class="pedagogy-panel">
      <!-- 1. 생각 열기 -->
      <div class="concept-card">
        <div class="card-header">
          <div class="card-title-group">
            <span class="card-icon">🚀</span>
            <span class="card-title">선수 학습: 1차원에서 2차원으로의 필연적 도약</span>
          </div>
          <span class="card-tag tag-story">Story & Prep</span>
        </div>

        <div class="story-box">
          <strong>"왜 변수를 1개에서 2개로 늘려야 할까요?"</strong><br>
          고등학교 수학에서 직선은 보통 $y = ax$ 또는 $y = ax + b$로 배웁니다.<br>
          인공지능 모델이 데이터 점들을 학습할 때, 원점을 지나는 직선 $y = ax$만으로는 현실의 데이터를 제대로 설명할 수 없습니다!
        </div>

        <p style="color: var(--text-muted); font-size: 0.9rem; margin-top: 0.5rem;">
          아래는 공부 시간($x$)에 따른 수행 점수($y$)를 기록한 5개의 실제 데이터 점입니다.
        </p>

        <!-- 데이터 표 -->
        <div class="data-table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>학생</th>
                <th>1</th>
                <th>2</th>
                <th>3</th>
                <th>4</th>
                <th>5</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>공부 시간 ($x$)</td>
                <td>1</td>
                <td>2</td>
                <td>3</td>
                <td>4</td>
                <td>5</td>
              </tr>
              <tr>
                <td>수행 점수 ($y$)</td>
                <td>2</td>
                <td>4</td>
                <td>5</td>
                <td>4</td>
                <td>5</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 2. 단변수 모델의 한계 vs 절편의 자유 -->
      <div class="concept-card">
        <div class="card-header">
          <div class="card-title-group">
            <span class="card-icon">⚖️</span>
            <span class="card-title">직선 맞추기: 원점 고정 vs 절편 자유도</span>
          </div>
          <span class="card-tag tag-math">Math & Loss</span>
        </div>

        <div class="btn-group">
          <button id="btn-model-1d" class="btn-secondary ${!showIntercept ? 'active' : ''}">
            ① 원점 고정: $y = ax$ (매개변수 1개)
          </button>
          <button id="btn-model-2d" class="btn-primary ${showIntercept ? 'active' : ''}">
            ② 절편 포함: $y = ax + b$ (매개변수 2개)
          </button>
        </div>

        <!-- 슬라이더 컨트롤 -->
        <div class="control-row">
          <div class="control-label-group">
            <span>기울기 매개변수 ($a$)</span>
            <span class="control-value" id="val-param-a">${paramA.toFixed(2)}</span>
          </div>
          <input type="range" id="slider-param-a" class="custom-slider" min="0" max="2.5" step="0.05" value="${paramA}">
        </div>

        <div class="control-row" id="row-param-b" style="display: ${showIntercept ? 'flex' : 'none'};">
          <div class="control-label-group">
            <span>y절편 매개변수 ($b$)</span>
            <span class="control-value" id="val-param-b">${paramB.toFixed(2)}</span>
          </div>
          <input type="range" id="slider-param-b" class="custom-slider" min="-1" max="4" step="0.05" value="${paramB}">
        </div>

        <!-- 손실 수식 및 실시간 값 -->
        <div class="math-box highlight" id="loss-display-box">
          <!-- 동적 주입 -->
        </div>

        <div class="insight-box">
          <span class="insight-icon">💡</span>
          <div>
            <strong>핵심 발견:</strong><br>
            • 원점 고정 $y = ax$ 모델의 이론상 최선의 손실은 <strong>$L = 1.36$</strong> ($a = 1.2$일 때)<br>
            • 절편 $b$라는 자유를 주어 $y = ax + b$로 확장하면 최적 손실이 <strong>$L = 0.48$</strong> ($a=0.6, b=2.2$)로 <strong>3분의 1 수준으로 격감!</strong><br>
            • <em>하지만 대가가 따릅니다!</em> 조절해야 할 매개변수가 $a, b$ 2개가 되면서 손실함수 $L(a, b)$는 1차원 곡선이 아닌 <strong>3차원 곡면 지형</strong>이 됩니다!
          </div>
        </div>
      </div>
    </div>
  `;

  // 수식 및 3D 뷰어 갱신
  function update() {
    const valAEl = container.querySelector('#val-param-a');
    const valBEl = container.querySelector('#val-param-b');
    const lossBox = container.querySelector('#loss-display-box');
    const rowB = container.querySelector('#row-param-b');

    if (valAEl) valAEl.textContent = paramA.toFixed(2);
    if (valBEl) valBEl.textContent = paramB.toFixed(2);
    if (rowB) rowB.style.display = showIntercept ? 'flex' : 'none';

    let currentLoss = 0;
    if (showIntercept) {
      currentLoss = Model2D.loss(paramA, paramB);
      lossBox.innerHTML = `
        <div style="font-size: 0.95rem; margin-bottom: 0.4rem;">
          이변수 손실: $L(a, b) = 11a^2 + b^2 + 6ab - 26.4a - 8b + 17.2$
        </div>
        <div style="font-size: 1.15rem; font-weight: 700; color: #38bdf8;">
          현재 손실 $L(${paramA.toFixed(2)}, ${paramB.toFixed(2)}) = ${currentLoss.toFixed(4)}$
          ${Math.abs(paramA - 0.6) < 0.05 && Math.abs(paramB - 2.2) < 0.05 ? ' <span style="color:#10b981;">(🎉 최솟값 0.48 도달!)</span>' : ''}
        </div>
      `;
    } else {
      currentLoss = Model1D.loss(paramA);
      lossBox.innerHTML = `
        <div style="font-size: 0.95rem; margin-bottom: 0.4rem;">
          일변수 손실: $L(a) = 11a^2 - 26.4a + 17.2$
        </div>
        <div style="font-size: 1.15rem; font-weight: 700; color: #f59e0b;">
          현재 손실 $L(${paramA.toFixed(2)}) = ${currentLoss.toFixed(4)}$
          ${Math.abs(paramA - 1.2) < 0.05 ? ' <span style="color:#10b981;">(최솟값 1.36 도달!)</span>' : ''}
        </div>
      `;
    }

    renderMath(lossBox);

    threeViewer.clearSlice();
    threeViewer.clearArrows();
    contourViewer.setSliceLine(null);
    threeViewer.setTrajectory([]);
    // 3D 뷰어 동기화: 손실 곡면 L(a, b)
    threeViewer.setSurface((a, b) => Model2D.loss(a, b), { xMin: -0.5, xMax: 2.5, yMin: -1, yMax: 5 }, 0.04);
    threeViewer.setCurrentPoint(paramA, showIntercept ? paramB : 0, true);

    // 2D 캔버스 동기화
    contourViewer.setBounds({ xMin: -0.5, xMax: 2.5, yMin: -1, yMax: 5 });
    contourViewer.setFunctions(
      (a, b) => Model2D.loss(a, b),
      (a, b) => ({ gx: Model2D.gradA(a, b), gy: Model2D.gradB(a, b) })
    );
    contourViewer.setTargetPoint(0.6, 2.2);
    contourViewer.setCurrentPoint(paramA, showIntercept ? paramB : 0);
    contourViewer.showCompass = false;
  }

  // Event Listeners
  const sliderA = container.querySelector('#slider-param-a');
  const sliderB = container.querySelector('#slider-param-b');
  const btn1d = container.querySelector('#btn-model-1d');
  const btn2d = container.querySelector('#btn-model-2d');

  sliderA.addEventListener('input', (e) => {
    paramA = parseFloat(e.target.value);
    playClickSound();
    update();
  });

  sliderB.addEventListener('input', (e) => {
    paramB = parseFloat(e.target.value);
    playClickSound();
    update();
  });

  btn1d.addEventListener('click', () => {
    showIntercept = false;
    btn1d.className = 'btn-primary';
    btn2d.className = 'btn-secondary';
    playClickSound();
    update();
  });

  btn2d.addEventListener('click', () => {
    showIntercept = true;
    btn2d.className = 'btn-primary';
    btn1d.className = 'btn-secondary';
    playClickSound();
    update();
  });

  contourViewer.onPointChange = (newA, newB) => {
    paramA = Math.max(0, Math.min(2.5, newA));
    paramB = Math.max(-1, Math.min(4, newB));
    sliderA.value = paramA;
    sliderB.value = paramB;
    update();
  };

  renderMath(container);
  update();
}
