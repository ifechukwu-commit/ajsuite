#!/bin/bash
# Run this once from your project root, AFTER pasting all the new/replaced
# files in. Deletes everything AI-related and the now-redundant History
# page (replaced by the Timeline tab). Safe to run even if some of these
# are already gone — rm -f / rm -rf don't error on missing files.

set -e

rm -rf src/lib/groq
rm -f src/hooks/useChat.ts
rm -f src/components/tabs/ChatTab.tsx
rm -rf src/app/api/summarise
rm -rf src/app/api/chat
rm -rf src/app/history
rm -rf src/components/history

echo "Cleanup done. Deleted: lib/groq, hooks/useChat.ts, components/tabs/ChatTab.tsx, api/summarise, api/chat, app/history, components/history."
