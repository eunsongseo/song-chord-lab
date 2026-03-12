/**
 * Chord Audio Module
 * Web Audio API-based chord sound playback
 */
const ChordAudio = (() => {
  let audioCtx = null;
  let isPlaying = false;

  // Note frequencies (A4 = 440Hz)
  const NOTE_FREQ = {
    'C': 261.63, 'C#': 277.18, 'D': 293.66, 'D#': 311.13,
    'E': 329.63, 'F': 349.23, 'F#': 369.99, 'G': 392.00,
    'G#': 415.30, 'A': 440.00, 'A#': 466.16, 'B': 493.88,
  };

  function getAudioContext() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtx;
  }

  /**
   * Get frequency for a note name at a specific octave
   */
  function noteFrequency(noteName, octave) {
    const normalized = MusicTheory.normalizeNote(noteName);
    const baseFreq = NOTE_FREQ[normalized];
    if (!baseFreq) return 440;
    // Base frequencies are octave 4, adjust
    return baseFreq * Math.pow(2, octave - 4);
  }

  /**
   * Play a single chord
   * @param {string} chordName - e.g., "Am", "C", "G7"
   * @param {number} duration - seconds (default 1.5)
   * @returns {Promise} resolves when done
   */
  function playChord(chordName, duration = 1.5) {
    return new Promise((resolve) => {
      const ctx = getAudioContext();
      const notes = MusicTheory.getChordNotes(chordName);
      if (notes.length === 0) { resolve(); return; }

      const now = ctx.currentTime;
      const gainNode = ctx.createGain();
      gainNode.connect(ctx.destination);

      // Soft attack and release
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.3 / notes.length, now + 0.05);
      gainNode.gain.setValueAtTime(0.3 / notes.length, now + duration - 0.3);
      gainNode.gain.linearRampToValueAtTime(0, now + duration);

      const oscillators = [];

      notes.forEach((note, i) => {
        // Spread notes across octave 3-4 for natural sound
        let octave = 3;
        if (i > 0) {
          const prevIdx = MusicTheory.noteIndex(notes[i - 1]);
          const currIdx = MusicTheory.noteIndex(note);
          if (currIdx <= prevIdx) octave = 4;
        }

        // Main tone (sine for warmth)
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(noteFrequency(note, octave), now);

        // Add subtle harmonics with triangle wave
        const osc2 = ctx.createOscillator();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(noteFrequency(note, octave), now);

        const oscGain = ctx.createGain();
        oscGain.gain.setValueAtTime(0.7, now);
        osc.connect(oscGain);
        oscGain.connect(gainNode);

        const osc2Gain = ctx.createGain();
        osc2Gain.gain.setValueAtTime(0.3, now);
        osc2.connect(osc2Gain);
        osc2Gain.connect(gainNode);

        osc.start(now);
        osc.stop(now + duration);
        osc2.start(now);
        osc2.stop(now + duration);

        oscillators.push(osc, osc2);
      });

      // Resolve after duration
      setTimeout(resolve, duration * 1000);
    });
  }

  /**
   * Play multiple chords in sequence
   * @param {string[]} chordNames
   * @param {number} interval - seconds between chords
   * @param {function} onChordStart - callback(chordName, index)
   */
  async function playChordSequence(chordNames, interval = 1.8, onChordStart) {
    if (isPlaying) return;
    isPlaying = true;

    for (let i = 0; i < chordNames.length; i++) {
      if (!isPlaying) break;
      if (onChordStart) onChordStart(chordNames[i], i);
      await playChord(chordNames[i], interval - 0.2);
      // Small gap between chords
      await new Promise(r => setTimeout(r, 200));
    }

    isPlaying = false;
  }

  function stopPlayback() {
    isPlaying = false;
  }

  function getIsPlaying() {
    return isPlaying;
  }

  return {
    playChord,
    playChordSequence,
    stopPlayback,
    getIsPlaying,
  };
})();
