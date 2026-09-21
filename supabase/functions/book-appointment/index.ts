// Public, unauthenticated appointment booking. Anyone can call this — no
// login, no anon-key gating beyond what supabase-js sends by default — so
// every write it performs must be re-validated server-side:
//   - the requested slot is re-checked against `get_doctor_available_slots`
//     (the same function the browser used to render the slot grid) to close
//     the race between "you loaded the page" and "someone else booked that
//     slot first".
//   - the patient is looked up by email and reused if found, so repeat
//     visitors don't accumulate duplicate patient records.
// Runs with the service-role key so it can write `patients`/`appointments`
// directly — both are staff-only via RLS, exactly as intended; this
// function is the one deliberate, narrow, validated hole in that wall.
import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";

interface BookingPayload {
  full_name: string;
  email: string;
  phone?: string;
  reason?: string;
  is_first_visit: boolean;
  doctor_id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info, x-supabase-api-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: CORS_HEADERS });
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidPayload(body: unknown): body is BookingPayload {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  return (
    typeof b.full_name === "string" && b.full_name.trim().length > 0 &&
    typeof b.email === "string" && EMAIL_RE.test(b.email) &&
    typeof b.is_first_visit === "boolean" &&
    typeof b.doctor_id === "string" && b.doctor_id.length > 0 &&
    typeof b.appointment_date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(b.appointment_date) &&
    typeof b.start_time === "string" &&
    typeof b.end_time === "string"
  );
}

async function sendConfirmationEmail(params: {
  to: string;
  patientName: string;
  doctorName: string;
  date: string;
  startTime: string;
}) {
  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey) return { sent: false, reason: "RESEND_API_KEY not configured" };

  const from = Deno.env.get("BOOKING_FROM_EMAIL") ?? "Birth Nest <onboarding@resend.dev>";
  const prettyDate = new Date(`${params.date}T00:00:00`).toLocaleDateString("en-IN", {
    weekday: "long", day: "2-digit", month: "long", year: "numeric",
  });
  const prettyTime = params.startTime.slice(0, 5);

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [params.to],
        subject: "Your appointment at Birth Nest is confirmed",
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
            <h2 style="color: #8a4456;">Appointment Confirmed</h2>
            <p>Hi ${params.patientName},</p>
            <p>Your appointment with <strong>Dr. ${params.doctorName}</strong> at Birth Nest is confirmed:</p>
            <div style="background: #fdf3f5; border-radius: 12px; padding: 16px; margin: 16px 0;">
              <p style="margin: 0;"><strong>${prettyDate}</strong></p>
              <p style="margin: 4px 0 0;">${prettyTime}</p>
            </div>
            <p>If you need to reschedule or cancel, please call us at +91 12345 67890.</p>
            <p style="color: #a8586a; font-weight: bold;">Birth Nest — Dr. Mythri Sharan</p>
          </div>
        `,
      }),
    });
    return { sent: res.ok, reason: res.ok ? null : await res.text() };
  } catch (e) {
    return { sent: false, reason: e instanceof Error ? e.message : "unknown error" };
  }
}

export default {
  fetch: async (req: Request) => {
    if (req.method === "OPTIONS") return new Response(null, { headers: CORS_HEADERS });
    if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

    return withSupabase({ auth: "none" }, async (request, ctx) => {
      const body = await request.json().catch(() => null);
      if (!isValidPayload(body)) {
        return json({ error: "Please fill in your name, a valid email, and select a time slot." }, 400);
      }

      const { data: slots, error: slotsError } = await ctx.supabaseAdmin.rpc("get_doctor_available_slots", {
        p_doctor_id: body.doctor_id,
        p_date: body.appointment_date,
      });
      if (slotsError) return json({ error: slotsError.message }, 500);

      const match = (slots ?? []).find(
        (s: { slot_start: string; slot_end: string; is_available: boolean }) =>
          s.slot_start === body.start_time && s.slot_end === body.end_time && s.is_available,
      );
      if (!match) {
        return json({ error: "That time slot is no longer available. Please pick another." }, 409);
      }

      let patientId: string;
      const { data: existingPatient } = await ctx.supabaseAdmin
        .from("patients")
        .select("id")
        .ilike("email", body.email)
        .maybeSingle();

      if (existingPatient) {
        patientId = existingPatient.id;
      } else {
        const { data: newPatient, error: patientError } = await ctx.supabaseAdmin
          .from("patients")
          .insert({ full_name: body.full_name, email: body.email, phone: body.phone ?? null })
          .select("id")
          .single();
        if (patientError || !newPatient) return json({ error: patientError?.message ?? "Could not create patient record" }, 400);
        patientId = newPatient.id;
      }

      const { data: appointment, error: appointmentError } = await ctx.supabaseAdmin
        .from("appointments")
        .insert({
          patient_id: patientId,
          doctor_id: body.doctor_id,
          appointment_date: body.appointment_date,
          start_time: match.slot_start,
          end_time: match.slot_end,
          status: "scheduled",
          reason: body.reason || null,
          is_first_visit: body.is_first_visit,
        })
        .select("id")
        .single();
      if (appointmentError || !appointment) {
        return json({ error: appointmentError?.message ?? "Could not create appointment" }, 400);
      }

      const { data: doctor } = await ctx.supabaseAdmin
        .from("doctors")
        .select("profile:profiles(full_name)")
        .eq("id", body.doctor_id)
        .single();
      const doctorProfile = doctor?.profile as { full_name?: string } | { full_name?: string }[] | null;
      const doctorName = Array.isArray(doctorProfile) ? doctorProfile[0]?.full_name : doctorProfile?.full_name;

      const emailResult = await sendConfirmationEmail({
        to: body.email,
        patientName: body.full_name,
        doctorName: doctorName ?? "Mythri Sharan",
        date: body.appointment_date,
        startTime: match.slot_start,
      });

      return json({
        success: true,
        appointmentId: appointment.id,
        emailSent: emailResult.sent,
      });
    })(req);
  },
};
