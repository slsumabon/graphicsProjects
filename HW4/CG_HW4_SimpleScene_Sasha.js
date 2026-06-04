var gl;
var program;
var canvas;

var aPosition;
var uModelMatrix;
var uColor;

var circleBuffer;
var rectBuffer;
var semiCircleBuffer;

var leftBrow = 0.0;
var rightBrow = 0.0;
var mouthSize = 0.36;

var faceX = 0.0;
var faceY = 0.0;

var leftEyeHeight = 0.14;
var rightEyeHeight = 0.14;

var numCirclePoints;
var numSemiCirclePoints;

// EXECUTION: Code executes starting here when we launch this file
window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );

    //
    //   Grab the section of the screen for drawing.
    //   All graphic output is within the canvas
    //
    
    gl = canvas.getContext('webgl2');
    if (!gl) { alert( "WebGL 2.0 isn't available" ); }

    ////////////////////////////////////////////////////////////////////////////////  
    //  Setup Event Handlers
    //
    document.getElementById("leftBrowSlider").oninput = function(event) {
        leftBrow = parseFloat(event.target.value);
        render();
    };

    document.getElementById("rightBrowSlider").oninput = function(event) {
        rightBrow = parseFloat(event.target.value);
        render();
    };

    document.getElementById("mouthSlider").oninput = function(event) {
        mouthSize = parseFloat(event.target.value);
        render();
    };

    document.getElementById("blinkButton").onclick = function() {
        leftEyeHeight = 0.02;
        rightEyeHeight = 0.02;
        render();

        setTimeout(function() {
            leftEyeHeight = 0.14;
            rightEyeHeight = 0.14;
            render();
        }, 220);
    };

    document.getElementById("winkButton").onclick = function() {
        leftEyeHeight = 0.02;
        rightEyeHeight = 0.14;
        render();

        setTimeout(function() {
            leftEyeHeight = 0.14;
            rightEyeHeight = 0.14;
            render();
        }, 220);
    };

    document.addEventListener("keydown", function(event) {
        if(event.key == "ArrowLeft")  faceX -= 0.05;
        if(event.key == "ArrowRight") faceX += 0.05;
        if(event.key == "ArrowUp")    faceY += 0.05;
        if(event.key == "ArrowDown")  faceY -= 0.05;
        render();
    });

    ////////////////////////////////////////////////////////////////////////////////  
    //  Load shaders and initialize attribute buffers
    //
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    aPosition = gl.getAttribLocation( program, "aPosition" );
    uModelMatrix = gl.getUniformLocation( program, "uModelMatrix" );
    uColor = gl.getUniformLocation( program, "uColor" );

    ////////////////////////////////////////////////////////////////////////////////   
    // Define shapes
    //
    var rectPoints = new Float32Array([
        -0.5, -0.5,
         0.5, -0.5,
         0.5,  0.5,
        -0.5, -0.5,
         0.5,  0.5,
        -0.5,  0.5
    ]);

    var circlePoints = [];
    var n = 60;
    for(var i = 0; i < n; i++) {
        var t1 = 2.0 * Math.PI * i / n;
        var t2 = 2.0 * Math.PI * (i + 1) / n;

        circlePoints.push(0.0);
        circlePoints.push(0.0);
        circlePoints.push(0.5 * Math.cos(t1));
        circlePoints.push(0.5 * Math.sin(t1));
        circlePoints.push(0.5 * Math.cos(t2));
        circlePoints.push(0.5 * Math.sin(t2));
    }
    numCirclePoints = circlePoints.length / 2;

    var semiCirclePoints = [];
    for(var i = 0; i < n; i++) {
        var t1 = Math.PI * i / n;
        var t2 = Math.PI * (i + 1) / n;

        semiCirclePoints.push(0.0);
        semiCirclePoints.push(0.0);
        semiCirclePoints.push(0.5 * Math.cos(t1));
        semiCirclePoints.push(0.5 * Math.sin(t1));
        semiCirclePoints.push(0.5 * Math.cos(t2));
        semiCirclePoints.push(0.5 * Math.sin(t2));
    }
    numSemiCirclePoints = semiCirclePoints.length / 2;

    ////////////////////////////////////////////////////////////////////////////////   
    // Load the data into the GPU Buffers
    //
    rectBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, rectBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, rectPoints, gl.STATIC_DRAW );

    circleBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, circleBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, new Float32Array(circlePoints), gl.STATIC_DRAW );

    semiCircleBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, semiCircleBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, new Float32Array(semiCirclePoints), gl.STATIC_DRAW );

    // Associate out shader variables with our data buffer
    gl.enableVertexAttribArray( aPosition );

    ////////////////////////////////////////////////////////////////////////////////
    // Configure WebGL settings and draw
    //
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.0, 0.0, 0.0, 1.0 );

    render();
};

function render()
{
    gl.clear( gl.COLOR_BUFFER_BIT );

    var baseMatrix = translate(faceX, faceY);

    // face
    gl.bindBuffer( gl.ARRAY_BUFFER, circleBuffer );
    gl.vertexAttribPointer( aPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.uniformMatrix3fv( uModelMatrix, false, flatten(mult(baseMatrix, scale2D(0.90, 0.90))) );
    gl.uniform4fv( uColor, [1.0, 0.85, 0.2, 1.0] );
    gl.drawArrays( gl.TRIANGLES, 0, numCirclePoints );

    // left eye
    gl.bindBuffer( gl.ARRAY_BUFFER, circleBuffer );
    gl.vertexAttribPointer( aPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.uniformMatrix3fv( uModelMatrix, false, flatten(mult(baseMatrix, mult(translate(-0.22, 0.12), scale2D(0.10, leftEyeHeight)))) );
    gl.uniform4fv( uColor, [0.0, 0.0, 0.0, 1.0] );
    gl.drawArrays( gl.TRIANGLES, 0, numCirclePoints );

    // right eye
    gl.uniformMatrix3fv( uModelMatrix, false, flatten(mult(baseMatrix, mult(translate(0.22, 0.12), scale2D(0.10, rightEyeHeight)))) );
    gl.uniform4fv( uColor, [0.0, 0.0, 0.0, 1.0] );
    gl.drawArrays( gl.TRIANGLES, 0, numCirclePoints );

    // mouth
    gl.bindBuffer( gl.ARRAY_BUFFER, semiCircleBuffer );
    gl.vertexAttribPointer( aPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.uniformMatrix3fv( uModelMatrix, false, flatten(mult(baseMatrix, mult(translate(0.0, -0.22), scale2D(mouthSize, 0.18)))) );
    gl.uniform4fv( uColor, [0.55, 0.0, 0.0, 1.0] );
    gl.drawArrays( gl.TRIANGLES, 0, numSemiCirclePoints );

    // left eyebrow
    gl.bindBuffer( gl.ARRAY_BUFFER, rectBuffer );
    gl.vertexAttribPointer( aPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.uniformMatrix3fv( uModelMatrix, false, flatten(mult(baseMatrix, mult(translate(-0.22, 0.24), mult(rotate2D(leftBrow), scale2D(0.22, 0.05)))) ) );
    gl.uniform4fv( uColor, [0.20, 0.10, 0.00, 1.0] );
    gl.drawArrays( gl.TRIANGLES, 0, 6 );

    // right eyebrow
    gl.uniformMatrix3fv( uModelMatrix, false, flatten(mult(baseMatrix, mult(translate(0.22, 0.24), mult(rotate2D(rightBrow), scale2D(0.22, 0.05)))) ) );
    gl.uniform4fv( uColor, [0.20, 0.10, 0.00, 1.0] );
    gl.drawArrays( gl.TRIANGLES, 0, 6 );

    // left blush
    gl.bindBuffer( gl.ARRAY_BUFFER, circleBuffer );
    gl.vertexAttribPointer( aPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.uniformMatrix3fv( uModelMatrix, false, flatten(mult(baseMatrix, mult(translate(-0.34, -0.08), scale2D(0.10, 0.06)))) );
    gl.uniform4fv( uColor, [1.0, 0.55, 0.70, 1.0] );
    gl.drawArrays( gl.TRIANGLES, 0, numCirclePoints );

    // right blush
    gl.uniformMatrix3fv( uModelMatrix, false, flatten(mult(baseMatrix, mult(translate(0.34, -0.08), scale2D(0.10, 0.06)))) );
    gl.uniform4fv( uColor, [1.0, 0.55, 0.70, 1.0] );
    gl.drawArrays( gl.TRIANGLES, 0, numCirclePoints );
}

function rotate2D(theta)
{
    var c = Math.cos( radians(theta) );
    var s = Math.sin( radians(theta) );

    return mat3(
        c, -s, 0.0,
        s,  c, 0.0,
        0.0, 0.0, 1.0
    );
}

function scale2D(sx, sy)
{
    return mat3(
        sx, 0.0, 0.0,
        0.0, sy, 0.0,
        0.0, 0.0, 1.0
    );
}