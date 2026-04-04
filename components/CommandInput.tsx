"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import type { WorldState } from "../lib/gameState";
import {
  getCommandAutocompleteSuggestions,
  type AutocompleteItem,
} from "../lib/gameEngine";

export type CommandInputHandle = {
  focus: () => void;
};

type Props = {
  worldState: WorldState | null;
  value: string;
  onChange: (v: string) => void;
  /** Pass `command` when submitting a specific string (e.g. autocomplete) so it is not lost to batched state. */
  onSubmit: (command?: string) => void;
  disabled?: boolean;
  placeholder?: string;
};

function inputTextColor(raw: string): string {
  const t = raw.trimStart();
  if (/^say\b/i.test(t)) return "#fbbf24";
  if (/^tell\b/i.test(t)) return "#fbbf24";
  if (/^invoke\b/i.test(t)) return "#dc2626";
  if (/^pray\b/i.test(t)) return "#93c5fd";
  if (/^cast\b/i.test(t)) return "#a855f7";
  if (/^attack\b/i.test(t)) return "#f97316";
  return "#d1d5db";
}

const CommandInput = forwardRef<CommandInputHandle, Props>(function CommandInput(
  { worldState, value, onChange, onSubmit, disabled, placeholder },
  ref
) {
  const innerRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);

  useImperativeHandle(ref, () => ({
    focus: () => innerRef.current?.focus(),
  }));

  const suggestions = useMemo(
    () => getCommandAutocompleteSuggestions(worldState, value),
    [worldState, value]
  );

  useEffect(() => {
    if (highlight >= suggestions.length) setHighlight(0);
  }, [suggestions.length, highlight]);

  useEffect(() => {
    if (!open || suggestions.length === 0) return;
    const el = listRef.current?.querySelector(`[data-idx="${highlight}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [highlight, open, suggestions.length]);

  const showList = open && suggestions.length > 0 && !disabled;

  const pick = useCallback(
    (item: AutocompleteItem) => {
      onChange(item.insertText);
      setOpen(false);
      setHighlight(0);
      if (item.autoSubmit) {
        onSubmit(item.insertText.trim());
      } else {
        requestAnimationFrame(() => innerRef.current?.focus());
      }
    },
    [onChange, onSubmit]
  );

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      if (showList) {
        e.preventDefault();
        setOpen(false);
      }
      return;
    }

    if (showList) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlight(i => (i + 1) % suggestions.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlight(i => (i - 1 + suggestions.length) % suggestions.length);
        return;
      }
      if (e.key === "Tab") {
        e.preventDefault();
        pick(suggestions[highlight]!);
        return;
      }
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        pick(suggestions[highlight]!);
        return;
      }
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      setOpen(false);
      onSubmit();
    }
  };

  const textColor = inputTextColor(value);

  return (
    <div style={{ position: "relative", flex: 1 }}>
      <input
        ref={innerRef}
        type="text"
        value={value}
        onChange={e => {
          onChange(e.target.value);
          setOpen(true);
          setHighlight(0);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          window.setTimeout(() => setOpen(false), 120);
        }}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
        spellCheck={false}
        style={{
          width: "100%",
          boxSizing: "border-box",
          backgroundColor: "#111827",
          border: "1px solid #374151",
          color: textColor,
          padding: "12px 16px",
          borderRadius: 6,
          outline: "none",
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
          fontSize: 15,
          opacity: disabled ? 0.5 : 1,
        }}
      />
      {showList && (
        <div
          ref={listRef}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: "100%",
            marginBottom: 4,
            maxHeight: 6 * 36,
            overflowY: "auto",
            backgroundColor: "#0f172a",
            border: "1px solid #334155",
            borderRadius: 6,
            zIndex: 50,
            boxShadow: "0 -12px 24px rgba(0,0,0,0.45)",
          }}
        >
          {suggestions.map((item, idx) => {
            const bg = idx === highlight ? "#1e293b" : "transparent";
            let col = "#e2e8f0";
            if (item.tone === "hostile") col = "#f87171";
            else if (item.tone === "friendly") col = "#4ade80";
            else if (item.tone === "neutral") col = "#f8fafc";
            return (
              <button
                key={`${item.label}-${idx}`}
                type="button"
                data-idx={idx}
                onMouseDown={ev => ev.preventDefault()}
                onClick={() => pick(item)}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: "8px 12px",
                  border: "none",
                  background: bg,
                  color: col,
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
});

export default CommandInput;
