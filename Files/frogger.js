"use strict";

var canvas;
var gl;

var theta = 0.0;
var baseColorLoc;
var ctmLoc;
var ctm;
var tFrogx = 0.0;
var tFrogy = -.9;
var tLogx = 0.0;
var tLogy = 0.0;
var recVert = [
        vec2(  0,  .1 ),
        vec2(  .4,  .1 ),
        vec2(.4, 0),
        vec2( 0,  0 ),
    ];
var bufferId;
var logBuff;
var vLogPos;
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
    
    
    baseColorLoc = gl.getUniformLocation( program, "baseColor" );
    ctmLoc = gl. getUniformLocation(program, "ctMatrix");

    var pmLoc = gl.getUniformLocation(program, "projMatrix");
    var pm = ortho(-1.0, 1.0, -1.0, 1.0, -1.0, 1.0);
    gl.uniformMatrix4fv(pmLoc, false, flatten(pm));

    document.onkeydown = checkKey;

    render();
};

function checkKey(e) {

    e = e || window.event;

    if (e.keyCode == '38') {
        // up arrow
        if (tFrogy < .9) {
            tFrogy = tFrogy + .2;
        }
    }
    else if (e.keyCode == '40') {
        // down arrow
        if (tFrogy > -.7) {
            tFrogy = tFrogy - .2;
        }
        
    }
    else if (e.keyCode == '37') {
       // left arrow
       if (tFrogx > -.7) {
            tFrogx = tFrogx - .2;
       }
       
    }
    else if (e.keyCode == '39') {
       // right arrow
       if (tFrogx < .7) {
            tFrogx = tFrogx + .2;
       }
       
    }

}

function render() {
    
    gl.clear( gl.COLOR_BUFFER_BIT );
    
    gl.enableVertexAttribArray( vPosition );
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    
    
    theta = 45.0; // in degree
    var scaling_l = 0.1;
    var scaling_s = 0.025;
    var rm = rotateZ(theta);
    var sm = scalem(scaling_l, scaling_l, scaling_l);
    var tm = translate(tFrogx, tFrogy, 0.0);

    ctm = mat4();
    ctm = mult(rm, ctm);
    ctm = mult(sm, ctm);
    ctm = mult(tm, ctm);
    
    // orthogonal projection
    
    gl.uniform3fv( baseColorLoc, vec3( 0.2, 1.0, 0.2 ) );
    gl.uniformMatrix4fv(ctmLoc, false, flatten(ctm));

    gl.drawArrays( gl.TRIANGLE_STRIP, 0, 4 );

    gl.enableVertexAttribArray( vLogPos );
    gl.bindBuffer(gl.ARRAY_BUFFER, logBuff);
    gl.vertexAttribPointer(vLogPos, 2, gl.FLOAT, false, 0, 0);


    //draw logs

    tLogx = tLogx + .01;
    if(tLogx > 1) {
        tLogx = tLogx - 2;
    }
    tm = translate(tLogx, tLogy, 0.0);
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

    window.requestAnimFrame(render);
}
