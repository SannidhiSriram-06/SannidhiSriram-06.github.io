/* Tiny synthesised UI sounds (no audio files). On by default; browsers only allow sound after the first click or key press. */

const btn = document.getElementById('sound-toggle');
let on = true;
try { on = localStorage.getItem('sound') !== '0'; } catch (e) { /* private mode */ }
let ctx = null;

const paint = () => {
  if (!btn) return;
  btn.setAttribute('aria-pressed', String(on));
  btn.querySelector('.theme-toggle-label').textContent = on ? 'Sound on' : 'Sound off';
};

const audio = () => {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = ctx || new AC();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
};

function tone(freq, dur, type, vol, delay = 0, to = freq) {
  if (!on) return;
  const c = audio();
  if (!c) return;
  const t = c.currentTime + delay;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  osc.frequency.exponentialRampToValueAtTime(to, t + dur);
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(gain).connect(c.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

export const click = () => tone(660, 0.06, 'triangle', 0.05, 0, 440);
export const key = () => tone(1100 + Math.random() * 500, 0.025, 'square', 0.01);
export const alert = (level) => tone(level >= 10 ? 220 : 330, 0.1, 'sawtooth', 0.025);
export const done = () => [523, 659, 784].forEach((f, i) => tone(f, 0.14, 'sine', 0.05, i * 0.08));
export const swoosh = () => tone(200, 0.25, 'sine', 0.04, 0, 900);

paint();
btn?.addEventListener('click', () => {
  on = !on;
  try { localStorage.setItem('sound', on ? '1' : '0'); } catch (e) { /* ignore */ }
  paint();
  click();
});

document.addEventListener('click', (e) => {
  if (e.target.closest('a[href], button')) click();
});
