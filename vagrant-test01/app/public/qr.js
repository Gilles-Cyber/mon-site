// Générateur de QR code minimal, sans dépendance (mode octets, correction d'erreur L, versions 1 à 5).
// Utilisation : qrSvg("http://192.168.56.10", 4)  ->  chaîne SVG
(function (global) {
  'use strict';
  // Par version (1..5) : mots de code totaux, mots de correction, positions des motifs d'alignement
  var TOTAL = [0, 26, 44, 70, 100, 134];
  var ECC   = [0, 7, 10, 15, 20, 26];
  var ALIGN = [null, [], [6, 18], [6, 22], [6, 26], [6, 30]];

  // --- Arithmétique de Reed-Solomon dans GF(256) ---
  var EXP = new Array(512), LOG = new Array(256);
  (function () {
    var x = 1;
    for (var i = 0; i < 255; i++) { EXP[i] = x; LOG[x] = i; x <<= 1; if (x & 0x100) x ^= 0x11D; }
    for (var j = 255; j < 512; j++) EXP[j] = EXP[j - 255];
  })();
  function gmul(a, b) { return a === 0 || b === 0 ? 0 : EXP[LOG[a] + LOG[b]]; }

  function rsRemainder(data, degree) {
    var gen = [1];                                   // polynôme générateur
    for (var i = 0; i < degree; i++) {
      var next = new Array(gen.length + 1).fill(0);
      for (var j = 0; j < gen.length; j++) {
        next[j] ^= gen[j];
        next[j + 1] ^= gmul(gen[j], EXP[i]);
      }
      gen = next;
    }
    var rem = new Array(degree).fill(0);
    data.forEach(function (b) {
      var factor = b ^ rem.shift();
      rem.push(0);
      for (var k = 0; k < degree; k++) rem[k] ^= gmul(gen[k + 1], factor);
    });
    return rem;
  }

  function utf8(str) { return Array.from(unescape(encodeURIComponent(str)), function (c) { return c.charCodeAt(0); }); }

  function qrMatrix(text) {
    var bytes = utf8(text), ver = 0, v;
    for (v = 1; v <= 5; v++) if (bytes.length <= Math.floor(((TOTAL[v] - ECC[v]) * 8 - 12) / 8)) { ver = v; break; }
    if (!ver) throw new Error('texte trop long');
    var dataCw = TOTAL[ver] - ECC[ver], size = 17 + 4 * ver;

    // 1. Bits de données : mode octets (0100) + longueur + octets + terminateur + remplissage
    var bits = [];
    function put(val, len) { for (var i = len - 1; i >= 0; i--) bits.push((val >>> i) & 1); }
    put(4, 4); put(bytes.length, 8);
    bytes.forEach(function (b) { put(b, 8); });
    put(0, Math.min(4, dataCw * 8 - bits.length));
    while (bits.length % 8) bits.push(0);
    for (var pad = 0xEC; bits.length < dataCw * 8; pad ^= 0xEC ^ 0x11) put(pad, 8);
    var cw = [];
    for (var i = 0; i < bits.length; i += 8) cw.push(parseInt(bits.slice(i, i + 8).join(''), 2));
    cw = cw.concat(rsRemainder(cw, ECC[ver]));

    // 2. Matrice et motifs fixes
    var mod = [], fn = [];
    for (var y = 0; y < size; y++) { mod.push(new Array(size).fill(false)); fn.push(new Array(size).fill(false)); }
    function setFn(x, y, dark) { mod[y][x] = dark; fn[y][x] = true; }

    for (var t = 0; t < size; t++) { setFn(6, t, t % 2 === 0); setFn(t, 6, t % 2 === 0); }
    function finder(cx, cy) {
      for (var dy = -4; dy <= 4; dy++) for (var dx = -4; dx <= 4; dx++) {
        var d = Math.max(Math.abs(dx), Math.abs(dy)), x = cx + dx, y = cy + dy;
        if (x >= 0 && x < size && y >= 0 && y < size) setFn(x, y, d !== 2 && d !== 4);
      }
    }
    finder(3, 3); finder(size - 4, 3); finder(3, size - 4);
    var pos = ALIGN[ver], last = pos.length - 1;
    for (var a = 0; a < pos.length; a++) for (var b = 0; b < pos.length; b++) {
      if ((a === 0 && b === 0) || (a === 0 && b === last) || (a === last && b === 0)) continue;
      for (var dy2 = -2; dy2 <= 2; dy2++) for (var dx2 = -2; dx2 <= 2; dx2++)
        setFn(pos[a] + dx2, pos[b] + dy2, Math.max(Math.abs(dx2), Math.abs(dy2)) !== 1);
    }
    // Réserver les zones du format (redessinées plus bas)
    function formatBits(mask) {
      var data = (1 << 3) | mask, rem = data;      // niveau L = 01
      for (var i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
      return ((data << 10) | rem) ^ 0x5412;
    }
    function drawFormat(mask) {
      var f = formatBits(mask);
      function bit(i) { return ((f >>> i) & 1) !== 0; }
      for (var i = 0; i <= 5; i++) setFn(8, i, bit(i));
      setFn(8, 7, bit(6)); setFn(8, 8, bit(7)); setFn(7, 8, bit(8));
      for (i = 9; i < 15; i++) setFn(14 - i, 8, bit(i));
      for (i = 0; i < 8; i++) setFn(size - 1 - i, 8, bit(i));
      for (i = 8; i < 15; i++) setFn(8, size - 15 + i, bit(i));
      setFn(8, size - 8, true);                    // module sombre fixe
    }
    drawFormat(0);

    // 3. Placement des données en zigzag, puis masque 0 ((x+y) pair)
    var k = 0, total = cw.length * 8;
    for (var right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      for (var vert = 0; vert < size; vert++) for (var j = 0; j < 2; j++) {
        var x = right - j, up = ((right + 1) & 2) === 0, yy = up ? size - 1 - vert : vert;
        if (!fn[yy][x] && k < total) { mod[yy][x] = ((cw[k >>> 3] >>> (7 - (k & 7))) & 1) !== 0; k++; }
      }
    }
    for (var my = 0; my < size; my++) for (var mx = 0; mx < size; mx++)
      if (!fn[my][mx] && (mx + my) % 2 === 0) mod[my][mx] = !mod[my][mx];
    drawFormat(0);
    return mod;
  }

  // Dessin en SVG (zone blanche de 4 modules autour, comme l'exige la norme)
  function qrSvg(text, scale) {
    scale = scale || 4;
    var m = qrMatrix(text), n = m.length, q = 4, full = (n + 2 * q) * scale, path = '';
    for (var y = 0; y < n; y++) for (var x = 0; x < n; x++)
      if (m[y][x]) path += 'M' + ((x + q) * scale) + ' ' + ((y + q) * scale) + 'h' + scale + 'v' + scale + 'h-' + scale + 'z';
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + full + '" height="' + full + '" viewBox="0 0 ' + full + ' ' + full +
      '"><rect width="100%" height="100%" fill="#fff"/><path d="' + path + '" fill="#000"/></svg>';
  }

  global.qrSvg = qrSvg; global.qrMatrix = qrMatrix;
})(typeof window !== 'undefined' ? window : globalThis);
