/* ==========================================================================
   Seis motores de fondo para la cabecera de Intain.
   Nada de fotos y nada de color plano: el fondo se genera.
   Paleta: olivo #292D1F, negro #0E1009, oro #F6E6B1, crema #DDD6CB.
   Todos paran solos si el visitante pide menos movimiento.
   ========================================================================== */
(function (global) {
  'use strict';

  var QUIETO = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------- ruido simplex 2D/3D -- */
  var P = new Uint8Array(512), perm = [];
  (function () {
    var i, r = 1;
    for (i = 0; i < 256; i++) perm[i] = i;
    for (i = 255; i > 0; i--) {                 // barajado determinista
      r = (r * 16807) % 2147483647;
      var j = r % (i + 1), t = perm[i]; perm[i] = perm[j]; perm[j] = t;
    }
    for (i = 0; i < 512; i++) P[i] = perm[i & 255];
  })();
  var G3 = [[1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],[1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],
            [0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]];
  function pto(g, x, y, z) { return g[0]*x + g[1]*y + g[2]*z; }

  function ruido(xin, yin, zin) {
    var F3 = 1/3, G = 1/6;
    var s = (xin + yin + zin) * F3;
    var i = Math.floor(xin + s), j = Math.floor(yin + s), k = Math.floor(zin + s);
    var t = (i + j + k) * G;
    var x0 = xin - (i - t), y0 = yin - (j - t), z0 = zin - (k - t);
    var i1,j1,k1,i2,j2,k2;
    if (x0 >= y0) {
      if (y0 >= z0)      { i1=1;j1=0;k1=0; i2=1;j2=1;k2=0; }
      else if (x0 >= z0) { i1=1;j1=0;k1=0; i2=1;j2=0;k2=1; }
      else               { i1=0;j1=0;k1=1; i2=1;j2=0;k2=1; }
    } else {
      if (y0 < z0)       { i1=0;j1=0;k1=1; i2=0;j2=1;k2=1; }
      else if (x0 < z0)  { i1=0;j1=1;k1=0; i2=0;j2=1;k2=1; }
      else               { i1=0;j1=1;k1=0; i2=1;j2=1;k2=0; }
    }
    var x1=x0-i1+G, y1=y0-j1+G, z1=z0-k1+G;
    var x2=x0-i2+2*G, y2=y0-j2+2*G, z2=z0-k2+2*G;
    var x3=x0-1+3*G, y3=y0-1+3*G, z3=z0-1+3*G;
    var ii=i&255, jj=j&255, kk=k&255, n=0, tt;
    var gi0=P[ii+P[jj+P[kk]]]%12, gi1=P[ii+i1+P[jj+j1+P[kk+k1]]]%12,
        gi2=P[ii+i2+P[jj+j2+P[kk+k2]]]%12, gi3=P[ii+1+P[jj+1+P[kk+1]]]%12;
    tt=.6-x0*x0-y0*y0-z0*z0; if (tt>0){tt*=tt; n+=tt*tt*pto(G3[gi0],x0,y0,z0);}
    tt=.6-x1*x1-y1*y1-z1*z1; if (tt>0){tt*=tt; n+=tt*tt*pto(G3[gi1],x1,y1,z1);}
    tt=.6-x2*x2-y2*y2-z2*z2; if (tt>0){tt*=tt; n+=tt*tt*pto(G3[gi2],x2,y2,z2);}
    tt=.6-x3*x3-y3*y3-z3*z3; if (tt>0){tt*=tt; n+=tt*tt*pto(G3[gi3],x3,y3,z3);}
    return 32 * n;
  }

  /* ------------------------------------------------------------ utilería -- */
  function lienzo(host) {
    var c = document.createElement('canvas');
    c.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
    host.appendChild(c);
    var x = c.getContext('2d');
    function medir() {
      var d = Math.min(devicePixelRatio || 1, 1.6);
      c.width = host.clientWidth * d; c.height = host.clientHeight * d;
      x.setTransform(d, 0, 0, d, 0, 0);
    }
    medir(); addEventListener('resize', medir);
    return { c: c, x: x, w: function () { return host.clientWidth; }, h: function () { return host.clientHeight; } };
  }
  function bucle(fn) {
    if (QUIETO) { fn(0); return; }
    var t0 = performance.now();
    (function paso(t) { fn((t - t0) / 1000); requestAnimationFrame(paso); })(t0);
  }

  var FONDOS = {};

  /* ═══ 1 · DEGRADADO DE MALLA (la técnica de Stripe, en WebGL) ═════════ */
  FONDOS.malla = function (host) {
    var c = document.createElement('canvas');
    c.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
    host.appendChild(c);
    var gl = c.getContext('webgl');
    if (!gl) { FONDOS.aurora(host); return; }

    var vs = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
    var fs = [
      'precision highp float;uniform vec2 R;uniform float T;',
      'vec3 h3(vec3 p){p=vec3(dot(p,vec3(127.1,311.7,74.7)),dot(p,vec3(269.5,183.3,246.1)),dot(p,vec3(113.5,271.9,124.6)));',
      'return -1.+2.*fract(sin(p)*43758.5453123);}',
      'float n3(vec3 p){vec3 i=floor(p),f=fract(p);vec3 u=f*f*(3.-2.*f);',
      'return mix(mix(mix(dot(h3(i+vec3(0,0,0)),f-vec3(0,0,0)),dot(h3(i+vec3(1,0,0)),f-vec3(1,0,0)),u.x),',
      'mix(dot(h3(i+vec3(0,1,0)),f-vec3(0,1,0)),dot(h3(i+vec3(1,1,0)),f-vec3(1,1,0)),u.x),u.y),',
      'mix(mix(dot(h3(i+vec3(0,0,1)),f-vec3(0,0,1)),dot(h3(i+vec3(1,0,1)),f-vec3(1,0,1)),u.x),',
      'mix(dot(h3(i+vec3(0,1,1)),f-vec3(0,1,1)),dot(h3(i+vec3(1,1,1)),f-vec3(1,1,1)),u.x),u.y),u.z);}',
      'float fbm(vec3 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*n3(p);p*=2.02;a*=.5;}return v;}',
      'void main(){',
      ' vec2 uv=gl_FragCoord.xy/R.xy; vec2 q=uv; q.x*=R.x/R.y;',
      ' float t=T*.045;',
      ' float f=fbm(vec3(q*1.55,t));',
      ' float g=fbm(vec3(q*2.4+f*.6,t*1.3+9.));',
      ' vec3 negro=vec3(0.055,0.063,0.035);',
      ' vec3 olivo=vec3(0.161,0.176,0.121);',
      ' vec3 verde=vec3(0.245,0.267,0.180);',
      ' vec3 oro  =vec3(0.965,0.902,0.694);',
      ' vec3 col=mix(negro,olivo,smoothstep(-.55,.40,f));',
      ' col=mix(col,verde,smoothstep(-.10,.65,g));',
      // la luz dorada: una sola zona que respira, nunca todo el lienzo
      ' float luz=smoothstep(.30,.92,fbm(vec3(q*1.05-vec2(.30,.15),t*.8+31.)));',
      ' col=mix(col,oro,luz*.62);',
      ' float luz2=smoothstep(.45,1.0,fbm(vec3(q*1.7+vec2(.8,.5),t*.55+77.)));',
      ' col=mix(col,oro,luz2*.22);',
      ' float foco=1.-smoothstep(.0,.95,length(q-vec2(1.15,.62)));',
      ' col+=oro*foco*foco*.30;',
      ' float vin=1.-smoothstep(.45,1.25,length(uv-vec2(.5)));',
      ' col*=mix(.70,1.08,vin);',
      ' float gr=fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453);',
      ' col+=(gr-.5)*.028;',
      ' gl_FragColor=vec4(col,1.);}'
    ].join('\n');

    function sh(t, s) { var o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); return o; }
    var pr = gl.createProgram();
    gl.attachShader(pr, sh(gl.VERTEX_SHADER, vs));
    gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(pr); gl.useProgram(pr);
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,3,-1,-1,3]), gl.STATIC_DRAW);
    var lp = gl.getAttribLocation(pr, 'p');
    gl.enableVertexAttribArray(lp); gl.vertexAttribPointer(lp, 2, gl.FLOAT, false, 0, 0);
    var uR = gl.getUniformLocation(pr, 'R'), uT = gl.getUniformLocation(pr, 'T');

    function medir() {
      var d = Math.min(devicePixelRatio || 1, 1.5);
      c.width = host.clientWidth * d; c.height = host.clientHeight * d;
      gl.viewport(0, 0, c.width, c.height);
      gl.uniform2f(uR, c.width, c.height);
    }
    medir(); addEventListener('resize', medir);
    bucle(function (t) { gl.uniform1f(uT, t); gl.drawArrays(gl.TRIANGLES, 0, 3); });
  };

  /* ═══ 2 · TOPOGRAFÍA (la montaña del nombre, en curvas de nivel) ══════ */
  FONDOS.topografia = function (host) {
    var L = lienzo(host);
    bucle(function (t) {
      var w = L.w(), h = L.h(), x = L.x;
      var g = x.createLinearGradient(0, 0, w * .7, h);
      g.addColorStop(0, '#0E1009'); g.addColorStop(.55, '#22261A'); g.addColorStop(1, '#292D1F');
      x.fillStyle = g; x.fillRect(0, 0, w, h);

      var rl = x.createRadialGradient(w * .74, h * .3, 0, w * .74, h * .3, Math.max(w, h) * .62);
      rl.addColorStop(0, 'rgba(246,230,177,.16)'); rl.addColorStop(1, 'rgba(246,230,177,0)');
      x.fillStyle = rl; x.fillRect(0, 0, w, h);

      var lineas = 34, paso = 9;
      for (var i = 0; i < lineas; i++) {
        var p = i / lineas;
        x.beginPath();
        for (var px = -20; px <= w + 20; px += paso) {
          var n = ruido(px * .0016, i * .09, t * .045);
          var n2 = ruido(px * .0045, i * .14 + 40, t * .03);
          var y = h * .18 + p * h * .9 + n * 90 * (1 - p * .45) + n2 * 26;
          if (px === -20) x.moveTo(px, y); else x.lineTo(px, y);
        }
        // las de arriba, doradas y finas; las de abajo, crema y aún más tenues
        var mezcla = 1 - p;
        x.strokeStyle = 'rgba(' + Math.round(246 - 25 * p) + ',' + Math.round(230 - 16 * p) + ',' +
                        Math.round(177 - 6 * p) + ',' + (0.07 + mezcla * 0.20) + ')';
        x.lineWidth = 1;
        x.stroke();
      }
      var vg = x.createRadialGradient(w / 2, h * .45, h * .25, w / 2, h * .5, Math.max(w, h) * .78);
      vg.addColorStop(0, 'rgba(14,16,9,0)'); vg.addColorStop(1, 'rgba(14,16,9,.75)');
      x.fillStyle = vg; x.fillRect(0, 0, w, h);
    });
  };

  /* ═══ 3 · AURORA (luz volumétrica lenta) ═════════════════════════════ */
  FONDOS.aurora = function (host) {
    var L = lienzo(host);
    var manchas = [
      { r: .58, cx: .70, cy: .26, c: '246,230,177', a: .52, v: .11 },
      { r: .44, cx: .88, cy: .58, c: '246,230,177', a: .34, v: .075 },
      { r: .80, cx: .34, cy: .34, c: '104,116,74',  a: .72, v: .06 },
      { r: .92, cx: .55, cy: .86, c: '58,66,42',    a: .85, v: .05 },
      { r: .50, cx: .06, cy: .70, c: '41,45,31',    a: .90, v: .09 }
    ];
    bucle(function (t) {
      var w = L.w(), h = L.h(), x = L.x, m = Math.max(w, h);
      x.fillStyle = '#12150C'; x.fillRect(0, 0, w, h);
      x.globalCompositeOperation = 'lighter';
      manchas.forEach(function (b, i) {
        var dx = Math.sin(t * b.v + i * 1.7) * .13 + Math.cos(t * b.v * .6 + i) * .06;
        var dy = Math.cos(t * b.v * .85 + i * 2.3) * .11;
        var cx = (b.cx + dx) * w, cy = (b.cy + dy) * h, rad = b.r * m * .62;
        var g = x.createRadialGradient(cx, cy, 0, cx, cy, rad);
        g.addColorStop(0, 'rgba(' + b.c + ',' + b.a + ')');
        g.addColorStop(.40, 'rgba(' + b.c + ',' + (b.a * .45) + ')');
        g.addColorStop(1, 'rgba(' + b.c + ',0)');
        x.fillStyle = g; x.beginPath(); x.arc(cx, cy, rad, 0, 7); x.fill();
      });
      x.globalCompositeOperation = 'source-over';
      var vg = x.createRadialGradient(w / 2, h / 2, h * .2, w / 2, h / 2, m * .8);
      vg.addColorStop(0, 'rgba(14,16,9,0)'); vg.addColorStop(1, 'rgba(14,16,9,.68)');
      x.fillStyle = vg; x.fillRect(0, 0, w, h);
    });
  };

  /* ═══ 4 · CAMPO DE FLUJO (partículas que dejan traza) ════════════════ */
  FONDOS.flujo = function (host) {
    var L = lienzo(host), ps = [], N = 900, primera = true;
    function sembrar(w, h) {
      ps = [];
      for (var i = 0; i < N; i++) ps.push({ x: Math.random() * w, y: Math.random() * h, v: 0 });
    }
    bucle(function (t) {
      var w = L.w(), h = L.h(), x = L.x;
      if (primera || ps.length === 0) { sembrar(w, h); primera = false;
        var g = x.createLinearGradient(0, 0, w, h);
        g.addColorStop(0, '#0E1009'); g.addColorStop(1, '#23271A');
        x.fillStyle = g; x.fillRect(0, 0, w, h);
      }
      // velo tenue en vez de borrar: así queda estela
      x.fillStyle = 'rgba(16,19,11,.030)';
      x.fillRect(0, 0, w, h);

      for (var i = 0; i < ps.length; i++) {
        var p = ps[i];
        var a = ruido(p.x * .0016, p.y * .0016, t * .055) * Math.PI * 2.4;
        var nx = p.x + Math.cos(a) * 1.5, ny = p.y + Math.sin(a) * 1.5;
        var d = Math.hypot(p.x / w - .72, p.y / h - .3);       // más brillo cerca del foco
        var al = .10 + Math.max(0, .62 - d) * .58;
        x.lineWidth = d < .3 ? 1.5 : 1;
        x.strokeStyle = 'rgba(246,230,177,' + al.toFixed(3) + ')';
        x.beginPath(); x.moveTo(p.x, p.y); x.lineTo(nx, ny); x.stroke();
        p.x = nx; p.y = ny; p.v++;
        if (p.v > 260 || nx < -10 || nx > w + 10 || ny < -10 || ny > h + 10) {
          p.x = Math.random() * w; p.y = Math.random() * h; p.v = 0;
        }
      }
      var vg = x.createRadialGradient(w * .72, h * .3, h * .1, w / 2, h / 2, Math.max(w, h) * .82);
      vg.addColorStop(0, 'rgba(14,16,9,0)'); vg.addColorStop(1, 'rgba(14,16,9,.30)');
      x.fillStyle = vg; x.fillRect(0, 0, w, h);
    });
  };

  /* ═══ 5 · RETÍCULA QUE RESPIRA (puntos con onda y ratón) ═════════════ */
  FONDOS.reticula = function (host) {
    var L = lienzo(host), mx = -999, my = -999;
    host.addEventListener('mousemove', function (e) {
      var r = host.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top;
    });
    host.addEventListener('mouseleave', function () { mx = my = -999; });
    bucle(function (t) {
      var w = L.w(), h = L.h(), x = L.x, paso = 26;
      var g = x.createLinearGradient(0, 0, w * .6, h);
      g.addColorStop(0, '#0E1009'); g.addColorStop(1, '#262A1C');
      x.fillStyle = g; x.fillRect(0, 0, w, h);
      var rl = x.createRadialGradient(w * .7, h * .34, 0, w * .7, h * .34, Math.max(w, h) * .6);
      rl.addColorStop(0, 'rgba(246,230,177,.20)'); rl.addColorStop(1, 'rgba(246,230,177,0)');
      x.fillStyle = rl; x.fillRect(0, 0, w, h);

      for (var i = 0; i * paso < w + paso; i++) {
        for (var j = 0; j * paso < h + paso; j++) {
          var px = i * paso, py = j * paso;
          var n = ruido(px * .004, py * .004, t * .12);
          var d = Math.hypot(px - mx, py - my);
          var empuje = d < 170 ? (1 - d / 170) : 0;
          var r = 1.0 + n * 1.5 + empuje * 3.2;
          if (r < .18) continue;
          var al = .16 + n * .26 + empuje * .55;
          x.fillStyle = 'rgba(246,230,177,' + Math.max(0, Math.min(.8, al)).toFixed(3) + ')';
          x.beginPath(); x.arc(px, py, Math.max(.2, r), 0, 7); x.fill();
        }
      }
      var vg = x.createRadialGradient(w / 2, h / 2, h * .24, w / 2, h / 2, Math.max(w, h) * .8);
      vg.addColorStop(0, 'rgba(14,16,9,0)'); vg.addColorStop(1, 'rgba(14,16,9,.62)');
      x.fillStyle = vg; x.fillRect(0, 0, w, h);
    });
  };

  /* ═══ 6 · NIEBLA DORADA (humo lento con luz lateral) ═════════════════ */
  FONDOS.niebla = function (host) {
    var L = lienzo(host);
    // se dibuja pequeño y se escala: sale suave y va sobrado de rendimiento
    var mini = document.createElement('canvas'), mx = mini.getContext('2d');
    mini.width = 96; mini.height = 54;
    var img = mx.createImageData(96, 54);
    bucle(function (t) {
      var w = L.w(), h = L.h(), x = L.x, d = img.data, k = 0;
      for (var j = 0; j < 54; j++) {
        for (var i = 0; i < 96; i++) {
          var n = ruido(i * .030, j * .038, t * .055);
          var n2 = ruido(i * .070 + 12, j * .075, t * .032);
          var v = (n * .68 + n2 * .32 + 1) / 2;                 // 0..1
          var luz = Math.pow(Math.max(0, 1 - Math.hypot(i / 96 - .72, j / 54 - .3) * 1.35), 2);
          var m = Math.min(1, Math.max(0, v * .42 + luz * .80));
          d[k++] = 14 + m * (246 - 14) * .52;
          d[k++] = 16 + m * (230 - 16) * .48;
          d[k++] = 9  + m * (177 - 9)  * .34;
          d[k++] = 255;
        }
      }
      mx.putImageData(img, 0, 0);
      x.imageSmoothingEnabled = true;
      x.filter = 'blur(26px)';
      x.drawImage(mini, 0, 0, w, h);
      x.filter = 'none';
      var vg = x.createRadialGradient(w * .68, h * .32, h * .12, w / 2, h / 2, Math.max(w, h) * .78);
      vg.addColorStop(0, 'rgba(14,16,9,0)'); vg.addColorStop(1, 'rgba(14,16,9,.80)');
      x.fillStyle = vg; x.fillRect(0, 0, w, h);
    });
  };


  /* ═══ VARIANTES CLARAS · para las cabeceras en crema ═════════════════ */

  /* malla clara: mismo shader, otra rampa. Crema con vetas olivo y oro. */
  FONDOS.mallaClara = function (host) {
    var c = document.createElement('canvas');
    c.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
    host.appendChild(c);
    var gl = c.getContext('webgl');
    if (!gl) { FONDOS.topografiaClara(host); return; }
    var vs = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
    var fs = [
      'precision highp float;uniform vec2 R;uniform float T;',
      'vec3 h3(vec3 p){p=vec3(dot(p,vec3(127.1,311.7,74.7)),dot(p,vec3(269.5,183.3,246.1)),dot(p,vec3(113.5,271.9,124.6)));',
      'return -1.+2.*fract(sin(p)*43758.5453123);}',
      'float n3(vec3 p){vec3 i=floor(p),f=fract(p);vec3 u=f*f*(3.-2.*f);',
      'return mix(mix(mix(dot(h3(i+vec3(0,0,0)),f-vec3(0,0,0)),dot(h3(i+vec3(1,0,0)),f-vec3(1,0,0)),u.x),',
      'mix(dot(h3(i+vec3(0,1,0)),f-vec3(0,1,0)),dot(h3(i+vec3(1,1,0)),f-vec3(1,1,0)),u.x),u.y),',
      'mix(mix(dot(h3(i+vec3(0,0,1)),f-vec3(0,0,1)),dot(h3(i+vec3(1,0,1)),f-vec3(1,0,1)),u.x),',
      'mix(dot(h3(i+vec3(0,1,1)),f-vec3(0,1,1)),dot(h3(i+vec3(1,1,1)),f-vec3(1,1,1)),u.x),u.y),u.z);}',
      'float fbm(vec3 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*n3(p);p*=2.02;a*=.5;}return v;}',
      'void main(){',
      ' vec2 uv=gl_FragCoord.xy/R.xy; vec2 q=uv; q.x*=R.x/R.y;',
      ' float t=T*.04;',
      ' float f=fbm(vec3(q*1.5,t));',
      ' float g=fbm(vec3(q*2.3+f*.5,t*1.2+9.));',
      ' vec3 crema=vec3(0.867,0.839,0.796);',   // #DDD6CB
      ' vec3 crema2=vec3(0.937,0.918,0.886);',
      ' vec3 oro  =vec3(0.965,0.902,0.694);',
      ' vec3 olivo=vec3(0.161,0.176,0.121);',
      ' vec3 col=mix(crema,crema2,smoothstep(-.5,.5,f));',
      ' col=mix(col,oro,smoothstep(.02,.72,g)*.55);',
      ' float sombra=smoothstep(.35,1.0,fbm(vec3(q*1.25+vec2(.6,.3),t*.7+17.)));',
      ' col=mix(col,olivo,sombra*.16);',
      ' float vin=1.-smoothstep(.5,1.3,length(uv-vec2(.42,.5)));',
      ' col*=mix(.90,1.02,vin);',
      ' float gr=fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453);',
      ' col+=(gr-.5)*.018;',
      ' gl_FragColor=vec4(col,1.);}'
    ].join(String.fromCharCode(10));
    function sh(t, x) { var o = gl.createShader(t); gl.shaderSource(o, x); gl.compileShader(o); return o; }
    var pr = gl.createProgram();
    gl.attachShader(pr, sh(gl.VERTEX_SHADER, vs));
    gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(pr); gl.useProgram(pr);
    var b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,3,-1,-1,3]), gl.STATIC_DRAW);
    var lp = gl.getAttribLocation(pr, 'p');
    gl.enableVertexAttribArray(lp); gl.vertexAttribPointer(lp, 2, gl.FLOAT, false, 0, 0);
    var uR = gl.getUniformLocation(pr, 'R'), uT = gl.getUniformLocation(pr, 'T');
    function medir() {
      var d = Math.min(devicePixelRatio || 1, 1.5);
      c.width = host.clientWidth * d; c.height = host.clientHeight * d;
      gl.viewport(0, 0, c.width, c.height); gl.uniform2f(uR, c.width, c.height);
    }
    medir(); addEventListener('resize', medir);
    bucle(function (t) { gl.uniform1f(uT, t); gl.drawArrays(gl.TRIANGLES, 0, 3); });
  };

  /* topografía clara: curvas olivo sobre crema */
  FONDOS.topografiaClara = function (host) {
    var L = lienzo(host);
    bucle(function (t) {
      var w = L.w(), h = L.h(), x = L.x;
      var g = x.createLinearGradient(0, 0, w * .8, h);
      g.addColorStop(0, '#E4DED4'); g.addColorStop(.6, '#DDD6CB'); g.addColorStop(1, '#D4CCBF');
      x.fillStyle = g; x.fillRect(0, 0, w, h);
      var rl = x.createRadialGradient(w * .78, h * .24, 0, w * .78, h * .24, Math.max(w, h) * .6);
      rl.addColorStop(0, 'rgba(246,230,177,.55)'); rl.addColorStop(1, 'rgba(246,230,177,0)');
      x.fillStyle = rl; x.fillRect(0, 0, w, h);
      for (var i = 0; i < 30; i++) {
        var p = i / 30;
        x.beginPath();
        for (var px = -20; px <= w + 20; px += 9) {
          var n = ruido(px * .0016, i * .09, t * .04);
          var n2 = ruido(px * .0045, i * .14 + 40, t * .028);
          var y = h * .16 + p * h * .92 + n * 85 * (1 - p * .4) + n2 * 24;
          if (px === -20) x.moveTo(px, y); else x.lineTo(px, y);
        }
        x.strokeStyle = 'rgba(41,45,31,' + (0.05 + (1 - p) * 0.11) + ')';
        x.lineWidth = 1; x.stroke();
      }
    });
  };

  /* retícula clara: puntos olivo sobre crema */
  FONDOS.reticulaClara = function (host) {
    var L = lienzo(host), mx = -999, my = -999;
    host.addEventListener('mousemove', function (e) {
      var r = host.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top;
    });
    host.addEventListener('mouseleave', function () { mx = my = -999; });
    bucle(function (t) {
      var w = L.w(), h = L.h(), x = L.x, paso = 26;
      var g = x.createLinearGradient(0, 0, w * .7, h);
      g.addColorStop(0, '#E6E0D7'); g.addColorStop(1, '#D6CEC1');
      x.fillStyle = g; x.fillRect(0, 0, w, h);
      var rl = x.createRadialGradient(w * .74, h * .3, 0, w * .74, h * .3, Math.max(w, h) * .58);
      rl.addColorStop(0, 'rgba(246,230,177,.62)'); rl.addColorStop(1, 'rgba(246,230,177,0)');
      x.fillStyle = rl; x.fillRect(0, 0, w, h);
      for (var i = 0; i * paso < w + paso; i++) {
        for (var j = 0; j * paso < h + paso; j++) {
          var px = i * paso, py = j * paso;
          var n = ruido(px * .004, py * .004, t * .11);
          var d = Math.hypot(px - mx, py - my);
          var emp = d < 170 ? (1 - d / 170) : 0;
          var r = .9 + n * 1.3 + emp * 3;
          if (r < .18) continue;
          x.fillStyle = 'rgba(41,45,31,' + Math.max(0, Math.min(.5, .10 + n * .16 + emp * .35)).toFixed(3) + ')';
          x.beginPath(); x.arc(px, py, Math.max(.2, r), 0, 7); x.fill();
        }
      }
    });
  };


  /* ═══ NIEBLA FINA · la de B2, corregida ═══════════════════════════════
     La anterior se embarraba en marrón porque mezclaba ruido y luz a partes
     iguales. Aquí manda la luz: un solo foco limpio, esquinas casi negras y
     el ruido solo como veladura que se mueve. */
  FONDOS.nieblaFina = function (host, opc) {
    opc = opc || {};
    var fx = opc.fx !== undefined ? opc.fx : .70;     // dónde está el foco
    var fy = opc.fy !== undefined ? opc.fy : .30;
    var L = lienzo(host);
    var mini = document.createElement('canvas'), mx = mini.getContext('2d');
    mini.width = 120; mini.height = 68;
    var img = mx.createImageData(120, 68);
    bucle(function (t) {
      var w = L.w(), h = L.h(), x = L.x, d = img.data, k = 0;
      for (var j = 0; j < 68; j++) {
        for (var i = 0; i < 120; i++) {
          var u = i / 120, v = j / 68;
          // un solo foco, con caída suave y larga
          var dist = Math.hypot((u - fx) * 1.25, (v - fy));
          var luz = Math.pow(Math.max(0, 1 - dist * 1.32), 2.4);
          // el humo solo modula la luz, no compite con ella
          var n = (ruido(i * .026, j * .032, t * .05) + 1) / 2;
          var n2 = (ruido(i * .062 + 20, j * .07, t * .028) + 1) / 2;
          var humo = n * .7 + n2 * .3;
          var m = luz * (.55 + humo * .75);
          m = Math.min(1, Math.max(0, m));
          d[k++] = 10 + m * 236 * .92;
          d[k++] = 12 + m * 218 * .86;
          d[k++] = 8  + m * 169 * .60;
          d[k++] = 255;
        }
      }
      mx.putImageData(img, 0, 0);
      x.filter = 'blur(30px)';
      x.drawImage(mini, -30, -30, w + 60, h + 60);
      x.filter = 'none';
      // esquinas cerradas: el marco tiene que respirar contra negro
      var vg = x.createRadialGradient(w * fx, h * fy, h * .06, w * .5, h * .5, Math.max(w, h) * .82);
      vg.addColorStop(0, 'rgba(14,16,9,0)');
      vg.addColorStop(.55, 'rgba(14,16,9,.42)');
      vg.addColorStop(1, 'rgba(14,16,9,.94)');
      x.fillStyle = vg; x.fillRect(0, 0, w, h);
    });
  };

  /* niebla fina en claro: la misma luz sobre crema */
  FONDOS.nieblaClara = function (host) {
    var L = lienzo(host);
    var mini = document.createElement('canvas'), mx = mini.getContext('2d');
    mini.width = 120; mini.height = 68;
    var img = mx.createImageData(120, 68);
    bucle(function (t) {
      var w = L.w(), h = L.h(), x = L.x, d = img.data, k = 0;
      for (var j = 0; j < 68; j++) {
        for (var i = 0; i < 120; i++) {
          var u = i / 120, v = j / 68;
          var luz = Math.pow(Math.max(0, 1 - Math.hypot((u - .68) * 1.2, v - .28) * 1.35), 2.2);
          var n = (ruido(i * .026, j * .032, t * .045) + 1) / 2;
          var m = Math.min(1, Math.max(0, luz * (.5 + n * .8)));
          d[k++] = 208 + m * 48;
          d[k++] = 200 + m * 40;
          d[k++] = 186 + m * 18;
          d[k++] = 255;
        }
      }
      mx.putImageData(img, 0, 0);
      x.filter = 'blur(30px)';
      x.drawImage(mini, -30, -30, w + 60, h + 60);
      x.filter = 'none';
      var vg = x.createRadialGradient(w * .68, h * .28, h * .1, w * .5, h * .5, Math.max(w, h) * .85);
      vg.addColorStop(0, 'rgba(41,45,31,0)'); vg.addColorStop(1, 'rgba(41,45,31,.16)');
      x.fillStyle = vg; x.fillRect(0, 0, w, h);
    });
  };

  global.FondoIntain = function (nombre, host, opc) {
    (FONDOS[nombre] || FONDOS.malla)(host, opc);
  };
  global.FondoIntain.lista = Object.keys(FONDOS);
})(window);
