// 設定
const PARTICLE_DENSITY = 0.00002; // パーティクルの密度
const PARTICLE_SIZE = 8; // パーティクルのサイズ
const PARTICLE_SPEED = 0.2; // パーティクルの速度
const TURN_RATE_PER_SEC = 0.5; // 1秒あたりの向き変更頻度
const BG_COLOR = "#000012"; // 背景色
const DEFAULT_TRAIL_COLOR = "#53c8f0"; // 軌跡の線の色
const SECRET_TRAIL_COLOR = "#f13f27"; // 隠しコマンドで変更される軌跡の線の色
const TRAIL_LINE_WIDTH = 2; // 軌跡の線の太さ
const TRAIL_MAX_LENGTH = 300; // 軌跡の最大長さ(px)
const BOUNDS_MARGIN = 300; // 移動範囲を広げる余白(px)

// 型定義
type Particle = {
  x: number;
  y: number;
  size: number;
  speed: number;
  direction: number;
  trail: { x: number; y: number }[];
  trailLength: number;
};

// DOM要素の取得
const canvas = document.getElementById("background-canvas") as HTMLCanvasElement;

if (!canvas) {
  throw new Error("Canvas element not found");
}

// キャンバスのサイズをウィンドウに合わせる
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
if (!ctx) {
  throw new Error("Canvas context not found");
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const value = hex.replace("#", "");
  if (value.length === 3) {
    const r = parseInt(value[0] + value[0], 16);
    const g = parseInt(value[1] + value[1], 16);
    const b = parseInt(value[2] + value[2], 16);
    return { r, g, b };
  }
  if (value.length === 6) {
    const r = parseInt(value.slice(0, 2), 16);
    const g = parseInt(value.slice(2, 4), 16);
    const b = parseInt(value.slice(4, 6), 16);
    return { r, g, b };
  }
  throw new Error(`Invalid hex color: ${hex}`);
}

// 変数の初期化
let particles: Particle[] = [];
let numParticles = 0;
let trailColorRgb = hexToRgb(DEFAULT_TRAIL_COLOR);

function trailStrokeStyle(alpha: number): string {
  return `rgba(${trailColorRgb.r}, ${trailColorRgb.g}, ${trailColorRgb.b}, ${alpha})`;
}

function reset() {
  // 面積に合わせてパーティクルの数を設定
  const area = (canvas.width + BOUNDS_MARGIN * 2) * (canvas.height + 2 * BOUNDS_MARGIN * 2);
  numParticles = Math.floor(PARTICLE_DENSITY * area);

  particles = [];

  const minX = -BOUNDS_MARGIN;
  const maxX = canvas.width + BOUNDS_MARGIN;
  const minY = -BOUNDS_MARGIN;
  const maxY = canvas.height + BOUNDS_MARGIN;

  // パーティクルの初期化
  for (let i = 0; i < numParticles; i++) {
    const startX = minX + Math.random() * (maxX - minX);
    const startY = minY + Math.random() * (maxY - minY);
    particles.push({
      x: startX,
      y: startY,
      size: PARTICLE_SIZE,
      speed: PARTICLE_SPEED,
      direction: Math.floor(Math.random() * 8) * (Math.PI / 4),
      trail: [{ x: startX, y: startY }],
      trailLength: 0,
    });
  }
}
reset();

// パーティクルの更新
function updateParticles(deltaMs: number) {
  const minX = -BOUNDS_MARGIN;
  const maxX = canvas.width + BOUNDS_MARGIN;
  const minY = -BOUNDS_MARGIN;
  const maxY = canvas.height + BOUNDS_MARGIN;

  particles.forEach((p: Particle) => {
    // 向きの更新
    const dt = deltaMs / 1000;
    const turnProb = 1 - Math.exp(-TURN_RATE_PER_SEC * dt);
    if (Math.random() < turnProb) {
      if (Math.random() < 0.5) {
        p.direction += Math.PI / 4; // 時計回り
      } else {
        p.direction -= Math.PI / 4; // 反時計回り
      }
    }

    const vx = Math.cos(p.direction) * p.speed;
    const vy = Math.sin(p.direction) * p.speed;
    p.x += vx * deltaMs;
    p.y += vy * deltaMs;
    let wrapped = false;
    if (p.x > maxX) {
      p.x = minX;
      wrapped = true;
    }
    if (p.y > maxY) {
      p.y = minY;
      wrapped = true;
    }
    if (p.x < minX) {
      p.x = maxX;
      wrapped = true;
    }
    if (p.y < minY) {
      p.y = maxY;
      wrapped = true;
    }

    if (wrapped) {
      p.trail.length = 0;
      p.trail.push({ x: p.x, y: p.y });
      p.trailLength = 0;
      return;
    }

    const last = p.trail[p.trail.length - 1];
    if (!last) {
      p.trail.push({ x: p.x, y: p.y });
      return;
    }

    const dx = p.x - last.x;
    const dy = p.y - last.y;
    const segmentLength = Math.hypot(dx, dy);
    p.trail.push({ x: p.x, y: p.y });
    p.trailLength += segmentLength;
    while (p.trailLength > TRAIL_MAX_LENGTH && p.trail.length > 1) {
      const first = p.trail[0];
      const second = p.trail[1];
      const segDx = second.x - first.x;
      const segDy = second.y - first.y;
      p.trailLength -= Math.hypot(segDx, segDy);
      p.trail.shift();
    }
  });
}

// パーティクルの描画
function drawParticles() {
  // bg
  ctx.fillStyle = BG_COLOR;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // trails
  ctx.lineWidth = TRAIL_LINE_WIDTH;
  particles.forEach((p: Particle) => {
    const trail = p.trail;
    if (trail.length < 2) return;
    const lastIndex = trail.length - 1;
    for (let i = 0; i < lastIndex; i++) {
      const t = (i + 1) / lastIndex;
      const alpha = t;
      ctx.strokeStyle = trailStrokeStyle(alpha);
      ctx.beginPath();
      ctx.moveTo(trail[i].x, trail[i].y);
      ctx.lineTo(trail[i + 1].x, trail[i + 1].y);
      ctx.stroke();
    }
  });

  // particles
  ctx.fillStyle = "#ffffff";
  particles.forEach((p) => {
    ctx.beginPath();
    ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    ctx.fill();
  });
}

// アニメーションループ
let lastTime = 0;
function animate(time: number) {
  let deltaMs = time - lastTime;
  lastTime = time;
  if (deltaMs > 500) {
    // タブが非アクティブで時間が大きく空いてしまった場合は、更新量を制限して一気に動かないようにする
    deltaMs = 500;
    reset();
  }
  updateParticles(deltaMs);
  drawParticles();
  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);

// ウィンドウのリサイズに対応
window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  reset();
});

// 隠しコマンド
const hiddenCommandSequence = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "b",
  "a",
];
let hiddenCommandIndex = 0;
document.addEventListener("keydown", (event) => {
  if (event.key === hiddenCommandSequence[hiddenCommandIndex]) {
    hiddenCommandIndex++;
    if (hiddenCommandIndex === hiddenCommandSequence.length) {
      trailColorRgb = hexToRgb(SECRET_TRAIL_COLOR);
      hiddenCommandIndex = 0;
    }
  } else {
    hiddenCommandIndex = 0;
  }
});
