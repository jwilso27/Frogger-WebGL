"use strict";

var canvas;
var gl;

var theta = 0.0;
var baseColorLoc;
var ctmLoc;
var ctm;
var tFrogx = 0.0;
var tFrogy = -0.4;
var tLogx = [ 0.0, -0.8, .3, -.3, .6, -.6 ];
var tLogy = [ 0.0, 0.0, .1, .1, .2, .2];
var tLogd = [ 0.0, 0.001, 0.005 ];
var tCarx = [0, .4, -.8, .9, .1, .6, -.4, -.9];
var tCary = [-.3, -.3, -.3, -.3, -.2, -.2, -.2, -.2];
var tCard = [ 0.0, 0.01 ];
var board = [];

var bufferId;

var vBGPos
var vLogPos;
var vCarPos;
var vPadPos;
var vPosition;

var samplerUniform;

var lives;
var currLevel = 1;
var logSpeed = .001;
var carSpeed = .001;
var images = [];
var textures = [];
var frogTheta = 0;

window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    //
    //  Configure WebGL
    //
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.9, 0.9, 0.9, 1.0 );

    //  Load shaders and initialize attribute buffers
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    var vertices = [
        vec2(-.5, .5 ),
        vec2(-.5, -.5 ),
        vec2( .5, -.5 ),
        vec2( .5, .5 )
    ];

    // Load the data into the GPU
    bufferId = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW );
    vPosition = gl.getAttribLocation( program, "vPosition" );

    var texCoordLocation = gl.getAttribLocation(program, "a_texCoord");

    samplerUniform = gl.getUniformLocation(program, "uSampler");

    // provide texture coordinates for the rectangle.
    var texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 1, 0, 0, 1, 0, 1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(texCoordLocation);
    gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);

    // Associate out shader variables with our data buffer
    baseColorLoc = gl.getUniformLocation( program, "baseColor" );
    ctmLoc = gl. getUniformLocation(program, "ctMatrix");

    var pmLoc = gl.getUniformLocation(program, "projMatrix");
    var pm = ortho(-1.0, 1.0, -.5, .5, -1.0, 1.0);
    gl.uniformMatrix4fv(pmLoc, false, flatten(pm));

    document.onkeydown = checkKey;

    lives = 5;

    initTexture("./Textures/frog.png");
    initTexture("./Textures/car1.png");
    initTexture("./Textures/log_medium.png");
    initTexture("./Textures/bush.png");
    initTexture("./Textures/car2.png");
    initTexture("./Textures/car3.png");
    initTexture("./Textures/blue.png");
    initTexture("./Textures/yellow.png");
    initTexture("./Textures/street.png");
    initTexture("./Textures/truck.png");
    initTexture("./Textures/safezone.png");
    initTexture("./Textures/pads.png");

    render();
}

function initTexture(url) {
    var texture = gl.createTexture();
    texture.image = new Image();
    texture.image.src = url;
    textures.push(texture);
}

function handleLoadedTexture(texture) {
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(samplerUniform, 0);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    // Set the parameters so we can render any size image.
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
}

function checkKey(e) {

    e = e || window.event;

    if (e.keyCode == 38 || e.keyCode == '38') {
        // up arrow
        if (tFrogy < .4) {
            tFrogy = tFrogy + .1;
        }
        frogTheta = 0;
    }
    else if (e.keyCode == 40 || e.keyCode == '40') {
        // down arrow
        if (tFrogy > -.4) {
            tFrogy = tFrogy - .1;
        }
        frogTheta = 180;
    }
    else if (e.keyCode == 37 || e.keyCode == '37') {
        // left arrow
        if (tFrogx > -.8) {
            tFrogx = tFrogx - .1;
        }
        frogTheta = 90;
    }
    else if (e.keyCode == 39 || e.keyCode == '39') {
        // right arrow
        if (tFrogx < .8) {
            tFrogx = tFrogx + .1;
        }
        frogTheta = 270;

    }

    checkMovement();
}

function checkMovement() {
    var x = Math.round((tFrogx)*10) + 9;
    var y = Math.round((tFrogy)*10) + 4;
    if((board[y][x] == 0)) death();
    else if(board[y][x] == 2) levelUp();
}

function death() {
    lives = lives - 1;
    tFrogx = 0;
    tFrogy = -0.4;
}

function levelUp() {
    alert("You beat level " + currLevel);
    currLevel++;
    logSpeed = logSpeed + .005;
    carSpeed = carSpeed + .005;
    tFrogx = 0;
    tFrogy = -0.4;
}

function initBoard() {
    for( var i=0; i<9; i++ ) {
        board[i] = [];
        switch(i) {
            case 0:
            case 3:
            case 1:
            case 2:
                for( var j=0; j<19; j++ ) board[i][j] = 1;
                break;
            case 7:
                for( var j=0; j<19; j++ ) 
                    if( j%2 ) board[i][j] = 2;
                    else board[i][j] = 0;
                break;
            default:
                for( var j=0; j<19; j++ ) board[i][j] = 0;
        }
    }
}

function drawFrog() {

    var tm, sm, rm, scaling_l;
   
    // draw frog
    handleLoadedTexture(textures[0]);
    gl.enableVertexAttribArray( vPosition );
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );

    // move frog with logs
    var x = Math.round((tFrogx)*10) + 9;
    var y = Math.round((tFrogy)*10);
    if( x > 19 ) death();
    else if( (y <= 3) && (y >= 0) ) tFrogx = tFrogx + tLogd[y] + logSpeed;
    else checkMovement();

    scaling_l = .05;
    rm = rotateZ(frogTheta);
    sm = scalem(scaling_l, scaling_l, scaling_l);
    tm = translate(tFrogx, tFrogy, 0.0);

    ctm = mat4();
    ctm = mult(rm, ctm);
    ctm = mult(sm, ctm);
    ctm = mult(tm, ctm);

    gl.uniform3fv( baseColorLoc, vec3( 0.2, 1.0, 0.2 ) );
    gl.uniformMatrix4fv(ctmLoc, false, flatten(ctm));

    gl.drawArrays( gl.TRIANGLE_FAN, 0, 4 );

}

function drawCars() {

    var tm, sm, rm, scale_x, scale_y, scale_z;
    
    //draw cars
    gl.enableVertexAttribArray( vPosition );
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
    gl.vertexAttribPointer( vCarPos, 2, gl.FLOAT, false, 0, 0 );

    //console.log("cars");
    for(var i=0; i < 8; i++) {
        if(i%4==0) handleLoadedTexture(textures[1]);    
        else if(i%4==1) handleLoadedTexture(textures[4]);
        else if(i%4==2) handleLoadedTexture(textures[5]);
        else handleLoadedTexture(textures[9]);
        
        tCarx[i] = tCarx[i] + tCard[Math.trunc(i/4)] + carSpeed;
        if (tCarx[i] > 1.5) tCarx[i] = tCarx[i] - 2.5;

        var x = Math.trunc((tCarx[i])*10) + 9;
        var y = Math.trunc((tCary[i])*10) + 4;
        if( (y >= 0) && (y < 9) && (x >= 0) && (x < 19) )
            board[y][x] = 0;

        scale_x = .15;
        scale_y = .075;
        scale_z = .1;
        sm = scalem(scale_x, scale_y, scale_z);
        tm = translate(tCarx[i], tCary[i], 0.0);

        ctm = mat4();
        ctm = mult(sm, ctm);
        ctm = mult(tm, ctm);

        gl.uniform3fv( baseColorLoc, vec3( 1.0, .2, 0.2 ) );
        gl.uniformMatrix4fv(ctmLoc, false, flatten(ctm));

        gl.drawArrays( gl.TRIANGLE_FAN, 0, 4 );
    }

}

function drawLogs() {

    var tm, sm, rm, scale_x, scale_y, scale_z;

    //draw logs
    handleLoadedTexture(textures[2]);
    gl.enableVertexAttribArray( vPosition );
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
    gl.vertexAttribPointer(vLogPos, 2, gl.FLOAT, false, 0, 0);
    
    for(var i = 0; i < 6; i++) {
        tLogx[i] = tLogx[i] + tLogd[Math.trunc(i/2)] + logSpeed;
        if(tLogx[i] > 1.5) tLogx[i] = tLogx[i] - 3;

        var x = Math.trunc((tLogx[i])*10) + 9;
        var y = Math.trunc((tLogy[i])*10) + 4;
        if( (tLogx[i])%1 < .05 ) x = x - 1;
        for( var j = x-1; j <= x+2; j++ )
            if( (y >= 0) && (y < 9) && (j >= 0) && (j < 19) )
                board[y][j] = 1;
    }

    for(var i=0; i < 6; i++) {
        scale_x = .4;
        scale_y = .075;
        scale_z = .1;
        sm = scalem(scale_x, scale_y, scale_z);
        tm = translate(tLogx[i], tLogy[i], 0.0);

        ctm = mat4();
        ctm = mult(sm, ctm);
        ctm = mult(tm, ctm);

        gl.uniform3fv( baseColorLoc, vec3( .8, .5, 0.0 ) );
        gl.uniformMatrix4fv(ctmLoc, false, flatten(ctm));
        gl.drawArrays( gl.TRIANGLE_FAN, 0, 4); 
    }

}

function drawPads() {
    var tm, sm, rm, scale_x, scale_y, scale_z;

    handleLoadedTexture(textures[11]);
    scale_x = .075;
    scale_y = .075;
    scale_z = 1;
    rm = rotateZ(theta);
    sm = scalem(scale_x, scale_y, scale_z);
    for(var i=1; i<10; i++) {
        tm = translate( i*.2-1, .3, 0 );

        ctm = mat4();
        ctm = mult(rm, ctm);
        ctm = mult(sm, ctm);
        ctm = mult(tm, ctm);

        gl.uniformMatrix4fv(ctmLoc, false, flatten(ctm));
        gl.drawArrays(gl.TRIANGLE_FAN, 0, 4); 
    }
}

function drawBG() {
    var tm, sm, rm, scale_x, scale_y, scale_z;

    gl.enableVertexAttribArray( vPosition );
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
    gl.vertexAttribPointer(vBGPos, 2, gl.FLOAT, false, 0, 0);

    // draw water
    handleLoadedTexture(textures[6]);
    scale_x = 2;
    scale_y = .5;
    scale_z = 1;
    rm = rotateZ(theta);
    sm = scalem(scale_x, scale_y, scale_z);
    tm = translate( 0, .2, 0 );

    ctm = mat4();
    ctm = mult(rm, ctm);
    ctm = mult(sm, ctm);
    ctm = mult(tm, ctm);

    gl.uniformMatrix4fv(ctmLoc, false, flatten(ctm));
    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4); 
    
    // draw street
    handleLoadedTexture(textures[8]);
    scale_x = 2;
    scale_y = .2;
    scale_z = 1;
    rm = rotateZ(theta);
    sm = scalem(scale_x, scale_y, scale_z);
    tm = translate( 0, -.25, 0 );

    ctm = mat4();
    ctm = mult(rm, ctm);
    ctm = mult(sm, ctm);
    ctm = mult(tm, ctm);

    gl.uniformMatrix4fv(ctmLoc, false, flatten(ctm));
    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4); 
    
    // draw street lines
    handleLoadedTexture(textures[7]);
    scale_x = 2;
    scale_y = .01;
    scale_z = 1;
    rm = rotateZ(theta);
    sm = scalem(scale_x, scale_y, scale_z);

    for( var i=-.35; i<-.1; i+=.1 ){
        tm = translate( 0, i, 0 );

        ctm = mat4();
        ctm = mult(rm, ctm);
        ctm = mult(sm, ctm);
        ctm = mult(tm, ctm);

        gl.uniformMatrix4fv(ctmLoc, false, flatten(ctm));
        gl.drawArrays(gl.TRIANGLE_FAN, 0, 4); 
    }
    
    // draw bush
    handleLoadedTexture(textures[3]);
    scale_x = .1;
    scale_y = .1;
    scale_z = 1;
    rm = rotateZ(theta);
    sm = scalem(scale_x, scale_y, scale_z);
    for(var i=0; i<22; i++) {
        tm = translate( i*.1-1, .4, 0 );

        ctm = mat4();
        ctm = mult(rm, ctm);
        ctm = mult(sm, ctm);
        ctm = mult(tm, ctm);

        gl.uniformMatrix4fv(ctmLoc, false, flatten(ctm));
        gl.drawArrays(gl.TRIANGLE_FAN, 0, 4); 
    }

    for(var i=0; i<22; i++) {
        tm = translate( i*.1-1, .5, 0 );

        ctm = mat4();
        ctm = mult(rm, ctm);
        ctm = mult(sm, ctm);
        ctm = mult(tm, ctm);

        gl.uniformMatrix4fv(ctmLoc, false, flatten(ctm));
        gl.drawArrays(gl.TRIANGLE_FAN, 0, 4); 
    }

    for( var i=0; i < board[7].length; i+=2 ) {
        tm = translate( (i-9)/10, .3, 0 );

        ctm = mat4();
        ctm = mult(rm, ctm);
        ctm = mult(sm, ctm);
        ctm = mult(tm, ctm);

        gl.uniformMatrix4fv(ctmLoc, false, flatten(ctm));
        gl.drawArrays( gl.TRIANGLE_FAN, 0, 4); 
    }


    //draw safezone
    handleLoadedTexture(textures[10]);
    for(var i=0; i<22; i++) {
        tm = translate( i*.1-1, -.1, 0 );

        ctm = mat4();
        ctm = mult(rm, ctm);
        ctm = mult(sm, ctm);
        ctm = mult(tm, ctm);

        gl.uniformMatrix4fv(ctmLoc, false, flatten(ctm));
        gl.drawArrays(gl.TRIANGLE_FAN, 0, 4); 
    }

    for(var i=0; i<22; i++) {
        tm = translate( i*.1-1, -.4, 0 );

        ctm = mat4();
        ctm = mult(rm, ctm);
        ctm = mult(sm, ctm);
        ctm = mult(tm, ctm);

        gl.uniformMatrix4fv(ctmLoc, false, flatten(ctm));
        gl.drawArrays(gl.TRIANGLE_FAN, 0, 4); 
    }

    for(var i=0; i<22; i++) {
        tm = translate( i*.1-1, -.5, 0 );

        ctm = mat4();
        ctm = mult(rm, ctm);
        ctm = mult(sm, ctm);
        ctm = mult(tm, ctm);

        gl.uniformMatrix4fv(ctmLoc, false, flatten(ctm));
        gl.drawArrays(gl.TRIANGLE_FAN, 0, 4); 
    }
}

function print() {
    document.getElementById('printLives').innerHTML = 'Lives: ' + lives.toString();
    document.getElementById('printLevel').innerHTML = 'Level: ' + currLevel.toString();
}

function render() {

    initBoard();

    gl.clear( gl.COLOR_BUFFER_BIT );
    // Turn off rendering to alpha
    
    drawBG();
    drawPads();
    drawLogs();
    drawCars();
    drawFrog();
    print();

    if(lives > 0) window.requestAnimFrame(render);
    else alert("Game Over (Refresh the page to play again!)");
}
