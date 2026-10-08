export const DAY_KEYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const DAY_LABELS = { 
  Mon: "Monday", 
  Tue: "Tuesday", 
  Wed: "Wednesday", 
  Thu: "Thursday", 
  Fri: "Friday", 
  Sat: "Saturday", 
  Sun: "Sunday" 
};

export function pad(n) { 
  return String(n).padStart(2, "0"); 
}

export function toISODate(d) { 
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; 
}

export function addDays(d, n) { 
  const r = new Date(d); 
  r.setDate(r.getDate() + n); 
  return r; 
}

export function startOfDay(d) { 
  const r = new Date(d); 
  r.setHours(0, 0, 0, 0); 
  return r; 
}

export function startOfWeek(d) {
  const r = startOfDay(d);
  const dow = (r.getDay() + 6) % 7;
  return addDays(r, -dow);
}
