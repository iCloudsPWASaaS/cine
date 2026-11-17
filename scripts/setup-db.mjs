import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
const storageKey =
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  serviceKey;
const bucket = process.env.SUPABASE_STORAGE_BUCKET || "cinewood";

if (!url || !serviceKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Run with: npm run setup:db",
  );
  process.exit(1);
}

async function execSql(sql) {
  const res = await fetch(`${url}/rest/v1/rpc/exec_sql`, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sql_string: sql }),
  });

  if (!res.ok) {
    const text = await res.text();
    if (res.status === 404 && text.includes("exec_sql")) {
      throw new Error(
        "The project does not expose an exec_sql helper. Paste supabase/migrations/*.sql into the Supabase SQL editor instead.",
      );
    }
    throw new Error(`SQL failed (${res.status}): ${text}`);
  }
}

async function runMigrations() {
  const dir = path.join(process.cwd(), "supabase", "migrations");
  const files = (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort();

  for (const file of files) {
    const sql = await readFile(path.join(dir, file), "utf8");
    process.stdout.write(`Applying ${file} ... `);
    await execSql(sql);
    console.log("ok");
  }
}

async function ensureBucket() {
  const res = await fetch(`${url}/storage/v1/bucket`, {
    method: "POST",
    headers: {
      apikey: storageKey,
      Authorization: `Bearer ${storageKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id: bucket,
      name: bucket,
      public: true,
      file_size_limit: 52428800,
      allowed_mime_types: [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/avif",
        "image/gif",
        "image/svg+xml",
      ],
    }),
  });

  if (res.ok) {
    console.log(`Storage bucket "${bucket}" created.`);
    return;
  }

  const text = await res.text();
  if (res.status === 409 || /already exists/i.test(text) || /duplicate/i.test(text)) {
    console.log(`Storage bucket "${bucket}" already exists.`);
    return;
  }
  throw new Error(`Bucket setup failed (${res.status}): ${text}`);
}

async function verify() {
  let lastStatus = 0;
  let lastText = "";
  for (let attempt = 1; attempt <= 6; attempt += 1) {
    const res = await fetch(`${url}/rest/v1/movies?select=slug,title&limit=5`, {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Accept-Profile": process.env.NEXT_PUBLIC_SUPABASE_SCHEMA || "cinewood",
      },
    });
    lastText = await res.text();
    lastStatus = res.status;
    if (res.ok) {
      console.log(`Verified cinewood schema. Demo rows: ${lastText}`);
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  console.warn(
    `\nSchema verification failed (${lastStatus}). Open Supabase → Settings → API → Exposed schemas and add "cinewood", then reload.`,
  );
  console.warn(lastText);
}

try {
  await runMigrations();
  await execSql("notify pgrst, 'reload schema'; notify pgrst, 'reload config';");
  await ensureBucket();
  await verify();
  console.log("\nDone. Next: npm run seed:admin");
} catch (error) {
  console.error(`\nSetup failed: ${error.message}`);
  process.exit(1);
}
