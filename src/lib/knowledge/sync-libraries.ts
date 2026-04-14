// XJ-Will's Curated List — 111 Sync Libraries
export interface SyncLibrary {
  name: string;
  category: string;
  exclusive: boolean;
  genres: string[];
  description: string;
  website: string;
  difficulty: "easy" | "moderate" | "selective";
}

export const SYNC_LIBRARIES: SyncLibrary[] = [
  // 1-10
  { name: "1 Revolution Music", category: "TV/Film", exclusive: true, genres: ["Cinematic", "Electronic", "Rock", "Pop"], description: "Production music library for TV, film, and advertising.", website: "1revolutionmusic.com", difficulty: "selective" },
  { name: "4 Elements Music", category: "TV/Film", exclusive: true, genres: ["All Genres"], description: "Production music for broadcast and media projects.", website: "4elementsmusic.com", difficulty: "selective" },
  { name: "411 Music Group", category: "TV/Film", exclusive: true, genres: ["All Genres"], description: "Full-service music production and licensing company.", website: "411musicgroup.com", difficulty: "selective" },
  { name: "5 Alarm Music", category: "TV/Film", exclusive: true, genres: ["All Genres"], description: "Major production music library. Heavy TV and advertising placements.", website: "5alarmmusic.com", difficulty: "selective" },
  { name: "A&G Sync", category: "Boutique", exclusive: false, genres: ["All Genres"], description: "Sync licensing and music supervision services.", website: "agsync.com", difficulty: "moderate" },  { name: "APM Music", category: "TV/Film", exclusive: true, genres: ["All Genres"], description: "One of the largest production music libraries. TV, film, games.", website: "apmmusic.com", difficulty: "selective" },
  { name: "Artlist", category: "Premium", exclusive: false, genres: ["Pop", "Electronic", "Cinematic", "Hip-Hop", "Indie"], description: "Subscription-based platform for creators. Growing sync placements.", website: "artlist.io", difficulty: "moderate" },
  { name: "Atom Music Audio", category: "Trailer", exclusive: true, genres: ["Cinematic", "Epic", "Orchestral", "Electronic"], description: "Trailer and epic music for film campaigns and advertising.", website: "atommusicaudio.com", difficulty: "selective" },
  { name: "Atomica Music", category: "TV/Film", exclusive: true, genres: ["All Genres"], description: "Production music library for broadcast and media.", website: "atomicamusic.com", difficulty: "selective" },

  // 11-20
  { name: "Atrium Music", category: "TV/Film", exclusive: true, genres: ["Cinematic", "Electronic", "Ambient", "Orchestral"], description: "Cinematic and atmospheric production music.", website: "atriummusic.com", difficulty: "selective" },
  { name: "Audiio", category: "Marketplace", exclusive: false, genres: ["Cinematic", "Electronic", "Pop", "Ambient"], description: "Growing marketplace with lifetime license model for buyers.", website: "audiio.com", difficulty: "easy" },
  { name: "Audio Jungle", category: "Marketplace", exclusive: false, genres: ["All Genres"], description: "Massive Envato marketplace for production music. Good for passive income.", website: "audiojungle.net", difficulty: "easy" },
  { name: "Audio Machine", category: "Trailer", exclusive: true, genres: ["Cinematic", "Epic", "Orchestral", "Electronic"], description: "Top trailer music company. Major film campaigns.", website: "audiomachine.com", difficulty: "selective" },
  { name: "Audio Network", category: "Premium", exclusive: true, genres: ["All Genres"], description: "London-based production music. Global TV, film, and advertising.", website: "audionetwork.com", difficulty: "selective" },
  { name: "Audio Socket", category: "Marketplace", exclusive: false, genres: ["All Genres"], description: "AI-powered sync matching. Non-exclusive licensing.", website: "audiosocket.com", difficulty: "easy" },
  { name: "AudioSparx", category: "Marketplace", exclusive: false, genres: ["All Genres"], description: "Large online music licensing marketplace. Wide variety of uses.", website: "audiosparx.com", difficulty: "easy" },
  { name: "BMG Production Music", category: "TV/Film", exclusive: true, genres: ["All Genres"], description: "Major label production music arm. Global TV and film placements.", website: "bmgproductionmusic.com", difficulty: "selective" },
  // 21-30
  { name: "Big Sync Music", category: "Boutique", exclusive: false, genres: ["All Genres"], description: "UK-based sync licensing agency for indie artists.", website: "bigsyncmusic.com", difficulty: "moderate" },
  { name: "Black Toast Music", category: "TV/Film", exclusive: false, genres: ["All Genres"], description: "Music licensing for TV, film, and digital media.", website: "blacktoastmusic.com", difficulty: "moderate" },
  { name: "Boost Music", category: "TV/Film", exclusive: true, genres: ["Pop", "Electronic", "Hip-Hop"], description: "Production music for advertising and branded content.", website: "boostmusic.com", difficulty: "moderate" },
  { name: "Bopper Music", category: "Boutique", exclusive: false, genres: ["Pop", "Indie", "Electronic", "Folk"], description: "Curated sync licensing for advertising and film.", website: "boppermusic.com", difficulty: "moderate" },
  { name: "Brand X Music", category: "Trailer", exclusive: true, genres: ["Cinematic", "Epic", "Orchestral", "Hybrid"], description: "Trailer music for major film and TV campaigns.", website: "brandxmusic.net", difficulty: "selective" },
  { name: "Brilliant Music", category: "TV/Film", exclusive: true, genres: ["All Genres"], description: "Production music library for broadcast and advertising.", website: "brilliantmusic.com", difficulty: "selective" },
  { name: "Chroma Music", category: "TV/Film", exclusive: true, genres: ["Cinematic", "Electronic", "Ambient"], description: "Atmospheric and cinematic production music.", website: "chromamusic.com", difficulty: "selective" },
  { name: "Clear Wave Music", category: "TV/Film", exclusive: true, genres: ["All Genres"], description: "Production music for TV, film, and corporate media.", website: "clearwavemusic.com", difficulty: "selective" },  { name: "CrimeSonics", category: "TV/Film", exclusive: true, genres: ["Dark", "Cinematic", "Electronic", "Ambient"], description: "Specializes in dark, tension, and crime-genre production music.", website: "crimesonics.com", difficulty: "selective" },

  // 31-40
  { name: "Crucial Music", category: "TV/Film", exclusive: false, genres: ["Rock", "Pop", "Country", "Electronic"], description: "Nashville-based. Strong TV placements. Non-exclusive.", website: "crucialmusic.com", difficulty: "moderate" },
  { name: "DA Music", category: "TV/Film", exclusive: true, genres: ["All Genres"], description: "German production music library. European broadcast focus.", website: "da-music.de", difficulty: "selective" },  { name: "De Wolfe Music", category: "TV/Film", exclusive: true, genres: ["All Genres"], description: "Historic UK music library. Film, TV, and advertising since 1909.", website: "dewolfemusic.com", difficulty: "selective" },  { name: "EMI Production Music", category: "TV/Film", exclusive: true, genres: ["All Genres"], description: "Major production music division. Global placements.", website: "emiproductionmusic.com", difficulty: "selective" },
  { name: "Epitome Music", category: "Boutique", exclusive: false, genres: ["Pop", "Indie", "R&B", "Electronic"], description: "Curated sync licensing for quality media placements.", website: "epitomemusic.com", difficulty: "moderate" },
  { name: "Eternal Music Group", category: "TV/Film", exclusive: true, genres: ["All Genres"], description: "Production music for broadcast, film, and advertising.", website: "eternalmusicgroup.com", difficulty: "selective" },
  { name: "Evolution Media Music", category: "TV/Film", exclusive: true, genres: ["All Genres"], description: "Full-service production music and custom scoring.", website: "evolutionmediamusic.com", difficulty: "selective" },
  { name: "Extreme Music", category: "TV/Film", exclusive: true, genres: ["All Genres"], description: "Sony's production music arm. Major TV and film placements.", website: "extrememusic.com", difficulty: "selective" },

  // 41-50
  { name: "First Com Music", category: "TV/Film", exclusive: true, genres: ["All Genres"], description: "Production music for broadcast, film, and advertising.", website: "firstcom.com", difficulty: "selective" },
  { name: "Flavorlab", category: "Boutique", exclusive: false, genres: ["All Genres"], description: "NYC-based music and sound design studio. Custom and sync licensing.", website: "flavorlab.com", difficulty: "selective" },
  { name: "Flik Trax", category: "Marketplace", exclusive: false, genres: ["All Genres"], description: "Independent music licensing platform for media.", website: "fliktrax.com", difficulty: "easy" },
  { name: "Freeplay Music", category: "Marketplace", exclusive: false, genres: ["All Genres"], description: "Royalty-free music library with broad licensing options.", website: "freeplaymusic.com", difficulty: "easy" },
  { name: "GMP Music", category: "TV/Film", exclusive: true, genres: ["All Genres"], description: "Production music for broadcast and corporate media.", website: "gmpmusic.com", difficulty: "selective" },
  { name: "Gargantuan Music", category: "Trailer", exclusive: true, genres: ["Epic", "Cinematic", "Orchestral", "Hybrid"], description: "Epic trailer and cinematic music for major campaigns.", website: "gargantuanmusic.com", difficulty: "selective" },
  { name: "Ghost Writer Music", category: "TV/Film", exclusive: true, genres: ["All Genres"], description: "Production music for TV, film, and media projects.", website: "ghostwritermusic.com", difficulty: "selective" },
  { name: "Hard Music Group", category: "TV/Film", exclusive: true, genres: ["Rock", "Electronic", "Hip-Hop", "Cinematic"], description: "Edgy production music for high-energy media.", website: "hardmusicgroup.com", difficulty: "selective" },
  { name: "Heavy Hitters Music", category: "Urban", exclusive: false, genres: ["Hip-Hop", "R&B", "Pop", "Trap"], description: "Urban music sync for TV, film, and sports.", website: "heavyhittersmusic.com", difficulty: "selective" },
  { name: "Howling Music", category: "Boutique", exclusive: false, genres: ["Indie", "Electronic", "Alternative", "Cinematic"], description: "Boutique sync agency with curated indie catalog.", website: "howlingmusic.com", difficulty: "moderate" },

  // 51-60
  { name: "Icon Trailer Music", category: "Trailer", exclusive: true, genres: ["Epic", "Cinematic", "Orchestral"], description: "Trailer music for major film and TV campaigns.", website: "icontrailermusic.com", difficulty: "selective" },
  { name: "Immediate Music", category: "Trailer", exclusive: true, genres: ["Epic", "Orchestral", "Cinematic", "Electronic"], description: "Premier trailer music for major Hollywood campaigns.", website: "immediatemusic.com", difficulty: "selective" },
  { name: "In Style Music", category: "TV/Film", exclusive: true, genres: ["Pop", "Electronic", "R&B", "Hip-Hop"], description: "Contemporary production music for media and advertising.", website: "instylemusic.com", difficulty: "selective" },
  { name: "Jingle Punks", category: "TV/Film", exclusive: false, genres: ["All Genres"], description: "Major TV sync placements. Known for reality TV and unscripted.", website: "jinglepunks.com", difficulty: "moderate" },
  { name: "KP Sync Lab", category: "Boutique", exclusive: false, genres: ["All Genres"], description: "Sync licensing and music placement lab.", website: "kpsynclab.com", difficulty: "moderate" },
  { name: "Liquid Cinema", category: "Trailer", exclusive: true, genres: ["Cinematic", "Epic", "Orchestral", "Electronic"], description: "Cinematic and trailer music for film and media.", website: "liquidcinema.com", difficulty: "selective" },
  { name: "Lovely Music", category: "TV/Film", exclusive: true, genres: ["All Genres"], description: "Production music for film, TV, and commercial projects.", website: "lovelymusic.com", difficulty: "selective" },
  { name: "LuckStock", category: "Marketplace", exclusive: false, genres: ["All Genres"], description: "Affordable music licensing marketplace for creators.", website: "luckstock.com", difficulty: "easy" },  { name: "Marmoset Music", category: "Boutique", exclusive: false, genres: ["Indie", "Folk", "Electronic", "Alternative"], description: "Portland-based boutique agency. High-quality placements in ads and film.", website: "marmosetmusic.com", difficulty: "selective" },

  // 61-70
  { name: "Megatrax", category: "TV/Film", exclusive: true, genres: ["All Genres"], description: "Hollywood-based production music library. Film and TV specialists.", website: "megatrax.com", difficulty: "selective" },  { name: "Music Bed", category: "Premium", exclusive: false, genres: ["Cinematic", "Indie", "Ambient", "Folk", "Electronic"], description: "High-end sync for film, ads, and branded content. Curated catalog.", website: "musicbed.com", difficulty: "selective" },
  { name: "Music Blvd Group Trailer Music", category: "Trailer", exclusive: true, genres: ["Epic", "Cinematic", "Orchestral"], description: "Trailer and promo music for film and TV campaigns.", website: "musicblvdgroup.com", difficulty: "selective" },
  { name: "Music For Productions", category: "TV/Film", exclusive: true, genres: ["All Genres"], description: "Production music catalog for broadcast and corporate media.", website: "musicforproductions.com", difficulty: "selective" },
  { name: "Music Vine", category: "Premium", exclusive: false, genres: ["Indie", "Folk", "Cinematic", "Ambient"], description: "UK-based. Beautiful catalog. Film and commercial sync.", website: "musicvine.com", difficulty: "moderate" },
  { name: "Norma Music", category: "TV/Film", exclusive: true, genres: ["All Genres"], description: "Production music for European broadcast and media.", website: "normamusic.com", difficulty: "selective" },
  { name: "Pacifica Music", category: "TV/Film", exclusive: true, genres: ["All Genres"], description: "Production music for film, TV, and corporate projects.", website: "pacificamusic.com", difficulty: "selective" },
  { name: "Pink Shark Music", category: "TV/Film", exclusive: true, genres: ["Pop", "Electronic", "Hip-Hop"], description: "Contemporary production music for TV and advertising.", website: "pinksharkmusic.com", difficulty: "selective" },

  // 71-80
  { name: "Pond 5", category: "Marketplace", exclusive: false, genres: ["All Genres"], description: "Large marketplace. Easy submission. Lower per-track fees but high volume.", website: "pond5.com", difficulty: "easy" },
  { name: "Position Music", category: "TV/Film", exclusive: true, genres: ["Cinematic", "Trailer", "Electronic", "Rock"], description: "Major trailer and TV placement company. Works with top shows and films.", website: "positionmusic.com", difficulty: "selective" },  { name: "Premium Beat", category: "Premium", exclusive: true, genres: ["All Genres"], description: "Shutterstock-owned curated library. Higher per-track pricing.", website: "premiumbeat.com", difficulty: "moderate" },  { name: "Pusher Trailer Music", category: "Trailer", exclusive: true, genres: ["Electronic", "Cinematic", "Epic", "Hybrid"], description: "Electronic and cinematic trailer music for major campaigns.", website: "pushermusic.com", difficulty: "selective" },
  { name: "RX Music", category: "Ads/Commercial", exclusive: false, genres: ["All Genres"], description: "Background music solutions for brands and retail spaces.", website: "rxmusic.com", difficulty: "moderate" },
  { name: "Raft Music", category: "Boutique", exclusive: false, genres: ["Indie", "Electronic", "Pop", "Alternative"], description: "Boutique sync licensing with curated indie catalog.", website: "raftmusic.com", difficulty: "moderate" },
  { name: "Resonant Music", category: "TV/Film", exclusive: true, genres: ["Cinematic", "Electronic", "Ambient"], description: "Atmospheric and resonant production music for media.", website: "resonantmusic.com", difficulty: "selective" },
  // 81-90
  { name: "ScapeTunes", category: "Marketplace", exclusive: false, genres: ["All Genres"], description: "Music licensing platform for creators and media.", website: "scapetunes.com", difficulty: "easy" },
  { name: "Score A Score", category: "TV/Film", exclusive: true, genres: ["Cinematic", "Orchestral"], description: "Custom scoring and production music for film and media.", website: "scoreascore.com", difficulty: "selective" },
  { name: "Score Production Music", category: "TV/Film", exclusive: true, genres: ["Cinematic", "Orchestral", "Electronic"], description: "Production music scoring for broadcast and media.", website: "scoreproductionmusic.com", difficulty: "selective" },
  { name: "ScoreKeepers", category: "TV/Film", exclusive: true, genres: ["Cinematic", "Orchestral", "Electronic"], description: "Production music and custom scoring services.", website: "scorekeepers.com", difficulty: "selective" },
  { name: "Scout Music", category: "Boutique", exclusive: false, genres: ["Indie", "Alternative", "Electronic", "Folk"], description: "Boutique sync scouting and licensing.", website: "scoutmusic.com", difficulty: "moderate" },
  { name: "Signature Tracks", category: "TV/Film", exclusive: true, genres: ["All Genres"], description: "Production music for TV, sports, and entertainment.", website: "signaturetracks.com", difficulty: "selective" },  { name: "Songs For Film & TV", category: "TV/Film", exclusive: false, genres: ["All Genres"], description: "Sync licensing connecting artists to film and TV opportunities.", website: "songsforfilmandtv.com", difficulty: "moderate" },
  { name: "Songs To Your Eyes", category: "Trailer", exclusive: true, genres: ["Epic", "Cinematic", "Orchestral", "Hybrid"], description: "Epic and emotional trailer music for visual media.", website: "songstoyoureyes.com", difficulty: "selective" },
  { name: "Soundscape Media", category: "TV/Film", exclusive: true, genres: ["Ambient", "Cinematic", "Electronic"], description: "Atmospheric soundscape music for media and production.", website: "soundscapemedia.com", difficulty: "selective" },

  // 91-100
  { name: "Spider Cues", category: "Trailer", exclusive: true, genres: ["Cinematic", "Epic", "Dark", "Electronic"], description: "Trailer and promo music specializing in dark, tension cues.", website: "spidercues.com", difficulty: "selective" },  { name: "Stephen Arnold Music", category: "TV/Film", exclusive: true, genres: ["All Genres"], description: "Sonic branding and production music for TV networks.", website: "stephenarnoldmusic.com", difficulty: "selective" },
  { name: "Strike Audio", category: "TV/Film", exclusive: true, genres: ["Rock", "Electronic", "Cinematic", "Hip-Hop"], description: "High-energy production music for sports and entertainment.", website: "strikeaudio.com", difficulty: "selective" },
  { name: "Sync Daddy", category: "Submission", exclusive: false, genres: ["All Genres"], description: "Sync submission platform connecting artists to opportunities.", website: "syncdaddy.com", difficulty: "easy" },
  { name: "Syncfree Music", category: "Marketplace", exclusive: false, genres: ["All Genres"], description: "Royalty-free music licensing for content creators.", website: "syncfreemusic.com", difficulty: "easy" },
  { name: "Teragram Music", category: "Boutique", exclusive: false, genres: ["Indie", "Electronic", "Alternative"], description: "Boutique sync agency for quality indie placements.", website: "teragrammusic.com", difficulty: "moderate" },
  { name: "The Cueniverse", category: "TV/Film", exclusive: true, genres: ["All Genres"], description: "Production music universe for broadcast and media.", website: "thecueniverse.com", difficulty: "selective" },
  { name: "The Diner Music", category: "Boutique", exclusive: false, genres: ["Pop", "Rock", "Indie", "Country"], description: "Boutique sync licensing. Focus on authentic artist music for TV.", website: "thedinermusic.com", difficulty: "moderate" },
  { name: "The Music Case", category: "Boutique", exclusive: false, genres: ["All Genres"], description: "Curated music licensing for film, TV, and advertising.", website: "themusiccase.com", difficulty: "moderate" },

  // 101-111
  { name: "The Music Playground", category: "Boutique", exclusive: false, genres: ["Pop", "Indie", "Electronic", "R&B"], description: "Boutique sync agency. Quality placements in TV and advertising.", website: "themusicplayground.com", difficulty: "moderate" },
  { name: "Transition Music", category: "TV/Film", exclusive: true, genres: ["All Genres"], description: "Production music for TV transitions, promos, and bumpers.", website: "transitionmusic.com", difficulty: "selective" },
  { name: "Triple Scoop Music", category: "Ads/Commercial", exclusive: false, genres: ["Pop", "Indie", "Folk", "Electronic"], description: "Focus on advertising and branded content.", website: "triplescoopmusic.com", difficulty: "moderate" },  { name: "Tune Society", category: "Marketplace", exclusive: false, genres: ["All Genres"], description: "Community-driven music licensing platform.", website: "tunesociety.com", difficulty: "easy" },
  { name: "Tunedge", category: "Marketplace", exclusive: false, genres: ["All Genres"], description: "Music licensing platform for media and content creators.", website: "tunedge.com", difficulty: "easy" },
  { name: "Twelve Titans Music", category: "Trailer", exclusive: true, genres: ["Epic", "Cinematic", "Orchestral", "Hybrid"], description: "Epic trailer music for major film and TV campaigns.", website: "twelvetitansmusic.com", difficulty: "selective" },
  { name: "Universal Music Publishing Group", category: "TV/Film", exclusive: true, genres: ["All Genres"], description: "Major publisher with massive sync catalog. Selective access.", website: "umusicpub.com", difficulty: "selective" },  { name: "YookaMusic", category: "Marketplace", exclusive: false, genres: ["All Genres"], description: "Music licensing and distribution platform.", website: "yookamusic.com", difficulty: "easy" },
  { name: "Zync Music", category: "Boutique", exclusive: false, genres: ["Pop", "Electronic", "Indie", "R&B"], description: "Boutique sync licensing agency. Personalized pitching.", website: "zyncmusic.com", difficulty: "moderate" },

  // === STREAMER-APPROVED / MAJOR PLACEMENT LIBRARIES (Added) ===
  { name: "That Pitch", category: "Submission", exclusive: false, genres: ["All Genres"], description: "Submit unlimited tracks, keep 100% of earnings. Distributes to 100+ music libraries worldwide. No upfront fees.", website: "thatpitch.com", difficulty: "easy" },
  { name: "Ditto Music Sync", category: "Premium", exclusive: false, genres: ["All Genres"], description: "Major sync division with confirmed placements on Netflix, HBO, BBC. Global reach through Ditto distribution network.", website: "dittomusic.com", difficulty: "moderate" },
  { name: "UnitedMasters Sync", category: "Premium", exclusive: false, genres: ["Hip-Hop", "R&B", "Pop", "Electronic"], description: "SELECT artists get sync opportunities. Confirmed placements on ESPN, HBO, Adult Swim. Direct brand deals with Apple, NBA.", website: "unitedmasters.com", difficulty: "moderate" },
  { name: "Symphonic Sync", category: "Premium", exclusive: false, genres: ["All Genres"], description: "Distribution company with dedicated sync team. Partners with Bodega Sync for TV, film, ads, and video game placements.", website: "symphonic.com", difficulty: "moderate" },
  { name: "Bodega Sync", category: "Boutique", exclusive: false, genres: ["All Genres"], description: "Pre-cleared catalog for one-stop licensing. Network of music supervisors. Specializes in indie artists for advertising and TV. Partners with Symphonic.", website: "bodegasync.com", difficulty: "moderate" },
  { name: "Disco", category: "Submission", exclusive: false, genres: ["All Genres"], description: "Catalog management and pitching platform used by music supervisors at major studios. Industry-standard tool for sync pitching.", website: "disco.ac", difficulty: "moderate" },
  { name: "Synchtank", category: "Submission", exclusive: false, genres: ["All Genres"], description: "B2B sync licensing platform used by UK and EU music supervisors. Catalog management and rights clearance tools.", website: "synchtank.com", difficulty: "moderate" },
  { name: "Good Ear Music Supervision", category: "Supervision", exclusive: false, genres: ["All Genres"], description: "Music supervision firm with placements for Apple, Nike, Google, Target, Spotify, Honda, Samsung, ESPN. Direct access to major campaigns.", website: "goodearmusic.com", difficulty: "selective" },
  { name: "Triple Threat Music Supervision", category: "Supervision", exclusive: false, genres: ["All Genres"], description: "Music supervision with confirmed placements on Netflix, Hulu, FX, ESPN, CBS Sports, NBC, Paramount, MTV, Lionsgate, Jack Daniels.", website: "triplethreatsupervision.com", difficulty: "selective" },
  { name: "Music Gateway", category: "Submission", exclusive: false, genres: ["All Genres"], description: "Partnerships with Disney, Netflix, and Universal. Monthly subscription model. Sync opportunities, collaboration, and distribution.", website: "musicgateway.com", difficulty: "easy" },
  { name: "Songtradr", category: "Marketplace", exclusive: false, genres: ["All Genres"], description: "Largest B2B music marketplace. Acquired Pretzel, Soundtrack Your Brand. TV, film, ads, and digital. Non-exclusive.", website: "songtradr.com", difficulty: "easy" },
  { name: "iSpy Tunes", category: "Submission", exclusive: false, genres: ["All Genres"], description: "Sync licensing directory and submission platform. Rankings of music supervisors and licensing companies.", website: "ispytunes.com", difficulty: "easy" },
  { name: "Sync Money", category: "Submission", exclusive: false, genres: ["All Genres"], description: "AI-powered sync licensing platform. Matches artists to placement opportunities using machine learning.", website: "syncmoney.ai", difficulty: "easy" },
  { name: "The Sync Report", category: "Submission", exclusive: false, genres: ["All Genres"], description: "Comprehensive directory of music supervisors and ad agency contacts who license indie songs for TV, film, commercials, trailers.", website: "thesyncreport.com", difficulty: "moderate" },
  { name: "Unchained Music Sync", category: "Submission", exclusive: false, genres: ["All Genres"], description: "Distribution platform with sync licensing division. Pitching tools for independent artists.", website: "unchainedmusic.io", difficulty: "easy" },

  // === MAJOR PUBLISHERS & CATALOG COMPANIES ===
  { name: "Warner Chappell Production Music", category: "Major Publisher", exclusive: true, genres: ["All Genres"], description: "Warner's production music division. Premium TV and film sync worldwide.", website: "warnerchappellpm.com", difficulty: "selective" },
  { name: "Sony Music Licensing", category: "Major Publisher", exclusive: true, genres: ["All Genres"], description: "Sony's sync licensing division. Access to one of the world's largest catalogs.", website: "sonymusic.com", difficulty: "selective" },
  { name: "Kobalt Music Group", category: "Major Publisher", exclusive: false, genres: ["All Genres"], description: "Tech-forward publisher. Transparent royalty collection. Major sync placements.", website: "kobaltmusic.com", difficulty: "selective" },
  { name: "Concord Music", category: "Major Publisher", exclusive: true, genres: ["All Genres"], description: "Major independent publisher. Owns Imagem, Rodgers & Hammerstein catalogs. Film and TV sync.", website: "concord.com", difficulty: "selective" },
  { name: "Peermusic", category: "Major Publisher", exclusive: true, genres: ["All Genres"], description: "Largest independent music publisher. 30+ offices worldwide. Strong Latin and global sync.", website: "peermusic.com", difficulty: "selective" },
  { name: "Downtown Music Publishing", category: "Major Publisher", exclusive: false, genres: ["All Genres"], description: "Major indie publisher (now DFRNT). Owns Songtrust. Global sync and publishing admin.", website: "dfrntmusic.com", difficulty: "selective" },
  { name: "Spirit Music Group", category: "Major Publisher", exclusive: true, genres: ["All Genres"], description: "Major publisher with strong country, pop, and rock catalogs. Active sync division.", website: "spiritmusicgroup.com", difficulty: "selective" },
  { name: "Primary Wave Music", category: "Major Publisher", exclusive: true, genres: ["All Genres"], description: "Iconic catalog acquirer. Owns rights to major classic catalogs. Premium sync placements.", website: "primarywave.com", difficulty: "selective" },
  { name: "Hipgnosis Songs", category: "Major Publisher", exclusive: true, genres: ["All Genres"], description: "Major catalog investment fund. Owns thousands of hit songs. Active sync licensing program.", website: "hipgnosissongs.com", difficulty: "selective" },
  { name: "Round Hill Music", category: "Major Publisher", exclusive: true, genres: ["All Genres"], description: "Catalog acquirer and publisher. Classic rock and pop catalogs with active sync.", website: "roundhillmusic.com", difficulty: "selective" },
  { name: "Reservoir Media", category: "Major Publisher", exclusive: true, genres: ["All Genres"], description: "Independent music company. Publishing and recorded music with dedicated sync team.", website: "reservoir-media.com", difficulty: "selective" },
  { name: "Anthem Entertainment", category: "Major Publisher", exclusive: true, genres: ["All Genres"], description: "Canadian entertainment company. Publishing, management, and sync licensing.", website: "anthementertainment.com", difficulty: "selective" },
  { name: "Big Deal Music", category: "Major Publisher", exclusive: false, genres: ["Indie", "Alternative", "Pop", "Singer-Songwriter"], description: "Indie publisher with strong sync track record. Known for quality indie placements.", website: "bigdealmusic.com", difficulty: "selective" },
  { name: "Wixen Music Publishing", category: "Major Publisher", exclusive: true, genres: ["All Genres"], description: "Independent publisher representing major songwriters. Active sync licensing.", website: "wixenmusic.com", difficulty: "selective" },
  { name: "Third Side Music", category: "Major Publisher", exclusive: false, genres: ["Indie", "Electronic", "Alternative", "Hip-Hop"], description: "Canadian independent publisher. Known for indie and electronic sync placements.", website: "thirdsidemusic.com", difficulty: "moderate" },

  // === PRODUCTION MUSIC LIBRARIES ===
  { name: "ALIBI Music", category: "TV/Film", exclusive: true, genres: ["All Genres"], description: "Production music library. Pre-cleared one-stop licensing for TV, film, and advertising.", website: "alibimusic.com", difficulty: "selective" },
  { name: "Killer Tracks", category: "TV/Film", exclusive: true, genres: ["All Genres"], description: "Universal-owned production music. Premium TV and advertising placements.", website: "killertracks.com", difficulty: "selective" },
  { name: "KPM Music", category: "TV/Film", exclusive: true, genres: ["All Genres"], description: "EMI/Sony-owned classic production music library. Iconic catalog since 1960s.", website: "kpmmusic.co.uk", difficulty: "selective" },
  { name: "West One Music Group", category: "TV/Film", exclusive: true, genres: ["All Genres"], description: "UK production music library. International TV, film, and advertising.", website: "westonemusic.com", difficulty: "selective" },
  { name: "Cavendish Music", category: "TV/Film", exclusive: true, genres: ["All Genres"], description: "UK-based production music. BBC, ITV, and international broadcast placements.", website: "cavendishmusic.com", difficulty: "selective" },
  { name: "Tele Music", category: "TV/Film", exclusive: true, genres: ["All Genres"], description: "French production music library. European broadcast and film. Classic catalog.", website: "telemusic.com", difficulty: "selective" },
  { name: "Boosey & Hawkes", category: "TV/Film", exclusive: true, genres: ["Classical", "Cinematic", "Orchestral"], description: "Major classical music publisher with production music and sync division.", website: "boosey.com", difficulty: "selective" },
  { name: "Naxos Licensing", category: "TV/Film", exclusive: true, genres: ["Classical", "Jazz", "Orchestral"], description: "World's largest classical catalog for sync. Film, TV, and advertising.", website: "naxos.com", difficulty: "selective" },
  { name: "Nightingale Music", category: "TV/Film", exclusive: true, genres: ["All Genres"], description: "Production music for broadcast, film, and corporate media.", website: "nightingalemusic.com", difficulty: "selective" },
  { name: "NOMA Music", category: "TV/Film", exclusive: true, genres: ["All Genres"], description: "Curated production music for film, TV, and advertising.", website: "nomamusic.com", difficulty: "moderate" },
  { name: "Opus 1 Music", category: "TV/Film", exclusive: true, genres: ["All Genres"], description: "Fast-growing production music library. 150,000+ tracks of pre-cleared music.", website: "opus1musiclibrary.com", difficulty: "selective" },
  { name: "Slipstream Music", category: "TV/Film", exclusive: true, genres: ["All Genres"], description: "Production music for broadcast and digital media.", website: "slipstreammusic.com", difficulty: "selective" },
  { name: "Mastersource", category: "TV/Film", exclusive: false, genres: ["All Genres"], description: "Master recording licensing for TV, film, and advertising.", website: "mastersource.com", difficulty: "moderate" },
  { name: "Rumblefish", category: "TV/Film", exclusive: false, genres: ["All Genres"], description: "Digital licensing for TV, film, and user-generated content platforms.", website: "rumblefish.com", difficulty: "moderate" },
  { name: "FineTune Music", category: "TV/Film", exclusive: false, genres: ["All Genres"], description: "Music licensing for advertising, film, and digital content.", website: "finetunemusic.com", difficulty: "moderate" },

  // === MARKETPLACE / ROYALTY-FREE ===
  { name: "AudioMicro", category: "Marketplace", exclusive: false, genres: ["All Genres"], description: "Royalty-free music and sound effects marketplace.", website: "audiomicro.com", difficulty: "easy" },
  { name: "Jamendo", category: "Marketplace", exclusive: false, genres: ["All Genres"], description: "European music licensing platform. Free and commercial licensing tiers.", website: "jamendo.com", difficulty: "easy" },
  { name: "Soundstripe", category: "Marketplace", exclusive: false, genres: ["Pop", "Electronic", "Hip-Hop", "Cinematic"], description: "Subscription-based music licensing. Growing catalog with sync opportunities.", website: "soundstripe.com", difficulty: "moderate" },
  { name: "Storyblocks Audio", category: "Marketplace", exclusive: false, genres: ["All Genres"], description: "Subscription library for video creators. High volume usage.", website: "storyblocks.com", difficulty: "easy" },
  { name: "Motion Array", category: "Marketplace", exclusive: false, genres: ["All Genres"], description: "Stock media marketplace including music licensing for creators.", website: "motionarray.com", difficulty: "easy" },
  { name: "Melody Loops", category: "Marketplace", exclusive: false, genres: ["All Genres"], description: "Royalty-free music loops and full tracks for media projects.", website: "melodyloops.com", difficulty: "easy" },
  { name: "Shockwave Sound", category: "Marketplace", exclusive: false, genres: ["All Genres"], description: "Royalty-free music and sound effects library. Easy licensing.", website: "shockwave-sound.com", difficulty: "easy" },
  { name: "Magnatune", category: "Marketplace", exclusive: false, genres: ["All Genres"], description: "Independent music licensing. Fair-trade approach to music licensing.", website: "magnatune.com", difficulty: "easy" },
  { name: "SoundReef", category: "Marketplace", exclusive: false, genres: ["All Genres"], description: "Italian music licensing platform. Background music and sync.", website: "soundreef.com", difficulty: "easy" },
  { name: "License Pro", category: "Marketplace", exclusive: false, genres: ["All Genres"], description: "Music licensing app for content creators and media.", website: "licensepro.app", difficulty: "easy" },
  { name: "Youlicense", category: "Marketplace", exclusive: false, genres: ["All Genres"], description: "Music licensing marketplace connecting artists to commercial users.", website: "youlicense.com", difficulty: "easy" },

  // === BOUTIQUE / SYNC AGENCIES ===
  { name: "Hook Line and Sync", category: "Boutique", exclusive: false, genres: ["All Genres"], description: "UK-based sync agency. TV, film, and advertising placements.", website: "hooklineandsync.com", difficulty: "moderate" },
  { name: "LoveCat Music", category: "Boutique", exclusive: false, genres: ["Indie", "Electronic", "Alternative"], description: "Boutique sync licensing and music supervision.", website: "lovecatmusic.com", difficulty: "moderate" },
  { name: "Sonic Quiver", category: "Boutique", exclusive: false, genres: ["Cinematic", "Electronic", "Ambient"], description: "Boutique trailer and cinematic music agency.", website: "sonicquiver.com", difficulty: "selective" },
  { name: "Defacto Sound", category: "Boutique", exclusive: false, genres: ["All Genres"], description: "Sound design and music licensing for media and advertising.", website: "defactosound.com", difficulty: "moderate" },
  { name: "MIBE Music", category: "Boutique", exclusive: false, genres: ["All Genres"], description: "Music licensing and sync for film, TV, and advertising.", website: "mibemusic.com", difficulty: "moderate" },
  { name: "Konsonant", category: "Boutique", exclusive: false, genres: ["Electronic", "Ambient", "Cinematic"], description: "Boutique music licensing with focus on atmospheric and electronic.", website: "konsonant.com", difficulty: "moderate" },
  { name: "Musync", category: "Boutique", exclusive: false, genres: ["All Genres"], description: "Music sync agency connecting artists to media opportunities.", website: "musync.com", difficulty: "moderate" },
  { name: "The Sync Agency", category: "Boutique", exclusive: false, genres: ["All Genres"], description: "Full-service sync licensing agency. TV, film, and advertising.", website: "thesyncagency.com", difficulty: "moderate" },
  { name: "Terrorbird Media", category: "Boutique", exclusive: false, genres: ["Indie", "Electronic", "Alternative", "Experimental"], description: "Indie-focused sync licensing and PR.", website: "terrorbird.com", difficulty: "moderate" },

  // === SUBMISSION / DISCOVERY PLATFORMS ===
  { name: "Groover", category: "Submission", exclusive: false, genres: ["All Genres"], description: "Submit to curators, radio, labels, and sync supervisors. European-based. Credit system.", website: "groover.co", difficulty: "easy" },
  { name: "MusoSoup", category: "Submission", exclusive: false, genres: ["All Genres"], description: "PR and sync submission platform for independent artists.", website: "musosoup.com", difficulty: "easy" },
  { name: "PlayMPE", category: "Submission", exclusive: false, genres: ["All Genres"], description: "Secure music delivery to radio, press, and sync supervisors.", website: "plaympe.com", difficulty: "moderate" },
  { name: "Film Music Network", category: "Submission", exclusive: false, genres: ["All Genres"], description: "Job board and submission platform for film and TV music opportunities.", website: "filmmusicnetwork.com", difficulty: "easy" },
  { name: "Hello Music", category: "Submission", exclusive: false, genres: ["All Genres"], description: "Artist services platform with sync licensing opportunities.", website: "hellomusic.com", difficulty: "easy" },

  // === INDIE LABEL SYNC DIVISIONS ===
  { name: "Ninja Tune Sync", category: "Label Sync", exclusive: false, genres: ["Electronic", "Hip-Hop", "Jazz", "Experimental"], description: "Sync division of legendary UK electronic label. Major film and TV placements.", website: "ninjatune.net", difficulty: "selective" },
  { name: "Domino Publishing", category: "Label Sync", exclusive: false, genres: ["Indie", "Alternative", "Electronic"], description: "Domino Records' publishing and sync division. Arctic Monkeys, Franz Ferdinand catalog.", website: "dominomusic.com", difficulty: "selective" },
  { name: "Mute Song", category: "Label Sync", exclusive: false, genres: ["Electronic", "Industrial", "Alternative"], description: "Mute Records' sync division. Depeche Mode, Nick Cave catalog access.", website: "mute.com", difficulty: "selective" },
  { name: "4AD Sync", category: "Label Sync", exclusive: false, genres: ["Indie", "Alternative", "Dream Pop", "Electronic"], description: "4AD Records sync licensing. Iconic indie catalog.", website: "4ad.com", difficulty: "selective" },
  { name: "Beggars Group Sync", category: "Label Sync", exclusive: false, genres: ["Indie", "Alternative", "Electronic"], description: "Beggars Group (4AD, Matador, Rough Trade, XL) sync licensing.", website: "beggars.com", difficulty: "selective" },
  { name: "Sub Pop Sync", category: "Label Sync", exclusive: false, genres: ["Indie", "Alternative", "Grunge", "Rock"], description: "Sub Pop Records sync division. Iconic indie/alt catalog.", website: "subpop.com", difficulty: "selective" },
  { name: "Rough Trade Sync", category: "Label Sync", exclusive: false, genres: ["Indie", "Post-Punk", "Alternative"], description: "Rough Trade Records sync licensing.", website: "roughtraderecords.com", difficulty: "selective" },
  { name: "Secretly Sync", category: "Label Sync", exclusive: false, genres: ["Indie", "Folk", "Alternative", "Experimental"], description: "Secretly Distribution sync licensing. Jagjaguwar, Dead Oceans, Secretly Canadian.", website: "secretlydistribution.com", difficulty: "selective" },
  { name: "Stones Throw Sync", category: "Label Sync", exclusive: false, genres: ["Hip-Hop", "Soul", "Funk", "Electronic"], description: "Stones Throw Records sync. Classic hip-hop and soul catalog.", website: "stonesthrow.com", difficulty: "selective" },
  { name: "Warp Records Sync", category: "Label Sync", exclusive: false, genres: ["Electronic", "IDM", "Experimental", "Ambient"], description: "Warp Records sync licensing. Aphex Twin, Boards of Canada catalog.", website: "warp.net", difficulty: "selective" },
  { name: "XL Recordings Sync", category: "Label Sync", exclusive: false, genres: ["Pop", "Electronic", "Indie", "Hip-Hop"], description: "XL Recordings sync. Adele, Radiohead, The Prodigy catalog access.", website: "xlrecordings.com", difficulty: "selective" },
  { name: "Sentric Music", category: "Label Sync", exclusive: false, genres: ["All Genres"], description: "UK publishing admin with dedicated sync division. Global royalty collection.", website: "sentricmusic.com", difficulty: "easy" }
];

export const LIBRARY_CATEGORIES = [
  "All",
  "Premium",
  "Major Publisher",
  "TV/Film",
  "Marketplace",
  "Boutique",
  "Ads/Commercial",
  "Submission",
  "Supervision",
  "Trailer",
  "Urban",
  "Label Sync",
];
