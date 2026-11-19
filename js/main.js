(function () {
    'use strict';

    var WHATSAPP = '5491163504385';
    var EMAIL = 'Mariainesb@hotmail.com.ar';

    var $ = function (sel, raiz) { return (raiz || document).querySelector(sel); };
    var $$ = function (sel, raiz) { return Array.prototype.slice.call((raiz || document).querySelectorAll(sel)); };
    var reducido = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ---------- Año del pie ----------
    $$('[data-anio]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

    // ---------- Cielo del hero: estrellas en dos profundidades ----------
    // Pseudoaleatorio con semilla: el cielo sale igual en cada visita.
    function azar(semilla) {
        return function () {
            semilla |= 0;
            semilla = (semilla + 0x6d2b79f5) | 0;
            var t = Math.imul(semilla ^ (semilla >>> 15), 1 | semilla);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    var CIELOS = {
        lejanas: { semilla: 7, cantidad: 110, radio: [0.7, 1.5], opacidad: [0.3, 0.7], titilan: 0.25 },
        cercanas: { semilla: 23, cantidad: 34, radio: [1.4, 2.4], opacidad: [0.55, 0.95], titilan: 0.45 }
    };

    $$('svg[data-estrellas]').forEach(function (svg) {
        var c = CIELOS[svg.getAttribute('data-estrellas')];
        if (!c) return;
        var r = azar(c.semilla);
        var entre = function (par) { return par[0] + r() * (par[1] - par[0]); };
        var html = '';
        for (var i = 0; i < c.cantidad; i++) {
            var x = (r() * 1600).toFixed(1);
            var y = (r() * 1000).toFixed(1);
            var radio = entre(c.radio).toFixed(2);
            var op = entre(c.opacidad).toFixed(2);
            if (r() < c.titilan) {
                var dur = (3 + r() * 4).toFixed(1);
                var ret = (-r() * 6).toFixed(1);
                html += '<circle class="t" cx="' + x + '" cy="' + y + '" r="' + radio + '" fill="currentColor" style="--d:' + dur + 's;--r:' + ret + 's"/>';
            } else {
                html += '<circle cx="' + x + '" cy="' + y + '" r="' + radio + '" fill="currentColor" opacity="' + op + '"/>';
            }
        }
        svg.setAttribute('viewBox', '0 0 1600 1000');
        svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
        svg.innerHTML = html;
    });

    // ---------- Astrolabio detrás del emblema ----------
    var astrolabio = $('[data-astrolabio]');
    if (astrolabio) {
        var C = 300;
        var punto = function (radio, grados) {
            var a = (grados - 90) * Math.PI / 180;
            return (C + radio * Math.cos(a)).toFixed(2) + ' ' + (C + radio * Math.sin(a)).toFixed(2);
        };
        var marcas = '';
        for (var g = 0; g < 360; g += 5) {
            var larga = g % 30 === 0;
            marcas += 'M' + punto(larga ? 262 : 282, g) + 'L' + punto(292, g);
        }
        var puntos = '';
        for (var k = 0; k < 12; k++) {
            var p = punto(249, k * 30 + 15).split(' ');
            puntos += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="2.2" fill="currentColor"/>';
        }
        astrolabio.innerHTML =
            '<g fill="none" stroke="currentColor">' +
            '<circle cx="300" cy="300" r="292" stroke-width="1"/>' +
            '<circle cx="300" cy="300" r="262" stroke-width="0.8"/>' +
            '<circle cx="300" cy="300" r="236" stroke-width="0.8" stroke-dasharray="1 7"/>' +
            '<path d="' + marcas + '" stroke-width="0.9"/>' +
            '</g>' + puntos;
    }

    // ---------- Animaciones del hero y entradas ----------
    if (window.heroAnimado) {
        window.heroAnimado.revelar(document);
        window.heroAnimado.capas($('.hero'));
    } else {
        $$('[data-entra], [data-texto-entra]').forEach(function (el) { el.setAttribute('data-visible', ''); });
    }

    // ---------- Cabecera: transparente sobre el hero, sólida al bajar ----------
    var cabecera = $('#cabecera');
    var alScroll = function () {
        if (cabecera) cabecera.classList.toggle('solida', window.scrollY > 24);
    };
    window.addEventListener('scroll', alScroll, { passive: true });
    alScroll();

    // ---------- Menú del celular ----------
    var boton = $('#menu-boton');
    var menu = $('#menu');

    // Con el menú abierto, lo de atrás no recibe foco ni clics.
    var fondo = ['#contenido', '.pie', '#wa-flotante', '.saltar'].map(function (s) { return $(s); }).filter(Boolean);

    function abrirMenu(abrir) {
        if (!boton || !menu) return;
        boton.setAttribute('aria-expanded', String(abrir));
        boton.setAttribute('aria-label', abrir ? 'Cerrar menú' : 'Abrir menú');
        menu.classList.toggle('abierto', abrir);
        cabecera.classList.toggle('menu-visible', abrir);
        document.documentElement.classList.toggle('menu-abierto', abrir);
        fondo.forEach(function (el) { el.inert = abrir; });
    }

    if (boton && menu) {
        boton.addEventListener('click', function () {
            abrirMenu(boton.getAttribute('aria-expanded') !== 'true');
        });
        $$('a', menu).forEach(function (a) {
            a.addEventListener('click', function () { abrirMenu(false); });
        });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && boton.getAttribute('aria-expanded') === 'true') {
                abrirMenu(false);
                boton.focus();
            }
        });
        window.addEventListener('resize', function () {
            if (window.innerWidth > 980) abrirMenu(false);
        });
    }

    // ---------- Link activo según la sección ----------
    var linksMenu = $$('.menu-link[href^="#"]');
    if (linksMenu.length && 'IntersectionObserver' in window) {
        var espia = new IntersectionObserver(function (entradas) {
            entradas.forEach(function (e) {
                if (!e.isIntersecting) return;
                linksMenu.forEach(function (a) {
                    a.classList.toggle('activo', a.getAttribute('href') === '#' + e.target.id);
                });
            });
        }, { rootMargin: '-45% 0px -50% 0px' });
        $$('main section[id]').forEach(function (s) { espia.observe(s); });
    }

    // ---------- Preguntas: una abierta por vez ----------
    var preguntas = $$('.pregunta');
    preguntas.forEach(function (d) {
        d.addEventListener('toggle', function () {
            if (!d.open) return;
            preguntas.forEach(function (otra) { if (otra !== d) otra.open = false; });
        });
    });

    // ---------- Formulario: arma el mensaje para WhatsApp o email ----------
    var form = $('#formulario');
    if (form) {
        var NOMBRES = {
            'carta-natal': 'Carta Natal',
            'revolucion-solar': 'Revolución Solar',
            'coaching': 'Coaching Ontológico'
        };
        var nacimiento = $('#nacimiento');
        var nacimientoTitulo = $('#nacimiento-titulo');
        var regalo = $('#f-regalo');
        var fecha = $('#f-fecha');
        var hora = $('#f-hora');
        var sinHora = $('#f-sin-hora');
        var previa = $('#vista-previa');
        var linkMail = $('#enviar-mail');

        var dos = function (n) { return (n < 10 ? '0' : '') + n; };
        var hoy = new Date();
        fecha.max = hoy.getFullYear() + '-' + dos(hoy.getMonth() + 1) + '-' + dos(hoy.getDate());

        // "1990-03-12" → "12/03/1990" sin pasar por Date (evita el corrimiento de un día).
        // Fuera de rango (antes de 1900 o en el futuro) no se manda.
        var fechaLinda = function (v) {
            var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v || '');
            if (!m || v < fecha.min || v > fecha.max) return '';
            return m[3] + '/' + m[2] + '/' + m[1];
        };
        var valor = function (nombre) {
            var el = form.elements[nombre];
            return el && el.value ? String(el.value).trim() : '';
        };
        var servicioElegido = function () {
            var r = form.querySelector('input[name="servicio"]:checked');
            return r ? r.value : '';
        };
        var esAstro = function (s) { return s === 'carta-natal' || s === 'revolucion-solar'; };

        var armarMensaje = function () {
            var servicio = servicioElegido();
            var nombre = valor('nombre');
            var esRegalo = regalo.checked;
            var lineas = [nombre ? '¡Hola, María! Soy ' + nombre + '.' : '¡Hola, María!'];

            if (NOMBRES[servicio]) {
                lineas.push(esRegalo
                    ? 'Quiero regalar una sesión de ' + NOMBRES[servicio] + '.'
                    : 'Me interesa una sesión de ' + NOMBRES[servicio] + '.');
            } else if (servicio === 'no-se') {
                lineas.push(esRegalo
                    ? 'Quiero regalar una sesión y me gustaría que me ayudes a elegir cuál.'
                    : 'Me gustaría que me orientes sobre qué sesión me conviene.');
            } else {
                lineas.push(esRegalo
                    ? 'Quiero regalar una sesión. ¿Me contás cómo es?'
                    : 'Quería consultarte por tus sesiones.');
            }

            if (esAstro(servicio)) {
                var f = fechaLinda(valor('fecha'));
                var h = sinHora.checked ? 'no la sé exacta' : valor('hora');
                var l = valor('lugar');
                if (f || h || l) {
                    lineas.push('');
                    lineas.push(esRegalo ? 'Datos de nacimiento de quien lo recibe:' : 'Mis datos de nacimiento:');
                    if (f) lineas.push('• Fecha: ' + f);
                    if (h) lineas.push('• Hora: ' + h);
                    if (l) lineas.push('• Lugar: ' + l);
                }
            }

            var mensaje = valor('mensaje');
            if (mensaje) {
                lineas.push('');
                lineas.push(mensaje);
            }
            return lineas.join('\n');
        };

        var actualizar = function () {
            nacimiento.hidden = !esAstro(servicioElegido());
            nacimientoTitulo.textContent = regalo.checked
                ? 'Datos de nacimiento de quien lo recibe'
                : 'Tus datos de nacimiento';
            hora.disabled = sinHora.checked;
            var texto = armarMensaje();
            previa.textContent = texto;
            linkMail.href = 'mailto:' + EMAIL +
                '?subject=' + encodeURIComponent('Consulta desde la web') +
                '&body=' + encodeURIComponent(texto);
        };

        form.addEventListener('input', actualizar);
        form.addEventListener('change', actualizar);
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            var url = 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(armarMensaje());
            var ventana = window.open(url, '_blank');
            if (ventana) ventana.opener = null;
            else window.location.href = url;
        });

        // Los links de cada servicio dejan elegida esa sesión en el formulario.
        $$('[data-servicio]').forEach(function (a) {
            a.addEventListener('click', function () {
                var r = form.querySelector('input[name="servicio"][value="' + a.getAttribute('data-servicio') + '"]');
                if (r) {
                    r.checked = true;
                    actualizar();
                }
            });
        });

        actualizar();
        form.hidden = false;
    }

    // ---------- WhatsApp flotante: aparece después del hero ----------
    var flotante = $('#wa-flotante');
    var hero = $('.hero');
    var consulta = $('#consulta');
    if (flotante && hero && 'IntersectionObserver' in window) {
        flotante.href = 'https://wa.me/' + WHATSAPP + '?text=' +
            encodeURIComponent('¡Hola, María! Quería consultarte por tus sesiones.');
        var enHero = true;
        var enConsulta = false;
        var refrescar = function () {
            flotante.classList.toggle('visible', !enHero && !enConsulta);
        };
        // -100px arriba: lo que queda tapado por la cabecera no cuenta como visible.
        new IntersectionObserver(function (e) {
            enHero = e[0].isIntersecting;
            refrescar();
        }, { rootMargin: '-100px 0px 0px 0px' }).observe(hero);
        if (consulta) {
            new IntersectionObserver(function (e) {
                enConsulta = e[0].isIntersecting;
                refrescar();
            }, { rootMargin: '-100px 0px -30% 0px' }).observe(consulta);
        }
    }

    // Con movimiento reducido, los links internos saltan sin animar.
    if (reducido) document.documentElement.style.scrollBehavior = 'auto';
})();
