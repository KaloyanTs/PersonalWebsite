/**
 * Tower Bloxx Personal Portfolio Game
 * Powered by Matter.js
 */

const portfolioData = [
    { type: 'hero', title: 'Kaloyan Tsvetkov', body: 'Master\'s student and Doctoral Researcher.' },
    { type: 'experience', title: 'Ph.D. Student @ INSAIT', body: 'Focusing on AI Safety, LRM Scheming, and Theoretical Foundations.' },
    { type: 'experience', title: 'Teaching Assistant @ FMI', body: 'Conducting tutorials and mentoring undergraduate students in core CS subjects.' },
    { type: 'experience', title: 'Research Intern @ INSAIT', body: 'Early research into AI alignment theories.' },
    { type: 'experience', title: 'Full-Stack Intern @ Astea', body: 'Developed a complex web-based team project utilizing modern stack technologies.' },
    { type: 'experience', title: 'FMI Codes Winner', body: 'Achieved First Place (2024) and Second Place (2023).' },
    { type: 'experience', title: 'National Math Olympiad', body: 'Silver Medalist (2024) and 2x Bronze Medalist (2023, 2025).' },
    { type: 'publication', title: 'The Open Proof Corpus', body: 'ICLR 2026' },
    { type: 'notes', title: 'Discrete Mathematics', body: 'Teaching Notes (PDF)' },
    { type: 'notes', title: 'Design & Analysis of Algorithms', body: 'Teaching Notes (PDF)' },
    { type: 'notes', title: 'Algebra', body: 'Teaching Notes (PDF)' },
    { type: 'contact', title: 'kaloyan.tsvetkov@insait.ai', body: 'Reach out for research collaborations.' }
];

// Map categories to SVGs
const blockImages = {
    'hero': './src/images/block-base.svg',
    'experience': './src/images/block-experience.svg',
    'publication': './src/images/block-publication.svg',
    'notes': './src/images/block-notes.svg',
    'contact': './src/images/block-contact.svg',
    'base': './src/images/block-base.svg',
    'background': './src/images/background.png',
    'cloud': './src/images/cloud.svg',
    'crane-base': './src/images/crane-base.svg',
    'crane-stem': './src/images/crane-stem.svg',
    'crane-top': './src/images/crane-top.svg',
    'profile': './src/images/profile_work.webp'
};

const Engine = Matter.Engine,
      Render = Matter.Render,
      Runner = Matter.Runner,
      Composite = Matter.Composite,
      Constraint = Matter.Constraint,
      Bodies = Matter.Bodies,
      Body = Matter.Body,
      Events = Matter.Events;

class TowerGame {
    constructor() {
        this.container = document.getElementById('game-container');
        // We'll replace the static canvas with a Matter.js renderer
        this.oldCanvas = document.getElementById('gameCanvas');
        if (this.oldCanvas) {
            this.oldCanvas.remove();
        }

        this.width = window.innerWidth;
        this.height = window.innerHeight;

        this.engine = Engine.create();
        this.world = this.engine.world;
        
        // Add subtle physics settings
        this.engine.gravity.y = 1.0; 
        
        this.render = Render.create({
            element: this.container,
            engine: this.engine,
            options: {
                width: this.width,
                height: this.height,
                background: 'transparent',
                wireframes: false,
                hasBounds: true
            }
        });
        
        // Ensure UI stays on top
        this.render.canvas.style.position = 'absolute';
        this.render.canvas.style.top = '0';
        this.render.canvas.style.left = '0';
        this.render.canvas.style.zIndex = '1';
        
        document.getElementById('ui-layer').style.zIndex = '10';

        this.runner = Runner.create();
        
        this.blockWidth = Math.min(this.width * 0.32, 220);
        this.blockHeight = this.blockWidth * 0.65;
        
        this.gameState = 'START'; // START, PLAYING, RECOVERING, GAME_OVER
        this.score = 0;
        this.towerBlocks = [];
        this.currentSwingingBlock = null;
        this.swingAnchor = null;
        this.swingConstraint = null;
        this.isDropping = false;
        this.pendingSpawnTimer = null;
        this.ropeLength = 150;
        this.scrollingEnabled = false;
        this.recoveryTimer = null;

        this.comboStreak = 0;
        this.comboTimer = 0; // 0 to 1
        
        this.cameraY = 0;
        this.particles = [];
        this.shakeAmount = 0;
        this.clouds = this.generateClouds();
        
        this.setupTimeline();

        // Preload images
        this.loadedImages = {};
        Object.keys(blockImages).forEach(key => {
            let img = new Image();
            img.src = blockImages[key];
            this.loadedImages[key] = img;
        });
        
        window.addEventListener('resize', () => this.resize());
        this.initEventListeners();
        
        // Draw the supplied skyline behind the physics canvas, then labels/crane above blocks.
        Events.on(this.render, 'afterRender', () => {
            this.drawClimbingBackground();
            this.drawHUD();
        });
        
        // Periodic wind check
        setInterval(() => this.applyWind(), 1000);
        
        Render.run(this.render);
        
        // Auto start game
        setTimeout(() => this.start(), 100);
    }

    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.render.canvas.width = this.width;
        this.render.canvas.height = this.height;
        this.blockWidth = Math.min(this.width * 0.32, 220);
        this.blockHeight = this.blockWidth * 0.65;
    }

    generateClouds() {
        const clouds = [];
        // Generate clouds towering up into the endless sky
        for (let i = 0; i < 40; i++) {
            clouds.push({
                x: Math.random() * window.innerWidth * 1.5 - window.innerWidth * 0.25,
                y: -Math.random() * 10000 - 500, // Stretch high up
                scale: 0.5 + Math.random() * 1.5,
                speed: 0.2 + Math.random() * 0.5
            });
        }
        return clouds;
    }

    setupTimeline() {
        const timelineContainer = document.getElementById('progress-timeline');
        timelineContainer.innerHTML = '';
        
        let categories = [];
        let seen = new Set();
        portfolioData.forEach((item, index) => {
            if (!seen.has(item.type)) {
                seen.add(item.type);
                categories.push({ type: item.type, firstIndex: index });
            }
        });
        
        categories.forEach(cat => {
            const node = document.createElement('div');
            node.className = 'timeline-node';
            node.id = `timeline-node-${cat.firstIndex}`;
            
            const dot = document.createElement('div');
            dot.className = 'timeline-dot';
            
            const label = document.createElement('div');
            label.className = 'timeline-label';
            label.innerText = cat.type;
            
            node.appendChild(dot);
            node.appendChild(label);
            timelineContainer.appendChild(node);
        });
    }

    initEventListeners() {
        document.getElementById('start-btn').addEventListener('click', () => this.start());
        document.getElementById('restart-btn').addEventListener('click', () => this.start());
        
        // We capture drops when clicking anywhere on the document if PLAYING
        document.addEventListener('mousedown', (e) => {
            // Ignore button clicks
            if (e.target.tagName !== 'BUTTON') {
                this.dropBlock();
            }
        });
        document.addEventListener('touchstart', (e) => {
            if (e.target.tagName !== 'BUTTON') {
                this.dropBlock();
            }
        }, {passive: false});

        // Detect off-screen blocks (game over)
        Events.on(this.engine, 'beforeUpdate', () => {
            this.update();
            if (this.gameState !== 'PLAYING') return;

            // Camera follow
            if (this.towerBlocks.length > 0) {
                const highestBlock = this.towerBlocks[this.towerBlocks.length - 1]; // visually highest is the last stacked
                const targetY = highestBlock.position.y - this.height * 0.6;
                const smoothFactor = 0.05;
                
                let viewY = this.render.bounds.min.y;
                viewY += (targetY - viewY) * smoothFactor;
                
                Render.lookAt(this.render, {
                    min: { x: 0, y: viewY },
                    max: { x: this.width, y: viewY + this.height }
                });
            }

            // Check collapse (blocks falling too low beneath camera view or tipping)
            for (let i = 0; i < this.towerBlocks.length; i++) {
                const block = this.towerBlocks[i];
                // If a block falls too much off the side or falls downwards past absolute ground
                if (Math.abs(block.position.x - this.width / 2) > this.width / 1.5 || block.position.y > this.height + 500) {
                    this.collapseAndContinue();
                    break;
                }
            }

            if (this.currentSwingingBlock && this.isDropping) {
                const missedBelowView = this.currentSwingingBlock.position.y > this.render.bounds.max.y + this.blockHeight * 2;
                const missedSideways = Math.abs(this.currentSwingingBlock.position.x - this.width / 2) > this.width / 1.35;
                if (missedBelowView || missedSideways) {
                    this.collapseAndContinue();
                }
            }
        });

        Events.on(this.engine, 'collisionStart', (event) => this.handleCollisions(event));
    }

    start() {
        if (this.pendingSpawnTimer) {
            clearTimeout(this.pendingSpawnTimer);
            this.pendingSpawnTimer = null;
        }
        if (this.recoveryTimer) {
            clearTimeout(this.recoveryTimer);
            this.recoveryTimer = null;
        }

        Composite.clear(this.world);
        Engine.clear(this.engine);
        
        this.towerBlocks = [];
        this.score = 0;
        this.comboStreak = 0;
        this.comboTimer = 0;
        this.gameState = 'PLAYING';
        this.currentSwingingBlock = null;
        this.swingConstraint = null;
        this.swingAnchor = null;
        this.isDropping = false;
        this.scrollingEnabled = false;

        document.getElementById('progress-timeline').classList.add('hidden');
        Array.from(document.querySelectorAll('.timeline-node')).forEach(n => n.classList.remove('active'));
        
        Render.lookAt(this.render, {
            min: { x: 0, y: 0 },
            max: { x: this.width, y: this.height }
        });
        
        this.createBaseTower();
        
        document.getElementById('start-screen').classList.add('hidden');
        document.getElementById('game-over').classList.add('hidden');
        document.getElementById('glass-dashboard').classList.remove('hidden');
        
        this.updateUI();
        this.updateComboUI();
        this.spawnBlock();
        
        Runner.run(this.runner, this.engine);
    }

    createBaseTower() {
        const groundY = this.height - 25;
        this.ground = Bodies.rectangle(this.width / 2, groundY + 50, this.width * 2, 100, {
            isStatic: true,
            render: { visible: false }
        });

        const baseBlock = Bodies.rectangle(this.width / 2, groundY - this.blockHeight / 2, this.blockWidth, this.blockHeight, {
            isStatic: true,
            render: {
                sprite: this.createSprite('base')
            },
            dataInfo: portfolioData[0]
        });

        Composite.add(this.world, [this.ground, baseBlock]);
        this.towerBlocks.push(baseBlock);
    }

    spawnBlock() {
        if (this.gameState !== 'PLAYING') return;
        if (this.score + 1 >= portfolioData.length) {
            this.victory();
            return;
        }

        const nextData = portfolioData[this.score + 1];
        const texture = blockImages[nextData.type] || blockImages['base'];
        
        // Anchor moves higher based on tower height
        let topY = this.height;
        if (this.towerBlocks.length > 0) {
             topY = this.towerBlocks[this.towerBlocks.length - 1].position.y;
        }
        
        const anchorY = topY - this.height * 0.45;
        this.swingAnchor = { x: this.width / 2, y: anchorY };

        this.currentSwingingBlock = Bodies.rectangle(this.width / 2, anchorY + this.ropeLength, this.blockWidth, this.blockHeight, {
            density: 0.001,
            friction: 0.9,
            frictionStatic: 1,
            restitution: 0,
            dataInfo: nextData, // attach data directly
            render: {
                sprite: this.createSprite(nextData.type)
            }
        });

        this.swingConstraint = Constraint.create({
            pointA: this.swingAnchor,
            bodyB: this.currentSwingingBlock,
            length: this.ropeLength,
            stiffness: 0.04,
            render: { strokeStyle: '#fff', lineWidth: 2 }
        });

        Composite.add(this.world, [this.currentSwingingBlock, this.swingConstraint]);
        this.isDropping = false;
    }

    update() {
        if (this.shakeAmount > 0) {
            this.shakeAmount *= 0.9; // Decay
            if(this.shakeAmount < 0.1) this.shakeAmount = 0;
        }

        // Particle Update TICK
        for(let i = this.particles.length - 1; i >= 0; i--) {
            let p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.2; // gravity
            p.life -= 0.02;
            if(p.life <= 0) this.particles.splice(i, 1);
        }

        if (this.gameState === 'PLAYING') {
            if (this.comboStreak > 0 && !this.isDropping) {
                this.comboTimer -= 0.005; // Deplete timer slowly
                if (this.comboTimer <= 0) {
                    this.comboTimer = 0;
                    this.comboStreak = 0;
                }
                this.updateComboUI();
            }
        }

        if (this.currentSwingingBlock && this.gameState === 'PLAYING' && !this.isDropping) {
            // Simulated pendulum
            const time = Date.now() * 0.0025;
            const amplitude = Math.min(this.width * 0.35, 300);
            const targetX = this.swingAnchor.x + Math.sin(time) * amplitude;
            const previousX = this.currentSwingingBlock.position.x;
            
            const angle = Math.sin(time) * 0.15;
            const yOffset = Math.cos(angle) * this.ropeLength;
            
            Body.setPosition(this.currentSwingingBlock, {
                x: targetX,
                y: this.swingAnchor.y + yOffset
            });
            Body.setVelocity(this.currentSwingingBlock, { x: (targetX - previousX) * 0.25, y: 0 });
            Body.setAngle(this.currentSwingingBlock, angle);
            Body.setAngularVelocity(this.currentSwingingBlock, 0);
        }
    }

    dropBlock() {
        if (!this.currentSwingingBlock || this.gameState !== 'PLAYING' || this.isDropping) return;

        // Disconnect constraint
        Composite.remove(this.world, this.swingConstraint);
        this.isDropping = true;
        
        Body.setVelocity(this.currentSwingingBlock, {
            x: this.currentSwingingBlock.velocity.x,
            y: 1.5
        });
        Body.setAngularVelocity(this.currentSwingingBlock, this.currentSwingingBlock.velocity.x * 0.002);
        this.swingConstraint = null;
    }

    handleCollisions(event) {
        if (!this.currentSwingingBlock || !this.isDropping || this.gameState !== 'PLAYING') return;

        for (const pair of event.pairs) {
            const bodyA = pair.bodyA;
            const bodyB = pair.bodyB;
            const hitCurrent = bodyA === this.currentSwingingBlock || bodyB === this.currentSwingingBlock;
            if (!hitCurrent) continue;

            const other = bodyA === this.currentSwingingBlock ? bodyB : bodyA;
            if (other === this.ground || this.towerBlocks.includes(other)) {
                this.resolveLanding();
                return;
            }
        }
    }

    resolveLanding() {
        const block = this.currentSwingingBlock;
        const topBlock = this.towerBlocks[this.towerBlocks.length - 1];
        if (!block || !topBlock) return;

        const offset = block.position.x - topBlock.position.x;
        const overlap = this.blockWidth - Math.abs(offset);
        const minOverlap = this.blockWidth * 0.32;

        if (overlap < minOverlap) {
            this.shakeAmount = 15;
            this.collapseAndContinue();
            return;
        }

        const perfectWindow = this.blockWidth * 0.08;
        const isPerfect = Math.abs(offset) < perfectWindow;

        // Visual FX
        this.shakeAmount = isPerfect ? 5 : 12;
        const sparkCount = isPerfect ? 30 : 15;
        const sparkColor = isPerfect ? '#ffd95a' : '#d2dae2';
        for(let i=0; i<sparkCount; i++) {
            this.particles.push({
                x: block.position.x + (Math.random() - 0.5) * this.blockWidth,
                y: topBlock.position.y - this.blockHeight,
                vx: (Math.random() - 0.5) * (isPerfect ? 15 : 8),
                vy: -Math.random() * (isPerfect ? 10 : 5),
                life: 1.0 + Math.random() * 0.5,
                size: 2 + Math.random() * 4,
                color: sparkColor
            });
        }

        if (isPerfect) {
            this.comboStreak++;
            this.comboTimer = 1.0;
        } else {
            this.comboStreak = 0;
            this.comboTimer = 0;
        }
        this.updateComboUI();

        const assistedOffset = isPerfect ? 0 : offset * 0.45;
        const finalX = this.clamp(
            topBlock.position.x + assistedOffset,
            this.blockWidth / 2,
            this.width - this.blockWidth / 2
        );
        const finalY = topBlock.position.y - this.blockHeight;

        Body.setPosition(block, { x: finalX, y: finalY });
        Body.setAngle(block, this.clamp(offset / this.blockWidth * 0.07, -0.075, 0.075));
        Body.setVelocity(block, { x: 0, y: 0 });
        Body.setAngularVelocity(block, 0);
        Body.setStatic(block, true);

        this.towerBlocks.push(block);
        this.currentSwingingBlock = null;
        this.isDropping = false;
        this.score++;
        this.updateUI();

        this.pendingSpawnTimer = setTimeout(() => {
            this.pendingSpawnTimer = null;
            if (this.gameState === 'PLAYING') {
                this.spawnBlock();
            }
        }, 450);
    }

    applyWind() {
        if (this.gameState !== 'PLAYING' || this.score < 3 || this.towerBlocks.length === 0) return;
        
        // Apply tiny random horizontal forces to blocks to simulate wind & increase instability over time
        const windIntensity = (this.score * 0.0001) * (Math.random() > 0.5 ? 1 : -1);
        
        for (let i = 1; i < this.towerBlocks.length; i++) {
             // Sway force relative to height
             Body.applyForce(this.towerBlocks[i], this.towerBlocks[i].position, { x: windIntensity * (i/this.towerBlocks.length), y: 0 });
        }
    }

    createSprite(type) {
        const texture = blockImages[type] || blockImages['base'];
        const scale = this.blockWidth / 160;

        return {
            texture,
            xScale: scale,
            yScale: scale
        };
    }

    drawClimbingBackground() {
        const ctx = this.render.context;
        const bg = this.loadedImages['background'];
        const cloudImg = this.loadedImages['cloud'];

        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalCompositeOperation = 'destination-over';
        ctx.imageSmoothingEnabled = false;
        
        let drawY = this.height;

        if (bg && bg.complete && bg.naturalWidth > 0) {
            const imgAspect = bg.naturalWidth / bg.naturalHeight;
            const viewAspect = this.width / this.height;
            let drawW = this.width;
            let drawH = drawW / imgAspect;

            if (drawH < this.height * 0.5) {
                drawH = this.height * 0.5;
                drawW = drawH * imgAspect;
            }

            const cameraClimb = Math.max(0, -this.render.bounds.min.y);
            const climbShift = cameraClimb * 0.5; // Parallax
            const drawX = (this.width - drawW) / 2;
            drawY = this.height - drawH + climbShift;

            ctx.drawImage(bg, drawX, drawY, drawW, drawH);
        }
        
        // Draw endless custom clouds above the background image
        if (cloudImg && cloudImg.complete) {
           const cameraClimb = Math.max(0, -this.render.bounds.min.y);
           this.clouds.forEach(cloud => {
               // Move clouds slowly horizontally
               cloud.x += cloud.speed;
               if(cloud.x > this.width * 1.5) cloud.x = -this.width * 0.5;
               
               const cY = cloud.y + cameraClimb * 0.8; // Deep parallax
               
               // Only draw if on screen
               if(cY > -200 && cY < this.height) {
                   ctx.globalAlpha = 0.8;
                   ctx.drawImage(cloudImg, cloud.x, cY, 160 * cloud.scale, 160 * cloud.scale);
                   ctx.globalAlpha = 1.0;
               }
           });
        }

        const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
        // Deeper sky gradient
        gradient.addColorStop(0, '#0d8bc4');
        gradient.addColorStop(0.4, '#1ba9f4');
        gradient.addColorStop(1, '#a9edf5');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.width, this.height);

        ctx.restore();
    }

    drawHUD() {
        if (this.gameState !== 'PLAYING') return;
        const ctx = this.render.context;
        // Draw text info over blocks. We do this after render.
        
        ctx.save();
        this.applyWorldTransform(ctx);
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        
        this.towerBlocks.forEach(block => {
            if (block.dataInfo) {
                // Static text to the right of the tower
                const infoX = this.width / 2 + this.blockWidth * 0.7; // fixed safely to the right
                const infoY = block.position.y;
                
                ctx.save();
                ctx.translate(infoX, infoY);
                // No rotation! Keep it static
                
                // Draw connecting line to block
                ctx.beginPath();
                ctx.moveTo(block.position.x + this.blockWidth/2 - infoX, 0); // from block edge
                ctx.lineTo(-10, 0); // to info background
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
                ctx.lineWidth = 1;
                ctx.stroke();

                ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                ctx.fillRect(0, -15, 220, 30);
                
                ctx.fillStyle = '#2f3542';
                ctx.textAlign = 'left';
                ctx.fillText(block.dataInfo.title, 10, +5);
                
                ctx.restore();
            }
        });
        
        if (this.currentSwingingBlock && this.currentSwingingBlock.dataInfo) {
            let block = this.currentSwingingBlock;
            const infoX = this.width / 2 + this.blockWidth * 0.7;
            const infoY = this.swingAnchor.y + this.ropeLength; // keep it somewhat static relative to anchor height
            
            ctx.save();
            ctx.translate(infoX, infoY);
            
            ctx.beginPath();
            ctx.moveTo(block.position.x + this.blockWidth/2 - infoX, block.position.y - infoY); 
            ctx.lineTo(-10, 0);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.lineWidth = 1;
            ctx.stroke();

            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.fillRect(0, -15, 220, 30);
            ctx.fillStyle = '#2f3542';
            ctx.textAlign = 'left';
            ctx.fillText(block.dataInfo.title, 10, +5);
            ctx.restore();
        }

        // Draw Modular Crane
        const cBaseImg = this.loadedImages['crane-base'];
        const cStemImg = this.loadedImages['crane-stem'];
        const cTopImg = this.loadedImages['crane-top'];
        
        if (cBaseImg && cStemImg && cTopImg && cTopImg.complete && this.swingAnchor) {
            const topScale = (this.blockWidth * 1.5) / 100;
            
            const craneTopW = 100 * topScale;
            const craneTopH = 94 * topScale;
            
            // Hook is at x=87, y=94 in the 100x94 crane-top.svg
            const craneTopX = this.swingAnchor.x - 87 * topScale;
            const craneTopY = this.swingAnchor.y - 94 * topScale;
            
            // Stem width 16, connects at x=44 in crane-top.svg, y=82
            const stemW = 16 * topScale;
            const stemH = 32 * topScale;
            const stemX = craneTopX + 44 * topScale;
            const stemTopY = craneTopY + 82 * topScale;
            
            // Base connects at x=12 in the 40x18 crane-base.svg
            const baseW = 40 * topScale;
            const baseH = 18 * topScale;
            const baseX = stemX - 12 * topScale;
            
            const groundY = this.height - 25 + 50 - 100/2; // Ground surface
            const baseY = groundY - baseH;
            
            // Draw Stem tiles down to ground (limit loop to visible area for performance)
            const maxVisibleY = this.render.bounds.max.y + 100;
            const stemEndY = Math.min(baseY, maxVisibleY);
            
            for(let yIt = stemTopY; yIt < stemEndY; yIt += stemH) {
                 ctx.drawImage(cStemImg, stemX, yIt, stemW, stemH + 1); // +1 prevents subpixel gaps
            }
            
            // Draw Base if visible
            if (baseY < maxVisibleY) {
                ctx.drawImage(cBaseImg, baseX, baseY, baseW, baseH);
            }

            // Avatar inside cabin 
            if (this.loadedImages['profile'] && this.loadedImages['profile'].complete) {
                const profileImg = this.loadedImages['profile'];
                const cabinX = craneTopX + 50 * topScale; // Cabin center is around x=50, y=56
                const cabinY = craneTopY + 56 * topScale;
                const avatarRadius = 12 * topScale;
                
                ctx.save();
                ctx.beginPath();
                ctx.arc(cabinX, cabinY, avatarRadius, 0, 2 * Math.PI);
                ctx.clip();
                ctx.drawImage(profileImg, cabinX - avatarRadius, cabinY - avatarRadius, avatarRadius * 2, avatarRadius * 2);
                ctx.restore();
            }

            ctx.drawImage(cTopImg, craneTopX, craneTopY, craneTopW, craneTopH);
            
            // Draw rope
            if (this.currentSwingingBlock) {
                ctx.beginPath();
                ctx.moveTo(this.swingAnchor.x, this.swingAnchor.y);
                ctx.lineTo(this.currentSwingingBlock.position.x, this.currentSwingingBlock.position.y - this.blockHeight / 2);
                ctx.strokeStyle = '#333333';
                ctx.lineWidth = 6;
                ctx.stroke();
                
                ctx.beginPath();
                ctx.moveTo(this.swingAnchor.x, this.swingAnchor.y);
                ctx.lineTo(this.currentSwingingBlock.position.x, this.currentSwingingBlock.position.y - this.blockHeight / 2);
                ctx.strokeStyle = '#666666';
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        }

        // Draw Sparks
        this.particles.forEach(p => {
            if(p.life > 0) {
                ctx.globalAlpha = p.life;
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
                ctx.fill();
            }
        });
        ctx.globalAlpha = 1.0;

        ctx.restore();
    }

    clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    applyWorldTransform(ctx) {
        const bounds = this.render.bounds;
        const boundsWidth = bounds.max.x - bounds.min.x;
        const boundsHeight = bounds.max.y - bounds.min.y;
        const scaleX = boundsWidth / this.width;
        const scaleY = boundsHeight / this.height;

        ctx.scale(1 / scaleX, 1 / scaleY);
        ctx.translate(-bounds.min.x, -bounds.min.y);

        if (this.shakeAmount > 0.1) {
            ctx.translate((Math.random() - 0.5) * this.shakeAmount, (Math.random() - 0.5) * this.shakeAmount);
        }
    }

    updateComboUI() {
        const comboDisplay = document.querySelector('.combo-section');
        const comboText = document.getElementById('combo-text');
        const comboBar = document.getElementById('combo-timer-bar');

        if (this.comboStreak > 0) {
            comboText.innerText = `x${1 + this.comboStreak * 0.5}`;
            comboBar.style.width = `${this.comboTimer * 100}%`;
            if (this.comboTimer < 0.3) {
                comboBar.style.backgroundColor = '#e55039';
            } else {
                comboBar.style.backgroundColor = '#ffb142';
            }
        } else {
            comboText.innerText = `x1`;
            comboBar.style.width = `0%`;
        }
    }

    updateUI() {
        document.getElementById('current-score').innerText = `${this.score * 10}m`;
        
        let lastData = portfolioData[Math.min(this.score, portfolioData.length - 1)] || portfolioData[0];
        if (this.towerBlocks.length > 1) {
             const highest = this.towerBlocks[this.towerBlocks.length - 1];
             if(highest.dataInfo) lastData = highest.dataInfo;
        }
        document.getElementById('last-milestone').innerText = `${lastData.title}`;

        let nextData = portfolioData[Math.min(this.score + 1, portfolioData.length - 1)] || portfolioData[0];
        document.getElementById('next-block-name').innerText = nextData.type.toUpperCase();

        // Timeline UI update
        const timelineContainer = document.getElementById('progress-timeline');
        if (this.score > 0) timelineContainer.classList.remove('hidden');
        
        portfolioData.forEach((item, index) => {
            if (index <= this.score) {
                const node = document.getElementById(`timeline-node-${index}`);
                if (node && !node.classList.contains('active')) {
                    node.classList.add('active');
                }
            }
        });
    }

    collapseAndContinue() {
        if (this.gameState !== 'PLAYING') return;

        this.comboStreak = 0;
        this.updateComboUI();

        // Identify falling blocks and remove them
        let removalCount = 0;
        for (let i = this.towerBlocks.length - 1; i >= 1; i--) {
            const block = this.towerBlocks[i];
            if (Math.abs(block.position.x - this.width / 2) > this.width / 1.5 || block.position.y > this.height + 500) {
                Composite.remove(this.world, block);
                this.towerBlocks.splice(i, 1);
                removalCount++;
            }
        }

        if (this.currentSwingingBlock) {
            Composite.remove(this.world, this.currentSwingingBlock);
            if (this.swingConstraint) {
                Composite.remove(this.world, this.swingConstraint);
            }
            this.currentSwingingBlock = null;
            this.swingConstraint = null;
            this.isDropping = false;
        }

        this.score = Math.max(0, this.towerBlocks.length - 1);
        this.updateUI();

        this.gameState = 'RECOVERING';
        this.recoveryTimer = setTimeout(() => this.rebuildAfterFall(), 800);
    }

    rebuildAfterFall() {
        if (this.gameState !== 'RECOVERING') return;

        this.currentSwingingBlock = null;
        this.swingConstraint = null;
        this.swingAnchor = null;
        this.isDropping = false;
        this.gameState = 'PLAYING';
        this.recoveryTimer = null;

        this.updateUI();
        this.spawnBlock();
    }

    gameOver() {
        this.collapseAndContinue();
    }

    victory() {
        if (this.gameState === 'GAME_OVER') return;

        this.gameState = 'GAME_OVER';
        // document.getElementById('game-over').classList.remove('hidden');
        
        document.getElementById('current-score').innerText = 'Tower Completed perfectly! Scroll to explore!';
        
        this.startConfetti();
        this.enableScrolling();
    }

    releaseTower() {
        this.towerBlocks.forEach((block, index) => {
            if (index === 0) return;

            Body.setStatic(block, false);
            Body.setVelocity(block, {
                x: (Math.random() - 0.5) * 6,
                y: -Math.random() * 2
            });
            Body.setAngularVelocity(block, (Math.random() - 0.5) * 0.12);
        });

        if (this.currentSwingingBlock) {
            if (this.swingConstraint) {
                Composite.remove(this.world, this.swingConstraint);
            }
            Body.setStatic(this.currentSwingingBlock, false);
            this.swingConstraint = null;
            this.isDropping = true;
        }
    }

    startConfetti() {
        const colors = ['#ff4757', '#2ed573', '#1e90ff', '#ffa502', '#eccc68'];
        for (let i = 0; i < 150; i++) {
            const conf = document.createElement('div');
            conf.className = 'confetti';
            conf.style.left = Math.random() * 100 + 'vw';
            conf.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            conf.style.animationDuration = (Math.random() * 3 + 2) + 's';
            conf.style.animationDelay = (Math.random() * 2) + 's';
            document.body.appendChild(conf);
        }
    }

    enableScrolling() {
        if (this.scrollingEnabled) return;

        this.scrollingEnabled = true;

        // Allow zooming up and down the tower via wheel and touch
        window.addEventListener('wheel', (e) => {
            if (this.gameState === 'GAME_OVER') {
                const scrollSpeed = 1.5;
                let viewY = this.render.bounds.min.y + e.deltaY * scrollSpeed;
                
                Render.lookAt(this.render, {
                    min: { x: 0, y: viewY },
                    max: { x: this.width, y: viewY + this.height }
                });
            }
        });
        
        let lastTouchY = 0;
        window.addEventListener('touchstart', e => {
            if (this.gameState === 'GAME_OVER') {
                lastTouchY = e.touches[0].clientY;
            }
        }, {passive: true});
        
        window.addEventListener('touchmove', e => {
            if (this.gameState === 'GAME_OVER') {
                let deltaY = lastTouchY - e.touches[0].clientY;
                lastTouchY = e.touches[0].clientY;
                let viewY = this.render.bounds.min.y + deltaY * 2;
                
                Render.lookAt(this.render, {
                    min: { x: 0, y: viewY },
                    max: { x: this.width, y: viewY + this.height }
                });
            }
        }, {passive: true});
    }
}

// Initialize game when page loads
window.onload = () => {
    new TowerGame();
};
