import { Model2D } from '../utils/math.js';
import { playClickSound, playStepSound, playDivergeSound, playSuccessSound } from '../utils/sound.js';
import { renderMath } from '../utils/latex.js';

export function renderModule4(container, { threeViewer, contourViewer }) {
  let eta = 0.05; // 학습률
  let currentStep = 0;
  let curA = 0.0;
  let curB = 0.0;
  let trajectory = [{ a: 0.0, b: 0.0, loss: 17.2, ga: -26.4, gb: -8.0 }];
  let isPlaying = false;
  let playInterval = null;

  container.innerHTML = `
    <div class="pedagogy-panel">
      <!-- 1. 다변수 경사하강법 규칙 -->
      <div class="concept-card">
        <div class="card-header">
          <div class="card-title-group">
            <span class="card-icon">⛷️</span>
            <span class="card-title">다변수 경사하강법: 두 매개변수를 한꺼번에!</span>
          </div>
          <span class="card-tag tag-math">Algorithm</span>
        </div>

        <p style="color: var(--text-muted); font-size: 0.9rem;">
          가장 가파른 내리막 방향이 $-\\nabla L$임을 알았으므로, 매 걸음 그래디언트의 반대 방향으로 이동합니다.
        </p>

        <div class="math-box highlight">
          벡터 갱신식: $(a, b) \\leftarrow (a, b) - \\eta \\nabla L(a, b)$<br>
          성분별 갱신: $a \\leftarrow a - \\eta \\frac{\\partial L}{\\partial a}, \\quad b \\leftarrow b - \\eta \\frac{\\partial L}{\\partial b}$
        </div>
      </div>

      <!-- 2. 시뮬레이터 조작부 -->
      <div class="concept-card">
        <div class="card-header">
          <div class="card-title-group">
            <span class="card-icon">🎮</span>
            <span class="card-title">하산 시뮬레이터 & 손계산 검증</span>
          </div>
          <span class="card-tag tag-lab">Simulation</span>
        </div>

        <!-- 학습률 슬라이더 -->
        <div class="control-row">
          <div class="control-label-group">
            <span>학습률 ($\\eta$, Learning Rate)</span>
            <span class="control-value" id="val-eta">${eta.toFixed(3)}</span>
          </div>
          <input type="range" id="slider-eta" class="custom-slider" min="0.01" max="0.11" step="0.005" value="${eta}">
        </div>

        <!-- 컨트롤 버튼 -->
        <div class="btn-group">
          <button id="btn-step" class="btn-primary">
            👣 한 걸음 전진 (Step)
          </button>
          <button id="btn-play" class="btn-secondary">
            ▶️ 자동 하산 (Play)
          </button>
          <button id="btn-reset" class="btn-secondary">
            🔄 초기화 (Reset)
          </button>
          <button id="btn-set-60" class="btn-secondary">
            ⏩ 60걸음 직행 (교재 그림 Ⅲ-5)
          </button>
        </div>

        <!-- 실시간 상태 정보 -->
        <div class="math-box" id="descent-status-box" style="text-align: left; font-size: 0.9rem;">
          <!-- 실시간 좌표 및 손실 출력 -->
        </div>

        <!-- 교재 표 Ⅲ-3 재현 테이블 -->
        <div style="margin-top: 1rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem;">
            <span style="font-size: 0.85rem; font-weight: 600; color: #cbd5e1;">[표 Ⅲ-3] 하산 기록표 (소수 4자리 대조)</span>
            <span id="badge-match" style="font-size: 0.72rem; padding: 0.15rem 0.5rem; border-radius: 4px; background: rgba(16, 185, 129, 0.2); color: #6ee7b7; border: 1px solid #10b981;">
              ✓ 교재 손계산 일치
            </span>
          </div>
          <div class="data-table-wrapper">
            <table class="data-table" id="descent-table">
              <thead>
                <tr>
                  <th>걸음</th>
                  <th>현재 $(a, b)$</th>
                  <th>$\\nabla L = (\\frac{\\partial L}{\\partial a}, \\frac{\\partial L}{\\partial b})$</th>
                  <th>다음 $(a, b)$</th>
                  <th>손실 $L$</th>
                </tr>
              </thead>
              <tbody id="descent-table-body">
                <!-- 동적 행 추가 -->
              </tbody>
            </table>
          </div>
        </div>

        <div class="insight-box">
          <span class="insight-icon">🤔</span>
          <div>
            <strong>생각해 보기: 왜 $a$는 빠른데 $b$는 이렇게 느릴까?</strong><br>
            • $a$는 불과 몇 걸음 만에 최적값($0.6$) 근처인 $1.0$ 주변에 빠르게 안착합니다.<br>
            • 하지만 $b$는 60걸음을 걸어도 여전히 $1.52$ 부근에 머물며 <strong>답답할 만큼 굼뜨게</strong> 움직입니다!<br>
            • 그 이유는 등고선이 비스듬히 길쭉한 <strong>'골짜기(Valley)'</strong> 지형이기 때문입니다. 
            가파른 방향과 완만한 방향의 휘어짐(곡률)이 얼마나 다른지는 바로 다음 챕터 <strong>'헤시안 행렬'</strong>에서 밝혀집니다!
          </div>
        </div>
      </div>
    </div>
  `;

  renderMath(container);

  function reset() {
    stopPlay();
    currentStep = 0;
    curA = 0.0;
    curB = 0.0;
    trajectory = [{ a: 0.0, b: 0.0, loss: 17.2, ga: -26.4, gb: -8.0 }];
    renderTable();
    updateVisualizers();
  }

  function stepForward() {
    const ga = Model2D.gradA(curA, curB);
    const gb = Model2D.gradB(curA, curB);

    const nextA = curA - eta * ga;
    const nextB = curB - eta * gb;
    const nextLoss = Model2D.loss(nextA, nextB);

    currentStep++;
    curA = nextA;
    curB = nextB;

    trajectory.push({
      step: currentStep,
      a: curA,
      b: curB,
      loss: nextLoss,
      ga,
      gb,
    });

    if (nextLoss > 1000 || isNaN(nextLoss)) {
      playDivergeSound();
      stopPlay();
      alert('⚠️ 학습률(η)이 너무 커서 값이 발산(Divergence)하여 튕겨져 나갔습니다! 학습률을 낮춰보세요.');
      return;
    }

    if (Math.abs(curA - 0.6) < 0.05 && Math.abs(curB - 2.2) < 0.05) {
      playSuccessSound();
    } else {
      playStepSound(nextLoss);
    }

    renderTable();
    updateVisualizers();
  }

  function run60Steps() {
    reset();
    for (let i = 0; i < 60; i++) {
      const ga = Model2D.gradA(curA, curB);
      const gb = Model2D.gradB(curA, curB);
      curA = curA - eta * ga;
      curB = curB - eta * gb;
      currentStep++;
      trajectory.push({
        step: currentStep,
        a: curA,
        b: curB,
        loss: Model2D.loss(curA, curB),
        ga,
        gb,
      });
    }
    renderTable();
    updateVisualizers();
  }

  function togglePlay() {
    if (isPlaying) {
      stopPlay();
    } else {
      isPlaying = true;
      const btn = container.querySelector('#btn-play');
      if (btn) btn.innerHTML = '⏸️ 일시정지 (Pause)';
      playInterval = setInterval(() => {
        if (currentStep >= 80) {
          stopPlay();
          return;
        }
        stepForward();
      }, 250);
    }
  }

  function stopPlay() {
    isPlaying = false;
    if (playInterval) clearInterval(playInterval);
    const btn = container.querySelector('#btn-play');
    if (btn) btn.innerHTML = '▶️ 자동 하산 (Play)';
  }

  function renderTable() {
    const tbody = container.querySelector('#descent-table-body');
    const statusBox = container.querySelector('#descent-status-box');
    if (!tbody || !statusBox) return;

    const curPt = trajectory[trajectory.length - 1];

    statusBox.innerHTML = `
      <div style="display: flex; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem;">
        <div><strong>걸음 수:</strong> <span style="color:#38bdf8;">${currentStep} 걸음</span></div>
        <div><strong>현재 위치:</strong> <span style="color:#a5b4fc;">(${curPt.a.toFixed(4)}, ${curPt.b.toFixed(4)})</span></div>
        <div><strong>현재 손실:</strong> <span style="color:${curPt.loss < 1 ? '#34d399' : '#f59e0b'}; font-weight:700;">${curPt.loss.toFixed(4)}</span></div>
      </div>
      <div style="font-size: 0.8rem; color: #64748b; margin-top: 0.35rem;">
        목표 최적점: (0.6000, 2.2000), 목표 손실: 0.4800
      </div>
    `;

    let html = '';
    const sliceStart = Math.max(0, trajectory.length - 6);
    for (let i = sliceStart; i < trajectory.length - 1; i++) {
      const p1 = trajectory[i];
      const p2 = trajectory[i + 1];
      html += `
        <tr ${i === 0 ? 'class="highlight-row"' : ''}>
          <td>${i + 1}</td>
          <td>(${p1.a.toFixed(4)}, ${p1.b.toFixed(4)})</td>
          <td>(${p1.ga.toFixed(3)}, ${p1.gb.toFixed(3)})</td>
          <td>(${p2.a.toFixed(4)}, ${p2.b.toFixed(4)})</td>
          <td>${p2.loss.toFixed(4)}</td>
        </tr>
      `;
    }
    tbody.innerHTML = html;
  }

  function updateVisualizers() {
    threeViewer.setSurface((a, b) => Model2D.loss(a, b), { xMin: -0.5, xMax: 2.5, yMin: -1, yMax: 5 }, 0.04);
    threeViewer.clearSlice();
    threeViewer.clearArrows();
    threeViewer.setCurrentPoint(curA, curB, true);
    threeViewer.setTrajectory(trajectory);

    contourViewer.setBounds({ xMin: -0.5, xMax: 2.5, yMin: -1, yMax: 5 });
    contourViewer.setFunctions(
      (a, b) => Model2D.loss(a, b),
      (a, b) => ({ gx: Model2D.gradA(a, b), gy: Model2D.gradB(a, b) })
    );
    contourViewer.setTargetPoint(0.6, 2.2);
    contourViewer.setSliceLine(null);
    contourViewer.setCurrentPoint(curA, curB);
    contourViewer.setTrajectory(trajectory);
    contourViewer.showCompass = false;
  }

  // Event Listeners
  const btnStep = container.querySelector('#btn-step');
  const btnPlay = container.querySelector('#btn-play');
  const btnReset = container.querySelector('#btn-reset');
  const btn60 = container.querySelector('#btn-set-60');
  const sliderEta = container.querySelector('#slider-eta');

  btnStep.addEventListener('click', () => {
    playClickSound();
    stepForward();
  });

  btnPlay.addEventListener('click', () => {
    playClickSound();
    togglePlay();
  });

  btnReset.addEventListener('click', () => {
    playClickSound();
    reset();
  });

  btn60.addEventListener('click', () => {
    playClickSound();
    run60Steps();
  });

  sliderEta.addEventListener('input', (e) => {
    eta = parseFloat(e.target.value);
    const valEtaEl = container.querySelector('#val-eta');
    if (valEtaEl) valEtaEl.textContent = eta.toFixed(3);
    playClickSound();
  });

  reset();
}
