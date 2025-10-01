// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.getElementById('canvas-container').appendChild(renderer.domElement);

camera.position.z = 50;

// Zodiac constellation data with positions and connections
const zodiacData = {
    aries: {
        name: "Aries (The Ram)",
        stars: [
            { x: 15, y: 5, z: -20, brightness: 1.5 },
            { x: 18, y: 3, z: -22, brightness: 1.2 },
            { x: 20, y: 1, z: -19, brightness: 1.0 },
            { x: 16, y: 2, z: -21, brightness: 0.9 }
        ],
        connections: [[0, 1], [1, 2], [2, 3]]
    },
    taurus: {
        name: "Taurus (The Bull)",
        stars: [
            { x: -10, y: 8, z: -25, brightness: 1.8 },
            { x: -12, y: 6, z: -23, brightness: 1.4 },
            { x: -8, y: 5, z: -24, brightness: 1.2 },
            { x: -11, y: 4, z: -22, brightness: 1.1 },
            { x: -9, y: 7, z: -26, brightness: 1.0 }
        ],
        connections: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0]]
    },
    gemini: {
        name: "Gemini (The Twins)",
        stars: [
            { x: 5, y: 12, z: -28, brightness: 1.6 },
            { x: 7, y: 10, z: -27, brightness: 1.5 },
            { x: 9, y: 12, z: -29, brightness: 1.4 },
            { x: 11, y: 10, z: -28, brightness: 1.3 },
            { x: 7, y: 8, z: -26, brightness: 1.0 },
            { x: 9, y: 8, z: -27, brightness: 1.0 }
        ],
        connections: [[0, 1], [1, 4], [2, 3], [3, 5], [1, 2]]
    },
    cancer: {
        name: "Cancer (The Crab)",
        stars: [
            { x: -5, y: 15, z: -30, brightness: 1.1 },
            { x: -3, y: 13, z: -29, brightness: 1.0 },
            { x: -6, y: 12, z: -31, brightness: 0.9 },
            { x: -4, y: 14, z: -28, brightness: 0.9 }
        ],
        connections: [[0, 1], [1, 2], [2, 3], [3, 0]]
    },
    leo: {
        name: "Leo (The Lion)",
        stars: [
            { x: -15, y: 12, z: -32, brightness: 2.0 },
            { x: -18, y: 10, z: -30, brightness: 1.5 },
            { x: -20, y: 12, z: -33, brightness: 1.3 },
            { x: -17, y: 14, z: -31, brightness: 1.2 },
            { x: -16, y: 9, z: -29, brightness: 1.1 },
            { x: -19, y: 8, z: -32, brightness: 1.0 }
        ],
        connections: [[0, 1], [1, 2], [2, 3], [3, 0], [1, 4], [4, 5]]
    },
    virgo: {
        name: "Virgo (The Virgin)",
        stars: [
            { x: -25, y: 5, z: -35, brightness: 1.7 },
            { x: -23, y: 3, z: -33, brightness: 1.3 },
            { x: -26, y: 2, z: -36, brightness: 1.2 },
            { x: -24, y: 4, z: -34, brightness: 1.1 },
            { x: -27, y: 6, z: -37, brightness: 1.0 }
        ],
        connections: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0]]
    },
    libra: {
        name: "Libra (The Scales)",
        stars: [
            { x: -22, y: -5, z: -30, brightness: 1.4 },
            { x: -24, y: -3, z: -32, brightness: 1.2 },
            { x: -20, y: -4, z: -31, brightness: 1.1 },
            { x: -23, y: -6, z: -29, brightness: 1.0 }
        ],
        connections: [[0, 1], [0, 2], [1, 3], [2, 3]]
    },
    scorpio: {
        name: "Scorpio (The Scorpion)",
        stars: [
            { x: -15, y: -10, z: -33, brightness: 1.9 },
            { x: -17, y: -12, z: -31, brightness: 1.5 },
            { x: -19, y: -11, z: -34, brightness: 1.3 },
            { x: -16, y: -13, z: -32, brightness: 1.2 },
            { x: -14, y: -14, z: -35, brightness: 1.1 },
            { x: -12, y: -12, z: -33, brightness: 1.0 }
        ],
        connections: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5]]
    },
    sagittarius: {
        name: "Sagittarius (The Archer)",
        stars: [
            { x: -5, y: -15, z: -28, brightness: 1.6 },
            { x: -7, y: -13, z: -30, brightness: 1.4 },
            { x: -9, y: -14, z: -29, brightness: 1.3 },
            { x: -6, y: -16, z: -31, brightness: 1.2 },
            { x: -8, y: -12, z: -27, brightness: 1.1 }
        ],
        connections: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 1]]
    },
    capricorn: {
        name: "Capricorn (The Goat)",
        stars: [
            { x: 8, y: -12, z: -26, brightness: 1.3 },
            { x: 10, y: -14, z: -28, brightness: 1.2 },
            { x: 12, y: -13, z: -27, brightness: 1.1 },
            { x: 9, y: -15, z: -29, brightness: 1.0 },
            { x: 11, y: -11, z: -25, brightness: 0.9 }
        ],
        connections: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0]]
    },
    aquarius: {
        name: "Aquarius (The Water Bearer)",
        stars: [
            { x: 18, y: -8, z: -24, brightness: 1.5 },
            { x: 20, y: -10, z: -26, brightness: 1.3 },
            { x: 22, y: -9, z: -25, brightness: 1.2 },
            { x: 19, y: -11, z: -27, brightness: 1.1 },
            { x: 21, y: -7, z: -23, brightness: 1.0 }
        ],
        connections: [[0, 1], [1, 2], [2, 3], [3, 4]]
    },
    pisces: {
        name: "Pisces (The Fish)",
        stars: [
            { x: 25, y: 0, z: -22, brightness: 1.4 },
            { x: 27, y: 2, z: -24, brightness: 1.2 },
            { x: 23, y: 1, z: -23, brightness: 1.1 },
            { x: 26, y: -1, z: -25, brightness: 1.0 },
            { x: 28, y: 3, z: -21, brightness: 1.0 },
            { x: 24, y: 2, z: -26, brightness: 0.9 }
        ],
        connections: [[0, 1], [1, 4], [0, 2], [2, 3], [3, 5]]
    }
};

// Store constellation objects
const constellations = {};
let activeConstellation = null;

// Create realistic star texture
function createStarTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');

    const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.2, 'rgba(255,255,255,0.8)');
    gradient.addColorStop(0.4, 'rgba(255,255,255,0.4)');
    gradient.addColorStop(0.7, 'rgba(255,255,255,0.1)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 32, 32);

    const texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;
    return texture;
}

// Create background stars with realistic colors
const backgroundStars = new THREE.Group();
const starGeometry = new THREE.BufferGeometry();
const starPositions = [];
const starSizes = [];
const starColors = [];

// Star color temperatures (more realistic)
const starColorPalette = [
    { r: 0.6, g: 0.7, b: 1.0 },    // Blue-white (hot)
    { r: 1.0, g: 1.0, b: 1.0 },    // White
    { r: 1.0, g: 0.95, b: 0.8 },   // Yellow-white
    { r: 1.0, g: 0.85, b: 0.7 },   // Orange
    { r: 1.0, g: 0.7, b: 0.6 }     // Red (cool)
];

for (let i = 0; i < 5000; i++) {
    const x = (Math.random() - 0.5) * 200;
    const y = (Math.random() - 0.5) * 200;
    const z = (Math.random() - 0.5) * 200;
    starPositions.push(x, y, z);

    // Vary star sizes more realistically
    const size = Math.random() < 0.7 ? Math.random() * 0.5 + 0.3 : Math.random() * 2 + 1;
    starSizes.push(size);

    // Random realistic star color
    const colorIndex = Math.floor(Math.random() * starColorPalette.length);
    const color = starColorPalette[colorIndex];
    starColors.push(color.r, color.g, color.b);
}

starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
starGeometry.setAttribute('size', new THREE.Float32BufferAttribute(starSizes, 1));
starGeometry.setAttribute('color', new THREE.Float32BufferAttribute(starColors, 3));

const starTexture = createStarTexture();
const starMaterial = new THREE.PointsMaterial({
    size: 0.8,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.9,
    vertexColors: true,
    map: starTexture,
    blending: THREE.AdditiveBlending,
    depthWrite: false
});

const stars = new THREE.Points(starGeometry, starMaterial);
backgroundStars.add(stars);
scene.add(backgroundStars);

// Create text sprite for labels
function createTextLabel(text, position) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 512;
    canvas.height = 128;

    context.font = 'Bold 48px Courier New, monospace';
    context.fillStyle = 'rgba(255, 255, 255, 0.95)';
    context.textAlign = 'center';
    context.textBaseline = 'middle';

    // Add text shadow for better visibility
    context.shadowColor = 'rgba(0, 0, 0, 0.8)';
    context.shadowBlur = 10;
    context.shadowOffsetX = 2;
    context.shadowOffsetY = 2;

    context.fillText(text, 256, 64);

    const texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;

    const spriteMaterial = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        opacity: 0.9
    });

    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.position.copy(position);
    sprite.scale.set(8, 2, 1);

    return sprite;
}

// Create zodiac constellations with realistic stars
function createConstellation(zodiacKey, data) {
    const group = new THREE.Group();

    // Calculate center position for label
    let centerX = 0, centerY = 0, centerZ = 0;
    data.stars.forEach(star => {
        centerX += star.x;
        centerY += star.y;
        centerZ += star.z;
    });
    centerX /= data.stars.length;
    centerY /= data.stars.length;
    centerZ /= data.stars.length;

    // Create stars for this constellation with more realistic appearance
    const starMeshes = [];
    const starTexture = createStarTexture();

    data.stars.forEach((star) => {
        const size = star.brightness * 0.4;

        // Create main star using sprite for better appearance
        const starSpriteMaterial = new THREE.SpriteMaterial({
            map: starTexture,
            color: 0xffffdd,
            transparent: true,
            opacity: 0.95,
            blending: THREE.AdditiveBlending
        });
        const starSprite = new THREE.Sprite(starSpriteMaterial);
        starSprite.position.set(star.x, star.y, star.z);
        starSprite.scale.set(size * 2, size * 2, 1);

        // Add multiple glow layers for depth
        const glowLayers = [
            { scale: 3, opacity: 0.3, color: 0xffffaa },
            { scale: 5, opacity: 0.15, color: 0xffddaa },
            { scale: 7, opacity: 0.05, color: 0xffccaa }
        ];

        glowLayers.forEach(layer => {
            const glowMaterial = new THREE.SpriteMaterial({
                map: starTexture,
                color: layer.color,
                transparent: true,
                opacity: layer.opacity,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            });
            const glow = new THREE.Sprite(glowMaterial);
            glow.scale.set(size * layer.scale, size * layer.scale, 1);
            starSprite.add(glow);
        });

        group.add(starSprite);
        starMeshes.push(starSprite);
    });

    // Create connections (constellation lines)
    const lineMaterial = new THREE.LineBasicMaterial({
        color: 0x88ccff,
        transparent: true,
        opacity: 0.5,
        linewidth: 2
    });

    data.connections.forEach((connection) => {
        const points = [
            data.stars[connection[0]],
            data.stars[connection[1]]
        ];
        const lineGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(points[0].x, points[0].y, points[0].z),
            new THREE.Vector3(points[1].x, points[1].y, points[1].z)
        ]);
        const line = new THREE.Line(lineGeometry, lineMaterial);
        group.add(line);
    });

    // Add label above the constellation
    const labelPosition = new THREE.Vector3(centerX, centerY + 5, centerZ);
    const label = createTextLabel(data.name.toUpperCase(), labelPosition);
    group.add(label);

    group.visible = false;
    scene.add(group);

    return { group, starMeshes, data, label };
}

// Initialize all constellations
Object.keys(zodiacData).forEach(key => {
    constellations[key] = createConstellation(key, zodiacData[key]);
});

// Mouse and Touch interaction
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };
let rotation = { x: 0, y: 0 };

// Mouse events
renderer.domElement.addEventListener('mousedown', (e) => {
    isDragging = true;
    previousMousePosition = { x: e.clientX, y: e.clientY };
});

renderer.domElement.addEventListener('mousemove', (e) => {
    if (isDragging) {
        const deltaX = e.clientX - previousMousePosition.x;
        const deltaY = e.clientY - previousMousePosition.y;

        rotation.y += deltaX * 0.005;
        rotation.x += deltaY * 0.005;

        previousMousePosition = { x: e.clientX, y: e.clientY };
    }
});

renderer.domElement.addEventListener('mouseup', () => {
    isDragging = false;
});

// Touch events for mobile
renderer.domElement.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
        isDragging = true;
        previousMousePosition = {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY
        };
    }
}, { passive: true });

renderer.domElement.addEventListener('touchmove', (e) => {
    if (isDragging && e.touches.length === 1) {
        const deltaX = e.touches[0].clientX - previousMousePosition.x;
        const deltaY = e.touches[0].clientY - previousMousePosition.y;

        rotation.y += deltaX * 0.005;
        rotation.x += deltaY * 0.005;

        previousMousePosition = {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY
        };
    }
}, { passive: true });

renderer.domElement.addEventListener('touchend', () => {
    isDragging = false;
});

// Pinch to zoom for mobile
let initialPinchDistance = 0;
renderer.domElement.addEventListener('touchstart', (e) => {
    if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        initialPinchDistance = Math.sqrt(dx * dx + dy * dy);
    }
}, { passive: true });

renderer.domElement.addEventListener('touchmove', (e) => {
    if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        const delta = initialPinchDistance - distance;
        camera.position.z += delta * 0.05;
        camera.position.z = Math.max(20, Math.min(100, camera.position.z));

        initialPinchDistance = distance;
    }
}, { passive: true });

// Zoom with mouse wheel
renderer.domElement.addEventListener('wheel', (e) => {
    e.preventDefault();
    camera.position.z += e.deltaY * 0.05;
    camera.position.z = Math.max(20, Math.min(100, camera.position.z));
});

// Zodiac selector buttons
const zodiacButtons = document.querySelectorAll('.zodiac-btn');
const constellationInfo = document.getElementById('constellation-info');

zodiacButtons.forEach(button => {
    button.addEventListener('click', () => {
        const zodiacName = button.getAttribute('data-zodiac');

        // Remove active class from all buttons
        zodiacButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        if (zodiacName === 'all') {
            // Show all constellations
            Object.keys(constellations).forEach(key => {
                constellations[key].group.visible = true;
            });
            constellationInfo.textContent = 'Showing all zodiac constellations';
            activeConstellation = null;
        } else {
            // Hide all constellations
            Object.keys(constellations).forEach(key => {
                constellations[key].group.visible = false;
            });

            // Show selected constellation
            if (constellations[zodiacName]) {
                constellations[zodiacName].group.visible = true;
                constellationInfo.textContent = constellations[zodiacName].data.name;
                activeConstellation = zodiacName;
            }
        }
    });
});

// Window resize handler
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Animation variables
let time = 0;

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    time += 0.01;

    // Rotate scene based on mouse drag
    scene.rotation.y = rotation.y;
    scene.rotation.x = rotation.x;

    // Animate background stars twinkle (subtle and realistic)
    const sizes = starGeometry.attributes.size.array;
    for (let i = 0; i < sizes.length; i++) {
        const baseSize = i < 3500 ? 0.4 : 1.5; // Most stars small, some larger
        sizes[i] = baseSize + Math.abs(Math.sin(time * 0.5 + i * 0.1)) * 0.2;
    }
    starGeometry.attributes.size.needsUpdate = true;

    // Animate constellation stars and labels
    Object.keys(constellations).forEach(key => {
        const constellation = constellations[key];
        if (constellation.group.visible) {
            constellation.starMeshes.forEach((mesh, index) => {
                // Subtle pulsing effect for realism
                const baseScale = mesh.scale.x / (1 + Math.sin(time * 2 + index) * 0.15);
                const scale = baseScale * (1 + Math.sin(time * 2 + index) * 0.15);
                mesh.scale.set(scale, scale, 1);
            });

            // Gently pulse the label
            if (constellation.label) {
                const labelScale = 1 + Math.sin(time * 0.5) * 0.05;
                constellation.label.scale.set(8 * labelScale, 2 * labelScale, 1);
            }
        }
    });

    // Slowly rotate the entire cosmos
    backgroundStars.rotation.y += 0.0002;

    renderer.render(scene, camera);
}

// Start animation
animate();

// Show a random constellation on load
const zodiacKeys = Object.keys(zodiacData);
const randomZodiac = zodiacKeys[Math.floor(Math.random() * zodiacKeys.length)];
document.querySelector(`[data-zodiac="${randomZodiac}"]`).click();

// Mobile detection and UI toggle
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;

if (isMobile) {
    document.body.classList.add('mobile');
}

// Toggle UI button functionality
const toggleUIButton = document.getElementById('toggle-ui');
toggleUIButton.addEventListener('click', () => {
    if (isMobile) {
        document.body.classList.toggle('ui-visible');
    } else {
        document.body.classList.toggle('ui-hidden');
    }
});
