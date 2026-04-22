// ElevenLabs TTS wrapper. Used by the Brand Wiki Oracle to speak answers in
// a cinematic voice. Returns base64-encoded MP3 for easy piping through a
// JSON API response.
//
// Required env:
//   ELEVENLABS_API_KEY   — from https://elevenlabs.io/app/settings/api-keys
// Optional env:
//   ELEVENLABS_VOICE_ID  — defaults to "Adam" (deep male). Swap for any
//                          voice id from the ElevenLabs voice library.
//   ELEVENLABS_MODEL_ID  — defaults to "eleven_turbo_v2_5" (fast + natural).

const DEFAULT_VOICE_ID = "pNInz6obpgDQGcFmaJgB"; // Adam — deep cinematic
const DEFAULT_MODEL_ID = "eleven_turbo_v2_5";

export function isVoiceConfigured(): boolean {
  return Boolean(process.env.ELEVENLABS_API_KEY);
}

export interface SynthesizeResult {
  audioBase64: string;
  mimeType: "audio/mpeg";
  chars: number;
  voiceId: string;
  modelId: string;
}

/**
 * Non-streaming TTS. Returns the full MP3 buffer as base64 so it can ride
 * inside a single JSON response. For long answers we cap at 800 chars to
 * keep cost + latency in check.
 */
export async function synthesizeSpeech(
  text: string,
): Promise<SynthesizeResult> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ELEVENLABS_API_KEY is not set. Add it to .env.local (and Vercel env) to enable voice.",
    );
  }
  const voiceId = process.env.ELEVENLABS_VOICE_ID ?? DEFAULT_VOICE_ID;
  const modelId = process.env.ELEVENLABS_MODEL_ID ?? DEFAULT_MODEL_ID;

  const trimmed = text.trim().slice(0, 800);
  if (!trimmed)
    throw new Error("Nothing to synthesize — text is empty after trimming.");

  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text: trimmed,
        model_id: modelId,
        voice_settings: {
          stability: 0.45,
          similarity_boost: 0.78,
          style: 0.35,
          use_speaker_boost: true,
        },
      }),
    },
  );

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(
      `ElevenLabs ${res.status}: ${detail || res.statusText}`,
    );
  }

  const buf = Buffer.from(await res.arrayBuffer());
  return {
    audioBase64: buf.toString("base64"),
    mimeType: "audio/mpeg",
    chars: trimmed.length,
    voiceId,
    modelId,
  };
}
