/* ==========================================================================
   Hand Institut — mouvement
   GSAP + ScrollTrigger + SplitText + Lenis. Tout est amélioré progressivement :
   sans JS ou avec « réduire les animations », le site reste complet et lisible.
   ========================================================================== */
(() => {
  'use strict';

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const root = document.documentElement;
  const reduceMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
  const reduce = reduceMQ.matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hasGSAP = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  // Un changement de préférence en cours de visite : on recharge, plus simple et plus sûr.
  reduceMQ.addEventListener?.('change', () => window.location.reload());

  const safe = (name, fn) => {
    try { return fn(); } catch (err) { console.error(`[hand-institut] ${name}`, err); }
  };

  /* ------------------------------------------------------------------------
     Fonctions qui marchent sans animation
     ---------------------------------------------------------------------- */

  // Horaires, statut « ouvert maintenant », jour courant
  function initHours() {
    const table = $('#hours');
    const status = $('#openStatus');
    if (!table || !status) return;

    // minutes depuis minuit ; 0 = dimanche
    const schedule = { 0: null, 1: [570, 900], 2: [540, 1140], 3: null, 4: [540, 1140], 5: [540, 1140], 6: [540, 1050] };
    const dayNames = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
    const dayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    const fmt = (m) => `${Math.floor(m / 60)}h${String(m % 60).padStart(2, '0')}`;

    const parisNow = () => {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Europe/Paris', weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23'
      }).formatToParts(new Date());
      const get = (t) => parts.find((p) => p.type === t).value;
      return { day: dayMap[get('weekday')], min: parseInt(get('hour'), 10) * 60 + parseInt(get('minute'), 10) };
    };

    const render = () => {
      const { day, min } = parisNow();
      $$('tr[data-day]', table).forEach((tr) => tr.classList.toggle('is-today', Number(tr.dataset.day) === day));

      const today = schedule[day];
      let text;
      let open = false;
      if (today && min >= today[0] && min < today[1]) {
        open = true;
        text = `Ouvert maintenant · jusqu'à ${fmt(today[1])}`;
      } else if (today && min < today[0]) {
        text = `Fermé · ouvre aujourd'hui à ${fmt(today[0])}`;
      } else {
        text = 'Fermé';
        for (let i = 1; i <= 7; i += 1) {
          const d = (day + i) % 7;
          if (schedule[d]) {
            text = `Fermé · réouverture ${i === 1 ? 'demain' : dayNames[d]} à ${fmt(schedule[d][0])}`;
            break;
          }
        }
      }
      status.classList.toggle('is-open', open);
      status.querySelector('span').textContent = text;
    };
    render();
    window.setInterval(render, 60000);
  }

  // Année du pied de page
  function initYear() {
    const y = $('#year');
    if (y) y.textContent = String(new Date().getFullYear());
  }

  // Numéro de téléphone : chaque chiffre « roule » au survol
  function initPhoneRoll() {
    const ph = $('[data-phone]');
    if (!ph) return;
    const txt = ph.textContent.trim();
    ph.textContent = '';
    Array.from(txt).forEach((ch, i) => {
      if (ch === ' ') {
        const g = document.createElement('span');
        g.className = 'gap';
        g.setAttribute('aria-hidden', 'true');
        ph.appendChild(g);
        return;
      }
      const r = document.createElement('span');
      r.className = 'roll';
      r.setAttribute('aria-hidden', 'true');
      r.style.setProperty('--i', String(i));
      r.innerHTML = `<span>${ch}</span><span>${ch}</span>`;
      ph.appendChild(r);
    });
  }

  // Nuancier : on « pose » le vernis sur cinq ongles
  function initPolish() {
    const stage = $('#polishStage');
    if (!stage) return;
    const inputs = $$('input[name="polish"]');
    const nails = $$('.pnail', stage).map((el) => ({
      el, old: $('.pnail__old', el), neo: $('.pnail__new', el), color: null
    }));
    const nameEl = $('#polishName');
    const noteEl = $('#polishNote');
    const accent = $('#accentToggle');
    const shuffle = $('#shuffleBtn');
    let current = inputs.find((i) => i.checked) || inputs[0];

    const hexToRgba = (hex, a) => {
      const n = parseInt(hex.slice(1), 16);
      return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
    };

    const paint = (color, instant) => {
      stage.style.setProperty('--halo', hexToRgba(color, 0.3));
      nails.forEach((n, i) => {
        if (instant || !hasGSAP || reduce) {
          n.old.style.background = color;
          n.neo.style.background = color;
          if (hasGSAP) window.gsap.set(n.neo, { scaleY: 0 });
          n.color = color;
          return;
        }
        window.gsap.killTweensOf(n.neo);
        n.old.style.background = n.color || color;
        n.neo.style.background = color;
        n.color = color;
        window.gsap.fromTo(n.neo, { scaleY: 0 }, {
          scaleY: 1, duration: 0.85, ease: 'power3.out', delay: i * 0.08,
          onComplete: () => { n.old.style.background = color; window.gsap.set(n.neo, { scaleY: 0 }); }
        });
      });
    };

    const select = (input, instant) => {
      current = input;
      input.checked = true;
      nameEl.textContent = input.dataset.name;
      noteEl.textContent = input.dataset.note;
      paint(input.value, instant);
    };

    inputs.forEach((i) => i.addEventListener('change', () => select(i)));
    accent?.addEventListener('change', () => stage.classList.toggle('has-accent', accent.checked));
    shuffle?.addEventListener('click', () => {
      let next;
      do { next = inputs[Math.floor(Math.random() * inputs.length)]; } while (next === current);
      select(next);
    });
    select(current, true);
    stage._paint = () => select(current);
  }

  // Carrousel d'avis : glisser, boutons, clavier, lecture auto avec pause
  function initCarousel() {
    const region = $('#carousel');
    if (!region) return;
    const viewport = $('.carousel__viewport', region);
    const track = $('#carouselTrack');
    const slides = $$('.rev', track);
    const cur = $('#carCur');
    const dotsEl = $('#carDots');
    const btnPrev = $('#carPrev');
    const btnNext = $('#carNext');
    const btnPause = $('#carPause');
    const n = slides.length;
    let index = 0;
    let trackX = 0;
    let userPaused = reduce;
    let hovering = false;
    let visible = false;
    let timer = null;

    const dots = slides.map(() => {
      const d = document.createElement('i');
      dotsEl.appendChild(d);
      return d;
    });

    const xFor = (i) => {
      const s = slides[i];
      const lead = window.innerWidth < 900 ? (viewport.clientWidth - s.offsetWidth) / 2 : parseFloat(getComputedStyle(track).paddingLeft);
      return -(s.offsetLeft - lead);
    };
    const setX = (x, animate) => {
      trackX = x;
      if (hasGSAP && animate && !reduce) window.gsap.to(track, { x, duration: 1.15, ease: 'expo.out', overwrite: true });
      else if (hasGSAP) window.gsap.set(track, { x });
      else track.style.transform = `translate3d(${x}px,0,0)`;
    };
    const go = (i, animate = true) => {
      index = (i + n) % n;
      slides.forEach((s, k) => s.classList.toggle('is-active', k === index));
      dots.forEach((d, k) => d.classList.toggle('is-on', k === index));
      cur.textContent = String(index + 1);
      setX(xFor(index), animate);
      restart();
    };

    const tick = () => { if (!userPaused && !hovering && visible && !document.hidden) go(index + 1); };
    function restart() {
      window.clearInterval(timer);
      if (!userPaused) timer = window.setInterval(tick, 7500);
    }

    btnNext.addEventListener('click', () => go(index + 1));
    btnPrev.addEventListener('click', () => go(index - 1));
    btnPause.addEventListener('click', () => {
      userPaused = !userPaused;
      btnPause.setAttribute('aria-pressed', String(userPaused));
      btnPause.setAttribute('aria-label', userPaused ? 'Relancer le défilement automatique' : 'Mettre le défilement automatique en pause');
      restart();
    });
    btnPause.setAttribute('aria-pressed', String(userPaused));
    if (userPaused) btnPause.setAttribute('aria-label', 'Relancer le défilement automatique');

    region.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); go(index + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(index - 1); }
    });
    region.addEventListener('mouseenter', () => { hovering = true; });
    region.addEventListener('mouseleave', () => { hovering = false; });
    region.addEventListener('focusin', () => { hovering = true; });
    region.addEventListener('focusout', () => { hovering = false; });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0.35 }).observe(region);
    } else { visible = true; }

    // Glisser (souris, doigt, stylet)
    let startX = 0;
    let startTrack = 0;
    let dragging = false;
    let moved = 0;
    viewport.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      dragging = true; moved = 0; startX = e.clientX; startTrack = trackX;
      viewport.setPointerCapture(e.pointerId);
      if (hasGSAP) window.gsap.killTweensOf(track);
    });
    viewport.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      moved = Math.max(moved, Math.abs(dx));
      trackX = startTrack + dx;
      if (hasGSAP) window.gsap.set(track, { x: trackX }); else track.style.transform = `translate3d(${trackX}px,0,0)`;
    });
    const end = (e) => {
      if (!dragging) return;
      dragging = false;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 50) go(index + (dx < 0 ? 1 : -1)); else go(index);
    };
    viewport.addEventListener('pointerup', end);
    viewport.addEventListener('pointercancel', end);

    window.addEventListener('resize', () => setX(xFor(index), false));
    go(0, false);
    // les polices changent la hauteur / largeur : on recale quand tout est chargé
    window.addEventListener('load', () => setX(xFor(index), false));
    if (document.fonts?.ready) document.fonts.ready.then(() => setX(xFor(index), false));
  }

  // Menu mobile plein écran
  function initMenu() {
    const burger = $('#burger');
    const menu = $('#menu');
    if (!burger || !menu) return { close() {}, isOpen: () => false };
    let open = false;
    const links = $$('.menu li a', menu);
    const foot = $$('.menu__foot > *', menu);

    const setOpen = (v) => {
      open = v;
      burger.setAttribute('aria-expanded', String(v));
      burger.setAttribute('aria-label', v ? 'Fermer le menu' : 'Ouvrir le menu');
      menu.setAttribute('aria-hidden', String(!v));
      root.classList.toggle('menu-open', v);
      if (menu.inert !== undefined) menu.inert = !v;
      if (!hasGSAP || reduce) {
        menu.style.visibility = v ? 'visible' : 'hidden';
        menu.style.clipPath = v ? 'none' : '';
      } else if (v) {
        window.gsap.set(menu, { visibility: 'visible' });
        window.gsap.fromTo(menu, { clipPath: 'circle(0% at calc(100% - 2.6rem) 2.6rem)' }, { clipPath: 'circle(150% at calc(100% - 2.6rem) 2.6rem)', duration: 1, ease: 'expo.inOut' });
        window.gsap.fromTo(links, { yPercent: 110 }, { yPercent: 0, duration: 1.1, ease: 'expo.out', stagger: 0.07, delay: 0.35 });
        window.gsap.fromTo(foot, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: 'expo.out', stagger: 0.08, delay: 0.6 });
      } else {
        window.gsap.to(menu, { clipPath: 'circle(0% at calc(100% - 2.6rem) 2.6rem)', duration: 0.8, ease: 'expo.inOut', onComplete: () => window.gsap.set(menu, { visibility: 'hidden' }) });
      }
      window.__lenis?.[v ? 'stop' : 'start']();
      document.body.style.overflow = v && !window.__lenis ? 'hidden' : '';
    };
    menu.inert = true;
    burger.addEventListener('click', () => setOpen(!open));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && open) { setOpen(false); burger.focus(); } });
    window.matchMedia('(min-width: 900px)').addEventListener?.('change', (e) => { if (e.matches && open) setOpen(false); });
    return { close: () => open && setOpen(false), isOpen: () => open };
  }

  /* ------------------------------------------------------------------------
     Mouvement
     ---------------------------------------------------------------------- */
  function boot() {
    initYear();
    initHours();
    initPhoneRoll();
    initPolish();
    initCarousel();
    const menuApi = initMenu();
    safe('anchors', () => initAnchors(menuApi));

    const loader = $('#loader');
    if (!hasGSAP || reduce) {
      loader?.remove();
      document.documentElement.classList.add('is-ready');
      if (hasGSAP) safe('static-motion', initStaticMotion);
      return;
    }

    const { gsap, ScrollTrigger } = window;
    gsap.registerPlugin(ScrollTrigger, window.SplitText, window.DrawSVGPlugin);
    gsap.defaults({ ease: 'expo.out', duration: 1 });
    ScrollTrigger.config({ ignoreMobileResize: true });

    // Défilement fluide (Lenis) branché sur GSAP
    let lenis = null;
    if (typeof window.Lenis === 'function') {
      lenis = new window.Lenis({ lerp: 0.095, smoothWheel: true });
      window.__lenis = lenis;
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
      lenis.stop();
    } else {
      document.body.style.overflow = 'hidden';
    }

    // ---- Hero (créé en pause, joué quand le préchargeur s'ouvre)
    let heroTL = null;
    safe('hero', () => { heroTL = initHero(); });

    // ---- Sections
    const mm = gsap.matchMedia();
    mm.add({ desktop: '(min-width: 900px)', mobile: '(max-width: 899px)' }, (ctx) => {
      const { desktop } = ctx.conditions;
      safe('chrome', () => initChrome(menuApi));
      safe('text', () => initTextReveals());
      safe('hero-scroll', () => initHeroScroll(desktop));
      safe('marquees', () => initMarquees());
      safe('story', () => desktop && initStory());
      safe('services', () => initServices(desktop));
      safe('figures', () => initFigures());
      safe('polish-scroll', () => initPolishScroll());
      safe('salon', () => initSalon(desktop));
      safe('gallery', () => initGallery(desktop));
      safe('reviews', () => initReviewsScroll());
      safe('cta', () => initCta());
      safe('footer', () => initFooter());
      safe('magnetic', () => finePointer && initMagnetic());
      safe('cursor', () => finePointer && initCursor());
    });

    const reveal = () => {
      ScrollTrigger.refresh();
      lenis?.start();
      document.body.style.overflow = '';
      root.classList.add('is-ready');
    };

    runLoader(loader, () => heroTL && heroTL.play(0)).then(reveal).catch(reveal);
    window.addEventListener('load', () => ScrollTrigger.refresh());
    if (document.fonts?.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
  }

  /* ---- Préchargeur : un ongle qui se remplit de vernis, puis rideau courbe ---- */
  function runLoader(loader, onOpen) {
    const { gsap } = window;
    return new Promise((resolve) => {
      if (!loader) { onOpen(); resolve(); return; }
      const count = $('#loaderCount');
      const edge = $('.loader__edge', loader);
      const fill = $('.loader__fill', loader);
      const stroke = $('.loader__stroke', loader);
      const shine = $('.loader__shine', loader);
      const nameParts = $$('.loader__name span, .loader__name em', loader);
      const counter = { v: 0 };
      const setCount = () => { count.textContent = String(Math.round(counter.v)); };

      gsap.set(stroke, { drawSVG: '0%' });
      gsap.set(shine, { drawSVG: '0%' });
      gsap.set(fill, { attr: { y: 170 } });
      gsap.set(nameParts, { yPercent: 115 });

      const t0 = performance.now();
      const imgs = $$('.finger img').map((img) => (img.decode ? img.decode().catch(() => {}) : Promise.resolve()));
      const ready = Promise.race([
        Promise.all([document.fonts?.ready, ...imgs]),
        new Promise((r) => setTimeout(r, 5000))
      ]);

      const intro = gsap.timeline();
      intro.to(stroke, { drawSVG: '100%', duration: 1.0, ease: 'power2.inOut' }, 0)
        .to(nameParts, { yPercent: 0, duration: 1.1, stagger: 0.1 }, 0.15)
        .to(counter, { v: 82, duration: 1.0, ease: 'power2.out', onUpdate: setCount }, 0);

      ready.then(() => {
        const wait = Math.max(0, 1000 - (performance.now() - t0));
        gsap.delayedCall(wait / 1000, () => {
          const out = gsap.timeline({ onComplete: resolve });
          out.to(fill, { attr: { y: 0 }, duration: 0.85, ease: 'power3.inOut' }, 0)
            .to(counter, { v: 100, duration: 0.85, ease: 'power3.inOut', onUpdate: setCount }, 0)
            .to(shine, { drawSVG: '100%', duration: 0.6, ease: 'power2.out' }, 0.5)
            .to(nameParts, { yPercent: -115, duration: 0.6, ease: 'expo.in', stagger: 0.05 }, 0.95)
            .to('.loader__nail', { scale: 1.1, duration: 0.6, ease: 'expo.in' }, 0.95)
            .to(loader, {
              yPercent: -100,
              y: () => -edge.getBoundingClientRect().height,
              duration: 1.25,
              ease: 'expo.inOut',
            }, 1.15)
            .add(onOpen, 1.5)
            .set(loader, { display: 'none' });
        });
      });
    });
  }

  /* ---- Hero : intro + parallax multicouche ---- */
  function initHero() {
    const { gsap } = window;
    const tl = gsap.timeline({ paused: true, defaults: { ease: 'expo.out' } });
    const fingers = $$('.finger');
    tl.from('.hero__title .line__in', { yPercent: 118, duration: 1.6, stagger: 0.13 }, 0)
      .from('.hero__lead', { y: 34, opacity: 0, duration: 1.3 }, 0.35)
      .from('.hero__cta > *', { y: 30, opacity: 0, duration: 1.2, stagger: 0.1 }, 0.5)
      .from(fingers, { yPercent: 106, duration: 1.8, stagger: { each: 0.1, from: 'center' } }, 0)
      .from('.finger img', { scale: 1.4, duration: 2.4 }, 0)
      .from('.drop', { y: 70, opacity: 0, scale: 0.6, duration: 1.5, stagger: 0.12 }, 0.5)
      .from('.badge', { scale: 0.5, opacity: 0, rotate: -80, duration: 1.4 }, 0.8)
      .from('.hero__ring', { scale: 0.86, opacity: 0, duration: 2.2 }, 0)
      .from('#nav', { yPercent: -100, duration: 1.1 }, 0.55)
      .add(() => fingers.forEach((f, i) => window.setTimeout(() => f.classList.add('is-gloss'), 250 + i * 160)), 0.9);
    return tl;
  }

  function initHeroScroll(desktop) {
    const { gsap } = window;
    const hero = $('.hero');
    if (!hero) return;
    const st = { trigger: hero, start: 'top top', end: 'bottom top', scrub: true };

    // couches à vitesses différentes
    const speeds = desktop ? [-70, -150, -230, -120, -45] : [-20, -40, -60, -34, -14];
    $$('.finger').forEach((f, i) => gsap.to(f, { y: speeds[i], ease: 'none', scrollTrigger: st }));
    $$('.finger img').forEach((img) => gsap.fromTo(img, { yPercent: -4 }, { yPercent: 4, ease: 'none', scrollTrigger: st }));
    $$('.drop').forEach((d, i) => gsap.to(d, { y: (desktop ? -1 : -0.4) * [340, 200, 420][i], rotation: [14, -18, 10][i], ease: 'none', scrollTrigger: st }));
    gsap.to('.hero__copy', { y: desktop ? 90 : 30, opacity: 0.2, ease: 'none', scrollTrigger: st });
    gsap.to('.hero__ring', { rotation: 50, ease: 'none', scrollTrigger: st });
    gsap.to('.badge', { y: -80, ease: 'none', scrollTrigger: st });

    // parallax à la souris (bureau uniquement)
    if (desktop && finePointer) {
      const layers = [
        { el: $('.hand'), x: 16, y: 10 },
        { el: $('.hero__drops'), x: -42, y: -28 },
        { el: $('.hero__ring'), x: -14, y: -10 },
        { el: $('.hero__glow'), x: 24, y: 18 },
      ].filter((l) => l.el).map((l) => ({
        ...l,
        qx: gsap.quickTo(l.el, 'x', { duration: 1.2, ease: 'power3.out' }),
        qy: gsap.quickTo(l.el, 'y', { duration: 1.2, ease: 'power3.out' }),
      }));
      const move = (e) => {
        const nx = e.clientX / window.innerWidth - 0.5;
        const ny = e.clientY / window.innerHeight - 0.5;
        layers.forEach((l) => { l.qx(nx * l.x); l.qy(ny * l.y); });
      };
      hero.addEventListener('pointermove', move);
      return () => hero.removeEventListener('pointermove', move);
    }
    return undefined;
  }

  /* ---- Titres animés mot par mot (masque qui monte), paragraphes qui se lèvent ---- */
  function initTextReveals() {
    const { gsap } = window;
    const Split = window.SplitText;
    $$('[data-split]').forEach((el) => {
      if (!Split) return;
      Split.create(el, {
        type: 'lines, words',
        mask: 'lines',
        aria: /^H[1-6]$/.test(el.tagName) ? 'auto' : 'none',
        autoSplit: true,
        onSplit(self) {
          return gsap.from(self.words, {
            yPercent: 112,
            duration: 1.3,
            stagger: 0.07,
            ease: 'expo.out',
            scrollTrigger: { trigger: el, start: 'top 88%', once: true },
          });
        },
      });
    });
    $$('[data-fade]').forEach((el) => {
      gsap.from(el, { y: 34, opacity: 0, duration: 1.3, scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
    });
    $$('.services__intro p, .services__intro .link, .polish__copy > *:not(h2), .reviews__head p, .find__info > *:not(h2)').forEach((el) => {
      gsap.from(el, { y: 28, opacity: 0, duration: 1.2, scrollTrigger: { trigger: el, start: 'top 92%', once: true } });
    });
  }

  /* ---- Navigation, progression, bouton d'appel ---- */
  function initChrome(menuApi) {
    const { gsap, ScrollTrigger } = window;
    const nav = $('#nav');
    const bar = $('#progressBar');
    const fab = $('#fab');
    let hidden = false;
    const setProgress = gsap.quickSetter(bar, 'scaleX');

    ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (self) => {
        const y = self.scroll();
        setProgress(self.progress);
        nav.classList.toggle('is-solid', y > 40);
        fab?.classList.toggle('is-on', y > window.innerHeight * 0.7);
        if (menuApi.isOpen()) return;
        if (self.direction === 1 && y > 260 && !hidden) {
          hidden = true;
          gsap.to(nav, { yPercent: -115, duration: 0.7, ease: 'expo.out', overwrite: 'auto' });
        } else if ((self.direction === -1 || y < 120) && hidden) {
          hidden = false;
          gsap.to(nav, { yPercent: 0, duration: 0.7, ease: 'expo.out', overwrite: 'auto' });
        }
      },
    });
  }

  /* ---- Bandeaux défilants : vitesse et sens pilotés par le scroll ---- */
  function initMarquees() {
    const { gsap, ScrollTrigger } = window;
    const bands = $$('[data-marquee]');
    if (!bands.length) return;
    const items = [];

    bands.forEach((band) => {
      const dir = Number(band.dataset.marquee) || 1;
      const track = $('.marquee__track', band);
      const group = $('.marquee__group', track);
      if (!group.dataset.cloned) {
        const base = Array.from(group.children);
        let guard = 0;
        while (group.scrollWidth < window.innerWidth * 1.15 && guard < 6) {
          base.forEach((c) => group.appendChild(c.cloneNode(true)));
          guard += 1;
        }
        track.appendChild(group.cloneNode(true));
        group.dataset.cloned = '1';
      }
      const tween = gsap.fromTo(track, { xPercent: dir > 0 ? 0 : -50 }, { xPercent: dir > 0 ? -50 : 0, duration: 38, ease: 'none', repeat: -1 });
      items.push({ tween, dir, track, skew: gsap.quickSetter(band.querySelector('.marquee__track'), 'skewX', 'deg') });
    });

    let scrollDir = 1;
    let boost = 0;
    let skew = 0;
    ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (self) => {
        scrollDir = self.direction || scrollDir;
        const v = self.getVelocity();
        boost = clamp(Math.abs(v) / 160, 0, 9);
        skew = clamp(-v / 420, -9, 9);
      },
    });
    const tick = () => {
      boost *= 0.93;
      skew *= 0.9;
      items.forEach((it) => {
        const target = scrollDir * (1 + boost);
        it.tween.timeScale(it.tween.timeScale() + (target - it.tween.timeScale()) * 0.08);
        it.skew(skew * it.dir);
      });
    };
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }

  /* ---- Storytelling épinglé (bureau) ---- */
  function initStory() {
    const { gsap } = window;
    const story = $('.story');
    const pin = $('.story__pin');
    if (!story || !pin) return undefined;
    story.classList.add('is-pinned');

    const steps = $$('.step', story);
    const bgs = $$('.story__bgs i', story);
    const fill = $('.story__rail-fill', story);
    const num = $('#storyNum');
    const n = steps.length;
    const parts = steps.map((s) => ({ text: $('.step__text', s), media: $('.step__media', s), img: $('.step__media img', s) }));

    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: story,
        start: 'top top',
        end: `+=${n * 85}%`,
        pin,
        scrub: 0.7,
        anticipatePin: 1,
        refreshPriority: 3,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const idx = clamp(Math.floor(self.progress * n + 0.12), 0, n - 1);
          const label = `0${idx + 1}`;
          if (num.textContent !== label) num.textContent = label;
        },
      },
    });

    tl.to(fill, { scaleY: 1, duration: n }, 0);
    parts.forEach((p, i) => {
      if (i > 0) {
        const t = i - 0.38;
        tl.fromTo(p.text, { yPercent: 14, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.4, ease: 'power2.out' }, t + 0.16)
          .fromTo(p.media, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.5, ease: 'power2.inOut' }, t)
          .fromTo(p.img, { scale: 1.35 }, { scale: 1.04, duration: 0.9 }, t)
          .to(bgs[i], { opacity: 1, duration: 0.45 }, t);
      }
      if (i < n - 1) {
        // sortie nette avant l'entrée suivante : jamais deux textes superposés
        const t = i + 1 - 0.52;
        tl.to(p.text, { yPercent: -12, autoAlpha: 0, duration: 0.26, ease: 'power2.in' }, t)
          .to(p.media, { clipPath: 'inset(0% 0% 100% 0%)', duration: 0.42, ease: 'power2.inOut' }, t + 0.02);
      }
    });
    tl.to({}, { duration: 0.3 });
    return () => story.classList.remove('is-pinned');
  }

  /* ---- Prestations : défilement horizontal piloté par le scroll ---- */
  function initServices(desktop) {
    const { gsap } = window;
    const sec = $('.services');
    const pin = $('.services__pin');
    const track = $('.services__track');
    if (!sec || !track) return undefined;

    // dessin des icônes à l'apparition
    const drawIcons = (container, trigger) => {
      $$('.svc__icon', container).forEach((svg) => {
        const shapes = $$('path, rect, circle', svg);
        gsap.set(shapes, { drawSVG: '0%' });
        gsap.to(shapes, { drawSVG: '100%', duration: 1.8, stagger: 0.12, ease: 'power2.inOut', scrollTrigger: trigger(svg) });
      });
    };

    // inclinaison 3D + reflet qui suit la souris (partout où il y a un vrai pointeur)
    if (finePointer) {
      $$('.svc').forEach((card) => tilt(card, $('.svc__art', card), { max: 9, glare: true }));
    }

    if (!desktop) {
      drawIcons(sec, (svg) => ({ trigger: svg, start: 'top 90%', once: true }));
      return undefined;
    }

    sec.classList.add('is-hscroll');
    const dist = () => Math.max(0, track.scrollWidth - window.innerWidth);
    const bar = $('.services__bar i', sec);
    const hTween = gsap.to(track, {
      x: () => -dist(),
      ease: 'none',
      scrollTrigger: {
        trigger: sec,
        start: 'top top',
        end: () => `+=${dist()}`,
        pin,
        scrub: 1,
        anticipatePin: 1,
        refreshPriority: 2,
        invalidateOnRefresh: true,
        onUpdate: (self) => gsap.set(bar, { scaleX: self.progress }),
      },
    });

    // Navigation clavier : un élément focalisé hors écran ramène le scroll au bon endroit
    // (et on annule le décalage horizontal que le navigateur applique au conteneur masqué).
    pin.addEventListener('scroll', () => { pin.scrollLeft = 0; });
    track.addEventListener('focusin', (e) => {
      const st = hTween.scrollTrigger;
      const box = e.target.closest('.svc, .services__intro, .services__outro') || e.target;
      const x = clamp(box.offsetLeft - window.innerWidth * 0.12, 0, dist());
      const y = st.start + (x / (dist() || 1)) * (st.end - st.start);
      pin.scrollLeft = 0;
      if (window.__lenis) window.__lenis.scrollTo(y, { duration: 0.9 }); else window.scrollTo(0, y);
    });

    drawIcons(sec, (svg) => ({ trigger: svg.closest('.svc'), containerAnimation: hTween, start: 'left 82%', once: true }));
    $$('.svc').forEach((card) => {
      gsap.fromTo($('.svc__icon', card), { xPercent: 70 }, { xPercent: -70, ease: 'none', scrollTrigger: { trigger: card, containerAnimation: hTween, start: 'left right', end: 'right left', scrub: true } });
      gsap.from($('.svc__body', card), { y: 40, opacity: 0, duration: 1.2, scrollTrigger: { trigger: card, containerAnimation: hTween, start: 'left 85%', once: true } });
    });
    gsap.from('.services__outro > *', { y: 30, opacity: 0, duration: 1.2, stagger: 0.12, scrollTrigger: { trigger: '.services__outro', containerAnimation: hTween, start: 'left 85%', once: true } });
    return () => sec.classList.remove('is-hscroll');
  }

  /* ---- Chiffres clés : l'ongle se remplit de vernis pendant que le compteur monte ---- */
  function initFigures() {
    const { gsap } = window;
    const list = $('.figures__list');
    if (!list) return;
    const figs = $$('.fig', list);
    const tl = gsap.timeline({ scrollTrigger: { trigger: list, start: 'top 78%', once: true } });
    figs.forEach((fig, i) => {
      const fillEl = $('.fig__fill', fig);
      const b = $('[data-count]', fig);
      const to = Number(b.dataset.count);
      const o = { v: 0 };
      gsap.set(fillEl, { scaleY: 0 });
      b.textContent = '0';
      tl.to(fillEl, { scaleY: 1, duration: 2.2, ease: 'power3.inOut' }, i * 0.18)
        .to(o, { v: to, duration: 2.2, ease: 'power3.inOut', onUpdate: () => { b.textContent = String(Math.round(o.v)); } }, i * 0.18)
        .from($('.fig__nail', fig), { yPercent: 14, opacity: 0, duration: 1.4 }, i * 0.18)
        .from($('p', fig), { y: 20, opacity: 0, duration: 1.2 }, i * 0.18 + 0.5);
    });
  }

  /* ---- Nuancier : la main apparaît, le premier vernis se pose ---- */
  function initPolishScroll() {
    const { gsap } = window;
    const stage = $('#polishStage');
    if (!stage) return;
    const fingers = $$('.pfinger', stage);
    gsap.from(fingers, {
      yPercent: 100, duration: 1.5, stagger: 0.09, ease: 'expo.out',
      scrollTrigger: { trigger: stage, start: 'top 80%', once: true, onEnter: () => stage._paint && window.setTimeout(stage._paint, 700) },
    });
    gsap.to('.polish__halo', { yPercent: -12, ease: 'none', scrollTrigger: { trigger: stage, start: 'top bottom', end: 'bottom top', scrub: true } });
  }

  /* ---- Le salon : les deux battants de la porte s'ouvrent ---- */
  function initSalon(desktop) {
    const { gsap } = window;
    const sec = $('.salon');
    const pin = $('.salon__pin');
    if (!sec || !pin) return undefined;

    const revealText = () => gsap.from('.salon__text .lead, .salon__text p, .salon__facade', {
      y: 40, opacity: 0, duration: 1.3, stagger: 0.12,
      scrollTrigger: { trigger: '.salon__text', start: 'top 82%', once: true },
    });
    if (!desktop) {
      revealText();
      gsap.from('.salon__door', { yPercent: 8, opacity: 0, duration: 1.4, scrollTrigger: { trigger: '.salon__door', start: 'top 88%', once: true } });
      return undefined;
    }

    sec.classList.add('is-pinned');
    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: { trigger: pin, start: 'top top', end: '+=130%', pin, scrub: 0.7, anticipatePin: 1, refreshPriority: 1, invalidateOnRefresh: true },
    });
    tl.to('.salon__leaf--l', { xPercent: -104, ease: 'power2.inOut', duration: 0.7 }, 0.12)
      .to('.salon__leaf--r', { xPercent: 104, ease: 'power2.inOut', duration: 0.7 }, 0.12)
      .fromTo('.salon__room', { scale: 1.35 }, { scale: 1, duration: 0.9 }, 0.05)
      .fromTo('.salon__word--l', { xPercent: 0 }, { xPercent: -12, duration: 0.9 }, 0.1)
      .fromTo('.salon__word--r', { xPercent: 0 }, { xPercent: 12, duration: 0.9 }, 0.1)
      .to({}, { duration: 0.25 });
    revealText();
    gsap.from('.salon__word--l', { x: -90, opacity: 0, duration: 1.5, scrollTrigger: { trigger: pin, start: 'top 70%', once: true } });
    gsap.from('.salon__word--r', { x: 90, opacity: 0, duration: 1.5, scrollTrigger: { trigger: pin, start: 'top 70%', once: true } });
    return () => sec.classList.remove('is-pinned');
  }

  /* ---- Galerie : rideaux, cercle qui s'ouvre, parallax, inclinaison ---- */
  function initGallery(desktop) {
    const { gsap } = window;
    $$('.tile').forEach((tile) => {
      const frame = $('.tile__frame', tile);
      const img = $('img', frame);
      const kind = tile.dataset.reveal;
      const speed = Number(tile.dataset.speed) || 1;

      if (kind === 'circle') {
        gsap.fromTo(frame, { clipPath: 'circle(0% at 50% 50%)' }, {
          clipPath: 'circle(72% at 50% 50%)', duration: 1.8, ease: 'expo.out',
          scrollTrigger: { trigger: tile, start: 'top 85%', once: true },
        });
      } else {
        const cover = document.createElement('span');
        cover.className = 'tile__cover';
        cover.setAttribute('aria-hidden', 'true');
        frame.appendChild(cover);
        gsap.to(cover, {
          scaleY: 0, duration: 1.5, ease: 'expo.inOut',
          scrollTrigger: { trigger: tile, start: 'top 85%', once: true },
        });
      }
      gsap.fromTo(img, { scale: 1.45 }, { scale: 1.12, duration: 2.2, ease: 'expo.out', scrollTrigger: { trigger: tile, start: 'top 85%', once: true } });
      // l'image bouge doucement dans son cadre
      gsap.fromTo(img, { yPercent: -6 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: tile, start: 'top bottom', end: 'bottom top', scrub: true } });

      if (desktop) {
        const A = (speed - 1) * 420;
        gsap.fromTo(tile, { y: A / 2 }, { y: -A / 2, ease: 'none', scrollTrigger: { trigger: tile, start: 'top bottom', end: 'bottom top', scrub: true } });
      }
      if (finePointer) tilt(tile, frame, { max: 6 });
    });

    if (desktop) {
      gsap.fromTo('.gallery__word--1', { xPercent: -8 }, { xPercent: 10, ease: 'none', scrollTrigger: { trigger: '.gallery__word--1', start: 'top bottom', end: 'bottom top', scrub: true } });
      gsap.fromTo('.gallery__word--2', { xPercent: 12 }, { xPercent: -8, ease: 'none', scrollTrigger: { trigger: '.gallery__word--2', start: 'top bottom', end: 'bottom top', scrub: true } });
      gsap.fromTo('.gallery__word--3', { xPercent: -6 }, { xPercent: 8, ease: 'none', scrollTrigger: { trigger: '.gallery__word--3', start: 'top bottom', end: 'bottom top', scrub: true } });
    }
  }

  function initReviewsScroll() {
    const { gsap } = window;
    gsap.from('.carousel', { y: 70, opacity: 0, duration: 1.5, scrollTrigger: { trigger: '.carousel', start: 'top 88%', once: true } });
  }

  function initCta() {
    const { gsap } = window;
    gsap.from('.seal', { scale: 0.7, rotate: -40, opacity: 0, duration: 1.8, ease: 'expo.out', scrollTrigger: { trigger: '.seal', start: 'top 88%', once: true } });
    const roll = $$('.phone .roll');
    if (roll.length) {
      gsap.from(roll, { yPercent: 105, duration: 1.4, stagger: 0.05, scrollTrigger: { trigger: '.phone', start: 'top 92%', once: true } });
    }
  }

  function initFooter() {
    const { gsap } = window;
    const word = $('.footer__word > span');
    if (!word) return;
    gsap.from(word, { yPercent: 105, duration: 1.8, ease: 'expo.out', scrollTrigger: { trigger: '.footer__word', start: 'top 98%', once: true } });
    gsap.from('.footer__top > *', { y: 30, opacity: 0, duration: 1.2, stagger: 0.1, scrollTrigger: { trigger: '.footer__top', start: 'top 90%', once: true } });
  }

  /* ---- Micro-interactions ---- */
  function tilt(el, target, { max = 8, glare = false } = {}) {
    const { gsap } = window;
    gsap.set(target, { transformPerspective: 900, transformOrigin: '50% 50%' });
    const rx = gsap.quickTo(target, 'rotationX', { duration: 0.7, ease: 'power3.out' });
    const ry = gsap.quickTo(target, 'rotationY', { duration: 0.7, ease: 'power3.out' });
    el.addEventListener('pointermove', (e) => {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      const r = el.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width - 0.5;
      const ny = (e.clientY - r.top) / r.height - 0.5;
      ry(nx * max * 2);
      rx(-ny * max * 2);
      if (glare) {
        target.style.setProperty('--mx', `${(nx + 0.5) * 100}%`);
        target.style.setProperty('--my', `${(ny + 0.5) * 100}%`);
      }
    });
    el.addEventListener('pointerleave', () => { rx(0); ry(0); });
  }

  function initMagnetic() {
    const { gsap } = window;
    $$('[data-magnetic]').forEach((el) => {
      const inner = $('.btn__label, .seal__core', el);
      const xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3.out' });
      const yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3.out' });
      const ixTo = inner ? gsap.quickTo(inner, 'x', { duration: 0.6, ease: 'power3.out' }) : null;
      const iyTo = inner ? gsap.quickTo(inner, 'y', { duration: 0.6, ease: 'power3.out' }) : null;
      const strength = el.classList.contains('seal') ? 0.22 : 0.32;
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        xTo(dx * strength); yTo(dy * strength);
        if (ixTo) { ixTo(dx * strength * 0.5); iyTo(dy * strength * 0.5); }
      });
      el.addEventListener('pointerleave', () => {
        gsap.to(el, { x: 0, y: 0, duration: 1.1, ease: 'elastic.out(1, 0.4)', overwrite: 'auto' });
        if (inner) gsap.to(inner, { x: 0, y: 0, duration: 1.1, ease: 'elastic.out(1, 0.4)', overwrite: 'auto' });
      });
    });
  }

  function initCursor() {
    const { gsap } = window;
    const cur = $('#cursor');
    if (!cur) return;
    const label = $('.cursor__label', cur);
    const xTo = gsap.quickTo(cur, 'x', { duration: 0.35, ease: 'power3.out' });
    const yTo = gsap.quickTo(cur, 'y', { duration: 0.35, ease: 'power3.out' });
    let seen = false;
    window.addEventListener('pointermove', (e) => {
      if (!seen) { seen = true; gsap.set(cur, { x: e.clientX, y: e.clientY }); cur.classList.add('is-on'); }
      xTo(e.clientX); yTo(e.clientY);
    }, { passive: true });
    document.addEventListener('pointerover', (e) => {
      const t = e.target;
      if (!(t instanceof Element)) return;
      const withLabel = t.closest('[data-cursor]');
      cur.classList.toggle('has-label', Boolean(withLabel));
      if (withLabel) label.textContent = withLabel.dataset.cursor;
      cur.classList.toggle('is-link', !withLabel && Boolean(t.closest('a, button, label, input, summary')));
      cur.classList.toggle('on-dark', Boolean(t.closest('[data-dark]')));
    });
    document.documentElement.addEventListener('pointerleave', () => cur.classList.remove('is-on'));
    document.documentElement.addEventListener('pointerenter', () => seen && cur.classList.add('is-on'));
  }

  /* ---- Liens d'ancre : glissement fluide ---- */
  function initAnchors(menuApi) {
    $$('a[href^="#"]').forEach((a) => {
      a.addEventListener('click', (e) => {
        const hash = a.getAttribute('href');
        if (!hash || hash === '#') return;
        const target = hash === '#top' ? document.body : $(hash);
        if (!target) return;
        e.preventDefault();
        const wasOpen = menuApi.isOpen();
        menuApi.close();
        const go = () => {
          if (window.__lenis) {
            window.__lenis.scrollTo(hash === '#top' ? 0 : target, { duration: 1.9, easing: (t) => (t === 1 ? 1 : 1 - 2 ** (-10 * t)), offset: 0 });
          } else {
            target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
          }
          history.replaceState(null, '', hash);
        };
        if (wasOpen) window.setTimeout(go, 650); else go();
      });
    });
    $('#toTop')?.addEventListener('click', () => {
      if (window.__lenis) window.__lenis.scrollTo(0, { duration: 2.2, easing: (t) => (t === 1 ? 1 : 1 - 2 ** (-10 * t)) });
      else window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    });
  }

  /* ---- Mode « mouvement réduit » : on garde seulement le strict utile ---- */
  function initStaticMotion() {
    const nav = $('#nav');
    const fab = $('#fab');
    const onScroll = () => {
      nav.classList.toggle('is-solid', window.scrollY > 40);
      fab?.classList.toggle('is-on', window.scrollY > window.innerHeight * 0.7);
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const bar = $('#progressBar');
      if (bar && max > 0) bar.style.transform = `scaleX(${window.scrollY / max})`;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
