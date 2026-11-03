// Runs docs/schema.sql on a real Postgres engine (PGlite) and acts as each kind of user.
// Supabase's auth schema and roles are stubbed; everything else is the real schema.
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { before, test } from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { billFromRow, friendlyMessage, itemFromRow, itemToRow, patientFromRow, patientToRow } from "../lib/mappers.mjs";

const ROLES = ["admin", "cashier", "receptionist", "pharmacist", "lab", "nurse", "doctor"];
const uid = (index) => `00000000-0000-0000-0000-00000000000${index + 1}`;
const OUTSIDER = "00000000-0000-0000-0000-0000000000ff";

let db;

// Runs a query as a signed-in user, through RLS, the way the browser's requests do.
async function as(role, sql, params = []) {
  const id = role === "outsider" ? OUTSIDER : uid(ROLES.indexOf(role));
  return db.transaction(async (tx) => {
    await tx.query("select set_config('request.jwt.sub', $1, true)", [id]);
    await tx.exec("set local role authenticated");
    return tx.query(sql, params);
  });
}

// Superuser access, for setting up scenarios and checking results.
const sys = (sql, params) => db.query(sql, params);

const stockOf = async (id) => (await sys("select stock from catalogue where id = $1", [id])).rows[0].stock;

async function bill(role, lines, { waiver = 0, method = null, reference = "", patient = "P-00001" } = {}) {
  const result = await as(role, "select create_bill($1, $2::jsonb, $3, $4, $5) as id", [
    patient,
    JSON.stringify(lines),
    waiver,
    method,
    reference,
  ]);
  return result.rows[0].id;
}

before(async () => {
  db = new PGlite();
  await db.exec(`
    create role anon; create role authenticated; create role service_role;
    create schema auth;
    create table auth.users (id uuid primary key);
    create function auth.uid() returns uuid language sql stable
      as $$ select nullif(current_setting('request.jwt.sub', true), '')::uuid $$;
    grant usage on schema auth to anon, authenticated, service_role;
    grant usage on schema public to anon, authenticated, service_role;
    grant execute on function auth.uid() to anon, authenticated, service_role;
  `);
  await db.exec(readFileSync(new URL("../docs/schema.sql", import.meta.url), "utf8"));
  for (const file of readdirSync(new URL("../docs/migrations/", import.meta.url)).sort()) {
    await db.exec(readFileSync(new URL(`../docs/migrations/${file}`, import.meta.url), "utf8"));
  }

  await sys(`insert into auth.users (id) values ('${OUTSIDER}')`);
  for (const [index, role] of ROLES.entries()) {
    await sys(`insert into auth.users (id) values ('${uid(index)}')`);
    await sys(
      "insert into staff (auth_user_id, first_name, last_name, email, role, must_change_password) values ($1, $2, 'Test', $3, $4, false)",
      [uid(index), role, `${role}@test.example`, role]
    );
  }
  await sys(`insert into patients (first_name, last_name, gender) values ('Self', 'Payer', 'Female')`);
  await sys(`insert into patients (first_name, last_name, gender, insurer, member_no) values ('In', 'Sured', 'Male', 'AAR', 'A1')`);
  await sys(`insert into catalogue (name, department, price) values ('Consult', 'Consultation', 1500)`); // ITM-0001
  await sys(`insert into catalogue (name, department, price, tracks_stock, stock) values ('Tablet', 'Pharmacy', 20, true, 100)`); // ITM-0002
});

/* ---------- Who can see what ---------- */

test("someone signed in but not on the staff list can read nothing", async () => {
  for (const table of ["patients", "catalogue", "item_costs", "bills", "audit_log"]) {
    assert.equal((await as("outsider", `select * from ${table}`)).rows.length, 0, table);
  }
  assert.equal((await as("outsider", "select bill_id from bill_lines")).rows.length, 0);
  assert.equal((await as("outsider", "select * from staff")).rows.length, 0);
});

test("the public key alone cannot read any table", async () => {
  await assert.rejects(
    db.transaction(async (tx) => {
      await tx.exec("set local role anon");
      await tx.query("select * from patients");
    }),
    /permission denied/
  );
});

test("nobody signed in can read or change the subscription", async () => {
  await assert.rejects(as("admin", "select * from subscription"), /permission denied/);
  await assert.rejects(as("admin", "update subscription set is_paid = true"), /permission denied/);
});

test("only administrators can read the audit log", async () => {
  assert.ok((await as("admin", "select * from audit_log")).rows.length > 0);
  assert.equal((await as("cashier", "select * from audit_log")).rows.length, 0);
});

test("the audit log can't be altered, even by an administrator", async () => {
  await assert.rejects(as("admin", "delete from audit_log"), /permission denied/);
  await assert.rejects(as("admin", "update audit_log set actor_name = 'x'"), /permission denied/);
});

test("staff see only their own staff record; administrators see all", async () => {
  const own = await as("cashier", "select role from staff");
  assert.deepEqual(own.rows, [{ role: "cashier" }]);
  assert.equal((await as("admin", "select * from staff")).rows.length, ROLES.length);
});

/* ---------- Who can change what ---------- */

test("staff cannot make themselves administrators", async () => {
  await assert.rejects(as("cashier", "insert into staff (auth_user_id, first_name, last_name, email, role) values ('" + OUTSIDER + "', 'a', 'b', 'x@test.example', 'admin')"), /row-level security/);
  await as("cashier", "update staff set role = 'admin'");
  assert.equal((await sys("select role from staff where email = 'cashier@test.example'")).rows[0].role, "cashier");
});

test("administrators cannot lock themselves out", async () => {
  await assert.rejects(as("admin", "update staff set active = false where email = 'admin@test.example'"), /cannot deactivate your own/);
  await assert.rejects(as("admin", "update staff set role = 'nurse' where email = 'admin@test.example'"), /cannot change your own role/);
});

test("a user can clear their own password flag and nobody else's", async () => {
  await sys("update staff set must_change_password = true where email in ('lab@test.example', 'nurse@test.example')");
  await as("lab", "select mark_password_changed()");
  const rows = (await sys("select email, must_change_password from staff where email in ('lab@test.example', 'nurse@test.example') order by email")).rows;
  assert.deepEqual(rows.map((r) => r.must_change_password), [false, true]);
  await sys("update staff set must_change_password = false");
});

test("only administrators and pharmacists can change the catalogue", async () => {
  await assert.rejects(as("cashier", "insert into catalogue (name, department, price) values ('x', 'Ward', 1)"), /row-level security/);
  await as("cashier", "update catalogue set price = 1");
  assert.equal((await sys("select price from catalogue where id = 'ITM-0001'")).rows[0].price, 1500);
  await as("pharmacist", "update catalogue set unit = 'tablet' where id = 'ITM-0002'");
  assert.equal((await sys("select unit from catalogue where id = 'ITM-0002'")).rows[0].unit, "tablet");
});

test("bills cannot be written directly, even by an administrator", async () => {
  const id = await bill("cashier", [{ item_id: "ITM-0001", qty: 1 }]);
  await assert.rejects(as("admin", "update bills set total = 0 where id = $1", [id]), /permission denied/);
  await assert.rejects(as("admin", "delete from bills where id = $1", [id]), /permission denied/);
  await assert.rejects(as("admin", "update bill_lines set amount = 0"), /permission denied/);
  await assert.rejects(as("admin", "update counters set value = 0"), /permission denied/);
});

test("deactivated staff lose all access at once", async () => {
  await sys("update staff set active = false where email = 'receptionist@test.example'");
  assert.equal((await as("receptionist", "select * from patients")).rows.length, 0);
  await assert.rejects(bill("receptionist", [{ item_id: "ITM-0001", qty: 1 }]), /permission/);
  await sys("update staff set active = true where email = 'receptionist@test.example'");
});

test("pausing the subscription blocks data, not just the screens", async () => {
  await sys("update subscription set is_paid = false");
  try {
    assert.equal((await as("admin", "select * from patients")).rows.length, 0);
    await assert.rejects(bill("admin", [{ item_id: "ITM-0001", qty: 1 }]), /permission/);
  } finally {
    await sys("update subscription set is_paid = true");
  }
  assert.ok((await as("admin", "select * from patients")).rows.length > 0);
});

/* ---------- Billing ---------- */

test("the price comes from the catalogue and stock goes down", async () => {
  const before = await stockOf("ITM-0002");
  const id = await bill("cashier", [
    { item_id: "ITM-0001", qty: 1, price: 1 },
    { item_id: "ITM-0002", qty: 3, price: 1 },
  ], { method: "cash" });
  const row = (await sys("select * from bills where id = $1", [id])).rows[0];
  assert.equal(row.subtotal, 1560);
  assert.equal(row.total, 1560);
  assert.equal(row.status, "paid");
  assert.equal(row.created_by, "cashier Test");
  assert.equal(await stockOf("ITM-0002"), before - 3);
});

test("invoice numbers have no gaps after a failed bill", async () => {
  const first = await bill("cashier", [{ item_id: "ITM-0001", qty: 1 }]);
  await assert.rejects(bill("cashier", [{ item_id: "ITM-0002", qty: 999999 }]), /left in stock/);
  const next = await bill("cashier", [{ item_id: "ITM-0001", qty: 1 }]);
  assert.equal(Number(next.slice(4)), Number(first.slice(4)) + 1);
});

test("a failed bill changes nothing", async () => {
  const before = await stockOf("ITM-0002");
  await assert.rejects(
    bill("cashier", [{ item_id: "ITM-0002", qty: 1 }, { item_id: "NOPE", qty: 1 }]),
    /no longer in the catalogue/
  );
  assert.equal(await stockOf("ITM-0002"), before);
});

test("a second bill for the last unit is refused", async () => {
  await sys("insert into catalogue (id, name, department, price, tracks_stock, stock) values ('LAST', 'Last vial', 'Pharmacy', 10, true, 1)");
  const outcomes = await Promise.allSettled([
    bill("cashier", [{ item_id: "LAST", qty: 1 }]),
    bill("pharmacist", [{ item_id: "LAST", qty: 1 }]),
  ]);
  assert.equal(outcomes.filter((o) => o.status === "fulfilled").length, 1);
  assert.equal(await stockOf("LAST"), 0);
});

test("rejects bad bills", async () => {
  await assert.rejects(bill("cashier", []), /at least one item/);
  await assert.rejects(bill("cashier", [{ item_id: "ITM-0001", qty: 0 }]), /Invalid quantity/);
  await assert.rejects(bill("cashier", [{ item_id: "ITM-0001", qty: -2 }]), /Invalid quantity/);
  await assert.rejects(bill("cashier", [{ item_id: "ITM-0001", qty: 1 }, { item_id: "ITM-0001", qty: 1 }]), /appears twice/);
  await assert.rejects(bill("cashier", [{ item_id: "ITM-0001", qty: 1 }], { patient: "P-99999" }), /Patient not found/);
  await assert.rejects(bill("cashier", [{ item_id: "ITM-0001", qty: 1 }], { waiver: 99999 }), /Waiver/);
  await assert.rejects(bill("cashier", [{ item_id: "ITM-0001", qty: 1 }], { waiver: -5 }), /Waiver/);
  await assert.rejects(bill("cashier", [{ item_id: "ITM-0001", qty: 1 }], { method: "bitcoin" }), /Unknown payment/);
  await assert.rejects(bill("cashier", [{ item_id: "ITM-0001", qty: 1 }], { method: "insurance" }), /no insurance/);
});

test("doctors cannot bill; only administrators and cashiers can waive", async () => {
  await assert.rejects(bill("doctor", [{ item_id: "ITM-0001", qty: 1 }]), /permission/);
  await assert.rejects(bill("nurse", [{ item_id: "ITM-0001", qty: 1 }], { waiver: 100 }), /waiver/);
  const id = await bill("cashier", [{ item_id: "ITM-0001", qty: 1 }], { waiver: 100 });
  assert.equal((await sys("select total from bills where id = $1", [id])).rows[0].total, 1400);
});

test("an M-Pesa code can pay only one bill, until that bill is voided", async () => {
  const line = [{ item_id: "ITM-0001", qty: 1 }];
  const first = await bill("cashier", line, { method: "mpesa", reference: " abc123 " });
  assert.equal((await sys("select payment_reference from bills where id = $1", [first])).rows[0].payment_reference, "ABC123");
  await assert.rejects(bill("cashier", line, { method: "mpesa", reference: "ABC123" }), /bills_mpesa_reference_key/);

  const unpaid = await bill("cashier", line);
  await assert.rejects(as("cashier", "select record_payment($1, 'mpesa', 'abc123')", [unpaid]), /bills_mpesa_reference_key/);
  await assert.rejects(bill("cashier", line, { method: "mpesa", reference: "  " }), /M-Pesa transaction code/);

  await as("admin", "select void_bill($1, 'wrong patient')", [first]);
  assert.ok(await bill("cashier", line, { method: "mpesa", reference: "ABC123" }));
});

test("an unpaid bill moves through insurance claim to paid", async () => {
  const id = await bill("cashier", [{ item_id: "ITM-0001", qty: 1 }], { patient: "P-00002" });
  await as("cashier", "select record_payment($1, 'insurance')", [id]);
  let row = (await sys("select * from bills where id = $1", [id])).rows[0];
  assert.equal(row.status, "claim");
  assert.equal(row.paid_at, null);

  await as("cashier", "select record_payment($1, 'insurance', 'remit-9')", [id]);
  row = (await sys("select * from bills where id = $1", [id])).rows[0];
  assert.equal(row.status, "paid");
  assert.equal(row.payment_reference, "REMIT-9");
  assert.ok(row.paid_at);

  await assert.rejects(as("cashier", "select record_payment($1, 'cash')", [id]), /no outstanding balance/);
});

test("only administrators can void, and voiding returns stock once", async () => {
  const before = await stockOf("ITM-0002");
  const id = await bill("cashier", [{ item_id: "ITM-0002", qty: 5 }], { method: "cash" });
  assert.equal(await stockOf("ITM-0002"), before - 5);

  await assert.rejects(as("cashier", "select void_bill($1, 'oops')", [id]), /Only an administrator/);
  await assert.rejects(as("admin", "select void_bill($1, '  ')", [id]), /reason/);
  await as("admin", "select void_bill($1, 'entered twice')", [id]);
  assert.equal(await stockOf("ITM-0002"), before);
  await assert.rejects(as("admin", "select void_bill($1, 'again')", [id]), /already void/);
  assert.equal(await stockOf("ITM-0002"), before);
  await assert.rejects(as("admin", "select record_payment($1, 'cash')", [id]), /no outstanding balance/);
});

test("issued bills keep their prices when the catalogue changes or the item is deleted", async () => {
  await sys("insert into catalogue (id, name, department, price) values ('TEMP', 'Old test', 'Laboratory', 700)");
  const id = await bill("cashier", [{ item_id: "TEMP", qty: 2 }]);
  await as("pharmacist", "update catalogue set price = 9000 where id = 'TEMP'");
  await as("pharmacist", "delete from catalogue where id = 'TEMP'");
  const line = (await sys("select * from bill_lines where bill_id = $1", [id])).rows[0];
  assert.deepEqual([line.name, line.unit_price, line.amount], ["Old test", 700, 1400]);
  await as("admin", "select void_bill($1, 'test')", [id]); // the item is gone: must not fail
});

test("changes are recorded in the audit log with who made them", async () => {
  const id = await bill("cashier", [{ item_id: "ITM-0001", qty: 1 }]);
  const entry = (await sys("select * from audit_log where table_name = 'bills' and row_id = $1", [id])).rows[0];
  assert.equal(entry.action, "INSERT");
  assert.equal(entry.actor_name, "cashier Test");
  assert.equal(entry.actor_id, "STF-002");
});

/* ---------- Buying prices ---------- */

test("only administrators and pharmacists can see or set buying prices", async () => {
  await sys("insert into catalogue (id, name, department, price) values ('COST', 'Syrup', 'Pharmacy', 300)");
  await as("pharmacist", "insert into item_costs (id, buying_price) values ('COST', 180)");
  for (const role of ["admin", "pharmacist"]) {
    assert.equal((await as(role, "select buying_price from item_costs where id = 'COST'")).rows[0].buying_price, 180, role);
  }
  for (const role of ["cashier", "receptionist", "lab", "nurse", "doctor"]) {
    assert.equal((await as(role, "select * from item_costs")).rows.length, 0, role);
    await assert.rejects(as(role, "insert into item_costs (id, buying_price) values ('ITM-0001', 1)"), /row-level security/, role);
  }
  await as("cashier", "update item_costs set buying_price = 1");
  assert.equal((await sys("select buying_price from item_costs where id = 'COST'")).rows[0].buying_price, 180);
  await assert.rejects(as("admin", "insert into item_costs (id, buying_price) values ('ITM-0001', -1)"), /check/);
});

test("the same catalogue query works for every role, hiding the cost from others", async () => {
  const query = "select c.*, (select row_to_json(k) from (select buying_price from item_costs where id = c.id) k) as item_costs from catalogue c where c.id = 'COST'";
  assert.equal(itemFromRow((await as("pharmacist", query)).rows[0]).buyingPrice, 180);
  const seenByCashier = itemFromRow((await as("cashier", query)).rows[0]);
  assert.equal(seenByCashier.buyingPrice, null);
  assert.equal(seenByCashier.price, 300);
});

test("bills charge the selling price and keep the buying price from the day of sale", async () => {
  const id = await bill("cashier", [{ item_id: "COST", qty: 2 }]);
  await as("pharmacist", "update item_costs set buying_price = 250 where id = 'COST'");
  const line = (await sys("select * from bill_lines where bill_id = $1", [id])).rows[0];
  assert.deepEqual([line.unit_price, line.amount, line.unit_cost], [300, 600, 180]);

  const uncosted = await bill("cashier", [{ item_id: "ITM-0001", qty: 1 }]);
  assert.equal((await sys("select unit_cost from bill_lines where bill_id = $1", [uncosted])).rows[0].unit_cost, null);
});

test("no role can read the buying price through a bill", async () => {
  await assert.rejects(as("cashier", "select unit_cost from bill_lines"), /permission denied/);
  await assert.rejects(as("admin", "select * from bill_lines"), /permission denied/);
  assert.ok((await as("cashier", "select unit_price from bill_lines")).rows.length > 0);
});

test("buying price changes are audited, and deleting an item removes its cost", async () => {
  const entries = (await as("admin", "select action, actor_name from audit_log where table_name = 'item_costs' and row_id = 'COST' order by id")).rows;
  assert.deepEqual(entries.map((e) => e.action), ["INSERT", "UPDATE"]);
  assert.equal(entries[0].actor_name, "pharmacist Test");
  await as("pharmacist", "delete from catalogue where id = 'COST'");
  assert.equal((await sys("select * from item_costs where id = 'COST'")).rows.length, 0);
});

/* ---------- The page objects match the real columns ---------- */

test("patients and items round-trip through the real tables", async () => {
  const patient = {
    firstName: " Ann ", lastName: "Doe", dob: "", gender: "Female", phone: "0700", nationalId: "ID-1",
    town: "Thika", insurer: "SHA", memberNo: "S1", nextOfKinName: "Kin", nextOfKinPhone: "0711",
  };
  const row = patientToRow(patient);
  const columns = Object.keys(row);
  const inserted = await as(
    "nurse",
    `insert into patients (${columns.join(", ")}) values (${columns.map((_, i) => `$${i + 1}`).join(", ")}) returning *`,
    Object.values(row)
  );
  const saved = patientFromRow(inserted.rows[0]);
  assert.match(saved.id, /^P-\d{5}$/);
  assert.equal(saved.firstName, "Ann");
  assert.equal(saved.dob, "");

  const itemRow = itemToRow({ name: "Gauze", department: "Procedures", price: 50, tracksStock: true, stock: 5, reorderLevel: 2, unit: "roll" });
  const itemColumns = Object.keys(itemRow);
  const item = await as(
    "pharmacist",
    `insert into catalogue (${itemColumns.join(", ")}) values (${itemColumns.map((_, i) => `$${i + 1}`).join(", ")}) returning *`,
    Object.values(itemRow)
  );
  assert.deepEqual(itemFromRow(item.rows[0]), { id: item.rows[0].id, name: "Gauze", department: "Procedures", price: 50, buyingPrice: null, tracksStock: true, stock: 5, reorderLevel: 2, unit: "roll" });
  assert.equal("stock" in itemToRow({ name: "x", department: "Ward", price: 1 }), false);
});

test("a bill maps to what the pages expect, with lines in order", async () => {
  const id = await bill("cashier", [{ item_id: "ITM-0002", qty: 2 }, { item_id: "ITM-0001", qty: 1 }], { method: "cash" });
  const row = (await sys("select * from bills where id = $1", [id])).rows[0];
  row.bill_lines = (await sys("select * from bill_lines where bill_id = $1 order by position desc", [id])).rows;
  const mapped = billFromRow(row);
  assert.deepEqual(mapped.lines.map((l) => l.itemId), ["ITM-0002", "ITM-0001"]);
  assert.equal(mapped.payment.method, "cash");
  assert.ok(mapped.payment.paidAt);
  assert.equal(billFromRow({ ...row, payment_method: null, bill_lines: [] }).payment, null);
});

test("database errors become messages staff can act on", () => {
  assert.match(friendlyMessage({ code: "23505", message: 'violates "bills_mpesa_reference_key"' }), /M-Pesa code/);
  assert.match(friendlyMessage({ code: "P0001", message: "Only 2 of Tablet left in stock." }), /Only 2/);
  assert.match(friendlyMessage({ code: "42501", message: "x" }), /permission/);
  assert.doesNotMatch(friendlyMessage({ code: "XX000", message: "secret internals" }), /internals/);
});
