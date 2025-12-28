import axios from "axios";
import { apiEndpoints } from "./constants";

console.log("I am a background worker... clientId: ", chrome.runtime.id);

type ClientInfo = {
  clientId: string;
  clientType: string;
  deviceID: string;
  tabId?: number;
};

type TabMusicState = {
  metadata: {
    title: string;
    artist: string;
    album: string;
    artwork: readonly MediaImage[];
  };
  playbackState: MediaSessionPlaybackState;
} | null;

const YOUTUBE_MUSIC_URL = "music.youtube.com";

const areTabMusicStatesEqual = (
  a: TabMusicState,
  b: TabMusicState
): boolean => {
  if (a === b) return true;
  if (!a || !b) return false;

  return (
    a.playbackState === b.playbackState &&
    a.metadata.title === b.metadata.title &&
    a.metadata.artist === b.metadata.artist &&
    a.metadata.album === b.metadata.album &&
    JSON.stringify(a.metadata.artwork) === JSON.stringify(b.metadata.artwork)
  );
};

class PartitionedTabsQueue {
  tabsPlayingMusic: Map<number, TabMusicState>;
  tabsNotPlayingMusic: Map<number, TabMusicState>;
  constructor() {
    this.tabsPlayingMusic = new Map();
    this.tabsNotPlayingMusic = new Map();
  }

  updateTabState(tabId: number, tabMusicState: TabMusicState) {
    if (tabMusicState) {
      if (tabMusicState.playbackState === "playing") {
        if (this.tabsNotPlayingMusic.has(tabId)) {
          this.tabsNotPlayingMusic.delete(tabId);
        }
        this.tabsPlayingMusic.set(tabId, tabMusicState);
      } else {
        if (this.tabsPlayingMusic.has(tabId)) {
          this.tabsPlayingMusic.delete(tabId);
        }
        this.tabsNotPlayingMusic.set(tabId, tabMusicState);
      }
    }
  }

  removeTabState(tabId: number) {
    this.tabsPlayingMusic.delete(tabId);
    this.tabsNotPlayingMusic.delete(tabId);
  }

  // returns the TabMusicState of the highest priority tab and tabId
  getWinnerTabState(): { tabId: number; state: TabMusicState } | null {
    const playingTabIterator = this.tabsPlayingMusic.entries();
    const notPlayingTabIterator = this.tabsNotPlayingMusic.entries();

    if (this.tabsPlayingMusic.size > 0) {
      const entry = playingTabIterator.next()?.value;
      return entry ? { tabId: entry[0], state: entry[1] } : null;
    }

    if (this.tabsNotPlayingMusic.size > 0) {
      const entry = notPlayingTabIterator.next()?.value;
      return entry ? { tabId: entry[0], state: entry[1] } : null;
    }

    return null;
  }
}

const partitionedTabsQueue = new PartitionedTabsQueue();

// Also inject content script into already opened YT Music tabs
chrome.tabs.query({}, (tabs) => {
  tabs.forEach((tab) => {
    if (tab.url?.includes(YOUTUBE_MUSIC_URL) && tab.id) {
      console.log("Found existing YT Music tab: ", tab.id);
      console.log("Injecting content script");
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["content.js"],
      });
    }
  });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (
    tab.url?.includes(YOUTUBE_MUSIC_URL) &&
    changeInfo.status === "complete"
  ) {
    console.log("Found YT Music tab: ", tabId);
    console.log("Injecting content script");
    chrome.scripting.executeScript({
      target: { tabId },
      files: ["content.js"],
    });
  }
});

chrome.tabs.onRemoved.addListener(async (tabId) => {
  console.log("Tab removed:", tabId);
  partitionedTabsQueue.removeTabState(tabId);

  // Send delete request to sync server
  const clientId = `${chrome.runtime.id}-tab-${tabId}`;
  try {
    const response = await axios.delete(
      `${apiEndpoints.DELETE_MEDIA_SESSION}?clientId=${clientId}`
    );
    console.log(
      "Deleted media session from sync server for closed tab:",
      response.data
    );
  } catch (error) {
    console.error("Error deleting media session from sync server:", error);
  }
});

let mediaSession: TabMusicState = null;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "TAB_SONG_STATE_UPDATE" && sender.tab?.id) {
    const tabMusicState = message.payload;
    console.log("Tab song state updated:", tabMusicState);
    partitionedTabsQueue.updateTabState(sender.tab?.id, tabMusicState);
  }

  if (message.type === "GET_SONG") {
    sendResponse(mediaSession);
  }

  return true; // Keep the message channel open for async sendResponse
});

// Periodically check for the current winning tab and send its state to popup and sync server
const sendSongState = async () => {
  const currentTabMusicState = partitionedTabsQueue.getWinnerTabState();
  if (!currentTabMusicState) {
    if (mediaSession !== null) {
      console.log("No tabs playing music. Clearing media session.");
      return;
    }
  }

  const tabId = currentTabMusicState ? currentTabMusicState.tabId : undefined;
  const winnerTabState = currentTabMusicState
    ? currentTabMusicState.state
    : null;

  if (!areTabMusicStatesEqual(winnerTabState, mediaSession)) {
    console.log("Sending song state:", currentTabMusicState);
    mediaSession = winnerTabState;
    chrome.runtime.sendMessage({
      type: "SONG_UPDATE",
      payload: mediaSession,
    });

    console.log("Posting to sync server...");
    console.log("Media Session:", mediaSession);
    // send mediaSession to sync server
    const client: ClientInfo = {
      clientId: `${chrome.runtime.id}-tab-${tabId}`,
      clientType: "chrome-extension",
      deviceID: self.navigator.userAgent,
      tabId: tabId,
    };
    const response = await axios.post(apiEndpoints.UPDATE_MEDIA_SESSION, {
      client,
      ...mediaSession,
    });
    console.log("Sync server response:", response.data);
  }
};

setInterval(sendSongState, 1000);
