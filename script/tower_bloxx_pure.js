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
let BASE_SIZE = 0;

// Dynamic Scaling Constants
const isMobile = window.innerWidth < 600;
let BLOCK_SIZE = isMobile ? 50 : 120;
let BLOCK_WIDTH = isMobile ? 50 : 120 * 0.7;
let ROPE_LEN = isMobile ? 128 : 256; 
const GROUND_Y_OFFSET = 80;

// Game State Variables
let gameState = 'PLAYING';
let score = 0;
let combo = 0;
let comboTimer = 1.0;
let level = 1;
let towersCompleted = 0;
let lives = 3;

function setGameState(state) {
    gameState = state;
    document.querySelectorAll('.game-overlay').forEach(el => el.classList.add('hidden'));
    
    if (state === 'START') {
        document.getElementById('game-state-start').classList.remove('hidden');
        document.getElementById('game-hud').classList.add('hidden');
    } else if (state === 'PLAYING') {
        document.getElementById('game-hud').classList.remove('hidden');
        updateHUD();
    } else if (state === 'TOWER_COMPLETE') {
        let bonus = 1000 + combo * 100;
        score += bonus;
        updateHUD();
    } else if (state === 'GAME_OVER') {
        // No popup appears; wait for user to click restart
    }
}

function updateHUD() {
    document.getElementById('hud-score-value').innerText = score;
    const comboEl = document.getElementById('hud-combo-value');
    const newComboText = 'x' + Math.max(1, combo);
    if (comboEl.innerText !== newComboText) {
        comboEl.innerText = newComboText;
        comboEl.classList.remove('combo-bump');
        void comboEl.offsetWidth; // trigger reflow
        comboEl.classList.add('combo-bump');
    }
    document.getElementById('hud-level-value').innerText = level;
    
    const comboTimerContainer = document.getElementById('combo-timer-container');
    const comboBar = document.getElementById('combo-timer-bar');
    
    if (combo > 0) {
        if (comboTimerContainer) comboTimerContainer.classList.remove('hidden');
        if (comboBar) {
            comboBar.style.height = (comboTimer * 100) + '%';
        }
    } else {
        if (comboTimerContainer) comboTimerContainer.classList.add('hidden');
    }
}

function spawnFloatingText(text, x, y, className) {
    const container = document.getElementById('effects-container');
    if(!container) return;
    const el = document.createElement('div');
    el.className = `floating-text ${className}`;
    el.innerText = text;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    container.appendChild(el);
    setTimeout(() => el.remove(), 1000);
}

function spawnSparkles(x, y, count) {
    const container = document.getElementById('effects-container');
    if(!container) return;
    for(let i=0; i<count; i++) {
        const el = document.createElement('div');
        el.className = 'sparkle';
        el.style.left = `${x + (Math.random()-0.5)*60}px`;
        el.style.top = `${y + (Math.random()-0.5)*40}px`;
        container.appendChild(el);
        setTimeout(() => el.remove(), 500);
    }
}

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

// Flying People System
let flyingPeople = [];
let fallingPeopleOut = [];

function spawnFlyingPerson() {
    let targetX = canvasWidth + 200;
    let targetY = viewOffset + 100 + Math.random() * (canvasHeight - 200);
    let hasTarget = false;
    
    if (placed.length > 1) {
        let b = placed[Math.floor(Math.random() * (placed.length - 1)) + 1];
        if (b) {
            targetX = b.position.x + (Math.random() > 0.5 ? 60 : -60); // slight offset
            targetY = b.position.y - (Math.random() * 40);
            hasTarget = true;
        }
    }

    const names = ["Kaloyan", "Seri", "Radoslav", "Skeleta", "Stefan", "Jakub", "Nikola"];
    
    flyingPeople.push({
        x: -50,
        y: viewOffset + 100 + Math.random() * (canvasHeight - 200),
        speed: 1.5 + Math.random() * 1.5,
        w: 30, h: 30,
        targetX: targetX,
        targetY: targetY,
        hasTarget: hasTarget,
        timeOffset: Math.random() * 1000,
        name: names[Math.floor(Math.random() * names.length)]
    });
}
function updateFlyingPeople() {
    if (Math.random() < 0.005 && gameState === 'PLAYING') spawnFlyingPerson();
    flyingPeople.forEach(p => {
        if (p.hasTarget) {
            const dx = p.targetX - p.x;
            const dy = p.targetY - p.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if (dist > 40) {
                p.x += (dx / dist) * p.speed;
                p.y += (dy / dist) * p.speed;
            } else {
                p.x = canvasWidth + 200; // Disappear when arrived
            }
        } else {
            p.x += p.speed;
        }
    });
    flyingPeople = flyingPeople.filter(p => p.x < canvasWidth + 100);

    fallingPeopleOut.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.2; // gravity
        p.rotation = (p.rotation || 0) + p.vr;
    });
    fallingPeopleOut = fallingPeopleOut.filter(p => p.y < canvasHeight + 200 && p.y > viewOffset - 200 && (!groundBody || p.y < groundBody.position.y));
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
  const targetSize = plugin.isBase ? BASE_SIZE : BLOCK_WIDTH;

  if (img && img.complete) {
    const ratio = img.naturalWidth / img.naturalHeight;
    const drawH = targetSize;
    const drawW = targetSize * ratio;
    
    let visualYOffset = 0;
    if (plugin.isBase && plugin.physH) {
      // Shift visual representation up so its visual bottom matches the physics body bottom, 
      // but because we shrank the physH the top edge of the physics body is lower than visually!
      visualYOffset = -(targetSize - plugin.physH) / 2;
    }

    ctx.drawImage(img, -drawW / 2, -drawH / 2 + visualYOffset, drawW, drawH);
  } else {
    ctx.fillStyle = isRoof ? "#E11D48" : (plugin.achievement?.color ?? "#FEF3C7");
    ctx.fillRect(-targetSize / 2, -targetSize / 2, targetSize, targetSize);
  }
  drawLabel(ctx, plugin.achievement?.title, targetSize);
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
        const targetSize = currentBlock.plugin.isBase ? BASE_SIZE : BLOCK_WIDTH;
        targetY = blockY - viewOffset - (targetSize / 2);
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
        return Math.min(...droppedBlocks.map((b) => {
            const targetSize = b.plugin.isBase ? BASE_SIZE : BLOCK_WIDTH;
            return b.position.y - targetSize / 2;
        }));
    }
    return canvasHeight - GROUND_Y_OFFSET;
}

function getStableTopY() {
    const horizontalCenter = canvasWidth / 2;
    const tiltThreshold = 0.5; 
    const distThreshold = BASE_SIZE * 1.5;
    const stableBlocks = placed.filter(b => {
        const distFromCenter = Math.abs(b.position.x - horizontalCenter);
        return distFromCenter < distThreshold && Math.abs(b.angle) < tiltThreshold;
    });
    if (stableBlocks.length > 0) return Math.min(...stableBlocks.map((b) => {
        const targetSize = b.plugin.isBase ? BASE_SIZE : BLOCK_WIDTH;
        return b.position.y - targetSize / 2;
    }));
    return canvasHeight - GROUND_Y_OFFSET;
}

let swingPhase = 0;
let lastSwingTime = 0;

function computeSwing(t) {
  let dt = t - lastSwingTime;
  if (dt < 0 || dt > 1) dt = 0;
  lastSwingTime = t;
  
  let currentSpeed = 1.9 + (level - 1) * 0.15;
  swingPhase += currentSpeed * dt;

  const ampl = (4 * Math.PI) / 10; 
  const baseAngle = -Math.PI / 2 + ampl * Math.cos(swingPhase);
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
      const half = BLOCK_WIDTH / 2;
      currentBlock = Matter.Bodies.fromVertices(px, py, [[{ x: -half, y: half }, { x: half, y: half }, { x: 0, y: -half }]], {
          friction: 0.8, frictionStatic: 1.5, frictionAir: 0.01, restitution: 0, density: 0.01, label: "roof",
          plugin: { achievement: ach, isRoof: true, swinging: true }, render: { visible: false }
      });
  } else {
      let isBase = index === 0;
      // Normal physics height, but for the base we reduce it so the next block rests lower inside it
      let effectiveSize = isBase ? BASE_SIZE : BLOCK_WIDTH;
      let physH = isBase ? effectiveSize - (effectiveSize * (15 / 74)) : BLOCK_WIDTH;
      let physW = effectiveSize;
      currentBlock = Matter.Bodies.rectangle(px, py, physW, physH, {
          friction: 0.8, frictionStatic: 1.5, frictionAir: 0.01, restitution: 0, density: 0.01, chamfer: { radius: 2 }, label: "block",
          plugin: { achievement: ach, swinging: true, isBase: isBase, physH: physH }, render: { visible: false }
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
            const minSpace = ROPE_LEN + (BASE_SIZE * 1.0); 
            targetViewOffset = Math.min(absoluteTopY - 50 - minSpace, 0); // Clamp to 0 to keep ground at bottom
        }
        if (!isDragging) viewOffset += (targetViewOffset - viewOffset) * 0.05;
        updateClouds();
        updateFlyingPeople();

        Matter.Composite.allBodies(engine.world).forEach(b => {
          if ((b.label === "block" || b.label === "roof") && !b.plugin.swinging && b.plugin.residents > 0) {
              const isTipping = Math.abs(b.angularVelocity) > 0.1 || Math.abs(b.angle) > 0.6 || b.velocity.y > 4 || Math.abs(b.velocity.x) > 2.5;
              if (isTipping) {
                  let numToSpawn = b.plugin.residents;
                  b.plugin.residents = 0; // they are released
                  for (let i = 0; i < numToSpawn; i++) {
                      fallingPeopleOut.push({
                          x: b.position.x + (Math.random() - 0.5) * 50,
                          y: b.position.y + (Math.random() - 0.5) * 50,
                          vx: (Math.random() - 0.5) * 8,
                          vy: -Math.random() * 6 - 2, // jump out initially
                          vr: (Math.random() - 0.5) * 0.5,
                          w: 30, h: 30
                      });
                  }
              }
          }
        });
        
        if (gameState === 'PLAYING' && combo > 0 && !isDropping) {
            comboTimer -= 0.003;
            if (comboTimer <= 0) {
                comboTimer = 0;
                combo = 0;
            }
            updateHUD();
        }
        
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
  BLOCK_WIDTH = canvasWidth < 600 ? BLOCK_SIZE : BLOCK_SIZE * 0.7;
  BASE_SIZE = BLOCK_WIDTH * 0.85;
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
        
        // Draw Flying People (BEFORE blocks, so blocks are in front)
        const personImg = IMAGES['person'] || (IMAGES['person'] = new Image(), IMAGES['person'].src = './src/images/flying-person.svg', IMAGES['person']);
        if (personImg.complete) {
            flyingPeople.forEach(p => {
                ctx.drawImage(personImg, p.x, p.y - viewOffset, p.w, p.h);
                if (p.name) {
                    ctx.save();
                    ctx.font = "bold 10px 'Manrope', sans-serif";
                    const tw = ctx.measureText(p.name).width;
                    const pad = 4;
                    const lh = 12;
                    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
                    ctx.beginPath();
                    ctx.roundRect(p.x + p.w / 2 - tw / 2 - pad, p.y - viewOffset - 18, tw + pad * 2, lh, 4);
                    ctx.fill();
                    ctx.fillStyle = "#000";
                    ctx.textAlign = "center";
                    ctx.textBaseline = "middle";
                    ctx.fillText(p.name, p.x + p.w / 2, p.y - viewOffset - 12);
                    ctx.restore();
                }
            });
            fallingPeopleOut.forEach(p => {
                ctx.save();
                ctx.translate(p.x, p.y - viewOffset);
                ctx.rotate(p.rotation || 0);
                ctx.drawImage(personImg, -p.w/2, -p.h/2, p.w, p.h);
                ctx.restore();
            });
        }

        // Draw blocks last so they are always brought to front
        let baseBody = null;
        Matter.Composite.allBodies(engine.world).forEach(body => {
          if (body.label === "block" || body.label === "roof") {
              if (body.plugin && body.plugin.isBase) {
                  baseBody = body;
              } else {
                  drawBlock(ctx, body, viewOffset, body.label === "roof");
              }
          }
        });
        
        // draw the base block very last (so it renders in front via z-index)
        if (baseBody) {
            drawBlock(ctx, baseBody, viewOffset, false);
        }
        
        // Glitter effect over tower if combo is active
        if (combo > 0 && placed.length > 0) {
            if (Math.random() < 0.1) {
                const topBlock = placed[placed.length - 1];
                const targetSize = topBlock.plugin.isBase ? BASE_SIZE : BLOCK_WIDTH;
                spawnSparkles(topBlock.position.x, topBlock.position.y - viewOffset - targetSize/2, 1);
            }
        }
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

  const startDrag = (y) => { if (isTowerComplete || gameState === 'TOWER_COMPLETE' || gameState === 'GAME_OVER') { isDragging = true; lastY = y; gameContainer.style.cursor = 'grabbing'; } };
  const moveDrag = (y) => { if (isDragging) { const dy = y - lastY; targetViewOffset -= dy; const topY = getStableTopY(); targetViewOffset = Math.max(topY - 200, Math.min(canvasHeight - GROUND_Y_OFFSET - canvasHeight + 100, targetViewOffset)); lastY = y; } };
  const endDrag = () => { isDragging = false; gameContainer.style.cursor = 'grab'; };
  gameContainer.onmousedown = (e) => startDrag(e.clientY);
  
  gameContainer.addEventListener('wheel', (e) => {
      if (isTowerComplete || gameState === 'TOWER_COMPLETE' || gameState === 'GAME_OVER') {
          targetViewOffset += e.deltaY;
          const topY = getStableTopY();
          targetViewOffset = Math.max(topY - 200, Math.min(canvasHeight - GROUND_Y_OFFSET - canvasHeight + 100, targetViewOffset));
      }
  });

  window.onmousemove = (e) => moveDrag(e.clientY);
  window.onmouseup = endDrag;
  gameContainer.ontouchstart = (e) => startDrag(e.touches[0].clientY);
  window.ontouchmove = (e) => { if(isDragging) e.preventDefault(); moveDrag(e.touches[0].clientY); };
  window.ontouchend = endDrag;
  const gameArea = document.getElementById("tower-game-container");
  gameArea.style.touchAction = 'none'; // Eliminate mobile touch delay
  gameArea.onmousedown = (e) => { if(!isDragging && gameState === 'PLAYING') dropBlock(); };
  gameArea.ontouchstart = (e) => { if(!isDragging && gameState === 'PLAYING') { if(e.cancelable) e.preventDefault(); dropBlock(); } };
  window.onkeydown = (e) => { if (e.code === "Space" && gameState === 'PLAYING') dropBlock(); };
}

window.startGame = function() {
    if (!engine) initGame();
    score = 0; combo = 0; comboTimer = 1.0; level = 1; towersCompleted = 0; lives = 3;
    resetTower();
    setGameState('PLAYING');
}

window.nextTower = function() {
    towersCompleted++;
    resetTower();
    setGameState('PLAYING');
}

window.resetGame = function() {
    window.startGame();
};

function resetTower() {
    if (!engine) return;
    Matter.Composite.clear(engine.world);
    placed = []; fallingPeopleOut = []; index = 0; viewOffset = 0; targetViewOffset = 0; isTowerComplete = false; ropeRetractionProgress = 1; isDropping = false; currentBlock = null;
    if (checkInterval) clearInterval(checkInterval);
    groundBody = Matter.Bodies.rectangle(canvasWidth / 2, canvasHeight - GROUND_Y_OFFSET / 2, canvasWidth * 0.7, 30, {
        isStatic: true, label: "ground", friction: 0.8, frictionStatic: 1.5, chamfer: { radius: 4 }, render: { visible: false }
    });
    const wallL = Matter.Bodies.rectangle(-40, canvasHeight * 2, 80, canvasHeight * 8, { isStatic: true, render: { visible: false } });
    const wallR = Matter.Bodies.rectangle(canvasWidth + 40, canvasHeight * 2, 80, canvasHeight * 8, { isStatic: true, render: { visible: false } });
    Matter.Composite.add(engine.world, [groundBody, wallL, wallR]);
    spawnCraneBlock();
}

function retryBlock() {
  Matter.Composite.remove(engine.world, currentBlock);
  spawnCraneBlock();
}

function dropBlock() {
  if (isDropping || isTowerComplete || isDragging || gameState !== 'PLAYING') return;
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
    
    if (currentBlock.position.y > canvasHeight - GROUND_Y_OFFSET + viewOffset + 500) { 
        clearInterval(checkInterval); 
        combo = 0; updateHUD(); lives--;
        if(lives <= 0) setGameState('GAME_OVER');
        else retryBlock(); 
        return; 
    }
    
    if (speed < 0.5 && hasFallen) {
      settledCount++; if (settledCount < 3) return;
      clearInterval(checkInterval);
      const horizontalCenter = canvasWidth / 2;
      const stableBlocks = placed.filter(b => { return Math.abs(b.position.x - horizontalCenter) < BLOCK_WIDTH * 1.5 && Math.abs(b.angle) < 0.5; });
      const lastStable = stableBlocks[stableBlocks.length - 1];
      
      let isMiss = false;
      let referenceWidth = lastStable && lastStable.plugin.isBase ? BASE_SIZE : BLOCK_WIDTH;
      if (lastStable && Math.abs(currentBlock.position.x - lastStable.position.x) > referenceWidth * 0.9) { 
          isMiss = true;
      }
      
      if (isMiss) {
          combo = 0; updateHUD(); lives--;
          spawnFloatingText("Miss!", currentBlock.position.x, currentBlock.position.y - viewOffset, "bad-text");
          if(lives <= 0) setGameState('GAME_OVER');
          else retryBlock();
          return;
      }

      // Calculate accuracy
      let diff = lastStable ? Math.abs(currentBlock.position.x - lastStable.position.x) : Math.abs(currentBlock.position.x - horizontalCenter);
      let accuracy = "Good";
      let points = 50;
      let textClass = "good-text";
      
      if (diff < BLOCK_WIDTH * 0.1) {
          accuracy = "Perfect"; points = 100; textClass = "perfect-text";
          spawnSparkles(currentBlock.position.x, currentBlock.position.y - viewOffset, 5);
      } else if (diff < BLOCK_WIDTH * 0.25) {
          accuracy = "Great"; points = 75; textClass = "great-text";
          spawnSparkles(currentBlock.position.x, currentBlock.position.y - viewOffset, 2);
      } else if (diff < BLOCK_WIDTH * 0.6) {
          accuracy = "Good"; points = 50; textClass = "good-text";
      } else {
          accuracy = "Bad"; points = 20; textClass = "bad-text";
          combo = 0;
      }
      
      if (accuracy === "Perfect" || accuracy === "Great") {
          combo++;
          comboTimer = 1.0;
      }
      
      score += points * Math.max(1, combo);
      level = Math.floor(score / 1000) + 1;
      updateHUD();
      
      const currentTargetSize = currentBlock.plugin.isBase ? BASE_SIZE : BLOCK_WIDTH;
      spawnFloatingText(accuracy, currentBlock.position.x, currentBlock.position.y - viewOffset - currentTargetSize/2, textClass);

      // Flying People Bonus
      if (accuracy !== "Bad" && accuracy !== "Miss") {
          let residentsAdded = 0;
          flyingPeople.forEach(p => {
              const dx = p.x - currentBlock.position.x;
              const dy = p.y - currentBlock.position.y;
              if (Math.sqrt(dx*dx + dy*dy) < currentTargetSize * 1.5) {
                  score += 200;
                  residentsAdded += 1;
                  p.x = canvasWidth + 200; // remove
              }
          });
          if (residentsAdded > 0) {
              currentBlock.plugin.residents = (currentBlock.plugin.residents || 0) + residentsAdded;
              spawnFloatingText("Residents Moved In! +200", currentBlock.position.x, currentBlock.position.y - viewOffset - currentTargetSize, "great-text");
              updateHUD();
          }
      }

      placed.push(currentBlock); index += 1;
      
      if (currentBlock.plugin.isRoof) {
          isTowerComplete = true;
          setTimeout(() => setGameState('TOWER_COMPLETE'), 1000);
      } else {
          setTimeout(() => { if (!engine) return; spawnCraneBlock(); }, 300);
      }
    } else settledCount = 0;
  }, 60);
}

window.openTowerGame = function(diamondElement) {
  if (diamondElement) {
      const rect = diamondElement.getBoundingClientRect();
      const img = diamondElement.querySelector('img') || diamondElement;
      
      const clone = document.createElement('img');
      clone.src = img.src || './src/images/diamong.svg';
      clone.className = 'diamond-transition';
      clone.style.left = rect.left + 'px';
      clone.style.top = rect.top + 'px';
      clone.style.width = rect.width + 'px';
      clone.style.height = rect.height + 'px';
      clone.style.filter = 'none'; // remove grayscale
      document.body.appendChild(clone);
      
      // Force reflow
      void clone.offsetWidth;
      
      clone.style.transform = 'scale(200)';
      
      setTimeout(() => {
          document.getElementById("tower-bloxx-modal").classList.remove("hidden");
          if(!engine) initGame();
          startGame();
          clone.remove();
      }, 700);
      return;
  }

  document.getElementById("tower-bloxx-modal").classList.remove("hidden");
  if(!engine) initGame();
  startGame();
}
window.closeTowerGame = function() { 
  document.getElementById("tower-bloxx-modal").classList.add("hidden"); 
  if (checkInterval) clearInterval(checkInterval);
}
