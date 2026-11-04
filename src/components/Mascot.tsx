/**
 * Norm, the Normen AI mascot. Use sparingly: onboarding, empty states,
 * Fit Check results and checkpoint moments only. Never inside working views.
 */
export type Mood = "wave" | "think" | "cheer" | "alert";

const C = {
  body: "#D67B37",
  visor: "#2A2925",
  eye: "#A9BCC4",
  mouth: "#2A1606",
  tan: "#C2AE94",
};

export default function Mascot({
  mood = "wave",
  size = 56,
  label,
}: {
  mood?: Mood;
  size?: number;
  /** Pass a label when Norm carries meaning; otherwise it is decorative. */
  label?: string;
}) {
  const bulb = mood === "think" ? "#6E8590" : mood === "alert" ? "#E9A56E" : C.body;
  const a11y = label ? { role: "img", "aria-label": label } : { "aria-hidden": true };

  return (
    <svg width={size} height={size} viewBox="0 0 80 80" {...a11y}>
      <line x1="40" y1="9" x2="40" y2="19" stroke={C.tan} strokeWidth="3" />
      <circle cx="40" cy="8" r="5" fill={bulb} />
      <rect x="14" y="18" width="52" height="46" rx="18" fill={C.body} />
      <rect x="22" y="29" width="36" height="20" rx="10" fill={C.visor} />

      {mood === "wave" && (
        <>
          <circle cx="33" cy="39" r="4" fill={C.eye} />
          <path d="M43 39 Q47 35 51 39" stroke={C.eye} strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M33 55 Q40 60 47 55" stroke={C.mouth} strokeWidth="3" fill="none" strokeLinecap="round" />
        </>
      )}
      {mood === "think" && (
        <>
          <circle cx="35" cy="36" r="4" fill={C.eye} />
          <circle cx="49" cy="36" r="4" fill={C.eye} />
          <line x1="35" y1="56" x2="45" y2="56" stroke={C.mouth} strokeWidth="3" strokeLinecap="round" />
        </>
      )}
      {mood === "cheer" && (
        <>
          <path d="M29 41 Q33 35 37 41" stroke={C.eye} strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M43 41 Q47 35 51 41" stroke={C.eye} strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M31 53 Q40 63 49 53" stroke={C.mouth} strokeWidth="3" fill="none" strokeLinecap="round" />
        </>
      )}
      {mood === "alert" && (
        <>
          <circle cx="33" cy="39" r="5" fill={C.eye} />
          <circle cx="47" cy="39" r="5" fill={C.eye} />
          <circle cx="40" cy="56" r="3.5" fill={C.mouth} />
        </>
      )}

      <rect x="24" y="64" width="10" height="6" rx="3" fill={C.tan} />
      <rect x="46" y="64" width="10" height="6" rx="3" fill={C.tan} />
    </svg>
  );
}
