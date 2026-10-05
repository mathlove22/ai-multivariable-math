// 교재 기반 수학 공식 및 연산 유틸리티

// [표 Ⅲ-1] 공부 시간(x)에 따른 점수(y) 데이터 점 5개
export const SAMPLE_DATA = [
  { x: 1, y: 2 },
  { x: 2, y: 4 },
  { x: 3, y: 5 },
  { x: 4, y: 4 },
  { x: 5, y: 5 },
];

// 통계 기본 합계
export const STATS = {
  n: 5,
  sumX: 15,
  sumY: 20,
  sumX2: 55,
  sumY2: 86,
  sumXY: 66,
};

// 1. 단변수 모델: y = ax
export const Model1D = {
  // 손실함수 L(a) = (55a^2 - 132a + 86) / 5 = 11a^2 - 26.4a + 17.2
  loss(a) {
    return 11 * a * a - 26.4 * a + 17.2;
  },
  derivative(a) {
    return 22 * a - 26.4;
  },
  secondDerivative() {
    return 22;
  },
  optimalA: 1.2,
  minLoss: 1.36,
  predict(a, x) {
    return a * x;
  },
};

// 2. 이변수 모델: y = ax + b (교재 핵심 손실함수)
export const Model2D = {
  // L(a, b) = 11a^2 + b^2 + 6ab - 26.4a - 8b + 17.2
  loss(a, b) {
    return 11 * a * a + b * b + 6 * a * b - 26.4 * a - 8 * b + 17.2;
  },
  // 편도함수 ∂L/∂a = 22a + 6b - 26.4
  gradA(a, b) {
    return 22 * a + 6 * b - 26.4;
  },
  // 편도함수 ∂L/∂b = 6a + 2b - 8
  gradB(a, b) {
    return 6 * a + 2 * b - 8;
  },
  // 그래디언트 벡터 ∇L
  gradient(a, b) {
    return {
      da: this.gradA(a, b),
      db: this.gradB(a, b),
      norm: Math.hypot(this.gradA(a, b), this.gradB(a, b)),
    };
  },
  // 헤시안 행렬
  hessian() {
    return {
      H11: 22,
      H12: 6,
      H21: 6,
      H22: 2,
      det: 22 * 2 - 6 * 6, // 44 - 36 = 8 > 0
    };
  },
  optimalA: 0.6,
  optimalB: 2.2,
  minLoss: 0.48,
  predict(a, b, x) {
    return a * x + b;
  },

  // 경사하강법 1단계 전진 (a, b) <- (a, b) - eta * ∇L
  step(a, b, eta) {
    const ga = this.gradA(a, b);
    const gb = this.gradB(a, b);
    const nextA = a - eta * ga;
    const nextB = b - eta * gb;
    return {
      prev: { a, b, loss: this.loss(a, b), ga, gb },
      curr: { a: nextA, b: nextB, loss: this.loss(nextA, nextB) },
    };
  },
};

// 3. 교재 예제 함수: f(x, y) = x^2 + 3xy + 2y^2
export const ExampleFunction = {
  f(x, y) {
    return x * x + 3 * x * y + 2 * y * y;
  },
  df_dx(x, y) {
    return 2 * x + 3 * y;
  },
  df_dy(x, y) {
    return 3 * x + 4 * y;
  },
  gradient(x, y) {
    const gx = this.df_dx(x, y);
    const gy = this.df_dy(x, y);
    return { gx, gy, norm: Math.hypot(gx, gy) };
  },
  hessian() {
    return {
      fxx: 2,
      fxy: 3,
      fyx: 3,
      fyy: 4,
      det: 2 * 4 - 3 * 3, // 8 - 9 = -1 < 0 (안장점!)
    };
  },
};

// 4. 감자칩/안장점 실험 함수: f(x, y) = x^2 + kxy + y^2
export const ParametricSurface = {
  f(x, y, k) {
    return x * x + k * x * y + y * y;
  },
  gradient(x, y, k) {
    return {
      gx: 2 * x + k * y,
      gy: k * x + 2 * y,
    };
  },
  hessian(k) {
    const H11 = 2;
    const H12 = k;
    const H21 = k;
    const H22 = 2;
    const det = 4 - k * k;
    let type = '극소 (아래로 볼록 그릇)';
    let typeCode = 'min';
    if (det > 0 && H11 > 0) {
      type = '극소 (그릇 모양)';
      typeCode = 'min';
    } else if (det > 0 && H11 < 0) {
      type = '극대 (언덕 모양)';
      typeCode = 'max';
    } else if (det < 0) {
      type = '안장점 (말안장 감자칩 모양)';
      typeCode = 'saddle';
    } else {
      type = '판별 불가 (홈통/평평한 골짜기)';
      typeCode = 'degenerate';
    }
    return { H11, H12, H21, H22, det, type, typeCode };
  },
};

// 5. 지형 설계 대회 일반 2차 형식: f(x, y) = p x^2 + q xy + r y^2
export const QuadraticForm = {
  f(x, y, p, q, r) {
    return p * x * x + q * x * y + r * y * y;
  },
  gradient(x, y, p, q, r) {
    return {
      gx: 2 * p * x + q * y,
      gy: q * x + 2 * r * y,
    };
  },
  hessian(p, q, r) {
    const H11 = 2 * p;
    const H12 = q;
    const H21 = q;
    const H22 = 2 * r;
    const det = 4 * p * r - q * q;
    let type = '';
    let typeCode = '';
    let description = '';

    if (det > 0) {
      if (p > 0) {
        type = '극소점 (아래로 볼록한 그릇)';
        typeCode = 'min';
        description = '바닥이 오직 하나뿐인 그릇 지형입니다. 최솟값이 완벽하게 보장되어 AI 학습에 이상적입니다!';
      } else {
        type = '극대점 (위로 볼록한 언덕)';
        typeCode = 'max';
        description = '모든 방향에서 아래로 떨어지는 언덕 꼭대기입니다.';
      }
    } else if (det < 0) {
      type = '안장점 (말안장 감자칩 모양)';
      typeCode = 'saddle';
      description = '한 방향으로는 골짜기(극소), 다른 방향으로는 언덕(극대)인 지형입니다. 딥러닝에서 학습의 발이 묶이는 주요 원인입니다!';
    } else {
      type = '판별 불가 (홈통 또는 평평한 골짜기)';
      typeCode = 'degenerate';
      description = '최솟값이 점이 아니라 하나의 긴 직선(홈통 바닥)을 이룹니다. det H = 0인 경계 상태입니다.';
    }

    return { H11, H12, H21, H22, det, type, typeCode, description };
  },
};

// 6. 방향도함수 계산기: Du f = ∇f · u = gx * u1 + gy * u2
export function calcDirectionalDerivative(gx, gy, angleRad) {
  const u1 = Math.cos(angleRad);
  const u2 = Math.sin(angleRad);
  const slope = gx * u1 + gy * u2;
  const gradNorm = Math.hypot(gx, gy);
  const gradAngle = Math.atan2(gy, gx);
  const angleDiff = angleRad - gradAngle;
  return {
    u1,
    u2,
    slope,
    gradNorm,
    cosTheta: Math.cos(angleDiff),
    isMaxAscent: Math.abs(angleDiff) < 0.05,
    isMaxDescent: Math.abs(Math.abs(angleDiff) - Math.PI) < 0.05,
    isContourDirection: Math.abs(Math.abs(angleDiff) - Math.PI / 2) < 0.05,
  };
}
