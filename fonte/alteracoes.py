#!/usr/bin/env python3
"""Reaplica as alterações da cópia genérica sobre o site espelhado.

Rode depois de atualizar a cópia com o fonte/espelhar.mjs (ele baixa de novo o
HTML, o style.css e as imagens originais e desfaz o que está abaixo).
Pode rodar quantas vezes quiser: o que já está aplicado é pulado.

uso (dentro da pasta MORADA.AI HTML):  python3 fonte/alteracoes.py
"""
import re
import shutil
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
SITE = RAIZ / 'site'
ALT = RAIZ / 'fonte' / 'alteracoes'
TEMA = SITE / 'wp-content' / 'themes' / 'moradaai-v2'
relato = []


def feito(msg):
    relato.append('  ok   ' + msg)


def pulado(msg):
    relato.append('  já   ' + msg)


def copiar_se_diferente(origem, destino, nome):
    if destino.exists() and destino.read_bytes() == origem.read_bytes():
        pulado(nome)
    else:
        shutil.copyfile(origem, destino)
        feito(nome)


# 1. Chamada final: foto panorâmica + véu na borda de cima da foto (style.css)
css_p = TEMA / 'style.css'
css = css_p.read_text(encoding='utf-8')
if 'belo-horizonte-panorama.jpg' in css:
    pulado('chamada final: foto panorâmica no style.css')
else:
    velho_fundo = "background: url('assets/home-v2/final/belo-horizonte-sky-background.png') center bottom / 100% auto no-repeat;"
    novo_fundo = "background: url('assets/home-v2/final/belo-horizonte-panorama.jpg') center bottom / 100% auto no-repeat;"
    velho_veu = """    background: linear-gradient(180deg,
        rgba(182, 234, 255, 0) 0%,
        rgba(182, 234, 255, 0) 12%,
        rgb(182, 234, 255) 16%,
        rgb(182, 234, 255) 18%,
        rgba(161, 228, 255, 0) 47%);"""
    novo_veu = """    /* Cópia: foto trocada em 18/11/2026 pela panorâmica (6336x2688, 2,36:1).
       Na largura toda ela começa a 36,7% da seção (antes 16%) e o céu dela
       acaba nas serras (~49%), então o véu desceu junto. */
    background: linear-gradient(180deg,
        rgba(182, 234, 255, 0) 0%,
        rgba(182, 234, 255, 0) 32.7%,
        rgb(182, 234, 255) 36.7%,
        rgb(182, 234, 255) 38.7%,
        rgba(161, 228, 255, 0) 52%);"""
    if css.count(velho_fundo) != 1 or css.count(velho_veu) != 1:
        sys.exit('ERRO: a regra da chamada final mudou no site; ajuste o alteracoes.py')
    css_p.write_text(css.replace(velho_fundo, novo_fundo).replace(velho_veu, novo_veu), encoding='utf-8')
    feito('chamada final: foto panorâmica no style.css')

# 2. Topo: faixa da cidade (desktop e celular)
for nome in ('img-belo-horizonte-layer-size.webp', 'img-belo-horizonte-layer-size-mobile.webp'):
    copiar_se_diferente(ALT / 'hero' / nome, TEMA / 'assets' / 'home-v2' / 'hero' / nome, 'topo: ' + nome)

# 3. Manifesto: capa nova do vídeo
copiar_se_diferente(ALT / 'manifesto-poster.jpg',
                    SITE / 'wp-content' / 'uploads' / '2026' / '11' / 'morada-os-manifesto-v05-poster.jpg',
                    'manifesto: capa do vídeo')

html_p = SITE / 'index.html'
html = html_p.read_text(encoding='utf-8')

# 4. Camada de grid e proporção
if 'copia-grid-css' in html:
    pulado('home: camada de grid e proporção')
else:
    if html.count('</head>') != 1:
        sys.exit('ERRO: </head> não encontrado uma única vez na home')
    html = html.replace('</head>', '<link rel="stylesheet" id="copia-grid-css" href="copia/grid-proporcao.css" media="all" />\n</head>')
    feito('home: camada de grid e proporção')

# 5. Fim da página: o formulário entra na chamada final; saem as duas seções azul-marinho
if 'copiaCtaForm' in html:
    pulado('fim: formulário dentro da chamada final')
else:
    m = re.search(r'<section id="form" class="preFooter"[\s\S]*?</section>\s*'
                  r'<section style="background-color:#00203C; color:white;">\s*'
                  r'(<div class="formWrapper">[\s\S]*?</script>\s*</div>)\s*</section>\s*', html)
    if not m:
        sys.exit('ERRO: bloco do formulário (preFooter) não encontrado')
    form = m.group(1)
    html = html[:m.start()] + html[m.end():]
    m2 = re.search(r'(<div class="sectionInner finalCtaV2Inner">)([\s\S]*?)(\s*</div>\s*</section>)', html)
    if not m2:
        sys.exit('ERRO: chamada final não encontrada')
    texto = re.sub(r'\s*<div class="finalCtaV2CtaWrap"[\s\S]*?</div>', '', m2.group(2), count=1)
    cartao = (
        '\n\t\t\t<div class="copiaCtaForm" id="form">'
        '\n\t\t\t\t<p class="copiaCtaForm__t">Fale com um especialista</p>'
        '\n\t\t\t\t<p class="copiaCtaForm__s">Preencha em menos de um minuto e a gente retorna para marcar a conversa.</p>'
        '\n\t\t\t\t' + form +
        '\n\t\t\t\t<p class="copiaCtaForm__lgpd">Ao enviar, você concorda com a nossa '
        '<a href="https://morada.ai/politica-de-privacidade/" target="_blank" rel="noopener">Política de privacidade</a>.</p>'
        '\n\t\t\t</div>')
    html = (html[:m2.start()] + m2.group(1)
            + '\n\t\t\t<div class="copiaCtaTexto">' + texto.rstrip() + '\n\t\t\t</div>'
            + cartao + m2.group(3) + html[m2.end():])
    feito('fim: formulário dentro da chamada final (sem o botão de diagnóstico e sem o pré-rodapé)')

# 6. Ordem: o vídeo do Manifesto vem antes da Diferenciação ("Nossa IA trabalha. Não só conversa.")
dif = re.search(r'<section id="diferenciacaoV2"[\s\S]*?</section>', html)
man = re.search(r'<section id="manifestoV2"[\s\S]*?</section>', html)
if not dif or not man:
    sys.exit('ERRO: seções Diferenciação/Manifesto não encontradas')
if man.start() < dif.start():
    pulado('ordem: manifesto antes da diferenciação')
else:
    entre = html[dif.end():man.start()]
    if entre.strip():
        sys.exit('ERRO: há conteúdo entre a Diferenciação e o Manifesto; troque à mão')
    html = html[:dif.start()] + man.group(0) + entre + dif.group(0) + html[man.end():]
    feito('ordem: manifesto antes da diferenciação')

html_p.write_text(html, encoding='utf-8')
print('Alterações da cópia:')
print('\n'.join(relato))
