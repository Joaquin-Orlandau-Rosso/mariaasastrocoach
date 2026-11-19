// hero-animado: entradas y capas del hero, sin dependencias.
// Versión de script clásico (sin módulos) para que el sitio también funcione
// abierto desde el disco. Expone window.heroAnimado = { revelar, capas }.
//
//   revelar(raiz)  [data-entra] y [data-texto-entra] aparecen al entrar en pantalla
//   capas(raiz)    [data-profundidad] se desplazan con el scroll y con el mouse
//
// Scroll siempre nativo: nada escucha la rueda ni mueve la página.
(function () {
    'use strict';

    var mq = function (q) {
        return typeof window.matchMedia === 'function' && window.matchMedia(q).matches;
    };
    var reducido = function () { return mq('(prefers-reduced-motion: reduce)'); };
    var tactil = function () { return mq('(pointer: coarse)'); };

    var damp = function (actual, objetivo, lambda, dt) {
        return actual + (objetivo - actual) * (1 - Math.exp(-lambda * dt));
    };

    function alEntrar(el, margen, fn) {
        if (!('IntersectionObserver' in window)) {
            fn(true);
            return function () {};
        }
        var io = new IntersectionObserver(function (e) { fn(e[0].isIntersecting); }, { rootMargin: margen });
        io.observe(el);
        return function () { io.disconnect(); };
    }

    // [data-entra] sube con fundido; [data-texto-entra] entra palabra por palabra.
    // data-orden="2" lo demora 2 pasos. Lo que ya está en pantalla entra solo, en orden.
    function revelar(raiz) {
        raiz = raiz || document;
        var els = Array.prototype.slice.call(raiz.querySelectorAll('[data-entra], [data-texto-entra]'));
        els.forEach(function (el) {
            if (el.hasAttribute('data-texto-entra')) partirPalabras(el);
        });
        var mostrar = function (el) { el.setAttribute('data-visible', ''); };
        if (reducido() || !('IntersectionObserver' in window)) {
            els.forEach(mostrar);
            return function () {};
        }
        var io = new IntersectionObserver(function (entradas) {
            entradas.forEach(function (e) {
                if (!e.isIntersecting) return;
                mostrar(e.target);
                io.unobserve(e.target);
            });
        }, { rootMargin: '0px 0px -8% 0px', threshold: 0 });
        // Doble rAF: el estado oculto se pinta antes de pasar a visible.
        requestAnimationFrame(function () {
            requestAnimationFrame(function () {
                els.forEach(function (el) {
                    var r = el.getBoundingClientRect();
                    if (r.top < window.innerHeight && r.bottom > 0) mostrar(el);
                    else io.observe(el);
                });
            });
        });
        return function () { io.disconnect(); };
    }

    function partirPalabras(el) {
        if (el.hasAttribute('data-partido')) return;
        el.setAttribute('data-partido', '');
        // El lector de pantalla lee la frase entera, no palabra por palabra.
        el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
        var i = 0;
        var caminar = function (nodo) {
            Array.prototype.slice.call(nodo.childNodes).forEach(function (hijo) {
                if (hijo.nodeType === 1) {
                    caminar(hijo);
                    return;
                }
                if (hijo.nodeType !== 3 || !hijo.textContent.trim()) return;
                var frag = document.createDocumentFragment();
                hijo.textContent.split(/(\s+)/).forEach(function (parte) {
                    if (!parte) return;
                    if (/^\s+$/.test(parte)) {
                        frag.appendChild(document.createTextNode(' '));
                        return;
                    }
                    var mascara = document.createElement('span');
                    mascara.className = 'ha-palabra';
                    mascara.setAttribute('aria-hidden', 'true');
                    var palabra = document.createElement('span');
                    palabra.style.setProperty('--i', i++);
                    palabra.textContent = parte;
                    mascara.appendChild(palabra);
                    frag.appendChild(mascara);
                });
                hijo.parentNode.replaceChild(frag, hijo);
            });
        };
        caminar(el);
    }

    // Cada [data-profundidad="0.3"] se corre con el scroll y, con mouse, sigue
    // un poco al puntero. 0 = quieto; negativo = va para el otro lado.
    function capas(raiz) {
        if (!raiz) return function () {};
        var els = Array.prototype.slice.call(raiz.querySelectorAll('[data-profundidad]')).map(function (el) {
            return { el: el, p: parseFloat(el.getAttribute('data-profundidad')) || 0 };
        });
        if (!els.length || reducido()) return function () {};
        var conMouse = !tactil();
        var fuerza = parseFloat(raiz.getAttribute('data-mouse') || '24');
        var visible = true;
        var raf = 0;
        var ultimo = 0;
        var puntero = { x: 0, y: 0 };
        var suave = { x: 0, y: 0, s: 0 };

        var cuadro = function (t) {
            raf = 0;
            var dt = ultimo ? Math.min((t - ultimo) / 1000, 1 / 20) : 1 / 60;
            ultimo = t;
            var s = -raiz.getBoundingClientRect().top;
            suave.x = damp(suave.x, puntero.x, 4, dt);
            suave.y = damp(suave.y, puntero.y, 4, dt);
            suave.s = damp(suave.s, s, 12, dt);
            els.forEach(function (o) {
                var x = suave.x * o.p * fuerza;
                var y = suave.s * o.p * 0.4 + suave.y * o.p * fuerza;
                o.el.style.transform = 'translate3d(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px,0)';
            });
            var quieto = Math.abs(suave.x - puntero.x) < 0.001 &&
                Math.abs(suave.y - puntero.y) < 0.001 &&
                Math.abs(suave.s - s) < 0.1;
            if (!quieto) pedir();
            else ultimo = 0;
        };
        function pedir() {
            if (!raf && visible && !document.hidden) raf = requestAnimationFrame(cuadro);
        }
        var alMover = function (e) {
            puntero.x = (e.clientX / window.innerWidth) * 2 - 1;
            puntero.y = (e.clientY / window.innerHeight) * 2 - 1;
            pedir();
        };
        window.addEventListener('scroll', pedir, { passive: true });
        if (conMouse) window.addEventListener('pointermove', alMover, { passive: true });
        var soltar = alEntrar(raiz, '20% 0px', function (v) {
            visible = v;
            pedir();
        });
        pedir();
        return function () {
            cancelAnimationFrame(raf);
            soltar();
            window.removeEventListener('scroll', pedir);
            window.removeEventListener('pointermove', alMover);
        };
    }

    window.heroAnimado = { revelar: revelar, capas: capas, reducido: reducido, tactil: tactil };
})();
