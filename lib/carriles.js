/* ==========================================================================
   Carriles que se recorren de lado.

   En movil hay secciones que en vez de apilarse se recorren en horizontal.
   El problema de eso es que no se ve: quien abre la pagina no tiene forma
   de saber que ahi hay mas cosas a la derecha, y se lo salta.

   Esto lo resuelve con dos cosas. Una guia debajo, con una marca por
   pieza, que dice cuantas hay y en cual estas. Y un primer movimiento
   solo: cuando el carril entra en pantalla avanza una pieza, y sigue
   avanzando cada pocos segundos hasta que alguien lo toca. En cuanto lo
   tocas se calla para siempre, que es lo que uno espera de algo que ya
   esta manejando.

   No depende de GSAP: va en todas las paginas, tambien en las que no
   cargan el motor de animacion.
   ========================================================================== */
(function () {
  'use strict';

  var ESPERA = 3600;      // entre avance y avance
  var PRIMERO = 1100;     // el primero antes, para que se note pronto

  var quieto = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function paradas(carril) {
    var todas = carril.querySelectorAll('*');
    var lista = [];
    for (var i = 0; i < todas.length; i++) {
      if (getComputedStyle(todas[i]).scrollSnapAlign !== 'none') lista.push(todas[i]);
    }
    return lista;
  }

  function montar(carril) {
    var stops = paradas(carril);
    if (stops.length < 2) return null;

    var izquierdas = stops.map(function (s) {
      return s.getBoundingClientRect().left - carril.getBoundingClientRect().left
             + carril.scrollLeft;
    });

    var guia = document.createElement('div');
    guia.className = 'carril__guia';
    guia.setAttribute('aria-hidden', 'true');
    for (var i = 0; i < stops.length; i++) guia.appendChild(document.createElement('i'));
    carril.insertAdjacentElement('afterend', guia);

    var marcas = guia.children;
    var actual = 0;

    function pintar() {
      var x = carril.scrollLeft;
      var cerca = 0;
      for (var i = 1; i < izquierdas.length; i++) {
        if (Math.abs(izquierdas[i] - x) < Math.abs(izquierdas[cerca] - x)) cerca = i;
      }
      if (cerca !== actual) {
        marcas[actual].classList.remove('esta');
        actual = cerca;
      }
      marcas[actual].classList.add('esta');
    }
    marcas[0].classList.add('esta');

    carril.addEventListener('scroll', function () {
      window.requestAnimationFrame(pintar);
    }, { passive: true });

    return {
      carril: carril,
      avanzar: function () {
        var siguiente = actual + 1;
        // al llegar al final se vuelve al principio, pero de un tiron:
        // deslizar toda la tira hacia atras marea
        if (siguiente >= izquierdas.length) {
          carril.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          carril.scrollTo({ left: izquierdas[siguiente], behavior: 'smooth' });
        }
      },
      remedir: function () {
        izquierdas = stops.map(function (s) {
          return s.getBoundingClientRect().left - carril.getBoundingClientRect().left
                 + carril.scrollLeft;
        });
      },
    };
  }

  function arrancar() {
    var carriles = [];
    var candidatos = document.querySelectorAll(
      '.cu, .citas, .coaches, .mesa__fotos, .diag');

    for (var i = 0; i < candidatos.length; i++) {
      var c = candidatos[i];
      var estilo = getComputedStyle(c);
      if (!/auto|scroll/.test(estilo.overflowX)) continue;
      if (c.scrollWidth <= c.clientWidth + 2) continue;
      var m = montar(c);
      if (m) carriles.push(m);
    }
    if (!carriles.length) return;

    if (quieto) return;   // la guia se queda, el movimiento no

    carriles.forEach(function (m) {
      var reloj = null;
      var tocado = false;

      function parar() {
        tocado = true;
        clearInterval(reloj);
        reloj = null;
      }
      // en cuanto alguien lo maneja, deja de moverse solo
      ['pointerdown', 'touchstart', 'wheel', 'keydown'].forEach(function (ev) {
        m.carril.addEventListener(ev, parar, { passive: true, once: true });
      });

      var ojo = new IntersectionObserver(function (entradas) {
        entradas.forEach(function (e) {
          if (tocado) return;
          if (e.isIntersecting && !reloj) {
            setTimeout(function () {
              if (tocado || reloj) return;
              m.avanzar();
              reloj = setInterval(function () { m.avanzar(); }, ESPERA);
            }, PRIMERO);
          } else if (!e.isIntersecting && reloj) {
            clearInterval(reloj);
            reloj = null;
          }
        });
      }, { threshold: 0.35 });
      ojo.observe(m.carril);
    });
  }

  // el ancho manda: si se gira el telefono puede dejar de haber carriles
  var montado = false;
  function revisar() {
    var hay = document.querySelector('.carril__guia');
    var deberia = [].some.call(
      document.querySelectorAll('.cu, .citas, .coaches, .mesa__fotos, .diag'),
      function (c) {
        return /auto|scroll/.test(getComputedStyle(c).overflowX) &&
               c.scrollWidth > c.clientWidth + 2;
      });
    if (deberia && !montado) { arrancar(); montado = true; }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', revisar);
  } else {
    revisar();
  }
  window.addEventListener('resize', revisar);
})();
