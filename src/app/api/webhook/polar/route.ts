import { Webhooks } from "@polar-sh/nextjs";
import { createClient } from "@supabase/supabase-js";

// 1. الاتصال بـ Supabase بصلاحيات الأدمن باش نبدلو الداتابيز
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const POST = Webhooks({
  // الكود السري ديال الويبهوك اللي حطينا فـ .env.local
  webhookSecret: process.env.POLAR_WEBHOOK_SECRET!,

  // هاد الدالة غتخدم أوتوماتيك ملي الكليان يخلص
  onOrderPaid: async (payload) => {
    const order = payload.data;

    // كنجبدو الإيميل والـ ID ديال الكليان
    const customerEmail = order.customer.email;
    const userId = order.metadata?.user_id as string | undefined;

    console.log(`✅ [Polar Webhook] Order Paid: ${customerEmail}`);

    try {
      if (userId) {
        // تحديث جدول profiles بالـ ID
        const { error } = await supabaseAdmin
          .from("profiles")
          .update({
            is_pro: true,
            plan: "co-pilot",
          })
          .eq("id", userId);

        if (error) console.error("❌ Supabase Error (by ID):", error);
      } else if (customerEmail) {
        // تحديث جدول profiles بالإيميل فـ حالة ماكاينش الـ ID
        const { error } = await supabaseAdmin
          .from("profiles")
          .update({
            is_pro: true,
            plan: "co-pilot",
          })
          .eq("email", customerEmail);

        if (error) console.error("❌ Supabase Error (by Email):", error);
      }
    } catch (err) {
      console.error("❌ Webhook processing failed:", err);
    }
  },
});
