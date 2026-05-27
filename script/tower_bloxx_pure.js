const ACHIEVEMENTS = [
    { type: 'hero', title: 'Kaloyan Tsvetkov', color: "#FEF3C7" },
    { type: 'experience', title: 'Ph.D. Student @ INSAIT', color: "#FDE68A" },
    { type: 'experience', title: 'Teaching Assistant @ FMI', color: "#FEF3C7" },
    { type: 'experience', title: 'Research Intern @ INSAIT', color: "#FCD34D" },
    { type: 'experience', title: 'Full-Stack Intern @ Astea', color: "#FEF3C7" },
    { type: 'experience', title: 'FMI Codes Winner', color: "#FDE68A" },
    { type: 'experience', title: 'National Math Olympiad', color: "#FBBF24" },
    { type: 'publication', title: 'The Open Proof Corpus', color: "#FEF3C7" },
    { type: 'notes', title: 'Discrete Mathematics', color: "#FEF3C7" },
    { type: 'notes', title: 'Design & Analysis of Algorithms', color: "#FDE68A" },
    { type: 'notes', title: 'Algebra', color: "#FEF3C7" }
];

const ROOF_ACHIEVEMENT = {
    id: "roof",
    type: "roof",
    title: "kaloyan.tsvetkov@insait.ai",
    color: "#E11D48",
};

// State Variables
let engine, render, runner;
let currentBlock = null;
let index = 0;
let placed = [];
let viewOffset = 0;
let targetViewOffset = 0;
let isTowerComplete = false;
let ropeRetractionProgress = 1; 
let isDropping = false;
let isDragging = false;
let lastY = 0;
let canvasWidth, canvasHeight;
let gameContainer = null;
let checkInterval = null;

// Dynamic Scaling Constants
const isMobile = window.innerWidth < 600;
let BLOCK_SIZE = isMobile ? 65 : 160;
let ROPE_LEN = isMobile ? 192 : 390; 
const GROUND_Y_OFFSET = 80;
const SWING_SPEED = 1.9; 

// Assets
const blockImages = {
    'hero': './src/images/block-base.svg',
    'experience': './src/images/block-experience.svg',
    'publication': './src/images/block-publication.svg',
    'notes': './src/images/block-notes.svg',
    'contact': './src/images/block-contact.svg',
    'base': './src/images/block-base.svg',
    'cloud': './src/images/cloud.svg',
    'crane-base': './src/images/crane-base.svg',
    'crane-stem': './src/images/crane-stem.svg',
    'crane-top': './src/images/crane-top.svg'
};

const IMAGES = {};
Object.entries(blockImages).forEach(([key, src]) => {
    const img = new Image();
    img.src = src;
    IMAGES[key] = img;
});

// Ground reference for drawing
let groundBody = null;

// Cloud System
let clouds = [];
function spawnCloud(yRelative) {
    const isMobileUI = window.innerWidth < 600;
    const scale = (isMobileUI ? 0.4 : 0.5) + Math.random() * (isMobileUI ? 0.8 : 1.5);
    const direction = Math.random() > 0.5 ? 1 : -1;
    clouds.push({
        x: Math.random() * (canvasWidth + 200) - 100,
        y: yRelative,
        speed: (0.2 + Math.random() * 0.5) * direction,
        scale: scale,
        opacity: 0.2 + Math.random() * 0.4,
        w: 100 * scale,
        h: 60 * scale
    });
}

function initClouds() {
    clouds = [];
    const count = window.innerWidth < 600 ? 8 : 15;
    for(let i=0; i<count; i++) {
        spawnCloud(Math.random() * canvasHeight * 2 - canvasHeight);
    }
}

function updateClouds() {
    clouds.forEach(c => {
        c.x += c.speed;
        if (c.speed > 0 && c.x > canvasWidth + 200) c.x = -200;
        else if (c.speed < 0 && c.x < -200) c.x = canvasWidth + 200;
    });
    clouds = clouds.filter(c => (c.y - viewOffset * 0.5) < canvasHeight + 400);
    const maxClouds = window.innerWidth < 600 ? 10 : 20;
    while (clouds.length < maxClouds) {
        spawnCloud(viewOffset * 0.5 - 300 - Math.random() * 800);
    }
}

function drawLabel(ctx, title, s) {
    if (!title) return;
    ctx.save();
    ctx.translate(0, s/2 - 25);
    ctx.font = `bold ${window.innerWidth < 600 ? '10px' : '12px'} 'Manrope', sans-serif`;
    const textWidth = ctx.measureText(title).width;
    const padding = window.innerWidth < 600 ? 8 : 12;
    const h = window.innerWidth < 600 ? 18 : 22;
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(-textWidth/2 - padding, -h/2, textWidth + padding*2, h, h/2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#000";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(title, 0, 0);
    ctx.restore();
}

function drawBlock(ctx, body, viewOffset, isRoof = false) {
  const { position, angle, plugin } = body;
  const type = isRoof ? 'contact' : (plugin.achievement?.type || 'base');
  const img = IMAGES[type] || IMAGES['base'];
  ctx.save();
  ctx.translate(position.x, position.y - viewOffset);
  ctx.rotate(angle);
  const s = BLOCK_SIZE;
  if (img && img.complete) {
    const ratio = img.naturalWidth / img.naturalHeight;
    let drawW, drawH;
    if (ratio > 1) { drawW = s; drawH = s / ratio; }
    else { drawH = s; drawW = s * ratio; }
    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
  } else {
    ctx.fillStyle = isRoof ? "#E11D48" : (plugin.achievement?.color ?? "#FEF3C7");
    ctx.fillRect(-s / 2, -s / 2, s, s);
  }
  drawLabel(ctx, plugin.achievement?.title, s);
  ctx.restore();
}

function drawCrane(ctx, w, pivotX, pivotY, blockX, blockY, viewOffset) {
  if (isTowerComplete && ropeRetractionProgress <= 0) return;
  
  const py = pivotY - viewOffset;
  const topImg = IMAGES['crane-top'];
  const baseImg = IMAGES['crane-base'];
  const stemImg = IMAGES['crane-stem'];

  const tW = isMobile ? 120 : 200;
  const tH = (tW / (topImg.naturalWidth || 100)) * (topImg.naturalHeight || 94);
  
  // ALIGNMENT MATH:
  // In crane-top.svg (viewBox 100x94):
  // Socket center is at X=52. Trolley (pivotX) is at X=87.
  // Distance is 35% of viewBox width.
  const mastOffset = tW * 0.35;
  const stemX = pivotX - mastOffset;

  // Draw Base (Centered on stemX)
  if (baseImg && baseImg.complete && groundBody) {
      const gPos = groundBody.position;
      const bW = isMobile ? 50 : 80;
      const bH = (bW / baseImg.naturalWidth) * baseImg.naturalHeight;
      ctx.drawImage(baseImg, stemX - bW/2, gPos.y - 15 - bH - viewOffset, bW, bH);
      
      // Draw Stem (Stacked from base to top socket)
      if (stemImg && stemImg.complete) {
          const sW = isMobile ? 20 : 32;
          const sH = (sW / stemImg.naturalWidth) * stemImg.naturalHeight;
          let currentY = gPos.y - 15 - bH - viewOffset;
          // Stop drawing stem just below the top socket (socket is near bottom of top assembly)
          while (currentY > py + tH * 0.05) {
              currentY -= sH;
              ctx.drawImage(stemImg, stemX - sW/2, currentY, sW, sH);
          }
      }
  }

  // Draw Top (Socket centered on stemX)
  if (topImg && topImg.complete) {
      // If socket (X=52) is at stemX, top-left X is stemX - (tW * 0.52)
      ctx.drawImage(topImg, stemX - tW * 0.52, py - tH * 0.88, tW, tH);
  }

  // Draw Rope
  if (ropeRetractionProgress > 0) {
    const currentRopeLen = ROPE_LEN * ropeRetractionProgress;
    ctx.strokeStyle = "#0a0a0a";
    ctx.lineWidth = isMobile ? 2 : 3.5;
    ctx.beginPath();
    ctx.moveTo(pivotX, py);
    let targetY, targetX;
    if (currentBlock && currentBlock.plugin.swinging) {
        targetX = blockX;
        targetY = blockY - viewOffset - (BLOCK_SIZE / 2);
    } else {
        targetX = pivotX;
        targetY = py + currentRopeLen;
    }
    ctx.lineTo(targetX, targetY);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(targetX, targetY - 4, 5, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function getAbsoluteTopY() {
    const droppedBlocks = Matter.Composite.allBodies(engine.world).filter(b => 
        (b.label === "block" || b.label === "roof") && !b.plugin.swinging
    );
    if (droppedBlocks.length > 0) {
        return Math.min(...droppedBlocks.map((b) => b.position.y - BLOCK_SIZE / 2));
    }
    return canvasHeight - GROUND_Y_OFFSET;
}

function getStableTopY() {
    const horizontalCenter = canvasWidth / 2;
    const tiltThreshold = 0.5; 
    const distThreshold = BLOCK_SIZE * 1.5;
    const stableBlocks = placed.filter(b => {
        const distFromCenter = Math.abs(b.position.x - horizontalCenter);
        return distFromCenter < distThreshold && Math.abs(b.angle) < tiltThreshold;
    });
    if (stableBlocks.length > 0) return Math.min(...stableBlocks.map((b) => b.position.y - BLOCK_SIZE / 2));
    return canvasHeight - GROUND_Y_OFFSET;
}

function computeSwing(t) {
  const ampl = (3 * Math.PI) / 10; 
  const baseAngle = -Math.PI / 2 + ampl * Math.cos(SWING_SPEED * t);
  const relX = ROPE_LEN * Math.cos(baseAngle);
  const relY = -ROPE_LEN * Math.sin(baseAngle); 
  return { relX, relY };
}

function spawnCraneBlock() {
  const isRoof = index >= ACHIEVEMENTS.length;
  const ach = isRoof ? ROOF_ACHIEVEMENT : ACHIEVEMENTS[index];
  const t = (engine.timing.timestamp / 1000);
  const { relX, relY } = computeSwing(t);
  const px = canvasWidth / 2 + relX;
  const py = viewOffset + 50 + relY;

  if (isRoof) {
      const half = BLOCK_SIZE / 2;
      currentBlock = Matter.Bodies.fromVertices(px, py, [[{ x: -half, y: half }, { x: half, y: half }, { x: 0, y: -half }]], {
          friction: 0.8, frictionStatic: 1.5, frictionAir: 0.01, restitution: 0, density: 0.01, label: "roof",
          plugin: { achievement: ach, isRoof: true, swinging: true }, render: { visible: false }
      });
  } else {
      currentBlock = Matter.Bodies.rectangle(px, py, BLOCK_SIZE, BLOCK_SIZE, {
          friction: 0.8, frictionStatic: 1.5, frictionAir: 0.01, restitution: 0, density: 0.01, chamfer: { radius: 2 }, label: "block",
          plugin: { achievement: ach, swinging: true }, render: { visible: false }
      });
  }
  Matter.Composite.add(engine.world, currentBlock);
  isDropping = false;
}

function initGame() {
  gameContainer = document.getElementById("tower-game-container");
  if (!engine) {
      engine = Matter.Engine.create();
      runner = Matter.Runner.create();
      Matter.Events.on(engine, 'beforeUpdate', () => {
        if (isTowerComplete) { if (ropeRetractionProgress > 0) ropeRetractionProgress -= 0.01; }
        else {
            const absoluteTopY = getAbsoluteTopY();
            const minSpace = ROPE_LEN + (BLOCK_SIZE * 2.5); 
            targetViewOffset = absoluteTopY - 50 - minSpace;
        }
        if (!isDragging) viewOffset += (targetViewOffset - viewOffset) * 0.05;
        updateClouds();
        if (currentBlock && currentBlock.plugin.swinging) {
          const t = (engine.timing.timestamp / 1000);
          const { relX, relY } = computeSwing(t);
          Matter.Body.setVelocity(currentBlock, { x: 0, y: 0 });
          Matter.Body.setAngularVelocity(currentBlock, 0);
          Matter.Body.setAngle(currentBlock, 0);
          Matter.Body.setPosition(currentBlock, { x: canvasWidth/2 + relX, y: viewOffset + 50 + relY });
        }
      });
  }
  engine.velocityIterations = 8;
  engine.positionIterations = 8;
  canvasWidth = gameContainer.clientWidth;
  canvasHeight = gameContainer.clientHeight;
  BLOCK_SIZE = canvasWidth < 600 ? 65 : 160;
  ROPE_LEN = canvasWidth < 600 ? 192 : 390;

  if (!render) {
      render = Matter.Render.create({
        element: gameContainer, engine: engine,
        options: { width: canvasWidth, height: canvasHeight, background: 'transparent', wireframes: false, hasBounds: true }
      });
      Matter.Events.on(render, 'afterRender', () => {
        const ctx = render.context;
        const cloudImg = IMAGES['cloud'];
        if (cloudImg && cloudImg.complete) {
            clouds.forEach(c => {
                const drawY = c.y - viewOffset * 0.5;
                ctx.save(); ctx.globalAlpha = c.opacity; ctx.drawImage(cloudImg, c.x, drawY, c.w, c.h); ctx.restore();
            });
        }
        render.bounds.min.y = viewOffset; render.bounds.max.y = viewOffset + canvasHeight;
        ctx.fillStyle = "#0a0a0a";
        if (groundBody) ctx.fillRect(groundBody.position.x - canvasWidth * 0.35, groundBody.position.y - 15 - viewOffset, canvasWidth * 0.7, 30);
        drawCrane(ctx, canvasWidth, canvasWidth/2, viewOffset + 50, currentBlock ? currentBlock.position.x : canvasWidth/2, currentBlock ? currentBlock.position.y : viewOffset+50, viewOffset);
        Matter.Composite.allBodies(engine.world).forEach(body => {
          if (body.label === "block" || body.label === "roof") drawBlock(ctx, body, viewOffset, body.label === "roof");
        });
      });
  }
  groundBody = Matter.Bodies.rectangle(canvasWidth / 2, canvasHeight - GROUND_Y_OFFSET / 2, canvasWidth * 0.7, 30, {
    isStatic: true, label: "ground", friction: 0.8, frictionStatic: 1.5, chamfer: { radius: 4 }, render: { visible: false }
  });
  const wallL = Matter.Bodies.rectangle(-40, canvasHeight * 2, 80, canvasHeight * 8, { isStatic: true, render: { visible: false } });
  const wallR = Matter.Bodies.rectangle(canvasWidth + 40, canvasHeight * 2, 80, canvasHeight * 8, { isStatic: true, render: { visible: false } });
  Matter.Composite.add(engine.world, [groundBody, wallL, wallR]);
  initClouds();
  Matter.Render.run(render);
  Matter.Runner.run(runner, engine);
  spawnCraneBlock();

  const startDrag = (y) => { if (isTowerComplete) { isDragging = true; lastY = y; gameContainer.style.cursor = 'grabbing'; } };
  const moveDrag = (y) => { if (isDragging) { const dy = y - lastY; targetViewOffset -= dy; const topY = getStableTopY(); targetViewOffset = Math.max(topY - 200, Math.min(canvasHeight - GROUND_Y_OFFSET - canvasHeight + 100, targetViewOffset)); lastY = y; } };
  const endDrag = () => { isDragging = false; gameContainer.style.cursor = 'grab'; };
  gameContainer.onmousedown = (e) => startDrag(e.clientY);
  window.onmousemove = (e) => moveDrag(e.clientY);
  window.onmouseup = endDrag;
  gameContainer.ontouchstart = (e) => startDrag(e.touches[0].clientY);
  window.ontouchmove = (e) => { if(isDragging) e.preventDefault(); moveDrag(e.touches[0].clientY); };
  window.ontouchend = endDrag;
  const gameArea = document.getElementById("tower-game-container");
  gameArea.onmousedown = (e) => { if(!isDragging) dropBlock(); };
  gameArea.ontouchstart = (e) => { if(!isDragging) { e.preventDefault(); dropBlock(); } };
  window.onkeydown = (e) => { if (e.code === "Space") dropBlock(); };
}

window.resetGame = function() {
    if (!engine) return;
    Matter.Composite.clear(engine.world);
    placed = []; index = 0; viewOffset = 0; targetViewOffset = 0; isTowerComplete = false; ropeRetractionProgress = 1; isDropping = false; currentBlock = null;
    if (checkInterval) clearInterval(checkInterval);
    groundBody = Matter.Bodies.rectangle(canvasWidth / 2, canvasHeight - GROUND_Y_OFFSET / 2, canvasWidth * 0.7, 30, {
        isStatic: true, label: "ground", friction: 0.8, frictionStatic: 1.5, chamfer: { radius: 4 }, render: { visible: false }
    });
    const wallL = Matter.Bodies.rectangle(-40, canvasHeight * 2, 80, canvasHeight * 8, { isStatic: true, render: { visible: false } });
    const wallR = Matter.Bodies.rectangle(canvasWidth + 40, canvasHeight * 2, 80, canvasHeight * 8, { isStatic: true, render: { visible: false } });
    Matter.Composite.add(engine.world, [groundBody, wallL, wallR]);
    spawnCraneBlock();
};

function retryBlock() {
  Matter.Composite.remove(engine.world, currentBlock);
  spawnCraneBlock();
}

function dropBlock() {
  if (isDropping || isTowerComplete || isDragging) return;
  if (!currentBlock) return;
  isDropping = true; currentBlock.plugin.swinging = false;
  Matter.Body.setVelocity(currentBlock, { x: 0, y: 8 }); 
  Matter.Body.setAngularVelocity(currentBlock, 0);
  if (checkInterval) clearInterval(checkInterval);
  let hasFallen = false; let settledCount = 0;
  checkInterval = setInterval(() => {
    if (!engine) return;
    const speed = Math.abs(currentBlock.velocity.x) + Math.abs(currentBlock.velocity.y) + Math.abs(currentBlock.angularVelocity) * 10;
    if (speed > 1) hasFallen = true;
    if (currentBlock.position.y > canvasHeight - GROUND_Y_OFFSET + viewOffset + 500) { clearInterval(checkInterval); retryBlock(); return; }
    if (speed < 0.5 && hasFallen) {
      settledCount++; if (settledCount < 3) return;
      clearInterval(checkInterval);
      const horizontalCenter = canvasWidth / 2;
      const stableBlocks = placed.filter(b => { return Math.abs(b.position.x - horizontalCenter) < BLOCK_SIZE * 1.5 && Math.abs(b.angle) < 0.5; });
      const lastStable = stableBlocks[stableBlocks.length - 1];
      if (lastStable && Math.abs(currentBlock.position.x - lastStable.position.x) > BLOCK_SIZE * 0.9) { retryBlock(); return; }
      placed.push(currentBlock); index += 1;
      if (currentBlock.plugin.isRoof) isTowerComplete = true;
      else setTimeout(() => { if (!engine) return; spawnCraneBlock(); }, 300);
    } else settledCount = 0;
  }, 60);
}

window.openTowerGame = function() {
  document.getElementById("tower-bloxx-modal").classList.remove("hidden");
  if(!engine) initGame();
}
window.closeTowerGame = function() { document.getElementById("tower-bloxx-modal").classList.add("hidden"); }
