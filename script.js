/* =================================================================
   ANGELO GARCIA. Interações da página
   ================================================================= */
(function () {
  'use strict';

  /* ---------------------------------------------------------------
     1. CONTATO. Troque aqui e vale para a página inteira
     --------------------------------------------------------------- */
  var CONTATO = {
    whatsapp: '5547992406661',                       // DDI 55 + DDD 47 + número
    mensagem: 'Olá Angelo! Vi o site da Psy Comunic e quero falar sobre um projeto.'
  };

  var linkWpp = 'https://wa.me/' + CONTATO.whatsapp +
                '?text=' + encodeURIComponent(CONTATO.mensagem);

  document.querySelectorAll('[data-wpp]').forEach(function (el) {
    el.href = linkWpp;
    el.target = '_blank';
    el.rel = 'noopener';
  });

  var reduzido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------------
     2. Ano do rodapé
     --------------------------------------------------------------- */
  var ano = document.getElementById('ano');
  if (ano) ano.textContent = new Date().getFullYear();

  /* ---------------------------------------------------------------
     3. Nav, menu de tela cheia e botão flutuante
     --------------------------------------------------------------- */
  var nav = document.getElementById('nav');
  var burger = document.getElementById('burger');
  var mobile = document.getElementById('mobilemenu');
  var float = document.querySelector('.float-wpp');

  function aoRolar() {
    var y = window.scrollY;
    nav.classList.toggle('is-scrolled', y > 24);
    // 280px: logo depois da primeira dobra, para o atalho existir cedo
    if (float) float.classList.toggle('is-visible', y > 280);
  }
  window.addEventListener('scroll', aoRolar, { passive: true });
  aoRolar();

  function fecharMenu() {
    mobile.classList.remove('is-open');
    mobile.hidden = true;
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Abrir menu');
    document.body.style.overflow = '';
  }

  if (burger) {
    burger.addEventListener('click', function () {
      if (burger.getAttribute('aria-expanded') === 'true') { fecharMenu(); return; }
      mobile.hidden = false;
      burger.setAttribute('aria-expanded', 'true');
      burger.setAttribute('aria-label', 'Fechar menu');
      document.body.style.overflow = 'hidden';
      // no quadro seguinte, para a transição de entrada acontecer
      requestAnimationFrame(function () { mobile.classList.add('is-open'); });
    });
    mobile.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', fecharMenu);
    });
    window.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !mobile.hidden) fecharMenu();
    });
  }

  /* ---------------------------------------------------------------
     4. Revelação dos blocos ao entrar na viewport
     --------------------------------------------------------------- */
  var alvos = document.querySelectorAll('.reveal');
  if (reduzido || !('IntersectionObserver' in window)) {
    alvos.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var obs = new IntersectionObserver(function (ents) {
      ents.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); obs.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    alvos.forEach(function (el) { obs.observe(el); });
  }

  /* ---------------------------------------------------------------
     5. Contadores da prova social
     --------------------------------------------------------------- */
  document.querySelectorAll('[data-count]').forEach(function (el) {
    var alvo = parseInt(el.dataset.count, 10);
    if (reduzido || !('IntersectionObserver' in window)) { el.textContent = alvo; return; }
    var o = new IntersectionObserver(function (ents) {
      ents.forEach(function (e) {
        if (!e.isIntersecting) return;
        o.unobserve(el);
        var ini = performance.now(), dur = 1500;
        (function tick(agora) {
          var p = Math.min((agora - ini) / dur, 1);
          el.textContent = Math.round(alvo * (1 - Math.pow(1 - p, 3)));
          if (p < 1) requestAnimationFrame(tick);
        })(ini);
      });
    }, { threshold: 0.6 });
    o.observe(el);
  });

  /* ---------------------------------------------------------------
     6. Cards de projeto: clique percorre a página do print

     No desktop o percurso já acontece no hover, por CSS. No toque não
     existe hover, então o clique liga a classe. Só um card percorre por
     vez: doze páginas rolando juntas viram ruído.
     --------------------------------------------------------------- */
  var cards = document.querySelectorAll('.work');
  cards.forEach(function (card) {
    card.addEventListener('click', function () {
      var abrindo = !card.classList.contains('is-rolando');
      cards.forEach(function (outro) {
        outro.classList.remove('is-rolando');
        outro.setAttribute('aria-expanded', 'false');
      });
      if (abrindo) {
        card.classList.add('is-rolando');
        card.setAttribute('aria-expanded', 'true');
      }
    });
  });

  /* ---------------------------------------------------------------
     7. Posição do cursor, usada pelas partículas do cérebro
     --------------------------------------------------------------- */
  var mouseX = -9999, mouseY = -9999;
  document.addEventListener('mousemove', function (e) {
    mouseX = e.clientX; mouseY = e.clientY;
  }, { passive: true });

  /* ---------------------------------------------------------------
     7. Paleta das partículas
     --------------------------------------------------------------- */
  var VIOLETA = '#8052ff', LILAS = '#9a7bff', AMBAR = '#ffb829',
      BRANCO = '#ffffff', TEAL = '#15846e', MAGENTA = '#e05cc8',
      AZUL = '#4d7cff', CINZA = '#c9c9c9';
  var PALETA = [VIOLETA, VIOLETA, LILAS, AMBAR, AMBAR, TEAL, MAGENTA, AZUL];

  function ajustar(canvas, ctx) {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var r = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.round(r.width * dpr));
    canvas.height = Math.max(1, Math.round(r.height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { w: r.width, h: r.height };
  }

  function triangulo(ctx, x, y, t, cor, alpha) {
    ctx.beginPath();
    ctx.moveTo(x, y - t);
    ctx.lineTo(x + t * 0.87, y + t * 0.5);
    ctx.lineTo(x - t * 0.87, y + t * 0.5);
    ctx.closePath();
    ctx.strokeStyle = cor;
    ctx.globalAlpha = alpha;
    ctx.stroke();
  }

  /* ---------------------------------------------------------------
     8. CÉREBRO DE PARTÍCULAS (hero)

     1. desenho a silhueta num canvas invisível de 300×300, pintando
        cada região com uma cor-código:
          vermelho = miolo · verde = circunvoluções · azul = contorno
     2. leio os pixels e sorteio milhares de posições dentro de cada
        região. É isso que faz o formato aparecer
     3. dou profundidade (z) a cada partícula, giro devagar em torno
        do eixo vertical e empurro quem chega perto do cursor
     --------------------------------------------------------------- */

  // Curvas do córtex: [x0,y0, c1x,c1y, c2x,c2y, x1,y1] em espaço 300×300
  var CORTEX = [
    [150, 28, 205, 18, 258, 46, 268, 96],
    [268, 96, 292, 118, 288, 158, 262, 172],
    [262, 172, 258, 196, 240, 210, 218, 206],
    [218, 206, 206, 226, 178, 232, 160, 218],
    [160, 218, 140, 234, 108, 230, 96, 210],
    [96, 210, 64, 212, 40, 190, 42, 162],
    [42, 162, 16, 148, 14, 108, 38, 92],
    [38, 92, 40, 54, 74, 26, 112, 30],
    [112, 30, 124, 24, 138, 24, 150, 28]
  ];
  var CX0 = 150, CY0 = 122;

  function tracarCortex(c) {
    c.beginPath();
    c.moveTo(CORTEX[0][0], CORTEX[0][1]);
    for (var i = 0; i < CORTEX.length; i++) {
      var s = CORTEX[i];
      c.bezierCurveTo(s[2], s[3], s[4], s[5], s[6], s[7]);
    }
    c.closePath();
  }

  function pontosContorno(passos) {
    var out = [];
    for (var i = 0; i < CORTEX.length; i++) {
      var s = CORTEX[i];
      for (var k = 0; k < passos; k++) {
        var t = k / passos, u = 1 - t;
        var a = u * u * u, b = 3 * u * u * t, cc = 3 * u * t * t, d = t * t * t;
        out.push({
          x: a * s[0] + b * s[2] + cc * s[4] + d * s[6],
          y: a * s[1] + b * s[3] + cc * s[5] + d * s[7]
        });
      }
    }
    return out;
  }

  function tracarCerebelo(c) {
    c.beginPath();
    c.ellipse(228, 212, 46, 33, -0.22, 0, Math.PI * 2);
    c.closePath();
  }

  function tracarTronco(c) {
    c.beginPath();
    c.moveTo(184, 198);
    c.bezierCurveTo(190, 234, 189, 262, 183, 290);
    c.lineTo(211, 290);
    c.bezierCurveTo(216, 258, 218, 228, 216, 200);
    c.closePath();
  }

  var cvs = document.getElementById('constellation');
  if (cvs) {
    var ctx = cvs.getContext('2d');
    var dim = ajustar(cvs, ctx);
    var movel = window.innerWidth < 760;

    /* ---- mapa de regiões ---- */
    var off = document.createElement('canvas');
    off.width = off.height = 300;
    var octx = off.getContext('2d', { willReadFrequently: true });

    octx.fillStyle = '#ff0000';
    tracarCortex(octx); octx.fill();
    tracarCerebelo(octx); octx.fill();
    tracarTronco(octx); octx.fill();

    // circunvoluções: anéis concêntricos ondulados
    var borda = pontosContorno(26);
    octx.strokeStyle = '#00ff00';
    octx.lineJoin = 'round';
    for (var anelN = 1; anelN <= 7; anelN++) {
      var fator = 1 - anelN * 0.118;
      var freq = 0.30 + anelN * 0.055;
      var amp = 2.4 + anelN * 1.25;
      var fase = anelN * 1.73;
      octx.lineWidth = anelN < 3 ? 2.4 : 2.0;
      octx.beginPath();
      for (var i = 0; i <= borda.length; i++) {
        var p = borda[i % borda.length];
        var dx = p.x - CX0, dy = p.y - CY0;
        var len = Math.sqrt(dx * dx + dy * dy) || 1;
        var f = fator + (Math.sin(i * freq + fase) * amp) / len;
        var x = CX0 + dx * f, y = CY0 + dy * f;
        if (i === 0) octx.moveTo(x, y); else octx.lineTo(x, y);
      }
      octx.stroke();
    }
    // estrias do cerebelo
    octx.lineWidth = 1.8;
    for (var e = 1; e <= 4; e++) {
      octx.beginPath();
      octx.ellipse(228, 212, 46 - e * 9, 33 - e * 6.5, -0.22, 0, Math.PI * 2);
      octx.stroke();
    }

    // contorno externo aceso
    octx.strokeStyle = '#0000ff';
    octx.lineWidth = 2.6;
    tracarCortex(octx); octx.stroke();
    tracarCerebelo(octx); octx.stroke();
    tracarTronco(octx); octx.stroke();

    /* ---- classificação dos pixels ---- */
    var px32 = octx.getImageData(0, 0, 300, 300).data;
    var LB = [], LC = [], LM = [];
    for (var yy = 0; yy < 300; yy++) {
      for (var xx = 0; xx < 300; xx++) {
        var o = (yy * 300 + xx) * 4;
        if (px32[o + 3] < 100) continue;
        if (px32[o + 2] > 110) { LB.push(xx, yy); }
        else if (px32[o + 1] > 110) { LC.push(xx, yy); }
        else if (px32[o] > 110) { LM.push(xx, yy); }
      }
    }

    /* ---- partículas ---- */
    var RECEITA = {
      borda: { cores: [BRANCO, BRANCO, AMBAR, AMBAR, LILAS, VIOLETA], tMin: .85, tMax: 1.35, aMin: .78, aMax: 1 },
      gyri:  { cores: [AMBAR, AMBAR, BRANCO, CINZA, VIOLETA, LILAS, MAGENTA, TEAL], tMin: .7, tMax: 1.15, aMin: .5, aMax: .95 },
      miolo: { cores: [VIOLETA, LILAS, CINZA, TEAL, AZUL, MAGENTA, AMBAR], tMin: .5, tMax: .95, aMin: .14, aMax: .5 }
    };

    var pontos = [];
    function semearRegiao(lista, qtd, receita) {
      if (!lista.length) return;
      var n = lista.length / 2;
      for (var i = 0; i < qtd; i++) {
        var j = (Math.random() * n) | 0;
        var sx = lista[j * 2] + Math.random() - 0.5;
        var sy = lista[j * 2 + 1] + Math.random() - 0.5;
        var nx = (sx - 150) / 150, ny = (sy - 152) / 150;
        var d = Math.min(1, Math.sqrt(nx * nx + ny * ny));
        var domo = Math.sqrt(Math.max(0, 1 - d * d));
        pontos.push({
          x: nx, y: ny,
          z: (Math.random() * 2 - 1) * domo * 0.55,
          ox: 0, oy: 0,                                    // deslocamento pelo cursor
          t: receita.tMin + Math.random() * (receita.tMax - receita.tMin),
          a: receita.aMin + Math.random() * (receita.aMax - receita.aMin),
          cor: receita.cores[(Math.random() * receita.cores.length) | 0],
          tw: 0.0006 + Math.random() * 0.0022,
          ph: Math.random() * 6.28
        });
      }
    }

    var densidade = movel ? 0.34 : 1;
    semearRegiao(LB, Math.round(420 * densidade), RECEITA.borda);
    semearRegiao(LC, Math.round(1450 * densidade), RECEITA.gyri);
    semearRegiao(LM, Math.round(780 * densidade), RECEITA.miolo);
    pontos.sort(function (a, b) { return a.z - b.z; });

    /* ---- sprites: cada triângulo é rasterizado uma vez só ---- */
    var TAMS = [3, 4, 5, 6, 8, 10, 13];
    var sprites = {};
    function montarSprites() {
      sprites = {};
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      [BRANCO, AMBAR, VIOLETA, LILAS, TEAL, MAGENTA, AZUL, CINZA].forEach(function (cor) {
        TAMS.forEach(function (tam, idx) {
          var lado = Math.ceil(tam * dpr) + 3;
          var cn = document.createElement('canvas');
          cn.width = cn.height = lado;
          var c = cn.getContext('2d');
          c.setTransform(dpr, 0, 0, dpr, 0, 0);
          var m = (lado / dpr) / 2, r = tam / 2;
          c.beginPath();
          c.moveTo(m, m - r);
          c.lineTo(m + r * 0.87, m + r * 0.5);
          c.lineTo(m - r * 0.87, m + r * 0.5);
          c.closePath();
          c.strokeStyle = cor;
          c.lineWidth = 1 / dpr;
          c.stroke();
          sprites[cor + idx] = { cv: cn, css: lado / dpr };
        });
      });
    }
    montarSprites();

    function bucket(tam) {
      var melhor = 0, dif = 1e9;
      for (var i = 0; i < TAMS.length; i++) {
        var d = Math.abs(TAMS[i] - tam);
        if (d < dif) { dif = d; melhor = i; }
      }
      return melhor;
    }

    /* ---- animação ---- */
    var alvoX = 0, alvoY = 0, curX = 0, curY = 0, rodando = true, t0 = 0;

    window.addEventListener('mousemove', function (ev) {
      alvoX = (ev.clientY / window.innerHeight - 0.5) * 0.30;
      alvoY = (ev.clientX / window.innerWidth - 0.5) * 0.55;
    }, { passive: true });

    var RAIO = 110, RAIO2 = RAIO * RAIO;

    function desenhar(agora) {
      if (!t0) t0 = agora;
      var t = reduzido ? 0 : agora - t0;
      var w = dim.w, h = dim.h;
      ctx.clearRect(0, 0, w, h);

      curX += (alvoX - curX) * 0.045;
      curY += (alvoY - curY) * 0.045;

      var rot = Math.sin(t * 0.00019) * 0.30 + curY;
      var sr = Math.sin(rot), cr = Math.cos(rot);
      var escala = Math.min(w, h) * 0.52;
      var cx = w / 2;
      var cy = h / 2 + Math.sin(t * 0.00027) * 6 + curX * 26;

      // posição do cursor dentro do canvas
      var caixa = cvs.getBoundingClientRect();
      var mx = mouseX - caixa.left, my = mouseY - caixa.top;
      var temMouse = mx > -RAIO && my > -RAIO && mx < w + RAIO && my < h + RAIO;

      for (var i = 0; i < pontos.length; i++) {
        var p = pontos[i];
        var x1 = p.x * cr - p.z * sr;
        var z1 = p.x * sr + p.z * cr;
        var persp = 2.5 / (2.5 + z1);

        var bx = cx + x1 * escala * persp;
        var by = cy + p.y * escala * persp;

        // repulsão: as partículas abrem caminho para o cursor
        if (temMouse && !reduzido) {
          var ddx = bx - mx, ddy = by - my;
          var dist2 = ddx * ddx + ddy * ddy;
          if (dist2 < RAIO2 && dist2 > 0.01) {
            var forca = (1 - Math.sqrt(dist2) / RAIO);
            var inv = forca * forca * 46 / Math.sqrt(dist2);
            p.ox += (ddx * inv - p.ox) * 0.18;
            p.oy += (ddy * inv - p.oy) * 0.18;
          } else { p.ox *= 0.88; p.oy *= 0.88; }
        } else { p.ox *= 0.88; p.oy *= 0.88; }

        var tam = p.t * 2 * persp;
        var sp = sprites[p.cor + bucket(tam)];
        if (!sp) continue;

        var brilho = reduzido ? 1 : 0.78 + 0.22 * Math.sin(t * p.tw + p.ph);
        ctx.globalAlpha = Math.max(0.05, Math.min(1, p.a * brilho * (0.42 + 0.58 * persp)));
        ctx.drawImage(sp.cv,
          bx + p.ox - sp.css / 2,
          by + p.oy - sp.css / 2,
          sp.css, sp.css);
      }
      ctx.globalAlpha = 1;
      if (rodando) requestAnimationFrame(desenhar);
    }

    window.addEventListener('resize', function () {
      dim = ajustar(cvs, ctx); montarSprites();
    }, { passive: true });
    document.addEventListener('visibilitychange', function () {
      rodando = !document.hidden;
      if (rodando) requestAnimationFrame(desenhar);
    });
    requestAnimationFrame(desenhar);
  }

  /* ---------------------------------------------------------------
     9. Campo ambiente: triângulos à deriva atrás da página
     --------------------------------------------------------------- */
  var amb = document.getElementById('ambient');
  if (amb) {
    var actx = amb.getContext('2d');
    var adim = ajustar(amb, actx);
    var QTD = window.innerWidth < 760 ? 40 : 110;
    var motas = [];

    function semear() {
      motas = [];
      for (var i = 0; i < QTD; i++) {
        motas.push({
          x: Math.random() * adim.w,
          y: Math.random() * adim.h,
          t: 1 + Math.random() * 2.4,
          vx: (Math.random() - 0.5) * 0.13,
          vy: -0.05 - Math.random() * 0.16,
          a: 0.10 + Math.random() * 0.4,
          cor: PALETA[(Math.random() * PALETA.length) | 0]
        });
      }
    }
    semear();

    var ativo = true;
    function derivar() {
      actx.clearRect(0, 0, adim.w, adim.h);
      actx.lineWidth = 1;
      for (var i = 0; i < motas.length; i++) {
        var m = motas[i];
        if (!reduzido) { m.x += m.vx; m.y += m.vy; }
        if (m.y < -12) { m.y = adim.h + 12; m.x = Math.random() * adim.w; }
        if (m.x < -12) m.x = adim.w + 12;
        if (m.x > adim.w + 12) m.x = -12;
        triangulo(actx, m.x, m.y, m.t, m.cor, m.a);
      }
      actx.globalAlpha = 1;
      if (ativo && !reduzido) requestAnimationFrame(derivar);
    }

    window.addEventListener('resize', function () {
      adim = ajustar(amb, actx); semear();
      if (reduzido) derivar();
    }, { passive: true });
    document.addEventListener('visibilitychange', function () {
      ativo = !document.hidden;
      if (ativo && !reduzido) requestAnimationFrame(derivar);
    });
    derivar();
  }

})();
