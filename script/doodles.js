(function () {
    'use strict';

    const canvas = document.createElement('canvas');
    canvas.id = 'doodle-canvas';
    document.body.prepend(canvas);

    const ctx = canvas.getContext('2d');
    let width, height;

    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }

    window.addEventListener('resize', resize);
    resize();

    class Blob {
        constructor() {
            this.reset();
        }

        reset() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.size = 50 + Math.random() * 100;
            this.points = [];
            const numPoints = 8 + Math.floor(Math.random() * 6);
            for (let i = 0; i < numPoints; i++) {
                this.points.push({
                    angle: (i / numPoints) * Math.PI * 2,
                    dist: 0.8 + Math.random() * 0.4
                });
            }
            this.vx = (Math.random() - 0.5) * 0.5;
            this.vy = (Math.random() - 0.5) * 0.5;
            
            const uglyColors = [
                'rgba(255, 0, 0, 0.05)',   // Red
                'rgba(0, 255, 0, 0.05)',   // Lime
                'rgba(0, 0, 255, 0.05)',   // Blue
                'rgba(255, 255, 0, 0.05)', // Yellow
                'rgba(255, 0, 255, 0.05)', // Magenta
                'rgba(0, 255, 255, 0.05)', // Cyan
                'rgba(128, 128, 0, 0.05)', // Olive
                'rgba(128, 0, 128, 0.05)'  // Purple
            ];
            this.color = uglyColors[Math.floor(Math.random() * uglyColors.length)];
            this.time = Math.random() * 1000;
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;

            // Chaotic nudges
            this.vx += (Math.random() - 0.5) * 0.02;
            this.vy += (Math.random() - 0.5) * 0.02;

            // Limit velocity
            const maxV = 0.8;
            this.vx = Math.max(-maxV, Math.min(maxV, this.vx));
            this.vy = Math.max(-maxV, Math.min(maxV, this.vy));

            // Wrap around screen
            if (this.x < -this.size * 2) this.x = width + this.size * 2;
            if (this.x > width + this.size * 2) this.x = -this.size * 2;
            if (this.y < -this.size * 2) this.y = height + this.size * 2;
            if (this.y > height + this.size * 2) this.y = -this.size * 2;

            this.time += 0.01;
        }

        draw() {
            ctx.beginPath();
            for (let i = 0; i <= this.points.length; i++) {
                const p = this.points[i % this.points.length];
                const angle = p.angle + Math.sin(this.time + i) * 0.1;
                const dist = this.size * p.dist * (1 + Math.sin(this.time * 0.5 + i) * 0.1);
                const px = this.x + Math.cos(angle) * dist;
                const py = this.y + Math.sin(angle) * dist;
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.fillStyle = this.color;
            ctx.strokeStyle = 'rgba(0,0,0,0.1)';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.fill();
        }
    }

    class Squiggle {
        constructor() {
            this.reset();
        }

        reset() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.points = [];
            const numPoints = 5 + Math.floor(Math.random() * 5);
            let cx = 0, cy = 0;
            for (let i = 0; i < numPoints; i++) {
                cx += (Math.random() - 0.5) * 40;
                cy += (Math.random() - 0.5) * 40;
                this.points.push({ x: cx, y: cy });
            }
            this.vx = (Math.random() - 0.5) * 0.3;
            this.vy = (Math.random() - 0.5) * 0.3;
            this.time = Math.random() * 1000;
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;
            this.vx += (Math.random() - 0.5) * 0.01;
            this.vy += (Math.random() - 0.5) * 0.01;

            if (this.x < -100) this.x = width + 100;
            if (this.x > width + 100) this.x = -100;
            if (this.y < -100) this.y = height + 100;
            if (this.y > height + 100) this.y = -100;

            this.time += 0.02;
        }

        draw() {
            ctx.beginPath();
            ctx.moveTo(this.x + this.points[0].x, this.y + this.points[0].y);
            for (let i = 1; i < this.points.length; i++) {
                const p = this.points[i];
                const noiseX = Math.sin(this.time + i) * 5;
                const noiseY = Math.cos(this.time + i) * 5;
                ctx.lineTo(this.x + p.x + noiseX, this.y + p.y + noiseY);
            }
            ctx.strokeStyle = 'rgba(0,0,0,0.15)';
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }
    }

    const elements = [];
    for (let i = 0; i < 8; i++) {
        elements.push(new Blob());
    }
    for (let i = 0; i < 15; i++) {
        elements.push(new Squiggle());
    }

    function animate() {
        ctx.clearRect(0, 0, width, height);
        elements.forEach(el => {
            el.update();
            el.draw();
        });
        requestAnimationFrame(animate);
    }

    animate();
})();
