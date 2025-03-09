// Инициализация основных элементов DOM
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const velocitySpan = document.getElementById('velocity');
const altitudeSpan = document.getElementById('altitude');
const fuelSpan = document.getElementById('fuel');
const restartBtn = document.getElementById('restart-btn');
const gameOver = document.getElementById('game-over');
const resultText = document.getElementById('result-text');
const resultDetails = document.getElementById('result-details');
const instructions = document.getElementById('instructions');
const thrustBtn = document.getElementById('thrust-btn');
const leftBtn = document.getElementById('left-btn');
const rightBtn = document.getElementById('right-btn');
const startBtn = document.getElementById('start-btn');
const mobileControls = document.getElementById('mobile-controls');
const gameContainer = document.getElementById('game-container');
let stars = [];
let gameStarted = false;

// Функция изменения размера холста и адаптации элементов
function resizeCanvas() {
  const actualHeight = window.innerHeight;
  gameContainer.style.height = `${actualHeight}px`;
  canvas.width = window.innerWidth;
  canvas.height = actualHeight;
  
  ship.x = canvas.width / 2;
  generateTerrain();
  generateStars();
  
  const scaleFactor = Math.min(canvas.width / 1000, 1);
  ship.width = 30 * scaleFactor;
  ship.height = 60 * scaleFactor;
  ship.thrust = 0.1 * (canvas.height / 800);
  ship.gravity = 0.05 * (canvas.height / 800);
  
  adjustMobileControls();
}

// Объект корабля с начальными параметрами
let ship = {
  x: canvas.width / 2,
  y: 50,
  width: 30,
  height: 60,
  velocityY: 0,
  velocityX: 0,
  thrust: 0.1,
  gravity: 0.05,
  fuel: 200
};

// Объект посадочной площадки
let landing = { x: 0, width: 0, y: 0 };
let terrain = [];
let gameActive = false;
let keys = {};
let lastTime = performance.now();

// Генерация случайного рельефа и уменьшенной посадочной площадки
function generateTerrain() {
  terrain = [];
  const segments = Math.max(20, Math.floor(canvas.width / 25));
  const segmentWidth = canvas.width / segments;
  const baseHeight = canvas.height * 0.7;
  
  const minLandingWidth = Math.max(80, ship.width * 2.5);
  const landingWidthOriginal = Math.max(minLandingWidth, Math.min(100, canvas.width * 0.15));
  const landingWidth = landingWidthOriginal / 2;
  const landingSegments = Math.ceil(landingWidth / segmentWidth);
  
  const minLandingStart = Math.floor(segments * 0.1);
  const maxLandingStart = Math.floor(segments * 0.9 - landingSegments);
  const landingStart = Math.floor(Math.random() * (maxLandingStart - minLandingStart + 1)) + minLandingStart;
  
  let previousHeight = baseHeight - (Math.random() * 50);
  for (let i = 0; i <= segments; i++) {
    let height;
    if (i >= landingStart && i < landingStart + landingSegments) {
      height = baseHeight;
    } else {
      const variation = (Math.random() - 0.5) * 40;
      height = Math.min(baseHeight, Math.max(canvas.height * 0.5, previousHeight + variation));
    }
    terrain.push({ x: i * segmentWidth, y: height });
    previousHeight = height;
  }
  
  landing = {
    x: landingStart * segmentWidth,
    width: landingSegments * segmentWidth,
    y: baseHeight - 5
  };
}

// Генерация звездного фона
function generateStars() {
  stars = [];
  const starCount = Math.max(50, Math.floor(canvas.width * canvas.height / 4000));
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height * 0.7,
      radius: Math.random() * 1.5,
      brightness: Math.random()
    });
  }
}

// Корректировка отображения мобильных кнопок
function adjustMobileControls() {
  if (gameActive && window.innerWidth <= 600) {
    mobileControls.style.display = 'flex';
  }
}

// Настройка мобильного управления
function setupMobileControls() {
  const buttons = {
    'thrust-btn': 'ArrowUp',
    'left-btn': 'ArrowLeft',
    'right-btn': 'ArrowRight'
  };
  
  Object.entries(buttons).forEach(([id, key]) => {
    const btn = document.getElementById(id);
    btn.addEventListener('touchstart', (e) => { e.preventDefault(); keys[key] = true; });
    btn.addEventListener('touchend', (e) => { e.preventDefault(); keys[key] = false; });
    btn.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const rect = btn.getBoundingClientRect();
      const isInside = touch.clientX >= rect.left && touch.clientX <= rect.right &&
                       touch.clientY >= rect.top && touch.clientY <= rect.bottom;
      keys[key] = isInside;
    });
    btn.addEventListener('touchcancel', (e) => { e.preventDefault(); keys[key] = false; });
    btn.addEventListener('mousedown', () => { keys[key] = true; });
    btn.addEventListener('mouseup', () => { keys[key] = false; });
  });
}

setupMobileControls();

// Обработчик кнопки "Старт"
startBtn.addEventListener('click', function() {
  gameStarted = true;
  gameActive = true;
  startBtn.style.display = 'none';
  instructions.style.display = 'none';
  if (window.innerWidth <= 600) {
    mobileControls.style.display = 'flex';
    adjustMobileControls();
  }
  lastTime = performance.now();
  animate(lastTime);
});

// Обработчик кнопки "Новая игра"
restartBtn.addEventListener('click', function() {
  const scaleFactor = Math.min(canvas.width / 1000, 1);
  ship = {
    x: canvas.width / 2,
    y: 50,
    width: 30 * scaleFactor,
    height: 60 * scaleFactor,
    velocityY: 0,
    velocityX: 0,
    thrust: 0.1 * (canvas.height / 800),
    gravity: 0.05 * (canvas.height / 800),
    fuel: 200
  };
  
  generateTerrain();
  generateStars();
  gameActive = true;
  gameOver.style.display = 'none';
  restartBtn.style.display = 'none';
  instructions.style.display = 'none';
  if (window.innerWidth <= 600) {
    mobileControls.style.display = 'flex';
    adjustMobileControls();
  }
  lastTime = performance.now();
  animate(lastTime);
});

// Отрисовка корабля
function drawShip() {
  const baseWidth = ship.width * 1.5;
  const baseHeight = ship.height * 1.5;

  ctx.fillStyle = '#e0e8ff';
  ctx.beginPath();
  ctx.moveTo(ship.x, ship.y - baseHeight/2);
  ctx.lineTo(ship.x + baseWidth/2, ship.y + baseHeight/2);
  ctx.lineTo(ship.x - baseWidth/2, ship.y + baseHeight/2);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = '#3366cc';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#99ccff';
  ctx.beginPath();
  ctx.arc(ship.x, ship.y - baseHeight/4, baseWidth/5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#0044aa';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = '#b3c6ff';
  ctx.beginPath();
  ctx.moveTo(ship.x - baseWidth/4, ship.y);
  ctx.lineTo(ship.x - baseWidth/2 - baseWidth/4, ship.y + baseHeight/3);
  ctx.lineTo(ship.x - baseWidth/2, ship.y + baseHeight/2);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#3366cc';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(ship.x + baseWidth/4, ship.y);
  ctx.lineTo(ship.x + baseWidth/2 + baseWidth/4, ship.y + baseHeight/3);
  ctx.lineTo(ship.x + baseWidth/2, ship.y + baseHeight/2);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#3366cc';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  const fontSize = Math.max(12, baseWidth / 3);
  ctx.fillStyle = '#0077ff';
  ctx.font = `bold ${fontSize}px Arial`;
  ctx.textAlign = 'center';
  ctx.fillText('SpaceX', ship.x, ship.y - baseHeight/2 - fontSize/2);

  ctx.shadowColor = 'rgba(0, 119, 255, 0.6)';
  ctx.shadowBlur = 5;
  ctx.fillText('SpaceX', ship.x, ship.y - baseHeight/2 - fontSize/2);
  ctx.shadowBlur = 0;

  if (keys['ArrowUp'] && ship.fuel > 0) {
    const fireGradient = ctx.createLinearGradient(ship.x, ship.y + baseHeight/2, ship.x, ship.y + baseHeight/2 + 30 * (baseHeight/60));
    fireGradient.addColorStop(0, '#ff5500');
    fireGradient.addColorStop(0.5, '#ffaa00');
    fireGradient.addColorStop(1, '#ffff00');
    ctx.fillStyle = fireGradient;

    ctx.beginPath();
    ctx.moveTo(ship.x - baseWidth/4, ship.y + baseHeight/2);
    ctx.lineTo(ship.x + baseWidth/4, ship.y + baseHeight/2);
    ctx.lineTo(ship.x, ship.y + baseHeight/2 + 25 * (baseHeight/60) + Math.random() * 15 * (baseHeight/60));
    ctx.closePath();
    ctx.fill();

    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = `rgba(255, ${Math.floor(100 + Math.random() * 155)}, 0, ${Math.random() * 0.7 + 0.3})`;
      const particleSize = Math.random() * 5 + 3;
      const offsetX = (Math.random() - 0.5) * baseWidth/2;
      const offsetY = Math.random() * 20 * (baseHeight/60) + baseHeight/2;
      ctx.beginPath();
      ctx.arc(ship.x + offsetX, ship.y + offsetY + 10, particleSize, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.beginPath();
  ctx.ellipse(ship.x - baseWidth/6, ship.y - baseHeight/6, baseWidth/10, baseHeight/8, Math.PI/4, 0, Math.PI * 2);
  ctx.fill();
}

// Отрисовка рельефа и детализированной посадочной площадки
function drawTerrain() {
  stars.forEach(star => {
    ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness})`;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    ctx.fill();
  });

  let gradient = ctx.createLinearGradient(0, canvas.height * 0.6, 0, canvas.height * 0.7);
  gradient.addColorStop(0, '#6b4e31');
  gradient.addColorStop(1, '#3c2f2f');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.moveTo(0, canvas.height);
  terrain.forEach(point => {
    let controlX = point.x;
    let controlY = point.y + (Math.random() * 5 - 2.5);
    ctx.lineTo(controlX, controlY);
  });
  ctx.lineTo(canvas.width, canvas.height);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.beginPath();
  ctx.moveTo(0, canvas.height);
  terrain.forEach((point, index) => {
    if (index > 0 && index < terrain.length - 1) {
      ctx.lineTo(point.x, point.y + 5);
    }
  });
  ctx.lineTo(canvas.width, canvas.height);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.fillRect(landing.x - 5, landing.y + 5, landing.width + 10, 3);

  let platformGradient = ctx.createLinearGradient(landing.x, landing.y - 10, landing.x, landing.y + 5);
  platformGradient.addColorStop(0, '#4a90e2');
  platformGradient.addColorStop(1, '#2c3e50');
  ctx.fillStyle = platformGradient;
  ctx.fillRect(landing.x, landing.y - 5, landing.width, 10);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 1;
  for (let i = 0; i < landing.width; i += 10) {
    ctx.beginPath();
    ctx.moveTo(landing.x + i, landing.y - 5);
    ctx.lineTo(landing.x + i + 5, landing.y + 5);
    ctx.stroke();
  }

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(landing.x, landing.y - 5);
  ctx.lineTo(landing.x, landing.y + 5);
  ctx.moveTo(landing.x + landing.width, landing.y - 5);
  ctx.lineTo(landing.x + landing.width, landing.y + 5);
  ctx.stroke();

  ctx.strokeStyle = '#ffcc00';
  ctx.lineWidth = 2;
  const centerX = landing.x + landing.width / 2;
  const markerSize = Math.min(landing.width / 4, 20);
  ctx.beginPath();
  ctx.moveTo(centerX - markerSize, landing.y - markerSize / 2);
  ctx.lineTo(centerX + markerSize, landing.y + markerSize / 2);
  ctx.moveTo(centerX + markerSize, landing.y - markerSize / 2);
  ctx.lineTo(centerX - markerSize, landing.y + markerSize / 2);
  ctx.stroke();

  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.beginPath();
  ctx.ellipse(landing.x + landing.width / 2, landing.y, landing.width / 2, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(landing.x + landing.width * 0.25, landing.y);
  ctx.lineTo(landing.x + landing.width * 0.25, landing.y + 5);
  ctx.moveTo(landing.x + landing.width * 0.75, landing.y);
  ctx.lineTo(landing.x + landing.width * 0.75, landing.y + 5);
  ctx.stroke();
}

// Проверка столкновений с измененной скоростью < 2 м/с
function checkCollision() {
  const bottomY = ship.y + ship.height/2;
  const leftX = ship.x - ship.width/2;
  const rightX = ship.x + ship.width/2;
  
  if (leftX >= landing.x && rightX <= landing.x + landing.width) {
    if (bottomY >= landing.y) {
      if (ship.velocityY < 2) {
        endGame(true, "Успешная посадка! Скорость: " + ship.velocityY.toFixed(1) + " м/с");
      } else {
        endGame(false, "Слишком жесткая посадка! Скорость: " + ship.velocityY.toFixed(1) + " м/с");
      }
      return true;
    }
  }
  
  for (let i = 0; i < terrain.length - 1; i++) {
    if (leftX >= terrain[i].x && leftX <= terrain[i+1].x ||
        rightX >= terrain[i].x && rightX <= terrain[i+1].x) {
      const p1 = terrain[i];
      const p2 = terrain[i+1];
      const m = (p2.y - p1.y) / (p2.x - p1.x);
      const b = p1.y - m * p1.x;
      const surfaceY = m * ship.x + b;
      
      if (bottomY >= surfaceY) {
        endGame(false, "Крушение! Корабль врезался в поверхность.");
        return true;
      }
    }
  }
  
  if (ship.x < 0 || ship.x > canvas.width) {
    endGame(false, "Корабль вышел за пределы посадочной зоны.");
    return true;
  }
  
  return false;
}

// Завершение игры
function endGame(success, message) {
  gameActive = false;
  gameOver.style.display = 'flex';
  restartBtn.style.display = 'block';
  instructions.style.display = 'block';
  mobileControls.style.display = 'none';
  if (success) {
    resultText.textContent = "Миссия успешна!";
    resultText.style.color = "#2ecc71";
  } else {
    resultText.textContent = "Миссия провалена";
    resultText.style.color = "#e74c3c";
  }
  resultDetails.textContent = message;
}

// Основной игровой цикл
function animate(currentTime) {
  if (!gameActive) return;
  
  const deltaTime = (currentTime - lastTime) / 1000;
  lastTime = currentTime;
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawTerrain();
  drawShip();
  
  ship.velocityY += ship.gravity;
  
  if (keys['ArrowUp'] && ship.fuel > 0) {
    ship.velocityY -= ship.thrust;
    ship.fuel -= 60 * deltaTime;
  }
  
  if (keys['ArrowLeft'] && ship.fuel > 0) {
    ship.velocityX -= ship.thrust / 2;
    ship.fuel -= 60 * deltaTime;
  }
  
  if (keys['ArrowRight'] && ship.fuel > 0) {
    ship.velocityX += ship.thrust / 2;
    ship.fuel -= 60 * deltaTime;
  }
  
  ship.x += ship.velocityX;
  ship.y += ship.velocityY;
  
  velocitySpan.textContent = ship.velocityY.toFixed(1);
  altitudeSpan.textContent = (canvas.height * 0.7 - ship.y - ship.height/2 - landing.y + canvas.height * 0.7).toFixed(1);
  fuelSpan.textContent = Math.max(0, Math.round(ship.fuel));
  
  if (!checkCollision()) {
    requestAnimationFrame(animate);
  }
}

// Обработка изменения размера окна
window.addEventListener('resize', function() {
  resizeCanvas();
  if (!gameStarted) {
    drawTerrain();
  }
  if (gameActive && window.innerWidth <= 600) {
    mobileControls.style.display = 'flex';
    adjustMobileControls();
  } else {
    mobileControls.style.display = 'none';
  }
});

// Инициализация игры
resizeCanvas();
drawTerrain();

window.addEventListener('keydown', function(e) { keys[e.key] = true; });
window.addEventListener('keyup', function(e) { keys[e.key] = false; });
