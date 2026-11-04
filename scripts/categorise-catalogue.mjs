// One-off: moves items out of "Pharmacy" into product categories. Only items still in
// "Pharmacy" are touched, so anything sorted by hand stays put. Add --dry to preview.
// node --env-file=.env.local scripts/categorise-catalogue.mjs [--dry]
import { createClient } from "@supabase/supabase-js";

const RULES = [
  ["Medical Supplies", /SYRINGE|COTTON WOOL|STRAPPING/i],
  ["Injections & IV", /\bINJ\b|\bI\.?V\b/i],
  ["Eye, Ear & Nose Drops", /DROPS/i],
  ["Creams & Ointments", /CREAM|OINTMENT/i],
  ["Syrups & Liquids", /SUSP|SYRUP|\bSY\b|\bEXP\b|COUGH|TONIC|GRIPE WATER|MOUTHWASH/i],
];
const FALLBACK = "Tablets & Capsules";
const categoryOf = (name) => RULES.find(([, pattern]) => pattern.test(name))?.[0] ?? FALLBACK;

const dry = process.argv.includes("--dry");
const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data, error } = await db.from("catalogue").select("id, name").eq("department", "Pharmacy").order("name");
if (error) throw error;

const groups = new Map();
for (const item of data) {
  const category = categoryOf(item.name);
  groups.set(category, [...(groups.get(category) ?? []), item]);
}

for (const [category, items] of groups) {
  console.log(`\n${category} (${items.length})`);
  if (dry) {
    console.log(items.map((item) => `  ${item.name}`).join("\n"));
    continue;
  }
  const { error: updateError } = await db
    .from("catalogue")
    .update({ department: category })
    .in("id", items.map((item) => item.id));
  if (updateError?.code === "23514") {
    console.error("Run docs/migrations/004_catalogue_categories.sql first.");
    process.exit(2);
  }
  if (updateError) throw updateError;
}
