let lastSongState: { lastTitle: string; lastPlaybackState: string } | null =
  null;

/**
 * Sends the current song data if there is a change in the song title
 * or playback state, using the Chrome runtime messaging system.
 */
function sendSongData() {
  const mediaSession = navigator.mediaSession;

  // Exit early if media session API is not available
  if (!mediaSession) {
    return;
  }

  // Check if there is a change in song metadata or playback state
  if (
    mediaSession.metadata &&
    (!lastSongState ||
      lastSongState.lastTitle !== mediaSession.metadata.title ||
      lastSongState.lastPlaybackState !== mediaSession.playbackState)
  ) {
    // Update the last song state
    lastSongState = {
      lastTitle: mediaSession.metadata.title,
      lastPlaybackState: mediaSession.playbackState,
    };

    // Send a message to update the song data
    chrome.runtime.sendMessage({
      type: "SONG_UPDATE",
      payload: {
        metadata: {
          title: mediaSession.metadata.title,
          artist: mediaSession.metadata.artist,
          album: mediaSession.metadata.album,
          artwork: mediaSession.metadata.artwork,
        },
        playbackState: mediaSession.playbackState,
      },
    });
  }
}

setInterval(sendSongData, 2000);
