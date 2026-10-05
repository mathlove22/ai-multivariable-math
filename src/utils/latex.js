import renderMathInElement from 'katex/contrib/auto-render';

export function renderMath(domEl) {
  if (!domEl) return;
  try {
    renderMathInElement(domEl, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '$', right: '$', display: false },
        { left: '\\(', right: '\\)', display: false },
        { left: '\\[', right: '\\]', display: true },
      ],
      throwOnError: false,
      errorColor: '#f43f5e',
    });
  } catch (err) {
    console.warn('LaTeX render warning:', err);
  }
}

// 하위 호환
export const renderMathInElementHelper = renderMath;
