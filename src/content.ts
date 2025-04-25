let lastTitle: string;

function sendSongData() {
  const meta = navigator.mediaSession?.metadata;
  if (!meta || meta.title === lastTitle) return;
  lastTitle = meta.title;

  chrome.runtime.sendMessage({
    type: "SONG_UPDATE",
    payload: {
      title: meta.title,
      artist: meta.artist,
      album: meta.album,
      artwork: meta.artwork?.[meta.artwork.length - 1]?.src,
    },
  });
}

setInterval(sendSongData, 2000);
