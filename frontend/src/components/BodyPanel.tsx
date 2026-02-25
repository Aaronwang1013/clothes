"use client";

import { useCallback } from "react";

export interface BodyState {
  gender: "male" | "female" | "neutral";
  height: number;
  weight: number;
  shoulder: number;
  chest: number;
  waist: number;
  hip: number;
  skinColor: string;
  hairColor: string;
}

const GENDER_PRESETS: Record<string, Partial<BodyState>> = {
  male: { shoulder: 44, chest: 96, waist: 82, hip: 92 },
  female: { shoulder: 38, chest: 86, waist: 66, hip: 98 },
  neutral: { shoulder: 40, chest: 88, waist: 74, hip: 94 },
};

const SKIN_COLORS = ["#FDDBB4", "#E8B88A", "#C68642", "#8D5524", "#4A2912"];
const HAIR_COLORS = ["#1C1008", "#6B3A2A", "#C6A26A", "#E8E8E8", "#2E5B8A"];

interface BodyPanelProps {
  bodyState: BodyState;
  onChange: (state: BodyState) => void;
}

interface SliderConfig {
  key: keyof BodyState;
  label: string;
  min: number;
  max: number;
  unit: string;
}

const MAIN_SLIDERS: SliderConfig[] = [
  { key: "height", label: "身高", min: 150, max: 200, unit: "cm" },
  { key: "weight", label: "體重", min: 40, max: 120, unit: "kg" },
];

const TORSO_SLIDERS: SliderConfig[] = [
  { key: "shoulder", label: "肩寬", min: 30, max: 60, unit: "cm" },
  { key: "chest", label: "胸圍", min: 60, max: 130, unit: "cm" },
  { key: "waist", label: "腰圍", min: 50, max: 120, unit: "cm" },
  { key: "hip", label: "臀圍", min: 60, max: 140, unit: "cm" },
];

export default function BodyPanel({ bodyState, onChange }: BodyPanelProps) {
  const update = useCallback(
    (patch: Partial<BodyState>) => onChange({ ...bodyState, ...patch }),
    [bodyState, onChange]
  );

  function setGender(gender: BodyState["gender"]) {
    update({ gender, ...GENDER_PRESETS[gender] });
  }

  function renderSlider(cfg: SliderConfig) {
    const value = bodyState[cfg.key] as number;
    return (
      <div key={cfg.key} className="flex flex-col gap-1">
        <div className="flex justify-between text-[0.78rem] text-charcoal">
          <span>{cfg.label}</span>
          <span className="text-forma-accent-dark font-medium">
            {value} {cfg.unit}
          </span>
        </div>
        <input
          type="range"
          min={cfg.min}
          max={cfg.max}
          value={value}
          onChange={(e) => update({ [cfg.key]: parseFloat(e.target.value) })}
        />
      </div>
    );
  }

  function renderSwatchRow(
    colors: string[],
    activeColor: string,
    onSelect: (color: string) => void
  ) {
    return (
      <div className="flex gap-2 flex-wrap">
        {colors.map((color) => (
          <button
            key={color}
            className={`w-[26px] h-[26px] rounded-full cursor-pointer border-2 transition-all hover:scale-[1.15] ${
              activeColor === color
                ? "border-forma-accent-dark scale-[1.15]"
                : "border-transparent"
            }`}
            style={{ background: color }}
            onClick={() => onSelect(color)}
          />
        ))}
      </div>
    );
  }

  return (
    <aside className="bg-warm-white border-r border-[var(--forma-border)] overflow-y-auto p-7 flex flex-col gap-5">
      <div className="font-serif text-[1.1rem] font-normal text-charcoal tracking-[0.05em] pb-3 border-b border-[var(--forma-border)]">
        身材比例
      </div>

      {/* Gender toggle */}
      <div>
        <div className="text-[0.7rem] tracking-[0.1em] uppercase text-taupe mb-2">
          性別
        </div>
        <div className="flex">
          {(["male", "female", "neutral"] as const).map((g, i) => (
            <button
              key={g}
              onClick={() => setGender(g)}
              className={`flex-1 py-[7px] text-[0.72rem] tracking-[0.08em] uppercase cursor-pointer border border-[var(--forma-border)] transition-all ${
                i === 0 ? "rounded-l-sm" : ""
              } ${i === 2 ? "rounded-r-sm" : ""} ${
                i > 0 ? "border-l-0" : ""
              } ${
                bodyState.gender === g
                  ? "bg-charcoal text-cream border-charcoal"
                  : "bg-transparent text-taupe"
              }`}
            >
              {g === "male" ? "男性" : g === "female" ? "女性" : "中性"}
            </button>
          ))}
        </div>
      </div>

      {/* Height & Weight */}
      {MAIN_SLIDERS.map(renderSlider)}

      <div className="h-px bg-[var(--forma-border)]" />
      <div className="text-[0.7rem] tracking-[0.1em] uppercase text-taupe">
        軀幹
      </div>

      {/* Torso sliders */}
      {TORSO_SLIDERS.map(renderSlider)}

      <div className="h-px bg-[var(--forma-border)]" />

      {/* Skin color */}
      <div>
        <div className="text-[0.7rem] tracking-[0.1em] uppercase text-taupe mb-2">
          膚色
        </div>
        {renderSwatchRow(SKIN_COLORS, bodyState.skinColor, (c) =>
          update({ skinColor: c })
        )}
      </div>

      {/* Hair color */}
      <div>
        <div className="text-[0.7rem] tracking-[0.1em] uppercase text-taupe mb-2">
          髮色
        </div>
        {renderSwatchRow(HAIR_COLORS, bodyState.hairColor, (c) =>
          update({ hairColor: c })
        )}
      </div>
    </aside>
  );
}
