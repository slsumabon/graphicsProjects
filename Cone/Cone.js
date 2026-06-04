"use strict";			// Enforce typing in javascript

var canvas;			    // Drawing surface 
var gl;				    // Graphics context


var theta = [0, 0, 0];	// Rotation angles for x, y and z axes

var rotSpeed = 0.008;
var axis = 1;			// Currently active axis of rotation
var xAxis = 0;			//  index into theta to indicate rotation angle around X
var yAxis = 1;			//  index into theta to indicate rotation angle around Y
var zAxis = 2;          //  index into theta to indicate rotation angle around Z
var flag = false;       // Rotation Toggle control

var thetaLoc;			// Holds shader uniform variable location
var cBuffer;
var vBuffer;
var colorLoc;

   // DEFINE CONE VERTICES- MODIFY THE CODE HERE
    var points = new Float32Array ( [
        0.0,  0.75 ,  0.0,
        0.65,  0.0,  0.0,
        0.45,  0.0,  0.45,
        0.0,  0.0,  0.65,
        -0.45,  0.0,  0.45,
        -0.65,  0.0,  0.0,
        -0.45,  0.0, -0.45,
        0.0,  0.0, -0.65,
        0.45,  0.0, -0.45,
        0.65,  0.0,  0.0  
    ]);



    // DEFINE CONE COLOR ATTRIBUTES - MODIFY THE CODE HERE
    var colors = new Float32Array ( [
        1.0, 0.0, 0.5, 1.0,
        0.0, 0.0, 0.6, 1.0,
        0.0, 0.0, 0.6, 1.0,
        0.0, 0.0, 0.6, 1.0,
        0.0, 0.0, 0.6, 1.0,
        0.0, 0.0, 0.6, 1.0,
        0.2, 0.7, 0.7, 1.0,
        0.3, 0.8, 0.8, 1.0,
        0.4, 0.9, 0.9, 1.0,
        0.5, 1.0, .5, 1.0
    ]);




window.onload = function init()
{
    canvas = document.getElementById("gl-canvas");

    gl = canvas.getContext('webgl2');
    if (!gl) alert("WebGL 2.0 isn't available");
   
    //
    //  Load shaders and initialize attribute buffers
    //
    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    // Load points into vertex array attribute buffer
    vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, points, gl.STATIC_DRAW);

    var positionLoc = gl.getAttribLocation( program, "aPosition");
    gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLoc );

    // Load colors into color array atrribute buffer
    cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);

    colorLoc = gl.getAttribLocation(program, "aColor");
    gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(colorLoc);

    thetaLoc = gl.getUniformLocation(program, "uTheta");

    //event listeners for buttons

    document.getElementById( "xButton" ).onclick = function () {
        axis = xAxis;
    };
    document.getElementById( "yButton" ).onclick = function () {
        axis = yAxis;
    };
    document.getElementById( "zButton" ).onclick = function () {
        axis = zAxis;
    };
    document.getElementById("ButtonT").onclick = function(){flag = !flag;};
    document.getElementById("Button0").onclick = function(){
        theta[xAxis] = 0;
        theta[yAxis] = 0;
        theta[zAxis] = 0;
        axis = yAxis;
    };

    gl.enable(gl.DEPTH_TEST);
    gl.clearColor( 1.0, 1.0, 0.0, 1.0);

    render();
}

function render()
{
    gl.clearColor( 0.5, 0.5, 0.5, 1.0);
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Controls
    if(flag) {
        theta[axis] += rotSpeed;
        gl.uniform3fv(thetaLoc, theta);
    }

    // DRAW CONE - MODIFY THE CODE HERE
    //gl.drawArrays(gl.TRIANGLES, 0, points.length/3);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, points.length / 3);


    gl.drawArrays(gl.TRIANGLE_FAN, 1, points.length / 3);


    requestAnimationFrame(render);	// Call to browser to refresh display
}