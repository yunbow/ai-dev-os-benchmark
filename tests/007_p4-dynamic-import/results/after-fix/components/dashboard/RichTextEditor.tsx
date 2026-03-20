"use client";

// Placeholder for a heavy rich text editor (e.g., TipTap, Quill).
// Loaded via next/dynamic with ssr: false from the dashboard page,
// so the large editor bundle is never included in the initial page load.

import { useState } from "react";

export default function RichTextEditor() {
  const [content, setContent] = useState("");

  return (
    <div className="rounded-lg border">
      <div className="border-b px-3 py-2 flex gap-2 text-sm">
        <button className="font-bold px-1">B</button>
        <button className="italic px-1">I</button>
        <button className="underline px-1">U</button>
      </div>
      <textarea
        className="w-full min-h-48 p-3 text-sm resize-y focus:outline-none"
        placeholder="Write task description…"
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
    </div>
  );
}
