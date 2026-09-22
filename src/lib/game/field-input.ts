export type Actions = {
  moveX: number;
  moveY: number;
  hack: boolean;
  sprint: boolean;
};

const GAME_CODES = new Set([
  "KeyW",
  "KeyA",
  "KeyS",
  "KeyD",
  "ArrowUp",
  "ArrowLeft",
  "ArrowDown",
  "ArrowRight",
  "Space",
  "ShiftLeft",
  "ShiftRight",
]);

const keys = new Set<string>();
let qaKeys: Set<string> | null = null;
let stickX = 0;
let stickY = 0;
let hackHeld = false;

function radial(x: number, y: number, dz = 0.15): { x: number; y: number } {
  const m = Math.hypot(x, y);
  if (m < dz) return { x: 0, y: 0 };
  const scale = (m - dz) / (1 - dz) / m;
  return { x: x * scale, y: y * scale };
}

export function attachInput(target: HTMLElement): () => void {
  const down = (e: KeyboardEvent) => {
    if (GAME_CODES.has(e.code)) e.preventDefault();
    keys.add(e.code);
  };
  const up = (e: KeyboardEvent) => {
    keys.delete(e.code);
  };
  const clear = () => keys.clear();
  window.addEventListener("keydown", down);
  window.addEventListener("keyup", up);
  window.addEventListener("blur", clear);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") clear();
  });
  target.style.touchAction = "none";
  return () => {
    window.removeEventListener("keydown", down);
    window.removeEventListener("keyup", up);
    window.removeEventListener("blur", clear);
  };
}

export function setStick(x: number, y: number): void {
  const v = radial(x, y);
  stickX = v.x;
  stickY = v.y;
}

export function setHackHeld(v: boolean): void {
  hackHeld = v;
}

export function setQaKeys(codes: string[]): void {
  qaKeys = new Set(codes);
}

export function clearQaKeys(): void {
  qaKeys = null;
}

export function readActions(): Actions {
  const src = qaKeys ?? keys;
  let x = 0;
  let y = 0;
  if (src.has("KeyA") || src.has("ArrowLeft")) x -= 1;
  if (src.has("KeyD") || src.has("ArrowRight")) x += 1;
  if (src.has("KeyW") || src.has("ArrowUp")) y -= 1;
  if (src.has("KeyS") || src.has("ArrowDown")) y += 1;

  let padHack = false;
  const pads = typeof navigator !== "undefined" ? navigator.getGamepads?.() ?? [] : [];
  for (const pad of pads) {
    if (!pad || pad.mapping !== "standard") continue;
    const ax = radial(pad.axes[0] ?? 0, pad.axes[1] ?? 0);
    x += ax.x;
    y += ax.y;
    if (pad.buttons[12]?.pressed) y -= 1;
    if (pad.buttons[13]?.pressed) y += 1;
    if (pad.buttons[14]?.pressed) x -= 1;
    if (pad.buttons[15]?.pressed) x += 1;
    if (pad.buttons[0]?.pressed || pad.buttons[7]?.pressed) padHack = true;
  }

  x += stickX;
  y += stickY;
  const m = Math.hypot(x, y);
  if (m > 1) {
    x /= m;
    y /= m;
  }
  const stickMag = Math.hypot(stickX, stickY);
  const sprint = src.has("ShiftLeft") || src.has("ShiftRight") || stickMag > 0.84;
  const hack = hackHeld || padHack || src.has("Space");
  return { moveX: x, moveY: y, hack, sprint };
}
