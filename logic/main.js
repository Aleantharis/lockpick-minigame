const canvasHeightMargin = 30;
const lockRotationSpeed = 0.5;
const maxPickHealth = 110;
const minTolerance = 5;

var DEBUG = true;
var canvas = document.getElementById("cvGame");
var ctx = canvas.getContext("2d");
var gameLoop;
var rightPressed = false;
var difficulty = 0;
var lockRotation = 0.0;
var pickAngle = 0.0;
var goalAngle = 0.0;
var tolerance = 0.0;
var pickHealth = 100;

resizeCanvas();

// Attempt at auto-resize
function resizeCanvas() {
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight - (document.getElementById("fMenu").offsetHeight + canvasHeightMargin);

	// Move coordinate origin to center of canvas
	ctx.translate(canvas.width / 2, canvas.height / 2);

	drawCross();
}
window.addEventListener("resize", resizeCanvas);
window.addEventListener("orientationchange", resizeCanvas);


function debugToggle() {
	DEBUG = document.getElementById("cbDebug").checked;
}
document.getElementById("cbDebug").addEventListener("change", debugToggle);

function difficultyChange() {
	difficulty = document.getElementById("sDiff").value;
}
document.getElementById("sDiff").addEventListener("change", difficultyChange);

function keyDownHandler(event) {
	if (event.key === "Right" || event.key === "ArrowRight" || event.key === "D" || event.key === "d") {
		rightPressed = true;
	}
}

function keyUpHandler(event) {
	if (event.key === "Right" || event.key === "ArrowRight" || event.key === "D" || event.key === "d") {
		rightPressed = false;
	}
}
document.addEventListener("keydown", keyDownHandler, false);
document.addEventListener("keyup", keyUpHandler, false);


function clearCanvas() {
	ctx.save();
	ctx.setTransform(1, 0, 0, 1, 0, 0);
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	//ctx.translate(canvas.width / 2, canvas.height / 2);
	ctx.restore();
}

function drawDial() {
	ctx.beginPath();
	ctx.fillStyle = "Black";
	ctx.arc(0, 0, ((canvas.height / 2) * 0.8), 0, Math.PI * 2, false);
	ctx.fill();
	ctx.closePath();

	ctx.beginPath();
	ctx.fillStyle = "White";
	ctx.arc(0, 0, ((canvas.height / 2) * 0.6), 0, Math.PI * 2, false);
	ctx.fill();
	ctx.closePath();

	ctx.beginPath();
	ctx.save();
	ctx.rotate((lockRotation - 90) * (Math.PI / 180));
	ctx.fillStyle = "Black";
	ctx.fillRect(-(canvas.height / 2) * 0.6, -5, canvas.height * 0.6, 10);
	ctx.fillRect(-5, -(canvas.height / 2) * 0.6, 10, canvas.height * 0.6);
	ctx.fillStyle = "Red";
	ctx.fillRect(0, -5, ((canvas.height / 2) * 0.6), 10);
	ctx.restore();
	ctx.closePath();
}

function drawPick() {
	ctx.save();
	ctx.rotate(pickAngle * (Math.PI / 180));
	ctx.fillStyle = "Gray";
	ctx.fillRect(0, -15, 500, 30);
	ctx.restore();
}

function draw() {
	// add check if lock rotation is within target tolerance, and add "victory check" if angle = 90
	if (rightPressed) {
		if (lockRotation < 90) {
			lockRotation++;
		}
	}
	else if (lockRotation > 0) {
		lockRotation--;
	}

	clearCanvas();

	if (DEBUG) {
		drawCross();
	}

	drawDial();
	drawPick();
}

function drawCross() {
	ctx.fillStyle = "Black";
	ctx.fillRect(-(canvas.width / 2), -5, canvas.width, 10);
	ctx.fillRect(-5, -(canvas.height / 2), 10, canvas.height);

	ctx.save();
	ctx.beginPath();
	ctx.rotate((goalAngle) * (Math.PI / 180));
	ctx.fillStyle = "Red";
	ctx.fillRect(0, -5, ((canvas.width / 2)), 10);
	ctx.closePath();
	ctx.restore();

	ctx.save();
	ctx.beginPath();
	ctx.rotate((goalAngle - tolerance) * (Math.PI / 180));
	ctx.fillStyle = "Green";
	ctx.fillRect(0, -5, ((canvas.width / 2)), 10);
	ctx.closePath();
	ctx.restore();

	ctx.save();
	ctx.beginPath();
	ctx.rotate((goalAngle + tolerance) * (Math.PI / 180));
	ctx.fillStyle = "Green";
	ctx.fillRect(0, -5, ((canvas.width / 2)), 10);
	ctx.closePath();
	ctx.restore();
}

function getMousePos(evt) {
	var rect = canvas.getBoundingClientRect(), // abs. size of element
		scaleX = canvas.width / rect.width,    // relationship bitmap vs. element for x
		scaleY = canvas.height / rect.height;  // relationship bitmap vs. element for y

	return {
		x: (evt.clientX - rect.left) * scaleX,   // scale mouse coordinates after they have
		y: (evt.clientY - rect.top) * scaleY     // been adjusted to be relative to element
	}
}

function handleMouseMove(event) {
	// disable pick moving if lock is turning
	if (!DEBUG && lockRotation > 0) {
		return;
	}

	var pos = getMousePos(event);          // get adjusted coordinates as above
	var matrix = ctx.getTransform();         // W3C (future)
	var imatrix = matrix.invertSelf();

	var transpX = pos.x * imatrix.a + pos.y * imatrix.c + imatrix.e;
	var transpY = pos.x * imatrix.b + pos.y * imatrix.d + imatrix.f;

	// alpha = arctan(a / b) -> arctan(y / x)

	var alphaRad = Math.atan(Math.abs(transpY) / Math.abs(transpX));
	var alphaDeg = alphaRad * (180 / Math.PI);

	if (transpX < 0 && transpY >= 0) {
		alphaDeg = 180 - alphaDeg;
	}
	else if (transpY < 0 && transpX < 0) {
		alphaDeg += 180;
	}
	else if (transpX >= 0 && transpY < 0) {
		alphaDeg = 360 - alphaDeg;
	}

	pickAngle = alphaDeg;
	if (DEBUG) {
		document.getElementById("testOut").value = "X: " + Math.floor(transpX) + " | Y: " + Math.floor(transpY) + " | alpha: " + Math.floor(alphaDeg) + " | lock: " + lockRotation + " | goal: " + goalAngle;
	}
	else {
		document.getElementById("testOut").value = "";
	}
}

function stopGame(event) {
	event.preventDefault();
	clearInterval(gameLoop);
	document.getElementById("sDiff").disabled = false;
	document.getElementById("btnStart").value = "Start";
	document.getElementById("fMenu").onsubmit = startGame;
}

function startGame(event) {
	event.preventDefault();
	console.log("difficulty: " + difficulty);

	// TODO setup new game (difficulty setting, randomize target etc.)
	lockRotation = 0.0;
	pickHealth = maxPickHealth - difficulty;
	goalAngle = Math.floor(Math.random() * 360);

	tolerance = Math.ceil((difficulty / 10) + 5);

	gameLoop = setInterval(draw, 10);

	document.getElementById("sDiff").disabled = true;
	document.getElementById("btnStart").value = "Stop";
	document.getElementById("fMenu").onsubmit = stopGame;
}



document.onmousemove = handleMouseMove;
drawCross();


document.getElementById("fMenu").onsubmit = startGame;