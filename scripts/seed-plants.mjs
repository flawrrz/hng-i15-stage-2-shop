// Seed script for The Green Gazette™ plant catalogue.
//
// Uses the perenual.com API (HARD budget: 100 requests, tracked in a ledger
// file so repeated runs can never silently blow the budget) and Supabase
// (service role) to populate the `products` table with real plant data.
//
// Usage (from repo root):
//   node scripts/seed-plants.mjs gather   # phase 1: collect candidates -> scripts/plant-candidates.json
//   node scripts/seed-plants.mjs seed     # phase 2: details + images + insert (needs scripts/plant-selection.json)
//
// Images are downloaded from perenual's presigned URLs (they expire in 24h!)
// and re-hosted in a public Supabase Storage bucket so image_url stays stable.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// Perenual tracks the 100-request limit server-side; this local ledger mirrors
// it so abort-before-fetch, not discover-after. Existing probes count too.
const LEDGER = path.join(
  process.env.TEMP || os.tmpdir(),
  "sweet-flower-template",
  "api-requests-used.txt",
);
const BUDGET = 100;

// ---------------------------------------------------------------- env ----
// Minimal .env loader (the script runs under plain `node`, not `next dev`).
function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    try {
      const raw = fs.readFileSync(path.join(ROOT, file), "utf8");
      for (const line of raw.split(/\r?\n/)) {
        const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
        if (!m || m[2].startsWith("#")) continue;
        const value = m[2].replace(/^["']|["']$/g, "");
        if (!(m[1] in process.env)) process.env[m[1]] = value;
      }
    } catch {
      // file not present — fall through to process.env
    }
  }
}
loadEnv();

const KEY = process.env.PERENUAL_API_KEY;
const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = "product-images";

if (!KEY) fail("PERENUAL_API_KEY missing (should live in .env.local)");
if (!SUPA_URL || !SERVICE_KEY) fail("Supabase URL/service key missing from .env.local");

function fail(msg) {
  console.error(`\nERROR: ${msg}`);
  process.exit(1);
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ------------------------------------------------------------- ledger ----
function requestsUsed() {
  try {
    return parseInt(fs.readFileSync(LEDGER, "utf8").trim(), 10) || 0;
  } catch {
    return 0;
  }
}
function bumpRequests() {
  const used = requestsUsed() + 1;
  fs.mkdirSync(path.dirname(LEDGER), { recursive: true });
  fs.writeFileSync(LEDGER, String(used));
  console.log(`  [budget] request ${used}/${BUDGET}`);
  if (used > BUDGET) fail("perenual request budget exhausted — aborting");
}

// -------------------------------------------------------- perenual API ---
async function perenual(apiPath) {
  if (requestsUsed() >= BUDGET) {
    fail(`request budget exhausted before fetching ${apiPath}`);
  }
  const sep = apiPath.includes("?") ? "&" : "?";
  const url = `https://perenual.com/api/v2/${apiPath}${sep}key=${KEY}`;
  const res = await fetch(url);
  bumpRequests(); // count even on failure — the server may count it too
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`non-JSON response from ${apiPath} (HTTP ${res.status}): ${text.slice(0, 140)}`);
  }
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${apiPath}: ${JSON.stringify(json).slice(0, 200)}`);
  return json;
}

// ---------------------------------------------------------- phase 1 ------
// Curated queries: the plain list pages are alphabetical (all firs/shrubs),
// so we pull houseplant-heavy slices + targeted searches for marquee plants.
const GATHER_QUERIES = [
  "species-list?indoor=1&page=1",
  "species-list?indoor=1&page=2",
  "species-list?q=monstera",
  "species-list?q=snake",
  "species-list?q=aloe",
  "species-list?q=cactus",
  "species-list?q=orchid",
  "species-list?q=ficus",
  "species-list?q=palm",
  "species-list?q=lavender",
];

async function gather() {
  const byId = new Map();
  for (const q of GATHER_QUERIES) {
    console.log(`gather: ${q}`);
    const body = await perenual(q);
    const rows = body?.data ?? [];
    console.log(`  -> ${rows.length} rows`);
    for (const r of rows) {
      if (!r?.id) continue;
      if (!byId.has(r.id)) {
        byId.set(r.id, {
          id: r.id,
          common_name: r.common_name ?? null,
          scientific_name: r.scientific_name ?? null,
          other_name: r.other_name ?? null,
          has_image: Boolean(r.default_image),
          image: r.default_image?.thumbnail ?? r.default_image?.medium_url ?? null,
        });
      }
    }
    await sleep(150);
  }

  // Sanity-probe the details endpoint shape (correct path: species/details/{ID})
  // using a plant we may or may not keep — documents the response for seed().
  console.log("gather: probing species/details/155 (Monstera deliciosa per docs)");
  const probe = await perenual("species/details/155");
  const out = {
    generated_at: new Date().toISOString(),
    requests_used: requestsUsed(),
    probe: {
      id: probe.id,
      common_name: probe.common_name,
      type: probe.type,
      watering: probe.watering,
      sunlight: probe.sunlight,
      care_level: probe.care_level,
      has_description: Boolean(probe.description),
      image_urls: probe.default_image
        ? {
            regular: probe.default_image.regular_url,
            medium: probe.default_image.medium_url,
          }
        : null,
    },
    candidates: [...byId.values()].sort((a, b) => a.id - b.id),
  };
  const outFile = path.join(__dirname, "plant-candidates.json");
  fs.writeFileSync(outFile, JSON.stringify(out, null, 2));
  const withImages = out.candidates.filter((c) => c.has_image);
  console.log(
    `\nWrote ${outFile}\n` +
      `Candidates: ${out.candidates.length} total, ${withImages.length} with images\n` +
      `Budget: ${requestsUsed()}/${BUDGET} used\n\n` +
      "Next: curate the list into scripts/plant-selection.json (array of {id, price?}), then run `seed`.",
  );
}

// ---------------------------------------------------------- phase 2 ------
// Derives a shop category from the API's `type` + `indoor` fields.
function deriveCategory(detail) {
  const t = (detail.type || "").toLowerCase();
  if (t.includes("succulent") || t.includes("cactus")) return "Succulents";
  if (t.includes("herb")) return "Herbs";
  if (t.includes("fern")) return "Ferns";
  if (t.includes("flowering") || t.includes("flower")) return "Flowering";
  if (t.includes("palm")) return "Palms";
  if (t.includes("tree")) return "Trees";
  if (detail.indoor) return "Indoor";
  return "Outdoor";
}

// Naira price tiers (estimated retail) — small/generic plants are cheap,
// specimen trees cost real money. Rounded to ₦500 for tidy display.
const PRICE_TIERS = {
  Succulents: [4500, 8500],
  Herbs: [4500, 9500],
  Ferns: [9500, 16000],
  Flowering: [12000, 28000],
  Palms: [28000, 65000],
  Trees: [28000, 65000],
  Indoor: [9500, 18000],
  Outdoor: [9500, 22000],
};
function estimatePrice(category) {
  const [lo, hi] = PRICE_TIERS[category] ?? PRICE_TIERS.Indoor;
  const raw = lo + Math.random() * (hi - lo);
  return Math.round(raw / 500) * 500;
}

function careDetails(d) {
  const pick = (v) => (v === undefined ? undefined : v);
  const out = {
    scientific_name: pick(d.scientific_name),
    other_names: pick(d.other_name),
    type: pick(d.type),
    origin: pick(d.origin),
    cycle: pick(d.cycle),
    watering: pick(d.watering),
    watering_benchmark: pick(d.watering_general_benchmark),
    sunlight: pick(d.sunlight),
    soil: pick(d.soil),
    care_level: pick(d.care_level),
    maintenance: pick(d.maintenance),
    growth_rate: pick(d.growth_rate),
    hardiness: pick(d.hardiness),
    indoor: pick(d.indoor),
    poisonous_to_pets: pick(d.poisonous_to_pets),
    poisonous_to_humans: pick(d.poisonous_to_humans),
    flowering_season: pick(d.flowering_season),
    description_source: "perenual.com",
  };
  // JSON.stringify drops undefined — keep the column tidy.
  return Object.fromEntries(Object.entries(out).filter(([, v]) => v !== undefined));
}

const slug = (s) =>
  String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "plant";

function imageExt(bytes) {
  if (bytes[0] === 0x89 && bytes[1] === 0x50) return "png";
  if (bytes[0] === 0xff && bytes[1] === 0xd8) return "jpg";
  if (bytes[0] === 0x52 && bytes[1] === 0x49) return "webp";
  if (bytes[8] === 0x57) return "webp";
  return "jpg";
}

async function ensureBucket() {
  const res = await fetch(`${SUPA_URL}/storage/v1/bucket`, {
    method: "POST",
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id: BUCKET,
      name: "Product images",
      public: true,
      fileSizeLimit: "5MB",
    }),
  });
  if (res.status === 409) return; // already exists
  if (!res.ok) throw new Error(`bucket create failed: HTTP ${res.status} ${await res.text()}`);
  console.log(`Created public storage bucket: ${BUCKET}`);
}

async function uploadImage(bytes, objectName, mime) {
  const res = await fetch(`${SUPA_URL}/storage/v1/object/${BUCKET}/${objectName}`, {
    method: "POST",
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": mime,
      "x-upsert": "true",
    },
    body: bytes,
  });
  if (!res.ok) throw new Error(`image upload failed: HTTP ${res.status} ${await res.text()}`);
  return `${SUPA_URL}/storage/v1/object/public/${BUCKET}/${objectName}`;
}

async function insertProducts(rows) {
  const res = await fetch(`${SUPA_URL}/rest/v1/products`, {
    method: "POST",
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(rows),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`product insert failed: HTTP ${res.status} ${text.slice(0, 300)}`);
  return JSON.parse(text);
}

async function seed() {
  // Pre-flight: the INSERT below includes care_details — if the SQL migration
  // (supabase-plant-catalogue.sql) hasn't been run yet, bail BEFORE spending
  // 30 perenual requests on downloads we'd only have to repeat.
  const probe = await fetch(`${SUPA_URL}/rest/v1/products?select=care_details&limit=1`, {
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
  });
  if (!probe.ok) {
    const detail = await probe.text();
    if (detail.includes("care_details")) {
      fail("products.care_details column missing — run supabase-plant-catalogue.sql in the Supabase SQL Editor first.");
    }
    fail(`Supabase pre-flight failed (HTTP ${probe.status}): ${detail.slice(0, 200)}`);
  }

  const selPath = path.join(__dirname, "plant-selection.json");
  if (!fs.existsSync(selPath)) {
    fail(`missing ${selPath} — run \`gather\` first, then curate candidates into it.`);
  }
  const selection = JSON.parse(fs.readFileSync(selPath, "utf8"));
  if (!Array.isArray(selection) || selection.length === 0) fail("plant-selection.json is empty");
  console.log(`Seeding ${selection.length} plants (budget so far: ${requestsUsed()}/${BUDGET})`);

  await ensureBucket();

  const rows = [];
  for (const item of selection) {
    const id = typeof item === "number" ? item : item.id;
    const overrides = typeof item === "number" ? {} : item;
    process.stdout.write(`seed: #${id} `);
    const d = await perenual(`species/details/${id}`);
    await sleep(150);

    if (!d.default_image) {
      console.log("SKIP (no image)");
      continue;
    }

    // Re-host the image immediately: perenual's URLs are presigned (24h expiry).
    const srcUrl = d.default_image.regular_url || d.default_image.medium_url || d.default_image.thumbnail;
    const imgRes = await fetch(srcUrl);
    if (!imgRes.ok) {
      console.log(`SKIP (image download ${imgRes.status})`);
      continue;
    }
    const bytes = Buffer.from(await imgRes.arrayBuffer());
    const ext = imageExt(bytes);
    const objectName = `${id}-${slug(d.common_name || String(id))}.${ext}`;
    const mime = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
    const imageUrl = await uploadImage(bytes, objectName, mime);

    const category = overrides.category || deriveCategory(d);
    const price = overrides.price || estimatePrice(category);
    const description =
      overrides.description ||
      d.description ||
      `${d.common_name} (${(d.scientific_name || [])[0] || "plant"}) — a ${category.toLowerCase()} plant ` +
        `with ${(d.care_level || "moderate").toLowerCase()} care needs. ` +
        `Watering: ${d.watering || "as needed"}. Sunlight: ${(d.sunlight || ["adequate light"]).join(", ")}.`;

    rows.push({
      title: overrides.title || d.common_name || `Plant ${id}`,
      description,
      price,
      stock_quantity: 5 + (id % 30),
      image_url: imageUrl,
      category,
      care_details: careDetails(d),
    });
    console.log(`ok: ${rows[rows.length - 1].title} (${category}, ₦${price})`);
  }

  if (rows.length === 0) fail("no products could be built — nothing inserted");
  const inserted = await insertProducts(rows);
  console.log(`\nInserted ${inserted.length} products into Supabase.`);
  console.log(`Budget: ${requestsUsed()}/${BUDGET} perenual requests used.`);
}

// ------------------------------------------------------------- main ------
const mode = process.argv[2];
if (mode === "gather") await gather();
else if (mode === "seed") await seed();
else fail('usage: node scripts/seed-plants.mjs <gather|seed>');
