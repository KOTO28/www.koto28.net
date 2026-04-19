// 設定
const particleDensity = 0.00002; // パーティクルの密度
const particleSize = 8; // パーティクルのサイズ
const particleSpeed = 0.2; // パーティクルの速度
const turnRatePerSec = 0.5; // 1秒あたりの向き変更頻度
const bgColor = "#000012"; // 背景色
const trailColor = "#53c8f0"; // 軌跡の線の色
const trailLineWidth = 2; // 軌跡の線の太さ
const trailMaxLength = 300; // 軌跡の最大長さ(px)
const boundsMargin = 300; // 移動範囲を広げる余白(px)

// DOM要素の取得
const canvas = document.getElementById("background-canvas");

// キャンバスのサイズをウィンドウに合わせる
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const ctx = canvas.getContext("2d");

function hexToRgb(hex) {
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
  return null;
}

const trailColorRgb = hexToRgb(trailColor) || { r: 255, g: 255, b: 255 };
function trailStrokeStyle(alpha) {
  return `rgba(${trailColorRgb.r}, ${trailColorRgb.g}, ${trailColorRgb.b}, ${alpha})`;
}

// 変数の初期化
let particles = [];
let numParticles = 0;

function reset() {
  // 面積に合わせてパーティクルの数を設定
  const area = (canvas.width + boundsMargin * 2) * (canvas.height + 2 * boundsMargin * 2);
  numParticles = Math.floor(particleDensity * area);

  particles = [];

  const minX = -boundsMargin;
  const maxX = canvas.width + boundsMargin;
  const minY = -boundsMargin;
  const maxY = canvas.height + boundsMargin;

  // パーティクルの初期化
  for (let i = 0; i < numParticles; i++) {
    const startX = minX + Math.random() * (maxX - minX);
    const startY = minY + Math.random() * (maxY - minY);
    particles.push({
      x: startX,
      y: startY,
      size: particleSize,
      speed: particleSpeed,
      direction: Math.floor(Math.random() * 8) * (Math.PI / 4),
      trail: [{ x: startX, y: startY }],
      trailLength: 0,
    });
  }
}
reset();

// パーティクルの更新
function updateParticles(deltaMs) {
  const minX = -boundsMargin;
  const maxX = canvas.width + boundsMargin;
  const minY = -boundsMargin;
  const maxY = canvas.height + boundsMargin;

  particles.forEach((p) => {
    // 向きの更新
    const dt = deltaMs / 1000;
    const turnProb = 1 - Math.exp(-turnRatePerSec * dt);
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
    while (p.trailLength > trailMaxLength && p.trail.length > 1) {
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
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // trails
  ctx.lineWidth = trailLineWidth;
  particles.forEach((p) => {
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
function animate(time) {
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
