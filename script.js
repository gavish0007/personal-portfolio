// ---- subtle cursor-parallax tilt on the sketchbook (light 3D, desktop only) ----
(function () {
  const book = document.getElementById('book');
  if (!book) return;

  const isFinePointer = window.matchMedia('(pointer: fine)').matches;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!isFinePointer || reduceMotion) return;

  const stage = document.querySelector('.stage');
  let rafId = null;

  stage.addEventListener('mousemove', (e) => {
    const rect = stage.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 .. 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5;

    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => {
      const rotateY = x * 8;
      const rotateX = 4 - y * 6;
      book.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });
  });

  stage.addEventListener('mouseleave', () => {
    book.style.transform = 'rotateX(4deg) rotateY(0deg)';
  });
})();

// ---- gentle drift for floating icons ----
(function () {
  const drifters = document.querySelectorAll('.drift');
  if (!drifters.length) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  drifters.forEach((el, i) => {
    const duration = 6 + i * 1.5;
    el.animate(
      [
        { transform: 'translate(0px, 0px)' },
        { transform: `translate(${8 + i * 3}px, ${-10 - i * 4}px)` },
        { transform: 'translate(0px, 0px)' }
      ],
      { duration: duration * 1000, iterations: Infinity, easing: 'ease-in-out' }
    );
  });
})();
