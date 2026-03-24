export const autoCategory = (description, type, categories) => {
  const desc = description.toLowerCase();
  const typeCategories = categories.filter(c => c.type === "both" || c.type === type || (type === "debit" && c.type === "expense") || (type === "credit" && c.type === "income"));
  for (const cat of typeCategories) {
    if (cat.id === "etc") continue;
    if (cat.keywords.some(k => k && desc.includes(k.toLowerCase()))) return cat.id;
  }
  return "etc";
};

export const parseAmount = (s) => {
  if (!s && s !== 0) return 0;
  return parseFloat(String(s).replace(/,/g, "")) || 0;
};

export const parseBCACSV = (text, categories) => {
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  const transactions = [];
  for (const line of lines) {
    const cols = line.split(",").map(c => c.replace(/"/g, "").trim());
    if (cols.length < 5) continue;
    const [dateStr, desc, , amtStr, dbcr] = cols;
    const dateParts = dateStr.split("/");
    if (dateParts.length !== 3) continue;
    const [dd, mm, yyyy] = dateParts;
    if (!dd || !mm || !yyyy || isNaN(Number(dd))) continue;
    const date = `${yyyy}-${mm.padStart(2,"0")}-${dd.padStart(2,"0")}`;
    const amount = parseAmount(amtStr);
    if (amount === 0) continue;
    const type = String(dbcr).toUpperCase().includes("CR") ? "credit" : "debit";
    const category = autoCategory(desc, type, categories);
    transactions.push({ date, description: desc, amount, type, category, account: "BCA", id: crypto.randomUUID(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  }
  return transactions;
};

export const parseBCAXLSX = async (file, categories, log = () => {}) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const XLSX = window.XLSX;
        const wb = XLSX.read(data, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: "" });

        log("SheetJS loaded, sheets:", wb.SheetNames);
        log("Total rows:", rows.length);
        log("Row 0:", JSON.stringify(rows[0]));
        log("Row 1:", JSON.stringify(rows[1]));

        let headerIdx = rows.findIndex(r => r && r.some && r.some(c => String(c).toLowerCase().includes("tanggal") || String(c).toLowerCase().includes("keterangan")));
        if (headerIdx === -1) headerIdx = 0;
        log("headerIdx:", headerIdx, "headers:", JSON.stringify(rows[headerIdx]));

        const headers = rows[headerIdx].map(h => String(h || "").toLowerCase().trim());
        const col = (name) => headers.findIndex(h => h.includes(name));
        const iDate = col("tanggal") !== -1 ? col("tanggal") : 4;
        const iDesc = col("keterangan") !== -1 ? col("keterangan") : 5;
        const iAmt  = col("jumlah") !== -1 ? col("jumlah") : 7;
        const iType = col("dbcr") !== -1 ? col("dbcr") : 8;
        log("col indices → date:", iDate, "desc:", iDesc, "amt:", iAmt, "type:", iType);
        log("Sample data row 1:", JSON.stringify(rows[headerIdx+1]));

        const transactions = [];
        for (let i = headerIdx + 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length < 4) continue;
          const dateStr = String(row[iDate] || "").trim();
          const desc    = String(row[iDesc] || "").trim();
          const amtStr  = String(row[iAmt]  || "").trim();
          const dbcr    = String(row[iType] || "").trim().toUpperCase();

          if (!dateStr || !desc || !amtStr) continue;
          const dateParts = dateStr.split("/");
          if (dateParts.length !== 3) continue;
          const [dd, mm, yyyy] = dateParts;
          if (isNaN(Number(dd)) || isNaN(Number(mm))) continue;
          const date = `${yyyy}-${mm.padStart(2,"0")}-${dd.padStart(2,"0")}`;
          const amount = parseAmount(amtStr);
          if (amount === 0) continue;
          const type = dbcr === "CR" ? "credit" : "debit";
          const category = autoCategory(desc, type, categories);
          transactions.push({ date, description: desc, amount, type, category, account: "BCA", id: crypto.randomUUID(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
        }
        resolve(transactions);
      } catch (err) { reject(err); }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsArrayBuffer(file);
  });
};
