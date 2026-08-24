export type ChatMode = "real" | "mock";

const STORAGE_KEY = "freevago.chatMode";

export function getChatMode(): ChatMode {
  return localStorage.getItem(STORAGE_KEY) === "mock" ? "mock" : "real";
}

export function setChatMode(mode: ChatMode): void {
  localStorage.setItem(STORAGE_KEY, mode);
}
