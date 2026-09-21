/* ==========================================================================
   Intain 2026. Movimiento.
   Regla: cada animación tiene que hacer algo por la lectura. Nada decorativo.
   ========================================================================== */
(function () {
  'use strict';

  /* ---------------------------------------------------- video de cabecera --
     El fondo de la cabecera es la foto, y el video se pone encima cuando
     puede. Por eso el archivo no se pide en el marcado sino aqui, y solo
     despues de que la pagina haya terminado de cargar: la primera pantalla
     la pinta la foto, que ya esta, y el video no le quita ancho de banda.

     No se carga en tres casos: si se ha pedido menos movimiento, si el
     navegador avisa de que hay que ahorrar datos, y si la conexion es de
     segunda generacion. En los tres se queda la foto, que dice lo mismo. */
  (function () {
    var a = document.getElementById('cbVideo');
    var b = document.getElementById('cbVideoB');
    if (!a || !b) return;

    var quieto = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var red = navigator.connection || {};
    var justo = red.saveData === true || /(^|-)2g$/.test(red.effectiveType || '');
    if (quieto || justo) return;

    var FUNDIDO = 1.4;   // segundos que dura el relevo
    var delante = a;     // el que se esta viendo
    var detras = b;
    var relevando = false;

    function cargar(v) {
      var fuente = v.querySelector('source[data-src]');
      if (fuente && !fuente.src) fuente.src = fuente.getAttribute('data-src');
      v.load();
    }

    function reproducir(v) {
      var intento = v.play();
      if (intento && intento.catch) intento.catch(function () {});
    }

    /* El clip no encadena: del ultimo fotograma al primero hay un salto muy
       visible. Se tapa arrancando el otro reproductor desde el principio
       antes de que este acabe y cruzando las opacidades. */
    function vigilar() {
      var v = delante;
      if (!relevando && v.duration && v.currentTime > v.duration - FUNDIDO) {
        relevando = true;
        detras.currentTime = 0;
        reproducir(detras);
        // solo se anima el de encima; el de abajo esta opaco y cubre
        if (detras === b) b.classList.add('puesto');
        else b.classList.remove('puesto');

        var saliente = delante;
        delante = detras;
        detras = saliente;

        setTimeout(function () {
          saliente.pause();
          saliente.currentTime = 0;
          relevando = false;
        }, FUNDIDO * 1000 + 120);
      }
      requestAnimationFrame(vigilar);
    }

    function arrancar() {
      cargar(a);
      cargar(b);
      a.addEventListener('playing', function () {
        a.classList.add('puesto');
        requestAnimationFrame(vigilar);
      }, { once: true });
      reproducir(a);
    }

    if (document.readyState === 'complete') arrancar();
    else window.addEventListener('load', arrancar, { once: true });
  })();

  var burger = document.getElementById('burger');
  var menu = document.getElementById('menu');
  var hdr = document.getElementById('hdr');
  var lenis = null;

  function cerrarMenu() {
    menu.classList.remove('abierto');
    burger.classList.remove('x');
    burger.setAttribute('aria-expanded', 'false');
    if (lenis) lenis.start();
  }

  var burger2 = document.getElementById('burger2');
  if (burger2) burger2.addEventListener('click', function () {
    var abierto = menu.classList.toggle('abierto');
    burger2.classList.toggle('x', abierto);
    burger2.setAttribute('aria-expanded', String(abierto));
    if (lenis) { abierto ? lenis.stop() : lenis.start(); }
  });

  burger.addEventListener('click', function () {
    var abierto = menu.classList.toggle('abierto');
    burger.classList.toggle('x', abierto);
    burger.setAttribute('aria-expanded', String(abierto));
    if (lenis) { abierto ? lenis.stop() : lenis.start(); }
  });

  window.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') cerrarMenu();
  });

  window.addEventListener('scroll', function () {
    hdr.classList.toggle('pegado', window.scrollY > 80);
  }, { passive: true });

  /* ------------------------------------------- carrusel de clientes -- */
  (function () {
    var pista = document.getElementById('pistaLogos');
    if (!pista) return;
    var logos = [
      ['img/cliente-1.webp', 'Metrickal', ''],
      ['img/cliente-2.webp', 'Cuideo', ''],
      ['img/cliente-3.webp', 'ABAST Global', ''],
      ['img/cliente-4.webp', 'Auxicolor', ''],
      ['img/distriplac.webp', 'Distriplac', 'ancho']
    ];
    // se duplica la tira para que el bucle no tenga costura
    for (var v = 0; v < 2; v++) {
      logos.forEach(function (l) {
        var i = document.createElement('img');
        i.src = l[0]; i.alt = v === 0 ? l[1] : '';
        if (v === 1) i.setAttribute('aria-hidden', 'true');
        if (l[2]) i.className = l[2];
        pista.appendChild(i);
      });
    }
  })();

  /* ------------------------------------------------- autodiagnóstico -- */
  /* Cinco casillas que el visitante marca. Cuenta en vivo y cambia el tono
     a partir de tres: es lo que convierte una lista en una conversación. */
  (function () {
    var lista = document.getElementById('suena');
    if (!lista) return;
    var botones = [].slice.call(lista.querySelectorAll('button'));
    var marcador = document.getElementById('marcador');
    var titulo = document.getElementById('marcadorN');
    var mensaje = document.getElementById('marcadorMsg');

    var textos = [
      ['Ninguna marcada todavía', 'Marca arriba lo que reconozcas en tu empresa.'],
      ['Una de cinco', 'Puede ser una mala racha. Conviene mirarlo antes de que sean tres.'],
      ['Dos de cinco', 'Dos a la vez ya no suelen ser casualidad. Casi siempre comparten causa.'],
      ['Tres de cinco', 'Esto no se va a resolver solo. Y cuanto más se tarda, más caro sale.'],
      ['Cuatro de cinco', 'Hay un problema de fondo, y probablemente ya lo sabías.'],
      ['Las cinco', 'No hace falta que te contemos nada. Hablemos de por dónde se empieza.']
    ];

    var arcos = [].slice.call(document.querySelectorAll('.aguja__viva .ar'));

    function pintar() {
      var n = botones.filter(function (b) { return b.getAttribute('aria-pressed') === 'true'; }).length;
      titulo.textContent = textos[n][0];
      mensaje.textContent = textos[n][1];
      marcador.classList.toggle('alerta', n >= 3);
      // un arco por senal marcada
      arcos.forEach(function (a, i) { a.classList.toggle('on', i < n); });
    }

    botones.forEach(function (b) {
      b.addEventListener('click', function () {
        b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
        pintar();
      });
    });
  })();

  /* Sin animación: todo visible y la tesis ya resuelta. */
  // ?plano=1 deja la pagina quieta y entera: sirve para revisarla de una captura
  var plano = /(^|[?&])plano/.test(location.search);
  if (plano) document.documentElement.classList.add('plano');

  var quieto = plano || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (quieto || typeof gsap === 'undefined') {
    document.querySelectorAll('.rev').forEach(function (e) { e.style.opacity = 1; });
    document.querySelectorAll('.tesis__l').forEach(function (e) { e.style.setProperty('--w', '100%'); });
    document.querySelectorAll('.tesis__fl path').forEach(function (e) { e.style.strokeDashoffset = 0; });

    // ?paso=N congela el coste en una cifra concreta, para revisarla suelta
    var paso = (location.search.match(/[?&]paso=(\d)/) || [])[1];
    var fichasQ = document.querySelectorAll('.coste2__uno');
    if (paso && fichasQ[+paso - 1]) {
      document.documentElement.classList.add('paso');
      fichasQ.forEach(function (f) { f.classList.remove('esta'); });
      fichasQ[+paso - 1].classList.add('esta');
      document.querySelectorAll('#costeCont li').forEach(function (l, k) {
        l.classList.toggle('esta', k === +paso - 1);
      });
    }
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  // los que esten cargados; si falta alguno la pagina sigue funcionando
  ['SplitText','ScrambleTextPlugin','Physics2DPlugin','Flip','CustomEase']
    .forEach(function (n) { if (window[n]) gsap.registerPlugin(window[n]); });

  /* ------------------------------------------------- scroll con inercia -- */
  if (typeof Lenis !== 'undefined') {
    lenis = new Lenis({
      duration: 1.15,
      easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
      smoothWheel: true
    });
    window.lenis = lenis;   // handle para depurar y para scrollTo desde fuera
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (ev) {
      var destino = document.querySelector(a.getAttribute('href'));
      if (!destino) return;
      ev.preventDefault();
      cerrarMenu();
      if (lenis) lenis.scrollTo(destino, { offset: -68, duration: 1.3 });
      else destino.scrollIntoView({ behavior: 'smooth' });
    });
  });

  /* ------------------------------------------------------------- hero -- */
  var tl = gsap.timeline({ delay: .15 });

  // la foto se descubre desde abajo mientras se acerca: lee como camara
  tl.fromTo('.cb__foto', { clipPath: 'inset(0% 0% 100% 0%)' },
            { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.5, ease: 'expo.out' }, 0)
    .fromTo('.cb__foto img', { scale: 1.14 }, { scale: 1, duration: 3, ease: 'expo.out' }, 0)
    .fromTo('.cb__arr', { y: -10, opacity: 0 },
            { y: 0, opacity: 1, duration: .7, ease: 'power3.out' }, .1);

  var tit = document.querySelector('.cb__tit');
  if (tit && window.SplitText) {
    var sp = new SplitText(tit, { type: 'lines', linesClass: 'ln' });
    gsap.set(sp.lines, { yPercent: 108, opacity: 0 });
    tl.to(sp.lines, { yPercent: 0, opacity: 1, duration: 1, ease: 'expo.out', stagger: .08 }, .35);
  } else if (tit) {
    tl.fromTo(tit, { y: 26, opacity: 0 }, { y: 0, opacity: 1, duration: .95, ease: 'expo.out' }, .35);
  }
  // los cinco frenos entran de izquierda a derecha
  tl.fromTo('.cb__frenos li', { y: 16, opacity: 0 },
            { y: 0, opacity: 1, duration: .65, ease: 'power3.out', stagger: .08 }, .9)
    .fromTo('.cb__accion > *', { y: 16, opacity: 0 },
            { y: 0, opacity: 1, duration: .75, ease: 'power3.out', stagger: .1 }, 1.3)
    .fromTo('.cb__banda', { y: 22, opacity: 0 },
            { y: 0, opacity: 1, duration: .9, ease: 'power3.out' }, 1.45);

  /* la cinta de clientes. Dos tiras iguales y un -50%: al llegar, la
     segunda esta exactamente donde empezo la primera y no se ve el corte. */
  (function () {
    var via = document.querySelector('.cb__via');
    if (!via) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var cinta = gsap.to(via, { xPercent: -50, duration: 34, ease: 'none', repeat: -1 });
    // se para al pasar por encima, para poder mirar un logo concreto
    var banda = document.querySelector('.cb__banda');
    banda.addEventListener('mouseenter', function () { cinta.pause(); });
    banda.addEventListener('mouseleave', function () { cinta.play(); });
  })();

  /* ------------------------------------------- cinta de frenos en movil --
     Los cinco frenos solo se convierten en cinta cuando no caben en fila.
     En escritorio siguen siendo cinco columnas quietas, asi que la copia
     del listado esta oculta y aqui no hay nada que mover. Se comprueba
     mirando si el carril es mas ancho que la pantalla, que es la senal de
     que el CSS los ha puesto en linea. */
  (function () {
    var via = document.querySelector('.cb__frenos-via');
    if (!via) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var cinta = null;
    function revisar() {
      var enCinta = via.scrollWidth > via.parentElement.clientWidth + 4;
      if (enCinta && !cinta) {
        cinta = gsap.to(via, { xPercent: -50, duration: 42, ease: 'none', repeat: -1 });
      } else if (!enCinta && cinta) {
        cinta.kill();
        gsap.set(via, { clearProps: 'transform' });
        cinta = null;
      }
    }
    revisar();
    window.addEventListener('resize', revisar);
  })();

  /* ------------------------------------------------------------ tesis -- */
  /* El momento de la página: se queda fija y los tres culpables falsos
     se tachan uno a uno mientras se baja. Después aparece la verdad. */
  gsap.set('#tesisV, #tesisPie', { opacity: 0 });

  var tTesis = gsap.timeline({
    scrollTrigger: {
      trigger: '#tesis', start: 'top top', end: '+=200%',
      pin: '#tesisPin', scrub: .7, anticipatePin: 1
    }
  });

  gsap.utils.toArray('.tesis__l').forEach(function (l, i) {
    gsap.set(l, { '--w': '0%' });
    var t = i * 1.1;
    tTesis.to(l, { color: 'rgba(221,214,203,.62)', duration: .45 }, t)
          .to(l, { '--w': '100%', duration: .6, ease: 'power2.inOut' }, t + .35)
          .to(l, { color: 'rgba(221,214,203,.22)', duration: .45 }, t + .8);
  });

  tTesis.to('#tesisV',   { opacity: 1, y: 0, duration: 1,  ease: 'power3.out' }, 3.5)
        .to('.tesis__fl-t', { strokeDashoffset: 0, duration: 1.1, ease: 'power2.inOut' }, 4.2)
        .to('.tesis__fl-p', { strokeDashoffset: 0, duration: .35, ease: 'power2.out' }, 5.15)
        .to('#tesisPie', { opacity: 1, y: 0, duration: .9, ease: 'power3.out' }, 5.3);
  gsap.set('#tesisV', { y: 34 });
  gsap.set('#tesisPie', { y: 22 });

  /* ------------------------------------------- coste, una por pantalla -- */
  /* Cuatro datos, cuatro pantallas. La seccion se queda fija y cada cifra
     releva a la anterior; el contador de la derecha dice por donde vas. */
  (function () {
    var esc = document.getElementById('costeEsc');
    if (!esc) return;
    var fichas = gsap.utils.toArray('.coste2__uno', esc);
    var cuenta = gsap.utils.toArray('#costeCont li');
    if (fichas.length < 2) return;

    gsap.set(fichas, { opacity: 0, y: 26 });
    gsap.set(fichas[0], { opacity: 1, y: 0 });
    gsap.set('.coste2__uno .barra i, .coste2__uno .escala i', { scaleX: 0 });
    gsap.set('.coste2__uno .ocho i, .coste2__uno .malla25 i', { opacity: 0 });

    function marcar(i) {
      cuenta.forEach(function (li, k) { li.classList.toggle('esta', k === i); });
      fichas.forEach(function (f, k) { f.classList.toggle('esta', k === i); });
    }

    var tCoste = gsap.timeline({
      scrollTrigger: {
        trigger: '#coste', start: 'top top', end: '+=320%',
        pin: '#costePin', scrub: .6, anticipatePin: 1,
        onUpdate: function (self) {
          marcar(Math.min(fichas.length - 1,
                          Math.floor(self.progress * fichas.length)));
        }
      }
    });

    fichas.forEach(function (f, i) {
      var barra = f.querySelectorAll('.barra i, .escala i');
      var trozos = f.querySelectorAll('.ocho i, .malla25 i');
      if (i > 0) {
        tCoste.to(fichas[i - 1], { opacity: 0, y: -26, duration: .28 }, i - .16)
              .to(f, { opacity: 1, y: 0, duration: .32 }, i - .04);
      }
      if (barra.length) {
        tCoste.to(barra, { scaleX: 1, duration: .5, ease: 'power2.out' }, i + .12);
      }
      if (trozos.length) {
        tCoste.to(trozos, { opacity: 1, duration: .25, stagger: .012 }, i + .12);
      }
    });
  })();

  /* ------------------------------------------------------------ camino -- */
  /* Las barras crecen al entrar, de izquierda a derecha y en orden. Se animan
     porque crecer es lo que hace el tiempo: ver la de diez dias estirarse
     hasta dos tercios dice mas que el numero. */
  (function () {
    var lin = document.getElementById('linea');
    if (!lin) return;

    var riel = lin.querySelector('.lin__riel b');
    var hitos = lin.querySelectorAll('.lin__h');
    var dias = lin.querySelectorAll('.lin__dia');
    var cols = lin.querySelectorAll('.lin__c');
    var tics = lin.querySelectorAll('.lin__tic');

    gsap.set(riel, { scaleX: 0 });
    gsap.set(hitos, { scale: 0, transformOrigin: 'center center' });
    gsap.set(dias, { opacity: 0, y: 8 });
    gsap.set(tics, { scaleX: 0 });
    gsap.set(cols, { opacity: 0, y: 16 });

    // el riel avanza y cada hito aparece cuando la linea llega hasta el
    gsap.timeline({ scrollTrigger: { trigger: lin, start: 'top 78%', once: true } })
      .to(riel, { scaleX: 1, duration: 1.5, ease: 'power2.inOut' })
      .to(hitos, { scale: 1, duration: .4, ease: 'back.out(2.4)', stagger: .34 }, .12)
      .to(dias, { opacity: 1, y: 0, duration: .45, ease: 'power3.out', stagger: .34 }, .2)
      .to(tics, { scaleX: 1, duration: .5, ease: 'power2.out', stagger: .12 }, 1.1)
      .to(cols, { opacity: 1, y: 0, duration: .6, ease: 'power3.out', stagger: .12 }, 1.18);
  })();

  /* ------------------------------------------------------- diagnostico -- */
  /* El radar es el activo diferencial de Intain, asi que aqui esta el momento
     fuerte de la pagina. Se anima porque lo que se ve es una medicion
     ocurriendo: los anillos aparecen, los ejes se trazan desde el centro, la
     figura crece hasta su forma real y las etiquetas se componen. */
  (function () {
    var svg = document.querySelector('.radar');
    if (!svg) return;

    var anillos = svg.querySelectorAll('.radar__anillo');
    var ejes    = svg.querySelectorAll('.radar__eje');
    var forma   = svg.querySelector('.radar__forma');
    var puntos  = svg.querySelectorAll('.radar__punto');
    var etqs    = svg.querySelectorAll('.radar__etq');
    var orla    = svg.querySelector('.radar__orla');

    var CX = 210, CY = 210;

    // los vertices finales de la figura, para interpolarlos desde el centro
    var destino = forma.getAttribute('points').trim().split(/\s+/).map(function (par) {
      var xy = par.split(',');
      return { x: parseFloat(xy[0]), y: parseFloat(xy[1]) };
    });

    gsap.set([anillos, orla], { transformOrigin: '210px 210px', scale: 0, opacity: 0 });
    gsap.set(puntos, { transformOrigin: '210px 210px', scale: 0 });
    gsap.set(etqs, { opacity: 0 });
    ejes.forEach(function (l) {
      var d = Math.hypot(l.x2.baseVal.value - l.x1.baseVal.value,
                         l.y2.baseVal.value - l.y1.baseVal.value);
      gsap.set(l, { strokeDasharray: d, strokeDashoffset: d });
    });

    var avance = { t: 0 };
    gsap.set(forma, {
      attr: { points: destino.map(function () { return CX + ',' + CY; }).join(' ') },
      opacity: 0
    });

    gsap.timeline({ scrollTrigger: { trigger: '#diagnostico', start: 'top 62%', once: true } })
      .to(orla,    { scale: 1, opacity: 1, duration: .7, ease: 'power3.out' })
      .to(anillos, { scale: 1, opacity: 1, duration: .6, stagger: .07, ease: 'power3.out' }, .1)
      .to(ejes,    { strokeDashoffset: 0, duration: .5, stagger: .06, ease: 'power2.out' }, .35)
      .to(forma,   { opacity: 1, duration: .2 }, .8)
      .to(avance,  {
        t: 1, duration: 1.1, ease: 'power3.out',
        onUpdate: function () {
          forma.setAttribute('points', destino.map(function (p) {
            return (CX + (p.x - CX) * avance.t).toFixed(1) + ',' +
                   (CY + (p.y - CY) * avance.t).toFixed(1);
          }).join(' '));
        }
      }, .8)
      .to(puntos, { scale: 1, duration: .35, stagger: .06, ease: 'back.out(2.6)' }, 1.5)
      .to(etqs, {
        opacity: 1, duration: .4, stagger: .07,
        scrambleText: gsap.plugins && gsap.plugins.scrambleText
          ? { chars: 'upperCase', speed: .8 } : undefined
      }, 1.3);
  })();

  /* ----------------------------------------------- por que una firma -- */
  /* Cada dibujo se comporta como lo que representa: el catalogo aparece
     entero de golpe porque ahi nadie destaca, el coach solo hace una unica
     pulsacion y se queda quieto, y la red traza sus doce enlaces uno a uno
     porque coordinar es precisamente lo que se esta vendiendo. */
  (function () {
    var cot = document.querySelector('.cot__rej');
    if (!cot) return;

    var malla = cot.querySelectorAll('.dib--malla circle');
    var solo  = cot.querySelector('.dib--solo .uno');
    var halo  = cot.querySelector('.dib--solo .halo');
    var hilos = cot.querySelectorAll('.dib--red .hilos line');
    var nodos = cot.querySelectorAll('.dib--red .nodos circle');
    var centro = cot.querySelector('.dib--red .centro');

    gsap.set(malla, { opacity: 0 });
    gsap.set([solo, halo], { scale: 0, transformOrigin: '130px 90px' });
    hilos.forEach(function (l) {
      var d = Math.hypot(l.x2.baseVal.value - l.x1.baseVal.value,
                         l.y2.baseVal.value - l.y1.baseVal.value);
      gsap.set(l, { strokeDasharray: d, strokeDashoffset: d, opacity: 1 });
    });
    gsap.set(nodos, { opacity: 0, scale: 0, transformOrigin: 'center' });
    gsap.set(centro, { scale: 0, transformOrigin: '130px 90px' });

    gsap.timeline({ scrollTrigger: { trigger: cot, start: 'top 78%', once: true } })
      .to(malla, { opacity: 1, duration: .5, ease: 'power1.out' }, 0)
      .to(solo,  { scale: 1, duration: .5, ease: 'back.out(2)' }, .35)
      .fromTo(halo, { scale: 1, opacity: .5 },
                    { scale: 2.6, opacity: 0, duration: 1.1, ease: 'power2.out' }, .6)
      .to(centro, { scale: 1, duration: .45, ease: 'back.out(2)' }, .7)
      .to(hilos, { strokeDashoffset: 0, duration: .5, ease: 'power2.out', stagger: .045 }, .85)
      .to(nodos, { opacity: .62, scale: 1, duration: .3, stagger: .045 }, 1.0);
  })();

  /* ------------------------------------------------------- programas -- */
  /* Cada bloque ocupa una pantalla y entra en el orden en que se lee.
     Por que cada cosa se mueve:
     - el icono se traza: es un icono de linea, dibujarse es su entrada
       natural y avisa de que empieza un programa distinto;
     - el texto entra escalonado: marca el orden de lectura;
     - los filetes de la ficha crecen de izquierda a derecha: arrastran el ojo
       por las cuatro especificaciones en orden;
     - la accion aparece la ultima: va despues del argumento.
     El estado oculto se pone aqui y no en el CSS: si esto falla, el bloque se
     ve entero igualmente. */
  (function () {
    var cu = document.getElementById('cuadro');
    if (!cu) return;

    var iconos = cu.querySelectorAll('.cu__ic path, .cu__ic circle, .cu__ic rect');
    var cabs   = cu.querySelectorAll('.cu__cab');
    var filas  = cu.querySelectorAll('.cu__fila:not(.cu__fila--cab)');

    iconos.forEach(function (t) {
      var l = t.getTotalLength ? t.getTotalLength() : 100;
      gsap.set(t, { strokeDasharray: l, strokeDashoffset: l });
    });
    gsap.set(cabs, { opacity: 0, y: 20 });
    gsap.set(filas, { opacity: 0, y: 14 });

    gsap.timeline({ scrollTrigger: { trigger: cu, start: 'top 74%', once: true } })
      .to(iconos, { strokeDashoffset: 0, duration: .8, ease: 'power2.inOut', stagger: .06 })
      .to(cabs, { opacity: 1, y: 0, duration: .7, ease: 'power3.out', stagger: .1 }, .25)
      // las filas caen en orden: el ojo recorre el cuadro de arriba abajo
      .to(filas, { opacity: 1, y: 0, duration: .6, ease: 'power3.out', stagger: .09 }, .6)
      .to(cu.querySelector('.cu__habitual'), { opacity: 1, duration: .5 }, 1.2);

    /* La vela: una banda que sigue a la columna sobre la que estas. Convierte
       una tabla quieta en algo que responde, sin animar nada de mas. */
    var vela = document.createElement('div');
    vela.className = 'cu__vela';
    cu.appendChild(vela);
    var cols = [0, 1, 2];

    cu.addEventListener('pointermove', function (e) {
      var celda = e.target.closest('[data-col]');
      if (!celda) { cu.classList.remove('mirando'); return; }
      var n = +celda.dataset.col;
      var r = celda.getBoundingClientRect(), rc = cu.getBoundingClientRect();
      vela.style.left = (r.left - rc.left - 14) + 'px';
      vela.style.width = (r.width + 28) + 'px';
      cu.classList.add('mirando');
      cols.forEach(function (i) { cu.classList.toggle('mira-' + i, i === n); });
    });
    cu.addEventListener('pointerleave', function () {
      cu.classList.remove('mirando', 'mira-0', 'mira-1', 'mira-2');
    });
  })();

  /* ------------------------------------------------- revelados al bajar -- */
  // Los grupos marcados entran escalonados; el resto, uno a uno.
  var enGrupo = [];
  gsap.utils.toArray('[data-grupo]').forEach(function (grupo) {
    var hijos = gsap.utils.toArray('.rev', grupo);
    if (!hijos.length) return;
    enGrupo = enGrupo.concat(hijos);
    gsap.fromTo(hijos, { opacity: 0, y: 34 }, {
      opacity: 1, y: 0, duration: .9, stagger: .085, ease: 'power3.out',
      scrollTrigger: { trigger: grupo, start: 'top 84%', once: true }
    });
  });

  gsap.utils.toArray('.rev').forEach(function (el) {
    if (el.closest('.cab, .cb')) return;             // la cabecera lleva su propia entrada
    if (enGrupo.indexOf(el) !== -1) return;     // ya va dentro de un grupo
    gsap.fromTo(el, { opacity: 0, y: 30 }, {
      opacity: 1, y: 0, duration: .95, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 88%', once: true }
    });
  });

  /* --------------------------------------------- parallax de las fotos -- */
  gsap.utils.toArray('[data-px]').forEach(function (img) {
    gsap.fromTo(img, { yPercent: -7 }, {
      yPercent: 7, ease: 'none',
      scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true }
    });
  });

  /* -------------------------------------------------------- contadores -- */
  gsap.utils.toArray('[data-contar]').forEach(function (el) {
    var fin = parseFloat(el.dataset.contar);
    var pre = el.dataset.pre || '';
    var dec = parseInt(el.dataset.dec || '0', 10);
    var obj = { v: 0 };
    ScrollTrigger.create({
      trigger: el, start: 'top 90%', once: true,
      onEnter: function () {
        gsap.to(obj, {
          v: fin, duration: 1.7, ease: 'power2.out',
          onUpdate: function () {
            el.textContent = pre + obj.v.toLocaleString('es-ES', {
              minimumFractionDigits: dec, maximumFractionDigits: dec
            });
          }
        });
      }
    });
  });

})();
