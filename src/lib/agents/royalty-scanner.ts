import { createClient } from "@/lib/supabase/server";
import type { RoyaltyScanResult } from "@/types/financial";

const REQUIRED_REGISTRATION_TYPES = [
  "pro",
  "mlc",
  "soundexchange",
  "publishing_admin",
  "isrc",
] as const;

export async function runRoyaltyScan(artistId: string): Promise<RoyaltyScanResult> {
  const supabase = await createClient();

  // 1. Get all active songs for the artist
  const { data: songs } = await supabase
    .from("songs")
    .select("id, title")
    .eq("artist_id", artistId)
    .in("status", ["active", "draft"])
    .order("title");

  if (!songs || songs.length === 0) {
    return {
      total_songs: 0,
      fully_registered: 0,
      missing_count: 0,
      missing_details: [],
    };
  }

  const songIds = songs.map((s) => s.id);

  // 2. Get all existing registrations for these songs
  const { data: existingRegs } = await supabase
    .from("song_registrations")
    .select("song_id, registration_type, status")
    .in("song_id", songIds);

  // 3. Build a map of existing registrations per song
  const regMap = new Map<string, Set<string>>();
  for (const reg of existingRegs || []) {
    if (!regMap.has(reg.song_id)) {
      regMap.set(reg.song_id, new Set());
    }
    regMap.get(reg.song_id)!.add(reg.registration_type);
  }

  // 4. Find missing registrations and create records
  const missingDetails: RoyaltyScanResult["missing_details"] = [];
  const insertRecords: { song_id: string; registration_type: string; status: string }[] = [];

  for (const song of songs) {
    const existingTypes = regMap.get(song.id) || new Set();
    const missingTypes: string[] = [];

    for (const reqType of REQUIRED_REGISTRATION_TYPES) {
      if (!existingTypes.has(reqType)) {
        missingTypes.push(reqType);
        insertRecords.push({
          song_id: song.id,
          registration_type: reqType,
          status: "missing",
        });
      }
    }

    if (missingTypes.length > 0) {
      missingDetails.push({
        song_id: song.id,
        song_title: song.title,
        missing_types: missingTypes as RoyaltyScanResult["missing_details"][0]["missing_types"],
      });
    }
  }

  // 5. Bulk insert missing registration records (ignore duplicates)
  if (insertRecords.length > 0) {
    await supabase
      .from("song_registrations")
      .upsert(
        insertRecords.map((r) => ({
          song_id: r.song_id,
          registration_type: r.registration_type,
          status: r.status,
        })),
        { onConflict: "song_id,registration_type", ignoreDuplicates: true }
      );
  }

  // 6. Create alerts for songs with missing registrations
  if (missingDetails.length > 0) {
    const alertMessage =
      missingDetails.length === 1
        ? `"${missingDetails[0].song_title}" is missing ${missingDetails[0].missing_types.length} registration(s)`
        : `${missingDetails.length} songs have missing royalty registrations`;

    await supabase.from("alerts").insert({
      artist_id: artistId,
      type: "royalty_missing",
      title: "Missing Royalty Registrations",
      message: alertMessage,
      action_url: "/money/registrations",
      priority: "high",
    });
  }

  const fullyRegistered = songs.length - missingDetails.length;

  return {
    total_songs: songs.length,
    fully_registered: fullyRegistered,
    missing_count: missingDetails.length,
    missing_details: missingDetails,
  };
}
