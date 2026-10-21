(() => {
  'use strict';
  const headerActions = document.querySelector('.header-actions');
  if (!headerActions) return;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'music-toggle';
  button.setAttribute('aria-pressed', 'false');
  button.setAttribute('aria-label', 'Включить музыку');
  button.textContent = '♪ Музыка';
  const audio = new Audio('assets/flashing-lights-kanye-west.mp3');
  audio.loop = true;
  audio.preload = 'none';
  audio.volume = 0.35;
  const render = playing => {
    button.setAttribute('aria-pressed', String(playing));
    button.setAttribute('aria-label', playing ? 'Выключить музыку' : 'Включить музыку');
    button.textContent = playing ? 'Ⅱ Музыка' : '♪ Музыка';
  };
  button.addEventListener('click', async () => {
    if (audio.paused) {
      try { await audio.play(); render(true); }
      catch (_) { render(false); }
    } else { audio.pause(); render(false); }
  });
  audio.addEventListener('ended', () => render(false));
  headerActions.insertBefore(button, headerActions.querySelector('.header-telegram') || null);
})();
