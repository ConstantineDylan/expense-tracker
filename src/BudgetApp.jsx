import { useState, useEffect, useCallback, useMemo } from "react";
import { DEFAULT_CATEGORIES } from "./constants/categories";
import { autoCategory, parseAmount, parseBCACSV, parseBCAXLSX } from "./utils/parsers";
import { fmt, fmtShort, fmtDate, MONTHS } from "./utils/formatters";

// ─── DESIGN TOKENS ──────────────────────────────────────────────────────────
const FONT = "'DM Mono', 'Courier New', monospace";
const DISPLAY_FONT = "'DM Serif Display', Georgia, serif";

// ─── STORAGE SERVICE ─────────────────────────────────────────────────────────
const useStorage = () => {
  const [transactions, setTransactions] = useState(() => {
    try { return JSON.parse(localStorage.getItem("bca_transactions") || "[]"); } catch { return []; }
  });
  const [categories, setCategories] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("bca_categories") || "null");
      return saved || DEFAULT_CATEGORIES;
    } catch { return DEFAULT_CATEGORIES; }
  });

  useEffect(() => { localStorage.setItem("bca_transactions", JSON.stringify(transactions)); }, [transactions]);
  useEffect(() => { localStorage.setItem("bca_categories", JSON.stringify(categories)); }, [categories]);

  const addTransaction = (t) => setTransactions(prev => [...prev, { ...t, id: crypto.randomUUID(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }]);
  const updateTransaction = (id, data) => setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...data, updatedAt: new Date().toISOString() } : t));
  const deleteTransaction = (id) => setTransactions(prev => prev.filter(t => t.id !== id));
  const addCategory = (c) => setCategories(prev => [...prev, { ...c, id: crypto.randomUUID(), isDefault: false }]);
  const deleteCategory = (id) => setCategories(prev => prev.filter(c => c.id !== id));
  const importTransactions = (data) => setTransactions(data);
  const importCategories = (data) => setCategories(data);

  return { transactions, categories, addTransaction, updateTransaction, deleteTransaction, addCategory, deleteCategory, importTransactions, importCategories };
};

// ─── STYLES ──────────────────────────────────────────────────────────────────
const S = {
  app: { fontFamily: FONT, minHeight: "100vh", background: "#0e0e0e", color: "#e8e4dc" },
  sidebar: { width: 220, flexShrink: 0, background: "#141414", borderRight: "1px solid #2a2a2a", display: "flex", flexDirection: "column", padding: "24px 0" },
  sidebarLogo: { fontFamily: DISPLAY_FONT, fontSize: 22, color: "#e8e4dc", padding: "0 20px 24px", borderBottom: "1px solid #2a2a2a", marginBottom: 8 },
  sidebarSub: { fontSize: 10, color: "#555", letterSpacing: 2, textTransform: "uppercase", display: "block", marginTop: 2 },
  navItem: (active) => ({ display: "flex", alignItems: "center", gap: 10, padding: "10px 20px", cursor: "pointer", fontSize: 13, color: active ? "#e8e4dc" : "#666", background: active ? "#1e1e1e" : "transparent", borderLeft: active ? "2px solid #c9a96e" : "2px solid transparent", transition: "all 0.15s" }),
  main: { flex: 1, overflow: "auto", padding: 32 },
  pageTitle: { fontFamily: DISPLAY_FONT, fontSize: 28, color: "#e8e4dc", marginBottom: 4 },
  pageSub: { fontSize: 12, color: "#555", marginBottom: 28 },
  card: { background: "#141414", border: "1px solid #2a2a2a", borderRadius: 12, padding: 20 },
  metricCard: { background: "#141414", border: "1px solid #2a2a2a", borderRadius: 10, padding: "16px 18px" },
  metricLabel: { fontSize: 10, color: "#555", letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 },
  metricValue: { fontSize: 22, fontWeight: 500, color: "#e8e4dc" },
  metricSub: { fontSize: 11, color: "#555", marginTop: 4 },
  grid2: { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 },
  grid3: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 },
  grid4: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 12 },
  th: { textAlign: "left", padding: "8px 12px", color: "#555", fontWeight: 400, fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase", borderBottom: "1px solid #1e1e1e" },
  td: { padding: "10px 12px", borderBottom: "1px solid #1a1a1a", color: "#b8b4ac" },
  btn: { padding: "8px 16px", borderRadius: 6, border: "1px solid #2a2a2a", background: "transparent", color: "#b8b4ac", cursor: "pointer", fontSize: 12, fontFamily: FONT },
  btnPrimary: { padding: "8px 16px", borderRadius: 6, border: "none", background: "#c9a96e", color: "#0e0e0e", cursor: "pointer", fontSize: 12, fontFamily: FONT, fontWeight: 600 },
  input: { width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #2a2a2a", background: "#0e0e0e", color: "#e8e4dc", fontSize: 12, fontFamily: FONT, boxSizing: "border-box" },
  select: { width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #2a2a2a", background: "#0e0e0e", color: "#e8e4dc", fontSize: 12, fontFamily: FONT, boxSizing: "border-box" },
  label: { fontSize: 10, color: "#555", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 4, display: "block" },
  badge: (type) => ({ display: "inline-block", padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 600, letterSpacing: 1, background: type === "credit" ? "#0f2a1a" : "#2a0f0f", color: type === "credit" ? "#4ade80" : "#f87171" }),
  modal: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 },
  modalBox: { background: "#141414", border: "1px solid #2a2a2a", borderRadius: 12, padding: 28, width: 420, maxWidth: "90vw" },
  dot: (color) => ({ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }),
};

// ─── PIE CHART ────────────────────────────────────────────────────────────────
const CHART_COLORS = ["#c9a96e","#7c9cf8","#6ee7b7","#f87171","#a78bfa","#fbbf24","#34d399","#f472b6","#60a5fa","#fb923c"];
const PieChart = ({ data, size = 180 }) => {
  if (!data.length) return <div style={{ color: "#555", fontSize: 12, textAlign: "center", padding: 40 }}>No data</div>;
  const total = data.reduce((s, d) => s + d.value, 0);
  let angle = -90;
  const slices = data.map((d, i) => {
    const pct = d.value / total;
    const startAngle = angle;
    angle += pct * 360;
    const endAngle = angle;
    const r = size / 2 - 4;
    const cx = size / 2, cy = size / 2;
    const rad = (a) => (a * Math.PI) / 180;
    const x1 = cx + r * Math.cos(rad(startAngle)), y1 = cy + r * Math.sin(rad(startAngle));
    const x2 = cx + r * Math.cos(rad(endAngle)), y2 = cy + r * Math.sin(rad(endAngle));
    const large = pct > 0.5 ? 1 : 0;
    return { path: `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2} Z`, color: CHART_COLORS[i % CHART_COLORS.length], label: d.label, pct: Math.round(pct * 100) };
  });
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {slices.map((s, i) => <path key={i} d={s.path} fill={s.color} stroke="#0e0e0e" strokeWidth={2} />)}
      <circle cx={size/2} cy={size/2} r={size/4} fill="#141414" />
    </svg>
  );
};

// ─── BAR CHART ────────────────────────────────────────────────────────────────
const BarChart = ({ data, height = 120 }) => {
  const max = Math.max(...data.map(d => Math.max(d.income, d.expense)), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height, paddingBottom: 20, position: "relative" }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2, height: "100%" }}>
          <div style={{ flex: 1, display: "flex", alignItems: "flex-end", gap: 2, width: "100%" }}>
            <div style={{ flex: 1, background: "#4ade80", opacity: 0.7, borderRadius: "3px 3px 0 0", height: `${(d.income/max)*100}%`, minHeight: d.income > 0 ? 2 : 0 }} />
            <div style={{ flex: 1, background: "#f87171", opacity: 0.7, borderRadius: "3px 3px 0 0", height: `${(d.expense/max)*100}%`, minHeight: d.expense > 0 ? 2 : 0 }} />
          </div>
          <span style={{ fontSize: 9, color: "#555", marginTop: 4 }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
};

// ─── TRANSACTION MODAL ────────────────────────────────────────────────────────
const TransactionModal = ({ tx, categories, onSave, onClose }) => {
  const [form, setForm] = useState(tx || { date: new Date().toISOString().split("T")[0], description: "", amount: "", type: "debit", category: "etc", account: "BCA" });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <div style={S.modal} onClick={onClose}>
      <div style={S.modalBox} onClick={e => e.stopPropagation()}>
        <h3 style={{ fontFamily: DISPLAY_FONT, fontSize: 20, marginBottom: 20, color: "#e8e4dc" }}>{tx ? "Edit Transaction" : "New Transaction"}</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {[["Date","date","date"],["Description","text","description"],["Amount","number","amount"],["Account","text","account"]].map(([label, type, key]) => (
            <div key={key}>
              <label style={S.label}>{label}</label>
              <input style={S.input} type={type} value={form[key]} onChange={e => set(key, e.target.value)} />
            </div>
          ))}
          <div>
            <label style={S.label}>Type</label>
            <select style={S.select} value={form.type} onChange={e => set("type", e.target.value)}>
              <option value="debit">Debit (expense)</option>
              <option value="credit">Credit (income)</option>
            </select>
          </div>
          <div>
            <label style={S.label}>Category</label>
            <select style={S.select} value={form.category} onChange={e => set("category", e.target.value)}>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
            <button style={S.btn} onClick={onClose}>Cancel</button>
            <button style={S.btnPrimary} onClick={() => { onSave({ ...form, amount: parseFloat(form.amount) || 0 }); onClose(); }}>Save</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── DASHBOARD PAGE ──────────────────────────────────────────────────────────
const Dashboard = ({ transactions, categories }) => {
  const now = new Date();
  const [selMonth, setSelMonth] = useState(now.getMonth());
  const [selYear] = useState(now.getFullYear());
  const monthTx = transactions.filter(t => { const d = new Date(t.date); return d.getMonth() === selMonth && d.getFullYear() === selYear; });
  const income = monthTx.filter(t => t.type === "credit").reduce((s, t) => s + t.amount, 0);
  const expense = monthTx.filter(t => t.type === "debit").reduce((s, t) => s + t.amount, 0);
  const balance = transactions.reduce((s, t) => t.type === "credit" ? s + t.amount : s - t.amount, 0);
  const recent = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
  const catById = Object.fromEntries(categories.map(c => [c.id, c]));

  const last6 = Array.from({ length: 6 }, (_, i) => {
    const m = (selMonth - i + 12) % 12;
    const y = selYear - (selMonth - i < 0 ? 1 : 0);
    const txs = transactions.filter(t => { const d = new Date(t.date); return d.getMonth() === m && d.getFullYear() === y; });
    return { label: MONTHS[m], income: txs.filter(t => t.type === "credit").reduce((s,t)=>s+t.amount,0), expense: txs.filter(t => t.type === "debit").reduce((s,t)=>s+t.amount,0) };
  }).reverse();

  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h1 style={S.pageTitle}>Dashboard</h1>
          <p style={S.pageSub}>Financial overview</p>
        </div>
        <select style={{ ...S.select, width: "auto" }} value={selMonth} onChange={e => setSelMonth(Number(e.target.value))}>
          {MONTHS.map((m, i) => <option key={i} value={i}>{m} {selYear}</option>)}
        </select>
      </div>
      <div style={{ ...S.grid4, marginBottom: 20 }}>
        {[
          { label: "Total Balance", value: fmtShort(balance), sub: "all time", color: balance >= 0 ? "#4ade80" : "#f87171" },
          { label: "Monthly Income", value: fmtShort(income), sub: MONTHS[selMonth], color: "#4ade80" },
          { label: "Monthly Expense", value: fmtShort(expense), sub: MONTHS[selMonth], color: "#f87171" },
          { label: "Net", value: fmtShort(income - expense), sub: "income − expense", color: (income - expense) >= 0 ? "#4ade80" : "#f87171" },
        ].map(m => (
          <div key={m.label} style={S.metricCard}>
            <div style={S.metricLabel}>{m.label}</div>
            <div style={{ ...S.metricValue, color: m.color }}>{m.value}</div>
            <div style={S.metricSub}>{m.sub}</div>
          </div>
        ))}
      </div>
      <div style={{ ...S.grid2, marginBottom: 20 }}>
        <div style={S.card}>
          <div style={{ fontSize: 11, color: "#555", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 16 }}>6-Month Overview</div>
          <BarChart data={last6} height={140} />
          <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
            {[["#4ade80","Income"],["#f87171","Expense"]].map(([c,l]) => <div key={l} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#555" }}><div style={{ width: 8, height: 8, borderRadius: 2, background: c }} />{l}</div>)}
          </div>
        </div>
        <div style={S.card}>
          <div style={{ fontSize: 11, color: "#555", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 12 }}>Recent Transactions</div>
          {recent.length === 0 ? <div style={{ color: "#555", fontSize: 12, padding: "20px 0" }}>No transactions yet</div> : recent.map(t => (
            <div key={t.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #1a1a1a" }}>
              <div>
                <div style={{ fontSize: 12, color: "#b8b4ac", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.description}</div>
                <div style={{ fontSize: 10, color: "#444", marginTop: 2 }}>{fmtDate(t.date)} · {catById[t.category]?.name || "Etc"}</div>
              </div>
              <div style={{ fontSize: 13, color: t.type === "credit" ? "#4ade80" : "#f87171", flexShrink: 0 }}>{t.type === "credit" ? "+" : "-"}{fmtShort(t.amount)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── TRANSACTIONS PAGE ────────────────────────────────────────────────────────
const Transactions = ({ transactions, categories, addTransaction, updateTransaction, deleteTransaction }) => {
  const [filterMonth, setFilterMonth] = useState("");
  const [filterCat, setFilterCat] = useState("");
  const [filterType, setFilterType] = useState("");
  const [modal, setModal] = useState(null);
  const catById = Object.fromEntries(categories.map(c => [c.id, c]));

  const filtered = useMemo(() => {
    return [...transactions].filter(t => {
      if (filterMonth && !t.date.startsWith(filterMonth)) return false;
      if (filterCat && t.category !== filterCat) return false;
      if (filterType && t.type !== filterType) return false;
      return true;
    }).sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [transactions, filterMonth, filterCat, filterType]);

  const monthOptions = useMemo(() => {
    const months = new Set(transactions.map(t => t.date.slice(0, 7)));
    return [...months].sort().reverse();
  }, [transactions]);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 style={S.pageTitle}>Transactions</h1>
          <p style={S.pageSub}>{filtered.length} records</p>
        </div>
        <button style={S.btnPrimary} onClick={() => setModal({ mode: "new" })}>+ New</button>
      </div>
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <select style={{ ...S.select, width: "auto" }} value={filterMonth} onChange={e => setFilterMonth(e.target.value)}>
          <option value="">All months</option>
          {monthOptions.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <select style={{ ...S.select, width: "auto" }} value={filterCat} onChange={e => setFilterCat(e.target.value)}>
          <option value="">All categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select style={{ ...S.select, width: "auto" }} value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="">All types</option>
          <option value="debit">Debit</option>
          <option value="credit">Credit</option>
        </select>
      </div>
      <div style={S.card}>
        <table style={S.table}>
          <thead>
            <tr>{["Date","Description","Category","Type","Amount",""].map(h => <th key={h} style={S.th}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} style={{ ...S.td, textAlign: "center", color: "#555", padding: 32 }}>No transactions found</td></tr>
            ) : filtered.map(t => (
              <tr key={t.id}>
                <td style={S.td}>{fmtDate(t.date)}</td>
                <td style={{ ...S.td, maxWidth: 240 }}><div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.description}</div></td>
                <td style={S.td}>{catById[t.category]?.name || "Etc"}</td>
                <td style={S.td}><span style={S.badge(t.type)}>{t.type.toUpperCase()}</span></td>
                <td style={{ ...S.td, color: t.type === "credit" ? "#4ade80" : "#f87171" }}>{t.type === "credit" ? "+" : "-"}{fmt(t.amount)}</td>
                <td style={{ ...S.td, whiteSpace: "nowrap" }}>
                  <button style={{ ...S.btn, padding: "4px 10px", marginRight: 4 }} onClick={() => setModal({ mode: "edit", tx: t })}>edit</button>
                  <button style={{ ...S.btn, padding: "4px 10px", color: "#f87171", borderColor: "#3a1a1a" }} onClick={() => deleteTransaction(t.id)}>del</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modal && (
        <TransactionModal
          tx={modal.mode === "edit" ? modal.tx : null}
          categories={categories}
          onSave={data => modal.mode === "edit" ? updateTransaction(modal.tx.id, data) : addTransaction(data)}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
};

// ─── IMPORT PAGE ──────────────────────────────────────────────────────────────
const Import = ({ categories, addTransaction }) => {
  const [preview, setPreview] = useState(null);
  const [importing, setImporting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [xlsxReady, setXlsxReady] = useState(!!window.XLSX);
  const [debugLog, setDebugLog] = useState([]);

  useEffect(() => {
    if (window.XLSX) { setXlsxReady(true); return; }
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js";
    script.onload = () => setXlsxReady(true);
    script.onerror = () => setError("Failed to load XLSX library. Check your connection.");
    document.head.appendChild(script);
  }, []);

  const log = (...args) => setDebugLog(prev => [...prev, args.map(a => typeof a === "object" ? JSON.stringify(a) : String(a)).join(" ")]);

  const handleFile = async (file) => {
    if (!file) return;
    setError(""); setDone(false); setPreview(null); setDebugLog([]);
    const ext = file.name.split(".").pop().toLowerCase();
    log("File:", file.name, "ext:", ext, "size:", file.size);
    try {
      let txs = [];
      if (ext === "xlsx" || ext === "xls") {
        log("Mode: XLSX. window.XLSX:", !!window.XLSX, "xlsxReady:", xlsxReady);
        if (!window.XLSX) {
          setError("XLSX library not loaded yet — please wait a second and try again.");
          return;
        }
        txs = await parseBCAXLSX(file, categories, log);
      } else {
        log("Mode: CSV");
        const text = await file.text();
        log("CSV first 200 chars:", text.slice(0, 200));
        txs = parseBCACSV(text, categories);
      }
      log("Parsed transactions:", txs.length);
      if (txs.length === 0) { setError("No valid transactions found. Check the file format."); return; }
      setPreview(txs);
    } catch (err) {
      log("ERROR:", err.message, err.stack);
      setError("Failed to parse file: " + err.message);
    }
  };

  const doImport = () => {
    setImporting(true);
    preview.forEach(t => addTransaction(t));
    setTimeout(() => { setImporting(false); setDone(true); setPreview(null); }, 500);
  };

  const catById = Object.fromEntries(categories.map(c => [c.id, c]));

  return (
    <div>
      <h1 style={S.pageTitle}>Import</h1>
      <p style={S.pageSub}>Upload BCA CSV bank statement</p>

      <div style={{ ...S.card, marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: "#555", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 12 }}>Expected XLSX Format (BCA)</div>
        <div style={{ fontFamily: FONT, fontSize: 11, color: "#555", background: "#0a0a0a", padding: 12, borderRadius: 6, lineHeight: 1.8 }}>
          Columns: no_rek · nama_rek · mata_uang · periode · <span style={{ color: "#c9a96e" }}>tanggal</span> · <span style={{ color: "#c9a96e" }}>keterangan</span> · cbg · <span style={{ color: "#c9a96e" }}>jumlah</span> · <span style={{ color: "#c9a96e" }}>DBCR</span> · saldo<br />
          Date: <span style={{ color: "#b8b4ac" }}>DD/MM/YYYY</span> &nbsp;·&nbsp; Amount: <span style={{ color: "#b8b4ac" }}>"33,000.00"</span> &nbsp;·&nbsp; Type: <span style={{ color: "#4ade80" }}>CR</span> / <span style={{ color: "#f87171" }}>DB</span>
        </div>
      </div>

      <div
        style={{ ...S.card, marginBottom: 16, border: dragOver ? "1px solid #c9a96e" : "1px dashed #2a2a2a", textAlign: "center", padding: 40, cursor: "pointer", transition: "border 0.2s" }}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
        onClick={() => document.getElementById("csv-input").click()}
      >
        <input id="csv-input" type="file" accept=".xlsx,.xls,.csv" style={{ display: "none" }} onChange={e => handleFile(e.target.files[0])} />
        <div style={{ fontSize: 32, marginBottom: 12 }}>📂</div>
        <div style={{ color: "#666", fontSize: 13 }}>Drop XLSX / CSV file here or click to browse</div>
      </div>

      <div style={{ marginBottom: 12, fontSize: 11, color: xlsxReady ? "#4ade80" : "#f59e0b" }}>
        {xlsxReady ? "● XLSX library ready" : "○ Loading XLSX library..."}
      </div>

      {error && <div style={{ background: "#2a0f0f", border: "1px solid #3a1a1a", borderRadius: 8, padding: "10px 14px", color: "#f87171", fontSize: 12, marginBottom: 16 }}>{error}</div>}

      {debugLog.length > 0 && (
        <div style={{ background: "#0a0a0a", border: "1px solid #2a2a2a", borderRadius: 8, padding: 12, marginBottom: 16, fontFamily: "monospace", fontSize: 10, color: "#666", maxHeight: 200, overflow: "auto" }}>
          <div style={{ color: "#555", marginBottom: 6, letterSpacing: 1 }}>DEBUG LOG</div>
          {debugLog.map((line, i) => <div key={i} style={{ marginBottom: 2, wordBreak: "break-all" }}>{line}</div>)}
        </div>
      )}
      {done && <div style={{ background: "#0f2a1a", border: "1px solid #1a3a2a", borderRadius: 8, padding: "10px 14px", color: "#4ade80", fontSize: 12, marginBottom: 16 }}>Import successful!</div>}

      {preview && (
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ fontSize: 12, color: "#b8b4ac" }}>{preview.length} transactions found</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={S.btn} onClick={() => setPreview(null)}>Cancel</button>
              <button style={S.btnPrimary} onClick={doImport} disabled={importing}>{importing ? "Importing..." : `Import ${preview.length} transactions`}</button>
            </div>
          </div>
          <div style={{ ...S.card, maxHeight: 400, overflow: "auto" }}>
            <table style={S.table}>
              <thead><tr>{["Date","Description","Category","Type","Amount"].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
              <tbody>
                {preview.slice(0, 50).map((t, i) => (
                  <tr key={i}>
                    <td style={S.td}>{t.date}</td>
                    <td style={{ ...S.td, maxWidth: 200 }}><div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.description}</div></td>
                    <td style={S.td}>{catById[t.category]?.name || "Etc"}</td>
                    <td style={S.td}><span style={S.badge(t.type)}>{t.type.toUpperCase()}</span></td>
                    <td style={{ ...S.td, color: t.type === "credit" ? "#4ade80" : "#f87171" }}>{t.type === "credit" ? "+" : "-"}{fmt(t.amount)}</td>
                  </tr>
                ))}
                {preview.length > 50 && <tr><td colSpan={5} style={{ ...S.td, color: "#555", textAlign: "center" }}>+{preview.length - 50} more</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── REPORTS PAGE ─────────────────────────────────────────────────────────────
const Reports = ({ transactions, categories }) => {
  const now = new Date();
  const [selMonth, setSelMonth] = useState(now.getMonth());
  const [selYear, setSelYear] = useState(now.getFullYear());
  const catById = Object.fromEntries(categories.map(c => [c.id, c]));

  const monthTx = transactions.filter(t => { const d = new Date(t.date); return d.getMonth() === selMonth && d.getFullYear() === selYear; });
  const expenses = monthTx.filter(t => t.type === "debit");
  const totalExp = expenses.reduce((s, t) => s + t.amount, 0);

  const catBreakdown = useMemo(() => {
    const map = {};
    expenses.forEach(t => { map[t.category] = (map[t.category] || 0) + t.amount; });
    return Object.entries(map).map(([id, value]) => ({ id, label: catById[id]?.name || "Etc", value })).sort((a, b) => b.value - a.value);
  }, [expenses]);

  const years = useMemo(() => {
    const ys = new Set(transactions.map(t => new Date(t.date).getFullYear()));
    return [...ys].sort().reverse();
  }, [transactions]);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div><h1 style={S.pageTitle}>Reports</h1><p style={S.pageSub}>Monthly spending analysis</p></div>
        <div style={{ display: "flex", gap: 8 }}>
          <select style={{ ...S.select, width: "auto" }} value={selMonth} onChange={e => setSelMonth(Number(e.target.value))}>
            {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select>
          <select style={{ ...S.select, width: "auto" }} value={selYear} onChange={e => setSelYear(Number(e.target.value))}>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>
      <div style={S.grid2}>
        <div style={S.card}>
          <div style={{ fontSize: 11, color: "#555", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 16 }}>Expense Breakdown</div>
          {catBreakdown.length === 0 ? <div style={{ color: "#555", fontSize: 12, textAlign: "center", padding: 40 }}>No expense data</div> : (
            <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
              <PieChart data={catBreakdown} size={160} />
              <div style={{ flex: 1 }}>
                {catBreakdown.map((c, i) => (
                  <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: CHART_COLORS[i % CHART_COLORS.length], flexShrink: 0 }} />
                    <div style={{ flex: 1, fontSize: 11, color: "#b8b4ac", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.label}</div>
                    <div style={{ fontSize: 11, color: "#555" }}>{totalExp > 0 ? Math.round(c.value/totalExp*100) : 0}%</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div style={S.card}>
          <div style={{ fontSize: 11, color: "#555", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 12 }}>Category Detail</div>
          {catBreakdown.length === 0 ? <div style={{ color: "#555", fontSize: 12, textAlign: "center", padding: 40 }}>No data</div> : catBreakdown.map((c, i) => (
            <div key={c.id} style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: "#b8b4ac", marginBottom: 4 }}>{c.label}</div>
                <div style={{ height: 4, background: "#1e1e1e", borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ height: "100%", background: CHART_COLORS[i % CHART_COLORS.length], width: `${totalExp > 0 ? (c.value/totalExp)*100 : 0}%`, borderRadius: 2 }} />
                </div>
              </div>
              <div style={{ marginLeft: 12, textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontSize: 12, color: "#e8e4dc" }}>{fmtShort(c.value)}</div>
                <div style={{ fontSize: 10, color: "#555" }}>{totalExp > 0 ? Math.round(c.value/totalExp*100) : 0}%</div>
              </div>
            </div>
          ))}
          {catBreakdown.length > 0 && (
            <div style={{ borderTop: "1px solid #2a2a2a", paddingTop: 12, marginTop: 4, display: "flex", justifyContent: "space-between", fontSize: 12 }}>
              <span style={{ color: "#555" }}>Total</span>
              <span style={{ color: "#f87171" }}>{fmt(totalExp)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── SETTINGS PAGE ────────────────────────────────────────────────────────────
const Settings = ({ transactions, categories, addCategory, deleteCategory, importTransactions, importCategories }) => {
  const [catForm, setCatForm] = useState({ name: "", keywords: "", type: "expense" });
  const [tab, setTab] = useState("categories");

  const exportData = () => {
    const data = JSON.stringify({ transactions, categories, exportedAt: new Date().toISOString() }, null, 2);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([data], { type: "application/json" }));
    a.download = `bca-backup-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
  };

  const handleImport = (file) => {
    const r = new FileReader();
    r.onload = e => {
      try {
        const d = JSON.parse(e.target.result);
        if (d.transactions) importTransactions(d.transactions);
        if (d.categories) importCategories(d.categories);
        alert("Data restored successfully!");
      } catch { alert("Invalid backup file."); }
    };
    r.readAsText(file);
  };

  const customCategories = categories.filter(c => !c.isDefault);

  return (
    <div>
      <h1 style={S.pageTitle}>Settings</h1>
      <p style={S.pageSub}>Manage categories and data backup</p>

      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {[["categories","Categories"],["backup","Backup & Restore"]].map(([k, l]) => (
          <button key={k} style={{ ...S.btn, ...(tab === k ? { borderColor: "#c9a96e", color: "#c9a96e" } : {}) }} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      {tab === "categories" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={S.card}>
            <div style={{ fontSize: 11, color: "#555", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 16 }}>Add Custom Category</div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 140 }}>
                <label style={S.label}>Name</label>
                <input style={S.input} value={catForm.name} onChange={e => setCatForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Groceries" />
              </div>
              <div style={{ flex: 2, minWidth: 200 }}>
                <label style={S.label}>Keywords (comma separated)</label>
                <input style={S.input} value={catForm.keywords} onChange={e => setCatForm(f => ({ ...f, keywords: e.target.value }))} placeholder="e.g. superindo,giant,hero" />
              </div>
              <div style={{ flex: 1, minWidth: 120 }}>
                <label style={S.label}>Type</label>
                <select style={S.select} value={catForm.type} onChange={e => setCatForm(f => ({ ...f, type: e.target.value }))}>
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                  <option value="both">Both</option>
                </select>
              </div>
              <div style={{ display: "flex", alignItems: "flex-end" }}>
                <button style={S.btnPrimary} onClick={() => {
                  if (!catForm.name.trim()) return;
                  addCategory({ name: catForm.name.trim(), keywords: catForm.keywords.split(",").map(k => k.trim()).filter(Boolean), type: catForm.type });
                  setCatForm({ name: "", keywords: "", type: "expense" });
                }}>Add</button>
              </div>
            </div>
          </div>
          <div style={S.card}>
            <div style={{ fontSize: 11, color: "#555", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 12 }}>Default Categories</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
              {categories.filter(c => c.isDefault).map(c => (
                <div key={c.id} style={{ padding: "4px 10px", borderRadius: 6, background: "#1e1e1e", border: "1px solid #2a2a2a", fontSize: 11, color: "#666" }}>{c.name}</div>
              ))}
            </div>
            {customCategories.length > 0 && <>
              <div style={{ fontSize: 11, color: "#555", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 12, marginTop: 16 }}>Custom Categories</div>
              {customCategories.map(c => (
                <div key={c.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #1a1a1a" }}>
                  <div>
                    <span style={{ fontSize: 12, color: "#b8b4ac" }}>{c.name}</span>
                    {c.keywords.length > 0 && <span style={{ fontSize: 10, color: "#444", marginLeft: 8 }}>{c.keywords.join(", ")}</span>}
                  </div>
                  <button style={{ ...S.btn, padding: "3px 8px", color: "#f87171", borderColor: "#3a1a1a" }} onClick={() => deleteCategory(c.id)}>delete</button>
                </div>
              ))}
            </>}
          </div>
        </div>
      )}

      {tab === "backup" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={S.card}>
            <div style={{ fontSize: 11, color: "#555", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 12 }}>Export Data</div>
            <p style={{ fontSize: 12, color: "#666", marginBottom: 16, lineHeight: 1.6 }}>Download all your transactions and categories as a JSON backup file.</p>
            <button style={S.btnPrimary} onClick={exportData}>Export to JSON</button>
          </div>
          <div style={S.card}>
            <div style={{ fontSize: 11, color: "#555", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 12 }}>Restore Data</div>
            <p style={{ fontSize: 12, color: "#666", marginBottom: 16, lineHeight: 1.6 }}>Import a previous JSON backup. This will overwrite current data.</p>
            <input type="file" accept=".json" style={{ display: "none" }} id="backup-input" onChange={e => handleImport(e.target.files[0])} />
            <button style={S.btn} onClick={() => document.getElementById("backup-input").click()}>Choose Backup File</button>
          </div>
          <div style={S.card}>
            <div style={{ fontSize: 11, color: "#555", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>Data Summary</div>
            <div style={{ fontSize: 12, color: "#666", lineHeight: 2 }}>
              <div>Transactions: <span style={{ color: "#b8b4ac" }}>{transactions.length}</span></div>
              <div>Categories: <span style={{ color: "#b8b4ac" }}>{categories.length}</span></div>
              <div>Storage: <span style={{ color: "#b8b4ac" }}>IndexedDB (localStorage)</span></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── NAV ICONS ────────────────────────────────────────────────────────────────
const ICON = {
  dashboard: "◈", transactions: "≡", import: "↑", reports: "◔", settings: "⚙"
};

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("dashboard");
  const storage = useStorage();

  const NAV = [
    { id: "dashboard", label: "Dashboard" },
    { id: "transactions", label: "Transactions" },
    { id: "import", label: "Import CSV" },
    { id: "reports", label: "Reports" },
    { id: "settings", label: "Settings" },
  ];

  const renderPage = () => {
    switch (page) {
      case "dashboard": return <Dashboard transactions={storage.transactions} categories={storage.categories} />;
      case "transactions": return <Transactions transactions={storage.transactions} categories={storage.categories} addTransaction={storage.addTransaction} updateTransaction={storage.updateTransaction} deleteTransaction={storage.deleteTransaction} />;
      case "import": return <Import categories={storage.categories} addTransaction={storage.addTransaction} />;
      case "reports": return <Reports transactions={storage.transactions} categories={storage.categories} />;
      case "settings": return <Settings {...storage} />;
      default: return null;
    }
  };

  return (
    <div style={{ ...S.app, display: "flex" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=DM+Serif+Display&display=swap" rel="stylesheet" />
      <nav style={S.sidebar}>
        <div style={S.sidebarLogo}>
          Keuangan
          <span style={S.sidebarSub}>BCA Personal Finance</span>
        </div>
        {NAV.map(n => (
          <div key={n.id} style={S.navItem(page === n.id)} onClick={() => setPage(n.id)}>
            <span style={{ fontSize: 14, opacity: 0.7 }}>{ICON[n.id]}</span>
            {n.label}
          </div>
        ))}
        <div style={{ marginTop: "auto", padding: "0 20px" }}>
          <div style={{ fontSize: 10, color: "#333", lineHeight: 1.8 }}>
            {storage.transactions.length} txns<br />
            {storage.categories.length} categories
          </div>
        </div>
      </nav>
      <main style={S.main}>
        {renderPage()}
      </main>
    </div>
  );
}
