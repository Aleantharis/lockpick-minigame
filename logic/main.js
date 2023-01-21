var canvas = document.getElementById("cvGame");
var ctx = canvas.getContext("2d");
var gameLoop;

resizeCanvas();
// Attempt at auto-resize
function resizeCanvas(){
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight - (document.getElementById("fMenu").offsetHeight + 30);

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
	ctx.fillRect(-(canvas.width/2), -5, canvas.width , 10);
	ctx.fillStyle = "Black";
	ctx.fill();
	ctx.closePath();

	
	ctx.beginPath();
	ctx.fillRect(-5, -(canvas.height/2), 10 , canvas.height);
	ctx.fillStyle = "Black";
	ctx.fill();
	ctx.closePath();
}

function handleMouseMove(event) {
	var transpX = event.x - (document.body.clientWidth / 2);
	var transpY = event.y - (document.body.clientHeight / 2);

	// alpha = arctan(a / b) -> arctan(y / x)

	var alphaRad = Math.atan(Math.abs(transpY) / Math.abs(transpX));
	var alphaDeg = alphaRad * (180 / Math.PI);

	if (transpY < 0 && transpX >= 0) {
		alphaDeg += 90;
	}
	else if (transpY < 0 && transpX < 0) {
		alphaDeg += 180;
	}
	else if (transpY >= 0 && transpX < 0) {
		alphaDeg += 270;
	}

	document.getElementById("testOut").value = alphaDeg;
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