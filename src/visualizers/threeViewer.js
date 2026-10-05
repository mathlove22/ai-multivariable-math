import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export class ThreeViewer {
  constructor(containerElement) {
    this.container = containerElement;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.surfaceMesh = null;
    this.wireframeMesh = null;
    this.currentPointMesh = null;
    this.slicePlaneMesh = null;
    this.sliceCurveLine = null;
    this.tangentLine = null;
    this.gradientArrow = null;
    this.descentArrow = null;
    this.trajectoryGroup = null;

    this.gridResolution = 60;
    this.xMin = -0.5;
    this.xMax = 2.5;
    this.yMin = -1;
    this.yMax = 5;
    this.fn = (x, y) => x * x + y * y;
    this.scaleZ = 0.04;
    this.minZ = 0;
    this.maxZ = 10;

    this.animationId = null;
    this.init();
  }

  init() {
    const width = this.container.clientWidth || 500;
    const height = this.container.clientHeight || 380;

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x080d1a);

    // Camera
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    this.camera.position.set(4, 4.5, 5);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.container.appendChild(this.renderer.domElement);

    // Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxDistance = 25;
    this.controls.minDistance = 1.5;
    this.controls.target.set(0, 0, 0);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    this.scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x60a5fa, 1.2);
    dirLight1.position.set(5, 10, 7);
    this.scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xf472b6, 0.8);
    dirLight2.position.set(-5, -5, -5);
    this.scene.add(dirLight2);

    // Coordinates Grid Floor
    const gridHelper = new THREE.GridHelper(6, 12, 0x334155, 0x1e293b);
    gridHelper.position.y = -1.1;
    this.scene.add(gridHelper);

    // Groups
    this.trajectoryGroup = new THREE.Group();
    this.scene.add(this.trajectoryGroup);

    // Current point sphere
    const sphereGeo = new THREE.SphereGeometry(0.09, 32, 32);
    const sphereMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      roughness: 0.2,
      metalness: 0.8,
    });
    this.currentPointMesh = new THREE.Mesh(sphereGeo, sphereMat);
    this.currentPointMesh.visible = false;
    this.scene.add(this.currentPointMesh);

    window.addEventListener('resize', this.onResize.bind(this));
    this.animate();
  }

  onResize() {
    if (!this.container || !this.renderer) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  setSurface(fn, bounds = { xMin: -2, xMax: 2, yMin: -2, yMax: 2 }, scaleZ = 0.2) {
    this.fn = fn;
    this.xMin = bounds.xMin;
    this.xMax = bounds.xMax;
    this.yMin = bounds.yMin;
    this.yMax = bounds.yMax;
    this.scaleZ = scaleZ;

    if (this.surfaceMesh) {
      this.scene.remove(this.surfaceMesh);
      this.surfaceMesh.geometry.dispose();
      this.surfaceMesh.material.dispose();
    }
    if (this.wireframeMesh) {
      this.scene.remove(this.wireframeMesh);
      this.wireframeMesh.geometry.dispose();
      this.wireframeMesh.material.dispose();
    }

    const segments = this.gridResolution;
    const widthX = this.xMax - this.xMin;
    const heightY = this.yMax - this.yMin;

    const geometry = new THREE.PlaneGeometry(widthX, heightY, segments, segments);
    geometry.rotateX(-Math.PI / 2);

    const pos = geometry.attributes.position;
    const colors = [];
    const colorBottom = new THREE.Color(0x3b82f6); // blue
    const colorMid = new THREE.Color(0x10b981);    // emerald
    const colorHigh = new THREE.Color(0xf59e0b);   // amber
    const colorPeak = new THREE.Color(0xef4444);   // red

    let minZ = Infinity;
    let maxZ = -Infinity;

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i) + (this.xMin + this.xMax) / 2;
      const yVal = -pos.getZ(i) + (this.yMin + this.yMax) / 2;
      const z = fn(x, yVal);
      if (z < minZ) minZ = z;
      if (z > maxZ) maxZ = z;
    }

    this.minZ = minZ;
    this.maxZ = maxZ;
    const zRange = Math.max(0.001, maxZ - minZ);

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i) + (this.xMin + this.xMax) / 2;
      const yVal = -pos.getZ(i) + (this.yMin + this.yMax) / 2;
      const z = fn(x, yVal);
      const height3D = (z - minZ) * this.scaleZ - 1.0;
      pos.setY(i, height3D);

      const t = Math.max(0, Math.min(1, (z - minZ) / zRange));
      const c = new THREE.Color();
      if (t < 0.33) {
        c.lerpColors(colorBottom, colorMid, t / 0.33);
      } else if (t < 0.66) {
        c.lerpColors(colorMid, colorHigh, (t - 0.33) / 0.33);
      } else {
        c.lerpColors(colorHigh, colorPeak, (t - 0.66) / 0.34);
      }
      colors.push(c.r, c.g, c.b);
    }

    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.35,
      metalness: 0.15,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.88,
    });

    this.surfaceMesh = new THREE.Mesh(geometry, material);
    this.scene.add(this.surfaceMesh);

    // Wireframe overlay
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      wireframe: true,
      transparent: true,
      opacity: 0.08,
    });
    this.wireframeMesh = new THREE.Mesh(geometry, wireMat);
    this.scene.add(this.wireframeMesh);
  }

  // 3D 좌표 변환: 수학 좌표 (x, y, z) -> Three.js Vector3 (x, y, z)
  to3D(x, y, z) {
    const threeX = x - (this.xMin + this.xMax) / 2;
    const threeZ = -(y - (this.yMin + this.yMax) / 2);
    const threeY = (z - (this.minZ || 0)) * this.scaleZ - 1.0;
    return new THREE.Vector3(threeX, threeY, threeZ);
  }

  setCurrentPoint(x, y, showSphere = true) {
    const z = this.fn(x, y);
    const p3d = this.to3D(x, y, z);
    this.currentPointMesh.position.copy(p3d);
    this.currentPointMesh.visible = showSphere;
  }

  // 02 편미분 단면 평면, 단면 곡선, 접선 렌더링
  showSlice({ fixAxis, fixVal, curX, curY, slope }) {
    this.clearSlice();

    const totalZHeight = Math.max(2.5, (this.maxZ - this.minZ) * this.scaleZ + 1.2);
    const midZ = (this.minZ + this.maxZ) / 2;

    if (fixAxis === 'y') {
      // y = fixVal 고정 평면 (x 방향 미분 관찰)
      // 절단 평면: X축으로 펼쳐지고, Z위치는 fixVal의 위치
      const planeW = this.xMax - this.xMin + 0.4;
      const planeGeo = new THREE.PlaneGeometry(planeW, totalZHeight);
      const planeMat = new THREE.MeshBasicMaterial({
        color: 0x06b6d4, // Cyan
        transparent: true,
        opacity: 0.28,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      this.slicePlaneMesh = new THREE.Mesh(planeGeo, planeMat);

      // 중심 위치
      const center3D = this.to3D((this.xMin + this.xMax) / 2, fixVal, midZ);
      this.slicePlaneMesh.position.copy(center3D);
      this.scene.add(this.slicePlaneMesh);

      // 단면 곡선: x가 변함
      const steps = 70;
      const curvePoints = [];
      for (let i = 0; i <= steps; i++) {
        const xVal = this.xMin + (i / steps) * (this.xMax - this.xMin);
        const zVal = this.fn(xVal, fixVal);
        curvePoints.push(this.to3D(xVal, fixVal, zVal));
      }
      const curveGeo = new THREE.BufferGeometry().setFromPoints(curvePoints);
      const curveMat = new THREE.LineBasicMaterial({ color: 0xfacc15, linewidth: 3 });
      this.sliceCurveLine = new THREE.Line(curveGeo, curveMat);
      this.scene.add(this.sliceCurveLine);

      // 접선: (curX, fixVal)에서 x 방향으로의 기울기 slope = df/dx
      const curZ = this.fn(curX, fixVal);
      const dx = 0.7;
      const dz = slope * dx;
      const p1 = this.to3D(curX - dx, fixVal, curZ - dz);
      const p2 = this.to3D(curX + dx, fixVal, curZ + dz);

      const tanGeo = new THREE.BufferGeometry().setFromPoints([p1, p2]);
      const tanMat = new THREE.LineBasicMaterial({ color: 0xef4444, linewidth: 4 });
      this.tangentLine = new THREE.Line(tanGeo, tanMat);
      this.scene.add(this.tangentLine);
    } else {
      // x = fixVal 고정 평면 (y 방향 미분 관찰)
      // 절단 평면: Y(수학)축으로 펼쳐지고, X위치는 fixVal의 위치
      const planeW = this.yMax - this.yMin + 0.4;
      const planeGeo = new THREE.PlaneGeometry(planeW, totalZHeight);
      const planeMat = new THREE.MeshBasicMaterial({
        color: 0xec4899, // Pink
        transparent: true,
        opacity: 0.28,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      this.slicePlaneMesh = new THREE.Mesh(planeGeo, planeMat);
      this.slicePlaneMesh.rotation.y = Math.PI / 2; // 회전하여 Y축 방향으로 정렬

      const center3D = this.to3D(fixVal, (this.yMin + this.yMax) / 2, midZ);
      this.slicePlaneMesh.position.copy(center3D);
      this.scene.add(this.slicePlaneMesh);

      // 단면 곡선: y가 변함
      const steps = 70;
      const curvePoints = [];
      for (let i = 0; i <= steps; i++) {
        const yVal = this.yMin + (i / steps) * (this.yMax - this.yMin);
        const zVal = this.fn(fixVal, yVal);
        curvePoints.push(this.to3D(fixVal, yVal, zVal));
      }
      const curveGeo = new THREE.BufferGeometry().setFromPoints(curvePoints);
      const curveMat = new THREE.LineBasicMaterial({ color: 0xfacc15, linewidth: 3 });
      this.sliceCurveLine = new THREE.Line(curveGeo, curveMat);
      this.scene.add(this.sliceCurveLine);

      // 접선: (fixVal, curY)에서 y 방향으로의 기울기 slope = df/dy
      const curZ = this.fn(fixVal, curY);
      const dy = 0.7;
      const dz = slope * dy;
      const p1 = this.to3D(fixVal, curY - dy, curZ - dz);
      const p2 = this.to3D(fixVal, curY + dy, curZ + dz);

      const tanGeo = new THREE.BufferGeometry().setFromPoints([p1, p2]);
      const tanMat = new THREE.LineBasicMaterial({ color: 0xef4444, linewidth: 4 });
      this.tangentLine = new THREE.Line(tanGeo, tanMat);
      this.scene.add(this.tangentLine);
    }
  }

  clearSlice() {
    if (this.slicePlaneMesh) {
      this.scene.remove(this.slicePlaneMesh);
      this.slicePlaneMesh.geometry.dispose();
      this.slicePlaneMesh = null;
    }
    if (this.sliceCurveLine) {
      this.scene.remove(this.sliceCurveLine);
      this.sliceCurveLine.geometry.dispose();
      this.sliceCurveLine = null;
    }
    if (this.tangentLine) {
      this.scene.remove(this.tangentLine);
      this.tangentLine.geometry.dispose();
      this.tangentLine = null;
    }
  }

  showGradientArrows(x, y, gx, gy) {
    this.clearArrows();
    const z = this.fn(x, y);
    const origin = this.to3D(x, y, z);

    // 3D vector: dx along X, dy along -Z
    const dirUp = new THREE.Vector3(gx, 0, -gy).normalize();
    const dirDown = new THREE.Vector3(-gx, 0, gy).normalize();

    const len = 0.9;
    this.gradientArrow = new THREE.ArrowHelper(dirUp, origin, len, 0xf43f5e, 0.2, 0.1);
    this.descentArrow = new THREE.ArrowHelper(dirDown, origin, len, 0x10b981, 0.2, 0.1);

    this.scene.add(this.gradientArrow);
    this.scene.add(this.descentArrow);
  }

  clearArrows() {
    if (this.gradientArrow) {
      this.scene.remove(this.gradientArrow);
      this.gradientArrow = null;
    }
    if (this.descentArrow) {
      this.scene.remove(this.descentArrow);
      this.descentArrow = null;
    }
  }

  setTrajectory(points) {
    while (this.trajectoryGroup.children.length > 0) {
      const obj = this.trajectoryGroup.children[0];
      this.trajectoryGroup.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) obj.material.dispose();
    }

    if (!points || points.length < 1) return;

    const vec3s = points.map((pt) => this.to3D(pt.a, pt.b, pt.loss));

    if (vec3s.length > 1) {
      const lineGeo = new THREE.BufferGeometry().setFromPoints(vec3s);
      const lineMat = new THREE.LineBasicMaterial({
        color: 0x38bdf8,
        linewidth: 3,
      });
      const line = new THREE.Line(lineGeo, lineMat);
      this.trajectoryGroup.add(line);
    }

    vec3s.forEach((v, idx) => {
      const dotGeo = new THREE.SphereGeometry(idx === vec3s.length - 1 ? 0.08 : 0.04, 16, 16);
      const dotMat = new THREE.MeshStandardMaterial({
        color: idx === 0 ? 0xf59e0b : idx === vec3s.length - 1 ? 0xef4444 : 0x10b981,
        emissive: idx === vec3s.length - 1 ? 0x991b1b : 0x064e3b,
      });
      const dot = new THREE.Mesh(dotGeo, dotMat);
      dot.position.copy(v);
      this.trajectoryGroup.add(dot);
    });
  }

  resetCamera() {
    this.camera.position.set(4, 4.5, 5);
    this.camera.up.set(0, 1, 0);
    this.controls.target.set(0, 0, 0);
    this.controls.update();
  }

  // 2D 등고선과 완벽히 일치하는 Top View
  setTopView() {
    this.camera.position.set(0, 7.5, 0);
    // 화면 위쪽이 -Z (수학 y축 + 방향)이 되도록 up 벡터 설정!
    this.camera.up.set(0, 0, -1);
    this.controls.target.set(0, 0, 0);
    this.controls.update();
  }

  animate() {
    this.animationId = requestAnimationFrame(this.animate.bind(this));
    if (this.controls) this.controls.update();
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  destroy() {
    if (this.animationId) cancelAnimationFrame(this.animationId);
    window.removeEventListener('resize', this.onResize);
    if (this.renderer) {
      this.renderer.dispose();
      this.container.innerHTML = '';
    }
  }
}
