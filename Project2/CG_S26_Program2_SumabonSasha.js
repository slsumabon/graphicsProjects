"use strict";

var canvas;
var gl;
var program;

var pointsArray = [];
var normalsArray = [];
var terrainPoints = [];
var terrainNormals = [];

var vBuffer;
var nBuffer;
var tBuffer;
var tnBuffer;

var NumVertices = 36;
var numTerrain = 0;

var modelViewMatrixLoc;
var projectionMatrixLoc;
var normalMatrixLoc;
var colorLoc;
var ambientProductLoc;
var diffuseProductLoc;
var specularProductLoc;
var lightPositionLoc;
var shininessLoc;

var projectionMatrix;
var modelViewMatrix;

var lightAmbient = vec4(0.40, 0.40, 0.35, 1.0);
var lightDiffuse = vec4(1.8, 1.6, 1.1, 1.0);
var lightSpecular = vec4(1.8, 1.7, 1.3, 1.0);

var materialAmbient = vec4(1.0, 1.0, 1.0, 1.0);
var materialDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
var materialSpecular = vec4(0.9, 0.9, 0.9, 1.0);
var materialShininess = 55.0;

var petalColor1 = vec4(1.0, 0.76, 0.86, 1.0);
var petalColor2 = vec4(0.98, 0.67, 0.81, 1.0);
var stemColor = vec4(0.25, 0.63, 0.25, 1.0);
var leafColor = vec4(0.20, 0.56, 0.18, 1.0);
var centerColor1 = vec4(0.96, 0.84, 0.28, 1.0);
var centerColor2 = vec4(1.0, 0.72, 0.18, 1.0);
var groundColor = vec4(0.45, 0.72, 0.38, 1.0);
var darkGroundColor = vec4(0.16, 0.25, 0.16, 1.0);
var skyColor = vec4(0.66, 0.84, 1.0, 1.0);
var darkSkyColor = vec4(0.16, 0.20, 0.34, 1.0);
var sunColor = vec4(1.0, 0.93, 0.30, 1.0);
var fenceColor = vec4(0.72, 0.56, 0.36, 1.0);

var eye;
var at = vec3(0.0, 1.6, 0.0);
var up = vec3(0.0, 1.0, 0.0);

var theta = 35.0;
var phi = 45.0;
var radius = 12.0;

//rotation angle of petals
var petalFB = 28.0;
var petalLR = 24.0;

var bend = 0.0;
var leafMove = 0.0;
var flowerX = 0.0;
var flowerZ = 0.0;
var sunAngle = 10.0;

var animateFlag = false;
var time = 0.0;

var dropAmt = 0.0;
var fallAmt = 0.0;
var growAmt = 1.0;

var vertices = [
    vec4(-0.5, -0.5,  0.5, 1.0),
    vec4(-0.5,  0.5,  0.5, 1.0),
    vec4( 0.5,  0.5,  0.5, 1.0),
    vec4( 0.5, -0.5,  0.5, 1.0),
    vec4(-0.5, -0.5, -0.5, 1.0),
    vec4(-0.5,  0.5, -0.5, 1.0),
    vec4( 0.5,  0.5, -0.5, 1.0),
    vec4( 0.5, -0.5, -0.5, 1.0)
];

window.onload = function init() {
    canvas = document.getElementById("gl-canvas");
    gl = canvas.getContext("webgl2");
    if (!gl) {
        alert("WebGL 2.0 isn't available");
        return;
    }

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.93, 0.97, 1.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    colorCube();
    buildTerrain();

    vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);

    nBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW);

    tBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(terrainPoints), gl.STATIC_DRAW);

    tnBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tnBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(terrainNormals), gl.STATIC_DRAW);

    modelViewMatrixLoc = gl.getUniformLocation(program, "uModelViewMatrix");
    projectionMatrixLoc = gl.getUniformLocation(program, "uProjectionMatrix");
    normalMatrixLoc = gl.getUniformLocation(program, "uNormalMatrix");
    colorLoc = gl.getUniformLocation(program, "uColor");
    ambientProductLoc = gl.getUniformLocation(program, "uAmbientProduct");
    diffuseProductLoc = gl.getUniformLocation(program, "uDiffuseProduct");
    specularProductLoc = gl.getUniformLocation(program, "uSpecularProduct");
    lightPositionLoc = gl.getUniformLocation(program, "uLightPosition");
    shininessLoc = gl.getUniformLocation(program, "uShininess");

    // projection matrix specified to the canvas
    projectionMatrix = perspective(50.0, canvas.width / canvas.height, 0.1, 60.0);
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));

    document.getElementById("petalFrontBack").oninput = function() {
        petalFB = parseFloat(this.value);
    };

    document.getElementById("petalLeftRight").oninput = function() {
        petalLR = parseFloat(this.value);
    };

    document.getElementById("stemBend").oninput = function() {
        bend = parseFloat(this.value);
    };

    document.getElementById("flowerX").oninput = function() {
        flowerX = parseFloat(this.value);
    };

    document.getElementById("flowerZ").oninput = function() {
        flowerZ = parseFloat(this.value);
    };

    document.getElementById("sunAngle").oninput = function() {
        sunAngle = parseFloat(this.value);
    };

    document.getElementById("cameraTheta").oninput = function() {
        theta = parseFloat(this.value);
    };

    document.getElementById("cameraPhi").oninput = function() {
        phi = parseFloat(this.value);
    };

    document.getElementById("cameraRadius").oninput = function() {
        radius = parseFloat(this.value);
    };

    document.getElementById("toggleAnimation").onclick = function() {
        animateFlag = !animateFlag;
    };

    //Manually sets each element to orginal position
    document.getElementById("resetScene").onclick = function() {
        animateFlag = false;
        time = 0.0;
        petalFB = 28.0;
        petalLR = 24.0;
        bend = 0.0;
        leafMove = 0.0;
        flowerX = 0.0;
        flowerZ = 0.0;
        sunAngle = 10.0;
        theta = 35.0;
        phi = 45.0;
        radius = 12.0;
        dropAmt = 0.0;
        fallAmt = 0.0;
        growAmt = 1.0;
        document.getElementById("petalFrontBack").value = petalFB;
        document.getElementById("petalLeftRight").value = petalLR;
        document.getElementById("stemBend").value = bend;
        document.getElementById("flowerX").value = flowerX;
        document.getElementById("flowerZ").value = flowerZ;
        document.getElementById("sunAngle").value = sunAngle;
        document.getElementById("cameraTheta").value = theta;
        document.getElementById("cameraPhi").value = phi;
        document.getElementById("cameraRadius").value = radius;
    };

    render();
};

function quad(a, b, c, d) {
    var t1 = subtract(vertices[b], vertices[a]);
    var t2 = subtract(vertices[c], vertices[b]);
    var normal = normalize(vec3(cross(t1, t2)));

    pointsArray.push(vertices[a]); normalsArray.push(normal);
    pointsArray.push(vertices[b]); normalsArray.push(normal);
    pointsArray.push(vertices[c]); normalsArray.push(normal);
    pointsArray.push(vertices[a]); normalsArray.push(normal);
    pointsArray.push(vertices[c]); normalsArray.push(normal);
    pointsArray.push(vertices[d]); normalsArray.push(normal);
}

function colorCube() {
    quad(1, 0, 3, 2);
    quad(2, 3, 7, 6);
    quad(3, 0, 4, 7);
    quad(6, 5, 1, 2);
    quad(4, 5, 6, 7);
    quad(5, 4, 0, 1);
}

// make the terrain bumpy
function h(x, z) {
    return 0.15 * Math.sin(0.5 * x) * Math.cos(0.4 * z) + 0.08 * Math.cos(1.3 * z);
}

// AI helped generate this function
function getNormal(x, z) {
    var e = 0.02;
    var h1 = h(x - e, z);
    var h2 = h(x + e, z);
    var h3 = h(x, z - e);
    var h4 = h(x, z + e);

    var dx = (h2 - h1) / (2.0 * e);
    var dz = (h4 - h3) / (2.0 * e);

    return normalize(vec3(-dx, 1.0, -dz));
}


function buildTerrain() {
    var rows = 30;
    var cols = 30;
    var size = 10.0;
    var i, j;

    for (i = 0; i < rows - 1; i++) {
        for (j = 0; j < cols - 1; j++) {
            var x0 = size * (2.0 * i / (rows - 1) - 1.0);
            var x1 = size * (2.0 * (i + 1) / (rows - 1) - 1.0);
            var z0 = size * (2.0 * j / (cols - 1) - 1.0);
            var z1 = size * (2.0 * (j + 1) / (cols - 1) - 1.0);

            var p1 = vec4(x0, h(x0, z0), z0, 1.0);
            var p2 = vec4(x1, h(x1, z0), z0, 1.0);
            var p3 = vec4(x1, h(x1, z1), z1, 1.0);
            var p4 = vec4(x0, h(x0, z1), z1, 1.0);

            var n1 = getNormal(x0, z0);
            var n2 = getNormal(x1, z0);
            var n3 = getNormal(x1, z1);
            var n4 = getNormal(x0, z1);

            terrainPoints.push(p1); 
            terrainNormals.push(n1);
            terrainPoints.push(p2); 
            terrainNormals.push(n2);
            terrainPoints.push(p3); 
            terrainNormals.push(n3);
            terrainPoints.push(p1); 
            terrainNormals.push(n1);
            terrainPoints.push(p3); 
            terrainNormals.push(n3);
            terrainPoints.push(p4); 
            terrainNormals.push(n4);
        }
    }

    numTerrain = terrainPoints.length;
}

function setLight(lightPosition, sunOn) {
    var aUse, dUse, sUse;

    if (sunOn) {
        aUse = lightAmbient;
        dUse = lightDiffuse;
        sUse = lightSpecular;
    } else {
        aUse = vec4(0.08, 0.08, 0.14, 1.0);
        dUse = vec4(0.14, 0.14, 0.22, 1.0);
        sUse = vec4(0.08, 0.08, 0.14, 1.0);
    }

    var ambientProduct = mult(aUse, materialAmbient);
    var diffuseProduct = mult(dUse, materialDiffuse);
    var specularProduct = mult(sUse, materialSpecular);

    gl.uniform4fv(ambientProductLoc, flatten(ambientProduct));
    gl.uniform4fv(diffuseProductLoc, flatten(diffuseProduct));
    gl.uniform4fv(specularProductLoc, flatten(specularProduct));
    gl.uniform4fv(lightPositionLoc, flatten(lightPosition));
    gl.uniform1f(shininessLoc, materialShininess);
}

//different bind functions since the stored points are different for the cube and terrain
function bindCube() {
    var vPosition = gl.getAttribLocation(program, "aPosition");
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
    var vNormal = gl.getAttribLocation(program, "aNormal");
    gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
    gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vNormal);
}

function bindTerrain() {
    var vPosition = gl.getAttribLocation(program, "aPosition");
    gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
    var vNormal = gl.getAttribLocation(program, "aNormal");
    gl.bindBuffer(gl.ARRAY_BUFFER, tnBuffer);
    gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vNormal);
}

function drawCube(m, color) {
    var nMatrix;
    bindCube();
    modelViewMatrix = mult(getView(), m);
    nMatrix = normalMatrix(modelViewMatrix, true);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
    gl.uniformMatrix3fv(normalMatrixLoc, false, flatten(nMatrix));
    gl.uniform4fv(colorLoc, flatten(color));
    gl.drawArrays(gl.TRIANGLES, 0, NumVertices);
}

function drawTerrain(m, color) {
    var nMatrix;
    bindTerrain();
    modelViewMatrix = mult(getView(), m);
    nMatrix = normalMatrix(modelViewMatrix, true);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
    gl.uniformMatrix3fv(normalMatrixLoc, false, flatten(nMatrix));
    gl.uniform4fv(colorLoc, flatten(color));
    gl.drawArrays(gl.TRIANGLES, 0, numTerrain);
}

function getView() {
    return lookAt(eye, at, up);
}

function setEye() {
    var t = radians(theta);
    var p = radians(phi);

    eye = vec3(
        radius * Math.sin(t) * Math.sin(p),
        radius * Math.cos(t),
        radius * Math.sin(t) * Math.cos(p)
    );
}

function drawPetal(m, c1, c2, g) {
    var s1, s2, s3, s4;

    if (g <= 0.02) return;

    m = mult(m, scale(g, g, g));

    s1 = mult(m, translate(0.0, 0.18, 0.0));
    s1 = mult(s1, scale(0.28, 0.26, 0.18));
    drawCube(s1, c1);
    s2 = mult(m, translate(0.0, 0.48, 0.0));
    s2 = mult(s2, scale(0.40, 0.30, 0.16));
    drawCube(s2, c1);
    s3 = mult(m, translate(0.0, 0.78, 0.0));
    s3 = mult(s3, scale(0.32, 0.24, 0.14));
    drawCube(s3, c2);
    s4 = mult(m, translate(0.0, 1.00, 0.0));
    s4 = mult(s4, scale(0.16, 0.18, 0.10));
    drawCube(s4, c2);
}

function drawFrontPetal(base, ang, zoff, sign) {
    var m = mat4();
    if (growAmt <= 0.02) return;
    m = mult(m, base);
    m = mult(m, translate(0.0, 0.0, zoff));
    // with the -sign, petals move to ground instead of toward each other
    m = mult(m, rotateX(-sign * ang));
    m = mult(m, translate(0.0, -dropAmt, sign * 0.18 * dropAmt));
    m = mult(m, rotateX(sign * fallAmt));
    drawPetal(m, petalColor1, petalColor2, growAmt);
}

function drawSidePetal(base, ang, xoff, sign) {
    var m = mat4();
    if (growAmt <= 0.02) return;
    m = mult(m, base);
    m = mult(m, translate(xoff, 0.0, 0.0));
    m = mult(m, rotateY(90.0));
    m = mult(m, rotateX(sign * ang));
    m = mult(m, translate(sign * 0.18 * dropAmt, -dropAmt, 0.0));
    m = mult(m, rotateZ(sign * fallAmt));
    drawPetal(m, petalColor1, petalColor2, growAmt);
}

function drawWallsAndSun(sunPos, sunOn) {
    var cSky = sunOn ? skyColor : darkSkyColor;
    var cGround = sunOn ? groundColor : darkGroundColor;
    var wall, i, post, rail1, rail2;

    wall = mult(translate(0.0, 4.7, -9.5), scale(22.0, 10.0, 0.4));
    drawCube(wall, cSky);
    wall = mult(translate(-11.0, 3.2, 0.0), scale(0.4, 7.0, 18.0));
    drawCube(wall, cSky);
    wall = mult(translate(11.0, 3.2, 0.0), scale(0.4, 7.0, 18.0));
    drawCube(wall, cSky);

    for (i = -10; i <= 10; i += 2) {
        post = mult(translate(i, 0.65, -9.0), scale(0.14, 1.3, 0.14));
        drawCube(post, fenceColor);
    }

    //Added fences to background
    //AI helped generate this
    rail1 = mult(translate(0.0, 0.45, -9.0), scale(20.5, 0.10, 0.10));
    rail2 = mult(translate(0.0, 0.95, -9.0), scale(20.5, 0.10, 0.10));
    drawCube(rail1, fenceColor);
    drawCube(rail2, fenceColor);

    for (i = -8; i <= 8; i += 2) {
        post = mult(translate(-10.55, 0.65, i), scale(0.14, 1.3, 0.14));
        drawCube(post, fenceColor);
    }

    rail1 = mult(translate(-10.55, 0.45, 0.0), scale(0.10, 0.10, 16.5));
    rail2 = mult(translate(-10.55, 0.95, 0.0), scale(0.10, 0.10, 16.5));
    drawCube(rail1, fenceColor);
    drawCube(rail2, fenceColor);

    for (i = -8; i <= 8; i += 2) {
        post = mult(translate(10.55, 0.65, i), scale(0.14, 1.3, 0.14));
        drawCube(post, fenceColor);
    }

    rail1 = mult(translate(10.55, 0.45, 0.0), scale(0.10, 0.10, 16.5));
    rail2 = mult(translate(10.55, 0.95, 0.0), scale(0.10, 0.10, 16.5));
    drawCube(rail1, fenceColor);
    drawCube(rail2, fenceColor);

    if (sunOn) {
        var sun1 = mult(translate(sunPos[0], sunPos[1], sunPos[2]), scale(1.45, 1.45, 1.45));
        var sun2 = mult(translate(sunPos[0], sunPos[1], sunPos[2]), scale(0.90, 0.90, 0.90));
        drawCube(sun1, vec4(1.0, 0.85, 0.25, 1.0));
        drawCube(sun2, sunColor);
    }

    drawTerrain(mat4(), cGround);
}

//uses heirarchy to draw flower, with each part being a child of the previous part
function drawFlower() {
    var m = mat4();
    var m2 = mat4();
    var leafBase1 = mat4();
    var leafBase2 = mat4();
    var sway = 0.0;

    if (animateFlag) sway = 5.0 * Math.sin(time * 0.9);

    //matrix for whole flower
    m = mult(m, translate(flowerX, 0.0, flowerZ));
    m = mult(m, rotateZ(0.25 * sway));

    // base of stem built from whole flower matrix
    m2 = mult(m, translate(0.0, 0.9, 0.0));
    m2 = mult(m2, scale(0.18, 1.8, 0.18));
    drawCube(m2, stemColor);

    // top of stem is child of base, so it inherits the sway and movement of the whole flower, but also has its own bend and sway
    var topStem = mat4();
    topStem = mult(topStem, m);
    topStem = mult(topStem, translate(0.0, 1.8, 0.0));
    topStem = mult(topStem, rotateZ(bend + sway));

    m2 = mult(topStem, translate(0.0, 0.9, 0.0));
    m2 = mult(m2, scale(0.15, 1.8, 0.15));
    drawCube(m2, stemColor);

    // leaves are children of whole flower, so they sway and move with the flower, but do not have the bend of the top stem
    leafBase1 = mult(m, translate(0.0, 1.15, 0.0));
    leafBase1 = mult(leafBase1, rotateZ(-35 + leafMove));
    m2 = mult(leafBase1, translate(0.55, 0.0, 0.0));
    m2 = mult(m2, scale(0.95, 0.16, 0.34));
    drawCube(m2, leafColor);
    leafBase2 = mult(m, translate(0.0, 1.42, 0.0));
    leafBase2 = mult(leafBase2, rotateZ(35 - leafMove));
    m2 = mult(leafBase2, translate(-0.52, 0.0, 0.0));
    m2 = mult(m2, scale(0.90, 0.15, 0.32));
    drawCube(m2, leafColor);

    // flower top is child of top stem, so it inherits the movement and sway of the whole flower and the bend and sway of the top stem, but does not have the leaf movement
    var flowerTop = mat4();
    flowerTop = mult(flowerTop, topStem);
    flowerTop = mult(flowerTop, translate(0.0, 1.90, 0.0));

    m2 = mult(flowerTop, scale(0.34, 0.34, 0.34));
    drawCube(m2, centerColor1);

    m2 = mult(flowerTop, translate(0.0, 0.14, 0.0));
    m2 = mult(m2, scale(0.22, 0.22, 0.22));
    drawCube(m2, centerColor2);

    // petals are children of flower top, so they inherit the movement and sway of the whole flower and the bend and sway of the top stem, but do not have the leaf movement
    drawFrontPetal(flowerTop, petalFB, 0.24, -1);
    drawFrontPetal(flowerTop, petalFB, -0.24, 1);
    drawSidePetal(flowerTop, petalLR, -0.24, -1);
    drawSidePetal(flowerTop, petalLR, 0.24, 1);

    if (growAmt < 0.12) {
        m2 = mult(translate(flowerX + 0.95, 0.16, flowerZ + 0.40), rotateZ(55));
        m2 = mult(m2, rotateY(20));
        m2 = mult(m2, scale(0.52, 0.10, 0.25));
        drawCube(m2, petalColor1);
        m2 = mult(translate(flowerX - 0.88, 0.15, flowerZ - 0.35), rotateZ(-42));
        m2 = mult(m2, rotateY(-25));
        m2 = mult(m2, scale(0.48, 0.10, 0.23));
        drawCube(m2, petalColor2);
        m2 = mult(translate(flowerX + 0.18, 0.14, flowerZ - 0.92), rotateZ(22));
        m2 = mult(m2, rotateY(45));
        m2 = mult(m2, scale(0.46, 0.10, 0.22));
        drawCube(m2, petalColor1);
        m2 = mult(translate(flowerX - 0.20, 0.14, flowerZ + 0.90), rotateZ(-18));
        m2 = mult(m2, rotateY(38));
        m2 = mult(m2, scale(0.44, 0.10, 0.20));
        drawCube(m2, petalColor2);
    }
}

//basically moves the flower and sun if button is pressed
function updateAnim() {
    if (animateFlag) {
        time += 0.035;

        var bloom = 0.0 + 90.0 * (0.5 + 0.5 * Math.sin(time));

        petalFB = bloom;
        petalLR = bloom;
        bend = 10.0 * Math.sin(time * 0.7);
        leafMove = 12.0 * Math.sin(time * 0.7 + 0.5);
        flowerX = 1.3 * Math.sin(time * 0.25);
        sunAngle = 110.0 * Math.sin(time * 0.18);

        document.getElementById("petalFrontBack").value = petalFB;
        document.getElementById("petalLeftRight").value = petalLR;
        document.getElementById("stemBend").value = bend;
        document.getElementById("flowerX").value = flowerX;
        document.getElementById("sunAngle").value = sunAngle;
    }
}

function updatePetals(sunOn) {
    if (sunOn) {
        dropAmt -= 0.08;
        if (dropAmt < 0.0) dropAmt = 0.0;

        fallAmt -= 3.0;
        if (fallAmt < 0.0) fallAmt = 0.0;

        growAmt += 0.05;
        if (growAmt > 1.0) growAmt = 1.0;
    } else {
        dropAmt += 0.10;
        if (dropAmt > 1.9) dropAmt = 1.9;

        fallAmt += 4.0;
        if (fallAmt > 92.0) fallAmt = 92.0;

        growAmt -= 0.05;
        if (growAmt < 0.0) growAmt = 0.0;
    }
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    updateAnim();
    setEye();

    var s = radians(sunAngle);
    var sunWorld = vec4(
        9.0 * Math.cos(s),
        3.0 + 8.5 * Math.sin(s),
        -3.0,
        1.0
    );

    var sunOn = sunWorld[1] > 0.5;
    var lightPosition;

    if (sunOn) lightPosition = mult(getView(), sunWorld);
    else lightPosition = vec4(0.0, -20.0, 0.0, 1.0);

    updatePetals(sunOn);
    setLight(lightPosition, sunOn);

    drawWallsAndSun(sunWorld, sunOn);
    drawFlower();

    requestAnimationFrame(render);
}