// Placement Reference Database — curated, publicly-known sync placements.
// Each entry captures WHY it worked, not just that it happened. Seed data;
// expand as you encounter placements worth teaching from.

export type PlacementType =
  | "Needle Drop"
  | "Main Title"
  | "End Credits"
  | "Trailer"
  | "TV Spot"
  | "Source Music"
  | "Underscore"
  | "Commercial"
  | "Game Cinematic"
  | "Game Loop"
  | "Game Trailer";

export type PlatformType =
  | "Netflix"
  | "HBO"
  | "Amazon"
  | "Apple TV+"
  | "Hulu"
  | "Disney+"
  | "Theatrical Film"
  | "Network TV"
  | "Cable TV"
  | "Trailer"
  | "Commercial"
  | "Video Game"
  | "Streaming Documentary";

export interface Placement {
  id: string;
  track_title: string;
  artist: string;
  year_of_track?: number;
  year_of_placement: number;
  genre: string;
  sub_genre?: string;
  mood: string[];
  bpm?: number;
  key?: string;
  vocal_type?: "male lead" | "female lead" | "non-binary lead" | "duet" | "choir" | "instrumental" | "spoken word";
  structure?: string;
  instrumentation?: string[];
  placement_type: PlacementType;
  platform: PlatformType;
  show_or_film: string;
  episode_or_scene?: string;
  scene_description: string;
  why_it_worked: string;
  key_sync_features: string[];
  similar_tracks?: string[];
  library_source?: string;
  lesson: string;
}

export const PLACEMENTS: Placement[] = [
  // ───────── Prestige TV Needle Drops ─────────
  {
    id: "stranger_things_running_up_that_hill",
    track_title: "Running Up That Hill (A Deal With God)",
    artist: "Kate Bush",
    year_of_track: 1985,
    year_of_placement: 2022,
    genre: "Art Pop",
    sub_genre: "Synth-pop",
    mood: ["yearning", "ethereal", "cathartic", "80s"],
    bpm: 108,
    key: "Cm",
    vocal_type: "female lead",
    structure: "Pulsating synth intro · verse · chorus · verse · chorus · bridge · outro — hook returns under final scene",
    instrumentation: ["Fairlight CMI synth", "Linn drum machine", "layered vocals"],
    placement_type: "Needle Drop",
    platform: "Netflix",
    show_or_film: "Stranger Things",
    episode_or_scene: "Season 4, Episode 4 — Max's Upside Down escape",
    scene_description:
      "Max (Sadie Sink) uses the song as a lifeline while escaping Vecna's mind. The song plays in-world (diegetic via her Walkman) AND underscores the scene — rare double duty.",
    why_it_worked:
      "The song's lyrics ('be running up that road, be running up that hill') literally described the action on screen. Cathartic 80s emotional tone matched the show's period. The driving pulse cut perfectly to picture at 0:28, 0:58, 1:28, and 2:00 — all natural editor cut points.",
    key_sync_features: [
      "Driving synth pulse at 108 BPM — predictable cut points",
      "Lyrical match with on-screen action (literal 'running up hill')",
      "80s-era production fits show's 1986 setting",
      "Emotional build from intro to chorus gives editor a dynamic arc",
    ],
    similar_tracks: [
      "Depeche Mode — Enjoy the Silence",
      "Peter Gabriel — In Your Eyes",
      "Tears for Fears — Head Over Heels",
    ],
    lesson:
      "Lyrical literalism + musical build = featured placement gold. Song returned to #1 globally 37 years after release. Nora Felder's supervision choice turned a deep cut into a generational moment.",
  },
  {
    id: "sopranos_dont_stop_believin",
    track_title: "Don't Stop Believin'",
    artist: "Journey",
    year_of_track: 1981,
    year_of_placement: 2007,
    genre: "Arena Rock",
    mood: ["hopeful", "tense", "ambiguous", "80s"],
    bpm: 119,
    key: "E",
    vocal_type: "male lead",
    structure: "Piano intro · verse · pre-chorus · hook · verse · hook",
    placement_type: "Needle Drop",
    platform: "HBO",
    show_or_film: "The Sopranos",
    episode_or_scene: "Series Finale — 'Made in America'",
    scene_description:
      "Tony Soprano selects the song on a diner jukebox. The song plays as his family arrives. Cut to black mid-lyric ('Don't stop—').",
    why_it_worked:
      "The cut to black on the unfinished lyric is THE moment. The anthem's optimism contrasts with the show's moral ambiguity — audience is forced to finish the sentence themselves. A lesser-known song wouldn't carry this weight.",
    key_sync_features: [
      "Song-as-character: song is the final shot, not background",
      "Mid-lyric cut exploits audience's internalized song memory",
      "Diegetic (jukebox) grounds the choice in the world of the scene",
    ],
    similar_tracks: ["Bon Jovi — Livin' on a Prayer", "Styx — Renegade"],
    lesson:
      "When the audience knows the song, you can use its absence (the cut to black) as emotional payload. Iconic songs carry meaning supervisors can bend — don't just place it, use what the audience already feels about it.",
  },
  {
    id: "six_feet_under_breathe_me",
    track_title: "Breathe Me",
    artist: "Sia",
    year_of_track: 2004,
    year_of_placement: 2005,
    genre: "Alternative",
    sub_genre: "Piano Pop",
    mood: ["melancholic", "hopeful", "cathartic", "fragile"],
    bpm: 78,
    key: "D",
    vocal_type: "female lead",
    structure: "Sparse piano verse · swelling string build · climactic final chorus with full arrangement",
    instrumentation: ["piano", "strings", "subtle percussion"],
    placement_type: "End Credits",
    platform: "HBO",
    show_or_film: "Six Feet Under",
    episode_or_scene: "Series Finale — 'Everyone's Waiting'",
    scene_description:
      "6-minute montage showing how each main character will eventually die. Song plays continuously across decades of flash-forwards.",
    why_it_worked:
      "The song's slow build matched the emotional arc of the montage perfectly. Starting sparse (first death), ending in full arrangement (final death). Supervisor Gary Calamar built the edit around the song's peaks.",
    key_sync_features: [
      "Gradual build matches visual montage structure",
      "Female vocal with emotional fragility suits the theme of mortality",
      "Song was relatively unknown before this — the scene MADE it a sync staple",
    ],
    similar_tracks: ["Bon Iver — Skinny Love", "Aimee Mann — Save Me", "Florence + The Machine — Never Let Me Go"],
    lesson:
      "Dynamic build is a sync weapon. A song that starts sparse and ends full gives the editor a 3-5 minute scoring window — one song covers an entire emotional montage. Supervisors hunt for these.",
  },
  {
    id: "stranger_things_master_of_puppets",
    track_title: "Master of Puppets",
    artist: "Metallica",
    year_of_track: 1986,
    year_of_placement: 2022,
    genre: "Thrash Metal",
    mood: ["heroic", "intense", "triumphant"],
    bpm: 212,
    key: "Em",
    vocal_type: "male lead",
    structure: "Riff-driven intro · verse · chorus · breakdown · solo · outro",
    placement_type: "Needle Drop",
    platform: "Netflix",
    show_or_film: "Stranger Things",
    episode_or_scene: "Season 4, Episode 9 — Eddie's guitar solo in the Upside Down",
    scene_description:
      "Eddie Munson plays the song on guitar in the Upside Down to distract demobats while his friends defeat Vecna.",
    why_it_worked:
      "Metallica reportedly approved the use specifically because the scene treated the song with reverence. The song IS the scene — not background, but the dramatic centerpiece. Drove 400% streaming increase for Metallica in 72 hours.",
    key_sync_features: [
      "Song-as-weapon narrative device",
      "Full instrumental section showcased (guitar solo)",
      "Artist involved in approval = better treatment → more placements future",
    ],
    similar_tracks: ["Iron Maiden — Run to the Hills", "Black Sabbath — War Pigs"],
    lesson:
      "Don't just clear a song — sell the scene concept to the artist's team. Metallica granted this because they believed in the creative use. Reverence earns approvals.",
  },

  // ───────── Film Needle Drops ─────────
  {
    id: "graduate_sound_of_silence",
    track_title: "The Sound of Silence",
    artist: "Simon & Garfunkel",
    year_of_track: 1964,
    year_of_placement: 1967,
    genre: "Folk",
    mood: ["existential", "melancholic", "iconic"],
    bpm: 106,
    key: "Am",
    vocal_type: "duet",
    instrumentation: ["acoustic guitar", "vocal harmonies"],
    placement_type: "Needle Drop",
    platform: "Theatrical Film",
    show_or_film: "The Graduate",
    episode_or_scene: "Opening sequence and final scene",
    scene_description:
      "Opens with Dustin Hoffman on an airport moving walkway, plays again over the iconic ambiguous final shot on the bus.",
    why_it_worked:
      "Mike Nichols chose it in post-production against studio wishes. The song's tone captured Benjamin's alienation better than a commissioned score could have. Defined the 'needle drop as thematic anchor' approach for every film since.",
    key_sync_features: [
      "Same song bookending the film creates thematic frame",
      "Existing recording carried cultural weight a score couldn't",
      "Lyrical themes of alienation matched the protagonist's journey",
    ],
    similar_tracks: ["Mrs. Robinson — Simon & Garfunkel", "Leonard Cohen — Suzanne"],
    lesson:
      "The needle drop as thematic anchor is the original film-sync use case. A song used at opening AND close creates meaning no score can match. Pitch your catalog as thematic, not just musical.",
  },
  {
    id: "good_will_hunting_between_the_bars",
    track_title: "Between the Bars",
    artist: "Elliott Smith",
    year_of_track: 1997,
    year_of_placement: 1997,
    genre: "Indie Folk",
    mood: ["intimate", "vulnerable", "melancholic"],
    bpm: 98,
    key: "F",
    vocal_type: "male lead",
    instrumentation: ["fingerpicked acoustic guitar", "hushed vocal"],
    placement_type: "Needle Drop",
    platform: "Theatrical Film",
    show_or_film: "Good Will Hunting",
    episode_or_scene: "Multiple scenes throughout",
    scene_description:
      "Used in quiet emotional moments — Will's reflection, therapy scenes, and the closing.",
    why_it_worked:
      "Gus Van Sant selected Smith's songs because their intimacy matched Will's inner life. Led to Smith performing at the Oscars (Best Original Song nomination for 'Miss Misery').",
    key_sync_features: [
      "Hushed vocal dynamic = dialog-safe by default",
      "Solo acoustic instrumentation doesn't compete with Foley",
      "Emotional honesty matched the film's tone",
    ],
    similar_tracks: ["Bon Iver — Holocene", "Sufjan Stevens — Mystery of Love", "José González — Heartbeats"],
    lesson:
      "Dialog-safe dynamics are a feature. Quiet songs that leave mid-range space for voiceover get placed more than loud bangers. Deliver a 'hushed' version of your catalog if you have one.",
  },
  {
    id: "call_me_mystery_of_love",
    track_title: "Mystery of Love",
    artist: "Sufjan Stevens",
    year_of_track: 2017,
    year_of_placement: 2017,
    genre: "Indie Folk",
    mood: ["yearning", "romantic", "melancholic", "ethereal"],
    bpm: 108,
    key: "Bb",
    vocal_type: "male lead",
    instrumentation: ["banjo", "piano", "airy vocal", "percussion"],
    placement_type: "Needle Drop",
    platform: "Theatrical Film",
    show_or_film: "Call Me By Your Name",
    scene_description:
      "Commissioned for the film; plays over the Italian summer scenes and the emotional core of Elio + Oliver's relationship.",
    why_it_worked:
      "Luca Guadagnino commissioned new Sufjan material specifically for the film. The songs weren't 'dropped in' — they were written to the picture. Earned an Oscar nomination for Best Original Song.",
    key_sync_features: [
      "Song written-to-picture (hybrid of score + needle drop)",
      "Artist's existing voice matched director's sensibility",
      "Lyrics specifically address the film's themes",
    ],
    similar_tracks: ["Sufjan Stevens — Visions of Gideon", "Iron & Wine — Such Great Heights"],
    lesson:
      "Write-to-picture is a growing category. If you can produce on a film's schedule and to their reference tracks, you can bypass the catalog-pitch fight entirely. Offer it as a service in your pitch.",
  },

  // ───────── Trailer Placements ─────────
  {
    id: "thor_ragnarok_immigrant_song",
    track_title: "Immigrant Song",
    artist: "Led Zeppelin",
    year_of_track: 1970,
    year_of_placement: 2017,
    genre: "Rock",
    sub_genre: "Hard Rock",
    mood: ["heroic", "aggressive", "triumphant", "viking"],
    bpm: 113,
    key: "F#m",
    vocal_type: "male lead",
    instrumentation: ["guitar", "drums", "iconic vocal hook"],
    placement_type: "Trailer",
    platform: "Trailer",
    show_or_film: "Thor: Ragnarok",
    scene_description:
      "First trailer; Led Zeppelin's galloping riff cuts against Marvel cosmic imagery. Used again in the film itself during key fight scenes.",
    why_it_worked:
      "The 'ah-ah-ah-ah' vocal hook is the most instantly recognizable sound in rock music. Paired with Viking-themed visuals (Thor is literally a Norse god), the song was thematically perfect. Led Zeppelin almost never licenses — this was a landmark placement.",
    key_sync_features: [
      "Iconic vocal hook recognizable in <1 second",
      "113 BPM matches trailer cut rhythm",
      "Thematic match (Norse mythology) elevated from 'good choice' to 'only choice'",
    ],
    similar_tracks: ["Black Sabbath — Iron Man", "Deep Purple — Highway Star"],
    lesson:
      "Iconic 'unlicensable' songs getting licensed commands headlines and sells tickets. If you have an ambitious catalog track, a signature trailer placement can be bigger marketing than any release push.",
  },
  {
    id: "social_network_creep_cover",
    track_title: "Creep (Scala & Kolacny Brothers Cover)",
    artist: "Scala & Kolacny Brothers",
    year_of_track: 2002,
    year_of_placement: 2010,
    genre: "Choral",
    mood: ["haunting", "dark", "ethereal", "betrayal"],
    vocal_type: "choir",
    instrumentation: ["all-female choir", "sparse piano"],
    placement_type: "Trailer",
    platform: "Trailer",
    show_or_film: "The Social Network",
    scene_description:
      "Teaser trailer — choir cover of Radiohead's Creep plays over montage of Facebook. 'I wanna have control' hits as Zuckerberg looks at the camera.",
    why_it_worked:
      "A cover of a culturally-loaded song (Creep) rearranged for choir became THE sound of the trailer. Cover recontextualized the song — same lyrics, new emotional weight. Started an entire decade of 'slow dark cover' trailer music.",
    key_sync_features: [
      "Cover version is often cheaper and easier to clear than the original",
      "Reharmonization (choir vs rock) completely changes emotional color",
      "Female vocal on a male-written lyric adds complexity",
    ],
    similar_tracks: [
      "Gary Jules — Mad World (Donnie Darko)",
      "Jessie J — Dream (Dark Knight Rises trailer)",
    ],
    lesson:
      "The 'dark cover trailer' formula is still going strong 15 years later. If you can deliver haunting reharmonizations of iconic songs (with the original writers' approval), you have a high-margin sync niche.",
  },

  // ───────── Commercials ─────────
  {
    id: "ipod_nano_1234",
    track_title: "1234",
    artist: "Feist",
    year_of_track: 2007,
    year_of_placement: 2007,
    genre: "Indie Pop",
    mood: ["playful", "uplifting", "whimsical"],
    bpm: 113,
    key: "F",
    vocal_type: "female lead",
    instrumentation: ["acoustic guitar", "horns", "handclaps", "group vocals"],
    placement_type: "Commercial",
    platform: "Commercial",
    show_or_film: "Apple iPod Nano (2007)",
    scene_description:
      "Colorful choreographed dance visualizing the product's new colors, set to the song's full 1-minute chorus section.",
    why_it_worked:
      "Song's playful numeric counting ('1, 2, 3, 4') matched the iPod's rainbow of colors. Took Feist from indie darling to platinum-selling pop artist. The ad's cultural saturation made the song a generational earworm.",
    key_sync_features: [
      "Lyrical match (counting = product variations)",
      "Upbeat major-key tone = brand-safe for Apple",
      "Female vocal with character (not anonymous) gave Apple a 'discovery' narrative",
    ],
    similar_tracks: ["Yael Naim — New Soul", "Ingrid Michaelson — The Way I Am"],
    lesson:
      "Apple-style 'discovery' commercials remain the gold-standard sync for indie artists. Being a fresh-to-the-mainstream artist with a distinctive vocal is the exact profile their agencies search for.",
  },
  {
    id: "macbook_air_new_soul",
    track_title: "New Soul",
    artist: "Yael Naïm",
    year_of_track: 2007,
    year_of_placement: 2008,
    genre: "Indie Pop",
    mood: ["playful", "hopeful", "effortless"],
    bpm: 110,
    key: "Eb",
    vocal_type: "female lead",
    instrumentation: ["piano", "whistled melody", "handclaps"],
    placement_type: "Commercial",
    platform: "Commercial",
    show_or_film: "Apple MacBook Air Launch",
    scene_description:
      "MacBook Air emerges from a manila envelope — the song's whistled melody tracks the slim reveal.",
    why_it_worked:
      "The whistled hook was instantly recognizable and 'effortless' — matching Apple's product positioning (thin, simple, accessible). Song went from 0 US chart to #7 Billboard Hot 100 in weeks.",
    key_sync_features: [
      "Distinctive non-vocal hook (whistling) = brand-safe internationally",
      "Laid-back tempo matches the product's 'effortless' positioning",
      "Short, memorable melodic phrase reusable across ad lengths",
    ],
    similar_tracks: ["Peter Bjorn and John — Young Folks"],
    lesson:
      "Non-vocal hooks (whistling, humming, vocal chops) travel across territories without lyric-translation friction. If you have an international sync strategy, lean into wordless hooks.",
  },

  // ───────── Video Game Placements ─────────
  {
    id: "rdr_far_away",
    track_title: "Far Away",
    artist: "José González",
    year_of_track: 2010,
    year_of_placement: 2010,
    genre: "Indie Folk",
    mood: ["lonely", "triumphant", "journey", "reflective"],
    bpm: 86,
    key: "Am",
    vocal_type: "male lead",
    instrumentation: ["fingerpicked acoustic guitar", "hushed vocal"],
    placement_type: "Game Cinematic",
    platform: "Video Game",
    show_or_film: "Red Dead Redemption",
    episode_or_scene: "First ride into Mexico",
    scene_description:
      "After Marston crosses the river into Mexico, gameplay shifts to a slow-motion cinematic ride. The song plays uninterrupted for 3+ minutes of silent exploration.",
    why_it_worked:
      "Rockstar reserved song placements for their most emotional story beats. Players EXPECTED music to signal significance. The song made players feel the vastness of the journey without a single line of dialog.",
    key_sync_features: [
      "Extended uninterrupted playtime (3+ minutes)",
      "No dialog in scene = song carries entire emotional weight",
      "Hushed acoustic dynamic lets player hear environment SFX under it",
    ],
    similar_tracks: ["Woody Jackson — Deadman's Gun", "Bon Iver — Holocene"],
    lesson:
      "Games that restrict music placement to 3-5 moments PER GAME (Rockstar standard) give each placement 10-20 million player impressions. Quality of placement > quantity. Target these studios specifically.",
  },
  {
    id: "cyberpunk_chippin_in",
    track_title: "Chippin' In",
    artist: "Refused (as Samurai)",
    year_of_track: 2020,
    year_of_placement: 2020,
    genre: "Punk Rock",
    sub_genre: "Cyberpunk/Synth-Punk",
    mood: ["aggressive", "rebellious", "cyberpunk", "futuristic"],
    vocal_type: "male lead",
    placement_type: "Game Trailer",
    platform: "Video Game",
    show_or_film: "Cyberpunk 2077",
    scene_description:
      "Trailer + in-game as part of the fictional band 'Samurai' (Johnny Silverhand's band).",
    why_it_worked:
      "CD Projekt commissioned real bands to create music in-character for fictional artists. Refused became 'Samurai' — the music exists diegetically in the game world and as real Refused releases. Double revenue stream.",
    key_sync_features: [
      "In-universe artist identity (Samurai) = hundreds of in-game references, merch, marketing",
      "Full album commissioned, not just single placement",
      "Real band identity preserved for fans (Refused get credit + royalties)",
    ],
    similar_tracks: ["Tenacious D — game placements", "Johnny Cash — Ain't No Grave (RDR2)"],
    lesson:
      "Commissioning arrangements with established artists for fictional in-game bands is a premium sync category. If you can write in-character ('make us a viking metal band for this RPG'), you own a niche most artists can't serve.",
  },

  // ───────── Modern TV Needle Drops ─────────
  {
    id: "euphoria_all_for_us",
    track_title: "All For Us",
    artist: "Labrinth feat. Zendaya",
    year_of_track: 2019,
    year_of_placement: 2019,
    genre: "Alternative R&B",
    sub_genre: "Cinematic Pop",
    mood: ["anthemic", "cathartic", "intense", "prayer-like"],
    bpm: 78,
    key: "Fm",
    vocal_type: "duet",
    instrumentation: ["gospel choir", "orchestral hits", "electronic beat"],
    placement_type: "End Credits",
    platform: "HBO",
    show_or_film: "Euphoria",
    episode_or_scene: "Season 1 Finale — Rue's relapse",
    scene_description:
      "Season 1 finale climaxes with Rue's fantastical musical sequence set to this song, written and performed for the show.",
    why_it_worked:
      "Labrinth composed the entire show's score AND wrote songs for key emotional beats. The song is both character theme and Zendaya's dramatic centerpiece. Composer-as-artist model.",
    key_sync_features: [
      "Composer writes score + songs → unified sonic identity",
      "Lead actor (Zendaya) features on track → IP + artistic synergy",
      "Written to specific emotional beat (not catalog-matched)",
    ],
    similar_tracks: ["FKA twigs — Cellophane", "Rosalía — Con Altura"],
    lesson:
      "The composer-artist hybrid (Labrinth, Hildur Guðnadóttir, Nicholas Britell) is the fastest-growing category in prestige TV. Building cred in BOTH worlds multiplies opportunities.",
  },
  {
    id: "white_lotus_aloha_ipo",
    track_title: "Aloha Ipo (Renaissance)",
    artist: "Cristobal Tapia de Veer",
    year_of_track: 2021,
    year_of_placement: 2021,
    genre: "Experimental Electronic",
    mood: ["unsettling", "tropical", "ironic", "ominous"],
    placement_type: "Main Title",
    platform: "HBO",
    show_or_film: "The White Lotus",
    episode_or_scene: "Opening credits (Season 1)",
    scene_description:
      "Hypnotic main title theme mixing Hawaiian chant with electronic pulse — immediately signals that this tropical paradise hides something sinister.",
    why_it_worked:
      "Tapia de Veer made the theme itself a character. The theme became so iconic it won an Emmy and drove streaming of the soundtrack. Audiences now anticipate his main titles as part of the show experience.",
    key_sync_features: [
      "Theme as brand identity — listeners recognize it in 3 seconds",
      "Cultural-specific sonic palette (Hawaiian chant) ties to setting",
      "Ironic tone (tropical + ominous) = viewer knows what kind of show this is",
    ],
    lesson:
      "A memorable main title theme is the single most valuable sync placement in TV — it plays 10+ times per season for the show's entire run. If you want to compose for TV, the main title is the Grail.",
  },

  // ───────── Dramatic Film Montages ─────────
  {
    id: "boogie_nights_sister_christian",
    track_title: "Sister Christian",
    artist: "Night Ranger",
    year_of_track: 1983,
    year_of_placement: 1997,
    genre: "Arena Rock",
    mood: ["anthemic", "tense", "nostalgic", "danger"],
    bpm: 113,
    key: "G",
    vocal_type: "male lead",
    placement_type: "Needle Drop",
    platform: "Theatrical Film",
    show_or_film: "Boogie Nights",
    episode_or_scene: "Rahad Jackson drug deal scene",
    scene_description:
      "The song plays on a home stereo during a 15-minute drug deal gone wrong. Firecrackers go off throughout. Tension builds to a breaking point.",
    why_it_worked:
      "PT Anderson used the song's triumphant tone to IRONIC effect — the scene is the opposite of triumphant. Audience's familiarity with the song creates unbearable tension. Firecracker pops cut against the song's rhythm.",
    key_sync_features: [
      "Ironic use of triumphant song for dread-building",
      "Diegetic (plays on character's stereo) vs imposed music",
      "Song's structure gives a clear 'time bomb' — audience knows when it'll end",
    ],
    similar_tracks: ["Tommy James and the Shondells — Crimson and Clover"],
    lesson:
      "Songs placed against their emotional grain create unforgettable scenes. 'Happy song over terrible event' is a sync trope that still works — if your upbeat track can be read darkly, pitch it for dread-forward film.",
  },

  // ───────── Dark Prestige TV ─────────
  {
    id: "true_detective_far_from_any_road",
    track_title: "Far From Any Road",
    artist: "The Handsome Family",
    year_of_track: 2003,
    year_of_placement: 2014,
    genre: "Alt-Country",
    sub_genre: "Gothic Country",
    mood: ["ominous", "desolate", "americana", "mysterious"],
    bpm: 72,
    key: "Em",
    vocal_type: "duet",
    instrumentation: ["acoustic guitar", "pedal steel", "male + female vocals"],
    placement_type: "Main Title",
    platform: "HBO",
    show_or_film: "True Detective",
    episode_or_scene: "Season 1 opening credits",
    scene_description:
      "Haunting, slow ballad over double-exposed imagery of Louisiana landscapes + characters.",
    why_it_worked:
      "T Bone Burnett (series composer-consultant) pulled this deep-catalog cut from an obscure band. Song's gothic-country texture perfectly matched the show's bayou-noir world. Drove 1,200% spike in band's streams post-premiere.",
    key_sync_features: [
      "Deep catalog = low clearance cost for HBO",
      "Genre-specific mood (gothic country) matched show's setting",
      "Pre-existing song positioned as the show's 'found theme' — not composed-to-order",
    ],
    similar_tracks: ["Calexico — Black Heart", "16 Horsepower — Wayfaring Stranger"],
    lesson:
      "Supervisors working with composers like T Bone Burnett, Daniel Lanois, or Jon Brion dig DEEP into independent catalogs. Put your best obscure b-sides on streaming with full metadata — they might be found.",
  },

  // ───────── Modern Commercial ─────────
  {
    id: "nike_this_is_our_time",
    track_title: "Alive",
    artist: "Krewella",
    year_of_track: 2013,
    year_of_placement: 2014,
    genre: "EDM",
    sub_genre: "Electro-House",
    mood: ["triumphant", "energetic", "empowering"],
    bpm: 128,
    key: "Dbm",
    vocal_type: "female lead",
    placement_type: "Commercial",
    platform: "Commercial",
    show_or_film: "Nike Women — 'Better For It' Campaign",
    scene_description:
      "Montage of women athletes pushing through training set to the song's build + drop.",
    why_it_worked:
      "EDM's build + drop structure matches athletic narrative (struggle → breakthrough). Female-led vocal matched the target demo. Nike renewed the partnership multiple campaigns.",
    key_sync_features: [
      "Build-drop structure = narrative arc in 30 seconds",
      "Female vocal targeted specific demo",
      "High BPM (128) = energetic brand association",
    ],
    similar_tracks: ["Zedd — Clarity", "Odesza — Say My Name"],
    lesson:
      "EDM build-drop structure IS storytelling for 30-second ads. If you make EDM, explicitly market your build and drop points to agencies — they think in this arc.",
  },
];

export const PLACEMENT_TYPES: PlacementType[] = [
  "Needle Drop",
  "Main Title",
  "End Credits",
  "Trailer",
  "TV Spot",
  "Source Music",
  "Underscore",
  "Commercial",
  "Game Cinematic",
  "Game Loop",
  "Game Trailer",
];

export const PLATFORMS: PlatformType[] = [
  "Netflix",
  "HBO",
  "Amazon",
  "Apple TV+",
  "Hulu",
  "Disney+",
  "Theatrical Film",
  "Network TV",
  "Cable TV",
  "Trailer",
  "Commercial",
  "Video Game",
  "Streaming Documentary",
];
