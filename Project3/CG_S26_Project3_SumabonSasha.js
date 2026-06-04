"use strict";

var canvas;
var gl;
var program;

var texture1;       // webcam texture
var texture2;       // uploaded wall image texture
var video = document.querySelector('video');

var diamond = {};
var room = {};
var lasers = {};

var theta = 25;
var phi = 15;
var radius = 5.2;

var effectAmount = 0.55;
var wallMode = 0;

var spinSpeed = 0.55;
var spinOn = true;

var diamondX = 0.0;
var diamondY = 0.0;
var diamondZ = 0.0;

var lockdownOn = false;

var startTime = Date.now();
var spinAngle = 0.0;

var positionLoc;
var normalLoc;
var texCoordLoc;
var effectLoc;

var modelViewLoc;
var projectionLoc;
var normalMatrixLoc;
var textureloc;
var wallImageTextureLoc;
var timeLoc;
var effectAmountLoc;
var wallModeLoc;


// -------------------------------------------------------
// Webcam setup: close to class webcam starter
// -------------------------------------------------------

async function setup() {
    try {
        await accessWebcam(video);
    } catch (ex) {
        video = null;
        console.error(ex.message);
    }
}

function accessWebcam(video) {
    return new Promise((resolve, reject) => {
        const mediaConstraints = {
            audio: false,
            video: {
                width: 400,
                height: 400,
                brightness: { ideal: 2 }
            }
        };

        navigator.mediaDevices.getUserMedia(mediaConstraints).then(mediaStream => {
            video.srcObject = mediaStream;
            video.setAttribute('playsinline', true);

            video.onloadedmetadata = function () {
                video.play();
                resolve(video);
            };
        }).catch(err => {
            reject(err);
        });
    });
}


// -------------------------------------------------------
// Geometry
// -------------------------------------------------------

function addTriangle(posArray, normArray, texArray, effectArray, a, b, c, effectNumber) {
    var u = subtract(b, a);
    var v = subtract(c, a);
    var n = normalize(cross(u, v));

    var texA = vec2(0.5, 1.0);
    var texB = vec2(0.0, 0.0);
    var texC = vec2(1.0, 0.0);

    var verts = [a, b, c];
    var texs = [texA, texB, texC];

    for (var i = 0; i < 3; i++) {
        posArray.push(verts[i][0], verts[i][1], verts[i][2]);
        normArray.push(n[0], n[1], n[2]);
        texArray.push(texs[i][0], texs[i][1]);
        effectArray.push(effectNumber);
    }
}

function makeDiamondData() {
    var positions = [];
    var normals = [];
    var texCoords = [];
    var effects = [];

    var top = vec3(0.0, 1.35, 0.0);
    var bottom = vec3(0.0, -1.35, 0.0);

    var front = vec3(0.0, 0.0, 1.05);
    var right = vec3(1.05, 0.0, 0.0);
    var back = vec3(0.0, 0.0, -1.05);
    var left = vec3(-1.05, 0.0, 0.0);

    addTriangle(positions, normals, texCoords, effects, top, front, right, 0.0);
    addTriangle(positions, normals, texCoords, effects, top, right, back, 1.0);
    addTriangle(positions, normals, texCoords, effects, top, back, left, 2.0);
    addTriangle(positions, normals, texCoords, effects, top, left, front, 3.0);

    addTriangle(positions, normals, texCoords, effects, bottom, right, front, 4.0);
    addTriangle(positions, normals, texCoords, effects, bottom, back, right, 5.0);
    addTriangle(positions, normals, texCoords, effects, bottom, left, back, 6.0);
    addTriangle(positions, normals, texCoords, effects, bottom, front, left, 7.0);

    return {
        positions: new Float32Array(positions),
        normals: new Float32Array(normals),
        texCoords: new Float32Array(texCoords),
        effects: new Float32Array(effects),
        count: positions.length / 3
    };
}

function addPlane(posArray, normArray, texArray, effectArray, a, b, c, d, normal, texRepeat, effectNumber) {
    var verts = [a, b, c, a, c, d];

    var texs = [
        vec2(0.0, 0.0),
        vec2(texRepeat, 0.0),
        vec2(texRepeat, texRepeat),
        vec2(0.0, 0.0),
        vec2(texRepeat, texRepeat),
        vec2(0.0, texRepeat)
    ];

    for (var i = 0; i < 6; i++) {
        posArray.push(verts[i][0], verts[i][1], verts[i][2]);
        normArray.push(normal[0], normal[1], normal[2]);
        texArray.push(texs[i][0], texs[i][1]);
        effectArray.push(effectNumber);
    }
}

function makeRoomData() {
    var positions = [];
    var normals = [];
    var texCoords = [];
    var effects = [];

    // Walls use texRepeat 1.0 so an uploaded image maps correctly once per wall.
    // Floor uses procedural stone and can repeat more.

    // back wall
    addPlane(
        positions, normals, texCoords, effects,
        vec3(-4.0, -2.0, -3.2),
        vec3( 4.0, -2.0, -3.2),
        vec3( 4.0,  3.0, -3.2),
        vec3(-4.0,  3.0, -3.2),
        vec3(0.0, 0.0, 1.0),
        1.0,
        -1.0
    );

    // left wall
    addPlane(
        positions, normals, texCoords, effects,
        vec3(-4.0, -2.0,  2.8),
        vec3(-4.0, -2.0, -3.2),
        vec3(-4.0,  3.0, -3.2),
        vec3(-4.0,  3.0,  2.8),
        vec3(1.0, 0.0, 0.0),
        1.0,
        -1.0
    );

    // right wall
    addPlane(
        positions, normals, texCoords, effects,
        vec3(4.0, -2.0, -3.2),
        vec3(4.0, -2.0,  2.8),
        vec3(4.0,  3.0,  2.8),
        vec3(4.0,  3.0, -3.2),
        vec3(-1.0, 0.0, 0.0),
        1.0,
        -1.0
    );

    // floor, always stone
    addPlane(
        positions, normals, texCoords, effects,
        vec3(-4.0, -2.0,  2.8),
        vec3( 4.0, -2.0,  2.8),
        vec3( 4.0, -2.0, -3.2),
        vec3(-4.0, -2.0, -3.2),
        vec3(0.0, 1.0, 0.0),
        3.0,
        -3.0
    );

    return {
        positions: new Float32Array(positions),
        normals: new Float32Array(normals),
        texCoords: new Float32Array(texCoords),
        effects: new Float32Array(effects),
        count: positions.length / 3
    };
}

function addLaserPlane(posArray, normArray, texArray, effectArray, a, b, c, d) {
    var verts = [a, b, c, a, c, d];

    for (var i = 0; i < 6; i++) {
        posArray.push(verts[i][0], verts[i][1], verts[i][2]);
        normArray.push(0.0, 0.0, 1.0);
        texArray.push(0.0, 0.0);
        effectArray.push(-2.0);
    }
}

function makeLaserData() {
    var positions = [];
    var normals = [];
    var texCoords = [];
    var effects = [];

    var w = 0.035;

    addLaserPlane(
        positions, normals, texCoords, effects,
        vec3(-3.2, -1.25, 1.20),
        vec3(-3.2, -1.25 + w, 1.20),
        vec3( 3.2,  1.15 + w, 1.20),
        vec3( 3.2,  1.15, 1.20)
    );

    addLaserPlane(
        positions, normals, texCoords, effects,
        vec3(-3.2,  1.20, 1.18),
        vec3(-3.2,  1.20 + w, 1.18),
        vec3( 3.2, -1.10 + w, 1.18),
        vec3( 3.2, -1.10, 1.18)
    );

    addLaserPlane(
        positions, normals, texCoords, effects,
        vec3(-3.3, 0.05, 1.12),
        vec3(-3.3, 0.05 + w, 1.12),
        vec3( 3.3, 0.05 + w, 1.12),
        vec3( 3.3, 0.05, 1.12)
    );

    addLaserPlane(
        positions, normals, texCoords, effects,
        vec3(-2.8, -0.85, 1.10),
        vec3(-2.8, -0.85 + w, 1.10),
        vec3( 2.8, -0.85 + w, 1.10),
        vec3( 2.8, -0.85, 1.10)
    );

    addLaserPlane(
        positions, normals, texCoords, effects,
        vec3(-3.5, -1.3, -1.5),
        vec3(-3.5, -1.3 + w, -1.5),
        vec3( 0.5,  1.1 + w,  1.0),
        vec3( 0.5,  1.1,  1.0)
    );

    addLaserPlane(
        positions, normals, texCoords, effects,
        vec3( 3.5, -1.2, -1.5),
        vec3( 3.5, -1.2 + w, -1.5),
        vec3(-0.5,  1.0 + w,  1.0),
        vec3(-0.5,  1.0,  1.0)
    );

    return {
        positions: new Float32Array(positions),
        normals: new Float32Array(normals),
        texCoords: new Float32Array(texCoords),
        effects: new Float32Array(effects),
        count: positions.length / 3
    };
}

function makeBufferObject(data) {
    var obj = {};

    obj.positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, obj.positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, data.positions, gl.STATIC_DRAW);

    obj.normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, obj.normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, data.normals, gl.STATIC_DRAW);

    obj.texBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, obj.texBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, data.texCoords, gl.STATIC_DRAW);

    obj.effectBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, obj.effectBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, data.effects, gl.STATIC_DRAW);

    obj.count = data.count;

    return obj;
}


// -------------------------------------------------------
// Main init
// -------------------------------------------------------

window.onload = function init() {
    canvas = document.getElementById("gl-canvas");

    gl = canvas.getContext('webgl2');
    if (!gl) {
        alert("WebGL 2.0 isn't available");
        return;
    }

    setup();

    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    positionLoc = gl.getAttribLocation(program, "aPosition");
    normalLoc = gl.getAttribLocation(program, "aNormal");
    texCoordLoc = gl.getAttribLocation(program, "aTexCoord");
    effectLoc = gl.getAttribLocation(program, "aEffectNumber");

    modelViewLoc = gl.getUniformLocation(program, "uModelViewMatrix");
    projectionLoc = gl.getUniformLocation(program, "uProjectionMatrix");
    normalMatrixLoc = gl.getUniformLocation(program, "uNormalMatrix");

    textureloc = gl.getUniformLocation(program, "uWebcamTexture");
    wallImageTextureLoc = gl.getUniformLocation(program, "uWallImageTexture");

    timeLoc = gl.getUniformLocation(program, "uTime");
    effectAmountLoc = gl.getUniformLocation(program, "uEffectAmount");
    wallModeLoc = gl.getUniformLocation(program, "uWallMode");

    setupWebcamTexture();
    setupWallImageTexture();

    diamond = makeBufferObject(makeDiamondData());
    room = makeBufferObject(makeRoomData());
    lasers = makeBufferObject(makeLaserData());

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.5, 0.5, 0.5, 1.0);

    gl.enable(gl.DEPTH_TEST);

    setupControls();

    render();
};

function setupWebcamTexture() {
    texture1 = gl.createTexture();

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture1);

    gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        400,
        400,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        null
    );

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    gl.uniform1i(textureloc, 0);
}

function setupWallImageTexture() {
    texture2 = gl.createTexture();

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, texture2);

    // temporary image texture until user uploads one
    var tempImage = new Uint8Array([
        130, 110, 90, 255,
        80, 70, 60, 255,
        170, 150, 130, 255,
        100, 90, 80, 255
    ]);

    gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        2,
        2,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        tempImage
    );

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    gl.uniform1i(wallImageTextureLoc, 1);

    document.getElementById("wallFile").onchange = function (event) {
        var file = event.target.files[0];

        if (!file) {
            return;
        }

        var reader = new FileReader();

        reader.onload = function (e) {
            var wallImage = new Image();

            wallImage.onload = function () {
                gl.activeTexture(gl.TEXTURE1);
                gl.bindTexture(gl.TEXTURE_2D, texture2);

                gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

                gl.texImage2D(
                    gl.TEXTURE_2D,
                    0,
                    gl.RGBA,
                    gl.RGBA,
                    gl.UNSIGNED_BYTE,
                    wallImage
                );

                // Uploaded images are safest with CLAMP_TO_EDGE and LINEAR.
                // This also matches the last version that used a local file chooser.
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

                wallMode = 4;
                document.getElementById("wallTextureSelect").value = "4";

                console.log("custom wall texture loaded");
            };

            wallImage.src = e.target.result;
        };

        reader.readAsDataURL(file);
    };
}

function setupControls() {
    document.getElementById("thetaSlider").oninput = function () {
        theta = Number(this.value);
    };

    document.getElementById("phiSlider").oninput = function () {
        phi = Number(this.value);
    };

    document.getElementById("distSlider").oninput = function () {
        radius = Number(this.value);
    };

    document.getElementById("effectSlider").oninput = function () {
        effectAmount = Number(this.value);
    };

    document.getElementById("wallTextureSelect").onchange = function () {
        wallMode = Number(this.value);
    };

    document.getElementById("spinSlider").oninput = function () {
        spinSpeed = Number(this.value);
    };

    document.getElementById("diamondXSlider").oninput = function () {
        diamondX = Number(this.value);
    };

    document.getElementById("diamondYSlider").oninput = function () {
        diamondY = Number(this.value);
    };

    document.getElementById("diamondZSlider").oninput = function () {
        diamondZ = Number(this.value);
    };

    document.getElementById("spinCheck").onchange = function () {
        spinOn = this.checked;
    };

    document.getElementById("lockdownButton").onclick = function () {
        lockdownOn = !lockdownOn;

        if (lockdownOn) {
            document.getElementById("lockdownButton").innerHTML = "Unlock";
            document.getElementById("lockdownButton").style.background = "#900";
        }
        else {
            document.getElementById("lockdownButton").innerHTML = "Lockdown";
            document.getElementById("lockdownButton").style.background = "#300";
        }
    };

    document.getElementById("resetButton").onclick = function () {
        theta = 25;
        phi = 15;
        radius = 5.2;
        effectAmount = 0.55;

        wallMode = 0;

        spinSpeed = 0.55;
        spinOn = true;

        diamondX = 0.0;
        diamondY = 0.0;
        diamondZ = 0.0;

        document.getElementById("thetaSlider").value = theta;
        document.getElementById("phiSlider").value = phi;
        document.getElementById("distSlider").value = radius;
        document.getElementById("effectSlider").value = effectAmount;

        document.getElementById("wallTextureSelect").value = wallMode;

        document.getElementById("spinSlider").value = spinSpeed;
        document.getElementById("spinCheck").checked = spinOn;

        document.getElementById("diamondXSlider").value = diamondX;
        document.getElementById("diamondYSlider").value = diamondY;
        document.getElementById("diamondZSlider").value = diamondZ;
    };
}

function updateWebcamTexture() {
    if (video && video.readyState >= 2) {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture1);

        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            video
        );
    }
}

function setAttributeBuffers(obj) {
    gl.bindBuffer(gl.ARRAY_BUFFER, obj.positionBuffer);
    gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLoc);

    gl.bindBuffer(gl.ARRAY_BUFFER, obj.normalBuffer);
    gl.vertexAttribPointer(normalLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(normalLoc);

    gl.bindBuffer(gl.ARRAY_BUFFER, obj.texBuffer);
    gl.vertexAttribPointer(texCoordLoc, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(texCoordLoc);

    gl.bindBuffer(gl.ARRAY_BUFFER, obj.effectBuffer);
    gl.vertexAttribPointer(effectLoc, 1, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(effectLoc);
}

function drawObject(obj, modelMatrix, viewMatrix, projectionMatrix) {
    var modelView = mult(viewMatrix, modelMatrix);
    var nMatrix = normalMatrix(modelView, true);

    gl.uniformMatrix4fv(modelViewLoc, false, flatten(modelView));
    gl.uniformMatrix4fv(projectionLoc, false, flatten(projectionMatrix));
    gl.uniformMatrix3fv(normalMatrixLoc, false, flatten(nMatrix));

    setAttributeBuffers(obj);

    gl.drawArrays(gl.TRIANGLES, 0, obj.count);
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    updateWebcamTexture();

    var now = (Date.now() - startTime) / 1000.0;

    if (spinOn) {
        spinAngle += spinSpeed;
    }

    var thetaRad = radians(theta);
    var phiRad = radians(phi);

    var eye = vec3(
        radius * Math.sin(thetaRad) * Math.cos(phiRad),
        radius * Math.sin(phiRad),
        radius * Math.cos(thetaRad) * Math.cos(phiRad)
    );

    var at = vec3(0.0, 0.0, 0.0);
    var up = vec3(0.0, 1.0, 0.0);

    var viewMatrix = lookAt(eye, at, up);
    var projectionMatrix = perspective(45.0, canvas.width / canvas.height, 0.1, 20.0);

    gl.uniform1f(timeLoc, now);
    gl.uniform1f(effectAmountLoc, effectAmount);
    gl.uniform1i(wallModeLoc, wallMode);

    drawObject(room, mat4(), viewMatrix, projectionMatrix);

    var diamondModel = mat4();
    diamondModel = mult(diamondModel, translate(diamondX, diamondY, diamondZ));
    diamondModel = mult(diamondModel, rotateY(spinAngle));
    diamondModel = mult(diamondModel, rotateX(-10));

    drawObject(diamond, diamondModel, viewMatrix, projectionMatrix);

    if (lockdownOn) {
        drawObject(lasers, mat4(), viewMatrix, projectionMatrix);
    }

    requestAnimationFrame(render);
}