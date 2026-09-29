const DISCORD_ID = '585868721768366101';
const LANYARD = `https://api.lanyard.rest/v1/users/${DISCORD_ID}`;

const $ = id => document.getElementById(id);
const avatar = $('avatar');
const displayName = $('display-name');
const userBadge = $('username-badge');
const bio = $('bio');
const statusDot = $('status-dot');
const playerEl = $('player');
const volumeSlider = $('volume');
const volLabel = $('vol-label');
const volIcon = $('vol-icon');
const audio = $('audio');
const banner = $('banner');

let copyTimeout = null;
userBadge.style.cursor = 'pointer';
userBadge.title = 'Kopyala';

userBadge.addEventListener('click', () => {
  const text = userBadge.dataset.username || userBadge.textContent;
  navigator.clipboard.writeText(text).catch(() => { });

  userBadge.textContent = 'Copied!';
  userBadge.classList.add('copied');

  clearTimeout(copyTimeout);
  copyTimeout = setTimeout(() => {
    userBadge.textContent = '@' + (userBadge.dataset.username || text.replace('@', ''));
    userBadge.classList.remove('copied');
  }, 1800);
});

function avatarUrl(id, hash, size = 256) {
  if (!hash) return `https://cdn.discordapp.com/embed/avatars/${Number(BigInt(id) >> 22n) % 6}.png`;
  const ext = hash.startsWith('a_') ? 'gif' : 'png';
  return `https://cdn.discordapp.com/avatars/${id}/${hash}.${ext}?size=${size}`;
}

function bannerUrl(id, hash, size = 4096) {
  if (!hash) return null;
  const ext = hash.startsWith('a_') ? 'gif' : 'png';
  return `https://cdn.discordapp.com/banners/${id}/${hash}.${ext}?size=${size}`;
}

function applyStatus(status) {
  statusDot.className = 'status-dot ' + (status || 'offline');
}

function applyData(data) {
  const u = data.discord_user;

  const aUrl = avatarUrl(u.id, u.avatar, 256);
  avatar.src = aUrl;

  const CUSTOM_BANNER = 'https://i.pinimg.com/1200x/56/ba/ae/56baae6240862cbf8090eb031c9eda5b.jpg';
  const bUrl = bannerUrl(u.id, u.banner, 4096) || CUSTOM_BANNER;
  banner.style.backgroundImage = `url("${bUrl}")`;

  const name = u.global_name || u.username;
  displayName.textContent = name;
  userBadge.textContent = '@' + u.username;
  userBadge.dataset.username = u.username;

  try {
    localStorage.setItem('cached_profile', JSON.stringify({
      avatar: aUrl,
      banner: bUrl || '',
      banner_color: u.banner_color || '',
      displayName: name,
      username: u.username
    }));
  } catch (e) { }

  applyStatus(data.discord_status);
}

function restoreFromCache() {
  try {
    const raw = localStorage.getItem('cached_profile');
    if (!raw) return;
    const c = JSON.parse(raw);
    if (c.avatar) avatar.src = c.avatar;
    if (c.banner) banner.style.backgroundImage = `url("${c.banner}")`;
    else if (c.banner_color) banner.style.backgroundColor = c.banner_color;
    if (c.displayName) displayName.textContent = c.displayName;
    if (c.username) {
      userBadge.textContent = '@' + c.username;
      userBadge.dataset.username = c.username;
    }
  } catch (e) { }
}

async function fetchProfile() {
  try {
    const res = await fetch(LANYARD);
    const json = await res.json();
    if (json.success) {
      applyData(json.data);
    }
  } catch (e) { }
}

function connectWS() {
  const ws = new WebSocket('wss://api.lanyard.rest/socket');
  let heartbeatInterval = null;

  ws.addEventListener('open', () => { });

  ws.addEventListener('message', e => {
    const msg = JSON.parse(e.data);

    if (msg.op === 1) {
      heartbeatInterval = setInterval(() => {
        ws.send(JSON.stringify({ op: 3 }));
      }, msg.d.heartbeat_interval);

      ws.send(JSON.stringify({
        op: 2,
        d: { subscribe_to_id: DISCORD_ID }
      }));
    }

    if (msg.op === 0 && msg.d) {
      applyData(msg.d);
    }
  });

  ws.addEventListener('close', () => {
    clearInterval(heartbeatInterval);
    setTimeout(connectWS, 5000);
  });

  ws.addEventListener('error', () => ws.close());
}

function initPlayer() {
  playerEl.style.display = 'flex';
  audio.volume = 0.30;
  let lastVolume = 30;

  function updateIcon(v) {
    if (!volIcon) return;
    volIcon.className = 'vol-icon bi';
    if (v === 0) {
      volIcon.classList.add('bi-volume-mute-fill');
    } else if (v < 35) {
      volIcon.classList.add('bi-volume-down-fill');
    } else {
      volIcon.classList.add('bi-volume-up-fill');
    }
  }

  function setVol(v) {
    audio.volume = v / 100;
    volumeSlider.value = v;
    volLabel.textContent = v + '%';
    updateTrack(v);
    updateIcon(v);
  }

  volumeSlider.addEventListener('mousedown', () => {
    if (audio.paused) audio.play().catch(() => { });
  });

  volumeSlider.addEventListener('input', () => {
    const v = parseInt(volumeSlider.value, 10);
    if (v > 0) lastVolume = v;
    setVol(v);
    if (audio.paused && v > 0) audio.play().catch(() => { });
  });

  if (volIcon) {
    volIcon.addEventListener('click', () => {
      if (audio.volume > 0) {
        lastVolume = parseInt(volumeSlider.value, 10) || 30;
        setVol(0);
      } else {
        setVol(lastVolume || 30);
        if (audio.paused) audio.play().catch(() => { });
      }
    });
  }

  function updateTrack(v) {
    volumeSlider.style.background =
      `linear-gradient(to right, rgba(255,255,255,0.85) ${v}%, rgba(255,255,255,0.15) ${v}%)`;
  }

  setVol(30);
}

const BIO_TEXTS = [
  "twizzy",
  "twizz",
  "tonka",
  "big tonka",
  "luh geek",
  "luh crank",
  "kranky",
  "shmunky",
  "shmunk",
  "turbonerd",
  "luh chönka",
  "chönka",
  "twizzy rich",
  "geeker",
  "geeked up",
  "geekin",
  "luh skeleton",
  "honeybun",
  "big body tonka",
  "luh bëttr",
  "twizzy corp",
  "luh rav3r",
  "geek pack",
  "perky",
  "wock",
  "blicky",
  "bell ring",
  "krank",
  "bootup",
  "booted up",
  "luh farti",
  "lyfë",
  "twizzy gang",
  "2093"
];

const SCRAMBLE_CHARS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?";

class TextScramble {
  constructor(el) {
    this.el = el;
    this.chars = SCRAMBLE_CHARS;
    this.update = this.update.bind(this);
  }

  setText(newText) {
    const oldText = this.el.textContent || '';
    const length = Math.max(oldText.length, newText.length);
    const promise = new Promise((resolve) => this.resolve = resolve);
    this.queue = [];

    for (let i = 0; i < length; i++) {
      const from = oldText[i] || '';
      const to = newText[i] || '';
      const start = Math.floor(Math.random() * 20);
      const end = start + Math.floor(Math.random() * 35) + 30;
      this.queue.push({ from, to, start, end, char: '' });
    }

    cancelAnimationFrame(this.frameRequest);
    this.frame = 0;
    this.update();
    return promise;
  }

  update() {
    let output = '';
    let complete = 0;

    for (let i = 0, n = this.queue.length; i < n; i++) {
      let { from, to, start, end, char } = this.queue[i];
      if (this.frame >= end) {
        complete++;
        output += to;
      } else if (this.frame >= start) {
        if (!char || Math.random() < 0.28) {
          char = this.chars[Math.floor(Math.random() * this.chars.length)];
          this.queue[i].char = char;
        }
        output += `<span class="scramble-char">${char}</span>`;
      } else {
        output += from;
      }
    }

    this.el.innerHTML = output;

    if (complete === this.queue.length) {
      if (this.resolve) this.resolve();
    } else {
      this.frameRequest = requestAnimationFrame(this.update);
      this.frame++;
    }
  }
}

let scrambler = null;
let bioIndex = 0;

function startBioCycle() {
  scrambler = new TextScramble(bio);
  scrambler.setText(BIO_TEXTS[0]);

  setInterval(() => {
    bioIndex = (bioIndex + 1) % BIO_TEXTS.length;
    scrambler.setText(BIO_TEXTS[bioIndex]);
  }, 3500);
}

function initHitmarker() {
  const hitAudio = new Audio('hitsound.wav');
  hitAudio.preload = 'auto';

  function playHitSound() {
    try {
      const soundClone = hitAudio.cloneNode();
      soundClone.volume = 0.55;
      soundClone.play().catch(() => { });
    } catch (e) { }
  }

  document.addEventListener('pointerdown', (e) => {
    playHitSound();

    const hm = document.createElement('div');
    hm.className = 'hitmarker';
    hm.style.left = `${e.clientX}px`;
    hm.style.top = `${e.clientY}px`;

    const inner = document.createElement('div');
    inner.className = 'hitmarker-inner';
    hm.appendChild(inner);

    document.body.appendChild(hm);

    setTimeout(() => {
      hm.remove();
    }, 400);
  });
}

function initEnterScreen() {
  const enterScreen = document.getElementById('enter-screen');
  const vid = document.getElementById('bg-video');
  if (!enterScreen) return;

  enterScreen.addEventListener('click', () => {
    enterScreen.classList.add('fade-out');

    if (audio) {
      audio.play().catch(() => { });
    }

    if (vid) {
      vid.play().catch(() => { });
    }

    setTimeout(() => {
      enterScreen.remove();
    }, 800);
  });
}

restoreFromCache();
fetchProfile();
connectWS();
initPlayer();
startBioCycle();
initHitmarker();
initEnterScreen();

requestAnimationFrame(() => {
  const profileCard = document.getElementById('profile-card');
  if (profileCard) profileCard.classList.add('show-card');
});
