/**
 * demoData
 *
 * Pre-processed demo dataset that matches the output shape of parseStreamingHistory().
 * Used by the "Try Demo" button in UploadScreen without any file upload.
 *
 * 8 countries with realistic listening contexts, artist selections, and track data.
 * Coordinates are duplicated from COUNTRY_DATA so MapView doesn't need to join.
 */
export const demoData = {
  // ─────────────────────────────────────────────────────────────────────────
  // United States — primary home base, Jan 2023–Mar 2024 (~44 hours)
  // ─────────────────────────────────────────────────────────────────────────
  US: {
    code: 'US',
    name: 'United States',
    lat: 39.8,
    lng: -98.5,
    totalMsPlayed: 158_400_000,
    trackCount: 1842,
    dateStart: '2023-01-08T00:00:00Z',
    dateEnd: '2024-03-15T00:00:00Z',
    topTracks: [
      { trackName: 'As It Was', artistName: 'Harry Styles', albumName: "Harry's House", playCount: 87, totalMsPlayed: 16_269_000, spotifyTrackUri: 'spotify:track:4Dvkj6JhhA12EX05fT7y2e' },
      { trackName: 'Flowers', artistName: 'Miley Cyrus', albumName: 'Endless Summer Vacation', playCount: 74, totalMsPlayed: 12_358_000, spotifyTrackUri: 'spotify:track:0yLdNVWF3Srea0uzk55zFn' },
      { trackName: 'Kill Bill', artistName: 'SZA', albumName: 'SOS', playCount: 69, totalMsPlayed: 11_592_000, spotifyTrackUri: 'spotify:track:1Qrg8KqiBpW07V7PNxwwwL' },
      { trackName: 'Unholy', artistName: 'Sam Smith', albumName: 'Gloria', playCount: 62, totalMsPlayed: 9_548_000, spotifyTrackUri: 'spotify:track:3nqQXoyQOWXiESFLlDF1hG' },
      { trackName: 'Anti-Hero', artistName: 'Taylor Swift', albumName: 'Midnights', playCount: 58, totalMsPlayed: 13_398_400, spotifyTrackUri: 'spotify:track:0V3wPSX9ygBnCm8psDIegu' },
      { trackName: 'CUFF IT', artistName: 'Beyoncé', albumName: 'Renaissance', playCount: 51, totalMsPlayed: 9_231_000, spotifyTrackUri: 'spotify:track:5IHPDjKIBjcgECPLQiDFJP' },
      { trackName: 'Bad Habit', artistName: 'Steve Lacy', albumName: 'Gemini Rights', playCount: 47, totalMsPlayed: 8_977_000, spotifyTrackUri: 'spotify:track:3iVcZ5G6tvkXZkZKlMpIUs' },
      { trackName: 'Golden Hour', artistName: 'JVKE', albumName: 'this is what ____ feels like (Vol. 1-4)', playCount: 44, totalMsPlayed: 7_216_000, spotifyTrackUri: 'spotify:track:5odlY52u43F5BjByhxg7wg' },
      { trackName: "I Ain't Worried", artistName: 'OneRepublic', albumName: 'Top Gun: Maverick OST', playCount: 39, totalMsPlayed: 6_162_000, spotifyTrackUri: 'spotify:track:4h9wh7iOZ0GGn8QVp4RAOB' },
      { trackName: 'About Damn Time', artistName: 'Lizzo', albumName: 'Special', playCount: 35, totalMsPlayed: 6_440_000, spotifyTrackUri: 'spotify:track:1xbGGBfnMjCv7Q2cKCfvUV' },
    ],
    topArtists: [
      { artistName: 'Taylor Swift', playCount: 203 },
      { artistName: 'Harry Styles', playCount: 147 },
      { artistName: 'SZA', playCount: 134 },
      { artistName: 'Beyoncé', playCount: 118 },
      { artistName: 'Miley Cyrus', playCount: 97 },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Japan — summer trip, Aug 2023 (~8 hours)
  // ─────────────────────────────────────────────────────────────────────────
  JP: {
    code: 'JP',
    name: 'Japan',
    lat: 36.2,
    lng: 138.3,
    totalMsPlayed: 28_800_000,
    trackCount: 342,
    dateStart: '2023-08-03T00:00:00Z',
    dateEnd: '2023-08-19T00:00:00Z',
    topTracks: [
      { trackName: 'Idol', artistName: 'YOASOBI', albumName: 'THE BOOK 3', playCount: 28, totalMsPlayed: 4_480_000, spotifyTrackUri: 'spotify:track:2tBmKtCCBMgzKBgcODVrj5' },
      { trackName: 'Butter', artistName: 'BTS', albumName: 'Butter', playCount: 23, totalMsPlayed: 3_588_000, spotifyTrackUri: 'spotify:track:3FeVmId7tLFbhMa85Bq9KA' },
      { trackName: 'Odorite', artistName: 'Kenshi Yonezu', albumName: 'Stray Sheep', playCount: 21, totalMsPlayed: 3_444_000, spotifyTrackUri: 'spotify:track:2SoTAkPJpRenJiqaRTNzMb' },
      { trackName: 'Racing into the Night', artistName: 'YOASOBI', albumName: 'THE BOOK', playCount: 19, totalMsPlayed: 3_344_000, spotifyTrackUri: 'spotify:track:3TGRqZ0a2l1LRblBkJoaDx' },
      { trackName: 'Lemon', artistName: 'Kenshi Yonezu', albumName: 'Lemon', playCount: 17, totalMsPlayed: 4_029_300, spotifyTrackUri: 'spotify:track:6ICMBYqoaSCBHKPslJILoU' },
      { trackName: 'One Last Kiss', artistName: 'Hikaru Utada', albumName: 'One Last Kiss', playCount: 15, totalMsPlayed: 3_240_000, spotifyTrackUri: 'spotify:track:4cktbXCEMbpIGGMYkLhNDq' },
      { trackName: 'Dynamite', artistName: 'BTS', albumName: 'BE', playCount: 14, totalMsPlayed: 2_422_000, spotifyTrackUri: 'spotify:track:5QDLhrAOJJdNAmCTJ8xMyW' },
      { trackName: 'Night Dancer', artistName: 'imase', albumName: 'Night Dancer', playCount: 12, totalMsPlayed: 2_256_000, spotifyTrackUri: 'spotify:track:5BqyTNB89P61rPXsPhUYHn' },
      { trackName: 'Subtitle', artistName: 'Official HIGE DANdism', albumName: 'Editorial', playCount: 11, totalMsPlayed: 2_398_000, spotifyTrackUri: 'spotify:track:2JoJKWBmzGHJFRuKNNwgcN' },
      { trackName: 'Feel Special', artistName: 'TWICE', albumName: 'Feel Special', playCount: 10, totalMsPlayed: 2_070_000, spotifyTrackUri: 'spotify:track:6lanRgr6wXibZr8KgzXxBl' },
    ],
    topArtists: [
      { artistName: 'YOASOBI', playCount: 71 },
      { artistName: 'Kenshi Yonezu', playCount: 58 },
      { artistName: 'BTS', playCount: 47 },
      { artistName: 'Hikaru Utada', playCount: 39 },
      { artistName: 'Official HIGE DANdism', playCount: 31 },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Mexico — holiday trip, Dec 2023 (~4 hours)
  // ─────────────────────────────────────────────────────────────────────────
  MX: {
    code: 'MX',
    name: 'Mexico',
    lat: 23.6,
    lng: -102.5,
    totalMsPlayed: 14_400_000,
    trackCount: 189,
    dateStart: '2023-12-20T00:00:00Z',
    dateEnd: '2023-12-31T00:00:00Z',
    topTracks: [
      { trackName: 'Ella Baila Sola', artistName: 'Eslabon Armado', albumName: 'Ella Baila Sola', playCount: 22, totalMsPlayed: 3_300_000, spotifyTrackUri: 'spotify:track:6T0rfTiGcMLt9ERqhYuDsX' },
      { trackName: 'Me Porto Bonito', artistName: 'Bad Bunny', albumName: 'Un Verano Sin Ti', playCount: 19, totalMsPlayed: 3_021_000, spotifyTrackUri: 'spotify:track:6Sq7ltF9Qa7SNFBsV5Cogx' },
      { trackName: 'Quevedo: Bzrp Music Sessions, Vol. 52', artistName: 'Bizarrap', albumName: 'Bzrp Music Sessions, Vol. 52', playCount: 17, totalMsPlayed: 2_754_000, spotifyTrackUri: 'spotify:track:4uUG5RXrOk84mYEfFvj3cK' },
      { trackName: 'TQG', artistName: 'KAROL G', albumName: 'MAÑANA SERÁ BONITO', playCount: 15, totalMsPlayed: 2_310_000, spotifyTrackUri: 'spotify:track:2cGMBtFJNNfaGBFErbZqSQ' },
      { trackName: 'La Bebe (Remix)', artistName: 'Yng Lvcas', albumName: 'La Bebe (Remix)', playCount: 13, totalMsPlayed: 1_989_000, spotifyTrackUri: 'spotify:track:4r8lRYnoOGdEi6YyI2YDVU' },
      { trackName: 'Un Ratito', artistName: 'Luis R Conriquez', albumName: 'Un Ratito', playCount: 11, totalMsPlayed: 1_749_000, spotifyTrackUri: 'spotify:track:3L2dRgHbVXhHyhmcgbNXmv' },
      { trackName: 'Shakira: Bzrp Music Sessions, Vol. 53', artistName: 'Bizarrap', albumName: 'Bzrp Music Sessions, Vol. 53', playCount: 10, totalMsPlayed: 1_750_000, spotifyTrackUri: 'spotify:track:7eJMfftS33KTjuF7lTsMCx' },
      { trackName: 'Amargura', artistName: 'Marc Anthony', albumName: 'Mala', playCount: 9, totalMsPlayed: 1_395_000, spotifyTrackUri: 'spotify:track:3ZFTkvIE7kyPt6Nu3jEb9X' },
      { trackName: 'El Azul', artistName: 'Junior H', albumName: 'Atrapado En El Tiempo', playCount: 8, totalMsPlayed: 1_368_000, spotifyTrackUri: 'spotify:track:2BHj31ufdEqVK5CkHDMlHt' },
      { trackName: 'Calm Down', artistName: 'Rema', albumName: 'Rave & Roses', playCount: 7, totalMsPlayed: 1_330_000, spotifyTrackUri: 'spotify:track:0WtM2NBVQNNJLh6scP13H8' },
    ],
    topArtists: [
      { artistName: 'Bad Bunny', playCount: 52 },
      { artistName: 'KAROL G', playCount: 38 },
      { artistName: 'Bizarrap', playCount: 34 },
      { artistName: 'Eslabon Armado', playCount: 29 },
      { artistName: 'Junior H', playCount: 22 },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // United Kingdom — work trip, Oct 2023 (~3 hours)
  // ─────────────────────────────────────────────────────────────────────────
  GB: {
    code: 'GB',
    name: 'United Kingdom',
    lat: 55.3,
    lng: -3.4,
    totalMsPlayed: 10_800_000,
    trackCount: 136,
    dateStart: '2023-10-04T00:00:00Z',
    dateEnd: '2023-10-11T00:00:00Z',
    topTracks: [
      { trackName: 'Escapism.', artistName: 'RAYE', albumName: 'My 21st Century Blues', playCount: 18, totalMsPlayed: 2_826_000, spotifyTrackUri: 'spotify:track:4fzsfWzRhPawzqhX8Qt9F3' },
      { trackName: 'Miracle', artistName: 'Calvin Harris', albumName: 'Funk Wav Bounces Vol. 2', playCount: 15, totalMsPlayed: 2_850_000, spotifyTrackUri: 'spotify:track:0Q4HQpgCsYJqOoYNMDedMk' },
      { trackName: 'KNIFE TALK', artistName: 'Drake', albumName: 'Certified Lover Boy', playCount: 13, totalMsPlayed: 2_418_100, spotifyTrackUri: 'spotify:track:5HCyWlXZPP0y6Uy0dYZjIm' },
      { trackName: 'Highs & Lows', artistName: 'Kygo', albumName: 'Golden Hour', playCount: 11, totalMsPlayed: 1_980_000, spotifyTrackUri: 'spotify:track:7kXaZrpAEuouRMnrlYpYdJ' },
      { trackName: 'Strangers', artistName: 'Sigrid', albumName: 'How to Let Go', playCount: 10, totalMsPlayed: 1_670_000, spotifyTrackUri: 'spotify:track:7n2Ycct7Beij7Dj7meI4X0' },
      { trackName: 'Wellerman (Sea Shanty)', artistName: 'Nathan Evans', albumName: 'Wellerman', playCount: 9, totalMsPlayed: 1_359_000, spotifyTrackUri: 'spotify:track:0FNiduFAuvtdHVMOLAFNtF' },
      { trackName: "I'm Good (Blue)", artistName: 'David Guetta', albumName: "I'm Good (Blue)", playCount: 8, totalMsPlayed: 1_384_000, spotifyTrackUri: 'spotify:track:4uUG5RXrOk84mYEfFvj3cK' },
      { trackName: 'Sweet Melody', artistName: 'Little Mix', albumName: 'Confetti', playCount: 7, totalMsPlayed: 1_141_000, spotifyTrackUri: 'spotify:track:6klm4DfGKlA1b5JtNGq33b' },
      { trackName: 'Physical', artistName: 'Dua Lipa', albumName: 'Future Nostalgia', playCount: 6, totalMsPlayed: 983_400, spotifyTrackUri: 'spotify:track:4RVwu0g32PAqgUiJoXsdF8' },
      { trackName: 'Levitating', artistName: 'Dua Lipa', albumName: 'Future Nostalgia', playCount: 5, totalMsPlayed: 872_500, spotifyTrackUri: 'spotify:track:39LLxExYz6ewLAcYrzQQyP' },
    ],
    topArtists: [
      { artistName: 'Dua Lipa', playCount: 41 },
      { artistName: 'RAYE', playCount: 28 },
      { artistName: 'Calvin Harris', playCount: 23 },
      { artistName: 'Sigrid', playCount: 19 },
      { artistName: 'David Guetta', playCount: 15 },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // South Korea — K-pop festival trip, Aug 2023 (~3 hours)
  // ─────────────────────────────────────────────────────────────────────────
  KR: {
    code: 'KR',
    name: 'South Korea',
    lat: 35.9,
    lng: 127.8,
    totalMsPlayed: 10_800_000,
    trackCount: 154,
    dateStart: '2023-08-22T00:00:00Z',
    dateEnd: '2023-08-28T00:00:00Z',
    topTracks: [
      { trackName: 'Ditto', artistName: 'NewJeans', albumName: 'OMG', playCount: 21, totalMsPlayed: 3_234_000, spotifyTrackUri: 'spotify:track:3piziGDM3OHjb2k7wZNvJl' },
      { trackName: 'ANTIFRAGILE', artistName: 'LE SSERAFIM', albumName: 'ANTIFRAGILE', playCount: 18, totalMsPlayed: 2_970_000, spotifyTrackUri: 'spotify:track:3TkYR3MzpvkrQT4St0bMEG' },
      { trackName: 'Attention', artistName: 'NewJeans', albumName: 'NewJeans 1st EP', playCount: 16, totalMsPlayed: 2_416_000, spotifyTrackUri: 'spotify:track:5HCyWlXZPP0y6Uy0dYZjIm' },
      { trackName: 'LALISA', artistName: 'LISA', albumName: 'LALISA', playCount: 14, totalMsPlayed: 2_478_000, spotifyTrackUri: 'spotify:track:3fHR4sGm5g85RxYsRp4dQZ' },
      { trackName: 'Pink Venom', artistName: 'BLACKPINK', albumName: 'Born Pink', playCount: 13, totalMsPlayed: 2_223_000, spotifyTrackUri: 'spotify:track:46HA4NyHzh5ERSrIKWQTHO' },
      { trackName: 'Hype Boy', artistName: 'NewJeans', albumName: 'NewJeans 1st EP', playCount: 11, totalMsPlayed: 1_628_000, spotifyTrackUri: 'spotify:track:0FO4MpFBEMmhvfRpCv4cTg' },
      { trackName: 'After LIKE', artistName: 'IVE', albumName: 'After Like', playCount: 10, totalMsPlayed: 1_590_000, spotifyTrackUri: 'spotify:track:0lpCMBtJMxzHPrY0lRtVMF' },
      { trackName: 'Run BTS', artistName: 'BTS', albumName: 'Proof', playCount: 9, totalMsPlayed: 1_476_000, spotifyTrackUri: 'spotify:track:0gRzQlv7EoVVpYM8BHrMNG' },
      { trackName: 'MONEY', artistName: 'LISA', albumName: 'MONEY', playCount: 8, totalMsPlayed: 1_144_000, spotifyTrackUri: 'spotify:track:3iVcZ5G6tvkXZkZKlMpIUs' },
      { trackName: 'Cupid', artistName: 'FIFTY FIFTY', albumName: 'The Fifty', playCount: 7, totalMsPlayed: 1_141_000, spotifyTrackUri: 'spotify:track:01JHfAWZFHMYvDPimQqpO6' },
    ],
    topArtists: [
      { artistName: 'NewJeans', playCount: 68 },
      { artistName: 'BLACKPINK', playCount: 49 },
      { artistName: 'BTS', playCount: 42 },
      { artistName: 'IVE', playCount: 31 },
      { artistName: 'LE SSERAFIM', playCount: 26 },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Germany — conference, Sep 2023 (~2.5 hours)
  // ─────────────────────────────────────────────────────────────────────────
  DE: {
    code: 'DE',
    name: 'Germany',
    lat: 51.2,
    lng: 10.4,
    totalMsPlayed: 9_000_000,
    trackCount: 108,
    dateStart: '2023-09-12T00:00:00Z',
    dateEnd: '2023-09-16T00:00:00Z',
    topTracks: [
      { trackName: 'Faded', artistName: 'Alan Walker', albumName: 'Different World', playCount: 16, totalMsPlayed: 2_720_000, spotifyTrackUri: 'spotify:track:7NU2ojJBOlBmsMKSVXbJBd' },
      { trackName: 'Midnight City', artistName: 'M83', albumName: "Hurry Up, We're Dreaming", playCount: 13, totalMsPlayed: 2_834_700, spotifyTrackUri: 'spotify:track:1eyzqe2QqGZUmfcPZtrIyt' },
      { trackName: 'Turn Me On', artistName: 'Nicki Minaj', albumName: 'Pink Friday', playCount: 12, totalMsPlayed: 2_148_000, spotifyTrackUri: 'spotify:track:1G391cbiT3v3Cywg8T7DM1' },
      { trackName: 'Lose Yourself to Dance', artistName: 'Daft Punk', albumName: 'Random Access Memories', playCount: 11, totalMsPlayed: 3_212_200, spotifyTrackUri: 'spotify:track:2gNfxysfBRfl9Lvi9T3v6R' },
      { trackName: 'Blinding Lights', artistName: 'The Weeknd', albumName: 'After Hours', playCount: 10, totalMsPlayed: 2_001_000, spotifyTrackUri: 'spotify:track:0VjIjW4GlUZAMYd2vXMi3b' },
      { trackName: 'Need You Now', artistName: 'Duke Dumont', albumName: 'Need You (100%)', playCount: 9, totalMsPlayed: 1_800_000, spotifyTrackUri: 'spotify:track:0fGiD17NR58P6jUF2YtBxT' },
      { trackName: 'Levels', artistName: 'Avicii', albumName: 'Levels', playCount: 8, totalMsPlayed: 1_304_000, spotifyTrackUri: 'spotify:track:4bHsxqR3GMrXTxEPLuK5ue' },
      { trackName: 'Titanium', artistName: 'David Guetta', albumName: 'Nothing But the Beat', playCount: 7, totalMsPlayed: 1_484_000, spotifyTrackUri: 'spotify:track:0nJW01T7XtvILxQgC5J7Wh' },
      { trackName: 'Blue (Da Ba Dee)', artistName: 'Eiffel 65', albumName: 'Europop', playCount: 6, totalMsPlayed: 1_140_000, spotifyTrackUri: 'spotify:track:6IJmOrbrFz7oGb9ZCrWxFH' },
      { trackName: 'Stay With Me', artistName: 'Kygo', albumName: 'Cloud Nine', playCount: 5, totalMsPlayed: 875_000, spotifyTrackUri: 'spotify:track:5b0YCxNtT1qnm2fBNFU5fZ' },
    ],
    topArtists: [
      { artistName: 'Daft Punk', playCount: 37 },
      { artistName: 'Alan Walker', playCount: 29 },
      { artistName: 'Avicii', playCount: 24 },
      { artistName: 'M83', playCount: 21 },
      { artistName: 'David Guetta', playCount: 18 },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // France — vacation, Jul 2023 (~2 hours)
  // ─────────────────────────────────────────────────────────────────────────
  FR: {
    code: 'FR',
    name: 'France',
    lat: 46.2,
    lng: 2.2,
    totalMsPlayed: 7_200_000,
    trackCount: 91,
    dateStart: '2023-07-08T00:00:00Z',
    dateEnd: '2023-07-14T00:00:00Z',
    topTracks: [
      { trackName: 'Alors on Danse', artistName: 'Stromae', albumName: 'Cheese', playCount: 14, totalMsPlayed: 2_198_000, spotifyTrackUri: 'spotify:track:3UFoVkT7RBZL5W0kBBTtLE' },
      { trackName: 'Papaoutai', artistName: 'Stromae', albumName: 'Racine Carrée', playCount: 12, totalMsPlayed: 2_244_000, spotifyTrackUri: 'spotify:track:0iDsn5MBiTLkBHZmU0xlY0' },
      { trackName: 'Je Te Laisserai Des Mots', artistName: 'Patrick Watson', albumName: 'Close to Paradise', playCount: 10, totalMsPlayed: 1_880_000, spotifyTrackUri: 'spotify:track:49Kc3IqwIT0IJAHOJHh4Qu' },
      { trackName: 'La Nuit Je Mens', artistName: 'Alain Bashung', albumName: 'Fantaisie Militaire', playCount: 8, totalMsPlayed: 1_432_000, spotifyTrackUri: 'spotify:track:5DEqDKiPFVl0eRvAqaEpS9' },
      { trackName: 'Lean On', artistName: 'Major Lazer', albumName: 'Peace Is the Mission', playCount: 7, totalMsPlayed: 1_085_000, spotifyTrackUri: 'spotify:track:4ncBtMbEkAW9uxCrRb8YjH' },
      { trackName: 'Ce Jeu', artistName: 'Yelle', albumName: 'Pop Up', playCount: 6, totalMsPlayed: 942_000, spotifyTrackUri: 'spotify:track:7iGrqHc0dBrFzPRWrT9V1Z' },
      { trackName: 'Non, Je Ne Regrette Rien', artistName: 'Édith Piaf', albumName: 'Non, Je Ne Regrette Rien', playCount: 5, totalMsPlayed: 1_000_000, spotifyTrackUri: 'spotify:track:0ISMqY8FMY1H13a3bVtmTf' },
      { trackName: 'Cette Nuit-Là', artistName: 'Clara Luciani', albumName: 'Coeur', playCount: 5, totalMsPlayed: 795_000, spotifyTrackUri: 'spotify:track:3NdDPqEoNVAcxcBKANvBLa' },
      { trackName: 'Starboy', artistName: 'The Weeknd', albumName: 'Starboy', playCount: 4, totalMsPlayed: 804_000, spotifyTrackUri: 'spotify:track:5aAx2yezTd8zXrkmtKl66Z' },
      { trackName: 'La Vie En Rose', artistName: 'Édith Piaf', albumName: 'La Vie en Rose', playCount: 3, totalMsPlayed: 456_000, spotifyTrackUri: 'spotify:track:3TNoNGHzdLVFRuKNNwgcN' },
    ],
    topArtists: [
      { artistName: 'Stromae', playCount: 41 },
      { artistName: 'Édith Piaf', playCount: 22 },
      { artistName: 'Clara Luciani', playCount: 18 },
      { artistName: 'Major Lazer', playCount: 14 },
      { artistName: 'Yelle', playCount: 11 },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Colombia — end-of-trip layover, Mar 2024 (~1.5 hours)
  // ─────────────────────────────────────────────────────────────────────────
  CO: {
    code: 'CO',
    name: 'Colombia',
    lat: 4.6,
    lng: -74.1,
    totalMsPlayed: 5_400_000,
    trackCount: 71,
    dateStart: '2024-03-01T00:00:00Z',
    dateEnd: '2024-03-05T00:00:00Z',
    topTracks: [
      { trackName: 'PROVENZA', artistName: 'KAROL G', albumName: 'MAÑANA SERÁ BONITO', playCount: 13, totalMsPlayed: 2_392_000, spotifyTrackUri: 'spotify:track:1aaSQQbf2fWolHYTyMIPCJ' },
      { trackName: 'MAMIII', artistName: 'Becky G', albumName: 'MAMIII', playCount: 11, totalMsPlayed: 1_892_000, spotifyTrackUri: 'spotify:track:2cGMBtFJNNfaGBFErbZqSQ' },
      { trackName: 'BICHOTA', artistName: 'KAROL G', albumName: 'KG0516', playCount: 9, totalMsPlayed: 1_332_000, spotifyTrackUri: 'spotify:track:5D8o9LYdDYOFMVLbEbKwRO' },
      { trackName: 'Un Verano Sin Ti', artistName: 'Bad Bunny', albumName: 'Un Verano Sin Ti', playCount: 8, totalMsPlayed: 1_288_000, spotifyTrackUri: 'spotify:track:3RlCF0VfNGpnPFmEIRq4YU' },
      { trackName: 'Hawái', artistName: 'Maluma', albumName: 'Papi Juancho', playCount: 7, totalMsPlayed: 1_120_000, spotifyTrackUri: 'spotify:track:6mAjVQnByLzBKtQ1k8hEkM' },
      { trackName: 'La Difícil', artistName: 'Bad Bunny', albumName: 'El Último Tour Del Mundo', playCount: 6, totalMsPlayed: 1_026_000, spotifyTrackUri: 'spotify:track:7wdzGfgrHalXxQzpnCEiXA' },
      { trackName: 'Tusa', artistName: 'KAROL G', albumName: 'OCEAN', playCount: 6, totalMsPlayed: 942_000, spotifyTrackUri: 'spotify:track:71jzN72gOQNJ8UhPWyBCxx' },
      { trackName: 'Pepas', artistName: 'Farruko', albumName: 'La 167', playCount: 5, totalMsPlayed: 870_000, spotifyTrackUri: 'spotify:track:0bZHlhfTvxbAuPkIQGOzKu' },
      { trackName: 'Party', artistName: 'Bad Bunny', albumName: 'Las Que No Iban a Salir', playCount: 4, totalMsPlayed: 728_000, spotifyTrackUri: 'spotify:track:7JJAbQKuKzXhhuCwWqpNGJ' },
      { trackName: 'X (EQUIS)', artistName: 'Nicky Jam', albumName: 'X (EQUIS)', playCount: 3, totalMsPlayed: 519_000, spotifyTrackUri: 'spotify:track:5jrdCoLpJSvHHoFRGfuKZC' },
    ],
    topArtists: [
      { artistName: 'KAROL G', playCount: 34 },
      { artistName: 'Bad Bunny', playCount: 25 },
      { artistName: 'Maluma', playCount: 17 },
      { artistName: 'Becky G', playCount: 14 },
      { artistName: 'Farruko', playCount: 10 },
    ],
  },
}
