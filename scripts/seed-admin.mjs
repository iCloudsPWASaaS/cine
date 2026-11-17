const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const schema = process.env.NEXT_PUBLIC_SUPABASE_SCHEMA || "cinewood";
const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;

if (!url || !serviceKey || !email || !password) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_EMAIL or ADMIN_PASSWORD.",
  );
  process.exit(1);
}

const headers = {
  apikey: serviceKey,
  Authorization: `Bearer ${serviceKey}`,
  "Content-Type": "application/json",
};

async function findUserByEmail() {
  for (let page = 1; page <= 10; page += 1) {
    const res = await fetch(
      `${url}/auth/v1/admin/users?page=${page}&per_page=200`,
      { headers },
    );
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    const users = data.users || [];
    const found = users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (found) return found;
    if (users.length < 200) break;
  }
  return null;
}

async function createUser() {
  const res = await fetch(`${url}/auth/v1/admin/users`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: "Cinewood Admin" },
    }),
  });
  const data = await res.json();
  if (res.ok) return data;
  if (res.status === 422 || /already/i.test(data?.msg || data?.message || "")) {
    const existing = await findUserByEmail();
    if (existing) return existing;
  }
  throw new Error(JSON.stringify(data));
}

try {
  const user = await createUser();
  if (!user?.id) throw new Error("Could not create or find the admin user.");

  const updateRes = await fetch(`${url}/auth/v1/admin/users/${user.id}`, {
    method: "PUT",
    headers,
    body: JSON.stringify({ password, email_confirm: true }),
  });
  if (!updateRes.ok) throw new Error(await updateRes.text());

  const res = await fetch(`${url}/rest/v1/profiles`, {
    method: "POST",
    headers: {
      ...headers,
      "Content-Profile": schema,
      Prefer: "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify({
      id: user.id,
      email,
      display_name: "Cinewood Admin",
      role: "admin",
    }),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(
      `Profile upsert failed (${res.status}): ${text}\nMake sure the cinewood schema is exposed and the migrations have run.`,
    );
  }

  console.log("Admin ready.");
  console.log(`  email:    ${email}`);
  console.log(`  password: ${password}`);
  console.log("Change the password after your first login.");
} catch (error) {
  console.error(`Admin seed failed: ${error.message}`);
  process.exit(1);
}
