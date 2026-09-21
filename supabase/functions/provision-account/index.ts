// Creates a staff account (doctor/receptionist/lab_staff/admin) on behalf of
// an already-authenticated admin. Staff-only: patients never log in — they
// are plain records the frontend inserts directly into `patients` (no auth
// user, no Edge Function involved for them at all).
//
// Runs with the service-role key server-side so it can:
//   - call auth.admin.createUser with email_confirm:true and a generated
//     temp password (impossible from the browser: it requires the secret
//     key) — no email sent, no rate limit, no confirmation step, but still
//     server-side and unforgeable, unlike a client-side "sign up as them"
//     trick.
//   - write the role/doctor rows with the service role, bypassing RLS, in
//     the same request.
import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";

const ALLOWED_ROLES = ["admin", "doctor", "receptionist", "lab_staff"] as const;
type Role = (typeof ALLOWED_ROLES)[number];

interface ProvisionPayload {
  email: string;
  full_name: string;
  phone?: string;
  role: Role;
  doctor?: {
    specialization?: string;
    qualifications?: string;
    experience_years?: number;
    consultation_fee?: number;
  };
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  // supabase-js always sends `x-client-info` (and sometimes `x-supabase-api-version`)
  // alongside the standard auth headers — omitting any of these fails the
  // browser's CORS preflight before the request body is ever seen.
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info, x-supabase-api-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: CORS_HEADERS });
}

function generateTempPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < 12; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

function isValidPayload(body: unknown): body is ProvisionPayload {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  return (
    typeof b.email === "string" &&
    b.email.includes("@") &&
    typeof b.full_name === "string" &&
    b.full_name.trim().length > 0 &&
    typeof b.role === "string" &&
    (ALLOWED_ROLES as readonly string[]).includes(b.role)
  );
}

export default {
  fetch: async (req: Request) => {
    if (req.method === "OPTIONS") return new Response(null, { headers: CORS_HEADERS });
    if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

    return withSupabase({ auth: "user" }, async (request, ctx) => {
      if (!ctx.userClaims) return json({ error: "Not authenticated" }, 401);

      const { data: callerProfile, error: callerError } = await ctx.supabaseAdmin
        .from("profiles")
        .select("role")
        .eq("id", ctx.userClaims.id)
        .single();

      if (callerError || !callerProfile || callerProfile.role !== "admin") {
        return json({ error: "Only an admin can create staff accounts" }, 403);
      }

      const body = await request.json().catch(() => null);
      if (!isValidPayload(body)) {
        return json({ error: "Invalid payload: email, full_name and a valid role are required" }, 400);
      }

      const tempPassword = generateTempPassword();
      const { data: created, error: createError } = await ctx.supabaseAdmin.auth.admin.createUser({
        email: body.email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { full_name: body.full_name, phone: body.phone ?? null },
      });

      if (createError || !created.user) {
        return json({ error: createError?.message ?? "Failed to create account" }, 400);
      }

      const userId = created.user.id;

      const { error: roleError } = await ctx.supabaseAdmin
        .from("profiles")
        .update({ role: body.role })
        .eq("id", userId);
      if (roleError) return json({ error: roleError.message }, 400);

      if (body.role === "doctor") {
        const d = body.doctor ?? {};
        const { error: doctorError } = await ctx.supabaseAdmin.from("doctors").insert({
          id: userId,
          specialization: d.specialization ?? "Obstetrics & Gynaecology",
          qualifications: d.qualifications ?? "",
          experience_years: d.experience_years ?? 0,
          consultation_fee: d.consultation_fee ?? 0,
        });
        if (doctorError) return json({ error: doctorError.message }, 400);
      }

      return json({ userId, email: body.email, tempPassword });
    })(req);
  },
};
