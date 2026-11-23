# Trata a foto da obra para nascer do céu azul da página: troca o céu do dia (claro) pelo
# azul da página linha a linha, preservando o detalhe (guindastes, prédios), com um brilho
# suave no horizonte e névoa azul no fundo da cidade. O primeiro plano fica quase intacto.
import sys, numpy as np
from PIL import Image
src, dst = sys.argv[1], sys.argv[2]
im = np.asarray(Image.open(src).convert('RGB')).astype(np.float32)
H, W, _ = im.shape
t = (np.arange(H) + .5) / H

def ss(x): x = np.clip(x, 0, 1); return x * x * (3 - 2 * x)
def hexc(h): return np.array([int(h[i:i+2], 16) for i in (1, 3, 5)], np.float32)

# 1. cor do céu da foto em cada linha (mediana dos pixels com cara de céu)
lum = im @ np.array([.299, .587, .114], np.float32)
sky = np.zeros((H, 3), np.float32); ok = np.zeros(H, bool)
for y in range(H):
    m = (lum[y] > 150) & (im[y, :, 2] > im[y, :, 0] + 4)
    if m.sum() > W * .25:
        sky[y] = np.median(im[y][m], axis=0); ok[y] = True
ult = np.where(ok)[0].max()
sky[~ok] = sky[ult]                       # abaixo do horizonte: repete a névoa do horizonte
k = 15; ker = np.ones(k) / k              # suaviza na vertical
sky = np.stack([np.convolve(np.pad(sky[:, c], (k//2, k//2), mode='edge'), ker, 'valid') for c in range(3)], 1)
horiz = ult / H

# 2. céu de destino: azul da página no topo, brilho azul-claro no horizonte
topo, meio, brilho = hexc('#0E55AE'), hexc('#1D64BE'), hexc('#5C9BE0')
a = ss(t / (horiz * .55)); b = ss((t - horiz * .55) / (horiz * .45))
alvo = (topo[None] * (1 - a)[:, None] + meio[None] * a[:, None])
alvo = alvo * (1 - b)[:, None] + brilho[None] * b[:, None]

# 3. quanto trocar em cada linha: tudo até o horizonte, sumindo até 62% da altura
w = 1 - ss((t - horiz) / (.62 - horiz))
out = im + (w[:, None] * (alvo - sky))[:, None, :]

# 4. primeiro plano: um pouco menos saturado e levemente mais frio, para conversar com o azul
fp = ss((t - horiz) / .25)[:, None, None]
cinza = (out @ np.array([.299, .587, .114], np.float32))[..., None]
grad = cinza + (out - cinza) * .86
grad = grad * np.array([.95, .975, 1.02], np.float32)
out = out * (1 - fp) + grad * fp

Image.fromarray(np.clip(out, 0, 255).astype(np.uint8)).save(dst, quality=86, optimize=True, progressive=True)
print('horizonte em', round(horiz, 3), 'céu do topo', sky[0].round(), 'do horizonte', sky[ult].round())
