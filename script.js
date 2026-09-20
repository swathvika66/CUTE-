document.addEventListener('DOMContentLoaded', () => {
  // ========== STATE ==========
  let userNickname = 'Friend';
  let audioCtx = null;
  let currentStep = 1;
  const totalSteps = 5;

  // ========== DOM ELEMENTS ==========
  const mainLayout = document.getElementById('mainLayout');
  const nicknameInput = document.getElementById('nicknameInput');
  const nicknameError = document.getElementById('nicknameError');
  const nicknameBtn = document.getElementById('nicknameBtn');
  const revealBtn = document.getElementById('revealBtn');
  const finalOpt1 = document.getElementById('finalOpt1');
  const finalOpt2 = document.getElementById('finalOpt2');
  const jumpscareOverlay = document.getElementById('jumpscareOverlay');
  const creepyVoiceText = document.getElementById('creepyVoiceText');
  const creepyNickname = document.getElementById('creepyNickname');
  const prankResetBtn = document.getElementById('prankResetBtn');
  const bgVideo = document.getElementById('bgVideo');
  const progressDots = document.querySelectorAll('.quiz-dot');

  // ========== PRE-LOAD ==========
  if ('speechSynthesis' in window) {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
  }
  const horrorPreloader = new Image();
  horrorPreloader.src = 'horror.png';

  // ========== VIDEO GAZE TRACKING (Desktop) ==========
  const gazeFrames = [[0.037186,2.54167],[0.130722,2.58333],[0.234912,2.625],[0.321399,2.66667],[0.419378,2.70833],[0.493296,2.75],[0.597784,2.79167],[0.763067,2.83333],[0.778708,2.875],[0.878749,2.91667],[0.993308,2.95833],[1.262791,3.0],[1.388902,3.04167],[1.466609,0.25],[1.473318,0.29167],[1.520011,3.08333],[1.53824,0.33333],[1.6056,0.375],[1.640696,3.125],[1.691747,0.41667],[1.779194,0.45833],[1.869867,0.5],[1.984485,0.54167],[2.07265,0.58333],[2.183915,0.625],[2.267155,0.66667],[2.36138,0.70833],[2.44749,0.75],[2.517676,0.79167],[2.605329,0.83333],[2.670889,0.875],[2.809991,0.91667],[2.918365,0.95833],[3.134177,1.0],[3.240289,1.04167],[3.35949,1.08333],[3.464119,1.125],[3.549317,1.16667],[3.663539,1.20833],[3.78152,1.25],[3.878742,1.29167],[3.989446,1.33333],[4.066996,1.375],[4.225574,1.45833],[4.260255,1.41667],[4.276468,1.5],[4.404025,1.54167],[4.487075,1.58333],[4.552949,1.625],[4.628837,1.66667],[4.701131,1.70833],[4.773675,1.75],[4.833089,1.79167],[4.894145,1.83333],[4.962593,1.875],[5.028737,1.91667],[5.090028,1.95833],[5.212041,2.0],[5.28302,2.04167],[5.349352,2.08333],[5.412121,2.125],[5.473636,2.16667],[5.573871,2.20833],[5.656364,2.25],[5.759153,2.29167],[5.85261,2.33333],[5.938647,2.375],[6.048453,2.41667],[6.153327,2.45833],[6.222603,2.5]];

  const TAU = Math.PI * 2;
  const wrappedAngle = (angle) => (angle % TAU + TAU) % TAU;

  function timeForAngle(angle) {
    const target = wrappedAngle(angle);
    let nearestTime = gazeFrames[0][1];
    let nearestDistance = Infinity;
    for (const [sampleAngle, time] of gazeFrames) {
      const difference = Math.abs(target - sampleAngle);
      const distance = Math.min(difference, TAU - difference);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestTime = time;
      }
    }
    return nearestTime + 1 / 240;
  }

  // Video interaction setup
  let frame = 0;
  let desiredTime = 0;
  let pointer = null;
  let idleTimer = null;
  let idleAngle = 0;

  function seek() {
    frame = 0;
    if (!bgVideo || bgVideo.seeking) return;
    if (Math.abs(bgVideo.currentTime - desiredTime) > 1 / 48) {
      bgVideo.currentTime = Math.min(desiredTime, (bgVideo.duration || 7) - 1 / 24);
    }
  }
  function schedule() {
    if (!frame) frame = requestAnimationFrame(seek);
  }
  function updateTarget() {
    if (!pointer || !bgVideo) return;
    const rect = bgVideo.getBoundingClientRect();
    const scale = Math.max(rect.width / 1920, rect.height / 1080);
    const eyeX = rect.left + rect.width / 2 + (948 - 960) * scale;
    const eyeY = rect.top + rect.height / 2 + (418 - 540) * scale;
    const dx = pointer.x - eyeX;
    const dy = pointer.y - eyeY;
    if (Math.hypot(dx, dy) > 6) {
      desiredTime = timeForAngle(Math.atan2(dy, dx));
      schedule();
    }
  }
  function handlePointerMove(e) {
    pointer = { x: e.clientX, y: e.clientY };
    updateTarget();
  }
  function handleTouchMove(e) {
    if (e.touches && e.touches.length > 0) {
      pointer = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      updateTarget();
    }
  }
  function handleVideoReady() {
    if (!bgVideo) return;
    bgVideo.pause();
    updateTarget();
    schedule();
  }

  // Idle gentle eye movement for mobile when untouched
  function idleEyeLoop() {
    if (!pointer) {
      idleAngle = (idleAngle + 0.05) % (Math.PI * 2);
      desiredTime = timeForAngle(idleAngle);
      schedule();
    }
  }
  setInterval(idleEyeLoop, 200);

  if (bgVideo) {
    bgVideo.addEventListener('seeked', schedule);
    bgVideo.addEventListener('loadeddata', handleVideoReady);
    bgVideo.addEventListener('canplay', handleVideoReady);
    bgVideo.addEventListener('canplaythrough', handleVideoReady);
    
    // Pointer and mouse events
    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerdown', handlePointerMove, { passive: true });
    window.addEventListener('mousemove', handlePointerMove, { passive: true });
    
    // Touch events for mobile & tablets
    window.addEventListener('touchstart', handleTouchMove, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    
    window.addEventListener('resize', updateTarget);
    window.addEventListener('scroll', updateTarget, { passive: true });
    if (bgVideo.readyState >= 2) handleVideoReady();
  }

  // ========== QUIZ FLOW ==========
  // Update progress dots
  function updateProgress(step) {
    progressDots.forEach((dot, i) => {
      dot.classList.remove('active', 'done');
      if (i + 1 === step) dot.classList.add('active');
      else if (i + 1 < step) dot.classList.add('done');
    });
  }

  // Go to step
  function goToStep(step) {
    document.querySelectorAll('.quiz-step').forEach(el => el.classList.remove('active'));
    const nextEl = document.getElementById('step' + step);
    if (nextEl) {
      nextEl.classList.add('active');
      currentStep = step;
      updateProgress(step);
    }
  }

  // Step 1: Nickname
  function handleNicknameSubmit() {
    const val = nicknameInput.value.trim();
    if (!val) {
      nicknameError.classList.add('show');
      nicknameInput.focus();
      return;
    }
    nicknameError.classList.remove('show');
    userNickname = val;
    goToStep(2);
  }
  nicknameBtn.addEventListener('click', handleNicknameSubmit);
  nicknameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); handleNicknameSubmit(); }
  });

  // Steps 2-4: Option clicks advance to next step
  document.querySelectorAll('.quiz-option[data-step]').forEach(btn => {
    btn.addEventListener('click', () => {
      const step = parseInt(btn.dataset.step);
      btn.style.borderColor = '#080909';
      btn.style.background = '#f7f8fa';
      setTimeout(() => goToStep(step + 1), 220);
    });
  });

  // Step 5: Reveal or clicking options triggers JUMPSCARE
  if (revealBtn) revealBtn.addEventListener('click', triggerJumpscare);
  if (finalOpt1) finalOpt1.addEventListener('click', triggerJumpscare);
  if (finalOpt2) finalOpt2.addEventListener('click', triggerJumpscare);

  // ========== AUDIO ==========
  function getAudioContext() {
    if (!audioCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AC();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }

  function makeDistortionCurve(amount = 80) {
    const k = typeof amount === 'number' ? amount : 50;
    const n = 44100;
    const curve = new Float32Array(n);
    const deg = Math.PI / 180;
    for (let i = 0; i < n; ++i) {
      const x = (i * 2) / n - 1;
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }

  function playJumpscareAudio() {
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;

      // White noise crash
      const bufferSize = ctx.sampleRate * 2.5;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'highpass';
      noiseFilter.frequency.setValueAtTime(800, now);
      noiseFilter.frequency.exponentialRampToValueAtTime(3000, now + 0.4);
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(1.0, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 1.8);
      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noise.start(now);

      // Screaming oscillators
      [550, 784, 880, 1175, 1480].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();
        const dist = ctx.createWaveShaper();
        dist.curve = makeDistortionCurve(100);
        dist.oversample = '4x';
        osc.type = idx % 2 === 0 ? 'sawtooth' : 'square';
        osc.frequency.setValueAtTime(freq, now);
        osc.frequency.linearRampToValueAtTime(freq * (idx % 2 === 0 ? 1.4 : 0.6), now + 0.15);
        osc.frequency.exponentialRampToValueAtTime(150, now + 2.2);
        oscGain.gain.setValueAtTime(0.35, now);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + 2.5);
        osc.connect(dist);
        dist.connect(oscGain);
        oscGain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 2.6);
      });

      // Sub-bass boom
      const subOsc = ctx.createOscillator();
      const subGain = ctx.createGain();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(140, now);
      subOsc.frequency.exponentialRampToValueAtTime(25, now + 0.8);
      subGain.gain.setValueAtTime(1.0, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 1.6);
      subOsc.connect(subGain);
      subGain.connect(ctx.destination);
      subOsc.start(now);
      subOsc.stop(now + 1.7);

      // Creepy drone
      const droneOsc = ctx.createOscillator();
      const droneGain = ctx.createGain();
      droneOsc.type = 'triangle';
      droneOsc.frequency.setValueAtTime(65, now + 0.5);
      droneGain.gain.setValueAtTime(0.001, now);
      droneGain.gain.linearRampToValueAtTime(0.2, now + 1.2);
      droneGain.gain.exponentialRampToValueAtTime(0.001, now + 6.0);
      droneOsc.connect(droneGain);
      droneGain.connect(ctx.destination);
      droneOsc.start(now + 0.5);
      droneOsc.stop(now + 6.0);
    } catch (e) {
      console.warn('Audio error:', e);
    }
  }

  function speakHorrorMessage(nickname) {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const text = `Hiii... ${nickname || 'my friend'}... I see you... I am watching you...`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.pitch = 0.2;
    utterance.rate = 0.65;
    utterance.volume = 1.0;
    const voices = window.speechSynthesis.getVoices();
    const deepVoice = voices.find(v => v.lang.startsWith('en') && (v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('david') || v.name.toLowerCase().includes('george'))) || voices.find(v => v.lang.startsWith('en')) || voices[0];
    if (deepVoice) utterance.voice = deepVoice;
    setTimeout(() => window.speechSynthesis.speak(utterance), 120);
  }

  function triggerFullscreen() {
    const el = document.documentElement;
    if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
  }

  // ========== JUMPSCARE ==========
  function triggerJumpscare() {
    getAudioContext();
    if (mainLayout) mainLayout.style.display = 'none';

    const displayNick = (userNickname || 'YOU').toUpperCase();
    creepyVoiceText.textContent = 'HIIII...';
    creepyNickname.textContent = displayNick + '...';

    triggerFullscreen();
    jumpscareOverlay.classList.add('active');
    playJumpscareAudio();
    speakHorrorMessage(userNickname);
    setTimeout(() => playJumpscareAudio(), 1800);
  }

  // ========== RESET ==========
  prankResetBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    jumpscareOverlay.classList.remove('active');
    if (mainLayout) mainLayout.style.display = 'flex';
    nicknameInput.value = '';
    goToStep(1);
  });
});
