"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  return (
    <div className="rounded-md border border-gray-300 focus-within:ring-2 focus-within:ring-blue-500">
      <div className="flex gap-1 border-b bg-gray-50 p-2">
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleBold().run()}
          className={`rounded px-2 py-1 text-sm font-bold ${
            editor?.isActive("bold") ? "bg-gray-200" : "hover:bg-gray-100"
          }`}
        >
          B
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          className={`rounded px-2 py-1 text-sm italic ${
            editor?.isActive("italic") ? "bg-gray-200" : "hover:bg-gray-100"
          }`}
        >
          I
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          className={`rounded px-2 py-1 text-sm ${
            editor?.isActive("bulletList") ? "bg-gray-200" : "hover:bg-gray-100"
          }`}
        >
          •
        </button>
      </div>
      <EditorContent
        editor={editor}
        className="min-h-[120px] p-3 text-sm text-gray-700 outline-none"
        placeholder={placeholder}
      />
    </div>
  );
}
