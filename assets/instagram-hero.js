(() => {
  const hero = document.querySelector('.hero-section');
  if (!hero) return;
  const holder = document.createElement('div');
  holder.className = 'hero-slides';
  holder.setAttribute('aria-hidden', 'true');
  hero.prepend(holder);
  const layers = [new Image(), new Image()];
  layers.forEach(img => { img.className = 'hero-slide'; img.alt = ''; holder.append(img); });
  const video = document.createElement('video');
  video.className = 'hero-slide hero-video'; video.muted = true; video.playsInline = true;
  video.loop = true; video.preload = 'none'; video.setAttribute('aria-hidden', 'true');
  holder.append(video);
  let videoMap = new Map();
  function syncVideo() {
    if (paused || document.hidden) video.pause();
    else if (video.classList.contains('is-visible')) video.play().catch(() => video.classList.remove('is-visible'));
  }
  document.addEventListener('visibilitychange', syncVideo);
  const control = document.createElement('button');
  control.type = 'button'; control.className = 'hero-pause';
  hero.append(control);
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let paused = motion.matches, active = 0, index = -1, busy = false;
  let sources = ['imagens/essa_mao.png', 'imagens/1.jpg', 'imagens/2.jpg', 'imagens/3.jpg', 'imagens/4.jpg'];
  function label() {
    control.textContent = paused ? '▶ Reproduzir' : 'Ⅱ Pausar';
    control.setAttribute('aria-label', paused ? 'Reproduzir fotos e vídeos' : 'Pausar fotos e vídeos');
  }
  control.addEventListener('click', () => { paused = !paused; label(); syncVideo(); });
  motion.addEventListener('change', e => { paused = e.matches; label(); syncVideo(); });
  label();
  async function showNext() {
    if (busy || !sources.length) return;
    busy = true;
    const nextIndex = (index + 1) % sources.length;
    const src = sources[nextIndex];
    try {
      // Do not fade the current photo until the replacement has loaded.
      await new Promise((resolve, reject) => {
        const preloader = new Image();
        const timeout = setTimeout(() => { preloader.onload = preloader.onerror = null; reject(); }, 8000);
        preloader.onload = () => { clearTimeout(timeout); resolve(); };
        preloader.onerror = () => { clearTimeout(timeout); reject(); };
        preloader.src = src;
      });
      const nextLayer = 1 - active;
      layers[nextLayer].src = src;
      layers[nextLayer].classList.add('is-visible');
      layers[active].classList.remove('is-visible');
      active = nextLayer;
      video.pause(); video.classList.remove('is-visible');
      video.removeAttribute('src'); video.load();
      const videoUrl = videoMap.get(src);
      if (videoUrl && !motion.matches && !paused && !document.hidden) {
        video.src = videoUrl;
        try {
          await Promise.race([video.play(), new Promise((_, reject) => setTimeout(reject, 6000))]);
          if (!paused && !document.hidden) video.classList.add('is-visible');
          else video.pause();
        } catch { video.pause(); } // Photo remains if playback is blocked.
      }
    } catch { /* Keep the current image or original CSS background. */ }
    index = nextIndex; busy = false;
  }
  let gallerySources = '';
  async function updateGallery(urls) {
    const grid = document.querySelector('#galeria .gallery-grid');
    const selected = urls.slice(0, 8);
    const key = JSON.stringify(selected);
    if (!grid || key === gallerySources) return;
    const images = await Promise.all(selected.map((src, i) => new Promise(resolve => {
      const img = new Image();
      img.alt = `Trabalho da Nicole Nails no Instagram — foto ${i + 1}`;
      img.decoding = 'async';
      const timeout = setTimeout(() => { img.onload = img.onerror = null; resolve(null); }, 8000);
      img.onload = () => { clearTimeout(timeout); resolve(img); };
      img.onerror = () => { clearTimeout(timeout); resolve(null); };
      img.src = src;
    })));
    const loaded = images.filter(Boolean);
    if (!loaded.length) return; // Preserve local gallery if new photos fail.
    const fragment = document.createDocumentFragment();
    loaded.forEach(img => {
      const item = document.createElement('div');
      item.className = 'gallery-item'; item.append(img); fragment.append(item);
    });
    grid.replaceChildren(fragment);
    // Retry failed photos on the next refresh.
    if (loaded.length === selected.length) gallerySources = key;
  }
  async function refresh() {
    try {
      const response = await fetch('/.netlify/functions/instagram', { signal: AbortSignal.timeout(10000) });
      if (!response.ok) return;
      const data = await response.json();
      const urls = (Array.isArray(data.items) ? data.items : [])
        .map(item => item.url).filter(url => typeof url === 'string' && url.startsWith('https://'));
      if (urls.length) {
        videoMap = new Map(data.items.filter(item => typeof item.video === 'string' && item.video.startsWith('https://')).map(item => [item.url, item.video]));
        await updateGallery(urls);
      }
      if (urls.length && JSON.stringify(urls) !== JSON.stringify(sources)) {
        sources = urls; index = -1;
        if (!paused && !document.hidden) showNext();
      }
    } catch { /* Local photos remain available if Instagram is disconnected. */ }
  }
  showNext(); refresh();
  setInterval(() => { if (!paused && !document.hidden && sources.length > 1) showNext(); }, 10000);
  setInterval(() => { if (!document.hidden) refresh(); }, 300000);
})();
