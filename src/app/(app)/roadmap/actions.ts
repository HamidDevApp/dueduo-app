"use server";

import { revalidatePath } from "next/cache";
import { findTask, type Owner } from "@/lib/roadmap";
import { getSpace } from "@/lib/space";

export type ActionResult = { ok: true } | { ok: false; error: string };

const OWNERS: readonly Owner[] = ["mom", "partner", "together"];

function refresh() {
  revalidatePath("/roadmap");
  revalidatePath("/dashboard");
  revalidatePath("/co-pilot");
}

/** Tick or untick a roadmap task. Works for the owner and the partner. */
export async function setTaskDone(taskKey: string, done: boolean): Promise<ActionResult> {
  if (!findTask(taskKey)) return { ok: false, error: "Unknown task." };

  const { supabase, user, ownerId } = await getSpace();

  // Upsert only touches the columns we send, so an existing reassignment is kept.
  const { error } = await supabase.from("roadmap_progress").upsert(
    {
      user_id: ownerId,
      task_key: taskKey,
      completed_at: done ? new Date().toISOString() : null,
      completed_by: done ? user.id : null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,task_key" },
  );

  if (error) return { ok: false, error: "Couldn't save. Please try again." };
  refresh();
  return { ok: true };
}

/** Reassign a task to mom, partner or both. Choosing the default owner clears the override. */
export async function reassignTask(taskKey: string, assignee: Owner): Promise<ActionResult> {
  const task = findTask(taskKey);
  if (!task) return { ok: false, error: "Unknown task." };
  if (!OWNERS.includes(assignee)) return { ok: false, error: "Invalid assignee." };

  const { supabase, ownerId } = await getSpace();

  const { error } = await supabase.from("roadmap_progress").upsert(
    {
      user_id: ownerId,
      task_key: taskKey,
      assignee: assignee === task.owner ? null : assignee,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,task_key" },
  );

  if (error) return { ok: false, error: "Couldn't reassign. Please try again." };
  refresh();
  return { ok: true };
}
