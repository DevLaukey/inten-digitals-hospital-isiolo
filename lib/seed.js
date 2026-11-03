import { buildBill } from "./billing";

// Fictional sample data so every screen has something to show in demo mode.
const STAFF = [
  ["Kate", "Onyango", "admin@hospital.test", "admin"],
  ["Cynthia", "Mutuku", "cashier@hospital.test", "cashier"],
  ["Dennis", "Kyalo", "reception@hospital.test", "receptionist"],
  ["Yvonne", "Achieng", "pharmacy@hospital.test", "pharmacist"],
  ["Levis", "Kimani", "lab@hospital.test", "lab"],
  ["Grace", "Wanjiru", "nurse@hospital.test", "nurse"],
  ["Peter", "Otieno", "doctor@hospital.test", "doctor"],
];

const ITEMS = [
  ["General consultation", "Consultation", 1500],
  ["Specialist consultation", "Consultation", 3500],
  ["Paediatric consultation", "Consultation", 2000],
  ["Full blood count", "Laboratory", 1200],
  ["Malaria test", "Laboratory", 500],
  ["Urinalysis", "Laboratory", 450],
  ["Blood sugar", "Laboratory", 350],
  ["Chest X-ray", "Imaging", 2500],
  ["Abdominal ultrasound", "Imaging", 4000],
  ["Wound dressing", "Procedures", 800],
  ["Suturing", "Procedures", 2500],
  ["General ward bed (per day)", "Ward", 3000],
  ["Private room (per day)", "Ward", 8000],
  ["Paracetamol 500mg", "Pharmacy", 5, 2000, 300, "tablet"],
  ["Amoxicillin 500mg", "Pharmacy", 20, 850, 200, "capsule"],
  ["Artemether/Lumefantrine", "Pharmacy", 450, 60, 25, "pack"],
  ["Oral rehydration salts", "Pharmacy", 40, 18, 30, "sachet"],
  ["Insulin (vial)", "Pharmacy", 1200, 12, 15, "vial"],
];

const PATIENTS = [
  ["Mary", "Njeri", "1988-04-12", "Female", "0712 000 101", "Nairobi", "SHA", "SHA-100231"],
  ["John", "Mwangi", "1975-09-30", "Male", "0712 000 102", "Thika", "", ""],
  ["Aisha", "Hassan", "1996-01-22", "Female", "0712 000 103", "Mombasa", "AAR", "AAR-554120"],
  ["Samuel", "Kiptoo", "2015-06-08", "Male", "0712 000 104", "Eldoret", "", ""],
  ["Faith", "Akinyi", "1969-11-17", "Female", "0712 000 105", "Kisumu", "Jubilee", "JUB-778201"],
  ["Brian", "Mutua", "2001-03-03", "Male", "0712 000 106", "Machakos", "", ""],
];

const pad = (n, width) => String(n).padStart(width, "0");

export function buildSeed(now = new Date()) {
  const staff = STAFF.map(([firstName, lastName, email, role], i) => ({
    id: `STF-${pad(i + 1, 3)}`,
    firstName,
    lastName,
    email,
    phone: `0722 000 ${pad(i + 1, 3)}`,
    role,
    active: true,
  }));

  const catalogue = ITEMS.map(([name, department, price, stock, reorderLevel, unit], i) => ({
    id: `ITM-${pad(i + 1, 4)}`,
    name,
    department,
    price,
    tracksStock: stock !== undefined,
    stock: stock ?? 0,
    reorderLevel: reorderLevel ?? 0,
    unit: unit ?? "",
  }));

  const patients = PATIENTS.map(
    ([firstName, lastName, dob, gender, phone, town, insurer, memberNo], i) => ({
      id: `P-${pad(i + 1, 5)}`,
      firstName,
      lastName,
      dob,
      gender,
      phone,
      nationalId: "",
      town,
      insurer,
      memberNo,
      nextOfKinName: "",
      nextOfKinPhone: "",
      createdAt: now.toISOString(),
    })
  );

  // A repeating pattern of visits across the last 7 days, covering each bill status.
  const visits = [
    [[0, 1], [3, 1], [13, 20]],
    [[0, 1], [4, 1], [15, 1]],
    [[1, 1], [7, 1]],
    [[2, 1], [5, 1]],
    [[9, 1], [14, 21]],
    [[11, 2], [0, 1]],
  ];
  const methods = ["cash", "mpesa", "card", "cash", "mpesa", "cash"];
  const cashier = staff[1];
  const cashierName = `${cashier.firstName} ${cashier.lastName}`;
  const bills = [];

  for (let daysBack = 6; daysBack >= 0; daysBack -= 1) {
    const count = 3 + ((daysBack * 2) % 4);
    for (let i = 0; i < count; i += 1) {
      const at = new Date(now);
      at.setDate(at.getDate() - daysBack);
      at.setHours(8 + i, 15, 0, 0);
      if (at > now) at.setTime(now.getTime() - (i + 1) * 60000);

      const n = bills.length;
      const patient = patients[n % patients.length];
      let payment = { method: methods[n % methods.length] };
      if (payment.method === "mpesa") payment.reference = `SAMPLE${pad(n, 4)}`;
      if (n % 7 === 3) payment = null;
      if (n % 7 === 5 && patient.insurer) payment = { method: "insurance" };

      bills.push(
        buildBill({
          id: `INV-${pad(n + 1, 5)}`,
          patient,
          items: catalogue,
          lines: visits[n % visits.length].map(([index, qty]) => ({
            itemId: catalogue[index].id,
            qty,
          })),
          waiver: n % 11 === 4 ? 200 : 0,
          payment,
          actorName: cashierName,
          at: at.toISOString(),
        })
      );
    }
  }

  return {
    staff,
    catalogue,
    patients,
    bills,
    counters: {
      staff: staff.length,
      item: catalogue.length,
      patient: patients.length,
      bill: bills.length,
    },
  };
}
