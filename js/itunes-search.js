/**
 * iTunes Search Module
 * Searches iTunes API for album information
 */
const ITunesSearch = (() => {

  /**
   * Search for album info using song name and artist
   * @param {string} songName
   * @param {string} artist
   * @returns {Promise<{albumName: string, artworkUrl: string, releaseDate: string}|null>}
   */
  async function searchAlbum(songName, artist) {
    if (!songName && !artist) return null;

    const query = `${artist || ''} ${songName || ''}`.trim();
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&limit=5&country=kr`;

    try {
      const res = await fetch(url);
      if (!res.ok) return null;

      const data = await res.json();
      if (!data.results || data.results.length === 0) return null;

      // Try to find best match by song name
      const songLower = (songName || '').toLowerCase();
      let best = data.results[0];

      for (const r of data.results) {
        if (r.trackName && r.trackName.toLowerCase().includes(songLower)) {
          best = r;
          break;
        }
      }

      return {
        albumName: best.collectionName || '',
        artworkUrl: best.artworkUrl100 || '',
        releaseDate: best.releaseDate ? best.releaseDate.substring(0, 10) : '',
        trackViewUrl: best.trackViewUrl || '',
        artistViewUrl: best.artistViewUrl || '',
      };
    } catch (e) {
      console.warn('iTunes search failed:', e);
      return null;
    }
  }

  return { searchAlbum };
})();
