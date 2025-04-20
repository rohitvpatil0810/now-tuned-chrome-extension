import { useEffect, useState } from "react";

type SongData = {
  title: string;
  artist: string;
  album: string;
  artwork: string;
};

const Popup = () => {
  const [SongDetails, setSongDetails] = useState<SongData | null>(null);

  useEffect(() => {
    chrome.runtime.sendMessage({ type: "GET_SONG" }, (response) => {
      if (response) {
        setSongDetails(response);
      }
    });

    chrome.runtime.onMessage.addListener((message) => {
      if (message.type === "SONG_UPDATE") {
        setSongDetails(message.payload);
        // Send to server here if needed
      }
    });
  }, []);

  return (
    <div>
      {SongDetails && (
        <div>
          <h1>{SongDetails.title}</h1>
          <p>{SongDetails.artist}</p>
          <p>{SongDetails.album}</p>
          <img src={SongDetails.artwork} alt="Album Art" />
        </div>
      )}
    </div>
  );
};

export default Popup;
