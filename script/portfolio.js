const {
    AMBIENT_BLOB_SETTINGS,
    applyPortfolioCssConstants,
    ORB_NODE_VECTORS,
    ORB_SETTINGS,
    RUNTIME_SETTINGS,
    SECTION_IDS,
    UI_SETTINGS,
    WIREFRAME_SETTINGS,
    WORLD_NORTH
} = globalThis.PortfolioConstants;

applyPortfolioCssConstants();

(function () {
    'use strict';

    const TEST_MODE = new URLSearchParams(window.location.search).get(RUNTIME_SETTINGS.testModeParameter) === RUNTIME_SETTINGS.testModeValue;
    const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const mobileLayoutQuery = window.matchMedia(RUNTIME_SETTINGS.compactLayoutMediaQuery);
    if (TEST_MODE) document.documentElement.dataset.testMode = '1';
    let gameLoadPromise = null;
    let ambientBlobs = null;

    const createSeededRandom = settings => {
        let seed = settings.deterministicSeed;
        return () => {
            seed |= 0;
            seed = seed + settings.randomIncrement | 0;
            let value = Math.imul(seed ^ seed >>> 15, 1 | seed);
            value = value + Math.imul(value ^ value >>> 7, 61 | value) ^ value;
            return ((value ^ value >>> 14) >>> 0) / settings.randomDivisor;
        };
    };

    const loadScript = source => new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = source;
        script.onload = resolve;
        script.onerror = () => reject(new Error(`Unable to load ${source}`));
        document.head.appendChild(script);
    });

    function lazyOpenTowerGame(diamondElement) {
        if (!gameLoadPromise) {
            gameLoadPromise = loadScript(RUNTIME_SETTINGS.gameScripts[0])
                .then(() => loadScript(RUNTIME_SETTINGS.gameScripts[1]));
        }
        gameLoadPromise.then(() => {
            if (window.openTowerGame !== lazyOpenTowerGame) window.openTowerGame(diamondElement);
        }).catch(error => console.error(error));
    }
    window.openTowerGame = lazyOpenTowerGame;

    const normalizeVector = (vector) => {
        const length = Math.hypot(vector[0], vector[1], vector[2]) || 1;
        return vector.map(value => value / length);
    };
    const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
    const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    const quatDot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
    const cross = (a, b) => [
        a[1] * b[2] - a[2] * b[1],
        a[2] * b[0] - a[0] * b[2],
        a[0] * b[1] - a[1] * b[0]
    ];

    const NODE_DIRECTIONS = Object.fromEntries(Object.entries(ORB_NODE_VECTORS)
        .map(([section, vector]) => [section, normalizeVector(vector)]));

    function initAmbientBlobs() {
        const blobs = Array.from(document.querySelectorAll('.pastel-shape'));
        const settings = AMBIENT_BLOB_SETTINGS;
        const random = TEST_MODE ? createSeededRandom(settings) : Math.random;
        const bounds = { width: window.innerWidth, height: window.innerHeight };
        let frameId = 0;
        let lastTime = performance.now();

        const states = blobs.map((blob, index) => {
            const pointCount = settings.minimumPoints + Math.floor(random() * settings.additionalPointRange);
            const points = [];
            for (let pointIndex = 0; pointIndex < pointCount; pointIndex += 1) {
                const interval = Math.PI * 2 / pointCount;
                const angle = -Math.PI / 2 + pointIndex * interval + (random() - 0.5) * interval * settings.pointAngleJitter;
                const radius = settings.minimumPointRadius + random() * settings.pointRadiusRange;
                const x = 50 + Math.cos(angle) * 50 * radius;
                const y = 50 + Math.sin(angle) * 50 * radius;
                points.push(`${x.toFixed(1)}% ${y.toFixed(1)}%`);
            }

            const widthVw = settings.minimumWidthVw + random() * settings.widthRangeVw;
            const heightVh = settings.minimumHeightVh + random() * settings.heightRangeVh;
            const width = bounds.width * widthVw / 100;
            const height = bounds.height * heightVh / 100;
            const speed = settings.minimumSpeedPxPerSecond + random() * settings.speedRangePxPerSecond;
            const heading = random() * Math.PI * 2;
            let velocityX = Math.cos(heading) * speed;
            let velocityY = Math.sin(heading) * speed;
            if (Math.abs(velocityX) < settings.minimumVelocityComponent) {
                velocityX = (velocityX < 0 ? -1 : 1) * settings.minimumVelocityComponent;
            }
            if (Math.abs(velocityY) < settings.minimumVelocityComponent) {
                velocityY = (velocityY < 0 ? -1 : 1) * settings.minimumVelocityComponent;
            }

            blob.style.width = `${widthVw.toFixed(2)}vw`;
            blob.style.height = `${heightVh.toFixed(2)}vh`;
            blob.style.background = settings.palette[(index + Math.floor(random() * settings.palette.length)) % settings.palette.length];
            blob.style.opacity = (settings.minimumOpacity + random() * settings.opacityRange).toFixed(2);
            blob.style.clipPath = `polygon(${points.join(',')})`;
            return {
                blob,
                width,
                height,
                x: random() * Math.max(0, bounds.width - width),
                y: random() * Math.max(0, bounds.height - height),
                velocityX,
                velocityY,
                rotation: (random() - 0.5) * settings.initialRotationRangeDegrees,
                rotationVelocity: (random() < 0.5 ? -1 : 1) * (
                    settings.minimumRotationDegreesPerSecond + random() * settings.rotationSpeedRangeDegreesPerSecond
                )
            };
        });

        const paint = state => {
            state.blob.style.transform = `translate3d(${state.x.toFixed(2)}px, ${state.y.toFixed(2)}px, 0) rotate(${state.rotation.toFixed(2)}deg)`;
        };

        const step = deltaSeconds => {
            states.forEach(state => {
                const maximumX = Math.max(0, bounds.width - state.width);
                const maximumY = Math.max(0, bounds.height - state.height);
                state.x += state.velocityX * deltaSeconds;
                state.y += state.velocityY * deltaSeconds;
                state.rotation += state.rotationVelocity * deltaSeconds;

                if (state.x <= 0) {
                    state.x = 0;
                    state.velocityX = Math.abs(state.velocityX);
                } else if (state.x >= maximumX) {
                    state.x = maximumX;
                    state.velocityX = -Math.abs(state.velocityX);
                }
                if (state.y <= 0) {
                    state.y = 0;
                    state.velocityY = Math.abs(state.velocityY);
                } else if (state.y >= maximumY) {
                    state.y = maximumY;
                    state.velocityY = -Math.abs(state.velocityY);
                }
                paint(state);
            });
        };

        const resize = () => {
            bounds.width = window.innerWidth;
            bounds.height = window.innerHeight;
            states.forEach(state => {
                state.width = state.blob.offsetWidth;
                state.height = state.blob.offsetHeight;
                state.x = clamp(state.x, 0, Math.max(0, bounds.width - state.width));
                state.y = clamp(state.y, 0, Math.max(0, bounds.height - state.height));
                paint(state);
            });
        };

        const tick = now => {
            frameId = 0;
            const deltaSeconds = Math.min((now - lastTime) / 1000, settings.maximumFrameDeltaSeconds);
            lastTime = now;
            step(deltaSeconds);
            if (!TEST_MODE && !reduceMotionQuery.matches && document.visibilityState === 'visible') {
                frameId = requestAnimationFrame(tick);
            }
        };

        const start = () => {
            if (!frameId && !TEST_MODE && !reduceMotionQuery.matches && document.visibilityState === 'visible') {
                lastTime = performance.now();
                frameId = requestAnimationFrame(tick);
            }
        };

        resize();
        start();
        window.addEventListener('resize', resize);
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') start();
            else if (frameId) {
                cancelAnimationFrame(frameId);
                frameId = 0;
            }
        });
        reduceMotionQuery.addEventListener('change', event => {
            if (event.matches && frameId) {
                cancelAnimationFrame(frameId);
                frameId = 0;
            } else if (!event.matches) start();
        });

        return {
            getState: () => states.map(state => ({
                x: state.x,
                y: state.y,
                width: state.width,
                height: state.height,
                velocityX: state.velocityX,
                velocityY: state.velocityY,
                speed: Math.hypot(state.velocityX, state.velocityY)
            })),
            step
        };
    }

    const quatNormalize = (q) => {
        const length = Math.hypot(q[0], q[1], q[2], q[3]) || 1;
        return q.map(value => value / length);
    };
    const quatMultiply = (a, b) => [
        a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1],
        a[3] * b[1] - a[0] * b[2] + a[1] * b[3] + a[2] * b[0],
        a[3] * b[2] + a[0] * b[1] - a[1] * b[0] + a[2] * b[3],
        a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2]
    ];
    const quatFromAxisAngle = (axis, angle) => {
        const normalizedAxis = normalizeVector(axis);
        const half = angle / 2;
        const sine = Math.sin(half);
        return [normalizedAxis[0] * sine, normalizedAxis[1] * sine, normalizedAxis[2] * sine, Math.cos(half)];
    };
    const quatRotate = (q, vector) => {
        const qv = [q[0], q[1], q[2]];
        const uv = cross(qv, vector);
        const uuv = cross(qv, uv);
        return [
            vector[0] + 2 * (q[3] * uv[0] + uuv[0]),
            vector[1] + 2 * (q[3] * uv[1] + uuv[1]),
            vector[2] + 2 * (q[3] * uv[2] + uuv[2])
        ];
    };
    const quatFromUnitVectors = (from, to) => {
        let real = 1 + dot(from, to);
        let imaginary;
        if (real < 0.000001) {
            real = 0;
            imaginary = Math.abs(from[0]) > Math.abs(from[2])
                ? [-from[1], from[0], 0]
                : [0, -from[2], from[1]];
        } else {
            imaginary = cross(from, to);
        }
        return quatNormalize([imaginary[0], imaginary[1], imaginary[2], real]);
    };
    const quatSlerp = (start, end, amount) => {
        let target = end.slice();
        let cosine = start[0] * target[0] + start[1] * target[1] + start[2] * target[2] + start[3] * target[3];
        if (cosine < 0) {
            target = target.map(value => -value);
            cosine = -cosine;
        }
        if (cosine > 0.9995) {
            return quatNormalize(start.map((value, index) => value + amount * (target[index] - value)));
        }
        const angle = Math.acos(clamp(cosine, -1, 1));
        const sine = Math.sin(angle);
        const a = Math.sin((1 - amount) * angle) / sine;
        const b = Math.sin(amount * angle) / sine;
        return start.map((value, index) => value * a + target[index] * b);
    };
    const quatToMatrix = (q) => {
        const [x, y, z, w] = q;
        const x2 = x + x, y2 = y + y, z2 = z + z;
        const xx = x * x2, xy = x * y2, xz = x * z2;
        const yy = y * y2, yz = y * z2, zz = z * z2;
        const wx = w * x2, wy = w * y2, wz = w * z2;
        return new Float32Array([
            1 - (yy + zz), xy + wz, xz - wy, 0,
            xy - wz, 1 - (xx + zz), yz + wx, 0,
            xz + wy, yz - wx, 1 - (xx + yy), 0,
            0, 0, 0, 1
        ]);
    };
    const easeOutQuint = value => 1 - Math.pow(1 - value, 5);
    const createInitialSpinAxis = () => {
        if (TEST_MODE) return normalizeVector(ORB_SETTINGS.initialAxis.testVector);
        let candidate;
        do {
            candidate = [Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1];
        } while (Math.hypot(...candidate) < ORB_SETTINGS.initialAxis.minimumRandomLength);
        return normalizeVector(candidate);
    };

    const createCountedSequence = counts => Object.entries(counts)
        .flatMap(([value, count]) => Array.from({ length: count }, () => value));

    const shuffled = (values, random) => {
        const copy = values.slice();
        for (let index = copy.length - 1; index > 0; index -= 1) {
            const target = Math.floor(random() * (index + 1));
            [copy[index], copy[target]] = [copy[target], copy[index]];
        }
        return copy;
    };

    function createOrbitalPath(configuration) {
        const {
            normal: sourceNormal,
            offset,
            radius,
            startAngle,
            sweep,
            segments,
            wobble,
            wobbleFrequency,
            wobblePhase
        } = configuration;
        const normal = normalizeVector(sourceNormal);
        const reference = Math.abs(normal[1]) < 0.88 ? [0, 1, 0] : [1, 0, 0];
        const basisU = normalizeVector(cross(normal, reference));
        const basisV = normalizeVector(cross(normal, basisU));
        const orbitalRadius = Math.sqrt(Math.max(0.01, radius * radius - offset * offset));
        const points = [];
        for (let index = 0; index <= segments; index += 1) {
            const progress = index / segments;
            const angle = startAngle + sweep * progress;
            const irregularity = 1
                + Math.sin(angle * wobbleFrequency + wobblePhase) * wobble
                + Math.sin(angle * (wobbleFrequency + 1.37) - wobblePhase) * wobble * 0.32;
            const cosine = Math.cos(angle) * orbitalRadius * irregularity;
            const sine = Math.sin(angle) * orbitalRadius * irregularity;
            points.push([
                normal[0] * offset + basisU[0] * cosine + basisV[0] * sine,
                normal[1] * offset + basisU[1] * cosine + basisV[1] * sine,
                normal[2] * offset + basisU[2] * cosine + basisV[2] * sine
            ]);
        }
        return points;
    }

    function splitDashedPath(points, dashPoints, gapPoints) {
        const paths = [];
        let index = 0;
        while (index < points.length - 1) {
            const end = Math.min(points.length, index + dashPoints);
            if (end - index > 1) paths.push(points.slice(index, end));
            index = end + gapPoints;
        }
        return paths;
    }

    function createRibbonGeometry(paths) {
        const positions = [];
        const others = [];
        const sides = [];
        const addVertex = (position, other, side) => {
            positions.push(...position);
            others.push(...other);
            sides.push(side);
        };
        paths.forEach(path => {
            for (let index = 0; index < path.length - 1; index += 1) {
                const start = path[index];
                const end = path[index + 1];
                addVertex(start, end, 1);
                addVertex(start, end, -1);
                addVertex(end, start, -1);
                addVertex(end, start, -1);
                addVertex(start, end, -1);
                addVertex(end, start, 1);
            }
        });
        return { positions, others, sides };
    }

    function createCorePaths(radius) {
        const vertices = [
            [0.06, 1, -0.05],
            [-0.08, -0.91, 0.07],
            [0.97, 0.03, 0.11],
            [-0.88, -0.08, -0.16],
            [0.04, 0.14, 0.94],
            [0.13, -0.11, -0.86]
        ].map(point => normalizeVector(point).map(value => value * radius));
        const edges = [
            [0, 2], [0, 4], [0, 3], [0, 5],
            [1, 2], [1, 4], [1, 3], [1, 5],
            [2, 4], [4, 3], [3, 5], [5, 2]
        ];
        return edges.map(([start, end]) => [vertices[start], vertices[end]]);
    }

    class OrbRenderer {
        constructor(canvas, region, nodeButtons) {
            this.canvas = canvas;
            this.region = region;
            this.nodeButtons = nodeButtons;
            this.gl = null;
            this.program = null;
            this.components = [];
            this.trajectoryMetadata = [];
            this.microNodeSizes = [];
            this.guideCount = 0;
            this.renderCount = 0;
            this.activeSection = UI_SETTINGS.defaultSection;
            this.spinAxis = createInitialSpinAxis();
            this.spinRate = ORB_SETTINGS.rotationDegreesPerSecond * Math.PI / 180;
            this.spinAngle = TEST_MODE ? ORB_SETTINGS.initialAxis.testPhaseRadians : Math.random() * Math.PI * 2;
            this.alignmentOrientation = [0, 0, 0, 1];
            this.displayOrientation = quatNormalize(quatMultiply(
                quatFromAxisAngle(this.spinAxis, this.spinAngle),
                this.alignmentOrientation
            ));
            this.rotationMode = 'initial';
            this.transition = null;
            this.lastTime = 0;
            this.frameId = 0;
            this.isVisible = document.visibilityState === 'visible';
            this.reducedMotion = reduceMotionQuery.matches;
            this.radiusPixels = 0;

            this.initializeWebGL();
            this.resizeObserver = new ResizeObserver(() => this.resize());
            this.resizeObserver.observe(region);
            document.addEventListener('visibilitychange', () => this.handleVisibility());
            reduceMotionQuery.addEventListener('change', event => this.handleReducedMotion(event.matches));
            this.resize();
            this.startLoop();
        }

        initializeWebGL() {
            const gl = this.canvas.getContext('webgl', {
                alpha: true,
                antialias: true,
                depth: true,
                powerPreference: 'low-power',
                preserveDrawingBuffer: TEST_MODE
            });
            if (!gl) {
                this.canvas.hidden = true;
                this.region.classList.add('no-webgl');
                return;
            }
            this.gl = gl;

            const vertexShader = this.compileShader(gl.VERTEX_SHADER, `
                precision mediump float;
                attribute vec3 aPosition;
                attribute vec3 aOtherPosition;
                attribute float aSide;
                attribute float aPointSize;
                uniform mat4 uModel;
                uniform vec2 uScale;
                uniform vec2 uViewport;
                uniform float uLineWidth;
                uniform float uPixelRatio;
                uniform float uRenderMode;
                varying float vDepth;
                varying float vProjectedRadius;
                void main() {
                    vec4 point = uModel * vec4(aPosition, 1.0);
                    vec2 projected = point.xy * uScale;
                    if (uRenderMode < 0.5) {
                        vec4 otherPoint = uModel * vec4(aOtherPosition, 1.0);
                        vec2 otherProjected = otherPoint.xy * uScale;
                        vec2 direction = (otherProjected - projected) * uViewport;
                        float directionLength = max(length(direction), 0.0001);
                        vec2 normal = vec2(-direction.y, direction.x) / directionLength;
                        projected += normal * aSide * uLineWidth / uViewport;
                    } else {
                        gl_PointSize = aPointSize * uPixelRatio;
                    }
                    vDepth = point.z;
                    vProjectedRadius = length(point.xy);
                    gl_Position = vec4(projected, -point.z * ${ORB_SETTINGS.rendering.depthPositionFactor}, 1.0);
                }
            `);
            const fragmentShader = this.compileShader(gl.FRAGMENT_SHADER, `
                precision mediump float;
                uniform vec4 uColor;
                uniform float uRenderMode;
                uniform float uCenterFadeStrength;
                uniform float uEdgeBoostStrength;
                varying float vDepth;
                varying float vProjectedRadius;
                void main() {
                    if (uRenderMode > 0.5) {
                        vec2 pointCoordinate = gl_PointCoord * 2.0 - 1.0;
                        if (dot(pointCoordinate, pointCoordinate) > 1.0) discard;
                    }
                    float depthFade = mix(
                        ${WIREFRAME_SETTINGS.depth.rearOpacityMultiplier},
                        1.0,
                        smoothstep(${WIREFRAME_SETTINGS.depth.fadeStart}, ${WIREFRAME_SETTINGS.depth.fadeEnd}, vDepth)
                    );
                    float centerEnvelope = mix(
                        ${WIREFRAME_SETTINGS.depth.centerOpacityMultiplier},
                        1.0,
                        smoothstep(
                            ${WIREFRAME_SETTINGS.depth.centerFadeStart},
                            ${WIREFRAME_SETTINGS.depth.centerFadeEnd},
                            vProjectedRadius
                        )
                    );
                    float centerFade = mix(1.0, centerEnvelope, uCenterFadeStrength);
                    float edgeBoost = 1.0 + uEdgeBoostStrength * ${WIREFRAME_SETTINGS.depth.edgeOpacityBoost}
                        * smoothstep(
                            ${WIREFRAME_SETTINGS.depth.edgeBoostStart},
                            ${WIREFRAME_SETTINGS.depth.edgeBoostEnd},
                            vProjectedRadius
                        );
                    gl_FragColor = vec4(uColor.rgb, clamp(uColor.a * depthFade * centerFade * edgeBoost, 0.0, 1.0));
                }
            `);
            const program = gl.createProgram();
            gl.attachShader(program, vertexShader);
            gl.attachShader(program, fragmentShader);
            gl.linkProgram(program);
            if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
                throw new Error(`Orb shader link failed: ${gl.getProgramInfoLog(program)}`);
            }
            this.program = program;
            this.positionLocation = gl.getAttribLocation(program, 'aPosition');
            this.otherPositionLocation = gl.getAttribLocation(program, 'aOtherPosition');
            this.sideLocation = gl.getAttribLocation(program, 'aSide');
            this.pointSizeLocation = gl.getAttribLocation(program, 'aPointSize');
            this.modelLocation = gl.getUniformLocation(program, 'uModel');
            this.scaleLocation = gl.getUniformLocation(program, 'uScale');
            this.viewportLocation = gl.getUniformLocation(program, 'uViewport');
            this.lineWidthLocation = gl.getUniformLocation(program, 'uLineWidth');
            this.pixelRatioLocation = gl.getUniformLocation(program, 'uPixelRatio');
            this.renderModeLocation = gl.getUniformLocation(program, 'uRenderMode');
            this.colorLocation = gl.getUniformLocation(program, 'uColor');
            this.centerFadeStrengthLocation = gl.getUniformLocation(program, 'uCenterFadeStrength');
            this.edgeBoostStrengthLocation = gl.getUniformLocation(program, 'uEdgeBoostStrength');

            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
            gl.enable(gl.DEPTH_TEST);
            gl.depthFunc(gl.LEQUAL);
            gl.clearColor(0, 0, 0, 0);

            const wireframe = WIREFRAME_SETTINGS;
            const random = createSeededRandom(wireframe.random);
            const randomBetween = (minimum, range) => minimum + random() * range;
            const randomAxis = () => {
                let axis;
                do {
                    axis = [random() * 2 - 1, random() * 2 - 1, random() * 2 - 1];
                } while (Math.hypot(...axis) < wireframe.random.minimumAxisLength);
                return normalizeVector(axis);
            };
            const normalAround = (source, jitter) => normalizeVector(source.map(value => (
                value + (random() - 0.5) * jitter * 2
            )));
            const chooseSweep = pathType => {
                if (pathType === 'full') return wireframe.path.fullSweepRadians;
                const minimum = pathType === 'dashed'
                    ? wireframe.path.dashedSweepMinimumTurns
                    : wireframe.path.partialSweepMinimumTurns;
                const range = pathType === 'dashed'
                    ? wireframe.path.dashedSweepRangeTurns
                    : wireframe.path.partialSweepRangeTurns;
                return randomBetween(minimum, range) * Math.PI * 2;
            };
            const chooseSegments = pathType => {
                if (pathType === 'full') return wireframe.path.fullSegments;
                if (pathType === 'dashed') return wireframe.path.dashedSegments;
                return wireframe.path.partialSegments;
            };
            let trajectoryIndex = 0;
            const buildGroup = (group, options = {}) => {
                const tiers = shuffled(createCountedSequence(group.tierCounts), random);
                const pathTypes = shuffled(createCountedSequence(group.pathCounts), random);
                tiers.forEach((tier, index) => {
                    if (tier !== 'primary' || pathTypes[index] !== 'dashed') return;
                    const swapIndex = pathTypes.findIndex((pathType, candidateIndex) => (
                        candidateIndex !== index
                        && tiers[candidateIndex] !== 'primary'
                        && pathType !== 'dashed'
                    ));
                    if (swapIndex >= 0) {
                        [pathTypes[index], pathTypes[swapIndex]] = [pathTypes[swapIndex], pathTypes[index]];
                    }
                });
                return Array.from({ length: group.count }, (_, index) => {
                    const tier = tiers[index];
                    const pathType = pathTypes[index];
                    const tierStyle = wireframe.tiers[tier];
                    const sourceNormal = options.normal || group.normal;
                    const normal = sourceNormal
                        ? normalAround(sourceNormal, group.normalJitter || options.normalJitter || 0.18)
                        : randomAxis();
                    const sign = random() < 0.5 ? -1 : 1;
                    const offset = sign * randomBetween(group.offsetMinimum, group.offsetRange);
                    const radius = options.silhouette
                        ? randomBetween(wireframe.radius.silhouetteMinimum, wireframe.radius.silhouetteRange)
                        : randomBetween(wireframe.radius.minimum, wireframe.radius.range);
                    const points = createOrbitalPath({
                        normal,
                        offset,
                        radius,
                        startAngle: random() * Math.PI * 2,
                        sweep: chooseSweep(pathType),
                        segments: chooseSegments(pathType),
                        wobble: randomBetween(wireframe.path.wobbleMinimum, wireframe.path.wobbleRange)
                            * (options.silhouette ? 0.55 : 1),
                        wobbleFrequency: wireframe.path.wobbleFrequencyMinimum
                            + Math.floor(random() * wireframe.path.wobbleFrequencyRange),
                        wobblePhase: random() * Math.PI * 2
                    });
                    const paths = pathType === 'dashed'
                        ? splitDashedPath(
                            points,
                            wireframe.path.dashMinimumPoints + Math.floor(random() * wireframe.path.dashPointRange),
                            wireframe.path.gapMinimumPoints + Math.floor(random() * wireframe.path.gapPointRange)
                        )
                        : [points];
                    const graphite = randomBetween(tierStyle.graphiteMinimum, tierStyle.graphiteRange);
                    return {
                        id: `trajectory-${trajectoryIndex++}`,
                        kind: 'trajectory',
                        family: group.id,
                        tier,
                        pathType,
                        radius,
                        offset,
                        points,
                        geometry: createRibbonGeometry(paths),
                        color: [graphite, graphite, graphite, randomBetween(
                            tierStyle.opacityMinimum,
                            tierStyle.opacityRange
                        )],
                        weight: randomBetween(tierStyle.weightMinimumPx, tierStyle.weightRangePx),
                        centerFadeStrength: 1,
                        edgeBoostStrength: 1
                    };
                });
            };

            const trajectories = [
                ...wireframe.families.flatMap(family => buildGroup(family)),
                ...buildGroup(wireframe.structuralGuides),
                ...buildGroup(wireframe.silhouetteGuides, {
                    normal: [0.03, 0.08, 1],
                    normalJitter: 0.32,
                    silhouette: true
                })
            ];
            this.guideCount = trajectories.length;
            this.trajectoryMetadata = trajectories.map(trajectory => ({
                id: trajectory.id,
                family: trajectory.family,
                tier: trajectory.tier,
                pathType: trajectory.pathType,
                radius: trajectory.radius,
                offset: trajectory.offset,
                weight: trajectory.weight,
                opacity: trajectory.color[3]
            }));

            const core = wireframe.core;
            this.addComponent({
                kind: 'core',
                geometry: createRibbonGeometry(createCorePaths(core.radius)),
                color: [core.graphite, core.graphite, core.graphite, core.opacity],
                weight: core.weightPx,
                centerFadeStrength: 0,
                edgeBoostStrength: 0
            });

            const tierDrawOrder = { tertiary: 0, secondary: 1, primary: 2 };
            trajectories
                .slice()
                .sort((a, b) => tierDrawOrder[a.tier] - tierDrawOrder[b.tier])
                .forEach(configuration => this.addComponent(configuration));

            const eligibleMicroPaths = trajectories.filter(trajectory => trajectory.tier !== 'primary');
            const microPositions = [];
            const microSizes = [];
            for (let index = 0; index < wireframe.microNodes.count; index += 1) {
                const trajectory = eligibleMicroPaths[Math.floor(random() * eligibleMicroPaths.length)];
                const point = trajectory.points[
                    Math.floor(randomBetween(0.12, 0.76) * (trajectory.points.length - 1))
                ];
                microPositions.push(...point.map(value => value * (1 + wireframe.microNodes.radiusOffset)));
                microSizes.push(randomBetween(
                    wireframe.microNodes.sizeMinimumPx,
                    wireframe.microNodes.sizeRangePx
                ));
            }
            const micro = wireframe.microNodes;
            this.microNodeSizes = microSizes.slice();
            this.addComponent({
                kind: 'micro-node',
                mode: gl.POINTS,
                positions: microPositions,
                pointSizes: microSizes,
                color: [micro.graphite, micro.graphite, micro.graphite, micro.opacity],
                centerFadeStrength: 0,
                edgeBoostStrength: 0
            });
        }

        compileShader(type, source) {
            const shader = this.gl.createShader(type);
            this.gl.shaderSource(shader, source);
            this.gl.compileShader(shader);
            if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
                throw new Error(`Orb shader compile failed: ${this.gl.getShaderInfoLog(shader)}`);
            }
            return shader;
        }

        addComponent(configuration) {
            const gl = this.gl;
            const positions = configuration.positions || configuration.geometry.positions;
            const createBuffer = values => {
                if (!values) return null;
                const buffer = gl.createBuffer();
                gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
                gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(values), gl.STATIC_DRAW);
                return buffer;
            };
            this.components.push({
                positionBuffer: createBuffer(positions),
                otherPositionBuffer: createBuffer(configuration.geometry?.others),
                sideBuffer: createBuffer(configuration.geometry?.sides),
                pointSizeBuffer: createBuffer(configuration.pointSizes),
                count: positions.length / 3,
                mode: configuration.mode ?? gl.TRIANGLES,
                kind: configuration.kind,
                color: configuration.color,
                initial: configuration.initial || [0, 0, 0, 1],
                weight: configuration.weight,
                centerFadeStrength: configuration.centerFadeStrength ?? 0,
                edgeBoostStrength: configuration.edgeBoostStrength ?? 0,
                family: configuration.family,
                tier: configuration.tier,
                pathType: configuration.pathType,
                radius: configuration.radius,
                opacity: configuration.color[3]
            });
        }

        resize() {
            const rect = this.region.getBoundingClientRect();
            if (!rect.width || !rect.height) return;
            const compactLayout = mobileLayoutQuery.matches;
            const pixelRatioCap = compactLayout
                ? ORB_SETTINGS.rendering.compactDevicePixelRatioCap
                : ORB_SETTINGS.rendering.desktopDevicePixelRatioCap;
            const pixelRatio = Math.min(window.devicePixelRatio || 1, pixelRatioCap);
            const width = Math.max(1, Math.round(rect.width * pixelRatio));
            const height = Math.max(1, Math.round(rect.height * pixelRatio));
            if (this.canvas.width !== width || this.canvas.height !== height) {
                this.canvas.width = width;
                this.canvas.height = height;
            }
            const radiusFactor = compactLayout
                ? ORB_SETTINGS.rendering.compactRadiusFactor
                : ORB_SETTINGS.rendering.desktopRadiusFactor;
            this.radiusPixels = Math.min(rect.width, rect.height) * radiusFactor;
            if (this.gl) this.gl.viewport(0, 0, width, height);
            this.render(performance.now());
        }

        getCurrentOrientation(now) {
            if (!this.transition) return this.displayOrientation;
            const elapsed = now - this.transition.startedAt;
            const clampedElapsed = clamp(elapsed, 0, this.transition.duration);
            const progress = clampedElapsed / this.transition.duration;
            const transitionAlignment = quatSlerp(
                this.transition.start,
                this.transition.end,
                easeOutQuint(progress)
            );
            const axialPhase = clampedElapsed / 1000 * this.spinRate;
            this.transition.axialPhase = axialPhase;
            this.displayOrientation = quatNormalize(quatMultiply(
                quatFromAxisAngle(this.transition.targetAxis, axialPhase),
                transitionAlignment
            ));
            if (progress >= 1) {
                this.alignmentOrientation = this.transition.end.slice();
                this.spinAxis = this.transition.targetAxis.slice();
                this.spinAngle = axialPhase % (Math.PI * 2);
                this.rotationMode = 'selected';
                this.transition = null;
            }
            return this.displayOrientation;
        }

        setSection(section, options = {}) {
            const now = performance.now();
            this.activeSection = section;
            if (options.align === false) {
                this.render(now);
                this.startLoop();
                return;
            }
            this.getCurrentOrientation(now);
            const start = this.displayOrientation.slice();
            const currentTargetDirection = normalizeVector(quatRotate(start, NODE_DIRECTIONS[section]));
            const delta = quatFromUnitVectors(currentTargetDirection, WORLD_NORTH);
            const end = quatNormalize(quatMultiply(delta, start));
            const angularDistance = 2 * Math.acos(clamp(Math.abs(quatDot(start, end)), -1, 1));
            const duration = TEST_MODE
                ? ORB_SETTINGS.transition.testDurationMs
                : ORB_SETTINGS.transition.minimumDurationMs
                    + clamp(angularDistance / Math.PI, 0, 1) * ORB_SETTINGS.transition.distanceDurationMs;

            this.transition = {
                start,
                end,
                targetAxis: WORLD_NORTH.slice(),
                startedAt: now,
                duration,
                axialPhase: 0
            };
            this.region.classList.remove('is-focusing');
            if (!TEST_MODE) {
                void this.region.offsetWidth;
                this.region.classList.add('is-focusing');
            }
            this.render(now);
            this.startLoop();
        }

        updateNodes(orientation) {
            const rect = this.region.getBoundingClientRect();
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const compactLayout = mobileLayoutQuery.matches;
            this.nodeButtons.forEach(button => {
                const section = button.dataset.orbSection;
                const direction = normalizeVector(quatRotate(orientation, NODE_DIRECTIONS[section]));
                const active = section === this.activeSection;
                const nodeSettings = ORB_SETTINGS.nodes;
                const depthOpacity = clamp(
                    (direction[2] + nodeSettings.depthOpacityOffset) / nodeSettings.depthOpacityRange,
                    0,
                    1
                );
                const visible = active || direction[2] > nodeSettings.visibilityDepthThreshold;
                const opacity = active ? 1 : depthOpacity;
                const nodeX = centerX + direction[0] * this.radiusPixels;
                const nodeY = centerY - direction[1] * this.radiusPixels;
                const portraitCollision = nodeX < centerX - this.radiusPixels * nodeSettings.portraitCollisionXFactor
                    && nodeY < centerY - this.radiusPixels * nodeSettings.portraitCollisionYFactor;
                const showLabel = active || !compactLayout
                    || (direction[2] > nodeSettings.compactLabelDepthThreshold && !portraitCollision);
                button.style.left = `${nodeX}px`;
                button.style.top = `${nodeY}px`;
                button.style.setProperty('--node-opacity', opacity.toFixed(3));
                button.style.zIndex = String(active
                    ? nodeSettings.activeZIndex
                    : Math.round(nodeSettings.baseZIndex + Math.max(0, direction[2]) * nodeSettings.depthZIndexRange));
                button.classList.toggle('is-active', active);
                button.classList.toggle('is-hidden', !visible);
                button.classList.toggle('show-label', showLabel);
                button.setAttribute('aria-pressed', String(active));
                button.setAttribute('aria-hidden', String(!visible));
                button.tabIndex = visible ? 0 : -1;
                button.dataset.depth = direction[2].toFixed(4);
            });
        }

        render(now) {
            const orientation = this.getCurrentOrientation(now);
            this.updateNodes(orientation);
            if (!this.gl) return;

            const gl = this.gl;
            const width = this.canvas.width;
            const height = this.canvas.height;
            const cssWidth = this.canvas.clientWidth || 1;
            const cssHeight = this.canvas.clientHeight || 1;
            const scale = [2 * this.radiusPixels / cssWidth, 2 * this.radiusPixels / cssHeight];
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            gl.useProgram(this.program);
            gl.uniform2fv(this.scaleLocation, scale);
            gl.uniform2fv(this.viewportLocation, [cssWidth, cssHeight]);
            gl.uniform1f(this.pixelRatioLocation, width / cssWidth);
            gl.enableVertexAttribArray(this.positionLocation);

            this.components.forEach(component => {
                const model = quatMultiply(orientation, component.initial);
                gl.bindBuffer(gl.ARRAY_BUFFER, component.positionBuffer);
                gl.vertexAttribPointer(this.positionLocation, 3, gl.FLOAT, false, 0, 0);
                if (component.otherPositionBuffer) {
                    gl.enableVertexAttribArray(this.otherPositionLocation);
                    gl.bindBuffer(gl.ARRAY_BUFFER, component.otherPositionBuffer);
                    gl.vertexAttribPointer(this.otherPositionLocation, 3, gl.FLOAT, false, 0, 0);
                } else {
                    gl.disableVertexAttribArray(this.otherPositionLocation);
                    gl.vertexAttrib3f(this.otherPositionLocation, 0, 0, 0);
                }
                if (component.sideBuffer) {
                    gl.enableVertexAttribArray(this.sideLocation);
                    gl.bindBuffer(gl.ARRAY_BUFFER, component.sideBuffer);
                    gl.vertexAttribPointer(this.sideLocation, 1, gl.FLOAT, false, 0, 0);
                } else {
                    gl.disableVertexAttribArray(this.sideLocation);
                    gl.vertexAttrib1f(this.sideLocation, 0);
                }
                if (component.pointSizeBuffer) {
                    gl.enableVertexAttribArray(this.pointSizeLocation);
                    gl.bindBuffer(gl.ARRAY_BUFFER, component.pointSizeBuffer);
                    gl.vertexAttribPointer(this.pointSizeLocation, 1, gl.FLOAT, false, 0, 0);
                } else {
                    gl.disableVertexAttribArray(this.pointSizeLocation);
                    gl.vertexAttrib1f(this.pointSizeLocation, 1);
                }
                gl.uniformMatrix4fv(this.modelLocation, false, quatToMatrix(model));
                gl.uniform4fv(this.colorLocation, component.color);
                gl.uniform1f(this.renderModeLocation, component.kind === 'micro-node' ? 1 : 0);
                gl.uniform1f(this.lineWidthLocation, component.weight || 1);
                gl.uniform1f(this.centerFadeStrengthLocation, component.centerFadeStrength);
                gl.uniform1f(this.edgeBoostStrengthLocation, component.edgeBoostStrength);
                gl.depthMask(true);
                gl.drawArrays(component.mode, 0, component.count);
            });
            gl.depthMask(true);
            this.renderCount += 1;
            void width;
            void height;
        }

        tick = (now) => {
            this.frameId = 0;
            if (!this.isVisible) return;
            const idleFrameInterval = 1000 / ORB_SETTINGS.rendering.idleFramesPerSecond;
            if (!this.transition && this.lastTime && now - this.lastTime < idleFrameInterval) {
                this.frameId = requestAnimationFrame(this.tick);
                return;
            }
            const firstIdleFrame = !this.lastTime && !this.transition;
            const deltaSeconds = this.lastTime
                ? Math.min((now - this.lastTime) / 1000, ORB_SETTINGS.rendering.maximumFrameDeltaSeconds)
                : firstIdleFrame ? 1 / ORB_SETTINGS.rendering.idleFramesPerSecond : 0;
            this.lastTime = now;
            const idleEnabled = !TEST_MODE;

            const wasTransitioning = Boolean(this.transition);
            this.getCurrentOrientation(now);
            if (!this.transition && idleEnabled && !wasTransitioning) {
                this.spinAngle = (this.spinAngle + deltaSeconds * this.spinRate) % (Math.PI * 2);
                this.displayOrientation = quatNormalize(quatMultiply(
                    quatFromAxisAngle(this.spinAxis, this.spinAngle),
                    this.alignmentOrientation
                ));
            }
            this.render(now);

            if (idleEnabled || this.transition) this.frameId = requestAnimationFrame(this.tick);
        };

        startLoop() {
            if (!this.frameId && this.isVisible) this.frameId = requestAnimationFrame(this.tick);
        }

        handleVisibility() {
            this.isVisible = document.visibilityState === 'visible';
            if (!this.isVisible && this.frameId) {
                cancelAnimationFrame(this.frameId);
                this.frameId = 0;
                this.lastTime = 0;
            } else if (this.isVisible) {
                this.startLoop();
            }
        }

        handleReducedMotion(reduced) {
            this.reducedMotion = reduced;
            this.lastTime = 0;
            this.render(performance.now());
            if (!reduced) this.startLoop();
        }

        debugState() {
            const activeDirection = normalizeVector(quatRotate(this.displayOrientation, NODE_DIRECTIONS[this.activeSection]));
            return {
                activeSection: this.activeSection,
                activeNodeDirection: activeDirection,
                axis: this.spinAxis.slice(),
                orientation: this.displayOrientation.slice(),
                alignmentOrientation: this.alignmentOrientation.slice(),
                spinAngle: this.transition ? this.transition.axialPhase : this.spinAngle,
                spinRate: this.spinRate,
                rotationMode: this.rotationMode,
                nodeDirections: Object.fromEntries(SECTION_IDS.map(section => [
                    section,
                    normalizeVector(quatRotate(this.displayOrientation, NODE_DIRECTIONS[section]))
                ])),
                transitioning: Boolean(this.transition),
                idleEnabled: !TEST_MODE,
                renderCount: this.renderCount,
                componentCount: this.components.length,
                guideCount: this.guideCount,
                strokeWeights: this.components.filter(component => component.kind === 'trajectory')
                    .map(component => component.weight),
                lineStyles: this.components.filter(component => component.kind === 'trajectory').map(component => ({
                    color: component.color.slice(),
                    weight: component.weight,
                    radius: component.radius,
                    family: component.family,
                    tier: component.tier,
                    pathType: component.pathType
                })),
                trajectoryMetadata: this.trajectoryMetadata.map(metadata => ({ ...metadata })),
                tierCounts: Object.fromEntries(Object.keys(WIREFRAME_SETTINGS.tiers).map(tier => [
                    tier,
                    this.trajectoryMetadata.filter(metadata => metadata.tier === tier).length
                ])),
                pathCounts: Object.fromEntries(Object.keys(WIREFRAME_SETTINGS.pathCounts).map(pathType => [
                    pathType,
                    this.trajectoryMetadata.filter(metadata => metadata.pathType === pathType).length
                ])),
                familyCounts: Object.fromEntries([
                    ...WIREFRAME_SETTINGS.families.map(family => family.id),
                    WIREFRAME_SETTINGS.structuralGuides.id,
                    WIREFRAME_SETTINGS.silhouetteGuides.id
                ].map(family => [
                    family,
                    this.trajectoryMetadata.filter(metadata => metadata.family === family).length
                ])),
                coreCount: this.components.filter(component => component.kind === 'core').length,
                coreRadius: WIREFRAME_SETTINGS.core.radius,
                microNodeCount: this.microNodeSizes.length,
                microNodeSizes: this.microNodeSizes.slice(),
                radiusPixels: this.radiusPixels,
                webglAvailable: Boolean(this.gl)
            };
        }
    }

    function initPortfolio() {
        const canvas = document.getElementById('orb-canvas');
        const orbRegion = document.querySelector('.orb-region');
        if (!canvas || !orbRegion) return;
        const nodeButtons = Array.from(document.querySelectorAll('[data-orb-section]'));
        const sections = new Map(SECTION_IDS.map(id => [id, document.querySelector(`[data-section="${id}"]`)]));
        const navLinks = Array.from(document.querySelectorAll('.nav-links [data-section-link]'));
        const navigation = document.querySelector('.glass-nav');
        const menuToggle = document.querySelector('.mobile-menu-toggle');
        const mobileActiveSection = document.querySelector('.mobile-active-section');
        const orb = new OrbRenderer(canvas, orbRegion, nodeButtons);
        let activeSection = UI_SETTINGS.defaultSection;
        let contentTimer = 0;
        let menuOpen = false;

        const setMenuOpen = open => {
            menuOpen = Boolean(open && mobileLayoutQuery.matches);
            navigation.classList.toggle('menu-open', menuOpen);
            menuToggle.setAttribute('aria-expanded', String(menuOpen));
            menuToggle.setAttribute('aria-label', menuOpen ? 'Close navigation' : 'Open navigation');
        };

        document.querySelectorAll('#experience .cards-grid, #notes .notes-list').forEach(carousel => {
            const section = carousel.closest('[data-section]');
            const heading = section.querySelector('h2');
            if (heading && !heading.id) heading.id = `${section.id}-heading`;
            carousel.tabIndex = 0;
            carousel.setAttribute('role', 'region');
            if (heading) carousel.setAttribute('aria-labelledby', heading.id);
            carousel.addEventListener('keydown', event => {
                if (!mobileLayoutQuery.matches || !UI_SETTINGS.navigationKeys.includes(event.key)) return;
                const cards = Array.from(carousel.querySelectorAll('.card'));
                if (!cards.length) return;
                const centeredPosition = carousel.scrollLeft + carousel.clientWidth / 2;
                let currentIndex = cards.reduce((closest, card, index) => {
                    const center = card.offsetLeft + card.offsetWidth / 2;
                    return Math.abs(center - centeredPosition) < Math.abs(cards[closest].offsetLeft + cards[closest].offsetWidth / 2 - centeredPosition)
                        ? index : closest;
                }, 0);
                if (event.key === 'Home') currentIndex = 0;
                if (event.key === 'End') currentIndex = cards.length - 1;
                if (event.key === 'ArrowLeft') currentIndex = Math.max(0, currentIndex - 1);
                if (event.key === 'ArrowRight') currentIndex = Math.min(cards.length - 1, currentIndex + 1);
                const targetLeft = cards[currentIndex].offsetLeft - (carousel.clientWidth - cards[currentIndex].offsetWidth) / 2;
                carousel.scrollTo({ left: targetLeft, behavior: reduceMotionQuery.matches ? 'auto' : 'smooth' });
                event.preventDefault();
            });
        });

        const updateContent = (nextSection, initial) => {
            const current = sections.get(activeSection);
            const next = sections.get(nextSection);
            window.clearTimeout(contentTimer);

            if (initial || current === next || TEST_MODE || reduceMotionQuery.matches) {
                sections.forEach((section, id) => {
                    section.hidden = id !== nextSection;
                    section.classList.toggle('is-active', id === nextSection);
                    section.classList.remove('is-entering', 'is-exiting');
                });
                return;
            }

            current.classList.add('is-exiting');
            contentTimer = window.setTimeout(() => {
                current.hidden = true;
                current.classList.remove('is-active', 'is-exiting');
                next.hidden = false;
                next.classList.add('is-entering');
                requestAnimationFrame(() => requestAnimationFrame(() => {
                    next.classList.add('is-active');
                    next.classList.remove('is-entering');
                }));
            }, UI_SETTINGS.contentExitDurationMs);
        };

        const activate = (section, options = {}) => {
            if (!SECTION_IDS.includes(section)) return;
            const initial = Boolean(options.initial);
            updateContent(section, initial);
            activeSection = section;
            navLinks.forEach(link => {
                const selected = link.dataset.sectionLink === section;
                link.classList.toggle('is-active', selected);
                if (selected) link.setAttribute('aria-current', 'page');
                else link.removeAttribute('aria-current');
            });
            const activeNavigationLink = navLinks.find(link => link.dataset.sectionLink === section);
            if (activeNavigationLink) mobileActiveSection.textContent = activeNavigationLink.textContent;
            setMenuOpen(false);
            orb.setSection(section, { align: !options.initial });
            if (options.updateHistory !== false && window.location.hash !== `#${section}`) {
                history.pushState({ section }, '', `#${section}`);
            }
        };

        document.querySelectorAll('[data-section-link]').forEach(link => {
            link.addEventListener('click', event => {
                event.preventDefault();
                activate(link.dataset.sectionLink);
            });
        });
        nodeButtons.forEach(button => button.addEventListener('click', () => activate(button.dataset.orbSection)));
        menuToggle.addEventListener('click', () => setMenuOpen(!menuOpen));
        document.addEventListener('pointerdown', event => {
            if (menuOpen && !navigation.contains(event.target)) setMenuOpen(false);
        });
        document.addEventListener('keydown', event => {
            if (event.key === 'Escape' && menuOpen) {
                setMenuOpen(false);
                menuToggle.focus();
            }
        });
        mobileLayoutQuery.addEventListener('change', () => {
            setMenuOpen(false);
            orb.resize();
        });

        window.addEventListener('popstate', () => {
            const hashSection = window.location.hash.slice(1);
            activate(SECTION_IDS.includes(hashSection) ? hashSection : UI_SETTINGS.defaultSection, { updateHistory: false });
        });

        const initialHash = window.location.hash.slice(1);
        const initialSection = SECTION_IDS.includes(initialHash) ? initialHash : UI_SETTINGS.defaultSection;
        activate(initialSection, { initial: true, updateHistory: false });

        window.__portfolioDebug = {
            getActiveSection: () => activeSection,
            getActiveNodeDirection: () => orb.debugState().activeNodeDirection,
            getOrbAxis: () => orb.debugState().axis,
            getOrbOrientation: () => orb.debugState().orientation,
            getOrbAlignmentOrientation: () => orb.debugState().alignmentOrientation,
            getOrbRotationMode: () => orb.debugState().rotationMode,
            getOrbSpinRate: () => orb.debugState().spinRate,
            getOrbSpinAngle: () => orb.debugState().spinAngle,
            getOrbNodeDirections: () => orb.debugState().nodeDirections,
            isTransitioning: () => orb.debugState().transitioning,
            isIdleEnabled: () => orb.debugState().idleEnabled,
            getRenderCount: () => orb.debugState().renderCount,
            getOrbComponentCount: () => orb.debugState().componentCount,
            getOrbGuideCount: () => orb.debugState().guideCount,
            getOrbStrokeWeights: () => orb.debugState().strokeWeights,
            getOrbLineStyles: () => orb.debugState().lineStyles,
            getOrbTrajectoryMetadata: () => orb.debugState().trajectoryMetadata,
            getOrbTierCounts: () => orb.debugState().tierCounts,
            getOrbPathCounts: () => orb.debugState().pathCounts,
            getOrbFamilyCounts: () => orb.debugState().familyCounts,
            getOrbCoreMetrics: () => ({
                count: orb.debugState().coreCount,
                radius: orb.debugState().coreRadius
            }),
            getOrbMicroNodeMetrics: () => ({
                count: orb.debugState().microNodeCount,
                sizes: orb.debugState().microNodeSizes
            }),
            getOrbRadius: () => orb.debugState().radiusPixels,
            getAmbientBlobState: () => ambientBlobs ? ambientBlobs.getState() : [],
            stepAmbientBlobs: seconds => ambientBlobs && ambientBlobs.step(seconds),
            isWebGLAvailable: () => orb.debugState().webglAvailable,
            getNodeVisibility: () => Object.fromEntries(nodeButtons.map(button => [button.dataset.orbSection, {
                hidden: button.classList.contains('is-hidden'),
                opacity: Number.parseFloat(getComputedStyle(button).opacity),
                pointerEvents: getComputedStyle(button).pointerEvents,
                depth: Number.parseFloat(button.dataset.depth)
            }]))
        };
    }

    document.addEventListener('DOMContentLoaded', () => {
        ambientBlobs = initAmbientBlobs();
        initPortfolio();
    });
})();
