import { supabase } from "@/lib/supabase";

type NotifType = "expense" | "success" | "warning" | "info" | "payment" | "profile" | "report";

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: NotifType = "info"
) {
  const { error } = await supabase.from("notifications").insert({
    user_id: userId,
    title,
    message,
    type,
    read: false,
  });
  if (error) console.error("Notification error:", error);
}