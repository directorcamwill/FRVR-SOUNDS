import { spawn } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import ffmpegPath from "ffmpeg-static";

export const ANALYZER_VERSION = "v1-ebur128";

const FFMPEG = (ffmpegPath as unknown as string) || "ffmpeg";
const WAVEFORM_BINS = 500;
const WAVEFORM_SAMPLE_RATE = 8000;

export interface AnalyzerResult {
  duration_sec: number | null;
  lufs_integrated: number | null;
  lufs_short_term_max: number | null;
  true_peak_db: number | null;
  dynamic_range: number | null;
  waveform_peaks: number[];
  analyzer_version: string;
}

export async function analyzeAudio(input: Buffer, extension = "mp3"): Promise<AnalyzerResult> {
  const workdir = await mkdtemp(join(tmpdir(), "frvr-analyze-"));
  const safeExt = extension.replace(/[^a-z0-9]/gi, "").slice(0, 5) || "mp3";
  const inputPath = join(workdir, `in.${safeExt}`);

  try {
    await writeFile(inputPath, input);
    const [loudness, peaks] = await Promise.all([
      runLoudness(inputPath),
      renderWaveform(inputPath),
    ]);
    return {
      duration_sec: loudness.duration_sec,
      lufs_integrated: loudness.lufs_integrated,
      lufs_short_term_max: loudness.lufs_short_term_max,
      true_peak_db: loudness.true_peak_db,
      dynamic_range: loudness.dynamic_range,
      waveform_peaks: peaks,
      analyzer_version: ANALYZER_VERSION,
    };
  } finally {
    await rm(workdir, { recursive: true, force: true });
  }
}

interface LoudnessMeasurements {
  duration_sec: number | null;
  lufs_integrated: number | null;
  lufs_short_term_max: number | null;
  true_peak_db: number | null;
  dynamic_range: number | null;
}

async function runLoudness(inputPath: string): Promise<LoudnessMeasurements> {
  const stderr = await runFfmpeg([
    "-nostdin",
    "-hide_banner",
    "-i", inputPath,
    "-af", "ebur128=peak=true:framelog=quiet",
    "-f", "null",
    "-",
  ]);
  return parseLoudness(stderr);
}

export function parseLoudness(stderr: string): LoudnessMeasurements {
  const pickNum = (re: RegExp) => {
    const m = stderr.match(re);
    if (!m) return null;
    const n = Number(m[1]);
    return Number.isFinite(n) ? n : null;
  };
  const summary = stderr.split(/Summary:/i).pop() ?? stderr;
  const integrated = pickNum(/I:\s*(-?\d+(?:\.\d+)?)\s*LUFS/i);
  const truePeak = pickNum(/(?:True peak|Peak):\s*(-?\d+(?:\.\d+)?)\s*dBFS/i);
  const lra = pickNum(/LRA:\s*(-?\d+(?:\.\d+)?)\s*LU/i);
  const shortTermMax = (() => {
    const all = [...summary.matchAll(/S:\s*(-?\d+(?:\.\d+)?)\s*LUFS/gi)].map((m) => Number(m[1]));
    const finite = all.filter((n) => Number.isFinite(n));
    return finite.length ? Math.max(...finite) : null;
  })();

  let duration: number | null = null;
  const dur = stderr.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/);
  if (dur) {
    duration =
      Number(dur[1]) * 3600 + Number(dur[2]) * 60 + Number(dur[3]);
    if (!Number.isFinite(duration)) duration = null;
  }

  return {
    duration_sec: duration,
    lufs_integrated: integrated,
    lufs_short_term_max: shortTermMax,
    true_peak_db: truePeak,
    dynamic_range: lra,
  };
}

async function renderWaveform(inputPath: string): Promise<number[]> {
  const raw = await runFfmpegRaw([
    "-nostdin",
    "-hide_banner",
    "-loglevel", "error",
    "-i", inputPath,
    "-ac", "1",
    "-ar", String(WAVEFORM_SAMPLE_RATE),
    "-f", "s16le",
    "-",
  ]);
  return downsamplePeaks(raw, WAVEFORM_BINS);
}

export function downsamplePeaks(pcm: Buffer, bins: number): number[] {
  const sampleCount = Math.floor(pcm.length / 2);
  if (sampleCount === 0) return Array(bins).fill(0);
  const samplesPerBin = Math.max(1, Math.floor(sampleCount / bins));
  const out: number[] = new Array(bins).fill(0);
  for (let b = 0; b < bins; b++) {
    const start = b * samplesPerBin;
    const end = b === bins - 1 ? sampleCount : Math.min(sampleCount, start + samplesPerBin);
    let peak = 0;
    for (let i = start; i < end; i++) {
      const v = pcm.readInt16LE(i * 2);
      const abs = Math.abs(v);
      if (abs > peak) peak = abs;
    }
    out[b] = Math.min(1, peak / 32768);
  }
  return out;
}

function runFfmpeg(args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn(FFMPEG, args, { stdio: ["ignore", "ignore", "pipe"] });
    const chunks: Buffer[] = [];
    proc.stderr.on("data", (c) => chunks.push(c));
    proc.on("error", reject);
    proc.on("close", (code) => {
      const out = Buffer.concat(chunks).toString("utf8");
      if (code !== 0) {
        reject(new Error(`ffmpeg exited ${code}: ${out.slice(-800)}`));
        return;
      }
      resolve(out);
    });
  });
}

function runFfmpegRaw(args: string[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const proc = spawn(FFMPEG, args, { stdio: ["ignore", "pipe", "pipe"] });
    const out: Buffer[] = [];
    const err: Buffer[] = [];
    proc.stdout.on("data", (c) => out.push(c));
    proc.stderr.on("data", (c) => err.push(c));
    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`ffmpeg exited ${code}: ${Buffer.concat(err).toString("utf8").slice(-800)}`));
        return;
      }
      resolve(Buffer.concat(out));
    });
  });
}
