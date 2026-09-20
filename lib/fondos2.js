/* ===========================================================================
   Fondos 2 · ocho motores para la cabecera.
   Todos llevan grano de pelicula: un degradado matematicamente liso es lo que
   hace que un fondo parezca barato. El grano es lo que lo convierte en
   superficie.
   Uso: Fondo2('malla', elemento)
   =========================================================================== */
(function (global) {
  'use strict';

  var NL = String.fromCharCode(10);
  var QUIETO = global.matchMedia &&
    global.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* --- ruido simplex 3D (Ashima) + utilidades compartidas --------------- */
  var COMUN = [
    'precision highp float;',
    'uniform float u_t; uniform vec2 u_r;',
    'uniform vec3 c0; uniform vec3 c1; uniform vec3 c2; uniform vec3 c3;',
    'vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}',
    'vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}',
    'vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}',
    'vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}',
    'float snoise(vec3 v){',
    '  const vec2 C=vec2(1.0/6.0,1.0/3.0); const vec4 D=vec4(0.0,0.5,1.0,2.0);',
    '  vec3 i=floor(v+dot(v,C.yyy)); vec3 x0=v-i+dot(i,C.xxx);',
    '  vec3 g=step(x0.yzx,x0.xyz); vec3 l=1.0-g;',
    '  vec3 i1=min(g.xyz,l.zxy); vec3 i2=max(g.xyz,l.zxy);',
    '  vec3 x1=x0-i1+C.xxx; vec3 x2=x0-i2+C.yyy; vec3 x3=x0-D.yyy;',
    '  i=mod289(i);',
    '  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))',
    '        +i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));',
    '  float n_=0.142857142857; vec3 ns=n_*D.wyz-D.xzx;',
    '  vec4 j=p-49.0*floor(p*ns.z*ns.z);',
    '  vec4 x_=floor(j*ns.z); vec4 y_=floor(j-7.0*x_);',
    '  vec4 x=x_*ns.x+ns.yyyy; vec4 y=y_*ns.x+ns.yyyy;',
    '  vec4 h=1.0-abs(x)-abs(y);',
    '  vec4 b0=vec4(x.xy,y.xy); vec4 b1=vec4(x.zw,y.zw);',
    '  vec4 s0=floor(b0)*2.0+1.0; vec4 s1=floor(b1)*2.0+1.0;',
    '  vec4 sh=-step(h,vec4(0.0));',
    '  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy; vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;',
    '  vec3 p0=vec3(a0.xy,h.x); vec3 p1=vec3(a0.zw,h.y);',
    '  vec3 p2=vec3(a1.xy,h.z); vec3 p3=vec3(a1.zw,h.w);',
    '  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));',
    '  p0*=norm.x; p1*=norm.y; p2*=norm.z; p3*=norm.w;',
    '  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);',
    '  m=m*m;',
    '  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));',
    '}',
    'float fbm(vec3 p){float a=0.5,s=0.0;',
    '  for(int i=0;i<5;i++){s+=a*snoise(p);p*=2.02;a*=0.5;} return s;}',
    'float grano(vec2 q,float s){',
    '  return fract(sin(dot(q+s,vec2(12.9898,78.233)))*43758.5453);}',
    'vec2 centro(){return (gl_FragCoord.xy-0.5*u_r)/u_r.y;}',
    'float techo(){return smoothstep(0.86,1.0,gl_FragCoord.y/u_r.y);}'
  ].join(NL);

  /* --- los ocho fragmentos ---------------------------------------------- */
  var CUERPO = {};

  /* 1 · Grano y luz. Dos focos enormes y muy difusos sobre casi negro. */
  CUERPO.luz = [
    'void main(){',
    '  vec2 p=centro(); float t=u_t*0.05;',
    '  float w=fbm(vec3(p*1.3,t*0.6))*0.28;',
    '  vec2 a=vec2(sin(t*0.9)*0.38,cos(t*0.7)*0.24);',
    '  vec2 b=vec2(cos(t*0.5)*0.55+0.30,sin(t*0.6)*0.32-0.18);',
    '  vec2 e=vec2(sin(t*0.33+1.7)*0.75-0.35,cos(t*0.41+0.6)*0.40+0.30);',
    '  float d1=1.0-smoothstep(0.05,0.68,length(p-a)+w);',
    '  float d2=1.0-smoothstep(0.05,0.82,length(p-b)-w);',
    '  float d3=1.0-smoothstep(0.10,0.95,length(p-e)+w*0.6);',
    '  vec3 col=c0;',
    '  col=mix(col,c1,d1*0.92);',
    '  col=mix(col,c2,d2*0.45);',
    '  col=mix(col,c1,d3*0.30);',
    '  col*=1.0-0.32*smoothstep(0.25,1.25,length(p));',
    '  col*=1.0-0.22*techo();',
    '  col+=(grano(gl_FragCoord.xy,floor(u_t*10.0))-0.5)*0.060;',
    '  gl_FragColor=vec4(col,1.0);',
    '}'
  ].join(NL);

  /* 2 · Malla viva. Degradado de malla real: cuatro puntos de color que se
        mueven, con el plano deformado por ruido. */
  CUERPO.malla = [
    'void main(){',
    '  vec2 p=centro(); float t=u_t*0.055;',
    '  p+=vec2(fbm(vec3(p*1.1,t)),fbm(vec3(p*1.1+5.2,t)))*0.38;',
    '  vec2 q0=vec2(sin(t*1.10)*0.62,cos(t*0.90)*0.34);',
    '  vec2 q1=vec2(cos(t*0.80)*0.70,sin(t*1.20)*0.40);',
    '  vec2 q2=vec2(sin(t*0.60+2.0)*0.55,cos(t*0.70+1.0)*0.45);',
    '  vec2 q3=vec2(cos(t*1.30+4.0)*0.48,sin(t*0.50+3.0)*0.30);',
    '  float w0=1.0/(pow(dot(p-q0,p-q0),1.30)+0.035);',
    '  float w1=1.0/(pow(dot(p-q1,p-q1),1.30)+0.050);',
    '  float w2=1.0/(pow(dot(p-q2,p-q2),1.30)+0.065);',
    '  float w3=1.0/(pow(dot(p-q3,p-q3),1.30)+0.090);',
    '  vec3 col=(c0*w0+c1*w1+c2*w2+c3*w3)/(w0+w1+w2+w3);',
    '  col*=1.0-0.24*smoothstep(0.3,1.3,length(centro()));',
    '  col*=1.0-0.20*techo();',
    '  col+=(grano(gl_FragCoord.xy,floor(u_t*10.0))-0.5)*0.045;',
    '  gl_FragColor=vec4(col,1.0);',
    '}'
  ].join(NL);

  /* 3 · Haz volumetrico. Un solo rayo de luz atravesando humo. */
  CUERPO.haz = [
    'void main(){',
    '  vec2 p=centro(); float t=u_t*0.04; float a=-0.62;',
    '  vec2 q=vec2(p.x*cos(a)-p.y*sin(a),p.x*sin(a)+p.y*cos(a));',
    '  float humo=fbm(vec3(q*2.1,t))*0.5+0.5;',
    '  float fino=fbm(vec3(q*5.5,t*1.7))*0.5+0.5;',
    '  humo=mix(humo,humo*fino*1.35,0.45);',
    '  float eje=q.x-sin(t*0.8)*0.22;',
    '  float haz=exp(-eje*eje*5.0);',
    '  float haz2=exp(-eje*eje*22.0);',
    '  float eje2=q.x-sin(t*0.8)*0.22+0.42;',
    '  float haz3=exp(-eje2*eje2*11.0);',
    '  vec3 col=c0;',
    '  col=mix(col,c1,haz*humo*0.95);',
    '  col=mix(col,c2,haz2*humo*0.42);',
    '  col=mix(col,c1,haz3*humo*0.34);',
    '  col*=1.0-0.38*smoothstep(0.2,1.3,length(p));',
    '  col*=1.0-0.20*techo();',
    '  col+=(grano(gl_FragCoord.xy,floor(u_t*10.0))-0.5)*0.055;',
    '  gl_FragColor=vec4(col,1.0);',
    '}'
  ].join(NL);

  /* 4 · Papel. Claro. Fibra, mota y vineta calida. Practicamente quieto. */
  CUERPO.papel = [
    'void main(){',
    '  vec2 p=centro();',
    '  float fibra=fbm(vec3(gl_FragCoord.xy*0.010,u_t*0.004));',
    '  float trama=fbm(vec3(gl_FragCoord.xy*0.055,0.0));',
    '  vec3 col=c0;',
    '  col*=1.0+fibra*0.045+trama*0.018;',
    '  col=mix(col,c1,smoothstep(-0.2,0.9,fibra)*0.35);',
    '  float mota=step(0.9988,grano(gl_FragCoord.xy*1.7,3.0));',
    '  col-=mota*0.075;',
    '  col*=1.0-0.10*smoothstep(0.4,1.4,length(p));',
    '  col+=(grano(gl_FragCoord.xy,0.0)-0.5)*0.030;',
    '  gl_FragColor=vec4(col,1.0);',
    '}'
  ].join(NL);

  /* 5 · Topografia. Curvas de nivel finas que se deforman muy despacio. */
  CUERPO.topo = [
    'void main(){',
    '  vec2 p=centro(); float t=u_t*0.025;',
    '  float n=fbm(vec3(p*2.0,t));',
    '  float d=abs(fract(n*4.5)-0.5);',
    '  float linea=1.0-smoothstep(0.0,0.022,d);',
    '  float pozo=1.0-smoothstep(0.0,1.0,length(p-vec2(0.15,0.05)));',
    '  vec3 col=mix(c0,c1,pozo*0.55);',
    '  col=mix(col,c2,linea*(0.07+pozo*0.30));',
    '  col*=1.0-0.40*smoothstep(0.1,1.2,length(p));',
    '  col+=(grano(gl_FragCoord.xy,floor(u_t*10.0))-0.5)*0.045;',
    '  gl_FragColor=vec4(col,1.0);',
    '}'
  ].join(NL);

  /* 6 · Tinta. Ruido con deformacion de dominio: tinta cayendo en agua. */
  CUERPO.tinta = [
    'void main(){',
    '  vec2 p=centro(); float t=u_t*0.030;',
    '  vec3 q=vec3(p*1.45,t);',
    '  vec3 w=vec3(fbm(q),fbm(q+vec3(3.1,7.7,1.3)),fbm(q+vec3(9.2,1.4,4.8)));',
    '  float n=fbm(q+w*1.9);',
    '  vec3 col=mix(c0,c1,smoothstep(-0.10,0.85,n));',
    '  col=mix(col,c2,smoothstep(0.45,1.10,n)*0.60);',
    '  col=mix(col,c3,smoothstep(0.80,1.35,n)*0.35);',
    '  col*=1.0-0.28*smoothstep(0.3,1.3,length(p));',
    '  col+=(grano(gl_FragCoord.xy,floor(u_t*10.0))-0.5)*0.050;',
    '  gl_FragColor=vec4(col,1.0);',
    '}'
  ].join(NL);

  /* 7 · Reticula. Malla tecnica con una onda de luz que la recorre. */
  CUERPO.reticula = [
    'void main(){',
    '  vec2 p=centro(); float t=u_t*0.05;',
    '  vec2 g=gl_FragCoord.xy/(u_r.y*0.058);',
    '  vec2 f=abs(fract(g)-0.5);',
    '  float linea=1.0-smoothstep(0.0,0.030,min(f.x,f.y));',
    '  float onda=fbm(vec3(p*1.15,t))*0.5+0.5;',
    '  float pozo=1.0-smoothstep(0.0,1.15,length(p-vec2(0.05,0.0)));',
    '  vec3 col=mix(c0,c1,pozo*0.60);',
    '  col=mix(col,c2,linea*onda*(0.14+pozo*0.50));',
    '  col*=1.0-0.30*smoothstep(0.3,1.3,length(p));',
    '  col+=(grano(gl_FragCoord.xy,floor(u_t*10.0))-0.5)*0.045;',
    '  gl_FragColor=vec4(col,1.0);',
    '}'
  ].join(NL);

  /* 8 · Duotono. Claro. Degradado grande y grano grueso de imprenta. */
  CUERPO.duotono = [
    'void main(){',
    '  vec2 p=centro(); vec2 uv=gl_FragCoord.xy/u_r; float t=u_t*0.02;',
    '  float n=fbm(vec3(p*0.9,t))*0.30;',
    '  vec3 col=mix(c0,c1,smoothstep(-0.25,1.15,uv.y+uv.x*0.35+n));',
    '  col=mix(col,c2,(1.0-smoothstep(0.0,0.95,length(p-vec2(-0.25,0.20))))*0.38);',
    '  col*=1.0-0.09*smoothstep(0.5,1.4,length(p));',
    '  col+=(grano(gl_FragCoord.xy*0.55,floor(u_t*8.0))-0.5)*0.085;',
    '  gl_FragColor=vec4(col,1.0);',
    '}'
  ].join(NL);

  /* --- paletas ----------------------------------------------------------- */
  function rgb(h) {
    return [parseInt(h.substr(1, 2), 16) / 255,
            parseInt(h.substr(3, 2), 16) / 255,
            parseInt(h.substr(5, 2), 16) / 255];
  }
  var PALETA = {
    luz:      ['#080A05', '#404733', '#5A4430', '#080A05'],
    malla:    ['#070903', '#3E4632', '#6B5136', '#1A1D10'],
    haz:      ['#090B06', '#3A4029', '#F6E6B1', '#090B06'],
    papel:    ['#F4F1EA', '#E1D8CC', '#F4F1EA', '#F4F1EA'],
    topo:     ['#0E1009', '#23271A', '#F6E6B1', '#0E1009'],
    tinta:    ['#0A0C06', '#292D1F', '#4A3827', '#F6E6B1'],
    reticula: ['#0B0D07', '#202418', '#F6E6B1', '#0B0D07'],
    duotono:  ['#F4F1EA', '#DDD6CB', '#E9DCC4', '#F4F1EA']
  };

  /* --- motor ------------------------------------------------------------- */
  var VERT = 'attribute vec2 a; void main(){ gl_Position=vec4(a,0.0,1.0); }';

  function compilar(gl, tipo, src) {
    var s = gl.createShader(tipo);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(s));
      return null;
    }
    return s;
  }

  function Fondo2(nombre, host) {
    var cuerpo = CUERPO[nombre];
    if (!cuerpo || !host) return;
    var pal = PALETA[nombre];

    var c = document.createElement('canvas');
    c.className = 'lienzo2';
    host.insertBefore(c, host.firstChild);

    var gl = c.getContext('webgl', { antialias: false, alpha: false,
                                     powerPreference: 'low-power' });
    if (!gl) { host.style.background = pal[0]; return; }

    var vs = compilar(gl, gl.VERTEX_SHADER, VERT);
    var fs = compilar(gl, gl.FRAGMENT_SHADER, COMUN + NL + cuerpo);
    if (!vs || !fs) { host.style.background = pal[0]; return; }

    var pr = gl.createProgram();
    gl.attachShader(pr, vs); gl.attachShader(pr, fs); gl.linkProgram(pr);
    gl.useProgram(pr);

    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(pr, 'a');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    var uT = gl.getUniformLocation(pr, 'u_t');
    var uR = gl.getUniformLocation(pr, 'u_r');
    for (var i = 0; i < 4; i++) {
      gl.uniform3fv(gl.getUniformLocation(pr, 'c' + i), rgb(pal[i]));
    }

    function medir() {
      var d = Math.min(global.devicePixelRatio || 1, 1.75);
      var w = Math.round(host.clientWidth * d);
      var h = Math.round(host.clientHeight * d);
      if (w < 1 || h < 1) return;
      if (c.width !== w || c.height !== h) {
        c.width = w; c.height = h;
        gl.viewport(0, 0, w, h);
        gl.uniform2f(uR, w, h);
      }
    }
    medir();
    global.addEventListener('resize', medir);

    if (QUIETO) {
      gl.uniform1f(uT, 42.0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      return;
    }

    var t0 = performance.now();
    (function cuadro(t) {
      medir();
      gl.uniform1f(uT, (t - t0) / 1000);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      requestAnimationFrame(cuadro);
    })(t0);
  }

  Fondo2.lista = ['luz', 'malla', 'haz', 'papel',
                  'topo', 'tinta', 'reticula', 'duotono'];
  global.Fondo2 = Fondo2;
})(window);
