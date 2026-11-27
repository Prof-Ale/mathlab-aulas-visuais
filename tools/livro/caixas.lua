-- MathLab: filtro do Pandoc para o livro. Transforma "::: {.caixa tipo=... titulo=...}" em caixa colorida
-- (LaTeX/PDF) ou em bloco com classe CSS (EPUB/HTML) e tira símbolos que as fontes do PDF não têm.
local TIPOS = { objetivos=1, previos=1, problematizacao=1, contexto=1, conceito=1, exemplo=1, visual=1, atividade=1,
  exercicios=1, gabarito=1, avaliacao=1, acessibilidade=1, nota=1, destaque=1 }
local is_latex = FORMAT:match('latex') or FORMAT:match('pdf')

local function tex(s)
  local map = { ['\\']='\\textbackslash{}', ['{']='\\{', ['}']='\\}', ['$']='\\$', ['&']='\\&', ['%']='\\%',
    ['#']='\\#', ['_']='\\_', ['^']='\\textasciicircum{}', ['~']='\\textasciitilde{}' }
  return (s:gsub('[\\{}$&%%#_%^~]', map))
end

local function sem_pictogramas(s)
  local out = {}
  for _, c in utf8.codes(s) do
    local pic = (c >= 0x1F000 and c <= 0x1FFFF) or (c >= 0x2600 and c <= 0x27BF) or c == 0xFE0F or c == 0x200D
    if not pic then out[#out + 1] = utf8.char(c) end
  end
  return table.concat(out)
end

function Str(el)
  if is_latex then
    local t = sem_pictogramas(el.text)
    if t ~= el.text then return pandoc.Str(t) end
  end
end

function Div(el)
  if not el.classes:includes('caixa') then return nil end
  local tipo = el.attributes['tipo'] or 'nota'
  if not TIPOS[tipo] then tipo = 'nota' end
  local titulo = el.attributes['titulo'] or ''
  local rotulo = el.attributes['rotulo'] or ''
  if is_latex then
    local out = pandoc.List({ pandoc.RawBlock('latex', '\\begin{caixa' .. tipo .. '}{' .. tex(sem_pictogramas(rotulo)) .. '}{' .. tex(sem_pictogramas(titulo)) .. '}') })
    out:extend(el.content)
    out:insert(pandoc.RawBlock('latex', '\\end{caixa' .. tipo .. '}'))
    return out
  end
  local cab = pandoc.List({})
  if rotulo ~= '' then cab:insert(pandoc.Div({ pandoc.Plain({ pandoc.Str(rotulo) }) }, pandoc.Attr('', { 'caixa-rotulo' }))) end
  if titulo ~= '' and titulo ~= rotulo then cab:insert(pandoc.Div({ pandoc.Plain({ pandoc.Strong({ pandoc.Str(titulo) }) }) }, pandoc.Attr('', { 'caixa-titulo' }))) end
  cab:extend(el.content)
  return pandoc.Div(cab, pandoc.Attr('', { 'caixa', 'caixa-' .. tipo }))
end

-- capítulos sem número (ficha, glossário, respostas, referências) precisam atualizar o cabeçalho da página
function Header(el)
  if is_latex and el.level == 1 and el.classes:includes('unnumbered') then
    local t = tex(pandoc.utils.stringify(el))
    return { el, pandoc.RawBlock('latex', '\\markboth{' .. t .. '}{}') }
  end
end

-- figuras dentro de caixas não podem ser "flutuantes" no LaTeX: viram figura fixa com legenda
function Figure(el)
  if not is_latex then return nil end
  local img
  el:walk({ Image = function(i) if not img then img = i end end })
  if not img then return nil end
  local legenda = tex(sem_pictogramas(pandoc.utils.stringify(el.caption.long)))
  img.caption = {}
  local out = pandoc.List({ pandoc.RawBlock('latex', '\\begin{center}') })
  out:insert(pandoc.Plain({ img }))
  out:insert(pandoc.RawBlock('latex', (legenda ~= '' and ('\\captionof{figure}{' .. legenda .. '}') or '') .. '\\end{center}'))
  return out
end
