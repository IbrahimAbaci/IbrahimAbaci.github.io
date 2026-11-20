const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
const compactNavigation = window.matchMedia('(max-width: 820px)');
const languageChange = 'portfolio-language-change';
const interfaceCopy = {
  nl: {
    lightTheme: 'Schakel naar licht thema',
    darkTheme: 'Schakel naar donker thema',
    openMenu: 'Open navigatie',
    closeMenu: 'Sluit navigatie',
    copied: 'Gekopieerd',
    demo: {
      start: 'Start',
      replay: 'Opnieuw',
      initial: 'Hallo, wereld!',
      updated: 'Hallo, Den Haag!',
      base: 'basis',
      marked: 'gemarkeerd',
      ready: 'gereed',
      busy: 'bezig',
      working: 'De JavaScript-demo wordt uitgevoerd.',
      reading: 'Gelezen tekst:',
      complete: 'Demo klaar. De tekst is gewijzigd en gemarkeerd.'
    }
  },
  en: {
    lightTheme: 'Switch to light theme',
    darkTheme: 'Switch to dark theme',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    copied: 'Copied',
    demo: {
      start: 'Run',
      replay: 'Replay',
      initial: 'Hello, world!',
      updated: 'Hello, The Hague!',
      base: 'base',
      marked: 'highlighted',
      ready: 'ready',
      busy: 'running',
      working: 'Running the JavaScript demo.',
      reading: 'Text read:',
      complete: 'Demo complete. The text has been updated and highlighted.'
    }
  }
};

setUpTheme();
setUpNavigation();
setUpInferenceDemo(document.querySelector('[data-inference-demo]'));
setUpLab(document.querySelector('[data-ai-lab]'));
setUpSkills(document.querySelector('.skills-section'));
setUpContact();
setUpReveal();
setUpLanguage();

function currentCopy() {
  return interfaceCopy[document.documentElement.lang];
}

function setUpLanguage() {
  const root = document.documentElement;
  const buttons = document.querySelectorAll('[data-language-toggle]');
  const text = [...document.querySelectorAll('[data-en]')].map(element => {
    const node = [...element.childNodes].find(child => child.nodeType === Node.TEXT_NODE && child.textContent.trim());
    return { node, nl: node.textContent, en: element.dataset.en };
  });
  const labels = [...document.querySelectorAll('[data-en-label]')].map(element => ({
    element, nl: element.getAttribute('aria-label'), en: element.dataset.enLabel
  }));
  const description = document.querySelector('meta[name="description"]');
  const metadata = { nl: description.content, en: description.dataset.enContent };

  function applyLanguage(language) {
    root.lang = language;
    text.forEach(entry => { entry.node.textContent = entry[language]; });
    labels.forEach(entry => entry.element.setAttribute('aria-label', entry[language]));
    description.content = metadata[language];

    const target = language === 'nl' ? 'en' : 'nl';
    const targetName = target === 'en' ? 'English' : 'Nederlands';
    buttons.forEach(button => {
      button.lang = target;
      button.textContent = target.toUpperCase();
      button.setAttribute('aria-label', targetName);
      button.title = targetName;
      button.hidden = false;
    });
    document.dispatchEvent(new Event(languageChange));
  }

  buttons.forEach(button => button.addEventListener('click', () => {
    const language = button.lang;
    applyLanguage(language);
    try {
      localStorage.setItem('ibrahim-portfolio-language', language);
    } catch {}
  }));

  let saved;
  try {
    saved = localStorage.getItem('ibrahim-portfolio-language');
  } catch {}
  applyLanguage(saved === 'en' ? 'en' : 'nl');
}

function setUpTheme() {
  const button = document.querySelector('[data-theme-toggle]');
  const root = document.documentElement;
  const meta = document.querySelector('meta[name="theme-color"]');

  function updateButton() {
    const dark = root.dataset.theme === 'dark';
    const { lightTheme, darkTheme } = currentCopy();
    const label = dark ? lightTheme : darkTheme;
    button.setAttribute('aria-pressed', String(dark));
    button.setAttribute('aria-label', label);
    button.title = label;
    meta.content = dark ? '#111016' : '#f5f0e8';
  }

  button.addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    try {
      localStorage.setItem('ibrahim-portfolio-theme', root.dataset.theme);
    } catch {}
    updateButton();
  });

  document.addEventListener(languageChange, updateButton);
  updateButton();
}

function setUpNavigation() {
  const header = document.querySelector('[data-header]');
  const button = header.querySelector('[data-nav-toggle]');
  const nav = header.querySelector('[data-mobile-nav]');

  function updateMenuLabel() {
    const { openMenu, closeMenu } = currentCopy();
    button.setAttribute('aria-label', nav.inert ? openMenu : closeMenu);
  }

  function showMenu(open) {
    header.classList.toggle('menu-open', open);
    document.body.classList.toggle('nav-locked', open);
    button.setAttribute('aria-expanded', String(open));
    nav.inert = !open;
    updateMenuLabel();
    if (open) nav.querySelector('a').focus();
  }

  button.addEventListener('click', () => showMenu(nav.inert));
  nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => showMenu(false)));
  compactNavigation.addEventListener('change', () => showMenu(false));
  document.addEventListener(languageChange, updateMenuLabel);
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || nav.inert) return;
    showMenu(false);
    button.focus();
  });
}

function setUpInferenceDemo(demo) {
  const button = demo.querySelector('[data-demo-run]');
  const steps = [...demo.querySelectorAll('[data-demo-step]')];
  const status = demo.querySelector('[data-demo-status]');
  const state = demo.querySelector('[data-demo-state]');
  const result = demo.querySelector('[data-demo-text]');
  const classLabel = demo.querySelector('[data-demo-class]');
  let running = false;
  let phase = -1;

  function renderCopy() {
    const copy = currentCopy().demo;
    button.textContent = demo.classList.contains('is-complete') ? copy.replay : copy.start;
    result.textContent = phase >= 2 ? copy.updated : copy.initial;
    classLabel.textContent = phase >= 3 ? copy.marked : copy.base;
    state.textContent = running ? copy.busy : copy.ready;
    if (running) {
      status.textContent = phase === 1 ? `${copy.reading} ${result.textContent}` : copy.working;
    } else {
      status.textContent = phase >= 0 ? copy.complete : '';
    }
  }

  button.addEventListener('click', async () => {
    if (running) return;
    running = true;
    phase = -1;
    button.setAttribute('aria-disabled', 'true');
    demo.classList.remove('is-complete');
    result.classList.remove('is-marked');
    steps.forEach(step => step.classList.remove('is-active', 'is-done'));

    for (let index = 0; index < steps.length; index++) {
      const step = steps[index];
      phase = index;
      step.classList.add('is-active');
      if (phase === 3) result.classList.add('is-marked');
      renderCopy();
      if (!motionPreference.matches) await new Promise(resolve => setTimeout(resolve, 370));
      step.classList.remove('is-active');
      step.classList.add('is-done');
    }

    demo.classList.add('is-complete');
    button.removeAttribute('aria-disabled');
    running = false;
    renderCopy();
  });

  document.addEventListener(languageChange, renderCopy);
}

function setUpLab(lab) {
  const modes = {
    nl: {
      rag: {
        nodes: ['Vraag', 'Zoeken', 'Rangschikken', 'Antwoorden', 'Controleren'],
        result: 'Bronnen',
        note: 'Een antwoord met controleerbare bronverwijzingen.'
      },
      agent: {
        nodes: ['Document', 'Extraheren', 'Valideren', 'Beoordelen', 'Exporteren'],
        result: 'Review',
        note: 'Een reviewer beslist of de gecontroleerde gegevens worden geëxporteerd.'
      },
      voice: {
        nodes: ['Audio', 'Transcriberen', 'Analyseren', 'Samenvatten', 'Feedback'],
        result: 'Feedback',
        note: 'Feedback en samenvatting op basis van een transcript.'
      }
    },
    en: {
      rag: {
        nodes: ['Question', 'Retrieve', 'Rank', 'Answer', 'Verify'],
        result: 'Sources',
        note: 'An answer with verifiable citations.'
      },
      agent: {
        nodes: ['Document', 'Extract', 'Validate', 'Review', 'Export'],
        result: 'Review',
        note: 'A reviewer decides whether to export the validated data.'
      },
      voice: {
        nodes: ['Audio', 'Transcribe', 'Analyse', 'Summarise', 'Feedback'],
        result: 'Feedback',
        note: 'Feedback and a summary based on the transcript.'
      }
    }
  };
  const tablist = lab.querySelector('[data-lab-tablist]');
  const tabs = [...tablist.querySelectorAll('[data-lab-tab]')];
  const panel = lab.querySelector('#lab-panel');
  const voicePreview = panel.querySelector('[data-voice-preview]');
  const stage = lab.querySelector('[data-lab-stage]');
  const nodes = lab.querySelector('[data-lab-nodes]');
  const note = lab.querySelector('[data-lab-note]');
  const stat = lab.querySelector('[data-lab-stat]');
  let activeTab = tablist.querySelector('[aria-selected="true"]');

  function updateOrientation() {
    tablist.setAttribute('aria-orientation', compactNavigation.matches ? 'horizontal' : 'vertical');
  }

  function replay() {
    stage.classList.remove('is-running');
    voicePreview.classList.remove('is-playing');
    stage.getBoundingClientRect();
    stage.classList.add('is-running');
    voicePreview.classList.toggle('is-playing', !voicePreview.hidden);
  }

  function renderMode() {
    const id = activeTab.dataset.labTab;
    const mode = modes[document.documentElement.lang][id];
    voicePreview.hidden = id !== 'voice';
    const elements = mode.nodes.map((name, index) => {
      const node = document.createElement('div');
      const number = document.createElement('span');
      const title = document.createElement('strong');
      node.className = 'lab-node';
      number.textContent = String(index + 1).padStart(2, '0');
      title.textContent = name;
      node.append(number, title, document.createElement('i'));
      return node;
    });
    nodes.replaceChildren(...elements);
    stat.textContent = mode.result;
    note.textContent = mode.note;
  }

  function activate(tab) {
    activeTab = tab;
    tabs.forEach(item => {
      const selected = item === tab;
      item.setAttribute('aria-selected', String(selected));
      item.tabIndex = selected ? 0 : -1;
    });
    panel.setAttribute('aria-labelledby', tab.id);
    renderMode();
    replay();
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => activate(tab));
    tab.addEventListener('keydown', event => {
      const previous = compactNavigation.matches ? 'ArrowLeft' : 'ArrowUp';
      const next = compactNavigation.matches ? 'ArrowRight' : 'ArrowDown';
      const destinations = {
        [previous]: (index - 1 + tabs.length) % tabs.length,
        [next]: (index + 1) % tabs.length,
        Home: 0,
        End: tabs.length - 1
      };
      if (!Object.hasOwn(destinations, event.key)) return;
      event.preventDefault();
      const destination = tabs[destinations[event.key]];
      destination.focus();
      activate(destination);
    });
  });

  compactNavigation.addEventListener('change', updateOrientation);
  document.addEventListener(languageChange, renderMode);
  lab.querySelector('[data-lab-replay]').addEventListener('click', replay);
  updateOrientation();

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      replay();
      observer.disconnect();
    }, { threshold: 0.2 });
    observer.observe(lab);
  } else {
    replay();
  }
}

function setUpContact() {
  const button = document.querySelector('[data-copy-email]');
  const label = button.querySelector('[data-copy-label]');
  const email = button.dataset.copyEmail;
  let reset;

  button.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(email);
      label.textContent = currentCopy().copied;
      clearTimeout(reset);
      reset = setTimeout(() => { label.textContent = email; }, 1800);
    } catch {
      window.location.href = 'mailto:' + email;
    }
  });

  document.addEventListener(languageChange, () => {
    if (label.textContent !== email) label.textContent = currentCopy().copied;
  });
}

function setUpReveal() {
  const items = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window && !motionPreference.matches) {
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    }, { threshold: 0.12, rootMargin: '0px 0px -40px' });

    document.documentElement.classList.add('has-js');
    items.forEach(item => observer.observe(item));
    motionPreference.addEventListener('change', () => {
      if (!motionPreference.matches) return;
      document.documentElement.classList.remove('has-js');
      observer.disconnect();
    });
  }

  if (window.matchMedia('(pointer: fine)').matches) {
    const glow = document.querySelector('[data-cursor-glow]');
    window.addEventListener('pointermove', event => {
      if (motionPreference.matches) return;
      glow.style.setProperty('--pointer-x', event.clientX + 'px');
      glow.style.setProperty('--pointer-y', event.clientY + 'px');
    }, { passive: true });
  }
}

function setUpSkills(section) {
  const stage = section.querySelector('.skills-stage');
  const board = section.querySelector('.skills-board');
  const list = section.querySelector('.skills-list');
  const skills = [...list.children];
  const revealStep = 0.48 / skills.length;
  const header = document.querySelector('.site-header');
  const orbitMotion = window.matchMedia('(prefers-reduced-motion: no-preference) and (min-height: 30rem)');
  const clamp = number => Math.min(1, Math.max(0, number));
  let geometry;
  let frame = null;
  let lastProgress;

  function measure() {
    const animate = orbitMotion.matches && CSS.supports('overflow-x', 'clip');
    geometry = undefined;
    section.toggleAttribute('data-orbit', animate);
    if (!animate) return;

    const top = header.offsetHeight + 12;
    const viewport = window.innerHeight;
    const listHeight = list.offsetHeight;
    const restHeight = stage.offsetHeight - board.offsetHeight + listHeight;
    const availableBoard = viewport - top - (restHeight - listHeight) - 12;
    const boardHeight = Math.min(Math.max(listHeight, 320), availableBoard);
    const centerX = list.clientWidth / 2;
    const centerY = list.clientHeight / 2;
    const compact = list.clientWidth < 400;
    const badgeHeight = compact ? 28 : 36;

    const positions = skills.map((item, index) => {
      const label = item.querySelector('dt');
      const badgeWidth = label.offsetWidth + (compact ? 10 : 20);
      const baseAngle = (index - (skills.length - 1) / 2) * 2 * Math.PI / skills.length;
      // Leave more room for the longer labels at the bottom of the circle.
      const spread = (compact ? 0.19 : 0.14) * Math.sin(Math.PI * Math.min(Math.abs(baseAngle) / 1.4, 1));
      const angle = baseAngle + Math.sign(baseAngle) * spread;
      return {
        badgeWidth,
        widthScale: badgeWidth / item.offsetWidth,
        heightScale: badgeHeight / item.offsetHeight,
        homeX: item.offsetLeft + item.offsetWidth / 2,
        homeY: item.offsetTop + item.offsetHeight / 2,
        labelOffset: item.offsetHeight / 2 - label.offsetTop - label.offsetHeight / 2,
        unitX: Math.sin(angle),
        unitY: Math.cos(angle)
      };
    });

    const widestBadge = Math.max(...positions.map(position => position.badgeWidth));
    const radius = Math.min(centerX - widestBadge / 2 - 3, boardHeight / 2 - badgeHeight / 2 - 8);
    if (boardHeight < listHeight || radius < (compact ? 94 : 120)) {
      section.removeAttribute('data-orbit');
      return;
    }

    const lead = Math.round(Math.min(112, viewport * 0.18));
    const expansion = boardHeight - listHeight;
    // Reserve enough scroll to keep the open board pinned as it contracts.
    const travel = Math.max(260, Math.min(440, Math.round(viewport * 0.44)), Math.ceil(expansion * 2.5) - lead);
    section.style.setProperty('--skills-top', `${top}px`);
    section.style.setProperty('--skills-diameter', `${radius * 2}px`);
    section.style.setProperty('--skills-rest-height', `${restHeight}px`);
    section.style.setProperty('--skills-travel', `${travel}px`);
    geometry = {
      start: top + lead, distance: travel + lead, listHeight, expansion,
      centerX, centerY, radius, positions, popAmount: compact ? 0.04 : 0.12
    };
    lastProgress = undefined;
    requestDraw();
  }

  function draw() {
    frame = null;
    if (!geometry || !orbitMotion.matches) return;

    const { start, distance, listHeight, expansion, centerX, centerY, radius, positions, popAmount } = geometry;
    const progress = clamp((start - section.getBoundingClientRect().top) / distance);
    if (lastProgress === progress) return;
    lastProgress = progress;

    const flatten = clamp((progress - 0.56) / 0.37);
    const settle = flatten * flatten * (3 - 2 * flatten);
    section.style.setProperty('--orbit-opacity', 1 - settle);
    section.style.setProperty('--orbit-scale-x', 1 + 0.18 * settle);
    section.style.setProperty('--orbit-scale-y', 1 - 0.78 * settle);
    section.style.setProperty('--orbit-hint', 1 - clamp(progress / 0.17));
    section.style.setProperty('--skills-board-height', `${listHeight + expansion * (1 - settle)}px`);

    for (const [index, item] of skills.entries()) {
      const position = positions[index];
      // Each badge finishes popping before the next badge starts.
      const reveal = clamp((progress - index * revealStep) / (revealStep * 0.9));
      const arrival = 1 - (1 - reveal) ** 3;
      const pop = 0.68 + 0.32 * arrival + popAmount * Math.sin(Math.PI * reveal);
      const reach = radius * (0.8 + 0.2 * arrival);
      const circleX = centerX + position.unitX * reach;
      const circleY = centerY + position.unitY * reach;

      item.style.setProperty('--skill-opacity', clamp(2.5 * reveal));
      item.style.setProperty('--skill-pop', pop);
      item.style.setProperty('--skill-x', `${(circleX - position.homeX) * (1 - settle)}px`);
      item.style.setProperty('--skill-y', `${(circleY - position.homeY) * (1 - settle)}px`);
      item.style.setProperty('--skill-width', position.widthScale + (1 - position.widthScale) * settle);
      item.style.setProperty('--skill-height', position.heightScale + (1 - position.heightScale) * settle);
      item.style.setProperty('--skill-label-y', `${position.labelOffset * (1 - settle)}px`);
      item.style.setProperty('--skill-rating', clamp((settle - 0.3) / 0.7));
    }
  }

  function requestDraw() {
    if (frame === null && geometry) frame = requestAnimationFrame(draw);
  }

  window.addEventListener('scroll', requestDraw, { passive: true });
  if ('ResizeObserver' in window) {
    const resize = new ResizeObserver(measure);
    resize.observe(header);
    resize.observe(list);
  }
  window.addEventListener('resize', measure, { passive: true });
  orbitMotion.addEventListener('change', measure);
  document.addEventListener(languageChange, measure);
  measure();
}
