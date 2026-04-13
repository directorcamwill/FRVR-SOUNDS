"use client";

import { useState, useEffect, useCallback } from "react";
import type { Song } from "@/types/song";

export function useSongs() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSongs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/songs");
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to fetch songs");
      }
      const data = await res.json();
      setSongs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch songs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSongs();
  }, [fetchSongs]);

  return { songs, loading, error, refetch: fetchSongs };
}

export function useSong(songId: string) {
  const [song, setSong] = useState<Song | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSong = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/songs/${songId}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to fetch song");
      }
      const data = await res.json();
      setSong(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch song");
    } finally {
      setLoading(false);
    }
  }, [songId]);

  useEffect(() => {
    fetchSong();
  }, [fetchSong]);

  return { song, loading, error, refetch: fetchSong };
}
