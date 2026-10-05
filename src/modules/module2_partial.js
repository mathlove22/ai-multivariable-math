import { ExampleFunction, Model2D } from '../utils/math.js';
import { playClickSound } from '../utils/sound.js';
import { renderMath } from '../utils/latex.js';

export function renderModule2(container, { threeViewer, contourViewer }) {
  let activeFnType = 'example'; // 'example' (x^2+3xy+2y^2) or 'loss'
  let sliceDir = 'x'; // 'x' means x is variable (y is fixed), 'y' means y is variable (x is fixed)
  let curX = 1.0;
  let curY = 1.0;

  container.innerHTML = `
    <div class="pedagogy-panel">
      <!-- 1. 핵심 질문 및 개념 -->
      <div class="concept-card">
        <div class="card-header">
          <div class="card-title-group">
            <span class="card-icon">🍰</span>
            <span class="card-title">편미분: 케이크 자르기 직관 (단면의 접선)</span>
          </div>
          <span class="card-tag tag-story">Intuition</span>
        </div>

        <div class="story-box">
          <strong>"안개 속에서 발을 어떻게 디뎌볼까?"</strong><br>
          이변수 함수의 기울기는 방향마다 천차만별입니다. 그래서 수학자들은 가장 단순하고 명쾌한 방법을 썼습니다.<br>
          <em>"다른 변수는 잠시 얼려두고(상수 취급), 한 번에 딱 한 방향으로만 평면을 잘라 발을 디뎌보자!"</em>
        </div>

        <p style="color: var(--text-muted); font-size: 0.9rem;">
          3차원 곡면을 특정 평면으로 <strong>케이크 자르듯 싹둑</strong> 자르면, 그 단면은 우리가 익숙하게 알던 <strong>일변수 2차 포물선</strong>이 됩니다!
          그 포물선 위의 접선의 기울기가 바로 <strong>편미분(Partial Derivative)</strong>입니다.
        </p>

        <!-- 정의 박스 -->
        <div class="math-box highlight">
          $$\\frac{\\partial f}{\\partial x}: \\text{ $y$를 상수로 고정하고 $x$로만 미분 (동서 방향 순간변화율)}$$<br>
          $$\\frac{\\partial f}{\\partial y}: \\text{ $x$를 상수로 고정하고 $y$로만 미분 (남북 방향 순간변화율)}$$
        </div>
      </div>

      <!-- 2. 함수 선택 및 인터랙티브 자르기 -->
      <div class="concept-card">
        <div class="card-header">
          <div class="card-title-group">
            <span class="card-icon">✂️</span>
            <span class="card-title">인터랙티브 단면 절단 실험실</span>
          </div>
          <span class="card-tag tag-lab">Interactive</span>
        </div>

        <div class="btn-group">
          <button id="btn-fn-ex" class="btn-primary">
            ① 교재 예제 1-2: $f(x, y) = x^2 + 3xy + 2y^2$
          </button>
          <button id="btn-fn-loss" class="btn-secondary">
            ② 손실함수 예제 1-3: $L(a, b)$
          </button>
        </div>

        <!-- 단면 방향 선택 -->
        <div style="margin: 0.75rem 0;">
          <span style="font-size: 0.85rem; color: var(--text-muted); font-weight: 600;">절단 방향 선택 (칼날의 방향):</span>
          <div class="btn-group" style="margin-top: 0.35rem;">
            <button id="btn-dir-x" class="btn-primary" style="background: rgba(6, 182, 212, 0.25); border-color: #06b6d4; color: #67e8f9;">
              📐 $x$ 방향 미분 ($\\frac{\\partial f}{\\partial x}$, $y$ 고정 수평단면)
            </button>
            <button id="btn-dir-y" class="btn-secondary" style="border-color: #ec4899; color: #f472b6;">
              📐 $y$ 방향 미분 ($\\frac{\\partial f}{\\partial y}$, $x$ 고정 수직단면)
            </button>
          </div>
        </div>

        <!-- 위치 슬라이더 -->
        <div class="control-row">
          <div class="control-label-group">
            <span id="label-cur-x">현재 $x$ 좌표 (매개변수 $a$)</span>
            <span class="control-value" id="val-cur-x">${curX.toFixed(2)}</span>
          </div>
          <input type="range" id="slider-cur-x" class="custom-slider" min="-1" max="3" step="0.05" value="${curX}">
        </div>

        <div class="control-row">
          <div class="control-label-group">
            <span id="label-cur-y">현재 $y$ 좌표 (매개변수 $b$)</span>
            <span class="control-value" id="val-cur-y">${curY.toFixed(2)}</span>
          </div>
          <input type="range" id="slider-cur-y" class="custom-slider" min="-1" max="3" step="0.05" value="${curY}">
        </div>

        <!-- 실시간 편미분 계산 결과 카드 -->
        <div class="math-box highlight" id="partial-calc-card">
          <!-- 동적 주입 -->
        </div>

        <div class="insight-box">
          <span class="insight-icon">🔍</span>
          <div id="partial-pedagogy-tip">
            <!-- 팁 설명 -->
          </div>
        </div>
      </div>
    </div>
  `;

  renderMath(container);

  function update() {
    const valXEl = container.querySelector('#val-cur-x');
    const valYEl = container.querySelector('#val-cur-y');
    const calcCard = container.querySelector('#partial-calc-card');
    const tipEl = container.querySelector('#partial-pedagogy-tip');
    const sliderX = container.querySelector('#slider-cur-x');
    const sliderY = container.querySelector('#slider-cur-y');
    const labelX = container.querySelector('#label-cur-x');
    const labelY = container.querySelector('#label-cur-y');

    if (valXEl) valXEl.textContent = curX.toFixed(2);
    if (valYEl) valYEl.textContent = curY.toFixed(2);

    let slope = 0;
    let gx = 0;
    let gy = 0;

    if (activeFnType === 'example') {
      if (labelX) labelX.textContent = '현재 x 좌표';
      if (labelY) labelY.textContent = '현재 y 좌표';

      sliderX.min = "-1";
      sliderX.max = "3";
      sliderY.min = "-1";
      sliderY.max = "3";

      gx = ExampleFunction.df_dx(curX, curY);
      gy = ExampleFunction.df_dy(curX, curY);
      slope = (sliceDir === 'x') ? gx : gy;

      calcCard.innerHTML = `
        <div style="font-size: 0.9rem; margin-bottom: 0.4rem; color: #94a3b8;">
          $f(x, y) = x^2 + 3xy + 2y^2$의 편도함수: $\\frac{\\partial f}{\\partial x} = 2x + 3y$, $\\frac{\\partial f}{\\partial y} = 3x + 4y$
        </div>
        <div style="display: flex; justify-content: space-around; font-size: 1.05rem; font-weight: 700; margin-top: 0.5rem;">
          <span style="color: #06b6d4;">$\\frac{\\partial f}{\\partial x}(${curX.toFixed(1)}, ${curY.toFixed(1)}) = ${gx.toFixed(2)}$</span>
          <span style="color: #ec4899;">$\\frac{\\partial f}{\\partial y}(${curX.toFixed(1)}, ${curY.toFixed(1)}) = ${gy.toFixed(2)}$</span>
        </div>
        <div style="font-size: 0.85rem; color: #facc15; margin-top: 0.5rem;">
          ${sliceDir === 'x' ? `🔪 현재 $y = ${curY.toFixed(1)}$ 고정 평면으로 잘라낸 $x$방향 접선 기울기는 ${gx.toFixed(2)}입니다.` : `🔪 현재 $x = ${curX.toFixed(1)}$ 고정 평면으로 잘라낸 $y$방향 접선 기울기는 ${gy.toFixed(2)}입니다.`}
        </div>
      `;

      tipEl.innerHTML = `
        <strong>교재 예제 1-2 점 $(1, 1)$ 해설:</strong><br>
        $x=1, y=1$을 대입하면 $\\frac{\\partial f}{\\partial x} = 2(1) + 3(1) = 5$, $\\frac{\\partial f}{\\partial y} = 3(1) + 4(1) = 7$ 입니다.<br>
        2D 지도의 <strong>파선 절단선</strong>과 3D 화면의 <strong>노란색 단면 포물선</strong>, 그리고 <strong>빨간색 접선</strong>이 완벽히 일치하는 것을 확인하세요!
      `;

      threeViewer.setSurface((x, y) => ExampleFunction.f(x, y), { xMin: -1, xMax: 3, yMin: -1, yMax: 3 }, 0.08);
      contourViewer.setBounds({ xMin: -1, xMax: 3, yMin: -1, yMax: 3 });
      contourViewer.setFunctions(
        (x, y) => ExampleFunction.f(x, y),
        (x, y) => ({ gx: ExampleFunction.df_dx(x, y), gy: ExampleFunction.df_dy(x, y) })
      );
      contourViewer.setTargetPoint(null, null);
    } else {
      if (labelX) labelX.textContent = '기울기 매개변수 (a)';
      if (labelY) labelY.textContent = '절편 매개변수 (b)';

      sliderX.min = "-0.5";
      sliderX.max = "2.5";
      sliderY.min = "-1";
      sliderY.max = "5";

      gx = Model2D.gradA(curX, curY);
      gy = Model2D.gradB(curX, curY);
      slope = (sliceDir === 'x') ? gx : gy;

      calcCard.innerHTML = `
        <div style="font-size: 0.9rem; margin-bottom: 0.4rem; color: #94a3b8;">
          손실함수 $L(a, b)$: $\\frac{\\partial L}{\\partial a} = 22a + 6b - 26.4$, $\\frac{\\partial L}{\\partial b} = 6a + 2b - 8$
        </div>
        <div style="display: flex; justify-content: space-around; font-size: 1.05rem; font-weight: 700; margin-top: 0.5rem;">
          <span style="color: #06b6d4;">$\\frac{\\partial L}{\\partial a}(${curX.toFixed(2)}, ${curY.toFixed(2)}) = ${gx.toFixed(2)}$</span>
          <span style="color: #ec4899;">$\\frac{\\partial L}{\\partial b}(${curX.toFixed(2)}, ${curY.toFixed(2)}) = ${gy.toFixed(2)}$</span>
        </div>
        <div style="font-size: 0.85rem; color: #facc15; margin-top: 0.5rem;">
          ${Math.abs(curX - 1) < 0.05 && Math.abs(curY - 1) < 0.05 ? '✨ 교재 예제 1-3: 점 (1, 1)에서 b방향 편미분은 정확히 0입니다 (순간적으로 평평)!' : ''}
        </div>
      `;

      tipEl.innerHTML = `
        <strong>교재 예제 1-3 점 $(1, 1)$ 관찰:</strong><br>
        $\\frac{\\partial L}{\\partial a} = 1.6$, $\\frac{\\partial L}{\\partial b} = 0$ 입니다.<br>
        $a$를 늘리면 손실이 커지지만($\\frac{\\partial L}{\\partial a}>0$), $b$ 방향($\\frac{\\partial L}{\\partial b}=0$)으로는 <strong>순간적으로 완전히 평평한 수평 접선</strong>을 확인해 보세요!
      `;

      threeViewer.setSurface((a, b) => Model2D.loss(a, b), { xMin: -0.5, xMax: 2.5, yMin: -1, yMax: 5 }, 0.04);
      contourViewer.setBounds({ xMin: -0.5, xMax: 2.5, yMin: -1, yMax: 5 });
      contourViewer.setFunctions(
        (a, b) => Model2D.loss(a, b),
        (a, b) => ({ gx: Model2D.gradA(a, b), gy: Model2D.gradB(a, b) })
      );
      contourViewer.setTargetPoint(0.6, 2.2);
    }

    renderMath(calcCard);
    renderMath(tipEl);

    // 3D 뷰어 동기화: 절단 평면, 단면 곡선, 접선
    threeViewer.setCurrentPoint(curX, curY, true);
    if (sliceDir === 'x') {
      // y 고정, x 방향 변화
      threeViewer.showSlice({
        fixAxis: 'y',
        fixVal: curY,
        curX,
        curY,
        slope: gx,
      });
      // 2D 캔버스에 수평 절단선 그리기
      contourViewer.setSliceLine({
        axis: 'y',
        val: curY,
        label: activeFnType === 'example' ? `y = ${curY.toFixed(2)} 고정 절단면` : `b = ${curY.toFixed(2)} 고정 절단면`,
      });
    } else {
      // x 고정, y 방향 변화
      threeViewer.showSlice({
        fixAxis: 'x',
        fixVal: curX,
        curX,
        curY,
        slope: gy,
      });
      // 2D 캔버스에 수직 절단선 그리기
      contourViewer.setSliceLine({
        axis: 'x',
        val: curX,
        label: activeFnType === 'example' ? `x = ${curX.toFixed(2)} 고정 절단면` : `a = ${curX.toFixed(2)} 고정 절단면`,
      });
    }

    contourViewer.setCurrentPoint(curX, curY);
  }

  // Event Listeners
  const btnEx = container.querySelector('#btn-fn-ex');
  const btnLoss = container.querySelector('#btn-fn-loss');
  const btnDirX = container.querySelector('#btn-dir-x');
  const btnDirY = container.querySelector('#btn-dir-y');
  const sliderX = container.querySelector('#slider-cur-x');
  const sliderY = container.querySelector('#slider-cur-y');

  btnEx.addEventListener('click', () => {
    activeFnType = 'example';
    btnEx.className = 'btn-primary';
    btnLoss.className = 'btn-secondary';
    curX = 1.0;
    curY = 1.0;
    sliderX.value = curX;
    sliderY.value = curY;
    playClickSound();
    update();
  });

  btnLoss.addEventListener('click', () => {
    activeFnType = 'loss';
    btnLoss.className = 'btn-primary';
    btnEx.className = 'btn-secondary';
    curX = 1.0;
    curY = 1.0;
    sliderX.value = curX;
    sliderY.value = curY;
    playClickSound();
    update();
  });

  btnDirX.addEventListener('click', () => {
    sliceDir = 'x';
    btnDirX.style.background = 'rgba(6, 182, 212, 0.25)';
    btnDirX.style.borderColor = '#06b6d4';
    btnDirX.style.color = '#67e8f9';
    btnDirY.style.background = 'rgba(255, 255, 255, 0.06)';
    btnDirY.style.borderColor = 'var(--border-subtle)';
    btnDirY.style.color = 'var(--text-muted)';
    playClickSound();
    update();
  });

  btnDirY.addEventListener('click', () => {
    sliceDir = 'y';
    btnDirY.style.background = 'rgba(236, 72, 153, 0.25)';
    btnDirY.style.borderColor = '#ec4899';
    btnDirY.style.color = '#f472b6';
    btnDirX.style.background = 'rgba(255, 255, 255, 0.06)';
    btnDirX.style.borderColor = 'var(--border-subtle)';
    btnDirX.style.color = 'var(--text-muted)';
    playClickSound();
    update();
  });

  sliderX.addEventListener('input', (e) => {
    curX = parseFloat(e.target.value);
    playClickSound();
    update();
  });

  sliderY.addEventListener('input', (e) => {
    curY = parseFloat(e.target.value);
    playClickSound();
    update();
  });

  contourViewer.onPointChange = (x, y) => {
    curX = x;
    curY = y;
    sliderX.value = curX;
    sliderY.value = curY;
    update();
  };

  update();
}
