# Trata uma foto de paisagem para nascer do céu azul da página: troca o céu do dia pelo
# azul linha a linha, preservando o detalhe (guindastes, prédios, serras), com um brilho
# suave no horizonte e névoa azul no fundo; o primeiro plano fica quase intacto.
# Precisa de numpy e Pillow (python3 -m venv v && v/bin/pip install numpy pillow).
#
# uso: python3 tratar-foto-ceu.py <entrada> <saida> [--horizonte 0.51] [--fim 0.62]
#        [--topo #0E55AE] [--meio #1D64BE] [--brilho #5C9BE0] [--detalhe 1]
#   --horizonte  fração da altura onde o céu acaba (sem ela, é achada sozinha: a última
#                linha com cara de céu claro e azulado)
#   --fim        fração da altura onde a troca termina (névoa sobre serras e cidade)
#   --detalhe    quanto do desenho do céu original (nuvens) fica acima do horizonte: 1 = tudo,
#                0 = céu liso (para a noite, 0.25: nuvens do pôr do sol ficariam vermelhas)
# Usada em 23/11/2026 para:
#   relacionamento-obra-15h.jpg -> relacionamento-obra-15h-ceu.jpg   (padrão)
#   belo-horizonte-panorama.jpg -> belo-horizonte-panorama-ceu.jpg   --horizonte 0.2 --fim 0.4
# e em 26/11/2026 (Vendas, noite):
#   belo-horizonte-panorama.jpg -> belo-horizonte-panorama-noite.jpg --horizonte 0.2 --fim 0.42
#        --topo '#03113C' --meio '#0A2456' --brilho '#2E5FA6' --detalhe 0.25
import sys, argparse, numpy as np
from PIL import Image
ap = argparse.ArgumentParser()
ap.add_argument('entrada'); ap.add_argument('saida')
ap.add_argument('--horizonte', type=float); ap.add_argument('--fim', type=float, default=.62)
ap.add_argument('--detalhe', type=float, default=1.0)
ap.add_argument('--topo', default='#0E55AE'); ap.add_argument('--meio', default='#1D64BE'); ap.add_argument('--brilho', default='#5C9BE0')
a = ap.parse_args()

im = np.asarray(Image.open(a.entrada).convert('RGB')).astype(np.float32)
H, W, _ = im.shape
t = (np.arange(H) + .5) / H
def ss(x): x = np.clip(x, 0, 1); return x * x * (3 - 2 * x)
def hexc(h): return np.array([int(h[i:i+2], 16) for i in (1, 3, 5)], np.float32)

# 1. cor do céu da foto em cada linha
sky = np.zeros((H, 3), np.float32)
if a.horizonte:
    ult = int(a.horizonte * H)
    for y in range(ult + 1): sky[y] = np.median(im[y], axis=0)
else:
    lum = im @ np.array([.299, .587, .114], np.float32); ok = np.zeros(H, bool)
    for y in range(H):
        m = (lum[y] > 150) & (im[y, :, 2] > im[y, :, 0] + 4)
        if m.sum() > W * .25: sky[y] = np.median(im[y][m], axis=0); ok[y] = True
    ult = np.where(ok)[0].max()
sky[ult + 1:] = sky[ult]                       # abaixo do horizonte: repete a névoa do horizonte
k = 15; ker = np.ones(k) / k
sky = np.stack([np.convolve(np.pad(sky[:, c], (k//2, k//2), mode='edge'), ker, 'valid') for c in range(3)], 1)
horiz = ult / H

# 2. céu de destino: azul da página no topo, brilho azul-claro no horizonte
topo, meio, brilho = hexc(a.topo), hexc(a.meio), hexc(a.brilho)
p = ss(t / (horiz * .55)); q = ss((t - horiz * .55) / (horiz * .45))
alvo = topo[None] * (1 - p)[:, None] + meio[None] * p[:, None]
alvo = alvo * (1 - q)[:, None] + brilho[None] * q[:, None]

# 3. quanto trocar em cada linha: tudo até o horizonte, sumindo até --fim
w = 1 - ss((t - horiz) / max(.01, a.fim - horiz))
#    acima do horizonte, só uma parte do desenho do céu original fica (--detalhe)
d = a.detalhe + (1 - a.detalhe) * ss((t - horiz * .85) / (horiz * .15))
liso = alvo[:, None, :] + d[:, None, None] * (im - sky[:, None, :])
out = im * (1 - w)[:, None, None] + liso * w[:, None, None]

# 4. primeiro plano: um pouco menos saturado e levemente mais frio, para conversar com o azul
fp = ss((t - horiz) / .25)[:, None, None]
cinza = (out @ np.array([.299, .587, .114], np.float32))[..., None]
grad = (cinza + (out - cinza) * .86) * np.array([.95, .975, 1.02], np.float32)
out = out * (1 - fp) + grad * fp

Image.fromarray(np.clip(out, 0, 255).astype(np.uint8)).save(a.saida, quality=86, optimize=True, progressive=True)
print('horizonte em', round(horiz, 3), '| céu do topo', sky[0].round(), '| do horizonte', sky[ult].round())
