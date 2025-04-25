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
    SongDetails && (
      <div className="bg-charcoal-black text-white font-lexend-deca h-full w-full">
        <div className="bg-light-green bg-opacity-5 p-2 border-1s border-light-green rounded-md">
          <p className="font-semibold py-2 text-xs text-light-green">
            Now playing...
          </p>
          <div className="h-48 w-48 rounded-md overflow-clip">
            <img className="" src={SongDetails.artwork} alt="Album Art" />
          </div>
          <div className="flex w-full">
            <img
              className="h-14 w-14 mt-4"
              src="/headphones.gif"
              alt="headphones animation"
            />
            <div className="ml-2 w-32">
              <h1 className="text-base py-2 font-bold">{SongDetails.title}</h1>
              <p className="text-xs pb-1 text-gray-300">{SongDetails.artist}</p>
              <p className="text-xs pb-1 text-gray-300">{SongDetails.album}</p>
            </div>
          </div>
        </div>
      </div>
    )
  );
};

export default Popup;
