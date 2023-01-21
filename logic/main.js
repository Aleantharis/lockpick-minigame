const canvasHeightMargin = 30;

var canvas = document.getElementById("cvGame");
var ctx = canvas.getContext("2d");
var gameLoop;

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


var pickAngle = 0.0;

function drawDial() {
	ctx.beginPath();
	ctx.arc(0, 0, ((canvas.height / 2) * 0.8) / 2, 0, Math.PI * 2, false);
	ctx.fillStyle = "Black";
	ctx.fill();
	ctx.closePath();

	ctx.beginPath();
	ctx.arc(0, 0, ((canvas.height / 2) * 0.6) / 2, 0, Math.PI * 2, false);
	ctx.fillStyle = "White";
	ctx.fill();
	ctx.closePath();
}

function drawPick() {
	ctx.beginPath();
	ctx.rotate(pickAngle * (Math.PI / 180));
	ctx.fillStyle = "Gray";
	ctx.fillRect(0, 0, 500, 30);
	ctx.closePath();
}

function draw() {
	drawDial();
}

function drawCross() {
	ctx.beginPath();
	ctx.fillRect(-(canvas.width / 2), -5, canvas.width, 10);
	ctx.fillStyle = "Black";
	ctx.fill();
	ctx.closePath();


	ctx.beginPath();
	ctx.fillRect(-5, -(canvas.height / 2), 10, canvas.height);
	ctx.fillStyle = "Black";
	ctx.fill();
	ctx.closePath();
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
	// var transpX = event.x - (document.body.clientWidth / 2);
	// var transpY = event.y - (document.body.clientHeight / 2);

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

	document.getElementById("testOut").value = "X: " + Math.floor(transpX) + " | Y: " + Math.floor(transpY) + " | alpha: " + Math.floor(alphaDeg);
}

function stopGame(event) {
	event.preventDefault();
	clearInterval(gameLoop);
	document.getElementById("fMenu").disabled = false;
	document.getElementById("btnStart").value = "Start";
	document.getElementById("fMenu").onsubmit = startGame;
}

function startGame(event) {
	event.preventDefault();
	console.log("difficulty: " + document.getElementById("sDiff").value);
	document.getElementById("fMenu").disabled = true;
	gameLoop = setInterval(draw, 10);

	document.getElementById("btnStart").value = "Stop";
	document.getElementById("fMenu").onsubmit = stopGame;
}



document.onmousemove = handleMouseMove;
drawCross();


document.getElementById("fMenu").onsubmit = startGame;