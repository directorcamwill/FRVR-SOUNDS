export const GENRES = [
  "Hip-Hop", "R&B", "Pop", "Rock", "Electronic", "Country", "Jazz",
  "Classical", "Latin", "Afrobeat", "Reggae", "Folk", "Indie", "Soul",
  "Funk", "Alternative", "Ambient", "Cinematic", "Lo-Fi", "Trap",
] as const;

export const MOODS = [
  "Uplifting", "Dark", "Melancholy", "Energetic", "Chill", "Aggressive",
  "Romantic", "Nostalgic", "Triumphant", "Mysterious", "Playful", "Ethereal",
  "Gritty", "Hopeful", "Tense", "Dreamy",
] as const;

export const MUSICAL_KEYS = [
  "C Major", "C Minor", "C#/Db Major", "C#/Db Minor",
  "D Major", "D Minor", "D#/Eb Major", "D#/Eb Minor",
  "E Major", "E Minor", "F Major", "F Minor",
  "F#/Gb Major", "F#/Gb Minor", "G Major", "G Minor",
  "G#/Ab Major", "G#/Ab Minor", "A Major", "A Minor",
  "A#/Bb Major", "A#/Bb Minor", "B Major", "B Minor",
] as const;

export const TEMPO_FEELS = ["Slow", "Mid-tempo", "Uptempo", "Fast"] as const;

export const STEM_TYPES = [
  "vocals", "drums", "bass", "guitar", "keys", "strings",
  "synth", "fx", "full_instrumental", "other",
] as const;

export const OPPORTUNITY_TYPES = [
  "tv", "film", "commercial", "trailer", "video_game",
  "web_content", "podcast", "library", "other",
] as const;

export const PIPELINE_STAGES = [
  "discovery", "qualified", "matched", "ready",
  "submitted", "pending", "won", "lost",
] as const;

export const PRO_AFFILIATIONS = ["ASCAP", "BMI", "SESAC", "Other", "None"] as const;
