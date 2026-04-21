// Sync Directory — a glossary of sync / placement terms, each framed around
// how an artist maximizes their placement chances when the term comes up.
// This is the single source of truth for the /sync-directory page.

export type SyncCategory =
  | "Structure & Arrangement"
  | "Deliverables & Technical"
  | "Licensing & Legal"
  | "Royalties & Revenue"
  | "Placement Types"
  | "Industry Roles"
  | "Trailer & Cinematic"
  | "Production & Mix"
  | "Platforms & Formats";

export type DifficultyLevel = "beginner" | "intermediate" | "advanced";

export interface SyncTerm {
  term: string;
  aliases?: string[];
  category: SyncCategory;
  // Quick, plain-English answer — what a beginner needs in 5 seconds.
  definition: string;
  // Pro-level detail — legal mechanics, edge cases, negotiation leverage.
  advancedDefinition?: string;
  // A concrete, named example from the real world (show or artist).
  realWorldExample?: string;
  // Where the term comes up — what triggers it in an artist's workflow.
  usageContext?: string;
  // Bucket so we can filter the learning path to the artist's level.
  difficulty?: DifficultyLevel;
  // Related terms (exact `term` values from this file) — used for cross-linking.
  related?: string[];
  // Concrete tip on how to maximize placement chances when this comes up.
  artistTip: string;
}

export const SYNC_TERMS: SyncTerm[] = [
  // ───────── Structure & Arrangement ─────────
  {
    term: "Hook",
    category: "Structure & Arrangement",
    difficulty: "beginner",
    definition:
      "The most memorable melodic or lyrical phrase — the part that sticks after one listen.",
    advancedDefinition:
      "In sync contexts, 'hook' refers to both the lyrical/melodic hook and to 'sonic hook' — a signature production element (a filter sweep, a vocal chop, a synth stab) that makes the track identifiable in 2 seconds. Supervisors pitch-match on sonic hook just as much as lyrical hook.",
    realWorldExample:
      "Billie Eilish — 'bad guy' (lyrical hook 'duh' lands at 0:14). Used in Barbie (2023) trailer 60s spot; the 'duh' hit the cut.",
    usageContext:
      "When a supervisor sends a brief, 'hook-forward' usually means: identifiable idea before 0:15, not slow-burn.",
    related: ["Pre-Hook", "Button", "Needle Drop"],
    artistTip:
      "Land your hook before 0:45. Music supervisors listen in 30-second chunks; if you don't hook them in the first window, your song gets passed.",
  },
  {
    term: "Bed",
    category: "Structure & Arrangement",
    definition:
      "Non-intrusive music that sits underneath dialog, voiceover, or picture. Usually loopable.",
    artistTip:
      "Provide an instrumental-only bed version of every song. Supervisors often need to drop your hook at the beginning and have the rest of the scene played under dialog.",
  },
  {
    term: "Button",
    aliases: ["Button End", "Button Ending"],
    category: "Structure & Arrangement",
    difficulty: "beginner",
    definition:
      "A definitive musical ending — lands on a beat, no fade. Short or no tail.",
    advancedDefinition:
      "Three button variants editors ask for: (1) hard button — on-beat hit with <1s decay, (2) soft button — hit with short natural tail, (3) button + reverb tail — hit with deliberate long decay for logo reveals. Ship all three when you can.",
    realWorldExample:
      "Marvel trailer cues almost always end on a hard button landing on the logo reveal. Compare to end-credit songs in drama (The Crown) which often fade — context-dependent.",
    usageContext:
      "Every ad, every trailer, most modern TV placements need a button. Fades are reserved for emotional scene-outs and indie film.",
    related: ["Stinger", "Tag", "Fade"],
    artistTip:
      "Modern sync buyers prefer buttons over fades 9 times out of 10. Always deliver a button version, even if your released single fades.",
  },
  {
    term: "Stinger",
    category: "Structure & Arrangement",
    definition:
      "A short, sharp musical hit used for emphasis — typically 2-8 seconds.",
    artistTip:
      "Create stinger cuts of your tracks at the main musical peaks. Trailer editors and TV supervisors pay separately for stingers pulled from a full cue.",
  },
  {
    term: "Braam",
    aliases: ["Brahm"],
    category: "Trailer & Cinematic",
    definition:
      "The massive low-end brass/synth hit used in trailers. Named after the sound Zimmer popularized for Inception.",
    artistTip:
      "Deliver braams as their own cue and as a separate stem. Trailer houses maintain 'braam packs' for ongoing projects.",
  },
  {
    term: "Needle Drop",
    category: "Placement Types",
    difficulty: "beginner",
    definition:
      "A pre-existing commercial song used intact in a scene — as opposed to underscore or source music.",
    advancedDefinition:
      "Needle drops are usually paid on a 'per-use' sync + master license with both upfront fee and backend performance royalties. Featured needle drops (song drives the scene) pay 2–3x background needle drops (song under dialog).",
    realWorldExample:
      "Stranger Things Season 4 used Kate Bush's 'Running Up That Hill' as a featured needle drop — the song drove the emotional climax and returned the 1985 track to #1 on streaming charts 37 years after release.",
    usageContext:
      "When a supervisor says 'we're using this as a needle drop,' the whole song (or 60+ seconds) is in picture. Different prep than underscore.",
    related: ["Source Music", "Underscore", "Featured Placement", "Sync License"],
    artistTip:
      "Most catalog-plays are needle drops. Keep your singles licensing-ready (one-stop ownership + clean stems) to be needle-drop eligible.",
  },
  {
    term: "One-Stop",
    aliases: ["One Stop", "One-Stop Shop"],
    category: "Licensing & Legal",
    difficulty: "intermediate",
    definition:
      "A song where a single entity controls both the master recording and the publishing — no multi-party negotiation needed.",
    advancedDefinition:
      "One-stop status is binary: if any co-writer, producer, or sample holder has an un-signed-off share, you are NOT one-stop. Supervisors will only ask you once — if there's ambiguity, the song gets passed. Co-write split sheets must be signed before you can market the song as one-stop.",
    realWorldExample:
      "Independent artists pitching to commercials (e.g. Apple, Nike) are almost always asked 'is this one-stop?' as the first question. Grimes is famously one-stop on her solo work — she controls masters + publishing herself.",
    usageContext:
      "The first question on most sync briefs. Drives both speed of placement and fee — one-stops often get 20-30% higher quotes accepted because of reduced legal friction.",
    related: ["Split Sheet", "Master Use License", "Publishing", "Pre-Cleared"],
    artistTip:
      "One-stops get placed 5-10x faster than split-ownership songs. If you own your masters and write alone, advertise 'one-stop' in your pitches and your metadata.",
  },
  {
    term: "Split Sheet",
    category: "Licensing & Legal",
    definition:
      "A document listing the ownership percentages for a song — who owns what share of the master and the publishing.",
    artistTip:
      "Get the split sheet signed before the session ends. Unresolved splits are the #1 reason sync offers fall through at the licensing stage.",
  },
  {
    term: "MFN",
    aliases: ["Most Favored Nation"],
    category: "Licensing & Legal",
    difficulty: "advanced",
    definition:
      "A licensing clause guaranteeing you'll receive the same rate as any other licensor on the same project.",
    advancedDefinition:
      "MFN is bidirectional: if any other licensor on the project gets a higher rate, yours rises to match. Critically, if a higher licensor renegotiates DOWN, yours doesn't follow — MFN only ratchets up. Supervisors hate MFN because one holdout locks the whole placement. Leverage: when you're the last song they need, MFN gets you the top rate.",
    realWorldExample:
      "When Guardians of the Galaxy Vol. 3 licensed 'Dog Days Are Over' (Florence + The Machine), Florence's camp reportedly used MFN. The placement proceeded only after the production matched her quote across other licensed tracks.",
    usageContext:
      "Appears in most major-project sync licenses. Your publisher or sync agent should handle MFN negotiation — it's rarely the artist's decision alone.",
    related: ["Quote", "Sync License", "Exclusive vs Non-Exclusive"],
    artistTip:
      "Agree to MFN when it benefits you (you're the low quote and want to be raised to match others). Reject it when you're quoting high and don't want to be dragged down.",
  },
  {
    term: "Sync License",
    category: "Licensing & Legal",
    difficulty: "beginner",
    definition:
      "The license to synchronize your composition with picture — film, TV, ads, games.",
    advancedDefinition:
      "Sync license terms typically specify: territory (worldwide / US only), media (all media / broadcast only), duration (perpetuity / 5-year term), and exclusivity. Each modifier changes the fee 20-100%. The standard package is 'all media, worldwide, perpetuity, non-exclusive'.",
    realWorldExample:
      "When Succession licensed Nicholas Britell's theme, they secured a sync license for the composition. The recorded version heard on screen also needed a master use license (held by Britell's team).",
    usageContext:
      "Required for any music placed with picture. If a supervisor says 'we want to license the song,' they mean both sync + master.",
    related: ["Master Use License", "Publishing", "Quote", "One-Stop"],
    artistTip:
      "A sync license covers only the composition. To use a specific recording of your song, the buyer also needs a Master Use License (see below).",
  },
  {
    term: "Master Use License",
    aliases: ["Master License"],
    category: "Licensing & Legal",
    difficulty: "beginner",
    definition:
      "The license to use a specific sound recording (the master). Separate from the sync license.",
    advancedDefinition:
      "Master use is typically paid by the buyer to whoever controls the master — often the label, sometimes the artist if they're indie or have reverted rights. Fees often match or exceed the sync fee (50/50 master/pub is the standard split on most major placements).",
    realWorldExample:
      "Taylor Swift's re-recorded 'Taylor's Versions' exist specifically so she controls the master use license. Scooter Braun's Big Machine owns the master use for originals — so any sync of the original recording pays Braun, not Swift.",
    usageContext:
      "Every needle drop. If the buyer wants to use YOUR recording specifically (vs a re-record or cover), they need master use.",
    related: ["Sync License", "One-Stop", "Re-Record"],
    artistTip:
      "Every sync placement needs both. Owning your masters means you double-dip: you get paid for both sync + master, and you control approvals.",
  },
  {
    term: "Publishing",
    category: "Licensing & Legal",
    definition:
      "The ownership of the underlying composition — melody + lyrics + chords. Separate from the master recording.",
    artistTip:
      "Register your publishing with your PRO (ASCAP/BMI/SESAC) the day the song is finished. Placements trigger performance royalties that only flow if you're registered.",
  },
  {
    term: "PRO",
    aliases: ["Performing Rights Organization", "ASCAP", "BMI", "SESAC", "PRS"],
    category: "Royalties & Revenue",
    definition:
      "Performing Rights Organizations collect performance royalties when your music is played publicly — broadcast, streaming, live venues.",
    artistTip:
      "You cannot collect performance royalties without a PRO. Register every song with the right splits. US artists pick ASCAP, BMI, or SESAC — you can only be at one.",
  },
  {
    term: "Cue Sheet",
    category: "Industry Roles",
    definition:
      "A document listing every piece of music in a production — timestamps, durations, composers, publishers. Filed with PROs so royalties flow.",
    artistTip:
      "After a placement airs, confirm the cue sheet was filed and that you're listed correctly. Missing or wrong cue sheets are the biggest source of lost royalties.",
  },
  {
    term: "Quote",
    category: "Licensing & Legal",
    definition:
      "The fee you (or your team) ask to license the song for a specific use.",
    artistTip:
      "Quotes vary wildly by placement type: $500 YouTube / $2-5K indie TV / $15-50K major ad / $100K+ big film. Supervisors expect you to negotiate down 30–50% from your opening quote.",
  },
  {
    term: "Buyout",
    category: "Licensing & Legal",
    definition:
      "A one-time flat fee in exchange for full rights — no ongoing royalties.",
    artistTip:
      "Avoid buyouts for major placements (film, prime-time TV, national ads). Accept them for low-stakes uses (YouTube tutorials, corporate videos) where backend would be negligible anyway.",
  },
  {
    term: "All-In",
    category: "Licensing & Legal",
    definition:
      "A single licensing fee covering both the master and the publishing — typical when one party controls both.",
    artistTip:
      "All-in deals are easier to close. Quote all-in as 2x what you'd quote for just the master or just the publishing.",
  },
  {
    term: "In Perpetuity",
    category: "Licensing & Legal",
    definition:
      "Forever. Worldwide. For all media, now existing and hereafter invented.",
    artistTip:
      "Perpetuity is the standard ask from film/TV. For commercials, fight for a term (1-year renewable) — if the ad keeps running, you get paid again.",
  },
  {
    term: "Exclusive vs Non-Exclusive",
    category: "Licensing & Legal",
    definition:
      "Exclusive: the buyer is the only one allowed to use the song for that context. Non-exclusive: you can license to others too.",
    artistTip:
      "Never sign exclusive without a meaningful fee bump (2-5x non-exclusive). Exclusive locks you out of other placements in that vertical.",
  },
  {
    term: "LUFS",
    aliases: ["Loudness Units Full Scale"],
    category: "Deliverables & Technical",
    difficulty: "intermediate",
    definition:
      "Standardized loudness measurement. Each platform/medium has a target.",
    advancedDefinition:
      "Measured as Integrated LUFS over the entire track (vs Short-Term or Momentary). Broadcast QC checks also require True Peak ≤ -2 dBTP and Loudness Range within 10 LU. Fail any of three and your delivery bounces. Tools: iZotope Insight, YouLean Loudness Meter, Waves WLM.",
    realWorldExample:
      "Netflix spec: -27 LUFS, -2 dBTP true peak. Apple Music normalizes to -16 LUFS. YouTube normalizes to -14 LUFS. A song mastered at -9 LUFS (common for streaming) will be turned DOWN 7-13 LU on these platforms — losing perceived loudness and punch.",
    usageContext:
      "Every sync delivery needs a spec-appropriate LUFS master. Ship multiple if you're pitching to multiple platforms.",
    related: ["True Peak", "Broadcast Mix", "TV Mix"],
    artistTip:
      "US broadcast: -24 LUFS. EU: -23 LUFS. Spotify: -14 LUFS. Apple: -16 LUFS. Film: -27 LUFS. Deliver the right LUFS or supervisors will skip your track — they don't have time to re-master.",
  },
  {
    term: "True Peak",
    category: "Deliverables & Technical",
    definition:
      "The maximum peak level of your audio, measured with oversampling to catch inter-sample peaks.",
    artistTip:
      "Sync deliverables require true peak ≤ -1 dBTP for streaming, -2 dBTP for broadcast. Overs get flagged in QC and bounced back.",
  },
  {
    term: "Stems",
    category: "Deliverables & Technical",
    definition:
      "Multi-track breakdown of a song — typically drums, bass, keys, vocals, fx as separate audio files.",
    artistTip:
      "Always deliver stems. Supervisors mix your song into their picture — they may need to duck drums during dialog or pull out vocals under a VO. No stems = no placement.",
  },
  {
    term: "TV Mix",
    category: "Production & Mix",
    definition:
      "An alternate mix with the vocals set back 2-3 dB so dialog sits over them cleanly.",
    artistTip:
      "Ship a TV mix alongside the main mix. For TV drama needle drops, 60% of placements use the TV mix, not the streaming master.",
  },
  {
    term: "Vocal-Up",
    category: "Production & Mix",
    definition:
      "A mix with the lead vocal 1-2 dB above the main mix — for emotional featured placements.",
    artistTip:
      "Film supervisors scoring emotional scenes (death, goodbye, breakup) often request a vocal-up version. Prepare one.",
  },
  {
    term: "Instrumental",
    category: "Deliverables & Technical",
    definition:
      "A version of your song with no lead vocal. May still include backing vocals / adlibs.",
    artistTip:
      "Required for most sync placements. Also ship a 'no backing vocals' instrumental — some scenes need truly voiceless underscore.",
  },
  {
    term: "Clean Version",
    aliases: ["Radio Edit", "Clean Edit"],
    category: "Deliverables & Technical",
    definition:
      "A version with all profanity muted, reversed, or edited. Required for broadcast TV and radio.",
    artistTip:
      "Cleans are worth doing even if your song is largely clean — one 'fuck' in the bridge disqualifies you from 80% of placements without a clean version on file.",
  },
  {
    term: "A Cappella",
    aliases: ["Acap", "Acapella"],
    category: "Deliverables & Technical",
    definition: "Vocals only, no instrumental.",
    artistTip:
      "Ship as a deliverable — some sync placements use just the vocal (e.g. trailer moments) or remixes.",
  },
  {
    term: "Music Supervisor",
    aliases: ["Supervisor", "Sup", "MS"],
    category: "Industry Roles",
    difficulty: "beginner",
    definition:
      "The person responsible for selecting and licensing music for a film, TV show, ad, or game. Your primary buyer.",
    advancedDefinition:
      "Supervisors report to the director (film) or showrunner (TV) and negotiate with the studio/network's business affairs. They hold the music budget and have veto power over picks. Career supervisors specialize by genre (prestige TV, indie film, commercials, trailers) — pitch to the ones whose work you'd kill to be in.",
    realWorldExample:
      "Nora Felder (Stranger Things) — single-handedly responsible for the Kate Bush renaissance. Randall Poster (Wes Anderson films, Martin Scorsese) — shapes the sound of two of the most influential filmmakers alive.",
    usageContext:
      "The gatekeeper for 95% of film/TV placements. Your pitches, libraries, and sync reps all feed supervisors downstream.",
    related: ["Sync Agent", "Pitch", "Brief", "Quote"],
    artistTip:
      "Supervisors get 500+ songs per project. Your pitch needs to be < 3 lines, include BPM + key + mood + one-stop status, and link to a streamable file that plays immediately.",
  },
  {
    term: "Sync Agent",
    aliases: ["Sync Rep", "Sync Licensor"],
    category: "Industry Roles",
    definition:
      "Third-party representative who pitches your catalog to supervisors, libraries, and ad agencies in exchange for 20-50% of the sync fee.",
    artistTip:
      "Agents work on exclusive, semi-exclusive, or non-exclusive arrangements. Read every clause around term length and termination before signing.",
  },
  {
    term: "Music Editor",
    category: "Industry Roles",
    definition:
      "The person who edits music into picture after the supervisor selects it. Handles timing, transitions, and sometimes minor re-cuts.",
    artistTip:
      "Editors love clean stems and clear loop points. A song with obvious cut points (e.g. 'end of chorus' markers in the filename) gets placed more.",
  },
  {
    term: "Temp Track",
    aliases: ["Temp Score", "Temp Love"],
    category: "Industry Roles",
    definition:
      "A placeholder piece of music used during editing. 'Temp love' = when the director falls in love with the temp and refuses to replace it.",
    artistTip:
      "If you can match a high-profile temp track in vibe (e.g. 'sounds like Massive Attack — Angel'), say so in your pitch. Matching a temp is the fastest path to placement.",
  },
  {
    term: "Source Music",
    aliases: ["Diegetic"],
    category: "Placement Types",
    definition:
      "Music that exists in the world of the scene — from a radio, jukebox, live band on screen.",
    artistTip:
      "Source music pays the same as underscore but often requires the recording to sound period-appropriate. Timeline-specific tracks (80s synthwave, 90s hip-hop) get pulled into period shows.",
  },
  {
    term: "Underscore",
    aliases: ["Non-Diegetic", "Score"],
    category: "Placement Types",
    definition:
      "Music added to picture that doesn't exist in the world of the scene — the score, underscoring.",
    artistTip:
      "Instrumental-first tracks get placed more as underscore. Keep a library of cleanly-arranged instrumental versions of your catalog.",
  },
  {
    term: "Main Title",
    aliases: ["Opening Theme"],
    category: "Placement Types",
    definition:
      "The music over the opening credits of a film or series. Premium placement, premium fee.",
    artistTip:
      "Main title placements often require exclusivity for the show. Fees are 5-20x normal episode fees.",
  },
  {
    term: "End Credits",
    aliases: ["End Title", "Credit Roll"],
    category: "Placement Types",
    definition:
      "The song playing over the closing credits. Often a featured placement.",
    artistTip:
      "End credits = highest emotional real estate. Pitch your most cinematic, cathartic tracks for end-credit consideration.",
  },
  {
    term: "Trailer Tag",
    aliases: ["Tag", "Post-Title Tag"],
    category: "Trailer & Cinematic",
    definition:
      "The short musical or comedic phrase that plays after the title card in a trailer.",
    artistTip:
      "Deliver a 'no-tag' trailer version alongside the main. Tags change between trailer cuts — the editor swaps them.",
  },
  {
    term: "Title Drop",
    category: "Trailer & Cinematic",
    definition:
      "The moment the title of the film/show/album appears on screen. Music usually hits hard here.",
    artistTip:
      "Your trailer cue should land its biggest hit between 2:00-2:15 — right where most title drops happen in a 2:30 trailer.",
  },
  {
    term: "3-Act Trailer",
    category: "Trailer & Cinematic",
    difficulty: "intermediate",
    definition:
      "The standard theatrical trailer structure: Act 1 (setup, 0:00-0:30), Act 2 (escalation, 0:30-1:20), Act 3 (climax, 1:20-2:20), optional tag.",
    advancedDefinition:
      "The seams at 0:30 and 1:20 are NON-NEGOTIABLE for trailer editors — the picture editor cuts to those exact beats. Your music needs clean 'punch-ins' at those seconds. If your song's chorus lands at 0:45, it won't cut — no matter how good it is. 3-act trailers are why trailer-music houses (Two Steps From Hell, Audiomachine) build cues specifically to this structure.",
    realWorldExample:
      "The Dune (2021) main trailer — Act 1 (0:00-0:30, Paul's voice + desert shots), Act 2 hit at 0:30 (Hans Zimmer brass), Act 2 escalation to 1:20, Act 3 full orchestral climax with title drop at 2:00. Every trailer cue you hear in theaters follows this clock.",
    usageContext:
      "Every theatrical trailer. TV spots (60s / 30s) compress the 3 acts proportionally. Teasers may use only acts 1+3.",
    related: ["Trailer Tag", "Title Drop", "Braam", "TV Spot"],
    artistTip:
      "Pitch your trailer cues as 3-act compatible. Provide act-break hits at 0:30 and 1:20 as separate stems — these are the critical seams.",
  },
  {
    term: "TV Spot",
    category: "Trailer & Cinematic",
    definition:
      "A shortened trailer for broadcast — typically 15, 30, or 60 seconds.",
    artistTip:
      "TV spots must land exactly on the :15 / :30 / :60 mark. 2 frames over blows the ad slot. Deliver frame-perfect cut-downs alongside your 2:30 trailer cue.",
  },
  {
    term: "ISRC",
    aliases: ["International Standard Recording Code"],
    category: "Deliverables & Technical",
    definition:
      "Unique 12-character code identifying a specific sound recording (master).",
    artistTip:
      "Embed ISRCs in your delivered audio files (metadata). PROs and distributors use ISRCs to route royalties — missing ISRCs = missing money.",
  },
  {
    term: "ISWC",
    aliases: ["International Standard Work Code"],
    category: "Deliverables & Technical",
    definition:
      "Unique code identifying a musical composition (separate from ISRC which is the recording).",
    artistTip:
      "ISWCs are assigned by your PRO when you register a composition. They link the song across every recording — covers, remixes, re-records.",
  },
  {
    term: "Mechanical Royalty",
    category: "Royalties & Revenue",
    definition:
      "Royalty paid to the publisher/songwriter for reproductions of the composition — CD sales, downloads, streams.",
    artistTip:
      "Mechanicals are compulsory in the US at a statutory rate (currently 12.4¢ per song per physical). Streaming mechanicals flow through the MLC — register there.",
  },
  {
    term: "Performance Royalty",
    category: "Royalties & Revenue",
    definition:
      "Royalty paid to the publisher/songwriter when music is performed publicly — broadcast, streamed, played in venues.",
    artistTip:
      "Performance royalties are your 'backend' on sync placements. They dwarf the upfront fee over time on recurring TV shows.",
  },
  {
    term: "Sync Fee",
    aliases: ["Upfront Fee", "Sync License Fee"],
    category: "Royalties & Revenue",
    definition:
      "The one-time fee paid to license your music for a placement.",
    artistTip:
      "Sync fees are your upfront. Performance royalties are your backend. Together they're the full comp — never evaluate an offer on sync fee alone.",
  },
  {
    term: "Library Music",
    aliases: ["Production Music", "Stock Music"],
    category: "Placement Types",
    definition:
      "Pre-cleared music catalogs available for licensing at fixed rates. Fast and cheap for supervisors.",
    artistTip:
      "Library music is high-volume, low-fee. Good for paying bills and building cue-sheet history. Keep your artist-brand tracks separate from library submissions.",
  },
  {
    term: "Retitling",
    category: "Placement Types",
    definition:
      "Giving the same song a different title when placing it with a library, so it can be licensed under both identities.",
    artistTip:
      "Libraries often require retitled, non-exclusive versions. Read the fine print — some libraries take 50%+ and lock up your original.",
  },
  {
    term: "Pre-Cleared",
    category: "Licensing & Legal",
    definition:
      "A song with all licensing resolved in advance — buyers can license it with no back-and-forth.",
    artistTip:
      "Pre-cleared songs get placed 3x more than non-pre-cleared. If you control your masters and splits, advertise 'pre-cleared' in your pitch.",
  },
  {
    term: "Cleared Sample",
    aliases: ["Sample Clearance"],
    category: "Licensing & Legal",
    definition:
      "Permission secured to use a piece of an existing recording or composition in your song.",
    artistTip:
      "Uncleared samples disqualify your song from every sync placement. Either clear the sample up-front or replay the part with session musicians.",
  },
  {
    term: "Cut Down",
    aliases: ["Cutdown", "Edit"],
    category: "Deliverables & Technical",
    definition:
      "A shortened version of a song — 30s, 60s, or 90s — for ads, trailers, or bumpers.",
    artistTip:
      "Deliver 15s / 30s / 60s / full versions of every track. Ad and trailer placements need the exact duration; if you don't have it, they cut someone else's song instead.",
  },
  {
    term: "BPM",
    aliases: ["Beats Per Minute"],
    category: "Deliverables & Technical",
    definition: "The tempo of the song in beats per minute.",
    artistTip:
      "Supervisors search their libraries by BPM. Wrong BPM in your metadata = you don't show up in searches. Use a tap-tempo tool to verify before uploading.",
  },
  {
    term: "Key",
    category: "Deliverables & Technical",
    definition:
      "The musical key of the song (e.g. C minor, G major). Often searched together with BPM.",
    artistTip:
      "Supervisors sometimes filter by minor vs. major for emotional tone. Tag both key and mode in your metadata.",
  },
  {
    term: "Mood",
    aliases: ["Vibe", "Emotion"],
    category: "Deliverables & Technical",
    definition:
      "The emotional color of the song — tagged with keywords like 'melancholic', 'triumphant', 'tense', 'uplifting'.",
    artistTip:
      "Supervisors search by mood more than genre. Tag 5-10 specific mood words per track; generic tags ('happy', 'sad') underperform.",
  },
  {
    term: "Blanket License",
    category: "Licensing & Legal",
    definition:
      "A single license covering all music in a catalog, paid as a flat fee — common for libraries and production music.",
    artistTip:
      "Good for consistent cash flow, bad for breakout hits. If one song explodes under a blanket, you can't renegotiate for that one track.",
  },
  {
    term: "Work For Hire",
    aliases: ["WFH"],
    category: "Licensing & Legal",
    definition:
      "A contract where the artist assigns all rights to the commissioning party. Artist gets paid once, never again.",
    artistTip:
      "Avoid WFH for original songs. Accept WFH for instrumental cues and custom scores where the backend is minimal anyway.",
  },
  {
    term: "Spot",
    category: "Placement Types",
    definition: "Industry slang for a commercial — 15, 30, or 60 seconds.",
    artistTip:
      "Spots pay the best per-second but require frame-perfect deliverables and fast turnaround (often 24-48 hours).",
  },
  {
    term: "Cue",
    category: "Placement Types",
    definition:
      "A single piece of music in a film or TV episode. Tracked on the cue sheet.",
    artistTip:
      "A single episode of a drama can have 15-40 cues. Each one generates performance royalties independently — cue-volume matters.",
  },
  {
    term: "Featured Placement",
    aliases: ["Featured"],
    category: "Placement Types",
    definition:
      "A prominent placement where the song drives the scene — e.g. a needle drop over a montage or end credit.",
    artistTip:
      "Featured placements pay 2-3x background placements. Pitch your strongest hook-forward tracks for featured consideration specifically.",
  },
  {
    term: "Background",
    aliases: ["Background Instrumental", "BGV", "BG"],
    category: "Placement Types",
    definition:
      "A placement where music plays quietly under dialog — ambient, supportive, not driving the scene.",
    artistTip:
      "Background pays less per use but places faster and more often. Instrumental catalog with wide dynamic range (dialog-safe verses) gets picked for BG.",
  },
  {
    term: "Pitch",
    category: "Industry Roles",
    definition:
      "Submitting your song for consideration on a brief, project, or supervisor's request.",
    artistTip:
      "Supervisors give briefs with short windows (24-72 hours). Have a ready-to-send pitch template per genre/mood — speed wins placements.",
  },
  {
    term: "Brief",
    category: "Industry Roles",
    definition:
      "A specific music request from a supervisor or library — mood, BPM, duration, reference tracks.",
    artistTip:
      "Read briefs carefully. 'Female vocal, mid-tempo, uplifting' eliminates 90% of your catalog immediately. Only pitch matches.",
  },
  {
    term: "Reference Track",
    aliases: ["Reference", "Ref"],
    category: "Industry Roles",
    definition:
      "An existing commercial song the supervisor wants you to sound like — 'give me something like Billie Eilish, Hostage.'",
    artistTip:
      "When a brief has a reference, pitch the closest match from your catalog. Don't try to write new if the deadline is tight — supervisors will take the first match that lands.",
  },
  {
    term: "Temp Score",
    category: "Industry Roles",
    definition:
      "Music used during editing to set the tone before a composer scores the real version.",
    artistTip:
      "Composers occasionally license the temp track when 'temp love' sets in. Keeping your most cinematic instrumentals pre-cleared means you can convert temp love into real deals.",
  },
  {
    term: "Broadcast Mix",
    aliases: ["Broadcast Master"],
    category: "Production & Mix",
    definition:
      "A master mixed to broadcast loudness specs — typically -24 LUFS US, -23 LUFS EU, true peak -2 dBTP.",
    artistTip:
      "Streaming masters are too loud for broadcast. Keep a broadcast-spec master of each single on hand; supervisors will skip songs they can't deliver to broadcast QC.",
  },
  {
    term: "Dialog-Safe",
    aliases: ["Dialog-Friendly"],
    category: "Production & Mix",
    definition:
      "A section of music (or a mix) that leaves dynamic room in the 200Hz–4kHz range where dialog lives, so it doesn't compete with VO.",
    artistTip:
      "Trailer, ad, and TV placements require dialog-safe lulls — usually the verses. Scoop your midrange slightly in the mix. Hard-to-duck mixes lose to easy-to-duck mixes.",
  },
  {
    term: "Loop Point",
    category: "Structure & Arrangement",
    definition:
      "A designated moment where a piece of music cleanly loops back to an earlier point — critical for games and streaming beds.",
    artistTip:
      "For game audio, deliver seamless loops (no DC offset, no click at the seam). Mark loop points in the filename: 'Track_loop_2-00.wav'.",
  },
  {
    term: "Drop",
    category: "Structure & Arrangement",
    definition:
      "A big impact moment where elements drop in (or out) — the 'drop' in EDM, the chorus-entry in pop.",
    artistTip:
      "Trailer editors cut to drops. Time your drop to land on a clean downbeat so the editor can sync it to a visual hit without micro-adjustments.",
  },
  {
    term: "Rise",
    aliases: ["Riser", "Build"],
    category: "Structure & Arrangement",
    definition:
      "A sound-design element or arrangement choice that builds tension before a drop or hit.",
    artistTip:
      "Ship your rises and braams as isolated stems. Trailer houses collect rises across projects and re-use them.",
  },
];

export const SYNC_CATEGORIES: SyncCategory[] = [
  "Structure & Arrangement",
  "Trailer & Cinematic",
  "Production & Mix",
  "Deliverables & Technical",
  "Licensing & Legal",
  "Royalties & Revenue",
  "Placement Types",
  "Industry Roles",
  "Platforms & Formats",
];
