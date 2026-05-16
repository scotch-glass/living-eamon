"use client";

import { ALL_SIZE_CLASSES, SIZE_CLASSES, type SizeClass } from "@/lib/art/sizeClasses";

interface Props {
  value: SizeClass | undefined;
  onChange: (cls: SizeClass) => void;
}

export default function ClassPicker({ value, onChange }: Props): React.JSX.Element {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {ALL_SIZE_CLASSES.map((cls) => {
        const def = SIZE_CLASSES[cls];
        const selected = value === cls;
        return (
          <button
            key={cls}
            onClick={() => onChange(cls)}
            style={{
              padding: "6px 10px",
              background: selected ? "#2a4a8a" : "#222",
              color: "#eee",
              border: `1px solid ${selected ? "#4a7ad0" : "#333"}`,
              cursor: "pointer",
              fontSize: 12,
              textAlign: "left",
            }}
          >
            <div style={{ fontWeight: 600 }}>
              {cls} — {def.label}
            </div>
            <div style={{ color: "#888", fontSize: 10, marginTop: 2 }}>
              {def.examples.join(", ")} · Z={def.spriteZ}
            </div>
          </button>
        );
      })}
    </div>
  );
}
