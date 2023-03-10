import { MersenneTwister } from "./MersenneTwister.js";

const canvasHeightMargin = 30;
const lockRotationSpeed = 0.5;
const maxPickHealth = 110;
const minTolerance = 5;
const vicTolerance = 0.25;
const minRotation = 2;
const goalRotation = 90;
const defaultTheme = document.getElementById("sTheme").value;

const assets = {};
var imgLoading = 0;
const imgLoaded = () => --imgLoading === 0 && (document.getElementById("btnStart").disabled = false);
function initAssets() {

	[...document.getElementById("sTheme").options].forEach(opt => {
		const core = new Image();
		core.src = "img/" + opt.value + "/lock-core.png";
		imgLoading++;
		core.onload = imgLoaded;
		const body = new Image();
		body.src = "img/" + opt.value + "/lock-ring.png";
		imgLoading++;
		body.onload = imgLoaded;
		const lockPick = new Image();
		lockPick.src = "img/" + opt.value + "/lockpick.png";
		lockPick.onload = imgLoaded;

		const tmp = {
			lockCore: core,
			lockBody: body,
			lockPick: lockPick
		};

		assets[opt.value] = tmp;
	});
}
initAssets();

var DEBUG = false;
var debugOutput = "";
var canvas = document.getElementById("cvGame");
var ctx = canvas.getContext("2d");
var gameLoop;
var rightPressed = false;
var difficulty = 0;
var lockRotation = 0.0;
var pickAngle = 0.0;
var pickTranspScale = 0.14;
var pickTranspY = 0.0;
var goalAngle = 0.0;
var dmgTolerance = 0.0;
var pickHealth = 100;
var currMaxRotation = 0;
var lives = 1;
var canvasMinSize = 0;
var currentTheme = defaultTheme;
var mSeed = new Date().getTime();
var mRand;

var keepControlsLocked = false;

function themeChangeHandler(event) {
	document.body.classList.remove(currentTheme);
	currentTheme = document.getElementById("sTheme").value ?? defaultTheme;
	document.body.classList.add(currentTheme);
}

resizeCanvas();
// Attempt at auto-resize
function resizeCanvas() {
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight - (document.getElementById("fMenu").offsetHeight + canvasHeightMargin);

	// Move coordinate origin to center of canvas
	ctx.translate(canvas.width / 2, canvas.height / 2);

	if (canvas.width < canvas.height) {
		canvasMinSize = canvas.width;
	}
	else {
		canvasMinSize = canvas.height;
	}

	pickTranspY = canvasMinSize * pickTranspScale;
}
window.addEventListener("resize", resizeCanvas);
window.addEventListener("orientationchange", resizeCanvas);


function debugToggle() {
	DEBUG = document.getElementById("cbDebug").checked;

	// if (DEBUG) {
	// 	document.getElementById("testOut").classList.remove("hidden");
	// }
	// else {
	// 	document.getElementById("testOut").classList.add("hidden");
	// }
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

	// create shortcut to copy url to clipboard
	if( event.key === "k" || event.key === "K") {
		url.search = `d=${difficulty}&t=${currentTheme}&l=${lives}&s=${mSeed}`;
		if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
    		console.log(navigator.clipboard.writeText(url.href));
		}
		else {
			console.log("clipboard unavailable");
		}
	}
}
document.addEventListener("keydown", keyDownHandler, false);
document.addEventListener("keyup", keyUpHandler, false);

var touchPoints = [];
function pointerDownHandler(event) {
	if (event.pointerType === "mouse") {
		rightPressed = true;
	}
	else if (event.pointerType === "touch") {
		touchPoints.push(event.pointerId);

		if (touchPoints.length === 2) {
			rightPressed = true;
		}
	}
}

function pointerUpHandler(event) {
	if (event.pointerType === "touch") {
		var index = touchPoints.indexOf(event.pointerId);
		if(index >= 0) {
			touchPoints.splice(index, 1);
		}

		if (touchPoints.length < 2) {
			rightPressed = false;
		}
	}
	else {
		rightPressed = false;
	}
}
canvas.addEventListener("pointerdown", pointerDownHandler, false);
canvas.addEventListener("pointerup", pointerUpHandler, false);
canvas.addEventListener("pointercancel", pointerUpHandler, false);

function clearCanvas() {
	// https://stackoverflow.com/a/6722031
	ctx.save();
	ctx.setTransform(1, 0, 0, 1, 0, 0);
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.restore();
}

function drawDial() {
	ctx.beginPath();
	if (DEBUG) {
		ctx.fillStyle = "Black";
		ctx.arc(0, 0, ((canvasMinSize / 2) * 0.8), 0, Math.PI * 2, false);
		ctx.fill();
	}
	else {
		ctx.fillStyle = "Black";
		ctx.arc(0, 0, ((canvasMinSize / 2) * 0.5), 0, Math.PI * 2, false);
		ctx.fill();
		ctx.drawImage(assets[currentTheme].lockBody, -(canvasMinSize * 0.8) / 2, -(canvasMinSize * 0.8) / 2, canvasMinSize * 0.8, canvasMinSize * 0.8);
	}
	ctx.closePath();

	ctx.beginPath();
	if (DEBUG) {
		ctx.fillStyle = "White";
		ctx.arc(0, 0, ((canvasMinSize / 2) * 0.6), 0, Math.PI * 2, false);
		ctx.fill();
	}
	else {
		ctx.save();
		ctx.rotate((lockRotation) * (Math.PI / 180));
		ctx.drawImage(assets[currentTheme].lockCore, -(canvasMinSize * 0.8) / 2, -(canvasMinSize * 0.8) / 2, canvasMinSize * 0.8, canvasMinSize * 0.8);
		ctx.restore();
	}
	ctx.closePath();

	if (DEBUG) {
		ctx.beginPath();
		ctx.save();
		ctx.rotate((lockRotation - 90) * (Math.PI / 180));
		ctx.fillStyle = "Black";
		ctx.fillRect(-(canvasMinSize / 2) * 0.6, -5, canvasMinSize * 0.6, 10);
		ctx.fillRect(-5, -(canvasMinSize / 2) * 0.6, 10, canvasMinSize * 0.6);
		ctx.fillStyle = "Red";
		ctx.fillRect(0, -5, ((canvasMinSize / 2) * 0.6), 10);
		ctx.restore();
		ctx.closePath();
	}
}

function drawPick() {
	ctx.save();
	if (DEBUG) {
		ctx.rotate(pickAngle * (Math.PI / 180));
		ctx.fillStyle = "Gray";
		ctx.fillRect(0, -15, 500, 30);
	}
	else {
		ctx.rotate(lockRotation * (Math.PI / 180));
		ctx.translate(0, -pickTranspY);
		ctx.rotate(pickAngle * (Math.PI / 180));
		var scaling = canvasMinSize / 900;
		ctx.drawImage(assets[currentTheme].lockPick, 0, -25 * scaling, 900 * scaling, 50 * scaling);
	}
	ctx.restore();
}

function getCurrentMaxRotation() {
	var pct = Math.max(0, ((Math.abs(pickAngle - goalAngle) / dmgTolerance) - vicTolerance) / (1 - vicTolerance));
	return Math.max(minRotation, goalRotation - (goalRotation * pct));
}

function draw() {
	// add check if lock rotation is within target tolerance, and add "victory check" if angle = 90
	if (rightPressed) {
		if (lockRotation < currMaxRotation) {
			lockRotation++;

			if (lockRotation >= goalRotation) {
				success();
			}
		}
		else if (!DEBUG) {
			pickHealth--;

			if (pickHealth <= 0) {
				failure();
			}
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
	ctx.rotate((goalAngle - dmgTolerance) * (Math.PI / 180));
	ctx.fillStyle = "Green";
	ctx.fillRect(0, -2, ((canvas.width / 2)), 4);
	ctx.closePath();
	ctx.restore();

	ctx.save();
	ctx.beginPath();
	ctx.rotate((goalAngle + dmgTolerance) * (Math.PI / 180));
	ctx.fillStyle = "Green";
	ctx.fillRect(0, -2, ((canvas.width / 2)), 4);
	ctx.closePath();
	ctx.restore();

	ctx.save();
	ctx.beginPath();
	ctx.rotate((goalAngle - (dmgTolerance * vicTolerance)) * (Math.PI / 180));
	ctx.fillStyle = "Yellow";
	ctx.fillRect(0, -2, ((canvas.width / 2)), 4);
	ctx.closePath();
	ctx.restore();

	ctx.save();
	ctx.beginPath();
	ctx.rotate((goalAngle + (dmgTolerance * vicTolerance)) * (Math.PI / 180));
	ctx.fillStyle = "Yellow";
	ctx.fillRect(0, -2, ((canvas.width / 2)), 4);
	ctx.closePath();
	ctx.restore();

	ctx.font = Math.floor(canvasMinSize * 0.05) + "px Segoe UI";
	ctx.fillStyle = "White"
	ctx.textBaseline = "bottom";
	ctx.fillText(debugOutput, -canvas.width / 2 * 0.98, canvas.height / 2 * 0.98, canvas.width * 0.8);
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
	if (!DEBUG && rightPressed) {
		return;
	}

	// https://stackoverflow.com/questions/17130395/real-mouse-position-in-canvas
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
	currMaxRotation = getCurrentMaxRotation();

	if (DEBUG) {
		debugOutput = "X: " + Math.floor(transpX) + " | Y: " + Math.floor(transpY) + " | alpha: " + Math.floor(alphaDeg) + " | lock: " + lockRotation + " | goal: " + goalAngle + " | maxRot: " + Math.floor(currMaxRotation) + " | dmgTolerance: " + dmgTolerance + " | vic: " + vicTolerance;
	}
}

function success() {
	stopGame();
	alert("Lock successfully picked!");
}

function failure() {
	rightPressed = false;
	pickHealth = maxPickHealth - difficulty;

	if (--lives == 0) {
		stopGame();
		alert("You ran out of lockpicks!");
	}
	else {
		renderLives();
		alert("Your lockpick broke!");
	}
}

function stopGameHandler(event) {
	event.preventDefault();
	stopGame();
}

function startGameHandler(event) {
	event.preventDefault();
	startGame();
}

function stopGame() {
	clearInterval(gameLoop);
	rightPressed = false;

	if(!keepControlsLocked) {
		document.getElementById("sDiff").disabled = false;
		document.getElementById("sTheme").disabled = false;
		document.getElementById("inLives").disabled = false;
	}
	document.getElementById("btnStart").value = "Start";
	document.getElementById("fMenu").onsubmit = startGameHandler;
	canvas.classList.remove("noCrsr");

	// clear out touchpoints 
	if(touchPoints.length > 0) {
		touchPoints = [];
	}
}

function livesInputChangeHandler(event) {
	lives = document.getElementById("inLives").value;
	renderLives();
}

function renderLives() {
	var out = "Lockpicks: " + lives;
	document.getElementById("lblLives").innerHTML = out;
}

function startGame() {
	console.log("difficulty: " + difficulty);

	lives = document.getElementById("inLives").value;
	lockRotation = 0.0;
	pickHealth = maxPickHealth - difficulty;
	
	// init random generator 
	if(!mRand) {
		mRand = new MersenneTwister(mSeed);
	}
	//goalAngle = Math.floor(Math.random() * 360);
	goalAngle = Math.floor(mRand.genrand_real1() * 360);

	dmgTolerance = Math.ceil(((100 - difficulty) / 2.5) + minTolerance);

	gameLoop = setInterval(draw, 10);

	if(!keepControlsLocked) {
		document.getElementById("sDiff").disabled = true;
		document.getElementById("sTheme").disabled = true;
		document.getElementById("inLives").disabled = true;
	}
	renderLives();
	document.getElementById("btnStart").value = "Stop";
	document.getElementById("fMenu").onsubmit = stopGameHandler;
	canvas.classList.add("noCrsr");
}

document.onpointermove = handleMouseMove;
document.getElementById("fMenu").onsubmit = startGameHandler;
document.getElementById("sTheme").onchange = themeChangeHandler;
document.getElementById("inLives").oninput = livesInputChangeHandler;

//set default theme background
document.body.classList.add(defaultTheme);

// read url params, if all is present -> lock inputs and prevent unlocking
const url = new URL(window.location.href);
if(url.search) {
	keepControlsLocked = true;
	
	document.getElementById("sDiff").disabled = true;
	document.getElementById("sTheme").disabled = true;
	document.getElementById("inLives").disabled = true;
	document.getElementById("cbDebug").style.visibility = "hidden";
	
	document.getElementById("sDiff").value = url.searchParams.has("d") ? url.searchParams.get("d") : difficulty;
	difficultyChange();

	document.getElementById("sTheme").value = url.searchParams.has("t") ? url.searchParams.get("t") : currentTheme;
	themeChangeHandler();

	document.getElementById("inLives").value = url.searchParams.has("l") ? url.searchParams.get("l") : lives;
	livesInputChangeHandler();

	document.getElementById("cbDebug").checked = url.searchParams.has("DEBUG") ? true : false;
	debugToggle();

	mSeed = url.searchParams.has("s") ? url.searchParams.get("s") : mSeed;
}