// CG_P1_Pedestal_Sasha.js
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
var confettiOn = false;

var uViewThetaLoc;
var uModelThetaLoc;
var uTransLoc;

var coneBuffer;
var coneVertexCount = 0;

var letterBufferL;
var letterVertexCountL = 0;

var letterBufferS;
var letterVertexCountS = 0;

var confettiBuffer;
var numConfetti = 0;
var confettiData;     
var speed;     


var t = 0.0;


function buildConeData(radius, yBase, yTip, N)
{
    var data = [];  

    var tip = [0.0, yTip, 0.0];
    var center = [0.0, yBase, 0.0];

    var circle = [];
    for (var i = 0; i <= N; i++) {
        var ang = 2.0 * Math.PI * (i / N);
        var x = radius * Math.cos(ang);
        var z = radius * Math.sin(ang);
        circle.push([x, yBase, z]);
    }

    function coneColor(y) {
        var u = (y - yTip) / (yBase - yTip + 0.000001);


        var r0 = 1.0, g0 = 0.35, b0 = 0.75;
        var r1 = 0.65, g1 = 0.20, b1 = 0.95;

        var r = r0 + (r1 - r0) * u;
        var g = g0 + (g1 - g0) * u;
        var b = b0 + (b1 - b0) * u;

        return [r, g, b, 1.0];
    }

    for (var k = 0; k < N; k++) {
        var p0 = circle[k];
        var p1 = circle[k+1];

        var cTip = coneColor(tip[1]);
        var c0   = coneColor(p0[1]);
        var c1   = coneColor(p1[1]);

        data.push(tip[0], tip[1], tip[2], cTip[0], cTip[1], cTip[2], cTip[3]);
        data.push(p0[0],  p0[1],  p0[2],  c0[0],   c0[1],   c0[2],   c0[3]);
        data.push(p1[0],  p1[1],  p1[2],  c1[0],   c1[1],   c1[2],   c1[3]);
    }

   
    for (var j = 0; j < N; j++) {
        var q0 = circle[j];
        var q1 = circle[j+1];

        var cC  = coneColor(center[1]);
        var cQ0 = coneColor(q0[1]);
        var cQ1 = coneColor(q1[1]);

        data.push(center[0], center[1], center[2], cC[0],  cC[1],  cC[2],  cC[3]);
        data.push(q1[0],     q1[1],     q1[2],     cQ1[0], cQ1[1], cQ1[2], cQ1[3]);
        data.push(q0[0],     q0[1],     q0[2],     cQ0[0], cQ0[1], cQ0[2], cQ0[3]);
    }

    return new Float32Array(data);
}


function letterColor(x, xMin, xMax)
{
    var u = (x - xMin) / (xMax - xMin + 0.000001);

    var r0 = 0.70, g0 = 1.00, b0 = 0.70;
    var r1 = 0.70, g1 = 0.90, b1 = 1.00;

    var r = r0 + (r1 - r0) * u;
    var g = g0 + (g1 - g0) * u;
    var b = b0 + (b1 - b0) * u;

    return [r, g, b, 1.0];
}


function boxShape(arr, x0,x1, y0,y1, z0,z1)
{
    var v0 = [x0,y0,z0];
    var v1 = [x1,y0,z0];
    var v2 = [x1,y1,z0];
    var v3 = [x0,y1,z0];

    var v4 = [x0,y0,z1];
    var v5 = [x1,y0,z1];
    var v6 = [x1,y1,z1];
    var v7 = [x0,y1,z1];

    var xMin = x0;
    var xMax = x1;

    function pushV(v) {
        var c = letterColor(v[0], xMin, xMax);
        arr.push(v[0], v[1], v[2], c[0], c[1], c[2], c[3]);
    }

   
    pushV(v0); pushV(v1); pushV(v2);
    pushV(v0); pushV(v2); pushV(v3);
    pushV(v4); pushV(v6); pushV(v5);
    pushV(v4); pushV(v7); pushV(v6);
    pushV(v0); pushV(v3); pushV(v7);
    pushV(v0); pushV(v7); pushV(v4);
    pushV(v1); pushV(v5); pushV(v6);
    pushV(v1); pushV(v6); pushV(v2);
    pushV(v3); pushV(v2); pushV(v6);
    pushV(v3); pushV(v6); pushV(v7);
    pushV(v0); pushV(v4); pushV(v5);
    pushV(v0); pushV(v5); pushV(v1);
}

function letterL()
{
    var arr = [];
    var z0 = -0.06, z1 = 0.06;

    boxShape(arr, -0.08, -0.02, 0.00, 0.30, z0, z1);
    boxShape(arr, -0.08,  0.14, 0.00, 0.06, z0, z1);

    return new Float32Array(arr);
}

function letterS()
{
    var arr = [];
    var z0 = -0.06, z1 = 0.06;

    boxShape(arr, -0.12, 0.12, 0.24, 0.30, z0, z1);
    boxShape(arr, -0.12, 0.12, 0.12, 0.18, z0, z1);
    boxShape(arr, -0.12, 0.12, 0.00, 0.06, z0, z1);
    boxShape(arr, -0.12,-0.06, 0.18, 0.30, z0, z1);
    boxShape(arr,  0.06, 0.12, 0.00, 0.12, z0, z1);

    return new Float32Array(arr);
}

function makeConfetti(n)
{
    numConfetti = n;
    confettiData = new Float32Array(n * 7);
    speed = new Float32Array(n);

    for (var i = 0; i < n; i++) {
        var x = (Math.random() * 1.8 - 1.0) * 0.8;
        var y = 0.3 + Math.random() * 1.3;
        var z = (Math.random() * 1.8 - 1.0) * 0.8;

        var colors = [
        [1.0, 0.7, 0.7],   
        [0.7, 1.0, 0.7],  
        [0.7, 0.7, 1.0],   
        [1.0, 1.0, 0.7],   
        [1.0, 0.7, 1.0],   
        [0.7, 1.0, 1.0]    
        ];

        var c = colors[Math.floor(Math.random()*colors.length)];
        var r = c[0];
        var g = c[1];
        var b = c[2];

        confettiData[7*i+0] = x;
        confettiData[7*i+1] = y;
        confettiData[7*i+2] = z;
        confettiData[7*i+3] = r;
        confettiData[7*i+4] = g;
        confettiData[7*i+5] = b;
        confettiData[7*i+6] = 1.0;

        speed[i] = 0.012 * Math.random();
    }

    confettiBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, confettiBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, confettiData, gl.DYNAMIC_DRAW);
}

function updateConfetti()
{
    for (var i = 0; i < numConfetti; i++) {
        confettiData[7*i+1] -= speed[i];
        confettiData[7*i] += 0.005 * Math.sin(t + i);

        if (confettiData[7*i+1] < -0.9) {
            confettiData[7*i+1] = 1.6;
            confettiData[7*i] = (Math.random() * 1.8 - 0.9) * 0.9;
        }
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, confettiBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, confettiData);
}


function setupInterleavedBuffer(floatArray)
{
    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, floatArray, gl.STATIC_DRAW);
    return buffer;
}


window.onload = function init()
{
    canvas = document.getElementById("gl-canvas");
    gl = canvas.getContext("webgl2");
    if (!gl) { alert("WebGL 2.0 isn't available"); }

    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    aPositionLoc = gl.getAttribLocation(program, "aPosition");
    aColorLoc = gl.getAttribLocation(program, "aColor");

    gl.enableVertexAttribArray(aPositionLoc);
    gl.enableVertexAttribArray(aColorLoc);

    uViewThetaLoc  = gl.getUniformLocation(program, "uViewTheta");
    uModelThetaLoc = gl.getUniformLocation(program, "uModelTheta");
    uTransLoc      = gl.getUniformLocation(program, "uTrans");

    document.getElementById("ViewX").oninput = function(e){ sViewX = parseFloat(e.target.value); };
    document.getElementById("ViewY").oninput = function(e){ sViewY = parseFloat(e.target.value); };
    document.getElementById("ViewZ").oninput = function(e){ sViewZ = parseFloat(e.target.value); };

    document.getElementById("LettersX").oninput = function(e){ sLettersX = parseFloat(e.target.value); };
    document.getElementById("LettersY").oninput = function(e){ sLettersY = parseFloat(e.target.value); };

    document.getElementById("SpinButton").onclick = function() { spinLetters = !spinLetters; };
    document.getElementById("ConfettiButton").onclick = function() { confettiOn = !confettiOn; };

    var coneData = buildConeData(0.55, 0.10, -0.40, 64);
    coneVertexCount = coneData.length / 7;
    coneBuffer = setupInterleavedBuffer(coneData);

    var Ldata = letterL();
    letterVertexCountL = Ldata.length / 7;
    letterBufferL = setupInterleavedBuffer(Ldata);

    var Sdata = letterS();
    letterVertexCountS = Sdata.length / 7;
    letterBufferS = setupInterleavedBuffer(Sdata);

    makeConfetti(450);

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);


    render();
};

function render()
{
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    t = t + 0.05;

    // view rotation
    var vx = Math.PI/180.0 * sViewX;
    var vy = Math.PI/180.0 * sViewY;
    var vz = Math.PI/180.0 * sViewZ;
    gl.uniform3fv(uViewThetaLoc, [vx, vy, vz]);

    gl.uniform3fv(uModelThetaLoc, [0.0, 0.0, 0.0]);
    gl.uniform3fv(uTransLoc, [0.0, 0.0, 0.0]);

    gl.bindBuffer(gl.ARRAY_BUFFER, coneBuffer);
    gl.vertexAttribPointer(aPositionLoc, 3, gl.FLOAT, false,
        7 * Float32Array.BYTES_PER_ELEMENT, 0);
    gl.vertexAttribPointer(aColorLoc, 4, gl.FLOAT, false,
        7 * Float32Array.BYTES_PER_ELEMENT,
        3 * Float32Array.BYTES_PER_ELEMENT);
    gl.drawArrays(gl.TRIANGLES, 0, coneVertexCount);

    // letters
    var letterY = 0.10;

    var lx = Math.PI/180.0 * sLettersX;
    var ly = Math.PI/180.0 * sLettersY;
    if (spinLetters) {
        ly = ly + t;
    }
    gl.uniform3fv(uModelThetaLoc, [lx, ly, 0.0]);

    gl.uniform3fv(uTransLoc, [-0.20, letterY, 0.0]);
    gl.bindBuffer(gl.ARRAY_BUFFER, letterBufferL);
    gl.vertexAttribPointer(aPositionLoc, 3, gl.FLOAT, false,
        7 * Float32Array.BYTES_PER_ELEMENT, 0);
    gl.vertexAttribPointer(aColorLoc, 4, gl.FLOAT, false,
        7 * Float32Array.BYTES_PER_ELEMENT,
        3 * Float32Array.BYTES_PER_ELEMENT);
    gl.drawArrays(gl.TRIANGLES, 0, letterVertexCountL);

    gl.uniform3fv(uTransLoc, [0.20, letterY, 0.0]);
    gl.bindBuffer(gl.ARRAY_BUFFER, letterBufferS);
    gl.vertexAttribPointer(aPositionLoc, 3, gl.FLOAT, false,
        7 * Float32Array.BYTES_PER_ELEMENT, 0);
    gl.vertexAttribPointer(aColorLoc, 4, gl.FLOAT, false,
        7 * Float32Array.BYTES_PER_ELEMENT,
        3 * Float32Array.BYTES_PER_ELEMENT);
    gl.drawArrays(gl.TRIANGLES, 0, letterVertexCountS);

    if (confettiOn) {
        updateConfetti();

        gl.uniform3fv(uModelThetaLoc, [0.0, 0.0, 0.0]);
        gl.uniform3fv(uTransLoc, [0.0, 0.0, 0.0]);

        gl.bindBuffer(gl.ARRAY_BUFFER, confettiBuffer);
        gl.vertexAttribPointer(aPositionLoc, 3, gl.FLOAT, false,
            7 * Float32Array.BYTES_PER_ELEMENT, 0);
        gl.vertexAttribPointer(aColorLoc, 4, gl.FLOAT, false,
            7 * Float32Array.BYTES_PER_ELEMENT,
            3 * Float32Array.BYTES_PER_ELEMENT);

        gl.drawArrays(gl.POINTS, 0, numConfetti);
    }

    requestAnimationFrame(render);
}