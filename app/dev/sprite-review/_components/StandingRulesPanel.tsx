"use client";

import { useEffect, useState } from "react";
import type { PromptRule, StandingRulesFile } from "@/lib/art/promptRules";

export default function StandingRulesPanel(): React.JSX.Element {
  const [data, setData] = useState<StandingRulesFile | null>(null);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftBody, setDraftBody] = useState("");
  const [draftTitle, setDraftTitle] = useState("");
  const [status, setStatus] = useState("");

  const refetch = (): void => {
    fetch("/api/prompt-rules")
      .then((r) => r.json() as Promise<{ ok: boolean; file?: StandingRulesFile }>)
      .then((j) => setData(j.file ?? null))
      .catch(() => setData(null));
  };

  useEffect(() => {
    refetch();
  }, []);

  const startEdit = (rule: PromptRule): void => {
    setEditingId(rule.id);
    setDraftBody(rule.body);
    setDraftTitle(rule.title);
    setStatus("");
  };
  const cancelEdit = (): void => {
    setEditingId(null);
    setDraftBody("");
    setDraftTitle("");
  };
  const saveEdit = async (id: string): Promise<void> => {
    const resp = await fetch("/api/prompt-rules", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, title: draftTitle, body: draftBody }),
    });
    const j = (await resp.json()) as { ok: boolean; rule?: PromptRule; error?: string };
    if (j.ok) {
      setStatus(`saved: ${id}`);
      refetch();
      cancelEdit();
    } else {
      setStatus(`save failed: ${j.error ?? "unknown"}`);
    }
  };

  return (
    <div style={panelStyle}>
      <button onClick={() => setOpen((v) => !v)} style={headerStyle}>
        <span>Standing Prompt Rules</span>
        <span style={{ color: "#888" }}>{open ? "▼" : "▶"}</span>
      </button>
      {open && data && (
        <div style={bodyStyle}>
          <div style={{ color: "#888", fontSize: 11, marginBottom: 8 }}>
            snapshot: {data.snapshotId}
          </div>
          {status && (
            <div style={{ fontSize: 11, color: "#9c9", marginBottom: 6 }}>{status}</div>
          )}
          {data.rules.map((rule) => {
            const editing = editingId === rule.id;
            return (
              <div key={rule.id} style={ruleStyle}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {rule.locked && (
                    <span title="locked" style={{ color: "#fbbf24" }}>
                      🔒
                    </span>
                  )}
                  {editing ? (
                    <input
                      value={draftTitle}
                      onChange={(e) => setDraftTitle(e.target.value)}
                      style={{
                        flex: 1,
                        padding: 4,
                        background: "#222",
                        color: "#eee",
                        border: "1px solid #444",
                        fontSize: 12,
                      }}
                    />
                  ) : (
                    <strong style={{ color: "#eee", flex: 1 }}>{rule.title}</strong>
                  )}
                  {!rule.locked && !editing && (
                    <button
                      onClick={() => startEdit(rule)}
                      style={{
                        padding: "2px 6px",
                        background: "#333",
                        color: "#eee",
                        border: "1px solid #555",
                        cursor: "pointer",
                        fontSize: 10,
                      }}
                    >
                      Edit
                    </button>
                  )}
                </div>
                {editing ? (
                  <div style={{ marginTop: 6 }}>
                    <textarea
                      value={draftBody}
                      onChange={(e) => setDraftBody(e.target.value)}
                      rows={4}
                      style={{
                        width: "100%",
                        padding: 6,
                        background: "#222",
                        color: "#eee",
                        border: "1px solid #444",
                        fontSize: 11,
                        boxSizing: "border-box",
                      }}
                    />
                    <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                      <button
                        onClick={() => void saveEdit(rule.id)}
                        style={{ ...btnSmall, background: "#1f9d55" }}
                      >
                        Save
                      </button>
                      <button onClick={cancelEdit} style={btnSmall}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ color: "#ccc", fontSize: 12, marginTop: 4, lineHeight: 1.4 }}>
                    {rule.body}
                  </div>
                )}
                {rule.linkRef && (
                  <div style={{ color: "#888", fontSize: 10, marginTop: 4 }}>
                    source: {rule.linkRef}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const panelStyle: React.CSSProperties = {
  background: "#1a1a1a",
  border: "1px solid #333",
  marginTop: 8,
};

const headerStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  background: "#222",
  color: "#eee",
  border: "none",
  cursor: "pointer",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  fontSize: 13,
};

const bodyStyle: React.CSSProperties = {
  padding: 10,
  maxHeight: 360,
  overflowY: "auto",
};

const ruleStyle: React.CSSProperties = {
  padding: 8,
  borderBottom: "1px solid #2a2a2a",
};

const btnSmall: React.CSSProperties = {
  padding: "3px 8px",
  background: "#333",
  color: "#eee",
  border: "1px solid #555",
  cursor: "pointer",
  fontSize: 11,
};
