import { Model2D } from '../utils/math.js';
import { playClickSound } from '../utils/sound.js';
import { renderMath } from '../utils/latex.js';

export function renderModule1(container, { threeViewer, contourViewer }) {
  let surfaceType = 'loss'; // 'loss' or 'bowl'
  let cutHeight = 5;

  container.innerHTML = `
    <div class="pedagogy-panel">
      <!-- 1. 중단원 열기 스토리 -->
      <div class="concept-card">
        <div class="card-header">
          <div class="card-title-group">
            <span class="card-icon">🌫️</span>
            <span class="card-title">안개 낀 산에서는 어느 쪽으로 내려가야 할까?</span>
          </div>
          <span class="card-tag tag-story">Story</span>
        </div>

        <div class="story-box">
          주말 등산에 나선 <strong>지호</strong>는 정상 부근에서 짙은 안개를 만났습니다. 한 치 앞도 보이지 않아 지도는 소용이 없고, 
          믿을 수 있는 것은 <strong>발바닥으로 느끼는 땅의 기울기</strong>뿐입니다.<br><br>
          <em>"동쪽으로는 오르막, 북쪽으로는 내리막이네. 그럼 가장 빨리 내려가는 방향은 어디일까?"</em><br><br>
          <strong>인공지능(AI)의 학습도 이와 똑같은 상황입니다!</strong><br>
          매개변수가 하나($w$)일 때는 '왼쪽'과 '오른쪽' 둘 중 하나만 고르면 되었지만, 
          매개변수가 두 개($a, b$)가 되는 순간 <strong>갈 수 있는 방향은 360도 무한히 많아집니다.</strong>
        </div>
      </div>

      <!-- 2. 이변수 함수와 등고선 -->
      <div class="concept-card">
        <div class="card-header">
          <div class="card-title-group">
            <span class="card-icon">🗺️</span>
            <span class="card-title">이변수 함수의 곡면과 등고선 (Contour)</span>
          </div>
          <span class="card-tag tag-math">Definition</span>
        </div>

        <p style="color: var(--text-muted); font-size: 0.9rem;">
          두 변수 $x, y$의 값이 정해지면 $z$의 값이 오직 하나로 정해질 때, 이를 <strong>이변수 함수</strong> $z = f(x, y)$라 합니다.<br>
          체감온도는 기온과 풍속에 따라, 택배 요금은 무게와 크기에 따라 정해지는 것과 같습니다.
        </p>

        <div class="math-box highlight">
          일변수 함수 $y = f(x)$ $\\rightarrow$ 좌표평면 위의 <strong>곡선 (2D Curve)</strong><br>
          이변수 함수 $z = f(x, y)$ $\\rightarrow$ 3차원 공간 속 <strong>곡면 지형 (3D Surface)</strong>
        </div>

        <div class="btn-group">
          <button id="btn-surf-loss" class="btn-primary">
            ① 교재 손실함수 $L(a, b)$ (타원 골짜기)
          </button>
          <button id="btn-surf-bowl" class="btn-secondary">
            ② 기본 그릇형 $z = x^2 + y^2$ (원형)
          </button>
        </div>

        <!-- 인터랙티브 슬라이더 -->
        <div class="control-row">
          <div class="control-label-group">
            <span>수평 절단면 고도 ($z = k$)</span>
            <span class="control-value" id="val-cut-height">${cutHeight.toFixed(1)}</span>
          </div>
          <input type="range" id="slider-cut-height" class="custom-slider" min="0.5" max="15" step="0.5" value="${cutHeight}">
        </div>

        <div class="insight-box">
          <span class="insight-icon">💡</span>
          <div>
            <strong>등고선(等高線)의 핵심 원리:</strong><br>
            • 곡면을 일정한 높이($z=k$)에서 수평으로 자른 뒤 위에서 내려다보면 같은 높이의 점들을 이은 <strong>등고선</strong>을 얻습니다.<br>
            • <strong>등고선 간격이 촘촘한 곳</strong>일수록 곡면이 가파르고,<br>
            • <strong>등고선 간격이 넓은 곳</strong>일수록 완만합니다!
          </div>
        </div>
      </div>
    </div>
  `;

  renderMath(container);

  function getActiveFn() {
    if (surfaceType === 'loss') {
      return (x, y) => Model2D.loss(x, y);
    }
    return (x, y) => x * x + y * y;
  }

  function getActiveGradFn() {
    if (surfaceType === 'loss') {
      return (x, y) => ({ gx: Model2D.gradA(x, y), gy: Model2D.gradB(x, y) });
    }
    return (x, y) => ({ gx: 2 * x, gy: 2 * y });
  }

  function update() {
    const fn = getActiveFn();
    const gradFn = getActiveGradFn();

    const valEl = container.querySelector('#val-cut-height');
    if (valEl) valEl.textContent = cutHeight.toFixed(1);

    if (surfaceType === 'loss') {
      threeViewer.setSurface(fn, { xMin: -0.5, xMax: 2.5, yMin: -1, yMax: 5 }, 0.04);
      contourViewer.setBounds({ xMin: -0.5, xMax: 2.5, yMin: -1, yMax: 5 });
      contourViewer.setTargetPoint(0.6, 2.2);
      contourViewer.setCurrentPoint(0, 0);
      threeViewer.setCurrentPoint(0, 0, true);
    } else {
      threeViewer.setSurface(fn, { xMin: -2.5, xMax: 2.5, yMin: -2.5, yMax: 2.5 }, 0.15);
      contourViewer.setBounds({ xMin: -2.5, xMax: 2.5, yMin: -2.5, yMax: 2.5 });
      contourViewer.setTargetPoint(0, 0);
      contourViewer.setCurrentPoint(1.2, 1.2);
      threeViewer.setCurrentPoint(1.2, 1.2, true);
    }

    contourViewer.setFunctions(fn, gradFn);
    contourViewer.setSliceLine(null);
    contourViewer.showCompass = false;
    threeViewer.clearSlice();
    threeViewer.clearArrows();
    threeViewer.setTrajectory([]);
  }

  // Event Listeners
  const btnLoss = container.querySelector('#btn-surf-loss');
  const btnBowl = container.querySelector('#btn-surf-bowl');
  const sliderCut = container.querySelector('#slider-cut-height');

  btnLoss.addEventListener('click', () => {
    surfaceType = 'loss';
    btnLoss.className = 'btn-primary';
    btnBowl.className = 'btn-secondary';
    playClickSound();
    update();
  });

  btnBowl.addEventListener('click', () => {
    surfaceType = 'bowl';
    btnBowl.className = 'btn-primary';
    btnLoss.className = 'btn-secondary';
    playClickSound();
    update();
  });

  sliderCut.addEventListener('input', (e) => {
    cutHeight = parseFloat(e.target.value);
    const valEl = container.querySelector('#val-cut-height');
    if (valEl) valEl.textContent = cutHeight.toFixed(1);
    contourViewer.draw();
  });

  contourViewer.onPointChange = (x, y) => {
    contourViewer.setCurrentPoint(x, y);
    threeViewer.setCurrentPoint(x, y, true);
  };

  update();
}
