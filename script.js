// @ts-nocheck
// FísicaLab — simulador de caída libre
// Este archivo usa JavaScript estándar (no necesita TypeScript).

"use strict";

const byId = (id) => document.getElementById(id);

const massInput = byId("mass");
const heightInput = byId("height");
const gravityInput = byId("gravity");
const progressInput = byId("progress");
const playButton = byId("playBtn");
const resetButton = byId("resetBtn");

let animationFrame = null;
let previousFrameTime = 0;

function formatNumber(value, digits = 2) {
  return Number(value).toFixed(digits);
}

function getValues() {
  const mass = Number(massInput.value);
  const initialHeight = Number(heightInput.value);
  const gravity = Number(gravityInput.value);
  const fraction = Number(progressInput.value) / 100;

  const currentHeight = initialHeight * (1 - fraction);
  const velocity = Math.sqrt(
    Math.max(0, 2 * gravity * (initialHeight - currentHeight))
  );
  const potentialEnergy = mass * gravity * currentHeight;
  const kineticEnergy = 0.5 * mass * velocity ** 2;
  const mechanicalEnergy = mass * gravity * initialHeight;
  const elapsedTime = Math.sqrt(
    Math.max(0, (2 * (initialHeight - currentHeight)) / gravity)
  );

  return {
    mass,
    initialHeight,
    gravity,
    fraction,
    currentHeight,
    velocity,
    potentialEnergy,
    kineticEnergy,
    mechanicalEnergy,
    elapsedTime
  };
}

function updateScene(values) {
  const scene = byId("scene");
  const ball = byId("ball");

  if (scene && ball) {
    const availableDistance = Math.max(0, scene.clientHeight - 45 - 48);
    const ballTop = 45 + values.fraction * availableDistance;
    ball.style.top = `${ballTop}px`;
  }

  byId("sceneHeight").textContent = `${formatNumber(values.currentHeight, 1)} m`;
  byId("heightMarker").textContent = `${formatNumber(values.initialHeight, 0)} m`;
  byId("sceneTime").textContent = `t = ${formatNumber(values.elapsedTime)} s`;
}

function updateMetrics(values) {
  byId("massOut").textContent = `${formatNumber(values.mass, 1)} kg`;
  byId("heightOut").textContent = `${formatNumber(values.initialHeight, 0)} m`;
  byId("gravityOut").textContent = `${formatNumber(values.gravity, 2)} m/s²`;
  byId("progressOut").textContent = `${formatNumber(values.fraction * 100, 0)}%`;

  byId("velocity").innerHTML = `${formatNumber(values.velocity)} <small>m/s</small>`;
  byId("potential").innerHTML = `${formatNumber(values.potentialEnergy)} <small>J</small>`;
  byId("kinetic").innerHTML = `${formatNumber(values.kineticEnergy)} <small>J</small>`;
  byId("mechanical").innerHTML = `${formatNumber(values.mechanicalEnergy)} <small>J</small>`;
  byId("totalEnergy").textContent = `${formatNumber(values.mechanicalEnergy)} J`;

  const potentialPercent = values.mechanicalEnergy > 0
    ? (values.potentialEnergy / values.mechanicalEnergy) * 100
    : 0;
  const kineticPercent = values.mechanicalEnergy > 0
    ? (values.kineticEnergy / values.mechanicalEnergy) * 100
    : 0;

  byId("potentialBar").style.width = `${potentialPercent}%`;
  byId("kineticBar").style.width = `${kineticPercent}%`;
  byId("potentialPercent").textContent = `${formatNumber(potentialPercent, 1)}%`;
  byId("kineticPercent").textContent = `${formatNumber(kineticPercent, 1)}%`;
}

function renderTable(values) {
  const tableBody = byId("dataRows");
  tableBody.replaceChildren();

  [0, 25, 50, 75, 100].forEach((percent) => {
    const fraction = percent / 100;
    const currentHeight = values.initialHeight * (1 - fraction);
    const velocity = Math.sqrt(
      Math.max(0, 2 * values.gravity * (values.initialHeight - currentHeight))
    );
    const potential = values.mass * values.gravity * currentHeight;
    const kinetic = 0.5 * values.mass * velocity ** 2;
    const mechanical = values.mass * values.gravity * values.initialHeight;

    const row = document.createElement("tr");
    const cells = [
      `${percent}%`,
      formatNumber(currentHeight),
      formatNumber(velocity),
      formatNumber(potential),
      formatNumber(kinetic),
      formatNumber(mechanical)
    ];

    cells.forEach((value) => {
      const cell = document.createElement("td");
      cell.textContent = value;
      row.appendChild(cell);
    });

    tableBody.appendChild(row);
  });
}

function drawChart(values) {
  const canvas = byId("energyChart");
  if (!canvas) return;

  const rect = canvas.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return;

  const pixelRatio = window.devicePixelRatio || 1;
  canvas.width = Math.round(rect.width * pixelRatio);
  canvas.height = Math.round(rect.height * pixelRatio);

  const context = canvas.getContext("2d");
  if (!context) return;

  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  context.clearRect(0, 0, rect.width, rect.height);

  const width = rect.width;
  const height = rect.height;
  const padding = { left: 42, right: 12, top: 10, bottom: 28 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const maxEnergy = Math.max(1, values.mechanicalEnergy);

  const x = (fraction) => padding.left + fraction * chartWidth;
  const y = (energy) =>
    padding.top + chartHeight - (energy / maxEnergy) * chartHeight;

  context.font = "10px monospace";
  context.textAlign = "right";
  context.textBaseline = "middle";

  for (let index = 0; index <= 4; index += 1) {
    const energy = (maxEnergy * index) / 4;
    const yPosition = y(energy);

    context.beginPath();
    context.moveTo(padding.left, yPosition);
    context.lineTo(width - padding.right, yPosition);
    context.strokeStyle = "#e8eef2";
    context.lineWidth = 1;
    context.stroke();

    context.fillStyle = "#8999a4";
    context.fillText(String(Math.round(energy)), padding.left - 8, yPosition);
  }

  context.textAlign = "center";
  context.textBaseline = "top";
  ["0%", "25%", "50%", "75%", "100%"].forEach((label, index) => {
    context.fillText(label, x(index / 4), height - 18);
  });

  function drawEnergyLine(color, energyAtFraction) {
    context.beginPath();

    for (let index = 0; index <= 100; index += 1) {
      const fraction = index / 100;
      const xPosition = x(fraction);
      const yPosition = y(energyAtFraction(fraction));

      if (index === 0) {
        context.moveTo(xPosition, yPosition);
      } else {
        context.lineTo(xPosition, yPosition);
      }
    }

    context.strokeStyle = color;
    context.lineWidth = 2.5;
    context.lineJoin = "round";
    context.stroke();
  }

  drawEnergyLine("#3c91d7", (fraction) =>
    values.mechanicalEnergy * (1 - fraction)
  );
  drawEnergyLine("#45b9b1", (fraction) =>
    values.mechanicalEnergy * fraction
  );

  const currentX = x(values.fraction);
  const currentY = y(values.kineticEnergy);
  context.beginPath();
  context.arc(currentX, currentY, 4, 0, Math.PI * 2);
  context.fillStyle = "#45b9b1";
  context.fill();
}

function updatePage() {
  const values = getValues();
  updateMetrics(values);
  updateScene(values);
  renderTable(values);
  drawChart(values);
}

function stopAnimation() {
  if (animationFrame !== null) {
    cancelAnimationFrame(animationFrame);
  }

  animationFrame = null;
  previousFrameTime = 0;
  playButton.textContent = "▶ Iniciar caída";
}

function animate(timestamp) {
  if (previousFrameTime === 0) {
    previousFrameTime = timestamp;
  }

  const elapsedMilliseconds = timestamp - previousFrameTime;
  previousFrameTime = timestamp;

  const fallTime = Math.sqrt(
    (2 * Number(heightInput.value)) / Number(gravityInput.value)
  );
  const animationDuration = Math.max(1800, fallTime * 1000);
  const increment = (elapsedMilliseconds / animationDuration) * 100;

  progressInput.value = String(
    Math.min(100, Number(progressInput.value) + increment)
  );

  updatePage();

  if (Number(progressInput.value) >= 100) {
    stopAnimation();
    return;
  }

  animationFrame = requestAnimationFrame(animate);
}

playButton.addEventListener("click", () => {
  if (animationFrame !== null) {
    stopAnimation();
    return;
  }

  if (Number(progressInput.value) >= 100) {
    progressInput.value = "0";
  }

  playButton.textContent = "Ⅱ Pausar caída";
  previousFrameTime = 0;
  animationFrame = requestAnimationFrame(animate);
});

resetButton.addEventListener("click", () => {
  stopAnimation();
  progressInput.value = "0";
  updatePage();
});

[massInput, heightInput, gravityInput, progressInput].forEach((input) => {
  input.addEventListener("input", () => {
    if (input !== progressInput) {
      stopAnimation();
    }
    updatePage();
  });
});

window.addEventListener("resize", () => {
  drawChart(getValues());
});

// Inicializa todos los valores al abrir la página.
updatePage();
