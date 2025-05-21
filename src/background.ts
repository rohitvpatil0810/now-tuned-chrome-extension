console.log("I am a background worker...");

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

  getWinnerTabState(): TabMusicState | null {
    const playingTabIterator = this.tabsPlayingMusic.values();
    const notPlayingTabIterator = this.tabsNotPlayingMusic.values();

    if (this.tabsPlayingMusic.size > 0) {
      return playingTabIterator.next()?.value ?? null;
    }

    if (this.tabsNotPlayingMusic.size > 0) {
      return notPlayingTabIterator.next()?.value ?? null;
    }

    return null;
  }
}

const partitionedTabsQueue = new PartitionedTabsQueue();

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

chrome.tabs.onRemoved.addListener((tabId) => {
  console.log("Tab removed:", tabId);
  partitionedTabsQueue.removeTabState(tabId);
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

const sendSongState = () => {
  const currentTabMusicState = partitionedTabsQueue.getWinnerTabState();
  if (!areTabMusicStatesEqual(currentTabMusicState, mediaSession)) {
    console.log("Sending song state:", currentTabMusicState);
    mediaSession = currentTabMusicState;
    chrome.runtime.sendMessage({
      type: "SONG_UPDATE",
      payload: mediaSession,
    });

    // Send to server here if needed
  }
};

setInterval(sendSongState, 1000);
