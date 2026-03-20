export interface Task {
  id: string;
  title: string;
  status: "completed" | "overdue" | "pending";
  dueDate: string;
}
