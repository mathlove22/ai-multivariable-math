import './styles/theme.css';
import { ThreeViewer } from './visualizers/threeViewer.js';
import { ContourViewer } from './visualizers/contourViewer.js';
import { toggleSound, isSoundEnabled, playClickSound } from './utils/sound.js';

// Modules
import { renderModule0 } from './modules/module0_warmup.js';
import { renderModule1 } from './modules/module1_surface.js';
import { renderModule2 } from './modules/module2_partial.js';
import { renderModule3 } from './modules/module3_gradient.js';
import { renderModule4 } from './modules/module4_descent.js';
import { renderModule5 } from './modules/module5_hessian.js';
import { renderModule6 } from './modules/module6_saddle.js';
import { renderModule7 } from './modules/module7_quiz.js';

const modules = [
  renderModule0,
  renderModule1,
  renderModule2,
  renderModule3,
  renderModule4,
  renderModule5,
  renderModule6,
  renderModule7,
];

let activeModuleIndex = 0;
let threeViewer = null;
let contourViewer = null;

document.addEventListener('DOMContentLoaded', () => {
  const threeContainer = document.getElementById('three-container');
  const contourCanvas = document.getElementById('contour-canvas');
  const moduleContainer = document.getElementById('module-container');
  const tabButtons = document.querySelectorAll('.tab-btn');

  const btnSound = document.getElementById('btn-toggle-sound');
  const btnResetCam = document.getElementById('btn-reset-cam');
  const btnTopView = document.getElementById('btn-top-view');

  const progressFill = document.getElementById('header-progress-fill');
  const progressText = document.getElementById('header-progress-text');

  // 1. Initialize Visualizers
  threeViewer = new ThreeViewer(threeContainer);
  contourViewer = new ContourViewer(contourCanvas);

  // 2. Load Module Function
  function loadModule(index) {
    if (index < 0 || index >= modules.length) return;
    activeModuleIndex = index;

    // Update Tab UI
    tabButtons.forEach((btn, idx) => {
      if (idx === index) {
        btn.classList.add('active');
        btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      } else {
        btn.classList.remove('active');
      }
    });

    // Update Progress
    const progressPercent = Math.round(((index + 1) / modules.length) * 100);
    if (progressFill) progressFill.style.width = `${progressPercent}%`;
    if (progressText) progressText.textContent = `${index + 1}/${modules.length}`;

    // Clear and Render Module
    moduleContainer.innerHTML = '';
    modules[index](moduleContainer, { threeViewer, contourViewer });
  }

  // 3. Tab Click Events
  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const modIdx = parseInt(btn.dataset.mod, 10);
      playClickSound();
      loadModule(modIdx);
    });
  });

  // 4. Header Button Events
  if (btnSound) {
    btnSound.addEventListener('click', () => {
      const enabled = toggleSound();
      btnSound.textContent = enabled ? '🔊' : '🔇';
      playClickSound();
    });
  }

  if (btnResetCam) {
    btnResetCam.addEventListener('click', () => {
      playClickSound();
      threeViewer.resetCamera();
    });
  }

  if (btnTopView) {
    btnTopView.addEventListener('click', () => {
      playClickSound();
      threeViewer.setTopView();
    });
  }

  // Initial Load
  loadModule(0);
});
