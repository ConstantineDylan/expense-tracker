export const fmt = (n) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);

export const fmtShort = (n) => {
  if (Math.abs(n) >= 1e9) return `Rp${(n / 1e9).toFixed(1)}M`;
  if (Math.abs(n) >= 1e6) return `Rp${(n / 1e6).toFixed(1)}jt`;
  if (Math.abs(n) >= 1e3) return `Rp${(n / 1e3).toFixed(0)}rb`;
  return `Rp${n}`;
};

export const fmtDate = (d) => new Date(d).toLocaleDateString("id-ID", { day:"2-digit", month:"short", year:"numeric" });

export const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
