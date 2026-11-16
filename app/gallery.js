'use strict';
(() => {
  const gallery = document.getElementById('gallery');
  const layers = [...document.querySelectorAll('.slide')];
  const welcome = document.getElementById('welcome');
  const message = document.getElementById('message');
  const startButton = document.getElementById('start');
  const controls = document.getElementById('controls');
  const caption = document.getElementById('caption');
  const title = document.getElementById('title');
  const artist = document.getElementById('artist');
  const credit = document.getElementById('credit');
  const clock = document.getElementById('clock');
  const infoButton = document.getElementById('info');
  const fullscreenButton = document.getElementById('fullscreen');
  const isTV = !!window.tizen;
  const localArt = /^[-\w]+\.jpg$/i;
  const clockFormat = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });
  const time = { slide: 13000, info: 6000, load: 3500, retry: 1000 };

  let active = false;
  let generation = 0;
  let playlist = [];
  let index = -1;
  let currentLayer = 1;
  let pending = null;
  let slideTimer, infoTimer, clockTimer;
  let armed = false;
  // True as soon as OFF is requested, so even an in-flight or failed OFF
  // request is paired with a restoration attempt when playback stops.
  let restoreNeeded = false;
  let protectionRequest = 0;

  function setProtection(enabled) {
    const api = window.webapis && window.webapis.appcommon;
    const states = api && api.AppCommonScreenSaverState;
    if (!states || typeof api.setScreenSaver !== 'function' || enabled !== restoreNeeded) return;
    const request = ++protectionRequest;
    restoreNeeded = !enabled;
    const fail = error => {
      // Retry restoration on the next lifecycle event if Samsung rejected it.
      if (enabled && request === protectionRequest) restoreNeeded = true;
      console.warn('Samsung screen protection request failed', error);
    };
    try {
      api.setScreenSaver(enabled ? states.SCREEN_SAVER_ON : states.SCREEN_SAVER_OFF, () => {}, fail);
    } catch (error) {
      fail(error);
    }
  }

  function cancelLoad() {
    if (!pending) return;
    const { img, timeout } = pending;
    pending = null;
    clearTimeout(timeout);
    img.onload = img.onerror = null;
    img.removeAttribute('src');
  }

  function canPlay() {
    return active && !document.hidden;
  }

  function pause() {
    clearTimeout(slideTimer);
    clearInterval(clockTimer);
    clockTimer = null;
    cancelLoad();
    setProtection(true);
  }

  function updateClock() {
    clock.textContent = clockFormat.format(new Date());
  }

  function setInfo(visible, exitArmed = false) {
    clearTimeout(infoTimer);
    armed = visible && exitArmed;
    gallery.classList.toggle('show-info', visible);
    caption.setAttribute('aria-hidden', String(!visible));
    infoButton.setAttribute('aria-pressed', String(visible));
    if (visible) {
      updateClock();
      infoTimer = setTimeout(() => setInfo(false), time.info);
    }
  }

  function showEmpty(text, focus = true) {
    active = false;
    generation++;
    pause();
    setInfo(false);
    for (const layer of layers) {
      layer.classList.remove('is-visible');
      layer.textContent = '';
    }
    message.textContent = text;
    welcome.hidden = false;
    controls.hidden = true;
    if (focus) startButton.focus();
  }

  function exitGallery() {
    if (isTV) {
      showEmpty('Gallery stopped.', false);
      try {
        window.tizen.application.getCurrentApplication().exit();
        return;
      } catch (error) { console.warn('Could not exit the TV app', error); }
    }
    showEmpty('A quiet gallery of fine art.');
  }

  function loadSlide(direction, remaining = playlist.length) {
    if (!canPlay() || !playlist.length) return;
    clearTimeout(slideTimer);
    cancelLoad();
    if (!remaining) {
      showEmpty('Artwork could not load. Check the bundled files and try again.');
      return;
    }
    index = (index + direction + playlist.length) % playlist.length;
    const entry = playlist[index];
    const img = new Image();
    img.alt = '';

    function handleError() {
      if (!pending || pending.img !== img) return;
      cancelLoad();
      // If the visible image cannot be replaced, stop suppressing protection
      // while searching for something else to display.
      setProtection(true);
      slideTimer = setTimeout(() => loadSlide(direction, remaining - 1), time.retry);
    }

    img.onload = () => {
      if (!pending || pending.img !== img || !canPlay()) return;
      clearTimeout(pending.timeout);
      pending = null;
      img.onload = img.onerror = null;
      currentLayer ^= 1;
      const layer = layers[currentLayer];
      layer.textContent = '';
      layer.appendChild(img);
      layers.forEach((candidate, i) => candidate.classList.toggle('is-visible', i === currentLayer));
      title.textContent = entry.title;
      artist.textContent = [entry.artist, entry.date].filter(Boolean).join(' · ');
      credit.textContent = entry.credit;
      setProtection(false);
      slideTimer = setTimeout(() => loadSlide(1), time.slide);
    };
    img.onerror = handleError;
    pending = { img, timeout: setTimeout(handleError, time.load) };
    img.src = 'assets/art/' + entry.file;
  }

  function resume() {
    if (!canPlay() || !playlist.length) return;
    if (clockTimer) return;
    updateClock();
    clockTimer = setInterval(updateClock, 10000);
    loadSlide(1);
  }

  async function start() {
    if (active) return;
    active = true;
    const session = ++generation;
    index = -1;
    playlist = [];
    welcome.hidden = true;
    controls.hidden = isTV;
    setInfo(false);
    try {
      const response = await fetch('assets/art/manifest.json');
      if (!response.ok) throw new Error('Artwork catalog unavailable');
      const items = await response.json();
      if (session !== generation) return;
      playlist = items.filter(item => item && localArt.test(item.file) && item.title && item.artist);
      if (!playlist.length) throw new Error('Artwork catalog empty');
    } catch (error) {
      if (session === generation) showEmpty('Gallery unavailable. Open the web preview over HTTP, or reinstall the TV app.');
      return;
    }
    setInfo(true);
    resume();
  }

  function move(direction) {
    if (!active) return;
    loadSlide(direction);
    if (gallery.classList.contains('show-info')) setInfo(true);
  }

  document.getElementById('previous').addEventListener('click', () => move(-1));
  document.getElementById('next').addEventListener('click', () => move(1));
  infoButton.addEventListener('click', () => setInfo(!gallery.classList.contains('show-info')));
  fullscreenButton.hidden = !document.fullscreenEnabled;
  fullscreenButton.addEventListener('click', () => {
    const action = document.fullscreenElement ? document.exitFullscreen() : gallery.requestFullscreen();
    action.catch(error => console.warn('Fullscreen unavailable', error));
    fullscreenButton.blur();
  });
  document.addEventListener('fullscreenchange', () => {
    const enabled = !!document.fullscreenElement;
    gallery.classList.toggle('is-fullscreen', enabled);
    fullscreenButton.setAttribute('aria-pressed', String(enabled));
  });
  startButton.addEventListener('click', start);

  document.addEventListener('keydown', event => {
    const key = event.key;
    const back = event.keyCode === 10009 || key === 'Escape' || key === 'Backspace' || key === 'GoBack' || key === 'BrowserBack';
    const enter = key === 'Enter' || key === 'Accept' || event.keyCode === 13;
    const left = key === 'ArrowLeft' || event.keyCode === 37;
    const right = key === 'ArrowRight' || event.keyCode === 39;
    if (!back && !left && !right && !(active && enter)) return;
    if (enter && !isTV && event.target instanceof Element && event.target.closest('button, a')) return;
    event.preventDefault();
    if (event.repeat) return;
    if (back) exitGallery();
    else if (left || right) move(left ? -1 : 1);
    else if (armed) exitGallery();
    else setInfo(true, true);
  });
  window.addEventListener('tizenhwkey', event => {
    if (event.keyName === 'back') exitGallery();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      pause();
      setInfo(false);
    } else {
      resume();
    }
  });
  window.addEventListener('pagehide', pause);
  window.addEventListener('pageshow', event => { if (event.persisted) resume(); });

  if (isTV) {
    const sdk = document.createElement('script');
    sdk.src = '$WEBAPIS/webapis/webapis.js';
    sdk.onload = () => {
      if (canPlay() && layers.some(layer => layer.classList.contains('is-visible'))) setProtection(false);
    };
    document.head.appendChild(sdk);
  } else {
    gallery.classList.add('is-browser');
    document.getElementById('project').hidden = false;
  }
  start();
})();
