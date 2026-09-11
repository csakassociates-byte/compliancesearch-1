"use client";
import { useState, useEffect } from "react";

// Rounds to nearest integer on blur — 10542.61 → 10543, 10500.20 → 10500
function round(v: string): string {
  if (v.trim() === "") return "";
  const n = parseFloat(v);
  return isNaN(n) ? v : String(Math.round(n));
}

interface Props extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value" | "type"> {
  value: string;
  onChange: (v: string) => void;
}

export default function AmountInput({ value, onChange, style, ...rest }: Props) {
  const [local, setLocal] = useState(value);

  // Sync when parent updates externally (e.g. auto-fill, load from DB)
  useEffect(() => {
    setLocal(round(value));
  }, [value]);

  return (
    <input
      type="number"
      value={local}
      style={style}
      onChange={e => setLocal(e.target.value)}
      onBlur={() => {
        const r = round(local);
        setLocal(r);
        onChange(r);
      }}
      {...rest}
    />
  );
}
