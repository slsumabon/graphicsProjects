// CG_HW1_Sasha.js
"use strict";

var canvas;
var gl;
var program;

var aPositionLoc;
var aColorLoc;

var sViewX = 0.0;
var sViewY = 0.0;
var sViewZ = 0.0;
var sLettersX = 0.0;
var sLettersY = 0.0;

var spinLetters = false;
var starsOn = false;

var uViewThetaLoc;
var uModelThetaLoc;
var uTransLoc;
var uPointSizeLoc;

var t = 0.0;


var pedestalColor = [1.0, 0.78, 0.86, 1.0]; 

function setPedestalColor(name) {
    if (name === "pink")   pedestalColor = [1.0, 0.78, 0.86, 1.0];
    if (name === "purple") pedestalColor = [0.78, 0.70, 1.0,  1.0];
    if (name === "mint")   pedestalColor = [0.70, 1.0,  0.85, 1.0];
    if (name === "gold")   pedestalColor = [1.0, 0.90, 0.45, 1.0];
    if (name === "gray")   pedestalColor = [0.75, 0.75, 0.80, 1.0];
}

//dimensions of pedestal
var PED_Y_TOP = 0.10;
var PED_Y_BOTTOM = -0.55;
var PED_R_TOP = 0.35;
var PED_R_BOTTOM = 1.5 * PED_R_TOP; 
var PED_N = 72;

var LETTER_Y = PED_Y_TOP + 0.001;

var pedPosBuffer, pedColBuffer, pedVertexCount = 0;

var lPosBuffer, lColBuffer, lVertexCount = 0;
var sPosBuffer, sColBuffer, sVertexCount = 0;

var starsPosBuffer, starsOuterColBuffer, starsInnerColBuffer, starsCount = 0;

function makeBufferFloat32(array, usage) {
    var b = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, array, usage || gl.STATIC_DRAW);
    return b;
}

function bindPositionBuffer(posBuffer) {
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.vertexAttribPointer(aPositionLoc, 3, gl.FLOAT, false, 0, 0);
}

function bindColorBuffer(colBuffer) {
    gl.bindBuffer(gl.ARRAY_BUFFER, colBuffer);
    gl.vertexAttribPointer(aColorLoc, 4, gl.FLOAT, false, 0, 0);
}

function pedestalPosCol(rTop, rBottom, yTop, yBottom, N, rgba) {
    var pos = [];
    var col = [];
    var top = [];
    var bot = [];

    for (var i = 0; i <= N; i++) {
        var ang = 2.0 * Math.PI * (i / N);
        var c = Math.cos(ang);
        var s = Math.sin(ang);
        top.push([rTop * c, yTop, rTop * s]);
        bot.push([rBottom * c, yBottom, rBottom * s]);
    }

    function pushP(p) { pos.push(p[0], p[1], p[2]); }
    function pushC()  { col.push(rgba[0], rgba[1], rgba[2], rgba[3]); }

    for (var k = 0; k < N; k++) {
        var t0 = top[k], t1 = top[k + 1];
        var b0 = bot[k], b1 = bot[k + 1];
        pushP(b0); pushC();
        pushP(t0); pushC();
        pushP(t1); pushC();
        pushP(b0); pushC();
        pushP(t1); pushC();
        pushP(b1); pushC();
    }
    var topC = [0.0, yTop, 0.0];
    for (var j = 0; j < N; j++) {
        pushP(topC);   pushC();
        pushP(top[j]); pushC();
        pushP(top[j+1]); pushC();
    }
    var botC = [0.0, yBottom, 0.0];
    for (var m = 0; m < N; m++) {
        pushP(botC);    pushC();
        pushP(bot[m+1]); pushC();
        pushP(bot[m]);   pushC();
    }
    return {
        positions: new Float32Array(pos),
        colors: new Float32Array(col)
    };
}

function rebuildPedestal() {
    var pc = pedestalPosCol(
        PED_R_TOP, PED_R_BOTTOM, PED_Y_TOP, PED_Y_BOTTOM, PED_N, pedestalColor
    );

    pedVertexCount = pc.positions.length / 3;

    if (!pedPosBuffer) pedPosBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, pedPosBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, pc.positions, gl.STATIC_DRAW);

    if (!pedColBuffer) pedColBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, pedColBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, pc.colors, gl.STATIC_DRAW);
}

function makeStars(count) {
    var pos = [];
    var colOuter = [];
    var colInner = [];

    var made = 0;
    while (made < count) {
        var x = (Math.random() * 2.0 - 1.0) * 0.95;
        var y = (Math.random() * 2.0 - 1.0) * 0.95;
        var z = 0.0;
        if (Math.abs(x) < 0.22 && Math.abs(y) < 0.22) continue;
        pos.push(x, y, z);

        // outer yellow
        colOuter.push(1.0, 0.95, 0.35, 1.0);
        // inner white
        colInner.push(1.0, 1.0, 1.0, 1.0);

        made++;
    }

    starsCount = pos.length / 3;

    starsPosBuffer = makeBufferFloat32(new Float32Array(pos));
    starsOuterColBuffer = makeBufferFloat32(new Float32Array(colOuter));
    starsInnerColBuffer = makeBufferFloat32(new Float32Array(colInner));
}

var LG_R = 0.70, LG_G = 1.00, LG_B = 0.80, LG_A = 1.0;
var LB_R = 0.70, LB_G = 0.90, LB_B = 1.00, LB_A = 1.0;

function split(c) {
    var n = c.length / 7;
    var pos = new Float32Array(n * 3);
    var col = new Float32Array(n * 4);
    for (var i = 0; i < n; i++) {
        var base = i * 7;
        pos[i*3 + 0] = c[base + 0];
        pos[i*3 + 1] = c[base + 1];
        pos[i*3 + 2] = c[base + 2];

        col[i*4 + 0] = c[base + 3];
        col[i*4 + 1] = c[base + 4];
        col[i*4 + 2] = c[base + 5];
        col[i*4 + 3] = c[base + 6];
    }
    return { positions: pos, colors: col, count: n };
}

window.onload = function init() {
    canvas = document.getElementById("gl-canvas");
    gl = canvas.getContext("webgl2");
    if (!gl) { alert("WebGL 2.0 isn't available"); }

    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    aPositionLoc = gl.getAttribLocation(program, "aPosition");
    aColorLoc    = gl.getAttribLocation(program, "aColor");

    gl.enableVertexAttribArray(aPositionLoc);
    gl.enableVertexAttribArray(aColorLoc);

    uViewThetaLoc  = gl.getUniformLocation(program, "uViewTheta");
    uModelThetaLoc = gl.getUniformLocation(program, "uModelTheta");
    uTransLoc      = gl.getUniformLocation(program, "uTrans");
    uPointSizeLoc  = gl.getUniformLocation(program, "uPointSize");

    // Sliders/buttons
    document.getElementById("ViewX").oninput = function(e){ sViewX = parseFloat(e.target.value); };
    document.getElementById("ViewY").oninput = function(e){ sViewY = parseFloat(e.target.value); };
    document.getElementById("ViewZ").oninput = function(e){ sViewZ = parseFloat(e.target.value); };

    document.getElementById("LettersX").oninput = function(e){ sLettersX = parseFloat(e.target.value); };
    document.getElementById("LettersY").oninput = function(e){ sLettersY = parseFloat(e.target.value); };

    document.getElementById("SpinButton").onclick = function(){ spinLetters = !spinLetters; };
    document.getElementById("StarsButton").onclick = function(){ starsOn = !starsOn; };

    document.getElementById("PedestalColor").onchange = function(e){
        setPedestalColor(e.target.value);
        rebuildPedestal();
    };

    rebuildPedestal();

    var lVert = new Float32Array([
    // front
    -0.08,0.00,-0.06,  LG_R,LG_G,LG_B,LG_A,   -0.02,0.00,-0.06,  LB_R,LB_G,LB_B,LB_A,   -0.02,0.30,-0.06,  LB_R,LB_G,LB_B,LB_A,
    -0.08,0.00,-0.06,  LG_R,LG_G,LG_B,LG_A,   -0.02,0.30,-0.06,  LB_R,LB_G,LB_B,LB_A,   -0.08,0.30,-0.06,  LG_R,LG_G,LG_B,LG_A,
    // back
    -0.08,0.00, 0.06,  LG_R,LG_G,LG_B,LG_A,   -0.02,0.30, 0.06,  LB_R,LB_G,LB_B,LB_A,   -0.02,0.00, 0.06,  LB_R,LB_G,LB_B,LB_A,
    -0.08,0.00, 0.06,  LG_R,LG_G,LG_B,LG_A,   -0.08,0.30, 0.06,  LG_R,LG_G,LG_B,LG_A,   -0.02,0.30, 0.06,  LB_R,LB_G,LB_B,LB_A,
    // left
    -0.08,0.00,-0.06,  LG_R,LG_G,LG_B,LG_A,   -0.08,0.30,-0.06,  LG_R,LG_G,LG_B,LG_A,   -0.08,0.30, 0.06,  LG_R,LG_G,LG_B,LG_A,
    -0.08,0.00,-0.06,  LG_R,LG_G,LG_B,LG_A,   -0.08,0.30, 0.06,  LG_R,LG_G,LG_B,LG_A,   -0.08,0.00, 0.06,  LG_R,LG_G,LG_B,LG_A,
    // right
    -0.02,0.00,-0.06,  LB_R,LB_G,LB_B,LB_A,   -0.02,0.00, 0.06,  LB_R,LB_G,LB_B,LB_A,   -0.02,0.30, 0.06,  LB_R,LB_G,LB_B,LB_A,
    -0.02,0.00,-0.06,  LB_R,LB_G,LB_B,LB_A,   -0.02,0.30, 0.06,  LB_R,LB_G,LB_B,LB_A,   -0.02,0.30,-0.06,  LB_R,LB_G,LB_B,LB_A,
    // top
    -0.08,0.30,-0.06,  LG_R,LG_G,LG_B,LG_A,   -0.02,0.30,-0.06,  LB_R,LB_G,LB_B,LB_A,   -0.02,0.30, 0.06,  LB_R,LB_G,LB_B,LB_A,
    -0.08,0.30,-0.06,  LG_R,LG_G,LG_B,LG_A,   -0.02,0.30, 0.06,  LB_R,LB_G,LB_B,LB_A,   -0.08,0.30, 0.06,  LG_R,LG_G,LG_B,LG_A,
    // bottom
    -0.08,0.00,-0.06,  LG_R,LG_G,LG_B,LG_A,   -0.02,0.00, 0.06,  LB_R,LB_G,LB_B,LB_A,   -0.02,0.00,-0.06,  LB_R,LB_G,LB_B,LB_A,
    -0.08,0.00,-0.06,  LG_R,LG_G,LG_B,LG_A,   -0.08,0.00, 0.06,  LG_R,LG_G,LG_B,LG_A,   -0.02,0.00, 0.06,  LB_R,LB_G,LB_B,LB_A,

    // front
    -0.08,0.00,-0.06,  LG_R,LG_G,LG_B,LG_A,    0.14,0.00,-0.06,  LB_R,LB_G,LB_B,LB_A,    0.14,0.06,-0.06,  LB_R,LB_G,LB_B,LB_A,
    -0.08,0.00,-0.06,  LG_R,LG_G,LG_B,LG_A,    0.14,0.06,-0.06,  LB_R,LB_G,LB_B,LB_A,   -0.08,0.06,-0.06,  LG_R,LG_G,LG_B,LG_A,
    // back
    -0.08,0.00, 0.06,  LG_R,LG_G,LG_B,LG_A,    0.14,0.06, 0.06,  LB_R,LB_G,LB_B,LB_A,    0.14,0.00, 0.06,  LB_R,LB_G,LB_B,LB_A,
    -0.08,0.00, 0.06,  LG_R,LG_G,LG_B,LG_A,   -0.08,0.06, 0.06,  LG_R,LG_G,LG_B,LG_A,    0.14,0.06, 0.06,  LB_R,LB_G,LB_B,LB_A,
    // left
    -0.08,0.00,-0.06,  LG_R,LG_G,LG_B,LG_A,   -0.08,0.06,-0.06,  LG_R,LG_G,LG_B,LG_A,   -0.08,0.06, 0.06,  LG_R,LG_G,LG_B,LG_A,
    -0.08,0.00,-0.06,  LG_R,LG_G,LG_B,LG_A,   -0.08,0.06, 0.06,  LG_R,LG_G,LG_B,LG_A,   -0.08,0.00, 0.06,  LG_R,LG_G,LG_B,LG_A,
    // right
     0.14,0.00,-0.06,  LB_R,LB_G,LB_B,LB_A,    0.14,0.00, 0.06,  LB_R,LB_G,LB_B,LB_A,    0.14,0.06, 0.06,  LB_R,LB_G,LB_B,LB_A,
     0.14,0.00,-0.06,  LB_R,LB_G,LB_B,LB_A,    0.14,0.06, 0.06,  LB_R,LB_G,LB_B,LB_A,    0.14,0.06,-0.06,  LB_R,LB_G,LB_B,LB_A,
    // top
    -0.08,0.06,-0.06,  LG_R,LG_G,LG_B,LG_A,    0.14,0.06,-0.06,  LB_R,LB_G,LB_B,LB_A,    0.14,0.06, 0.06,  LB_R,LB_G,LB_B,LB_A,
    -0.08,0.06,-0.06,  LG_R,LG_G,LG_B,LG_A,    0.14,0.06, 0.06,  LB_R,LB_G,LB_B,LB_A,   -0.08,0.06, 0.06,  LG_R,LG_G,LG_B,LG_A,
    // bottom
    -0.08,0.00,-0.06,  LG_R,LG_G,LG_B,LG_A,    0.14,0.00, 0.06,  LB_R,LB_G,LB_B,LB_A,    0.14,0.00,-0.06,  LB_R,LB_G,LB_B,LB_A,
    -0.08,0.00,-0.06,  LG_R,LG_G,LG_B,LG_A,   -0.08,0.00, 0.06,  LG_R,LG_G,LG_B,LG_A,    0.14,0.00, 0.06,  LB_R,LB_G,LB_B,LB_A,
]);

   var sVert = new Float32Array([
    // front
    -0.12,0.24,-0.06, LG_R,LG_G,LG_B,LG_A,   0.12,0.24,-0.06, LB_R,LB_G,LB_B,LB_A,   0.12,0.30,-0.06, LB_R,LB_G,LB_B,LB_A,
    -0.12,0.24,-0.06, LG_R,LG_G,LG_B,LG_A,   0.12,0.30,-0.06, LB_R,LB_G,LB_B,LB_A,  -0.12,0.30,-0.06, LG_R,LG_G,LG_B,LG_A,
    // back
    -0.12,0.24, 0.06, LG_R,LG_G,LG_B,LG_A,   0.12,0.30, 0.06, LB_R,LB_G,LB_B,LB_A,   0.12,0.24, 0.06, LB_R,LB_G,LB_B,LB_A,
    -0.12,0.24, 0.06, LG_R,LG_G,LG_B,LG_A,  -0.12,0.30, 0.06, LG_R,LG_G,LG_B,LG_A,   0.12,0.30, 0.06, LB_R,LB_G,LB_B,LB_A,
    // left
    -0.12,0.24,-0.06, LG_R,LG_G,LG_B,LG_A,  -0.12,0.30,-0.06, LG_R,LG_G,LG_B,LG_A,  -0.12,0.30, 0.06, LG_R,LG_G,LG_B,LG_A,
    -0.12,0.24,-0.06, LG_R,LG_G,LG_B,LG_A,  -0.12,0.30, 0.06, LG_R,LG_G,LG_B,LG_A,  -0.12,0.24, 0.06, LG_R,LG_G,LG_B,LG_A,
    // right
     0.12,0.24,-0.06, LB_R,LB_G,LB_B,LB_A,   0.12,0.24, 0.06, LB_R,LB_G,LB_B,LB_A,   0.12,0.30, 0.06, LB_R,LB_G,LB_B,LB_A,
     0.12,0.24,-0.06, LB_R,LB_G,LB_B,LB_A,   0.12,0.30, 0.06, LB_R,LB_G,LB_B,LB_A,   0.12,0.30,-0.06, LB_R,LB_G,LB_B,LB_A,
    // top
    -0.12,0.30,-0.06, LG_R,LG_G,LG_B,LG_A,   0.12,0.30,-0.06, LB_R,LB_G,LB_B,LB_A,   0.12,0.30, 0.06, LB_R,LB_G,LB_B,LB_A,
    -0.12,0.30,-0.06, LG_R,LG_G,LG_B,LG_A,   0.12,0.30, 0.06, LB_R,LB_G,LB_B,LB_A,  -0.12,0.30, 0.06, LG_R,LG_G,LG_B,LG_A,
    // bottom
    -0.12,0.24,-0.06, LG_R,LG_G,LG_B,LG_A,   0.12,0.24, 0.06, LB_R,LB_G,LB_B,LB_A,   0.12,0.24,-0.06, LB_R,LB_G,LB_B,LB_A,
    -0.12,0.24,-0.06, LG_R,LG_G,LG_B,LG_A,  -0.12,0.24, 0.06, LG_R,LG_G,LG_B,LG_A,   0.12,0.24, 0.06, LB_R,LB_G,LB_B,LB_A,

    -0.12,0.12,-0.06, LG_R,LG_G,LG_B,LG_A,   0.12,0.12,-0.06, LB_R,LB_G,LB_B,LB_A,   0.12,0.18,-0.06, LB_R,LB_G,LB_B,LB_A,
    -0.12,0.12,-0.06, LG_R,LG_G,LG_B,LG_A,   0.12,0.18,-0.06, LB_R,LB_G,LB_B,LB_A,  -0.12,0.18,-0.06, LG_R,LG_G,LG_B,LG_A,
    -0.12,0.12, 0.06, LG_R,LG_G,LG_B,LG_A,   0.12,0.18, 0.06, LB_R,LB_G,LB_B,LB_A,   0.12,0.12, 0.06, LB_R,LB_G,LB_B,LB_A,
    -0.12,0.12, 0.06, LG_R,LG_G,LG_B,LG_A,  -0.12,0.18, 0.06, LG_R,LG_G,LG_B,LG_A,   0.12,0.18, 0.06, LB_R,LB_G,LB_B,LB_A,
    -0.12,0.12,-0.06, LG_R,LG_G,LG_B,LG_A,  -0.12,0.18,-0.06, LG_R,LG_G,LG_B,LG_A,  -0.12,0.18, 0.06, LG_R,LG_G,LG_B,LG_A,
    -0.12,0.12,-0.06, LG_R,LG_G,LG_B,LG_A,  -0.12,0.18, 0.06, LG_R,LG_G,LG_B,LG_A,  -0.12,0.12, 0.06, LG_R,LG_G,LG_B,LG_A,
     0.12,0.12,-0.06, LB_R,LB_G,LB_B,LB_A,   0.12,0.12, 0.06, LB_R,LB_G,LB_B,LB_A,   0.12,0.18, 0.06, LB_R,LB_G,LB_B,LB_A,
     0.12,0.12,-0.06, LB_R,LB_G,LB_B,LB_A,   0.12,0.18, 0.06, LB_R,LB_G,LB_B,LB_A,   0.12,0.18,-0.06, LB_R,LB_G,LB_B,LB_A,
    -0.12,0.18,-0.06, LG_R,LG_G,LG_B,LG_A,   0.12,0.18,-0.06, LB_R,LB_G,LB_B,LB_A,   0.12,0.18, 0.06, LB_R,LB_G,LB_B,LB_A,
    -0.12,0.18,-0.06, LG_R,LG_G,LG_B,LG_A,   0.12,0.18, 0.06, LB_R,LB_G,LB_B,LB_A,  -0.12,0.18, 0.06, LG_R,LG_G,LG_B,LG_A,
    -0.12,0.12,-0.06, LG_R,LG_G,LG_B,LG_A,   0.12,0.12, 0.06, LB_R,LB_G,LB_B,LB_A,   0.12,0.12,-0.06, LB_R,LB_G,LB_B,LB_A,
    -0.12,0.12,-0.06, LG_R,LG_G,LG_B,LG_A,  -0.12,0.12, 0.06, LG_R,LG_G,LG_B,LG_A,   0.12,0.12, 0.06, LB_R,LB_G,LB_B,LB_A,

    -0.12,0.00,-0.06, LG_R,LG_G,LG_B,LG_A,   0.12,0.00,-0.06, LB_R,LB_G,LB_B,LB_A,   0.12,0.06,-0.06, LB_R,LB_G,LB_B,LB_A,
    -0.12,0.00,-0.06, LG_R,LG_G,LG_B,LG_A,   0.12,0.06,-0.06, LB_R,LB_G,LB_B,LB_A,  -0.12,0.06,-0.06, LG_R,LG_G,LG_B,LG_A,
    -0.12,0.00, 0.06, LG_R,LG_G,LG_B,LG_A,   0.12,0.06, 0.06, LB_R,LB_G,LB_B,LB_A,   0.12,0.00, 0.06, LB_R,LB_G,LB_B,LB_A,
    -0.12,0.00, 0.06, LG_R,LG_G,LG_B,LG_A,  -0.12,0.06, 0.06, LG_R,LG_G,LG_B,LG_A,   0.12,0.06, 0.06, LB_R,LB_G,LB_B,LB_A,
    -0.12,0.00,-0.06, LG_R,LG_G,LG_B,LG_A,  -0.12,0.06,-0.06, LG_R,LG_G,LG_B,LG_A,  -0.12,0.06, 0.06, LG_R,LG_G,LG_B,LG_A,
    -0.12,0.00,-0.06, LG_R,LG_G,LG_B,LG_A,  -0.12,0.06, 0.06, LG_R,LG_G,LG_B,LG_A,  -0.12,0.00, 0.06, LG_R,LG_G,LG_B,LG_A,
     0.12,0.00,-0.06, LB_R,LB_G,LB_B,LB_A,   0.12,0.00, 0.06, LB_R,LB_G,LB_B,LB_A,   0.12,0.06, 0.06, LB_R,LB_G,LB_B,LB_A,
     0.12,0.00,-0.06, LB_R,LB_G,LB_B,LB_A,   0.12,0.06, 0.06, LB_R,LB_G,LB_B,LB_A,   0.12,0.06,-0.06, LB_R,LB_G,LB_B,LB_A,
    -0.12,0.06,-0.06, LG_R,LG_G,LG_B,LG_A,   0.12,0.06,-0.06, LB_R,LB_G,LB_B,LB_A,   0.12,0.06, 0.06, LB_R,LB_G,LB_B,LB_A,
    -0.12,0.06,-0.06, LG_R,LG_G,LG_B,LG_A,   0.12,0.06, 0.06, LB_R,LB_G,LB_B,LB_A,  -0.12,0.06, 0.06, LG_R,LG_G,LG_B,LG_A,
    -0.12,0.00,-0.06, LG_R,LG_G,LG_B,LG_A,   0.12,0.00, 0.06, LB_R,LB_G,LB_B,LB_A,   0.12,0.00,-0.06, LB_R,LB_G,LB_B,LB_A,
    -0.12,0.00,-0.06, LG_R,LG_G,LG_B,LG_A,  -0.12,0.00, 0.06, LG_R,LG_G,LG_B,LG_A,   0.12,0.00, 0.06, LB_R,LB_G,LB_B,LB_A,

    -0.12,0.18,-0.06, LG_R,LG_G,LG_B,LG_A,  -0.06,0.18,-0.06, LG_R,LG_G,LG_B,LG_A,  -0.06,0.30,-0.06, LG_R,LG_G,LG_B,LG_A,
    -0.12,0.18,-0.06, LG_R,LG_G,LG_B,LG_A,  -0.06,0.30,-0.06, LG_R,LG_G,LG_B,LG_A,  -0.12,0.30,-0.06, LG_R,LG_G,LG_B,LG_A,
    -0.12,0.18, 0.06, LG_R,LG_G,LG_B,LG_A,  -0.06,0.30, 0.06, LG_R,LG_G,LG_B,LG_A,  -0.06,0.18, 0.06, LG_R,LG_G,LG_B,LG_A,
    -0.12,0.18, 0.06, LG_R,LG_G,LG_B,LG_A,  -0.12,0.30, 0.06, LG_R,LG_G,LG_B,LG_A,  -0.06,0.30, 0.06, LG_R,LG_G,LG_B,LG_A,
    -0.12,0.18,-0.06, LG_R,LG_G,LG_B,LG_A,  -0.12,0.30,-0.06, LG_R,LG_G,LG_B,LG_A,  -0.12,0.30, 0.06, LG_R,LG_G,LG_B,LG_A,
    -0.12,0.18,-0.06, LG_R,LG_G,LG_B,LG_A,  -0.12,0.30, 0.06, LG_R,LG_G,LG_B,LG_A,  -0.12,0.18, 0.06, LG_R,LG_G,LG_B,LG_A,
    -0.06,0.18,-0.06, LG_R,LG_G,LG_B,LG_A,  -0.06,0.18, 0.06, LG_R,LG_G,LG_B,LG_A,  -0.06,0.30, 0.06, LG_R,LG_G,LG_B,LG_A,
    -0.06,0.18,-0.06, LG_R,LG_G,LG_B,LG_A,  -0.06,0.30, 0.06, LG_R,LG_G,LG_B,LG_A,  -0.06,0.30,-0.06, LG_R,LG_G,LG_B,LG_A,
    -0.12,0.30,-0.06, LG_R,LG_G,LG_B,LG_A,  -0.06,0.30,-0.06, LG_R,LG_G,LG_B,LG_A,  -0.06,0.30, 0.06, LG_R,LG_G,LG_B,LG_A,
    -0.12,0.30,-0.06, LG_R,LG_G,LG_B,LG_A,  -0.06,0.30, 0.06, LG_R,LG_G,LG_B,LG_A,  -0.12,0.30, 0.06, LG_R,LG_G,LG_B,LG_A,
    -0.12,0.18,-0.06, LG_R,LG_G,LG_B,LG_A,  -0.06,0.18, 0.06, LG_R,LG_G,LG_B,LG_A,  -0.06,0.18,-0.06, LG_R,LG_G,LG_B,LG_A,
    -0.12,0.18,-0.06, LG_R,LG_G,LG_B,LG_A,  -0.12,0.18, 0.06, LG_R,LG_G,LG_B,LG_A,  -0.06,0.18, 0.06, LG_R,LG_G,LG_B,LG_A,


     0.06,0.00,-0.06, LB_R,LB_G,LB_B,LB_A,   0.12,0.00,-0.06, LB_R,LB_G,LB_B,LB_A,   0.12,0.12,-0.06, LB_R,LB_G,LB_B,LB_A,
     0.06,0.00,-0.06, LB_R,LB_G,LB_B,LB_A,   0.12,0.12,-0.06, LB_R,LB_G,LB_B,LB_A,   0.06,0.12,-0.06, LB_R,LB_G,LB_B,LB_A,
     0.06,0.00, 0.06, LB_R,LB_G,LB_B,LB_A,   0.12,0.12, 0.06, LB_R,LB_G,LB_B,LB_A,   0.12,0.00, 0.06, LB_R,LB_G,LB_B,LB_A,
     0.06,0.00, 0.06, LB_R,LB_G,LB_B,LB_A,   0.06,0.12, 0.06, LB_R,LB_G,LB_B,LB_A,   0.12,0.12, 0.06, LB_R,LB_G,LB_B,LB_A,
     0.06,0.00,-0.06, LB_R,LB_G,LB_B,LB_A,   0.06,0.12,-0.06, LB_R,LB_G,LB_B,LB_A,   0.06,0.12, 0.06, LB_R,LB_G,LB_B,LB_A,
     0.06,0.00,-0.06, LB_R,LB_G,LB_B,LB_A,   0.06,0.12, 0.06, LB_R,LB_G,LB_B,LB_A,   0.06,0.00, 0.06, LB_R,LB_G,LB_B,LB_A,
     0.12,0.00,-0.06, LB_R,LB_G,LB_B,LB_A,   0.12,0.00, 0.06, LB_R,LB_G,LB_B,LB_A,   0.12,0.12, 0.06, LB_R,LB_G,LB_B,LB_A,
     0.12,0.00,-0.06, LB_R,LB_G,LB_B,LB_A,   0.12,0.12, 0.06, LB_R,LB_G,LB_B,LB_A,   0.12,0.12,-0.06, LB_R,LB_G,LB_B,LB_A,
     0.06,0.12,-0.06, LB_R,LB_G,LB_B,LB_A,   0.12,0.12,-0.06, LB_R,LB_G,LB_B,LB_A,   0.12,0.12, 0.06, LB_R,LB_G,LB_B,LB_A,
     0.06,0.12,-0.06, LB_R,LB_G,LB_B,LB_A,   0.12,0.12, 0.06, LB_R,LB_G,LB_B,LB_A,   0.06,0.12, 0.06, LB_R,LB_G,LB_B,LB_A,
     0.06,0.00,-0.06, LB_R,LB_G,LB_B,LB_A,   0.12,0.00, 0.06, LB_R,LB_G,LB_B,LB_A,   0.12,0.00,-0.06, LB_R,LB_G,LB_B,LB_A,
     0.06,0.00,-0.06, LB_R,LB_G,LB_B,LB_A,   0.06,0.00, 0.06, LB_R,LB_G,LB_B,LB_A,   0.12,0.00, 0.06, LB_R,LB_G,LB_B,LB_A,
]);

    var L = split(lVert);
    lVertexCount = L.count;
    lPosBuffer = makeBufferFloat32(L.positions);
    lColBuffer = makeBufferFloat32(L.colors);

    var S = split(sVert);
    sVertexCount = S.count;
    sPosBuffer = makeBufferFloat32(S.positions);
    sColBuffer = makeBufferFloat32(S.colors);

    makeStars(150);

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.enable(gl.DEPTH_TEST);

    gl.clearColor(0.03, 0.05, 0.18, 1.0);

    render();
};

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    t += 0.05;

    var vx = Math.PI/180.0 * sViewX;
    var vy = Math.PI/180.0 * sViewY;
    var vz = Math.PI/180.0 * sViewZ;
    gl.uniform3fv(uViewThetaLoc, [vx, vy, vz]);


    if (starsOn) {
        gl.uniform3fv(uModelThetaLoc, [0.0, 0.0, 0.0]);
        gl.uniform3fv(uTransLoc, [0.0, 0.0, 0.0]);

        bindPositionBuffer(starsPosBuffer);

        // outer yellow squares
        gl.uniform1f(uPointSizeLoc, 5.5);
        bindColorBuffer(starsOuterColBuffer);
        gl.drawArrays(gl.POINTS, 0, starsCount);
        // inner white squares
        gl.uniform1f(uPointSizeLoc, 3.5);
        bindColorBuffer(starsInnerColBuffer);
        gl.drawArrays(gl.POINTS, 0, starsCount);
    }

    // Pedestal
    gl.uniform1f(uPointSizeLoc, 1.0);
    gl.uniform3fv(uModelThetaLoc, [0.0, 0.0, 0.0]);
    gl.uniform3fv(uTransLoc, [0.0, 0.0, 0.0]);

    bindPositionBuffer(pedPosBuffer);
    bindColorBuffer(pedColBuffer);
    gl.drawArrays(gl.TRIANGLES, 0, pedVertexCount);

    // Letters
    var lx = Math.PI/180.0 * sLettersX;
    var ly = Math.PI/180.0 * sLettersY;
    if (spinLetters) ly += t;

    gl.uniform3fv(uModelThetaLoc, [lx, ly, 0.0]);

    // L
    gl.uniform3fv(uTransLoc, [-0.20, LETTER_Y, 0.0]);
    bindPositionBuffer(lPosBuffer);
    bindColorBuffer(lColBuffer);
    gl.drawArrays(gl.TRIANGLES, 0, lVertexCount);

    // S
    gl.uniform3fv(uTransLoc, [ 0.20, LETTER_Y, 0.0]);
    bindPositionBuffer(sPosBuffer);
    bindColorBuffer(sColBuffer);
    gl.drawArrays(gl.TRIANGLES, 0, sVertexCount);

    requestAnimationFrame(render);
}