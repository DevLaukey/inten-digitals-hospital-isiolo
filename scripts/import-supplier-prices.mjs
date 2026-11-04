// One-off import from invoices XNJ70000911 and XNJ70000912. Safe to run again:
// items that already exist are never duplicated, and their selling price is left alone.
// node --env-file=.env.local scripts/import-supplier-prices.mjs
import { createClient } from "@supabase/supabase-js";

// [name, buying price (printed), selling price (handwritten)]
// Where two selling prices were written, the higher is used. Null means marked X: no price yet.
const ITEMS = [
  ["*SPAMOX* (Amoxicillin 60ml) ORAL SUSP 60ML", 36, 80],
  ["CIPROCIN (CIPROFLOXACIN 0.3%) EYE DROPS 5ML", 87.5, 200],
  ["FLAGIN (METRONIDAZOLE) SUSP 100ML", 43.75, 150],
  ["KOFGON (GREEN) SYRUP 100ML", 29, 150],
  ["KOFGON SYRUP 60ML (GREEN)", 23, 100],
  ["FOLIC ACID 5MG TABS 100'S (ZAIN)", 40.07, 10],
  ["MELOXICAM TABS 7.5MG 100'S", 117.59, 10],
  ["FUROSEMIDE TABS 40MG 100'S", 69, 10],
  ["LEVOFLOXACIN 500MG TABS 10'S", 50, 400],
  ["OLSOLONE (PREDNISOLONE) SY 50ML", 87.5, 300],
  ["PEARDINE MOUTHWASH 100ML", 85, 300],
  ["SPOTCLAV (Co-Amoxiclav) ORAL SUSP *228.5* 100ML", 115, 350],
  ["10CC SYRINGES 100'S", 440, null],
  ["5CC SYRINGES 100'S", 255, null],
  ["AMLODIPINE (AMLODY) 10MG TABS 30'S", 55.5, null],
  ["CEFTRIAXONE 1G INJ (CEFZED)", 28.87, null],
  ["ENTAMAXIN CAPS 30'S", 243.75, null],
  ["GLUCOPHAGE 500MG TABS 90'S", 385, null],
  ["LIGNOCAINE INJ 30ML", 27.14, null],
  ["PARACETAMOL 1G IV 100ML", 51, null],
  ['STRAPPING 2"', 49, null],
  ["MYOSPAZ 100'S", 1650, null],
  ["ABZ SUSPENSION 10ML", 43.75, 100],
  ["ABZ Tablet", 34.3, 100], // already in the catalogue; its selling price is kept
  ["A.P.C TABLETS BLISTER 100'S", 100, 5],
  ["ACECLOFENAC 100MG TABS 30'S", 42.39, 25],
  ["ACETAL-MR TABS 100'S", 638.5, 25],
  ["AZITHROMYCIN 500MG 3'S", 47.62, 150],
  ["BETA GRIPE WATER 60ML", 93.67, 100],
  ["BIOTRIM SUSPENSION 50ML", 47, 100],
  ["BULKOT CREAM 20GM", 25, 100],
  ["CALPOL INFANT SUSP 100ML", 334, 450],
  ["CETRIZINE (CETZAN) 10MG 100'S", 33.44, 5],
  ["CETRIZINE SYRUP 60ML (CETZAN)", 17.5, 50],
  ["CIPROFLOXACIN 500MG 10'S", 36.6, 150],
  ["CLOTRIMAZOLE 20GM CREAM", 16.78, 100],
  ["CONTUS 650 TABS 10'S", 108, 20],
  ["COTTON WOOL 100GM", 66.13, 100],
  ["COTTON WOOL 200GM", 106.25, 200],
  ["COTTON WOOL 400GM", 181.77, 500],
  ["COTTON WOOL 50GM", 35.76, 50],
  ["CYPRO B PLUS SYRUP 200ML", 265, 450],
  ["DAWA CPM SYRUP 60ML", 23.18, 50],
  ["DAWAHIST COUGH EXP 60ML", 38, 100],
  ["DELASED CHESTY COUGH 100ML", 144, 250],
  ["DEXAMETHASONE 4MG/1ML INJ(MIN 10) 10'S", 71.25, 100],
  ["DEXAMETHASONE 8M/2ML INJ(MIN 10) 10'S", 100, 100],
  ["DICLOFENAC INJ. 75MG/3ML 10'S", 43.99, 100],
  ["DOXYCYCLINE 100MG 100'S", 159, 50], // printed as DOXYCLCLINE
  ["FLUGONE CAPS 10'S", 119, 20],
  ["FUNBACT-A CREAM 15GM", 155, 300],
  ["GENTAMICIN EYE/EAR DROPS 5ML", 14.96, 100],
  ["GENTAMICIN INJ 80/2ML 10'S", 55, 50],
  ["GOODMORNING LUNG TONIC 60ML", 78.95, 100],
  ["GRISEOFULVIN 500MG TABS 100'S", 690, 10],
  ["HYDROCORTISONE INJ 100MG", 22.18, 100],
  ["IBUPROFEN 400MG TABS 100'S", 128.03, 100],
  ["IBUPROFEN (ZORAFEN) SUSP 60ML", 24.4, 50],
  ["IBUPROFEN TABS 200MG 100'S", 73.2, 50],
  ["LOBAK TABS 10'S", 113.23, 20],
  ["LOPEZ *LOPERAMIDE* CAPS 6'S", 8.13, 50],
  ["LOZOL (Omeprazole) CAPS 20MG 100'S", 96.25, 50],
  ["LYSODOL TABS 30'S", 88, 150],
  ["MARA MOJA TABS 100'S", 345, 10],
  ["METRONIDAZOLE 200MG TABS 100'S", 70, 50],
  ["METRONIDAZOLE I.V 100ML", 33.69, 300],
  ["MTM 100M TABS 4'S", 45, 100],
  ["MTM 50MG TABS 4'S", 35.71, 50],
  ["MULTIVITAMIN SUSP 100ML (MULTIDEX)", 28.75, 150],
  ["MULTIVITAMIN SUSP 60ML", 21.25, 100],
  ["NATOA 100MG TABS 6'S", 44.89, 70],
  ["NATOA SUSPENSION 30ML", 73.75, 100],
  ["NIFEDIPINE TABS 20MG", 72.18, 30],
  ["NOSFREE SALINE NASAL DROPS", 20.74, 100],
  ["OLWORM TABS", 15.6, 50],
  ["PROBETA-N EYE/EAR DROPS", 120, 250],
  ["PROMETHAZINE SUSP 60ML (LARGAN)", 20, 100],
  ["SABULIN (SALBUTAMOL) SYRUP 60ML", 22.5, 100],
  ["SHALTOUX COUGH SYRUP 4WAYS", 67.71, 200],
  ["SICLOFEN MR TABS 10'S", 59.25, 20],
  ["SPAMCLOX ORAL SUSP 250MG 60ML", 43.75, 200],
  ["SPOTCLAV TABS 625MG 10'S", 117.84, 300],
  ["TRANEXAMIC INJ 500MG 5'S (MENOZIP)", 420, 800],
  ["TRIDEX EXP 60ML", 50, 100],
  ["XTRADERM CREAM 20GM", 125, 300],
  ["ZINC SULPHATE TABS 100'S", 86.17, 100],
  ["ZOLAS -ALBENDAZOLE TABS 1'S", 3.7, 50],
  ["ZULU 10'S", 295, 50],
  ["ZULU MR 20'S", 655, 50],
];

const key = (name) => name.toLowerCase();
const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const stop = (label, error) => {
  console.error(`${label}: ${error.code} ${error.message}`);
  process.exit(1);
};

if (new Set(ITEMS.map(([name]) => key(name))).size !== ITEMS.length) throw new Error("Duplicate name in the list.");

const { data: existing, error: readError } = await db.from("catalogue").select("id, name, department");
if (readError) stop("Reading the catalogue", readError);
const idByName = new Map(existing.map((item) => [key(item.name), item.id]));

const missing = ITEMS.filter(([name]) => !idByName.has(key(name)));
let unpriced = 0;
for (const batch of [missing.filter(([, , price]) => price !== null), missing.filter(([, , price]) => price === null)]) {
  if (!batch.length) continue;
  const { data, error } = await db
    .from("catalogue")
    .insert(batch.map(([name, , price]) => ({ name, price, department: "Pharmacy" })))
    .select("id, name");
  if (error?.code === "23502") {
    unpriced = batch.length;
    continue;
  }
  if (error) stop("Adding items", error);
  for (const item of data) idByName.set(key(item.name), item.id);
}
console.log(`Items: ${missing.length - unpriced} added, ${ITEMS.length - missing.length} already there.`);
if (unpriced) console.log(`${unpriced} items without a selling price NOT added: run docs/migrations/003_optional_selling_price.sql, then run this script again.`);

const costs = ITEMS.filter(([name]) => idByName.has(key(name))).map(([name, buying]) => ({ id: idByName.get(key(name)), buying_price: buying }));
const whole = costs.filter((cost) => Number.isInteger(cost.buying_price));
const withCents = costs.filter((cost) => !Number.isInteger(cost.buying_price));

const { error: wholeError } = await db.from("item_costs").upsert(whole);
if (wholeError) stop("Saving buying prices", wholeError);
const { error: centsError } = await db.from("item_costs").upsert(withCents);
if (centsError) {
  console.log(`Buying prices: ${whole.length} saved. ${withCents.length} with cents NOT saved (${centsError.code}).`);
  console.log("Run docs/migrations/002_buying_price_cents.sql, then run this script again.");
  process.exit(2);
}
console.log(`Buying prices: all ${costs.length} saved.`);
