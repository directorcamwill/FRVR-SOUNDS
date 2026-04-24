/**
 * BPM + musical key detection on mono Float32 PCM.
 *
 * Pure JS, no deps. Tuned for 22050 Hz mono input.
 *
 *   BPM — RMS onset envelope → autocorrelation in the 60–180 BPM band.
 *   Key — Goertzel-based chroma over 4 octaves → correlation against 24
 *         Krumhansl-Kessler key profiles (12 major + 12 minor).
 *
 * Both return a null result with 0 confidence on degenerate input
 * (silence, clipped, too short).
 */

const TARGET_SR = 22050;

export interface BpmResult {
  bpm: number | null;
  confidence: number;
}

export interface KeyResult {
  key: string | null;
  confidence: number;
}

// ─── BPM ──────────────────────────────────────────────────────────────────

export function detectBpm(pcm: Float32Array, sampleRate: number): BpmResult {
  const samples = resample(pcm, sampleRate, TARGET_SR);
  const frameSize = 1024;
  const hop = 512;
  if (samples.length < frameSize * 8) return { bpm: null, confidence: 0 };

  // RMS per frame → rough loudness envelope.
  const numFrames = Math.floor((samples.length - frameSize) / hop);
  const env = new Float32Array(numFrames);
  for (let f = 0; f < numFrames; f++) {
    let sumSq = 0;
    const start = f * hop;
    for (let i = 0; i < frameSize; i++) {
      const v = samples[start + i];
      sumSq += v * v;
    }
    env[f] = Math.sqrt(sumSq / frameSize);
  }

  // Half-wave rectified first-order difference → onset novelty.
  const novelty = new Float32Array(numFrames);
  for (let i = 1; i < numFrames; i++) {
    const d = env[i] - env[i - 1];
    novelty[i] = d > 0 ? d : 0;
  }
  // Light normalization (subtract mean, avoid all-silence divide-by-zero).
  let mean = 0;
  for (let i = 0; i < novelty.length; i++) mean += novelty[i];
  mean /= novelty.length || 1;
  for (let i = 0; i < novelty.length; i++) novelty[i] = novelty[i] - mean;

  const framesPerSec = TARGET_SR / hop; // ≈ 43.07 frames/sec
  const minLag = Math.floor((framesPerSec * 60) / 180); // 180 BPM
  const maxLag = Math.ceil((framesPerSec * 60) / 60); // 60 BPM

  let bestLag = -1;
  let bestCorr = -Infinity;
  let total = 0;
  let count = 0;
  for (let lag = minLag; lag <= maxLag; lag++) {
    let sum = 0;
    const N = novelty.length - lag;
    for (let i = 0; i < N; i++) sum += novelty[i] * novelty[i + lag];
    total += sum;
    count++;
    if (sum > bestCorr) {
      bestCorr = sum;
      bestLag = lag;
    }
  }
  if (bestLag < 0 || bestCorr <= 0) return { bpm: null, confidence: 0 };

  const avg = count > 0 ? total / count : 0;
  // Confidence = prominence of the peak vs average autocorrelation.
  // Clamp to [0, 1]. Typical musical input sits at 0.3–0.9; ambient at ≤ 0.2.
  const confidence = avg > 0 ? Math.max(0, Math.min(1, (bestCorr - avg) / (bestCorr + 1e-9))) : 0;
  const bpmRaw = (framesPerSec * 60) / bestLag;

  return { bpm: Math.round(bpmRaw * 10) / 10, confidence };
}

// ─── Key ──────────────────────────────────────────────────────────────────

const PITCH_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
// Krumhansl-Kessler profiles.
const KK_MAJOR = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
const KK_MINOR = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];

export function detectKey(pcm: Float32Array, sampleRate: number): KeyResult {
  const samples = resample(pcm, sampleRate, TARGET_SR);
  const frameSize = 4096;
  const hop = 2048;
  if (samples.length < frameSize * 4) return { key: null, confidence: 0 };

  // Pre-compute Hann window.
  const window = new Float32Array(frameSize);
  for (let i = 0; i < frameSize; i++) {
    window[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (frameSize - 1)));
  }

  // Goertzel coefficients for MIDI pitches 36 (C2) → 83 (B5) — 4 octaves.
  // That range captures bass + mid + upper harmonic content of typical tracks.
  const pitchFreqs: number[] = [];
  for (let midi = 36; midi <= 83; midi++) {
    pitchFreqs.push(440 * Math.pow(2, (midi - 69) / 12));
  }
  const coeffs = pitchFreqs.map(
    (f) => 2 * Math.cos((2 * Math.PI * f) / TARGET_SR),
  );

  const chroma = new Float64Array(12);
  const numFrames = Math.floor((samples.length - frameSize) / hop);
  let usedFrames = 0;

  for (let f = 0; f < numFrames; f++) {
    const start = f * hop;

    // Skip near-silent frames so noise floors don't pollute chroma.
    let energy = 0;
    for (let i = 0; i < frameSize; i++) {
      const v = samples[start + i];
      energy += v * v;
    }
    if (energy / frameSize < 1e-5) continue;
    usedFrames++;

    // Goertzel magnitude² per pitch → fold into pitch-class chroma.
    for (let p = 0; p < coeffs.length; p++) {
      const coeff = coeffs[p];
      let s1 = 0;
      let s2 = 0;
      for (let n = 0; n < frameSize; n++) {
        const x = samples[start + n] * window[n];
        const s = coeff * s1 - s2 + x;
        s2 = s1;
        s1 = s;
      }
      const mag2 = s1 * s1 + s2 * s2 - coeff * s1 * s2;
      // Pitch class = (MIDI 36 + p) mod 12 = p mod 12.
      chroma[p % 12] += mag2;
    }
  }
  if (usedFrames === 0) return { key: null, confidence: 0 };

  // L2 normalize the chroma vector.
  let norm = 0;
  for (let i = 0; i < 12; i++) norm += chroma[i] * chroma[i];
  norm = Math.sqrt(norm);
  if (norm === 0) return { key: null, confidence: 0 };
  for (let i = 0; i < 12; i++) chroma[i] /= norm;

  // Correlate against all 24 Krumhansl profiles (Pearson).
  let bestIdx = -1;
  let bestScore = -Infinity;
  for (let tonic = 0; tonic < 12; tonic++) {
    for (let mode = 0; mode < 2; mode++) {
      const profile = mode === 0 ? KK_MAJOR : KK_MINOR;
      const rotated = new Float64Array(12);
      for (let i = 0; i < 12; i++) rotated[i] = profile[(i - tonic + 12) % 12];
      const score = pearson(chroma, rotated);
      if (score > bestScore) {
        bestScore = score;
        bestIdx = tonic + mode * 12;
      }
    }
  }
  if (bestIdx < 0) return { key: null, confidence: 0 };

  const tonic = bestIdx % 12;
  const mode = bestIdx < 12 ? "major" : "minor";
  const keyName = `${PITCH_NAMES[tonic]} ${mode}`;
  // bestScore is a Pearson correlation in [-1, 1]. Map to [0, 1].
  const confidence = Math.max(0, Math.min(1, (bestScore + 1) / 2));

  return { key: keyName, confidence };
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function pearson(a: ArrayLike<number>, b: ArrayLike<number>): number {
  const n = a.length;
  let sumA = 0;
  let sumB = 0;
  for (let i = 0; i < n; i++) {
    sumA += a[i];
    sumB += b[i];
  }
  const meanA = sumA / n;
  const meanB = sumB / n;
  let num = 0;
  let denA = 0;
  let denB = 0;
  for (let i = 0; i < n; i++) {
    const da = a[i] - meanA;
    const db = b[i] - meanB;
    num += da * db;
    denA += da * da;
    denB += db * db;
  }
  const den = Math.sqrt(denA * denB);
  return den === 0 ? 0 : num / den;
}

// Linear resample — cheap and good enough for envelope / chromagram analysis.
function resample(
  src: Float32Array,
  srcRate: number,
  dstRate: number,
): Float32Array {
  if (srcRate === dstRate) return src;
  const ratio = srcRate / dstRate;
  const outLen = Math.floor(src.length / ratio);
  const out = new Float32Array(outLen);
  for (let i = 0; i < outLen; i++) {
    const srcIdx = i * ratio;
    const lo = Math.floor(srcIdx);
    const hi = Math.min(lo + 1, src.length - 1);
    const frac = srcIdx - lo;
    out[i] = src[lo] * (1 - frac) + src[hi] * frac;
  }
  return out;
}
