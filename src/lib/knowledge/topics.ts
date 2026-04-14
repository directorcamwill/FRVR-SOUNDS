export interface KnowledgeTopic {
  id: string;
  category: string;
  title: string;
  subtitle: string;
  icon: string; // lucide icon name
  content: {
    what: string;
    why: string;
    how: string[];
    watch_out: string[];
    pro_tip: string;
  };
  related: string[];
}

export const KNOWLEDGE_TOPICS: KnowledgeTopic[] = [
  // === ROYALTIES ===
  {
    id: "royalties-overview",
    category: "Royalties",
    title: "How Music Royalties Work",
    subtitle: "The 6 types of royalties every artist should collect",
    icon: "DollarSign",
    content: {
      what: "Royalties are payments you earn every time your music is used — played on a stream, on TV, on the radio, in a store, or in a film. There are 6 main types, and most artists only collect 1-2 of them, leaving serious money on the table.",
      why: "If you only collect streaming royalties through your distributor, you're missing mechanical royalties, performance royalties, sync fees, and more. A single song can generate income from 4-5 different sources simultaneously.",
      how: [
        "Register with a PRO (ASCAP, BMI, or SESAC) to collect performance royalties",
        "Register with The MLC to collect mechanical royalties from streaming",
        "Register with SoundExchange to collect digital performance royalties",
        "Set up a publishing admin (Songtrust, TuneCore Publishing) to collect worldwide publishing royalties",
        "Use a distributor (DistroKid, TuneCore) for streaming revenue",
        "Pursue sync licensing for TV/film/ad placement fees",
      ],
      watch_out: [
        "Your distributor does NOT collect all your royalties — only streaming revenue",
        "PRO royalties and mechanical royalties are completely separate systems",
        "If you don't register, the money sits unclaimed — it doesn't come to you automatically",
        "International royalties require a publishing admin to collect properly",
      ],
      pro_tip:
        "Set up ALL registration types for every song you release. It takes 30 minutes per song and can double your income from the same number of streams.",
    },
    related: [
      "performance-royalties",
      "mechanical-royalties",
      "sync-fees",
      "pro-registration",
    ],
  },
  {
    id: "performance-royalties",
    category: "Royalties",
    title: "Performance Royalties",
    subtitle: "Money earned when your music is played publicly",
    icon: "Radio",
    content: {
      what: "Performance royalties are paid when your music is performed publicly — radio, TV, live venues, restaurants, streaming services, and anywhere music plays for an audience. Your PRO (ASCAP, BMI, SESAC) collects these for you.",
      why: "This is often the largest royalty stream for successful songs. A single TV placement can generate thousands in performance royalties. Even background music in a coffee shop generates small payments that add up.",
      how: [
        "Join a PRO — ASCAP and BMI are free, SESAC is invite-only",
        "Register as BOTH a writer and a publisher (you can be your own publisher)",
        "Register every song you release with your PRO",
        "Make sure your metadata matches exactly across all platforms",
      ],
      watch_out: [
        "You can only belong to ONE PRO at a time",
        "If you don't register as your own publisher, you lose 50% of performance royalties",
        "Registrations can take 6-12 months to start generating payments",
        "Your PRO does NOT collect mechanical royalties — that's a different system",
      ],
      pro_tip:
        "Always register as both writer AND publisher with your PRO. The publisher share is 50% of performance royalties — if you don't claim it, nobody gets it.",
    },
    related: ["royalties-overview", "pro-registration", "mechanical-royalties"],
  },
  {
    id: "mechanical-royalties",
    category: "Royalties",
    title: "Mechanical Royalties",
    subtitle: "Money earned when your music is reproduced or streamed",
    icon: "Disc",
    content: {
      what: "Mechanical royalties are generated every time your song is reproduced — that includes every single stream on Spotify, Apple Music, and every download purchase. In the US, The MLC (Mechanical Licensing Collective) collects these from streaming services.",
      why: "This is money ON TOP of what your distributor pays you. Your distributor collects the streaming revenue share, but mechanical royalties are a separate payment from the streaming service to The MLC. If you don't register, this money goes unclaimed.",
      how: [
        "Create a free account at TheMLC.com",
        "Register all your songs with their ISRCs and metadata",
        "Royalties are paid quarterly",
        "For international mechanicals, use a publishing admin like Songtrust",
      ],
      watch_out: [
        "The MLC only covers US mechanicals — you need a publishing admin for worldwide collection",
        "Your distributor does NOT collect mechanical royalties for you",
        "There are billions of dollars in unclaimed mechanical royalties — some of it could be yours",
        "You must register each song individually with correct ISRC codes",
      ],
      pro_tip:
        "Register with The MLC the same day you release a song. It's free and takes 5 minutes per song. Most independent artists don't do this and leave money uncollected.",
    },
    related: ["royalties-overview", "performance-royalties", "publishing-admin"],
  },
  {
    id: "sync-fees",
    category: "Royalties",
    title: "Sync Licensing Fees",
    subtitle: "Getting paid when your music is used in TV, film, and ads",
    icon: "Tv",
    content: {
      what: "Sync licensing is when someone pays to use your music in visual media — TV shows, films, commercials, video games, trailers, YouTube content. The sync fee is a one-time payment for the right to use your song. This is separate from any royalties generated when the content airs.",
      why: "Sync is the highest-paying opportunity for independent artists. A single TV placement can pay $1,000-$50,000+ as a sync fee, PLUS generate performance royalties every time the episode airs. A national commercial can pay $50,000-$500,000+.",
      how: [
        "Make sure your songs are sync-ready (clean metadata, stems available, instrumental versions)",
        "Register with sync libraries (Musicbed, Artlist, Songtradr, Marmoset)",
        "Submit to music supervisors directly when opportunities arise",
        "Have one-stop licensing capability (you control both master and publishing)",
        "Keep your catalog organized and easily searchable by mood, genre, and energy",
      ],
      watch_out: [
        "Non-exclusive library deals let you submit the same song to multiple libraries",
        "Exclusive deals pay more upfront but lock your song to one library",
        "Music supervisors need fast turnaround — have your stems and metadata ready",
        "Your song must be legally clear — no uncleared samples, all splits agreed upon",
      ],
      pro_tip:
        "One-stop licensing is your biggest advantage as an independent artist. Major labels can't offer this because their songs have complex rights. If you own both the master and publishing, you can approve a placement in minutes while a label takes weeks.",
    },
    related: [
      "royalties-overview",
      "exclusive-vs-nonexclusive",
      "one-stop-licensing",
    ],
  },

  // === OWNERSHIP ===
  {
    id: "exclusive-vs-nonexclusive",
    category: "Ownership",
    title: "Exclusive vs Non-Exclusive Deals",
    subtitle: "Understanding what you're giving away",
    icon: "Lock",
    content: {
      what: "An exclusive deal means one company has the sole right to license your music — no one else can. A non-exclusive deal means you can have the same song in multiple libraries, platforms, or catalogs simultaneously. This applies to sync libraries, distribution, publishing, and more.",
      why: "This decision directly affects how much you earn and how much control you keep. Exclusive deals often pay more per placement but limit your reach. Non-exclusive deals give you more shots at placement but individual payouts may be lower.",
      how: [
        "Start with non-exclusive deals — they give you flexibility while you build your catalog",
        "Only consider exclusive deals when the upfront payment or guarantee justifies giving up control",
        "Read every contract carefully — look for the term length, territory, and what rights you're granting",
        "Keep a spreadsheet of which songs are in which libraries and their exclusivity status",
      ],
      watch_out: [
        "Some 'non-exclusive' deals have hidden exclusivity clauses — read the fine print",
        "Exclusive deals often have automatic renewal — check the opt-out window",
        "Granting exclusive rights to a library that doesn't actively pitch your music is a waste",
        "Some deals are exclusive per territory — meaning exclusive in the US but non-exclusive elsewhere",
        "Never grant exclusive rights to your entire catalog — only individual songs",
      ],
      pro_tip:
        "The sweet spot for most independent artists: non-exclusive deals for your catalog, with selective exclusive deals for your absolute best sync-ready tracks IF the library has a proven track record of placements.",
    },
    related: [
      "sync-fees",
      "one-stop-licensing",
      "catalog-ownership",
      "selling-catalog",
    ],
  },
  {
    id: "one-stop-licensing",
    category: "Ownership",
    title: "One-Stop Licensing",
    subtitle: "Your biggest competitive advantage as an independent artist",
    icon: "Zap",
    content: {
      what: "One-stop licensing means a music supervisor only needs to contact ONE person (you) to get permission to use your song. You control both the master recording AND the publishing/composition rights. Major label artists can't offer this because their labels own the master and their publishers own the composition — requiring two separate approvals.",
      why: "Music supervisors are on tight deadlines. When they need music fast, they go to artists who can say 'yes' immediately. If licensing your song requires contacting a label, a publisher, AND the artist, the supervisor will pick someone easier. One-stop = you get the call.",
      how: [
        "Own your masters (don't sign them away to a label)",
        "Self-publish or maintain control of your publishing rights",
        "Register as both the writer AND the publisher with your PRO",
        "Mark all your songs as 'one-stop' in your metadata",
        "Have stems, instrumentals, and alt versions ready for quick delivery",
      ],
      watch_out: [
        "If you co-wrote with someone, you need their agreement for one-stop — get split sheets signed",
        "If you used samples, you may not have full one-stop capability",
        "Some publishing deals take away your ability to offer one-stop — read contracts carefully",
        "One-stop only works if your music is actually sync-ready (professional quality, clean metadata)",
      ],
      pro_tip:
        "This is the single biggest advantage independent artists have over signed artists. Protect it fiercely. Don't sign away your master or publishing rights unless the deal is genuinely worth more than the one-stop advantage.",
    },
    related: ["sync-fees", "exclusive-vs-nonexclusive", "catalog-ownership"],
  },
  {
    id: "catalog-ownership",
    category: "Ownership",
    title: "Maintaining Ownership of Your Catalog",
    subtitle: "Your catalog is your most valuable asset — protect it",
    icon: "Shield",
    content: {
      what: "Your catalog is every song you've ever created. It's an asset that generates passive income forever. Maintaining ownership means you control the master recordings and the compositions. Many artists sign away these rights early in their career for small advances and regret it later.",
      why: "Your catalog increases in value over time. Every new sync placement, every viral moment, every film use increases what your catalog is worth. Artists who retain ownership can sell or license their catalog later for significant sums. Artists who signed away rights get nothing from these increases.",
      how: [
        "Never sign a deal that transfers master ownership permanently",
        "If you must sign a label deal, negotiate for ownership reversion after 5-7 years",
        "Use distributors (not labels) for releasing music — you keep 100% ownership",
        "Register copyrights for your most important songs with the US Copyright Office ($65/song)",
        "Keep all original session files, contracts, and split sheets organized and backed up",
        "Document your creative process — timestamps prove you created the work",
      ],
      watch_out: [
        "360 deals take a percentage of ALL your income, not just music sales",
        "Some distribution deals disguised as 'partnerships' take ownership of masters",
        "Work-for-hire agreements mean you don't own what you create — avoid these for your own music",
        "Verbal agreements don't protect you — always get splits and agreements in writing",
        "If a collaborator has an unsigned split sheet, they could claim ownership later",
      ],
      pro_tip:
        "Treat your catalog like real estate. You wouldn't sell your house for one month's rent. Don't sign away your masters for a small advance. The long-term value of ownership almost always exceeds the short-term cash from a deal.",
    },
    related: ["one-stop-licensing", "selling-catalog", "exclusive-vs-nonexclusive"],
  },
  {
    id: "selling-catalog",
    category: "Ownership",
    title: "Selling Your Catalog",
    subtitle: "When, why, and how to sell your music rights",
    icon: "HandCoins",
    content: {
      what: "Selling your catalog means transferring ownership of your master recordings and/or publishing rights to a buyer in exchange for a lump sum. Catalog sales have become a major industry — companies like Hipgnosis, Primary Wave, and Round Hill Music buy catalogs from artists at multiples of their annual royalty earnings.",
      why: "A catalog sale can provide life-changing capital — buyers typically pay 10-30x annual royalties for proven catalogs. For example, if your catalog earns $50,000/year in royalties, you might sell for $500,000-$1,500,000. But once sold, that income stream is gone forever. This is a one-time decision.",
      how: [
        "Build your catalog's value first — consistent royalty income over 2-3+ years",
        "Get your catalog professionally valued by a music business attorney or broker",
        "Approach catalog acquisition companies or work with a broker",
        "Negotiate which rights you're selling (masters only, publishing only, or both)",
        "Consider selling only a percentage (e.g., 50% of publishing) to retain some income",
        "Have a music attorney review ALL terms before signing",
      ],
      watch_out: [
        "Don't sell too early — your catalog's value increases over time",
        "Some buyers want perpetual ownership — others offer term-limited deals",
        "Selling publishing separately from masters is an option — you don't have to sell everything",
        "Tax implications can be significant — consult an accountant before selling",
        "Once sold, you lose control over how your music is used (the buyer decides sync placements)",
        "Some deals include 'right of first refusal' — meaning you must offer to the buyer first if you want to sell later",
      ],
      pro_tip:
        "Most artists should NOT sell their catalog unless they're earning substantial royalties and need the capital for something specific. Building and holding your catalog is almost always the better long-term financial decision. If you do sell, never sell 100% — keep at least the writer's share of your publishing.",
    },
    related: [
      "catalog-ownership",
      "royalties-overview",
      "exclusive-vs-nonexclusive",
    ],
  },

  // === REGISTRATION ===
  {
    id: "pro-registration",
    category: "Registration",
    title: "PRO Registration (ASCAP, BMI, SESAC)",
    subtitle: "Collecting your performance royalties",
    icon: "FileCheck",
    content: {
      what: "A Performance Rights Organization (PRO) tracks when your music is played publicly and collects royalties on your behalf. In the US, the main PROs are ASCAP, BMI, and SESAC. Every songwriter and publisher must register with one to collect performance royalties.",
      why: "Without PRO registration, you earn nothing when your song plays on TV, radio, in a restaurant, at a live event, or in a streaming service's 'performance' category. This money simply goes uncollected.",
      how: [
        "Choose a PRO: ASCAP (free online signup) or BMI (free online signup). SESAC is invite-only.",
        "Register as a WRITER (your name as songwriter)",
        "Register as a PUBLISHER (create your own publishing entity — even as a sole proprietor)",
        "Register every song with all songwriter/publisher splits",
        "Wait 6-9 months for royalties to start flowing (there's a delay in the system)",
      ],
      watch_out: [
        "You can ONLY belong to one PRO — switching requires a formal process",
        "Register as BOTH writer and publisher to collect 100% of performance royalties",
        "Make sure song registrations match your distributor metadata exactly (title, writers)",
        "International performances require sub-publishers or a publishing admin to collect",
      ],
      pro_tip:
        "ASCAP vs BMI doesn't matter much — they pay similar rates. What matters is registering EVERY song as both writer and publisher. The publisher share is 50% of all performance royalties — don't leave it unclaimed.",
    },
    related: ["royalties-overview", "performance-royalties", "mechanical-royalties"],
  },
  {
    id: "publishing-admin",
    category: "Registration",
    title: "Publishing Administration",
    subtitle: "Collecting royalties you didn't know existed",
    icon: "Globe",
    content: {
      what: "A publishing administrator handles the business side of your songwriting — registering your songs worldwide, collecting royalties from foreign countries, and making sure every dollar owed to you actually reaches you. Services like Songtrust, TuneCore Publishing, and CD Baby Pro do this for a percentage (usually 10-20%).",
      why: "Your PRO only collects performance royalties in your home country efficiently. International royalties, mechanical royalties from foreign streams, and micro-sync payments often go uncollected without an admin. A publishing admin can increase your total royalty collection by 20-40%.",
      how: [
        "Sign up for a publishing admin service (Songtrust is popular for independents)",
        "Register all your songs through their platform",
        "They handle worldwide registration with 60+ collection societies",
        "Royalties flow through them to you, minus their commission (10-20%)",
        "They also handle The MLC registration in some cases",
      ],
      watch_out: [
        "Publishing admin is NOT the same as a publishing DEAL — admin services don't own your rights",
        "Some publishing admins require minimum terms (1-3 years)",
        "Make sure the admin doesn't conflict with your PRO registrations",
        "Read the contract — some admins take a commission on ALL royalties, not just what they collect",
      ],
      pro_tip:
        "A publishing admin paying for itself is the easiest math in music. If they collect even $50/year in royalties you wouldn't have gotten otherwise, the 15% commission ($7.50) is worth it. Most artists are surprised by how much uncollected money exists internationally.",
    },
    related: ["mechanical-royalties", "pro-registration", "royalties-overview"],
  },

  // === BUSINESS ===
  {
    id: "split-sheets",
    category: "Business",
    title: "Split Sheets",
    subtitle: "The document that prevents lawsuits",
    icon: "FileText",
    content: {
      what: "A split sheet is a written agreement between all creators of a song that documents who owns what percentage. It covers songwriting credit, production credit, and how royalties are divided. This should be signed BEFORE or immediately after any collaboration session.",
      why: "Without a split sheet, any collaborator can claim any percentage of ownership later. Verbal agreements don't hold up. If your song gets a sync placement or goes viral, an unsigned collaborator could demand 50% or more and have legal standing to get it. Split sheets prevent this.",
      how: [
        "Create a split sheet for EVERY song with more than one creator",
        "Include: song title, date, all contributor names, their roles, their ownership percentages",
        "Include PRO affiliations and IPI numbers for each contributor",
        "Have all parties sign (digital signatures work)",
        "Keep copies — send to all participants",
      ],
      watch_out: [
        "Do this BEFORE the song is released, not after",
        "If someone won't sign a split sheet, don't release the song",
        "Producers who use their beats often expect 50% — negotiate this upfront",
        "Featured artists may or may not get a writing credit — discuss before recording",
        "Percentages must add up to 100% — no more, no less",
      ],
      pro_tip:
        "Make split sheets a non-negotiable part of every session. Bring them up casually: 'Let's fill out the splits real quick before we forget.' The best time is right after the session while everyone remembers who did what. FRVR SOUNDS tracks splits automatically when you add them to your songs.",
    },
    related: ["catalog-ownership", "royalties-overview", "one-stop-licensing"],
  },
  {
    id: "music-copyright",
    category: "Business",
    title: "Copyright Registration",
    subtitle: "Proving you own what you created",
    icon: "Copyright",
    content: {
      what: "Copyright registration with the US Copyright Office creates a public record that you own your music. While copyright technically exists the moment you create a work, formal registration gives you the right to sue for infringement and collect statutory damages (up to $150,000 per infringement).",
      why: "Without formal registration, you can't sue effectively if someone steals your music. You also can't collect statutory damages or attorney's fees. Registration costs $65 per work (you can batch multiple songs in one registration for the same fee) and lasts your entire lifetime plus 70 years.",
      how: [
        "Go to copyright.gov and create an account",
        "File a Sound Recording (SR) registration for the master recording",
        "File a Performing Arts (PA) registration for the composition/lyrics",
        "You can register multiple songs as a 'collection' for one $65 fee",
        "Upload audio files and complete the application",
        "Processing takes 3-6 months but protection is backdated to filing date",
      ],
      watch_out: [
        "Registration must be filed WITHIN 3 months of publication to get full statutory damages",
        "The master recording and the composition are two separate copyrights",
        "If you co-wrote the song, all writers should be listed",
        "Poor man's copyright (mailing yourself a copy) is NOT legally valid",
      ],
      pro_tip:
        "Register your best songs — the ones most likely to be commercially successful or sync-placed. You can batch 10-20 songs in a single registration as an 'unpublished collection' for one $65 fee if they haven't been released yet.",
    },
    related: ["catalog-ownership", "split-sheets", "one-stop-licensing"],
  },
];

export const KNOWLEDGE_CATEGORIES = [
  {
    id: "Royalties",
    label: "Royalties",
    icon: "DollarSign",
    description: "How money flows in the music industry",
  },
  {
    id: "Ownership",
    label: "Ownership",
    icon: "Shield",
    description: "Protecting and leveraging your rights",
  },
  {
    id: "Registration",
    label: "Registration",
    icon: "FileCheck",
    description: "Where to register to collect money",
  },
  {
    id: "Business",
    label: "Business",
    icon: "Briefcase",
    description: "Contracts, splits, and legal basics",
  },
];
