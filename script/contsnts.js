(function (global) {
'use strict';

const deepFreeze = value => {
    if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
    Object.values(value).forEach(deepFreeze);
    return Object.freeze(value);
};

const PROFILE_IMAGE_SCALE = 0.7;
const scaled = value => Number((value * PROFILE_IMAGE_SCALE).toFixed(2));

const PROFILE_IMAGE_BASE_SIZES = deepFreeze({
    desktop: { minimumPx: 125, fluidVw: 13, maximumPx: 195 },
    medium: { minimumPx: 106, fluidVw: 12, maximumPx: 144 },
    tablet: { minimumPx: 96, fluidVw: 13, maximumPx: 124 },
    mobile: { minimumPx: 58, fluidVw: 15, maximumPx: 72 },
    landscape: { widthPx: 56, minimumPx: 56 }
});

const PROFILE_IMAGE_SIZES = deepFreeze({
    desktop: {
        minimumPx: scaled(PROFILE_IMAGE_BASE_SIZES.desktop.minimumPx),
        fluidVw: scaled(PROFILE_IMAGE_BASE_SIZES.desktop.fluidVw),
        maximumPx: scaled(PROFILE_IMAGE_BASE_SIZES.desktop.maximumPx)
    },
    medium: {
        minimumPx: scaled(PROFILE_IMAGE_BASE_SIZES.medium.minimumPx),
        fluidVw: scaled(PROFILE_IMAGE_BASE_SIZES.medium.fluidVw),
        maximumPx: scaled(PROFILE_IMAGE_BASE_SIZES.medium.maximumPx)
    },
    tablet: {
        minimumPx: scaled(PROFILE_IMAGE_BASE_SIZES.tablet.minimumPx),
        fluidVw: scaled(PROFILE_IMAGE_BASE_SIZES.tablet.fluidVw),
        maximumPx: scaled(PROFILE_IMAGE_BASE_SIZES.tablet.maximumPx)
    },
    mobile: {
        minimumPx: scaled(PROFILE_IMAGE_BASE_SIZES.mobile.minimumPx),
        fluidVw: scaled(PROFILE_IMAGE_BASE_SIZES.mobile.fluidVw),
        maximumPx: scaled(PROFILE_IMAGE_BASE_SIZES.mobile.maximumPx)
    },
    landscape: {
        widthPx: scaled(PROFILE_IMAGE_BASE_SIZES.landscape.widthPx),
        minimumPx: scaled(PROFILE_IMAGE_BASE_SIZES.landscape.minimumPx)
    }
});

const ORB_ROTATION_SPEED_MULTIPLIER = 10;
const ORB_BASE_ROTATION_DEGREES_PER_SECOND = 0.38;

const SECTION_IDS = deepFreeze(['about', 'experience', 'publications', 'notes', 'contact']);
const WORLD_NORTH = deepFreeze([0, 1, 0]);
const ORB_NODE_VECTORS = deepFreeze({
    about: [0.18, 0.85, 0.49],
    experience: [-0.74, 0.32, 0.59],
    publications: [0.68, 0.22, -0.70],
    notes: [-0.25, -0.72, -0.64],
    contact: [0.63, -0.52, 0.58]
});

const RUNTIME_SETTINGS = deepFreeze({
    testModeParameter: 'testMode',
    testModeValue: '1',
    compactLayoutMediaQuery: '(max-width: 700px), (max-width: 950px) and (max-height: 500px)',
    gameScripts: ['script/matter.min.js', 'script/tower_bloxx_pure.js']
});

const AMBIENT_BLOB_SETTINGS = deepFreeze({
    palette: ['#f7dce8', '#dce9f4', '#f7efc9', '#dfeede', '#eadff1', '#f3dfd5'],
    deterministicSeed: 0x6d2b79f5,
    randomIncrement: 0x6d2b79f5,
    randomDivisor: 4294967296,
    minimumPoints: 10,
    additionalPointRange: 5,
    pointAngleJitter: 0.52,
    minimumPointRadius: 0.44,
    pointRadiusRange: 0.56,
    minimumWidthVw: 9,
    widthRangeVw: 12,
    minimumHeightVh: 11,
    heightRangeVh: 14,
    minimumSpeedPxPerSecond: 11,
    speedRangePxPerSecond: 9,
    minimumVelocityComponent: 4,
    minimumOpacity: 0.3,
    opacityRange: 0.18,
    initialRotationRangeDegrees: 12,
    minimumRotationDegreesPerSecond: 0.18,
    rotationSpeedRangeDegreesPerSecond: 0.34,
    maximumFrameDeltaSeconds: 0.05
});

const ORB_SETTINGS = deepFreeze({
    rotationDegreesPerSecond: ORB_BASE_ROTATION_DEGREES_PER_SECOND * ORB_ROTATION_SPEED_MULTIPLIER,
    initialAxis: {
        testVector: [0.53, -0.31, 0.79],
        minimumRandomLength: 0.2,
        testPhaseRadians: 0.72
    },
    transition: {
        testDurationMs: 1,
        minimumDurationMs: 900,
        distanceDurationMs: 500
    },
    rendering: {
        idleFramesPerSecond: 30,
        maximumFrameDeltaSeconds: 0.1,
        compactDevicePixelRatioCap: 1.1,
        desktopDevicePixelRatioCap: 1.5,
        baseCompactRadiusFactor: 0.495,
        baseDesktopRadiusFactor: 0.495,
        sizeScale: 0.75,
        compactRadiusFactor: 0.37125,
        desktopRadiusFactor: 0.37125,
        depthPositionFactor: 0.22
    },
    nodes: {
        baseSizePx: 28,
        baseIconSizePx: 15.5,
        baseIconStrokeWidthPx: 1.9,
        baseBorderWidthPx: 2.25,
        activeBaseSizePx: 30,
        activeBaseIconSizePx: 17,
        activeBaseIconStrokeWidthPx: 2,
        activeBaseBorderWidthPx: 3,
        activeSizeScale: 1,
        activeSizePx: 30,
        activeIconSizePx: 17,
        activeIconStrokeWidthPx: 2,
        activeBorderWidthPx: 3,
        mobileHitTargetSizePx: 44,
        labelGapPx: 7,
        labelConnectorLengthPx: 6,
        shadowOffsetPx: 1.5,
        shadowOpacity: 0.72,
        mobileLabelOffsetPx: 17,
        mobileActiveLabelBaseOffsetPx: 17,
        mobileActiveLabelOffsetPx: 17,
        depthOpacityOffset: 0.08,
        depthOpacityRange: 0.52,
        visibilityDepthThreshold: -0.05,
        portraitCollisionXFactor: 0.18,
        portraitCollisionYFactor: 0.02,
        compactLabelDepthThreshold: 0.58,
        activeZIndex: 5,
        baseZIndex: 2,
        depthZIndexRange: 2
    }
});

const WIREFRAME_SETTINGS = deepFreeze({
    random: {
        deterministicSeed: 0x43d2f19b,
        randomIncrement: 0x6d2b79f5,
        randomDivisor: 4294967296,
        minimumAxisLength: 0.2
    },
    trajectoryCount: 84,
    pathCounts: {
        full: 26,
        partial: 50,
        dashed: 8
    },
    radius: {
        minimum: 0.91,
        range: 0.11,
        silhouetteMinimum: 0.98,
        silhouetteRange: 0.04
    },
    path: {
        fullSweepRadians: Math.PI * 2,
        partialSweepMinimumTurns: 0.38,
        partialSweepRangeTurns: 0.38,
        dashedSweepMinimumTurns: 0.56,
        dashedSweepRangeTurns: 0.28,
        fullSegments: 128,
        partialSegments: 96,
        dashedSegments: 144,
        dashMinimumPoints: 7,
        dashPointRange: 4,
        gapMinimumPoints: 4,
        gapPointRange: 3,
        wobbleMinimum: 0.006,
        wobbleRange: 0.018,
        wobbleFrequencyMinimum: 2,
        wobbleFrequencyRange: 4
    },
    families: [
        {
            id: 'horizontal',
            normal: [0.08, 0.95, 0.28],
            count: 18,
            normalJitter: 0.17,
            offsetMinimum: 0.08,
            offsetRange: 0.58,
            tierCounts: { primary: 6, secondary: 6, tertiary: 6 },
            pathCounts: { full: 8, partial: 8, dashed: 2 }
        },
        {
            id: 'diagonal',
            normal: [0.72, 0.58, 0.38],
            count: 18,
            normalJitter: 0.18,
            offsetMinimum: 0.08,
            offsetRange: 0.6,
            tierCounts: { primary: 6, secondary: 6, tertiary: 6 },
            pathCounts: { full: 8, partial: 8, dashed: 2 }
        },
        {
            id: 'oblique',
            normal: [-0.55, 0.3, 0.78],
            count: 18,
            normalJitter: 0.19,
            offsetMinimum: 0.1,
            offsetRange: 0.58,
            tierCounts: { primary: 5, secondary: 7, tertiary: 6 },
            pathCounts: { full: 8, partial: 8, dashed: 2 }
        }
    ],
    structuralGuides: {
        id: 'structural',
        count: 20,
        offsetMinimum: 0.14,
        offsetRange: 0.62,
        tierCounts: { primary: 0, secondary: 8, tertiary: 12 },
        pathCounts: { full: 2, partial: 16, dashed: 2 }
    },
    silhouetteGuides: {
        id: 'silhouette',
        count: 10,
        offsetMinimum: 0.02,
        offsetRange: 0.18,
        tierCounts: { primary: 0, secondary: 3, tertiary: 7 },
        pathCounts: { full: 0, partial: 10, dashed: 0 }
    },
    tiers: {
        primary: {
            count: 17,
            graphiteMinimum: 0.07,
            graphiteRange: 0.05,
            opacityMinimum: 0.72,
            opacityRange: 0.12,
            weightMinimumPx: 1.35,
            weightRangePx: 0.2
        },
        secondary: {
            count: 30,
            graphiteMinimum: 0.12,
            graphiteRange: 0.07,
            opacityMinimum: 0.4,
            opacityRange: 0.16,
            weightMinimumPx: 0.95,
            weightRangePx: 0.2
        },
        tertiary: {
            count: 37,
            graphiteMinimum: 0.18,
            graphiteRange: 0.08,
            opacityMinimum: 0.14,
            opacityRange: 0.12,
            weightMinimumPx: 0.6,
            weightRangePx: 0.22
        }
    },
    depth: {
        rearOpacityMultiplier: 0.14,
        fadeStart: -0.72,
        fadeEnd: 0.48,
        centerOpacityMultiplier: 0.48,
        centerFadeStart: 0.03,
        centerFadeEnd: 0.34,
        edgeBoostStart: 0.78,
        edgeBoostEnd: 1.01,
        edgeOpacityBoost: 0.16
    },
    core: {
        radius: 0.1,
        graphite: 0.16,
        opacity: 0.22,
        weightPx: 0.7
    },
    microNodes: {
        count: 12,
        graphite: 0.17,
        opacity: 0.42,
        sizeMinimumPx: 0.9,
        sizeRangePx: 0.7,
        radiusOffset: 0.004
    }
});

const LAYOUT_SETTINGS = deepFreeze({
    header: {
        desktopHeightPx: 62,
        compactDesktopHeightPx: 54,
        mobileHeightPx: 54,
        landscapeHeightPx: 46,
        desktopContentWidthPercent: 86,
        desktopContentMaximumPx: 1440,
        mobileContentWidthPercent: 94,
        navigationGapMinimumRem: 0.45,
        navigationGapFluidVw: 1.15,
        navigationGapMaximumRem: 1.35,
        navigationLinkBlockPaddingRem: 0.27,
        navigationLinkInlinePaddingRem: 0.5,
        desktopLogoFontRem: 1.36,
        mobileLogoFontRem: 1.04,
        mobileGridGapPx: 8,
        mobileToggleSizePx: 40,
        mobileToggleIconSizePx: 20
    },
    orbAllocation: {
        desktopPortraitColumnMinimumPx: 87.5,
        desktopPortraitColumnPercent: 10,
        desktopOrbColumnMinimumPx: 440,
        desktopOrbColumnPercent: 50,
        mediumPortraitColumnMinimumPx: 74.2,
        mediumPortraitColumnPercent: 9,
        mediumOrbColumnMinimumPx: 360,
        mediumOrbColumnPercent: 44,
        tabletOrbColumnMinimumPx: 290,
        tabletOrbColumnPercent: 48,
        mobileOrbWidthVw: 90,
        mobileOrbMaximumPx: 410,
        mobileOrbRowMinimumPx: 263,
        mobileOrbRowHeightDvh: 42,
        mobileOrbTranslateYPx: 28
    }
});

const UI_SETTINGS = deepFreeze({
    contentExitDurationMs: 190,
    navigationKeys: ['ArrowLeft', 'ArrowRight', 'Home', 'End'],
    defaultSection: 'about'
});

const PORTFOLIO_CONSTANTS = deepFreeze({
    profileImageScale: PROFILE_IMAGE_SCALE,
    profileImageBaseSizes: PROFILE_IMAGE_BASE_SIZES,
    profileImageSizes: PROFILE_IMAGE_SIZES,
    orbRotationSpeedMultiplier: ORB_ROTATION_SPEED_MULTIPLIER,
    orbBaseRotationDegreesPerSecond: ORB_BASE_ROTATION_DEGREES_PER_SECOND,
    sections: SECTION_IDS,
    worldNorth: WORLD_NORTH,
    orbNodeVectors: ORB_NODE_VECTORS,
    runtime: RUNTIME_SETTINGS,
    ambientBlobs: AMBIENT_BLOB_SETTINGS,
    orb: ORB_SETTINGS,
    wireframe: WIREFRAME_SETTINGS,
    layout: LAYOUT_SETTINGS,
    ui: UI_SETTINGS
});

function applyPortfolioCssConstants(root = document.documentElement) {
    const sizes = PROFILE_IMAGE_SIZES;
    const header = LAYOUT_SETTINGS.header;
    const orb = LAYOUT_SETTINGS.orbAllocation;
    const nodes = ORB_SETTINGS.nodes;
    const values = {
        '--profile-desktop-min': `${sizes.desktop.minimumPx}px`,
        '--profile-desktop-fluid': `${sizes.desktop.fluidVw}vw`,
        '--profile-desktop-max': `${sizes.desktop.maximumPx}px`,
        '--profile-medium-min': `${sizes.medium.minimumPx}px`,
        '--profile-medium-fluid': `${sizes.medium.fluidVw}vw`,
        '--profile-medium-max': `${sizes.medium.maximumPx}px`,
        '--profile-tablet-min': `${sizes.tablet.minimumPx}px`,
        '--profile-tablet-fluid': `${sizes.tablet.fluidVw}vw`,
        '--profile-tablet-max': `${sizes.tablet.maximumPx}px`,
        '--profile-mobile-min': `${sizes.mobile.minimumPx}px`,
        '--profile-mobile-fluid': `${sizes.mobile.fluidVw}vw`,
        '--profile-mobile-max': `${sizes.mobile.maximumPx}px`,
        '--profile-landscape-width': `${sizes.landscape.widthPx}px`,
        '--profile-landscape-min': `${sizes.landscape.minimumPx}px`,
        '--header-desktop-height': `${header.desktopHeightPx}px`,
        '--header-compact-desktop-height': `${header.compactDesktopHeightPx}px`,
        '--header-mobile-height': `${header.mobileHeightPx}px`,
        '--header-landscape-height': `${header.landscapeHeightPx}px`,
        '--header-desktop-content-width': `${header.desktopContentWidthPercent}%`,
        '--header-desktop-content-max': `${header.desktopContentMaximumPx}px`,
        '--header-mobile-content-width': `${header.mobileContentWidthPercent}%`,
        '--header-nav-gap-min': `${header.navigationGapMinimumRem}rem`,
        '--header-nav-gap-fluid': `${header.navigationGapFluidVw}vw`,
        '--header-nav-gap-max': `${header.navigationGapMaximumRem}rem`,
        '--header-link-padding-block': `${header.navigationLinkBlockPaddingRem}rem`,
        '--header-link-padding-inline': `${header.navigationLinkInlinePaddingRem}rem`,
        '--header-logo-font-size': `${header.desktopLogoFontRem}rem`,
        '--header-mobile-logo-font-size': `${header.mobileLogoFontRem}rem`,
        '--header-mobile-grid-gap': `${header.mobileGridGapPx}px`,
        '--header-mobile-toggle-size': `${header.mobileToggleSizePx}px`,
        '--header-mobile-toggle-icon-size': `${header.mobileToggleIconSizePx}px`,
        '--orb-node-size': `${nodes.baseSizePx}px`,
        '--orb-node-icon-size': `${nodes.baseIconSizePx}px`,
        '--orb-node-icon-stroke': nodes.baseIconStrokeWidthPx,
        '--orb-node-border-width': `${nodes.baseBorderWidthPx}px`,
        '--orb-node-active-size': `${nodes.activeSizePx}px`,
        '--orb-node-active-icon-size': `${nodes.activeIconSizePx}px`,
        '--orb-node-active-icon-stroke': nodes.activeIconStrokeWidthPx,
        '--orb-node-active-border-width': `${nodes.activeBorderWidthPx}px`,
        '--orb-node-mobile-hit-target': `${nodes.mobileHitTargetSizePx}px`,
        '--orb-node-label-gap': `${nodes.labelGapPx}px`,
        '--orb-node-label-connector-length': `${nodes.labelConnectorLengthPx}px`,
        '--orb-node-shadow-offset': `${nodes.shadowOffsetPx}px`,
        '--orb-node-shadow-opacity': nodes.shadowOpacity,
        '--orb-node-mobile-label-offset': `${nodes.mobileLabelOffsetPx}px`,
        '--orb-node-mobile-active-label-offset': `${nodes.mobileActiveLabelOffsetPx}px`,
        '--layout-desktop-portrait-column-min': `${orb.desktopPortraitColumnMinimumPx}px`,
        '--layout-desktop-portrait-column': `${orb.desktopPortraitColumnPercent}%`,
        '--layout-desktop-orb-column-min': `${orb.desktopOrbColumnMinimumPx}px`,
        '--layout-desktop-orb-column': `${orb.desktopOrbColumnPercent}%`,
        '--layout-medium-portrait-column-min': `${orb.mediumPortraitColumnMinimumPx}px`,
        '--layout-medium-portrait-column': `${orb.mediumPortraitColumnPercent}%`,
        '--layout-medium-orb-column-min': `${orb.mediumOrbColumnMinimumPx}px`,
        '--layout-medium-orb-column': `${orb.mediumOrbColumnPercent}%`,
        '--layout-tablet-orb-column-min': `${orb.tabletOrbColumnMinimumPx}px`,
        '--layout-tablet-orb-column': `${orb.tabletOrbColumnPercent}%`,
        '--layout-mobile-orb-width': `${orb.mobileOrbWidthVw}vw`,
        '--layout-mobile-orb-max': `${orb.mobileOrbMaximumPx}px`,
        '--layout-mobile-orb-row-min': `${orb.mobileOrbRowMinimumPx}px`,
        '--layout-mobile-orb-row-height': `${orb.mobileOrbRowHeightDvh}dvh`,
        '--layout-mobile-orb-translate-y': `${orb.mobileOrbTranslateYPx}px`
    };
    Object.entries(values).forEach(([name, value]) => root.style.setProperty(name, value));
}

global.PortfolioConstants = Object.freeze({
    AMBIENT_BLOB_SETTINGS,
    applyPortfolioCssConstants,
    LAYOUT_SETTINGS,
    ORB_BASE_ROTATION_DEGREES_PER_SECOND,
    ORB_NODE_VECTORS,
    ORB_ROTATION_SPEED_MULTIPLIER,
    ORB_SETTINGS,
    PORTFOLIO_CONSTANTS,
    PROFILE_IMAGE_BASE_SIZES,
    PROFILE_IMAGE_SCALE,
    PROFILE_IMAGE_SIZES,
    RUNTIME_SETTINGS,
    SECTION_IDS,
    UI_SETTINGS,
    WIREFRAME_SETTINGS,
    WORLD_NORTH
});
})(globalThis);
