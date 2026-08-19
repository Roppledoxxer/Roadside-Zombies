/*
 * loop-audio.js
 * Creates an Audio object for assets/audio/RoadsideZombies OS.mp3 and attaches click handlers to common play/start buttons to play it in loop.
 *
 * Place RoadsideZombies OS.mp3 at: assets/audio/RoadsideZombies OS.mp3 (exact filename with space)
 * Include this script in your HTML where other scripts are loaded, e.g. before </body>:
 * <script src="assets/js/loop-audio.js"></script>
 */

(function () {
  'use strict';

  const audioSrc = 'assets/audio/RoadsideZombies OS.mp3';
  const audio = new Audio(audioSrc);
  audio.loop = true;
  audio.preload = 'auto';
  audio.volume = 0.8; // change if you want quieter/louder by default

  let initialized = false;

  function attachHandlers() {
    if (initialized) return;
    initialized = true;

    // Common selectors for play/start buttons used across projects
    const selectors = [
      '#play',
      '#start',
      '.play',
      '.start',
      'button.play',
      'button.start',
      'input.play',
      'input.start'
    ];

    const nodes = new Set();
    selectors.forEach(sel => {
      document.querySelectorAll(sel).forEach(n => nodes.add(n));
    });

    // Also check for data-action attributes used by some apps
    document.querySelectorAll('[data-action="play"], [data-action="start"]').forEach(n => nodes.add(n));

    // Attach click handlers to found nodes
    nodes.forEach(node => {
      node.addEventListener('click', function () {
        // user interaction should allow playback on modern browsers
        audio.play().catch(() => {
          // play may fail if browser blocks; user gesture usually required
        });
      });
    });

    // Expose control helpers globally in case the game wants to trigger programmatically
    window.playRoadsideZombiesAudio = function () {
      audio.play().catch(() => {});
    };
    window.pauseRoadsideZombiesAudio = function () {
      audio.pause();
    };
    window.isRoadsideZombiesAudioPlaying = function () {
      return !audio.paused;
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attachHandlers);
  } else {
    attachHandlers();
  }

  // If the UI is built dynamically after load, observe DOM mutations and try to attach when new nodes appear
  const observer = new MutationObserver((mutations) => {
    if (initialized) return; // already attached
    for (const m of mutations) {
      if (m.addedNodes && m.addedNodes.length) {
        attachHandlers();
        break;
      }
    }
  });

  // Observe body or documentElement depending on availability
  const observeTarget = document.body || document.documentElement;
  if (observeTarget) {
    observer.observe(observeTarget, { childList: true, subtree: true });
  }

})();
