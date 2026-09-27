/* Single reusable button factory — all buttons go through here. */

const VARIANT_CLASS = {
  ghost: "",
  primary: "btn--primary",
  danger: "btn--danger",
};

const SIZE_CLASS = {
  sm: "btn--sm",
  md: "",
  lg: "btn--lg",
};

export function createButton({
  label = "",
  variant = "ghost",
  size = "md",
  pressed = null,
  active = false,
  attrs = {},
  onClick = null,
} = {}) {
  const b = document.createElement("button");
  b.className = ["btn", VARIANT_CLASS[variant] ?? "", SIZE_CLASS[size] ?? ""]
    .filter(Boolean)
    .join(" ");
  b.textContent = label;
  if (pressed !== null) b.setAttribute("aria-pressed", String(pressed));
  if (active) b.classList.add("is-active");
  for (const [k, v] of Object.entries(attrs)) {
    if (v !== undefined && v !== null) b.setAttribute(k, v);
  }
  if (onClick) b.addEventListener("click", onClick);
  return b;
}

export function applyButtonStyles(el, { variant = "ghost", size = "md" } = {}) {
  el.classList.add("btn");
  if (VARIANT_CLASS[variant]) el.classList.add(VARIANT_CLASS[variant]);
  if (SIZE_CLASS[size]) el.classList.add(SIZE_CLASS[size]);
}
