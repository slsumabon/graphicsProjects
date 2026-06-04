"use strict";

var citymesh = function() {

var gl;

var nRows = 24;
var nColumns = 24;

var data = [];
var positionsArray = [];
var normalsArray = [];

var cubePositions = [];
var cubeNormals = [];

var pyramidPositions = [];
var pyramidNormals = [];

var colorLoc;
var lightDirLoc;
var modelViewMatrixLoc;
var projectionMatrixLoc;
var normalMatrixLoc;

var terrainBuffer;
var terrainNormalBuffer;
var cubeBuffer;
var cubeNormalBuffer;
var pyramidBuffer;
var pyramidNormalBuffer;

var near = -12;
var far = 12;
var radius = 1.8;
var theta = 0.6;
var phi = 0.8;
var dr = 5.0 * Math.PI/180.0;

var left = -2.2;
var right = 2.2;
var ytop = 2.2;
var bottom = -2.2;

const at = vec3(0.0, 0.0, 0.0);
const up = vec3(0.0, 1.0, 0.0);

const black = vec4(0.0, 0.0, 0.0, 1.0);
const green = vec4(0.18, 0.55, 0.22, 1.0);
const roadGray = vec4(0.18, 0.18, 0.18, 1.0);
const trunkBrown = vec4(0.45, 0.28, 0.12, 1.0);
const leafGreen = vec4(0.10, 0.45, 0.12, 1.0);

const buildingColors = [
    vec4(0.55, 0.60, 0.75, 1.0),
    vec4(0.70, 0.58, 0.50, 1.0),
    vec4(0.52, 0.65, 0.62, 1.0),
    vec4(0.62, 0.62, 0.70, 1.0),
    vec4(0.68, 0.55, 0.55, 1.0),
    vec4(0.58, 0.68, 0.72, 1.0),
    vec4(0.72, 0.66, 0.52, 1.0),
    vec4(0.60, 0.60, 0.60, 1.0)
];

init();

function terrainHeight(x, z)
{
    // not the hat function from class
    // use a different math function to make the mesh interesting
    var h = 0.10 * Math.sin(2.2 * x) * Math.cos(1.7 * z);
    h += 0.06 * Math.sin(3.0 * x + 1.2 * z);
    h += 0.04 * Math.cos(2.5 * z - 1.3 * x);

    var r2 = x*x + z*z;
    h -= 0.10 * Math.exp(-3.0 * r2);

    return h;
}

function terrainNormal(x, z)
{
    var e = 0.01;

    var hL = terrainHeight(x - e, z);
    var hR = terrainHeight(x + e, z);
    var hD = terrainHeight(x, z - e);
    var hU = terrainHeight(x, z + e);

    return normalize(vec3(hL - hR, 2.0 * e, hD - hU));
}

function initCube()
{
    var p = [
        vec4(-0.5, -0.5,  0.5, 1.0), vec4( 0.5, -0.5,  0.5, 1.0), vec4( 0.5,  0.5,  0.5, 1.0), vec4(-0.5,  0.5,  0.5, 1.0),
        vec4( 0.5, -0.5, -0.5, 1.0), vec4(-0.5, -0.5, -0.5, 1.0), vec4(-0.5,  0.5, -0.5, 1.0), vec4( 0.5,  0.5, -0.5, 1.0),
        vec4(-0.5, -0.5, -0.5, 1.0), vec4(-0.5, -0.5,  0.5, 1.0), vec4(-0.5,  0.5,  0.5, 1.0), vec4(-0.5,  0.5, -0.5, 1.0),
        vec4( 0.5, -0.5,  0.5, 1.0), vec4( 0.5, -0.5, -0.5, 1.0), vec4( 0.5,  0.5, -0.5, 1.0), vec4( 0.5,  0.5,  0.5, 1.0),
        vec4(-0.5,  0.5,  0.5, 1.0), vec4( 0.5,  0.5,  0.5, 1.0), vec4( 0.5,  0.5, -0.5, 1.0), vec4(-0.5,  0.5, -0.5, 1.0),
        vec4(-0.5, -0.5, -0.5, 1.0), vec4( 0.5, -0.5, -0.5, 1.0), vec4( 0.5, -0.5,  0.5, 1.0), vec4(-0.5, -0.5,  0.5, 1.0)
    ];

    var n = [
        vec3( 0.0, 0.0, 1.0), vec3( 0.0, 0.0, 1.0), vec3( 0.0, 0.0, 1.0), vec3( 0.0, 0.0, 1.0),
        vec3( 0.0, 0.0,-1.0), vec3( 0.0, 0.0,-1.0), vec3( 0.0, 0.0,-1.0), vec3( 0.0, 0.0,-1.0),
        vec3(-1.0, 0.0, 0.0), vec3(-1.0, 0.0, 0.0), vec3(-1.0, 0.0, 0.0), vec3(-1.0, 0.0, 0.0),
        vec3( 1.0, 0.0, 0.0), vec3( 1.0, 0.0, 0.0), vec3( 1.0, 0.0, 0.0), vec3( 1.0, 0.0, 0.0),
        vec3( 0.0, 1.0, 0.0), vec3( 0.0, 1.0, 0.0), vec3( 0.0, 1.0, 0.0), vec3( 0.0, 1.0, 0.0),
        vec3( 0.0,-1.0, 0.0), vec3( 0.0,-1.0, 0.0), vec3( 0.0,-1.0, 0.0), vec3( 0.0,-1.0, 0.0)
    ];

    for(var i = 0; i < 24; i++) {
        cubePositions.push(p[i]);
        cubeNormals.push(n[i]);
    }
}

function initPyramid()
{
    function pushTri(a, b, c)
    {
        var u = subtract(b, a);
        var v = subtract(c, a);
        var nn = normalize(cross(u, v));

        pyramidPositions.push(vec4(a[0], a[1], a[2], 1.0));
        pyramidPositions.push(vec4(b[0], b[1], b[2], 1.0));
        pyramidPositions.push(vec4(c[0], c[1], c[2], 1.0));

        pyramidNormals.push(nn);
        pyramidNormals.push(nn);
        pyramidNormals.push(nn);
    }

    var p0 = vec3(-0.5, 0.0,  0.5);
    var p1 = vec3( 0.5, 0.0,  0.5);
    var p2 = vec3( 0.5, 0.0, -0.5);
    var p3 = vec3(-0.5, 0.0, -0.5);
    var topP = vec3(0.0, 1.0, 0.0);

    pushTri(p0, p1, topP);
    pushTri(p1, p2, topP);
    pushTri(p2, p3, topP);
    pushTri(p3, p0, topP);

    pushTri(p0, p2, p1);
    pushTri(p0, p3, p2);
}

function init()
{
    var canvas = document.getElementById("gl-canvas");

    gl = canvas.getContext('webgl2');
    if (!gl) alert("WebGL 2.0 isn't available");

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.95, 0.97, 1.0, 1.0);

    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.enable(gl.POLYGON_OFFSET_FILL);
    gl.polygonOffset(1.0, 2.0);

    // create terrain mesh like the class example
    for(var i = 0; i < nRows; ++i) {
        data.push([]);
        for(var j = 0; j < nColumns; ++j) {
            var x = 2.0 * i / (nRows - 1) - 1.0;
            var z = 2.0 * j / (nColumns - 1) - 1.0;
            data[i][j] = terrainHeight(x, z);
        }
    }

    for(var i = 0; i < nRows - 1; i++) {
        for(var j = 0; j < nColumns - 1; j++) {

            var x0 = 2.0 * i / (nRows - 1) - 1.0;
            var x1 = 2.0 * (i + 1) / (nRows - 1) - 1.0;
            var z0 = 2.0 * j / (nColumns - 1) - 1.0;
            var z1 = 2.0 * (j + 1) / (nColumns - 1) - 1.0;

            positionsArray.push(vec4(x0, data[i][j],     z0, 1.0));
            positionsArray.push(vec4(x1, data[i+1][j],   z0, 1.0));
            positionsArray.push(vec4(x1, data[i+1][j+1], z1, 1.0));
            positionsArray.push(vec4(x0, data[i][j+1],   z1, 1.0));

            normalsArray.push(terrainNormal(x0, z0));
            normalsArray.push(terrainNormal(x1, z0));
            normalsArray.push(terrainNormal(x1, z1));
            normalsArray.push(terrainNormal(x0, z1));
        }
    }

    initCube();
    initPyramid();

    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    terrainBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, terrainBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(positionsArray), gl.STATIC_DRAW);

    terrainNormalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, terrainNormalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW);

    cubeBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(cubePositions), gl.STATIC_DRAW);

    cubeNormalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeNormalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(cubeNormals), gl.STATIC_DRAW);

    pyramidBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, pyramidBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pyramidPositions), gl.STATIC_DRAW);

    pyramidNormalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, pyramidNormalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pyramidNormals), gl.STATIC_DRAW);

    colorLoc = gl.getUniformLocation(program, "uColor");
    lightDirLoc = gl.getUniformLocation(program, "uLightDir");
    modelViewMatrixLoc = gl.getUniformLocation(program, "uModelViewMatrix");
    projectionMatrixLoc = gl.getUniformLocation(program, "uProjectionMatrix");
    normalMatrixLoc = gl.getUniformLocation(program, "uNormalMatrix");

    document.getElementById("Button1").onclick = function(){ near *= 1.1; far *= 1.1; };
    document.getElementById("Button2").onclick = function(){ near *= 0.9; far *= 0.9; };
    document.getElementById("Button3").onclick = function(){ radius *= 2.0; };
    document.getElementById("Button4").onclick = function(){ radius *= 0.5; };
    document.getElementById("Button5").onclick = function(){ theta += dr; };
    document.getElementById("Button6").onclick = function(){ theta -= dr; };
    document.getElementById("Button7").onclick = function(){ phi += dr; };
    document.getElementById("Button8").onclick = function(){ phi -= dr; };
    document.getElementById("Button9").onclick = function(){ left *= 0.9; right *= 0.9; };
    document.getElementById("Button10").onclick = function(){ left *= 1.1; right *= 1.1; };
    document.getElementById("Button11").onclick = function(){ ytop *= 0.9; bottom *= 0.9; };
    document.getElementById("Button12").onclick = function(){ ytop *= 1.1; bottom *= 1.1; };

    render();
}

function render()
{
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var eye = vec3(
        radius * Math.sin(theta) * Math.cos(phi),
        radius * Math.sin(theta) * Math.sin(phi),
        radius * Math.cos(theta)
    );

    var viewMatrix = lookAt(eye, at, up);
    var projectionMatrix = ortho(left, right, bottom, ytop, near, far);

    gl.uniform3fv(lightDirLoc, flatten(vec3(0.6, 1.0, 0.4)));

    // draw terrain mesh
    gl.bindBuffer(gl.ARRAY_BUFFER, terrainBuffer);
    var aPosition = gl.getAttribLocation(gl.getParameter(gl.CURRENT_PROGRAM), "aPosition");
    gl.vertexAttribPointer(aPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(aPosition);

    gl.bindBuffer(gl.ARRAY_BUFFER, terrainNormalBuffer);
    var aNormal = gl.getAttribLocation(gl.getParameter(gl.CURRENT_PROGRAM), "aNormal");
    gl.vertexAttribPointer(aNormal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(aNormal);

    var modelMatrix = mat4();
    var modelViewMatrix = mult(viewMatrix, modelMatrix);
    var nMatrix = normalMatrix(modelViewMatrix, true);

    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));
    gl.uniformMatrix3fv(normalMatrixLoc, false, flatten(nMatrix));

    for(var i = 0; i < positionsArray.length; i += 4) {
        gl.uniform4fv(colorLoc, green);
        gl.drawArrays(gl.TRIANGLE_FAN, i, 4);

        gl.uniform4fv(colorLoc, black);
        gl.drawArrays(gl.LINE_LOOP, i, 4);
    }

    // draw road
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeBuffer);
    gl.vertexAttribPointer(aPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(aPosition);

    gl.bindBuffer(gl.ARRAY_BUFFER, cubeNormalBuffer);
    gl.vertexAttribPointer(aNormal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(aNormal);

    var roadY = terrainHeight(0.0, 0.0) + 0.03;
    modelMatrix = mult(translate(0.0, roadY, 0.0), scale(1.6, 0.03, 0.22));
    modelViewMatrix = mult(viewMatrix, modelMatrix);
    nMatrix = normalMatrix(modelViewMatrix, true);

    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));
    gl.uniformMatrix3fv(normalMatrixLoc, false, flatten(nMatrix));

    for(i = 0; i < cubePositions.length; i += 4) {
        gl.uniform4fv(colorLoc, roadGray);
        gl.drawArrays(gl.TRIANGLE_FAN, i, 4);

        gl.uniform4fv(colorLoc, black);
        gl.drawArrays(gl.LINE_LOOP, i, 4);
    }

    // draw 8 buildings
    var bx = [-0.70, -0.42, -0.14, 0.16, -0.62, -0.30, 0.02, 0.34];
    var bz = [-0.42, -0.45, -0.42, -0.45,  0.42,  0.45, 0.42, 0.45];
    var bsx = [0.16, 0.16, 0.18, 0.16, 0.16, 0.16, 0.18, 0.16];
    var bsy = [0.42, 0.55, 0.38, 0.62, 0.45, 0.52, 0.40, 0.58];
    var bsz = [0.16, 0.16, 0.16, 0.16, 0.16, 0.16, 0.16, 0.16];

    for(var b = 0; b < 8; b++) {
        var y = terrainHeight(bx[b], bz[b]) + bsy[b] / 2.0;
        modelMatrix = mult(translate(bx[b], y, bz[b]), scale(bsx[b], bsy[b], bsz[b]));
        modelViewMatrix = mult(viewMatrix, modelMatrix);
        nMatrix = normalMatrix(modelViewMatrix, true);

        gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
        gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));
        gl.uniformMatrix3fv(normalMatrixLoc, false, flatten(nMatrix));

        for(i = 0; i < cubePositions.length; i += 4) {
            gl.uniform4fv(colorLoc, buildingColors[b]);
            gl.drawArrays(gl.TRIANGLE_FAN, i, 4);

            gl.uniform4fv(colorLoc, black);
            gl.drawArrays(gl.LINE_LOOP, i, 4);
        }
    }

    // draw trees
    var tx = [-0.95, -0.92, 0.95, 0.92, 0.00];
    var tz = [-0.82,  0.82,-0.82, 0.82,-0.90];

    for(var t = 0; t < 5; t++) {

        var treeY = terrainHeight(tx[t], tz[t]);
        var trunkHeight = 0.18;
        var leafHeight = 0.22;

        // trunk
        modelMatrix = mult(translate(tx[t], treeY + trunkHeight / 2.0, tz[t]), scale(0.05, trunkHeight, 0.05));
        modelViewMatrix = mult(viewMatrix, modelMatrix);
        nMatrix = normalMatrix(modelViewMatrix, true);

        gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
        gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));
        gl.uniformMatrix3fv(normalMatrixLoc, false, flatten(nMatrix));

        for(i = 0; i < cubePositions.length; i += 4) {
            gl.uniform4fv(colorLoc, trunkBrown);
            gl.drawArrays(gl.TRIANGLE_FAN, i, 4);

            gl.uniform4fv(colorLoc, black);
            gl.drawArrays(gl.LINE_LOOP, i, 4);
        }

        // leaves
        gl.bindBuffer(gl.ARRAY_BUFFER, pyramidBuffer);
        gl.vertexAttribPointer(aPosition, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(aPosition);

        gl.bindBuffer(gl.ARRAY_BUFFER, pyramidNormalBuffer);
        gl.vertexAttribPointer(aNormal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(aNormal);

        modelMatrix = mult(translate(tx[t], treeY + trunkHeight, tz[t]), scale(0.15, leafHeight, 0.15));
        modelViewMatrix = mult(viewMatrix, modelMatrix);
        nMatrix = normalMatrix(modelViewMatrix, true);

        gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
        gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));
        gl.uniformMatrix3fv(normalMatrixLoc, false, flatten(nMatrix));

        for(i = 0; i < pyramidPositions.length; i += 3) {
            gl.uniform4fv(colorLoc, leafGreen);
            gl.drawArrays(gl.TRIANGLES, i, 3);

            gl.uniform4fv(colorLoc, black);
            gl.drawArrays(gl.LINE_LOOP, i, 3);
        }

        // switch back to cube buffers for next tree/building style drawing
        gl.bindBuffer(gl.ARRAY_BUFFER, cubeBuffer);
        gl.vertexAttribPointer(aPosition, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(aPosition);

        gl.bindBuffer(gl.ARRAY_BUFFER, cubeNormalBuffer);
        gl.vertexAttribPointer(aNormal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(aNormal);
    }

    requestAnimationFrame(render);
}

}

citymesh();