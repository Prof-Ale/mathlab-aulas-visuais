/* Exportador PPTX (OOXML 16:9) 100% offline no navegador e em Node.js — zero dependências externas. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./core.js'));
  else root.MathLabPptx = factory(root.MathLabCore);
})(typeof self !== 'undefined' ? self : this, function (C) {
  'use strict';

  /* ---------- Utilitários UTF-8, XML e ZIP (STORE + CRC-32) ---------- */
  const encUtf8 = (str) => {
    if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(String(str));
    return Uint8Array.from(Buffer.from(String(str), 'utf8'));
  };

  const CRC_TABLE = (() => {
    const t = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
      t[i] = c >>> 0;
    }
    return t;
  })();

  function crc32(bytes) {
    let c = 0xffffffff;
    for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  }

  function buildZip(entries) {
    const localParts = [];
    const centralParts = [];
    let offset = 0;
    for (const e of entries) {
      const nameBytes = encUtf8(e.name);
      const data = e.data instanceof Uint8Array ? e.data : encUtf8(e.data);
      const crc = crc32(data);
      const lh = new Uint8Array(30 + nameBytes.length);
      const lv = new DataView(lh.buffer);
      lv.setUint32(0, 0x04034b50, true);
      lv.setUint16(4, 20, true);
      lv.setUint16(6, 0x0800, true); // UTF-8
      lv.setUint16(8, 0, true);      // STORE
      lv.setUint16(10, 0, true);
      lv.setUint16(12, 0x5621, true);
      lv.setUint32(14, crc, true);
      lv.setUint32(18, data.length, true);
      lv.setUint32(22, data.length, true);
      lv.setUint16(26, nameBytes.length, true);
      lv.setUint16(28, 0, true);
      lh.set(nameBytes, 30);
      localParts.push(lh, data);

      const ch = new Uint8Array(46 + nameBytes.length);
      const cv = new DataView(ch.buffer);
      cv.setUint32(0, 0x02014b50, true);
      cv.setUint16(4, 20, true);
      cv.setUint16(6, 20, true);
      cv.setUint16(8, 0x0800, true);
      cv.setUint16(10, 0, true);
      cv.setUint16(12, 0, true);
      cv.setUint16(14, 0x5621, true);
      cv.setUint32(16, crc, true);
      cv.setUint32(20, data.length, true);
      cv.setUint32(24, data.length, true);
      cv.setUint16(28, nameBytes.length, true);
      cv.setUint16(30, 0, true);
      cv.setUint16(32, 0, true);
      cv.setUint16(34, 0, true);
      cv.setUint16(36, 0, true);
      cv.setUint32(38, 0, true);
      cv.setUint32(42, offset, true);
      ch.set(nameBytes, 46);
      centralParts.push(ch);

      offset += lh.length + data.length;
    }
    const centralSize = centralParts.reduce((s, p) => s + p.length, 0);
    const eocd = new Uint8Array(22);
    const ev = new DataView(eocd.buffer);
    ev.setUint32(0, 0x06054b50, true);
    ev.setUint16(4, 0, true);
    ev.setUint16(6, 0, true);
    ev.setUint16(8, entries.length, true);
    ev.setUint16(10, entries.length, true);
    ev.setUint32(12, centralSize, true);
    ev.setUint32(16, offset, true);
    ev.setUint16(20, 0, true);

    const total = offset + centralSize + eocd.length;
    const out = new Uint8Array(total);
    let pos = 0;
    for (const p of localParts) { out.set(p, pos); pos += p.length; }
    for (const p of centralParts) { out.set(p, pos); pos += p.length; }
    out.set(eocd, pos);
    return out;
  }

  const xesc = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');

  /* ---------- Conversão de Markdown simples para parágrafos OOXML ---------- */
  function stripMdInline(s) {
    return String(s || '')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\$\$([^$]+)\$\$/g, '$1')
      .replace(/\$([^$]+)\$/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .trim();
  }

  function mdToLines(md) {
    const raw = String(md || '').replace(/\r\n?/g, '\n').split('\n');
    const out = [];
    for (const line of raw) {
      const t = line.trim();
      if (!t) continue;
      if (/^#{1,4}\s+/.test(t)) {
        out.push({ kind: 'head', text: stripMdInline(t.replace(/^#{1,4}\s+/, '')) });
      } else if (/^[-*•]\s+/.test(t)) {
        out.push({ kind: 'bullet', text: stripMdInline(t.replace(/^[-*•]\s+/, '')) });
      } else if (/^\d+[.)]\s+/.test(t)) {
        out.push({ kind: 'bullet', text: stripMdInline(t) });
      } else if (/^\|/.test(t)) {
        if (/^\|[\s-:|]+\|$/.test(t)) continue;
        const cells = t.split('|').map((c) => stripMdInline(c)).filter(Boolean);
        if (cells.length) out.push({ kind: 'bullet', text: cells.join(' · ') });
      } else {
        out.push({ kind: 'para', text: stripMdInline(t) });
      }
    }
    return out;
  }

  function makeParagraphsXml(lines, opts) {
    const o = opts || {};
    const sz = o.fontSize || 1800; // 18pt em centésimos de ponto
    const color = o.color || '1D2433';
    if (!lines.length) return '<a:p><a:endParaRPr lang="pt-BR"/></a:p>';
    return lines.map((ln) => {
      const isHead = ln.kind === 'head';
      const isBullet = ln.kind === 'bullet';
      const pPr = isBullet
        ? '<a:pPr marL="285750" indent="-171450" spcAft="80000"><a:buFont typeface="Arial"/><a:buChar char="•"/></a:pPr>'
        : '<a:pPr spcAft="90000"/>';
      const rSz = isHead ? Math.round(sz * 1.12) : sz;
      const rColor = isHead ? '0D2B5B' : color;
      const bAttr = isHead ? ' b="1"' : '';
      return '<a:p>' + pPr + '<a:r><a:rPr lang="pt-BR" sz="' + rSz + '"' + bAttr + ' dirty="0"><a:solidFill><a:srgbClr val="' + rColor + '"/></a:solidFill><a:latin typeface="Calibri"/></a:rPr><a:t>' + xesc(ln.text) + '</a:t></a:r></a:p>';
    }).join('');
  }

  function rectShape(id, name, x, y, cx, cy, fillHex, lineHex) {
    const ln = lineHex ? '<a:ln w="12700"><a:solidFill><a:srgbClr val="' + lineHex + '"/></a:solidFill></a:ln>' : '<a:ln><a:noFill/></a:ln>';
    return '<p:sp><p:nvSpPr><p:cNvPr id="' + id + '" name="' + xesc(name) + '"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>' +
      '<p:spPr><a:xfrm><a:off x="' + x + '" y="' + y + '"/><a:ext cx="' + cx + '" cy="' + cy + '"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:solidFill><a:srgbClr val="' + fillHex + '"/></a:solidFill>' + ln + '</p:spPr>' +
      '<p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:endParaRPr lang="pt-BR"/></a:p></p:txBody></p:sp>';
  }

  function textShape(id, name, x, y, cx, cy, bodyXml, opts) {
    const o = opts || {};
    const fill = o.fillHex ? '<a:solidFill><a:srgbClr val="' + o.fillHex + '"/></a:solidFill>' : '<a:noFill/>';
    const ln = o.lineHex ? '<a:ln w="19050"><a:solidFill><a:srgbClr val="' + o.lineHex + '"/></a:solidFill></a:ln>' : '<a:ln><a:noFill/></a:ln>';
    const anchor = o.anchor || 't';
    return '<p:sp><p:nvSpPr><p:cNvPr id="' + id + '" name="' + xesc(name) + '"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr>' +
      '<p:spPr><a:xfrm><a:off x="' + x + '" y="' + y + '"/><a:ext cx="' + cx + '" cy="' + cy + '"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom>' + fill + ln + '</p:spPr>' +
      '<p:txBody><a:bodyPr wrap="square" lIns="114300" tIns="91440" rIns="114300" bIns="91440" anchor="' + anchor + '"><a:normAutofit/></a:bodyPr><a:lstStyle/>' + bodyXml + '</p:txBody></p:sp>';
  }

  function singleRunP(text, sz, color, bold, align) {
    const al = align ? ' algn="' + align + '"' : '';
    const b = bold ? ' b="1"' : '';
    return '<a:p><a:pPr' + al + '/><a:r><a:rPr lang="pt-BR" sz="' + sz + '"' + b + ' dirty="0"><a:solidFill><a:srgbClr val="' + color + '"/></a:solidFill><a:latin typeface="Calibri"/></a:rPr><a:t>' + xesc(text) + '</a:t></a:r></a:p>';
  }

  function picShape(id, name, rId, x, y, cx, cy, descr) {
    return '<p:pic><p:nvPicPr><p:cNvPr id="' + id + '" name="' + xesc(name) + '" descr="' + xesc(descr || name) + '"/><p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr><p:nvPr/></p:nvPicPr>' +
      '<p:blipFill><a:blip r:embed="' + rId + '"/><a:stretch><a:fillRect/></a:stretch></p:blipFill>' +
      '<p:spPr><a:xfrm><a:off x="' + x + '" y="' + y + '"/><a:ext cx="' + cx + '" cy="' + cy + '"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr></p:pic>';
  }

  /* ---------- Montagem de cada slide XML (16:9 = 12192000 x 6858000 EMU) ---------- */
  const W = 12192000, H = 6858000;

  function buildSlideXml(s, idx, total, hasImg) {
    const shapes = [];
    let nextId = 2;
    const footerNum = (idx + 1) + ' / ' + total;

    if (s.kind === 'capa' || s.kind === 'fim') {
      shapes.push(rectShape(nextId++, 'BG', 0, 0, W, H, '0D2B5B'));
      shapes.push(rectShape(nextId++, 'GoldBarTop', 0, 0, W, 160000, 'F7B500'));
      shapes.push(rectShape(nextId++, 'GoldAccent', 762000, 1550000, 1143000, 70000, 'F7B500'));
      const kicker = s.kind === 'capa' ? 'MATHLAB AULAS VISUAIS · APRESENTAÇÃO' : 'FECHAMENTO DA AULA';
      shapes.push(textShape(nextId++, 'Kicker', 762000, 1050000, 10668000, 420000, singleRunP(kicker, 1400, 'F7B500', true)));
      shapes.push(textShape(nextId++, 'Title', 762000, 1780000, 10668000, 2100000, singleRunP(s.title, 4000, 'FFFFFF', true)));
      const metaTxt = (s.meta || []).join('  ·  ');
      if (metaTxt) shapes.push(textShape(nextId++, 'Meta', 762000, 3950000, 10668000, 620000, singleRunP(metaTxt, 2000, 'C3D0EE', false)));
      shapes.push(textShape(nextId++, 'Status', 762000, 5600000, 9200000, 520000, singleRunP(s.status || '', 1300, '0D2B5B', true), { fillHex: 'F7B500', anchor: 'ctr' }));
      shapes.push(textShape(nextId++, 'Num', 10400000, 6280000, 1200000, 380000, singleRunP(footerNum, 1200, 'C3D0EE', true, 'r')));
    } else {
      shapes.push(rectShape(nextId++, 'BG', 0, 0, W, H, 'FBF8F1'));
      shapes.push(rectShape(nextId++, 'HeaderBar', 0, 0, W, 980000, '0D2B5B'));
      shapes.push(rectShape(nextId++, 'GoldStripe', 0, 980000, W, 55000, 'F7B500'));
      const tagTxt = ((s.label || (s.kind === 'lista' ? 'Objetivos' : s.kind === 'refs' ? 'Referências' : 'Conteúdo'))).toUpperCase();
      shapes.push(textShape(nextId++, 'Tag', 550000, 110000, 3600000, 290000, singleRunP(tagTxt, 1100, 'F7B500', true)));
      shapes.push(textShape(nextId++, 'Title', 550000, 360000, 11092000, 540000, singleRunP(s.title, 2600, 'FFFFFF', true)));

      const hasCallout = !!(s.callout && s.callout.text);
      const bodyTop = 1220000;
      const bodyHeight = hasCallout ? 4020000 : 5050000;
      const bodyWidth = hasImg ? 6100000 : 11092000;

      let lines = [];
      if (s.kind === 'lista' || s.kind === 'refs') {
        lines = (s.items || []).map((x) => ({ kind: 'bullet', text: stripMdInline(x) }));
      } else {
        lines = mdToLines(s.content || '');
      }
      const fontSize = lines.length > 8 ? 1500 : lines.length > 5 ? 1700 : 1900;
      if (lines.length) {
        shapes.push(textShape(nextId++, 'Body', 550000, bodyTop, bodyWidth, bodyHeight, makeParagraphsXml(lines, { fontSize }), { fillHex: 'FFFFFF', lineHex: 'D5DCE8' }));
      }
      if (hasImg) {
        const picX = lines.length ? 6880000 : 1800000;
        const picW = lines.length ? 4760000 : 8592000;
        const picH = Math.min(bodyHeight, 4400000);
        shapes.push(picShape(nextId++, 'Figura', 'rId2', picX, bodyTop, picW, picH, s.title));
      }
      if (hasCallout) {
        const cMeta = (C.CALLOUTS && C.CALLOUTS[s.callout.kind]) || ['DESTAQUE', 'gold'];
        const coFill = s.callout.kind === 'atencao' ? 'FDE8E8' : s.callout.kind === 'sabia' ? 'E0F2FE' : 'FFF3C4';
        const coLine = s.callout.kind === 'atencao' ? 'C62828' : s.callout.kind === 'sabia' ? '1E88E5' : 'D97706';
        const coXml = singleRunP(cMeta[0] + ': ' + stripMdInline(s.callout.text), 1400, '0D2B5B', true);
        shapes.push(textShape(nextId++, 'Callout', 550000, 5380000, 11092000, 820000, coXml, { fillHex: coFill, lineHex: coLine, anchor: 'ctr' }));
      }
      shapes.push(textShape(nextId++, 'FootL', 550000, 6360000, 8500000, 340000, singleRunP('MathLab Aulas Visuais · Autoria Docente', 1050, '4D5D7E', false)));
      shapes.push(textShape(nextId++, 'FootR', 10400000, 6360000, 1242000, 340000, singleRunP(footerNum, 1100, '0D2B5B', true, 'r')));
    }

    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">' +
      '<p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>' +
      shapes.join('') +
      '</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>';
  }

  /* ---------- Rasterização opcional de SVG → PNG no navegador ---------- */
  function svgToPngBytes(svgText) {
    return new Promise((resolve) => {
      if (typeof document === 'undefined' || typeof Image === 'undefined' || typeof Blob === 'undefined' || typeof URL === 'undefined') {
        resolve(null);
        return;
      }
      try {
        const clean = C.sanitizeSvg(svgText);
        const blob = new Blob([clean], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const img = new Image();
        img.onload = () => {
          try {
            const w = Math.max(640, Math.min(1280, img.naturalWidth || 800));
            const h = Math.max(400, Math.min(900, img.naturalHeight || 520));
            const cv = document.createElement('canvas');
            cv.width = w; cv.height = h;
            const ctx = cv.getContext('2d');
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, w, h);
            ctx.drawImage(img, 0, 0, w, h);
            URL.revokeObjectURL(url);
            const dataUrl = cv.toDataURL('image/png');
            const b64 = dataUrl.split(',')[1] || '';
            const bin = atob(b64);
            const bytes = new Uint8Array(bin.length);
            for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
            resolve(bytes);
          } catch (e) { URL.revokeObjectURL(url); resolve(null); }
        };
        img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
        img.src = url;
      } catch (e) { resolve(null); }
    });
  }

  /* ---------- Montador síncrono e assíncrono do arquivo .pptx ---------- */
  function buildPptxBytes(material, opts) {
    opts = opts || {};
    const plan = C.slidePlan(material, { gabarito: !!opts.gabarito });
    const slides = plan.slides || [];
    const preImages = opts.images || {};
    const entries = [];
    const slideOverrides = [];
    const presRels = [
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>'
    ];
    const sldIdLst = [];
    let hasAnyPng = false;

    slides.forEach((s, i) => {
      const n = i + 1;
      const imgBytes = preImages[i] instanceof Uint8Array ? preImages[i] : null;
      const hasImg = !!imgBytes;
      if (hasImg) hasAnyPng = true;

      entries.push({ name: 'ppt/slides/slide' + n + '.xml', data: buildSlideXml(s, i, slides.length, hasImg) });
      const sRels = [
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>'
      ];
      if (hasImg) {
        entries.push({ name: 'ppt/media/image' + n + '.png', data: imgBytes });
        sRels.push('<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/image' + n + '.png"/>');
      }
      entries.push({
        name: 'ppt/slides/_rels/slide' + n + '.xml.rels',
        data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' + sRels.join('') + '</Relationships>'
      });
      slideOverrides.push('<Override PartName="/ppt/slides/slide' + n + '.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>');
      const rId = 'rId' + (n + 1);
      presRels.push('<Relationship Id="' + rId + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide' + n + '.xml"/>');
      sldIdLst.push('<p:sldId id="' + (256 + n) + '" r:id="' + rId + '"/>');
    });

    entries.push({
      name: '[Content_Types].xml',
      data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
        '<Default Extension="xml" ContentType="application/xml"/>' +
        (hasAnyPng ? '<Default Extension="png" ContentType="image/png"/>' : '') +
        '<Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>' +
        '<Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>' +
        '<Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>' +
        '<Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>' +
        slideOverrides.join('') + '</Types>'
    });
    entries.push({
      name: '_rels/.rels',
      data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/></Relationships>'
    });
    entries.push({
      name: 'ppt/presentation.xml',
      data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">' +
        '<p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst>' +
        '<p:sldIdLst>' + sldIdLst.join('') + '</p:sldIdLst>' +
        '<p:sldSz cx="' + W + '" cy="' + H + '" type="screen16x9"/><p:notesSz cx="6858000" cy="9144000"/></p:presentation>'
    });
    entries.push({
      name: 'ppt/_rels/presentation.xml.rels',
      data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' + presRels.join('') + '</Relationships>'
    });
    entries.push({
      name: 'ppt/slideMasters/slideMaster1.xml',
      data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">' +
        '<p:cSld><p:bg><p:bgPr><a:solidFill><a:srgbClr val="FBF8F1"/></a:solidFill><a:effectLst/></p:bgPr></p:bg><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/></p:spTree></p:cSld>' +
        '<p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/>' +
        '<p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst></p:sldMaster>'
    });
    entries.push({
      name: 'ppt/slideMasters/_rels/slideMaster1.xml.rels',
      data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>' +
        '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/></Relationships>'
    });
    entries.push({
      name: 'ppt/slideLayouts/slideLayout1.xml',
      data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" type="blank">' +
        '<p:cSld name="Blank"><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/></p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sldLayout>'
    });
    entries.push({
      name: 'ppt/slideLayouts/_rels/slideLayout1.xml.rels',
      data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/></Relationships>'
    });
    entries.push({
      name: 'ppt/theme/theme1.xml',
      data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="MathLab">' +
        '<a:themeElements><a:clrScheme name="MathLab">' +
        '<a:dk1><a:srgbClr val="0D2B5B"/></a:dk1><a:lt1><a:srgbClr val="FFFFFF"/></a:lt1>' +
        '<a:dk2><a:srgbClr val="1D2433"/></a:dk2><a:lt2><a:srgbClr val="FBF8F1"/></a:lt2>' +
        '<a:accent1><a:srgbClr val="0D2B5B"/></a:accent1><a:accent2><a:srgbClr val="F7B500"/></a:accent2>' +
        '<a:accent3><a:srgbClr val="1E88E5"/></a:accent3><a:accent4><a:srgbClr val="2E7D32"/></a:accent4>' +
        '<a:accent5><a:srgbClr val="9A4600"/></a:accent5><a:accent6><a:srgbClr val="6A1B9A"/></a:accent6>' +
        '<a:hlink><a:srgbClr val="1E88E5"/></a:hlink><a:folHlink><a:srgbClr val="6A1B9A"/></a:folHlink></a:clrScheme>' +
        '<a:fontScheme name="MathLab"><a:majorFont><a:latin typeface="Calibri"/><a:ea typeface=""/><a:cs typeface=""/></a:majorFont><a:minorFont><a:latin typeface="Calibri"/><a:ea typeface=""/><a:cs typeface=""/></a:minorFont></a:fontScheme>' +
        '<a:fmtScheme name="MathLab"><a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:fillStyleLst>' +
        '<a:lnStyleLst><a:ln w="9525"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln><a:ln w="12700"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln><a:ln w="19050"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln></a:lnStyleLst>' +
        '<a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst>' +
        '<a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:bgFillStyleLst></a:fmtScheme></a:themeElements></a:theme>'
    });

    return buildZip(entries);
  }

  async function toPptxBlob(material, opts) {
    opts = opts || {};
    const plan = C.slidePlan(material, { gabarito: !!opts.gabarito });
    const images = {};
    for (let i = 0; i < plan.slides.length; i++) {
      if (plan.slides[i].svg) {
        const png = await svgToPngBytes(plan.slides[i].svg);
        if (png) images[i] = png;
      }
    }
    const bytes = buildPptxBytes(material, Object.assign({}, opts, { images }));
    return new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' });
  }

  return { buildPptxBytes, toPptxBlob, buildZip };
});
