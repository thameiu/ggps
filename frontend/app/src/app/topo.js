
const canvas = document.getElementById("topo-canvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const lines = [];
const numLines = 30; // Number of topographical layers
const lineSpacing = 40; // Spacing between layers

// Initialize lines
for (let i = 0; i < numLines; i++) {
lines.push({
y: i * lineSpacing,
speed: Math.random() * 2 + 1, // Different speeds for parallax effect
});
}

// Draw topographical lines
function drawLines() {
ctx.clearRect(0, 0, canvas.width, canvas.height);
ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
ctx.lineWidth = 2;

lines.forEach((line) => {
ctx.beginPath();
for (let x = 0; x < canvas.width; x += 10) {
const yOffset = Math.sin((x + line.y) / 100) * 20; // Wave-like effect
ctx.lineTo(x, line.y + yOffset);
}
ctx.stroke();

// Move the line upwards
line.y -= line.speed;
if (line.y < -lineSpacing) {
line.y = canvas.height + lineSpacing; // Loop back to the bottom
}
});
}

function animate() {
drawLines();
requestAnimationFrame(animate);
}

animate();
