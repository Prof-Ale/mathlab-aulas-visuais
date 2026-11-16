/* Gerado automaticamente a partir de tools/*.mjs */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.MathLabRacional = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
// Aritmética racional EXATA (BigInt) para conferir cálculos de materiais didáticos.
// Sem dependências. Sintaxe aceita: números (ponto ou vírgula decimal), + - * / ^ ( ), × ÷ − · e % pós-fixo.
// Exemplos: "4.75 + 6.8", "2/3 * 3/4", "480 * 25%", "(2+3)/(3+4)", "2^10".

const abs = (a) => (a < 0n ? -a : a);
const mdc = (a, b) => {
  a = abs(a);
  b = abs(b);
  while (b) [a, b] = [b, a % b];
  return a;
};

class Racional {
  constructor(n, d = 1n) {
    if (d === 0n) throw new Error("divisão por zero");
    if (d < 0n) {
      n = -n;
      d = -d;
    }
    const g = mdc(n, d) || 1n;
    this.n = n / g;
    this.d = d / g;
  }
  mais(o) { return new Racional(this.n * o.d + o.n * this.d, this.d * o.d); }
  menos(o) { return new Racional(this.n * o.d - o.n * this.d, this.d * o.d); }
  vezes(o) { return new Racional(this.n * o.n, this.d * o.d); }
  dividido(o) {
    if (o.n === 0n) throw new Error("divisão por zero");
    return new Racional(this.n * o.d, this.d * o.n);
  }
  potencia(o) {
    if (o.d !== 1n) throw new Error("expoente precisa ser inteiro");
    let e = o.n;
    if (abs(e) > 1000n) throw new Error("expoente grande demais");
    let base = e < 0n ? new Racional(this.d, this.n) : this;
    e = abs(e);
    let r = new Racional(1n);
    for (let i = 0n; i < e; i++) r = r.vezes(base);
    return r;
  }
  igual(o) { return this.n === o.n && this.d === o.d; }
  toString() { return this.d === 1n ? `${this.n}` : `${this.n}/${this.d}`; }
}

function tokenizar(texto) {
  const s = texto
    .replace(/[×·]/g, "*")
    .replace(/÷/g, "/")
    .replace(/[−–]/g, "-")
    .replace(/(\d),(\d)/g, "$1.$2")
    .replace(/\s+/g, "");
  const tokens = [];
  const re = /\d+(?:\.\d+)?|[-+*/^()%]/gy;
  let m;
  let fim = 0;
  while ((m = re.exec(s)) !== null) {
    tokens.push(m[0]);
    fim = re.lastIndex;
  }
  if (fim !== s.length) throw new Error(`caractere inválido em "${texto}" (posição ${fim})`);
  return tokens;
}

function numero(t) {
  const [i, f = ""] = t.split(".");
  return new Racional(BigInt(i + f), 10n ** BigInt(f.length));
}

function avaliar(texto) {
  const tk = tokenizar(String(texto));
  let p = 0;
  const ver = () => tk[p];
  const prox = () => tk[p++];

  function expr() {
    let v = termo();
    while (ver() === "+" || ver() === "-") v = prox() === "+" ? v.mais(termo()) : v.menos(termo());
    return v;
  }
  function termo() {
    let v = unario();
    while (ver() === "*" || ver() === "/") v = prox() === "*" ? v.vezes(unario()) : v.dividido(unario());
    return v;
  }
  function unario() {
    if (ver() === "-") { prox(); return unario().vezes(new Racional(-1n)); }
    if (ver() === "+") { prox(); return unario(); }
    return potencia();
  }
  function potencia() {
    let b = pos();
    if (ver() === "^") { prox(); b = b.potencia(unario()); }
    return b;
  }
  function pos() {
    let v = primario();
    while (ver() === "%") { prox(); v = v.dividido(new Racional(100n)); }
    return v;
  }
  function primario() {
    const t = prox();
    if (t === undefined) throw new Error(`expressão incompleta: "${texto}"`);
    if (t === "(") {
      const v = expr();
      if (prox() !== ")") throw new Error(`parêntese não fechado em "${texto}"`);
      return v;
    }
    if (/^\d/.test(t)) return numero(t);
    throw new Error(`símbolo inesperado "${t}" em "${texto}"`);
  }

  const r = expr();
  if (p !== tk.length) throw new Error(`sobrou "${tk.slice(p).join("")}" em "${texto}"`);
  return r;
}

function confere(expressao, esperado) {
  const a = avaliar(expressao);
  const b = avaliar(esperado);
  return { ok: a.igual(b), obtido: a.toString(), esperado: b.toString() };
}

  return { Racional, avaliar, confere };
});
