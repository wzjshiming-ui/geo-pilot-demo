import { AppShell } from "@/components/app-shell";
import { TaskBuilder } from "@/components/task-builder";

export default function TaskPage() {
  return (
    <AppShell current="task">
      <TaskBuilder />
    </AppShell>
  );
}
