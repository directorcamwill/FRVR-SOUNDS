-- 00022_northwoods_rooms.sql
-- Rebrand the catalog into The Northwoods — a unified pine-cabin estate.
-- Replaces the original eight rooms with ten Northwoods spaces, all sharing
-- a single world (Drake Related's spatial model applied to one estate).
-- Sets hero_image_url on every room so the lobby can render real photography
-- instead of the procedural CSS scenes. Idempotent.

-- Clear the old room set. Cascade wipes library_room_songs assignments —
-- those will be reseeded once catalog deals are assigned to Northwoods rooms.
DELETE FROM library_rooms;

INSERT INTO library_rooms (slug, name, tagline, description, hero_image_url, accent_color, sort_order)
VALUES
  ('the-lodge', 'The Lodge',
   'Vinyl spinning. Embers. Two a.m.',
   'The great room. Stone fireplace, worn leather, vinyl spinning, misty pines through the glass. Where the night settles in.',
   '/catalog/rooms/the-lodge.png',
   '#C48A3B', 10),

  ('the-cellar', 'The Cellar',
   'Under the floorboards, something good.',
   'Vaulted stone beneath the estate. Candles, brass lantern, turntable and MPC on a walnut workbench. Bass lives here.',
   '/catalog/rooms/the-cellar.webp',
   '#8B5A3C', 20),

  ('the-hall', 'The Hall',
   'Strings, and nothing else.',
   'Cathedral timber ceilings, a grand piano lit by cathedral-scale golden shafts. Third-act resolution.',
   '/catalog/rooms/the-hall.png',
   '#D4AF37', 30),

  ('the-garage', 'The Garage',
   'Chrome at midnight.',
   'Vintage Porsche, chrome and walnut, portable speakers. The estate''s private motor room. Late night, roof-up energy.',
   '/catalog/rooms/the-garage.webp',
   '#B87333', 40),

  ('the-bar', 'The Bar',
   'Pour slowly. Play slower.',
   'Polished walnut, backlit bourbon, brass footrail, leather stools. A turntable spins. The pines stand witness through tall windows.',
   '/catalog/rooms/the-bar.webp',
   '#C9A96E', 50),

  ('the-study', 'The Study',
   'The lamp on. The door locked.',
   'Writer''s desk. Banker''s lamp pooling. A saxophone case leaning in the shadow. Something is being worked out.',
   '/catalog/rooms/the-study.webp',
   '#6B4423', 60),

  ('the-screening-room', 'The Screening Room',
   'Dialogue optional.',
   'Red velvet, the projector''s white beam cutting through smoke. No dialogue, all feeling.',
   '/catalog/rooms/the-screening-room.png',
   '#8B1A1A', 70),

  ('the-library', 'The Library',
   'The records that found us.',
   'Floor-to-ceiling vinyl, leather journals, brass lamp on the walnut desk. Where the taste is decided.',
   '/catalog/rooms/the-library.png',
   '#C4954F', 80),

  ('the-overlook', 'The Overlook',
   'The first light, the first take.',
   'Porch edge. Adirondack chairs, a lake still as glass, peaks receding in amber mist. A record spinning outside.',
   '/catalog/rooms/the-overlook.webp',
   '#9CB0A2', 90),

  ('the-stargazer', 'The Stargazer',
   'Where the sky gets the last word.',
   'The porch at 2am. A firepit, the Milky Way, silver on black water. The longest sustain of the night.',
   '/catalog/rooms/the-stargazer.webp',
   '#4A5A7C', 100);

COMMENT ON TABLE library_rooms IS 'The Northwoods — ten spaces of a single pine-cabin estate. Each room is a mood; together they are one place.';
