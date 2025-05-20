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
        <p className="font-semibold py-2 text-xs text-light-green">
          Now {SongDetails.playbackState}...
        </p>
        <div className="h-48 w-48 rounded-md overflow-clip">
          <img
            className=""
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
            className="h-14 w-14 mt-4"
            src="/headphones.gif"
            alt="headphones animation"
          />
          <div className="ml-2 w-32">
            <h1 className="text-base py-2 font-bold">
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
    <div className="bg-charcoal-black text-white font-lexend-deca h-full w-full">
      <div className="bg-light-green bg-opacity-5 p-2 border-1s border-light-green rounded-md">
        <p className="font-semibold py-2 text-xs text-light-green">
          No song playing...
        </p>
      </div>
    </div>
  );
};

export default Popup;
