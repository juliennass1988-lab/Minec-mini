(() => {
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  const resetButton = document.getElementById("resetButton");

  const WORLD = {
    tile: 48,
    gravity: 1850,
    friction: 0.82,
    moveSpeed: 620,
    maxSpeed: 350,
    jumpVelocity: -690,
    width: 82,
    height: 12,
  };

  const input = {
    left: false,
    right: false,
    jump: false,
    jumpPressed: false,
  };

  const playerStart = { x: 150, y: 150 };
  const player = {
    x: playerStart.x,
    y: playerStart.y,
    w: 34,
    h: 78,
    vx: 0,
    vy: 0,
    grounded: false,
    facing: 1,
    walkTime: 0,
    blink: 0,
    blinkCooldown: 2.5,
  };

  const blocks = buildWorld();
  let cameraX = 0;
  let lastTime = performance.now();

  function buildWorld() {
    const list = [];

    for (let x = 0; x < WORLD.width; x++) {
      const top = 8 + Math.floor(Math.sin(x * 0.32) * 0.8);
      list.push({ x, y: top, type: "grass" });
      list.push({ x, y: top + 1, type: "dirt" });
      list.push({ x, y: top + 2, type: "dirt" });

      if ((x === 10 || x === 11 || x === 27 || x === 28 || x === 49) && top > 5) {
        list.push({ x, y: top - 1, type: "grass" });
      }
      if (x === 39 || x === 40 || x === 41) {
        list.push({ x, y: top - 2, type: "grass" });
      }
      if (x % 13 === 7) {
        list.push({ x, y: top - 1, type: "flower" });
      }
    }

    return list;
  }

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const scale = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    canvas.width = Math.round(rect.width * scale);
    canvas.height = Math.round(rect.height * scale);
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
  }

  function resetGame() {
    player.x = playerStart.x;
    player.y = playerStart.y;
    player.vx = 0;
    player.vy = 0;
    player.grounded = false;
    player.facing = 1;
    player.walkTime = 0;
    cameraX = 0;
  }

  function rectsOverlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function solidTilesNear(rect) {
    const tile = WORLD.tile;
    const minX = Math.max(0, Math.floor(rect.x / tile) - 1);
    const maxX = Math.min(WORLD.width - 1, Math.floor((rect.x + rect.w) / tile) + 1);
    const minY = Math.max(0, Math.floor(rect.y / tile) - 1);
    const maxY = Math.min(WORLD.height + 2, Math.floor((rect.y + rect.h) / tile) + 1);

    return blocks
      .filter((b) => b.type !== "flower" && b.x >= minX && b.x <= maxX && b.y >= minY && b.y <= maxY)
      .map((b) => ({ x: b.x * tile, y: b.y * tile, w: tile, h: tile, type: b.type }));
  }

  function update(dt) {
    const target = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    player.vx += target * WORLD.moveSpeed * dt;
    player.vx *= WORLD.friction;
    player.vx = Math.max(-WORLD.maxSpeed, Math.min(WORLD.maxSpeed, player.vx));

    if (target !== 0) {
      player.facing = target;
      player.walkTime += dt * Math.abs(player.vx) * 0.045;
    } else {
      player.walkTime *= 0.92;
    }

    if (input.jumpPressed && player.grounded) {
      player.vy = WORLD.jumpVelocity;
      player.grounded = false;
    }
    input.jumpPressed = false;

    player.vy += WORLD.gravity * dt;
    player.vy = Math.min(player.vy, 900);

    player.x += player.vx * dt;
    resolveCollisions("x");

    player.y += player.vy * dt;
    player.grounded = false;
    resolveCollisions("y");

    if (player.y > 760) resetGame();

    const viewportW = canvas.clientWidth;
    const maxCamera = WORLD.width * WORLD.tile - viewportW;
    const wanted = player.x - viewportW * 0.38;
    cameraX += (Math.max(0, Math.min(maxCamera, wanted)) - cameraX) * Math.min(1, dt * 8);

    player.blinkCooldown -= dt;
    if (player.blinkCooldown <= 0) {
      player.blink = 0.14;
      player.blinkCooldown = 2.4 + Math.random() * 2.2;
    }
    if (player.blink > 0) player.blink -= dt;
  }

  function resolveCollisions(axis) {
    const rect = { x: player.x, y: player.y, w: player.w, h: player.h };
    for (const tile of solidTilesNear(rect)) {
      if (!rectsOverlap(rect, tile)) continue;

      if (axis === "x") {
        if (player.vx > 0) player.x = tile.x - player.w;
        if (player.vx < 0) player.x = tile.x + tile.w;
        player.vx = 0;
        rect.x = player.x;
      } else {
        if (player.vy > 0) {
          player.y = tile.y - player.h;
          player.grounded = true;
        }
        if (player.vy < 0) player.y = tile.y + tile.h;
        player.vy = 0;
        rect.y = player.y;
      }
    }
  }

  function draw() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    ctx.clearRect(0, 0, w, h);

    drawBackground(w, h);

    ctx.save();
    ctx.translate(-cameraX, 0);
    drawBlocks();
    drawPlayer();
    ctx.restore();

    drawProgressFlag(w, h);
  }

  function drawBackground(w, h) {
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, "#93dcff");
    sky.addColorStop(0.68, "#e8ffd7");
    sky.addColorStop(1, "#c7efb3");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = "rgba(255,255,255,.72)";
    drawCloud(w * 0.18, h * 0.22, 38);
    drawCloud(w * 0.74, h * 0.18, 30);

    ctx.fillStyle = "rgba(105, 193, 83, .28)";
    drawHill(-80, h * 0.78, w * 0.8, h * 0.42);
    ctx.fillStyle = "rgba(62, 163, 74, .2)";
    drawHill(w * 0.32, h * 0.8, w * 0.9, h * 0.36);
  }

  function drawCloud(x, y, r) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.arc(x + r * 0.9, y + r * 0.08, r * 0.72, 0, Math.PI * 2);
    ctx.arc(x - r * 0.84, y + r * 0.13, r * 0.62, 0, Math.PI * 2);
    ctx.arc(x + r * 0.1, y - r * 0.42, r * 0.74, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawHill(x, y, w, h) {
    ctx.beginPath();
    ctx.moveTo(x, y + h);
    ctx.quadraticCurveTo(x + w * 0.5, y - h, x + w, y + h);
    ctx.closePath();
    ctx.fill();
  }

  function drawBlocks() {
    const tile = WORLD.tile;
    const minX = Math.floor(cameraX / tile) - 2;
    const maxX = Math.ceil((cameraX + canvas.clientWidth) / tile) + 2;

    for (const b of blocks) {
      if (b.x < minX || b.x > maxX) continue;
      const x = b.x * tile;
      const y = b.y * tile;
      if (b.type === "flower") {
        drawFlower(x + tile * 0.5, y + tile * 0.18);
      } else {
        drawBlock(x, y, tile, b.type);
      }
    }
  }

  function drawBlock(x, y, s, type) {
    const radius = 7;
    const topColor = type === "grass" ? "#65d652" : "#936338";
    const frontColor = type === "grass" ? "#4aa943" : "#7d4f2c";
    const sideColor = type === "grass" ? "#3f923d" : "#6c4327";

    ctx.save();
    ctx.shadowColor = "rgba(22, 70, 35, .22)";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 6;

    roundRect(x + 2, y + 2, s - 4, s - 4, radius, frontColor);
    ctx.shadowBlur = 0;

    ctx.fillStyle = topColor;
    roundedPath(x + 3, y + 3, s - 6, 17, radius);
    ctx.fill();

    ctx.fillStyle = sideColor;
    ctx.globalAlpha = 0.38;
    ctx.fillRect(x + s - 11, y + 20, 7, s - 24);
    ctx.globalAlpha = 1;

    ctx.strokeStyle = "rgba(255,255,255,.34)";
    ctx.lineWidth = 2;
    roundedPath(x + 3, y + 3, s - 6, s - 6, radius);
    ctx.stroke();
    ctx.restore();
  }

  function drawFlower(x, y) {
    ctx.save();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#2f8c37";
    ctx.beginPath();
    ctx.moveTo(x, y + 20);
    ctx.lineTo(x, y + 2);
    ctx.stroke();
    ctx.fillStyle = "#ffcc4d";
    for (let i = 0; i < 5; i++) {
      const a = (Math.PI * 2 * i) / 5;
      ctx.beginPath();
      ctx.arc(x + Math.cos(a) * 7, y + Math.sin(a) * 7, 5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "#ff8a5b";
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawPlayer() {
    const x = player.x;
    const y = player.y;
    const legSwing = Math.sin(player.walkTime) * 7;
    const armSwing = Math.sin(player.walkTime + Math.PI) * 7;
    const bounce = player.grounded ? Math.abs(Math.sin(player.walkTime)) * 2 : 0;

    ctx.save();
    ctx.translate(x + player.w / 2, y + bounce);
    ctx.scale(player.facing, 1);

    // Soft shadow
    ctx.fillStyle = "rgba(20, 70, 25, .2)";
    ctx.beginPath();
    ctx.ellipse(0, player.h + 7, 28, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    // Legs
    drawLimb(-10, 47, 11, 31, legSwing, "#5138c9", "#332a8f");
    drawLimb(4, 47, 11, 31, -legSwing, "#5138c9", "#332a8f");

    // Body
    blockRect(-17, 27, 34, 31, 7, "#2b98f0", "#1765a8");
    ctx.fillStyle = "rgba(255,255,255,.25)";
    ctx.fillRect(-12, 31, 24, 5);

    // Arms
    drawLimb(-28, 30, 11, 29, armSwing, "#2b98f0", "#1765a8");
    drawLimb(17, 30, 11, 29, -armSwing, "#2b98f0", "#1765a8");

    // Head
    blockRect(-18, -5, 36, 34, 8, "#f6c28f", "#c6814d");

    // Hair
    ctx.fillStyle = "#5a3b28";
    roundedPath(-18, -5, 36, 10, 7);
    ctx.fill();
    ctx.fillRect(-17, 1, 8, 10);

    // Eyes
    ctx.fillStyle = "#20202a";
    if (player.blink > 0) {
      ctx.fillRect(-7, 11, 5, 2);
      ctx.fillRect(8, 11, 5, 2);
    } else {
      ctx.fillRect(-7, 8, 5, 7);
      ctx.fillRect(8, 8, 5, 7);
      ctx.fillStyle = "rgba(255,255,255,.8)";
      ctx.fillRect(-6, 9, 2, 2);
      ctx.fillRect(9, 9, 2, 2);
    }

    // Smile
    ctx.strokeStyle = "#6b3a2a";
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(2, 17, 8, 0.15, Math.PI - 0.15);
    ctx.stroke();

    ctx.restore();
  }

  function drawLimb(x, y, w, h, swing, main, side) {
    ctx.save();
    ctx.translate(x + w / 2, y + 4);
    ctx.rotate((swing * Math.PI) / 180);
    blockRect(-w / 2, 0, w, h, 5, main, side);
    ctx.restore();
  }

  function blockRect(x, y, w, h, r, main, side) {
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,.16)";
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 5;
    roundRect(x, y, w, h, r, main);
    ctx.shadowBlur = 0;
    ctx.fillStyle = side;
    ctx.globalAlpha = 0.35;
    ctx.fillRect(x + w - Math.max(4, w * 0.22), y + 4, Math.max(3, w * 0.18), h - 8);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = "rgba(255,255,255,.32)";
    ctx.lineWidth = 1.8;
    roundedPath(x + 1, y + 1, w - 2, h - 2, r);
    ctx.stroke();
    ctx.restore();
  }

  function roundRect(x, y, w, h, r, fillStyle) {
    ctx.fillStyle = fillStyle;
    roundedPath(x, y, w, h, r);
    ctx.fill();
  }

  function roundedPath(x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.lineTo(x + w - rr, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
    ctx.lineTo(x + w, y + h - rr);
    ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
    ctx.lineTo(x + rr, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
    ctx.lineTo(x, y + rr);
    ctx.quadraticCurveTo(x, y, x + rr, y);
  }

  function drawProgressFlag(w, h) {
    const progress = Math.min(1, player.x / (WORLD.width * WORLD.tile - 300));
    const barW = Math.min(260, w * 0.54);
    const x = w - barW - 22;
    const y = 22;

    ctx.save();
    ctx.fillStyle = "rgba(255,255,255,.72)";
    roundedPath(x, y, barW, 18, 999);
    ctx.fill();
    ctx.fillStyle = "#65d652";
    roundedPath(x + 3, y + 3, (barW - 6) * progress, 12, 999);
    ctx.fill();
    ctx.fillStyle = "rgba(30, 70, 35, .7)";
    ctx.font = "800 12px system-ui, sans-serif";
    ctx.fillText("Ziel", x + barW - 32, y + 39);
    ctx.restore();
  }

  function setKey(key, down) {
    if (key === "left") input.left = down;
    if (key === "right") input.right = down;
    if (key === "jump") {
      if (down && !input.jump) input.jumpPressed = true;
      input.jump = down;
    }
  }

  window.addEventListener("keydown", (event) => {
    if (["ArrowLeft", "KeyA"].includes(event.code)) setKey("left", true);
    if (["ArrowRight", "KeyD"].includes(event.code)) setKey("right", true);
    if (["Space", "ArrowUp", "KeyW"].includes(event.code)) setKey("jump", true);
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "Space"].includes(event.code)) event.preventDefault();
  });

  window.addEventListener("keyup", (event) => {
    if (["ArrowLeft", "KeyA"].includes(event.code)) setKey("left", false);
    if (["ArrowRight", "KeyD"].includes(event.code)) setKey("right", false);
    if (["Space", "ArrowUp", "KeyW"].includes(event.code)) setKey("jump", false);
  });

  document.querySelectorAll("[data-key]").forEach((button) => {
    const key = button.getAttribute("data-key");
    const down = (event) => {
      event.preventDefault();
      button.classList.add("is-down");
      setKey(key, true);
    };
    const up = (event) => {
      event.preventDefault();
      button.classList.remove("is-down");
      setKey(key, false);
    };
    button.addEventListener("pointerdown", down);
    button.addEventListener("pointerup", up);
    button.addEventListener("pointerleave", up);
    button.addEventListener("pointercancel", up);
  });

  resetButton.addEventListener("click", resetGame);
  window.addEventListener("resize", resizeCanvas);

  function loop(now) {
    const dt = Math.min(0.033, (now - lastTime) / 1000);
    lastTime = now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  resizeCanvas();
  resetGame();
  requestAnimationFrame(loop);
})();
