import { Model2D } from '../utils/math.js';
import { playClickSound } from '../utils/sound.js';
import { renderMath } from '../utils/latex.js';

export function renderModule5(container, { threeViewer, contourViewer }) {
  let selectedAxis = 'both'; // 'a', 'b', 'both'

  container.innerHTML = `
    <div class="pedagogy-panel">
      <!-- 1. 이계편미분과 헤시안 행렬 -->
      <div class="concept-card">
        <div class="card-header">
          <div class="card-title-group">
            <span class="card-icon">📐</span>
            <span class="card-title">헤시안 행렬: 휘어짐(곡률) 정보를 한 판에!</span>
          </div>
          <span class="card-tag tag-math">Hessian Matrix</span>
        </div>

        <div class="story-box">
          <strong>"11배나 차이 난다고?!"</strong><br>
          1변수 함수에서 곡면이 볼록한지 오목한지(휘어짐)를 재는 도구는 <strong>이계도함수 $f''(x)$</strong>였습니다.<br>
          2변수 함수에서는 기울기 자체가 2개($\\frac{\\partial f}{\\partial a}, \\frac{\\partial f}{\\partial b}$)이므로, 
          그 기울기들이 변하는 비율도 총 <strong>4개</strong>가 됩니다!
        </div>

        <div class="math-box highlight">
          $$H = \\begin{pmatrix} \\frac{\\partial^2 f}{\\partial a^2} & \\frac{\\partial^2 f}{\\partial a \\partial b} \\\\[6pt] \\frac{\\partial^2 f}{\\partial b \\partial a} & \\frac{\\partial^2 f}{\\partial b^2} \\end{pmatrix}$$
          <div style="font-size: 0.85rem; color: #a5b4fc; margin-top: 0.4rem;">
            클레로의 정리: $\\frac{\\partial^2 f}{\\partial b \\partial a} = \\frac{\\partial^2 f}{\\partial a \\partial b}$ 이므로 헤시안 행렬은 언제나 <strong>대칭 행렬</strong>입니다!
          </div>
        </div>
      </div>

      <!-- 2. 교재 손실함수 헤시안 전격 해부 -->
      <div class="concept-card">
        <div class="card-header">
          <div class="card-title-group">
            <span class="card-icon">🔍</span>
            <span class="card-title">손실함수 $L(a, b)$ 헤시안 전격 해부</span>
          </div>
          <span class="card-tag tag-lab">Analysis</span>
        </div>

        <p style="color: var(--text-muted); font-size: 0.88rem;">
          손실함수 $L(a, b) = 11a^2 + b^2 + 6ab - 26.4a - 8b + 17.2$를 편미분하면:
        </p>

        <!-- 헤시안 행렬 시각화 카드 -->
        <div style="display: flex; justify-content: center; margin: 1rem 0;">
          <div style="background: rgba(15, 23, 42, 0.9); border: 2px solid var(--border-glow); border-radius: var(--radius-md); padding: 1.25rem 2rem; text-align: center; box-shadow: 0 0 20px rgba(99, 102, 241, 0.2);">
            <div style="font-size: 1.3rem; font-family: 'JetBrains Mono', monospace; font-weight: 700; letter-spacing: 0.1em;" id="hessian-matrix-display">
              $$H = \\begin{pmatrix} \\mathbf{22} & \\mathbf{6} \\\\[6pt] \\mathbf{6} & \\mathbf{2} \\end{pmatrix}$$
            </div>
          </div>
        </div>

        <div class="btn-group">
          <button id="btn-view-a" class="btn-secondary">
            ⚡ a축 단면 포물선 (휘어짐 = 22, 뾰족함!)
          </button>
          <button id="btn-view-b" class="btn-secondary">
            🐢 b축 단면 포물선 (휘어짐 = 2, 완만함!)
          </button>
          <button id="btn-view-both" class="btn-primary">
            🔄 전체 곡면 함께 비교 (11배 곡률 차이)
          </button>
        </div>

        <!-- 단면 수식 비교 -->
        <div class="math-box" id="slice-equation-box">
          <!-- 동적 주입 -->
        </div>

        <div class="insight-box">
          <span class="insight-icon">💡</span>
          <div>
            <strong>경사하강법이 $b$에서 느렸던 진짜 원인:</strong><br>
            • <strong>대각 원소 ($22$와 $2$):</strong> $a$방향 휘어짐은 $22$인 반면, $b$방향 휘어짐은 겨우 $2$로 <strong>무려 11배 차이</strong>가 납니다.<br>
            • 가파른 $a$ 방향에서 발산하여 튕겨 나가지 않으려면 학습률 $\\eta$를 $0.05$처럼 작게 잡아야 합니다.<br>
            • 하지만 그렇게 작은 보폭으로는 완만한 $b$ 방향에서는 <strong>티끌만큼씩만 전진</strong>하게 되어 속도가 극도로 느려집니다!<br><br>
            • <strong>비대각 원소 ($6$):</strong> $a$와 $b$를 동시에 바꿀 때 나타나는 <strong>'얽힘(Coupling)'</strong>의 크기입니다. 
            이 값이 $0$이 아니기 때문에 골짜기가 축에 똑바르지 않고 <strong>비스듬히 기울어지게</strong> 됩니다!
          </div>
        </div>
      </div>
    </div>
  `;

  renderMath(container);

  function update() {
    const eqBox = container.querySelector('#slice-equation-box');

    threeViewer.setSurface((a, b) => Model2D.loss(a, b), { xMin: -0.5, xMax: 2.5, yMin: -1, yMax: 5 }, 0.04);
    threeViewer.setCurrentPoint(0.6, 2.2, true);

    if (selectedAxis === 'a') {
      // b = 2.2 고정 단면
      threeViewer.showSlice({
        fixAxis: 'y',
        fixVal: 2.2,
        curX: 0.6,
        curY: 2.2,
        slope: 0,
      });
      contourViewer.setSliceLine({
        axis: 'y',
        val: 2.2,
        label: 'b = 2.2 고정 단면선',
      });

      eqBox.innerHTML = `
        <div style="color: #38bdf8; font-weight: 600; margin-bottom: 0.3rem;">
          [그림 Ⅲ-8 (가)] $b = 2.2$로 고정한 $a$방향 단면 포물선
        </div>
        <div>$$L(a, 2.2) = 11(a - 0.6)^2 + 0.48$$</div>
        <div style="font-size: 0.85rem; color: #94a3b8; margin-top: 0.3rem;">
          이차항 계수 $11$은 헤시안 대각 원소 $22$의 절반! $\\rightarrow$ <strong>극도로 뾰족한 포물선</strong>
        </div>
      `;
    } else if (selectedAxis === 'b') {
      // a = 0.6 고정 단면
      threeViewer.showSlice({
        fixAxis: 'x',
        fixVal: 0.6,
        curX: 0.6,
        curY: 2.2,
        slope: 0,
      });
      contourViewer.setSliceLine({
        axis: 'x',
        val: 0.6,
        label: 'a = 0.6 고정 단면선',
      });

      eqBox.innerHTML = `
        <div style="color: #f472b6; font-weight: 600; margin-bottom: 0.3rem;">
          [그림 Ⅲ-8 (나)] $a = 0.6$으로 고정한 $b$방향 단면 포물선
        </div>
        <div>$$L(0.6, b) = 1(b - 2.2)^2 + 0.48$$</div>
        <div style="font-size: 0.85rem; color: #94a3b8; margin-top: 0.3rem;">
          이차항 계수 $1$은 헤시안 대각 원소 $2$의 절반! $\\rightarrow$ <strong>매우 완만한 포물선</strong>
        </div>
      `;
    } else {
      threeViewer.clearSlice();
      contourViewer.setSliceLine(null);

      eqBox.innerHTML = `
        <div style="color: #cbd5e1; font-weight: 600; margin-bottom: 0.3rem;">
          두 단면 포물선의 극명한 대조
        </div>
        <div style="display: flex; justify-content: space-around; flex-wrap: wrap; margin-top: 0.4rem;">
          <span style="color: #38bdf8;">$a$방향 단면: $11(a-0.6)^2 + 0.48$ (11배 뾰족)</span>
          <span style="color: #f472b6;">$b$방향 단면: $1(b-2.2)^2 + 0.48$ (완만)</span>
        </div>
      `;
    }

    renderMath(eqBox);

    contourViewer.setBounds({ xMin: -0.5, xMax: 2.5, yMin: -1, yMax: 5 });
    contourViewer.setFunctions(
      (a, b) => Model2D.loss(a, b),
      (a, b) => ({ gx: Model2D.gradA(a, b), gy: Model2D.gradB(a, b) })
    );
    contourViewer.setTargetPoint(0.6, 2.2);
    contourViewer.setCurrentPoint(0.6, 2.2);
  }

  // Event Listeners
  const btnA = container.querySelector('#btn-view-a');
  const btnB = container.querySelector('#btn-view-b');
  const btnBoth = container.querySelector('#btn-view-both');

  btnA.addEventListener('click', () => {
    selectedAxis = 'a';
    btnA.className = 'btn-primary';
    btnB.className = 'btn-secondary';
    btnBoth.className = 'btn-secondary';
    playClickSound();
    update();
  });

  btnB.addEventListener('click', () => {
    selectedAxis = 'b';
    btnB.className = 'btn-primary';
    btnA.className = 'btn-secondary';
    btnBoth.className = 'btn-secondary';
    playClickSound();
    update();
  });

  btnBoth.addEventListener('click', () => {
    selectedAxis = 'both';
    btnBoth.className = 'btn-primary';
    btnA.className = 'btn-secondary';
    btnB.className = 'btn-secondary';
    playClickSound();
    update();
  });

  update();
}
