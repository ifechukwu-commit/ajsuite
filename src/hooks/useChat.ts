// AI chat removed from scope. Stub kept at this path only so paste-replace
// never breaks the build before batch 2 removes the last callers. Safe to
// delete this file once nothing imports it.

export function useChat() {
  return { messages: [], sendMessage: async () => {}, loading: false }
}
