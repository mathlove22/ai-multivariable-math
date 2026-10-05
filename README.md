# ⛰️ AI 다변수 최적화 마스터 (AI Multivariable Math)

> **"안개 낀 AI 산맥에서 감자칩의 비밀까지"**  
> 고등학교/대학 초급 수준의 **고급 인공지능 수학** 단원인 **편미분, 그래디언트 벡터, 다변수 경사하강법, 헤시안 행렬, 안장점(말안장 감자칩)**의 핵심 개념을 직관적인 스토리와 3D/2D 인터랙티브 시각화로 완벽하게 이해할 수 있는 웹 애플리케이션입니다.

---

## 🌟 핵심 학습 모듈 (Curriculum)

1. **🚀 [00] 선수 학습: 1D에서 2D로의 필연적 도약**
   - 원점 고정 직선 $y = ax$의 한계 (최소 손실 1.36)
   - 절편 $b$를 준 $y = ax + b$의 기적 (손실 0.48로 1/3 토막)
   - 대가: 1D 곡선에서 3차원 손실 곡면 지형으로의 확장
2. **🌫️ [01] 안개 산과 등고선 (Contour Map)**
   - 안개 속 등산가 지호의 딜레마
   - 3D 곡면 $z = f(x, y)$와 2D 등고선 지도의 1:1 대응
   - 등고선의 촘촘함과 경사의 가파름
3. **🍰 [02] 편미분: 케이크 자르기 직관**
   - 한 번에 한 축씩 발 디뎌보기 (동서 vs 남북)
   - $\frac{\partial f}{\partial x}$ ($y$ 고정 수평단면), $\frac{\partial f}{\partial y}$ ($x$ 고정 수직단면)
   - 3D 절단 평면, 단면 포물선, 접선과 2D 등고선 절단선의 100% 동기화
4. **🧭 [03] 그래디언트 벡터와 360° 나침반**
   - 두 편미분을 묶은 벡터 $\nabla f = (\frac{\partial f}{\partial x}, \frac{\partial f}{\partial y})$
   - 360° 나침반을 회전하며 방향도함수 $D_u f = \nabla f \cdot u = |\nabla f|\cos\theta$ 실시간 측정
   - 그래디언트의 세 가지 얼굴: 최급오르막($\nabla f$), 최급내리막($-\nabla f$), 등고선과의 90° 직교
5. **⛷️ [04] 다변수 경사하강법 시뮬레이터**
   - 갱신 공식: $(a, b) \leftarrow (a, b) - \eta \nabla L(a, b)$
   - 교재 [표 Ⅲ-3]의 3걸음 손계산 ($17.2 \rightarrow 1.6464 \rightarrow 1.1047 \rightarrow 1.0669$) 소수 4자리 대조 검증
   - 60걸음을 걸어도 느린 **길쭉한 골짜기 딜레마** 및 학습률 $\eta$ 발산 실험
6. **📐 [05] 헤시안 행렬: 휘어짐(곡률)과 얽힘의 비밀**
   - $2 \times 2$ 헤시안 행렬 $H$와 클레로의 정리 (항상 대칭 행렬)
   - 대각 원소 22와 2 (11배 뾰족함 차이 때문에 $b$ 방향이 느렸던 이유 규명)
   - 비대각 원소 6 (두 변수의 얽힘으로 인해 등고선 타원이 비스듬히 기울어짐)
7. **🥔 [06] 감자칩 실험실: 극소 · 극대 · 안장점 (Saddle Point)**
   - 말안장 감자칩(프링글스)의 기하학
   - 행렬식 판별법 ($\det H = pr - q^2$)
   - $z = x^2 + kxy + y^2$에서 $k$ 슬라이더로 그릇 $\rightarrow$ 홈통 $\rightarrow$ 말안장 실시간 지형 몰핑
   - 심층 신경망(Deep Learning)에서의 거대한 난제: 안장점 문제
8. **🏆 [07] 지형 설계소 & 실전 마스터 퀴즈**
   - $f(x, y) = px^2 + qxy + ry^2$ 계수 튜닝 샌드박스
   - 단원 평가 및 교재 기출 퀴즈 (즉각 채점, 축하 효과, 상세 해설)

---

## 🛠️ 기술 스택 (Tech Stack)

- **Frontend**: Vanilla JavaScript (ES Modules), HTML5, CSS3 (Rich Dark Glassmorphism, Responsive Design)
- **3D Graphics**: [Three.js](https://threejs.org/) (OrbitControls, Parametric Shaded Surface, Dynamic Slice Planes & Tangent Lines)
- **2D Visualizer**: HTML5 Canvas (High-DPI Marching Squares Contour Generator, Vector Fields & Compasses)
- **Math Engine**: [KaTeX](https://katex.org/) (LaTeX Mathematical Notation)
- **Audio**: Web Audio API (Interactive Sound Synthesizer)
- **Build Tool**: [Vite](https://vitejs.dev/)

---

## 💻 로컬 실행 방법 (Getting Started)

```bash
# 1. 저장소 클론
git clone https://github.com/mathlove22/ai-multivariable-math.git
cd ai-multivariable-math

# 2. 의존성 패키지 설치
npm install

# 3. 로컬 개발 서버 실행
npm run dev
```

브라우저에서 `http://localhost:5173/`으로 접속하면 바로 이용할 수 있습니다.
