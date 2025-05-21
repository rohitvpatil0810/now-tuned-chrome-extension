import { useEffect, useState } from "react";

const Popup = () => {
  const [SongDetails, setSongDetails] = useState<{
    metadata: {
      title: string;
      artist: string;
      album: string;
      artwork: readonly MediaImage[];
    };
    playbackState: MediaSessionPlaybackState;
  } | null>(null);

  useEffect(() => {
    chrome.runtime.sendMessage({ type: "GET_SONG" }, (response) => {
      if (response) {
        console.log(response);
        setSongDetails(response);
      }
    });

    chrome.runtime.onMessage.addListener((message) => {
      if (message.type === "SONG_UPDATE") {
        console.log("Song updated:", message.payload);
        setSongDetails(message.payload);
        // Send to server here if needed
      }
    });
  }, []);

  return SongDetails ? (
    <div className="bg-charcoal-black text-white font-lexend-deca h-full w-full">
      <div className="bg-light-green bg-opacity-5 p-2 border-1s border-light-green rounded-md">
        <p
          className={`font-semibold py-2 text-xs ${
            SongDetails.playbackState === "paused"
              ? "text-gray-300"
              : " text-light-green"
          }`}
        >
          {SongDetails.playbackState === "paused"
            ? "💤 Offline"
            : "🎶 Vibes on!"}
        </p>
        <div className="h-48 w-48 rounded-md overflow-clip">
          <img
            className={
              SongDetails.playbackState === "paused" ? "grayscale" : ""
            }
            src={
              SongDetails.metadata.artwork[
                SongDetails.metadata.artwork.length - 1
              ].src
            }
            alt="Album Art"
          />
        </div>
        <div className="flex w-full">
          <img
            className={`h-14 w-14 mt-4 ${
              SongDetails.playbackState === "playing" ? "" : "grayscale"
            }`}
            src={
              SongDetails.playbackState === "playing"
                ? "/headphones.gif"
                : "/still-headphones.png"
            }
            alt="headphones animation"
          />
          <div className="ml-2 w-32">
            <h1
              className={`${
                SongDetails.playbackState === "playing" ? "" : "grayscale"
              } text-base py-2 font-bold`}
            >
              {SongDetails.metadata.title}
            </h1>
            <p className="text-xs pb-1 text-gray-300">
              {SongDetails.metadata.artist}
            </p>
            <p className="text-xs pb-1 text-gray-300">
              {SongDetails.metadata.album}
            </p>
          </div>
        </div>
      </div>
    </div>
  ) : (
    <div className="bg-charcoal-black text-white font-lexend-deca h-max w-48 py-4">
      <img
        className="h-32 w-32 mx-auto grayscale"
        src="/offline-now-tuned.png"
        alt="Offline Now Tuned"
      />
      <p className="font-semibold py-2 text-lg text-gray-300 w-full text-center">
        💤 Now Tuned - is Offline
      </p>
    </div>
  );
};

export default Popup;
