(() => {
  'use strict';
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const compact = window.matchMedia('(hover: none), (pointer: coarse)').matches;
  const saveData = Boolean(navigator.connection?.saveData);
  const allowed = () => !preference.matches && !saveData;
  if (allowed()) document.documentElement.classList.add('motion-ready');
  const format = new Intl.NumberFormat('ru-RU', {maximumFractionDigits: 0});
  const counters = Array.from(document.querySelectorAll('[data-count-to]')).map((element, index) => ({
    element,
    display: element.querySelector('.money-display'),
    target: Number(element.dataset.countTo),
    suffix: element.dataset.countSuffix || ' ₽',
    duration: compact ? 1650 + index % 2 * 200 : 2100 + index % 2 * 250,
    elapsed: 0,
    visible: false,
    started: false,
    done: false
  })).filter(state => state.display && Number.isFinite(state.target) && state.target >= 0);
  let frame = 0;
  let previousTime = null;
  const paint = (state, value) => {
    state.display.textContent = format.format(value) + state.suffix;
  };
  const finish = state => {
    state.done = true;
    state.elapsed = state.duration;
    paint(state, state.target);
    state.element.classList.remove('is-counting');
    state.element.classList.add('is-counted');
  };
  const running = () => allowed() && !document.hidden && counters.some(state => state.visible && !state.done);
  const stop = () => {
    if (frame) window.cancelAnimationFrame(frame);
    frame = 0;
    previousTime = null;
  };
  const tick = time => {
    frame = 0;
    if (!running()) { previousTime = null; return; }
    const delta = previousTime === null ? 0 : Math.min(64, Math.max(0, time - previousTime));
    previousTime = time;
    counters.forEach(state => {
      if (!state.visible || state.done) return;
      state.elapsed += delta;
      const progress = Math.min(1, state.elapsed / state.duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      paint(state, Math.min(state.target, Math.floor(state.target * eased)));
      if (progress === 1) finish(state);
    });
    if (running()) frame = window.requestAnimationFrame(tick);
    else previousTime = null;
  };
  const resume = () => {
    if (!frame && running()) frame = window.requestAnimationFrame(tick);
  };
  const hasObserver = 'IntersectionObserver' in window;
  if (hasObserver && allowed()) {
    const byElement = new Map(counters.map(state => [state.element, state]));
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const state = byElement.get(entry.target);
        state.visible = entry.isIntersecting;
        if (state.visible && !state.started && !state.done) {
          state.started = true;
          paint(state, 0);
          state.element.classList.add('is-counting');
        }
      });
      if (running()) resume(); else stop();
    }, {threshold: 0.45});
    counters.forEach(state => observer.observe(state.element));
  } else counters.forEach(finish);

  // Each card gets one light pass; hover tracking is limited to fine pointers.
  const surfaces = [];
  if (hasObserver && allowed()) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const surface = surfaces.find(item => item.element === entry.target);
        surface.visible = entry.isIntersecting;
        if (!surface.played && surface.visible && !document.hidden && allowed()) {
          surface.played = true;
          surface.animation = surface.sheen.animate?.([
            {transform: 'translateX(-70%)', opacity: 0},
            {transform: 'translateX(-30%)', opacity: 0.7, offset: 0.25},
            {transform: 'translateX(70%)', opacity: 0}
          ], {duration: compact ? 950 : 1350, easing: 'cubic-bezier(.2,.7,.2,1)', delay: surface.index % 3 * 90});
        }
        if (!surface.visible && surface.animation?.playState === 'running') surface.animation.pause();
        else if (!document.hidden && surface.animation?.playState === 'paused') surface.animation.play();
      });
    }, {threshold: 0.15});
    document.querySelectorAll('.dima-testimonial,.result-card,.start-card,.growth-path>li,.founder-card,.offer,.reviews-card,.brand-card,.conditions-grid>div,.steps>li,.values-grid>article').forEach((element, index) => {
      const effects = document.createElement('span');
      effects.className = 'surface-effects';
      effects.setAttribute('aria-hidden', 'true');
      const sheen = document.createElement('span');
      sheen.className = 'surface-sheen';
      const spotlight = document.createElement('span');
      spotlight.className = 'surface-spotlight';
      effects.append(sheen, spotlight);
      element.append(effects);
      element.classList.add('motion-surface');
      surfaces.push({element, sheen, index, visible: false, played: false, animation: null});
      observer.observe(element);
      if (compact) return;
      let pointerFrame = 0;
      let point;
      const clear = () => {
        if (pointerFrame) window.cancelAnimationFrame(pointerFrame);
        pointerFrame = 0;
        element.classList.remove('surface-active');
      };
      element.addEventListener('pointermove', event => {
        if (!allowed() || event.pointerType === 'touch') return;
        point = {x: event.clientX, y: event.clientY};
        if (pointerFrame) return;
        pointerFrame = window.requestAnimationFrame(() => {
          pointerFrame = 0;
          const rect = element.getBoundingClientRect();
          element.style.setProperty('--light-x', `${point.x - rect.left}px`);
          element.style.setProperty('--light-y', `${point.y - rect.top}px`);
          element.classList.add('surface-active');
        });
      }, {passive: true});
      element.addEventListener('pointerleave', clear);
      element.addEventListener('pointercancel', clear);
    });
  }

  const heroes = Array.from(document.querySelectorAll('.hero,.page-hero'));
  if (hasObserver && allowed()) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      entry.target.classList.toggle('ambient-visible', entry.isIntersecting);
    }));
    heroes.forEach(hero => observer.observe(hero));
  }
  // A brief, silent response to a real button press.
  document.querySelectorAll('.button').forEach(button => {
    button.classList.add('motion-button');
    button.addEventListener('pointerdown', event => {
      if (!allowed() || event.button > 0) return;
      const rect = button.getBoundingClientRect();
      const pulse = document.createElement('span');
      pulse.className = 'button-pulse';
      pulse.setAttribute('aria-hidden', 'true');
      pulse.style.left = `${event.clientX - rect.left}px`;
      pulse.style.top = `${event.clientY - rect.top}px`;
      button.querySelector('.button-pulse')?.remove();
      button.append(pulse);
      const animation = pulse.animate?.([{transform: 'translate(-50%,-50%) scale(0)', opacity: 0.45}, {transform: 'translate(-50%,-50%) scale(1)', opacity: 0}], {duration: 550, easing: 'ease-out'});
      if (animation) animation.onfinish = () => pulse.remove();
      else pulse.remove();
    });
  });
  const suspend = () => {
    stop();
    surfaces.forEach(surface => {
      if (surface.animation?.playState === 'running') surface.animation.pause();
    });
    heroes.forEach(hero => hero.classList.add('ambient-paused'));
  };
  const restore = () => {
    if (!allowed()) return;
    resume();
    surfaces.forEach(surface => {
      if (surface.visible && surface.animation?.playState === 'paused') surface.animation.play();
    });
    heroes.forEach(hero => hero.classList.remove('ambient-paused'));
  };
  document.addEventListener('visibilitychange', () => document.hidden ? suspend() : restore());
  window.addEventListener('pagehide', suspend);
  window.addEventListener('pageshow', restore);
  preference.addEventListener('change', () => {
    if (allowed()) return;
    stop();
    counters.forEach(finish);
    surfaces.forEach(surface => {
      surface.animation?.cancel();
      surface.element.classList.remove('surface-active');
    });
  });
  if (document.hidden) suspend();
})();
