"use client";

import { Calendar, Tag, MoreVertical, Edit, Trash2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import type { TaskWithRelations } from "../queries";
import type { TaskStatus, TaskPriority } from "@prisma/client";

const STATUS_STYLES: Record<TaskStatus, { badge: string; label: string }> = {
  TODO: { badge: "bg-yellow-100 text-yellow-800", label: "To Do" },
  IN_PROGRESS: { badge: "bg-blue-100 text-blue-800", label: "In Progress" },
  DONE: { badge: "bg-green-100 text-green-800", label: "Done" },
};

const PRIORITY_STYLES: Record<TaskPriority, { dot: string; label: string }> = {
  LOW: { dot: "bg-gray-400", label: "Low" },
  MEDIUM: { dot: "bg-yellow-500", label: "Medium" },
  HIGH: { dot: "bg-red-500", label: "High" },
};

interface TaskCardProps {
  task: TaskWithRelations;
  onToggleStatus: (taskId: string, expectedUpdatedAt?: Date) => void;
  onEdit: () => void;
  onDelete: (taskId: string) => void;
}

export default function TaskCard({ task, onToggleStatus, onEdit, onDelete }: TaskCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const statusStyle = STATUS_STYLES[task.status];
  const priorityStyle = PRIORITY_STYLES[task.priority];

  const isOverdue =
    task.dueDate &&
    task.status !== "DONE" &&
    new Date(task.dueDate) < new Date();

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [menuOpen]);

  return (
    <article
      className="bg-white rounded-lg border border-gray-200 p-4 hover:border-gray-300 transition-colors"
      aria-label={`Task: ${task.title}`}
    >
      <div className="flex items-start gap-3">
        {/* Status toggle button */}
        <button
          onClick={() => onToggleStatus(task.id, task.updatedAt)}
          className={cn(
            "mt-0.5 h-5 w-5 flex-shrink-0 rounded-full border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1",
            task.status === "DONE"
              ? "bg-green-500 border-green-500"
              : task.status === "IN_PROGRESS"
              ? "bg-blue-400 border-blue-400"
              : "border-gray-300 hover:border-blue-400"
          )}
          aria-label={`Toggle status (currently ${statusStyle.label})`}
          title={`Click to advance: ${statusStyle.label} → ${STATUS_STYLES[
            task.status === "TODO" ? "IN_PROGRESS" : task.status === "IN_PROGRESS" ? "DONE" : "TODO"
          ].label}`}
        >
          {task.status === "DONE" && (
            <svg className="h-full w-full text-white p-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3
              className={cn(
                "text-sm font-medium text-gray-900 break-words",
                task.status === "DONE" && "line-through text-gray-400"
              )}
            >
              {task.title}
            </h3>

            {/* Actions menu */}
            <div className="relative flex-shrink-0" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Task actions"
                aria-expanded={menuOpen}
                aria-haspopup="true"
              >
                <MoreVertical className="h-4 w-4" aria-hidden="true" />
              </button>

              {menuOpen && (
                <div
                  className="absolute right-0 top-7 z-10 w-36 bg-white rounded-md shadow-lg border border-gray-200 py-1"
                  role="menu"
                  aria-label="Task options"
                >
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onEdit();
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    role="menuitem"
                  >
                    <Edit className="h-4 w-4" aria-hidden="true" />
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onDelete(task.id);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                    role="menuitem"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>

          {task.description && (
            <p className="mt-1 text-xs text-gray-500 line-clamp-2">{task.description}</p>
          )}

          {/* Meta row */}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {/* Status badge */}
            <span
              className={cn("inline-flex items-center px-2 py-0.5 rounded text-xs font-medium", statusStyle.badge)}
            >
              {statusStyle.label}
            </span>

            {/* Priority dot */}
            <span className="inline-flex items-center gap-1 text-xs text-gray-500">
              <span
                className={cn("h-2 w-2 rounded-full flex-shrink-0", priorityStyle.dot)}
                aria-hidden="true"
              />
              {priorityStyle.label}
            </span>

            {/* Category */}
            {task.category && (
              <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                <Tag className="h-3 w-3 flex-shrink-0" aria-hidden="true" />
                <span
                  className="inline-block h-2 w-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: task.category.color ?? "#6b7280" }}
                  aria-hidden="true"
                />
                {task.category.name}
              </span>
            )}

            {/* Due date */}
            {task.dueDate && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 text-xs",
                  isOverdue ? "text-red-600 font-medium" : "text-gray-500"
                )}
                aria-label={`Due ${new Date(task.dueDate).toLocaleDateString()}`}
              >
                <Calendar className="h-3 w-3 flex-shrink-0" aria-hidden="true" />
                {isOverdue && <span className="sr-only">Overdue - </span>}
                {new Date(task.dueDate).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
