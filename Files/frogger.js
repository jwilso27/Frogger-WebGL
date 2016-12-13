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
var tLogy = [ -0.02 , -0.02, .07, .07, .15, .15];
var tCarx = [0, .4, -.8, .9];
var tCary = -.35;
var recVert = [
        vec2( 0,  .05 ),
        vec2( .2,  .05 ),
        vec2( .2, 0),
        vec2( 0,  0 ),
    ];
var carVert = [
        vec2( .2, 0),
        vec2( 0,  0 ),
        vec2( 0,  .2 ),
        vec2( .2,  .2 ),
    ];
var bufferId;
var logBuff;
var carBuff;
var vLogPos;
var vCarPos;
var vPosition;

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
        vec2(  0,  1 ),
        vec2(  1,  0 ),
        vec2( -1,  0 ),
        vec2(  0, -1 )
    ];
    
    // Load the data into the GPU
    bufferId = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW );
    vPosition = gl.getAttribLocation( program, "vPosition" );

    logBuff = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, logBuff );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(recVert), gl.STATIC_DRAW );
    vLogPos = gl.getAttribLocation(program, "vPosition");
    // Associate out shader variables with our data buffer
    
    carBuff = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, carBuff );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(carVert), gl.STATIC_DRAW );
    vCarPos = gl.getAttribLocation(program, "vPosition");

    baseColorLoc = gl.getUniformLocation( program, "baseColor" );
    ctmLoc = gl. getUniformLocation(program, "ctMatrix");

    var pmLoc = gl.getUniformLocation(program, "projMatrix");
    var pm = ortho(-1.0, 1.0, -.5, .5, -1.0, 1.0);
    gl.uniformMatrix4fv(pmLoc, false, flatten(pm));

    document.onkeydown = checkKey;

    render();
};

function checkKey(e) {

    e = e || window.event;

    if (e.keyCode == '38') {
        // up arrow
        if (tFrogy < .4) {
            tFrogy = tFrogy + .1;
        }
    }
    else if (e.keyCode == '40') {
        // down arrow
        if (tFrogy > -.4) {
            tFrogy = tFrogy - .1;
        }
        
    }
    else if (e.keyCode == '37') {
       // left arrow
       if (tFrogx > -.8) {
            tFrogx = tFrogx - .1;
       }
       
    }
    else if (e.keyCode == '39') {
       // right arrow
       if (tFrogx < .8) {
            tFrogx = tFrogx + .1;
       }
       
    }

}

function render() {
    
    gl.clear( gl.COLOR_BUFFER_BIT );
    
    var tm, sm, rm, scaling_l, scaling_s;
    gl.enableVertexAttribArray( vLogPos );
    gl.bindBuffer(gl.ARRAY_BUFFER, logBuff);
    gl.vertexAttribPointer(vLogPos, 2, gl.FLOAT, false, 0, 0);


    //draw logs
    for(var i = 0; i < 6; i++) {
        if(tLogy[i] == .07) {
            tLogx[i] = tLogx[i] + .01;
        }
        tLogx[i] = tLogx[i] + .01;
        if(tLogx[i] > 1) {
            tLogx[i] = tLogx[i] - 3;
         }  
    }

    for(var i=0; i < 6; i++) {
        tm = translate(tLogx[i], tLogy[i], 0.0);
        rm = rotateZ(0);
        scaling_l = 1.2;
        sm = scalem(scaling_l, scaling_l, scaling_l);
        ctm = mat4();
        ctm = mult(rm, ctm);
        ctm = mult(sm, ctm);
        ctm = mult(tm, ctm);

        gl.uniform3fv( baseColorLoc, vec3( .4, .18, 0.0 ) );
        gl.uniformMatrix4fv(ctmLoc, false, flatten(ctm));
        gl.drawArrays( gl.TRIANGLE_FAN, 0, 4); 
    }


    //draw cars

    gl.enableVertexAttribArray( vCarPos );
    gl.bindBuffer(gl.ARRAY_BUFFER, carBuff);
    gl.vertexAttribPointer( vCarPos, 2, gl.FLOAT, false, 0, 0 );
    
    for(var i=0; i < 4; i++) {
        tCarx[i] = tCarx[i] + .015;
        if (tCarx[i] > 1) {
            tCarx[i] = tCarx[i] - 2.5;
        }
        theta = 0.0; // in degree
        scaling_l = .4;
        scaling_s = 0.0125;
        rm = rotateZ(theta);
        sm = scalem(scaling_l, scaling_l, scaling_l);
        tm = translate(tCarx[i], tCary, 0.0);

        ctm = mat4();
        ctm = mult(rm, ctm);
        ctm = mult(sm, ctm);
        ctm = mult(tm, ctm);
        
        // orthogonal projection
        
        gl.uniform3fv( baseColorLoc, vec3( 1.0, .2, 0.2 ) );
        gl.uniformMatrix4fv(ctmLoc, false, flatten(ctm));

        gl.drawArrays( gl.TRIANGLE_FAN, 0, 4 );
    }

    gl.enableVertexAttribArray( vPosition );
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    
    
    theta = 45.0; // in degree
    scaling_l = .05;
    scaling_s = 0.0125;
    rm = rotateZ(theta);
    sm = scalem(scaling_l, scaling_l, scaling_l);
    tm = translate(tFrogx, tFrogy, 0.0);

    ctm = mat4();
    ctm = mult(rm, ctm);
    ctm = mult(sm, ctm);
    ctm = mult(tm, ctm);
    
    // orthogonal projection
    
    gl.uniform3fv( baseColorLoc, vec3( 0.2, 1.0, 0.2 ) );
    gl.uniformMatrix4fv(ctmLoc, false, flatten(ctm));

    gl.drawArrays( gl.TRIANGLE_STRIP, 0, 4 );


    window.requestAnimFrame(render);
}
