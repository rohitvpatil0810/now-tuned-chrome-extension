console.log("I am a background worker...");

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (
    tab.url?.includes("music.youtube.com") &&
    changeInfo.status === "complete"
  ) {
    console.log("Found YT Music tab");
    console.log(tabId);
    console.log("Injecting content script");
    chrome.scripting.executeScript({
      target: { tabId },
      files: ["content.js"],
    });
  }
});

let latestSong: any = null;

chrome.runtime.onMessage.addListener((message, _, sendResponse) => {
  if (message.type === "SONG_UPDATE") {
    latestSong = message.payload;
    console.log("Song updated:", latestSong);
    // Send to server here if needed
  }

  if (message.type === "GET_SONG") {
    sendResponse(latestSong);
  }

  return true; // Keep the message channel open for async sendResponse
});
