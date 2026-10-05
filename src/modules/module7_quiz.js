import confetti from 'canvas-confetti';
import { QuadraticForm } from '../utils/math.js';
import { playClickSound, playSuccessSound, playDivergeSound } from '../utils/sound.js';
import { renderMath } from '../utils/latex.js';

export function renderModule7(container, { threeViewer, contourViewer }) {
  // 지형 설계 파라미터
  let paramP = 1.0;
  let paramQ = 1.0;
  let paramR = 1.0;

  // 퀴즈 문제 목록
  const quizzes = [
    {
      id: 1,
      difficulty: '하',
      question: '이변수 함수 $f(x, y) = 3x^2 y - 2y + 5$의 $x$에 대한 편도함수 $\\frac{\\partial f}{\\partial x}$는?',
      options: [
        '$6xy$',
        '$3x^2 - 2$',
        '$6x y - 2$',
        '$3x^2$'
      ],
      correct: 0,
      explanation: '$y$를 상수로 보고 $x$에 대해 미분하면, $3x^2 y$는 $6xy$가 되고 $-2y + 5$는 상수가 되어 $0$으로 사라집니다. 따라서 $\\frac{\\partial f}{\\partial x} = 6xy$입니다.'
    },
    {
      id: 2,
      difficulty: '중',
      question: '$z = x^2 + kxy + y^2$의 원점이 극소(그릇 바닥)가 되도록 하는 정수 $k$의 개수는?',
      options: [
        '1개',
        '2개',
        '3개',
        '4개',
        '5개'
      ],
      correct: 2,
      explanation: '헤시안 $H = \\begin{pmatrix} 2 & k \\\\[2pt] k & 2 \\end{pmatrix}$의 행렬식이 $\\det H = 4 - k^2 > 0$이어야 합니다. 따라서 $-2 < k < 2$이며, 이를 만족하는 정수는 $k = -1, 0, 1$의 3개입니다!'
    },
    {
      id: 3,
      difficulty: '하',
      question: '헤시안 행렬(Hessian Matrix)에 대한 설명 중 항상 옳은 것은?',
      options: [
        '일계 편미분들을 성분으로 한다.',
        '혼합 이계편미분이 같으므로 항상 대칭 행렬이다.',
        '대각 원소는 항상 양수이다.',
        '행렬식은 언제나 양수이다.'
      ],
      correct: 1,
      explanation: '클레로의 정리에 의해 다항함수에서 $\\frac{\\partial^2 f}{\\partial y \\partial x} = \\frac{\\partial^2 f}{\\partial x \\partial y}$이므로, 헤시안 행렬은 주대각선을 기준으로 대칭인 대칭 행렬입니다.'
    },
    {
      id: 4,
      difficulty: '중',
      question: '$f(x, y) = x^2 + 3xy + y^2$은 모든 계수($1, 3, 1$)가 양수입니다. 원점에서의 지형 유형은 무엇일까요?',
      options: [
        '극소점 (아래로 볼록한 그릇)',
        '극대점 (위로 볼록한 언덕)',
        '안장점 (말안장 감자칩 모양)',
        '판별 불가'
      ],
      correct: 2,
      explanation: '헤시안 $H = \\begin{pmatrix} 2 & 3 \\\\[2pt] 3 & 2 \\end{pmatrix}$에서 $\\det H = 2 \\times 2 - 3^2 = 4 - 9 = -5 < 0$입니다! 비대각의 얽힘($q=3$)이 축 방향 휘어짐을 압도하여 $y=-x$ 방향으로 내리막길이 뚫려 안장점이 됩니다.'
    }
  ];

  container.innerHTML = `
    <div class="pedagogy-panel">
      <!-- 1. 지형 설계 대회 -->
      <div class="concept-card">
        <div class="card-header">
          <div class="card-title-group">
            <span class="card-icon">🏗️</span>
            <span class="card-title">소단원 마무리: 나만의 지형 설계 대회</span>
          </div>
          <span class="card-tag tag-lab">Design Lab</span>
        </div>

        <p style="color: var(--text-muted); font-size: 0.88rem;">
          $f(x, y) = p x^2 + q xy + r y^2$은 원점에서 항상 $\\nabla f = (0, 0)$입니다.<br>
          계수 $p, q, r$을 직접 조절하여 <strong>극소, 극대, 안장점</strong> 지형을 직접 만들어 보세요!
        </p>

        <!-- p, q, r 슬라이더 -->
        <div class="control-row">
          <div class="control-label-group">
            <span>$x^2$ 계수 ($p$)</span>
            <span class="control-value" id="val-p">${paramP.toFixed(1)}</span>
          </div>
          <input type="range" id="slider-p" class="custom-slider" min="-3" max="3" step="0.5" value="${paramP}">
        </div>

        <div class="control-row">
          <div class="control-label-group">
            <span>$xy$ 얽힘 계수 ($q$)</span>
            <span class="control-value" id="val-q">${paramQ.toFixed(1)}</span>
          </div>
          <input type="range" id="slider-q" class="custom-slider" min="-4" max="4" step="0.5" value="${paramQ}">
        </div>

        <div class="control-row">
          <div class="control-label-group">
            <span>$y^2$ 계수 ($r$)</span>
            <span class="control-value" id="val-r">${paramR.toFixed(1)}</span>
          </div>
          <input type="range" id="slider-r" class="custom-slider" min="-3" max="3" step="0.5" value="${paramR}">
        </div>

        <!-- 실시간 헤시안 및 판별 대시보드 -->
        <div class="math-box highlight" id="designer-output-box">
          <!-- 동적 주입 -->
        </div>
      </div>

      <!-- 2. 실전 마스터 퀴즈 -->
      <div class="concept-card">
        <div class="card-header">
          <div class="card-title-group">
            <span class="card-icon">🏆</span>
            <span class="card-title">실전 개념 마스터 퀴즈</span>
          </div>
          <span class="card-tag tag-math">Test</span>
        </div>

        <div id="quiz-list-container">
          <!-- 퀴즈 렌더링 -->
        </div>
      </div>
    </div>
  `;

  renderMath(container);

  // 1. 지형 설계소 갱신
  function updateDesigner() {
    const valPEl = container.querySelector('#val-p');
    const valQEl = container.querySelector('#val-q');
    const valREl = container.querySelector('#val-r');
    const outBox = container.querySelector('#designer-output-box');

    if (valPEl) valPEl.textContent = paramP.toFixed(1);
    if (valQEl) valQEl.textContent = paramQ.toFixed(1);
    if (valREl) valREl.textContent = paramR.toFixed(1);

    const info = QuadraticForm.hessian(paramP, paramQ, paramR);
    const fn = (x, y) => QuadraticForm.f(x, y, paramP, paramQ, paramR);
    const gradFn = (x, y) => QuadraticForm.gradient(x, y, paramP, paramQ, paramR);

    outBox.innerHTML = `
      <div style="font-size: 0.9rem; color: #94a3b8; margin-bottom: 0.4rem;">
        헤시안: $H = \\begin{pmatrix} ${(2 * paramP).toFixed(1)} & ${paramQ.toFixed(1)} \\\\[4pt] ${paramQ.toFixed(1)} & ${(2 * paramR).toFixed(1)} \\end{pmatrix}$, 
        행렬식 $\\det H = 4pr - q^2 = \\mathbf{${info.det.toFixed(2)}}$
      </div>
      <div style="font-size: 1.15rem; font-weight: 700; color: ${info.typeCode === 'min' ? '#34d399' : info.typeCode === 'max' ? '#38bdf8' : '#f472b6'}; margin: 0.4rem 0;">
        판별 결과: ${info.type}
      </div>
      <div style="font-size: 0.85rem; color: #cbd5e1;">
        ${info.description}
      </div>
    `;

    renderMath(outBox);

    // 3D 뷰어 동기화
    threeViewer.setSurface(fn, { xMin: -2.5, xMax: 2.5, yMin: -2.5, yMax: 2.5 }, 0.12);
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

  // 2. 퀴즈 렌더링
  function renderQuizzes() {
    const quizContainer = container.querySelector('#quiz-list-container');
    if (!quizContainer) return;

    let html = '';
    quizzes.forEach((q, qIdx) => {
      html += `
        <div style="background: rgba(15, 23, 42, 0.6); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 1.15rem; margin-bottom: 1.25rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.6rem;">
            <strong style="color: #cbd5e1; font-size: 0.95rem;">문제 ${q.id}. [난이도: ${q.difficulty}]</strong>
          </div>
          <div style="font-size: 0.92rem; margin-bottom: 0.85rem;" class="quiz-question-text">
            ${q.question}
          </div>
          <div class="quiz-options" id="quiz-opts-${qIdx}">
            ${q.options
              .map(
                (opt, oIdx) => `
                <button class="quiz-option-btn" data-qid="${qIdx}" data-oid="${oIdx}">
                  <span style="display:inline-flex; width:20px; height:20px; border-radius:50%; background:rgba(255,255,255,0.1); align-items:center; justify-content:center; font-size:0.75rem;">
                    ${oIdx + 1}
                  </span>
                  <span>${opt}</span>
                </button>
              `
              )
              .join('')}
          </div>
          <div class="quiz-feedback" id="quiz-fb-${qIdx}">
            <!-- 정답 해설 들어갈 곳 -->
          </div>
        </div>
      `;
    });

    quizContainer.innerHTML = html;
    renderMath(quizContainer);

    // 퀴즈 버튼 클릭 리스너 바인딩
    quizzes.forEach((q, qIdx) => {
      const opts = quizContainer.querySelectorAll(`#quiz-opts-${qIdx} .quiz-option-btn`);
      const fb = quizContainer.querySelector(`#quiz-fb-${qIdx}`);

      opts.forEach((btn) => {
        btn.addEventListener('click', () => {
          const oid = parseInt(btn.dataset.oid, 10);
          opts.forEach((b) => (b.disabled = true));

          if (oid === q.correct) {
            btn.classList.add('correct');
            fb.className = 'quiz-feedback show correct-box';
            fb.innerHTML = `<strong>🎉 정답입니다!</strong><br>${q.explanation}`;
            playSuccessSound();
            confetti({
              particleCount: 50,
              spread: 60,
              origin: { y: 0.7 },
            });
          } else {
            btn.classList.add('wrong');
            opts[q.correct].classList.add('correct');
            fb.className = 'quiz-feedback show wrong-box';
            fb.innerHTML = `<strong>아쉽네요! 정답은 ${q.correct + 1}번입니다.</strong><br>${q.explanation}`;
            playDivergeSound();
          }
          renderMath(fb);
        });
      });
    });
  }

  // Event Listeners for Sliders
  const sliderP = container.querySelector('#slider-p');
  const sliderQ = container.querySelector('#slider-q');
  const sliderR = container.querySelector('#slider-r');

  sliderP.addEventListener('input', (e) => {
    paramP = parseFloat(e.target.value);
    playClickSound();
    updateDesigner();
  });

  sliderQ.addEventListener('input', (e) => {
    paramQ = parseFloat(e.target.value);
    playClickSound();
    updateDesigner();
  });

  sliderR.addEventListener('input', (e) => {
    paramR = parseFloat(e.target.value);
    playClickSound();
    updateDesigner();
  });

  updateDesigner();
  renderQuizzes();
}
