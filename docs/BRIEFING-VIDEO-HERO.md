# Briefing: vídeo do hero (símbolo de reciclagem + petróleo)

Documento para o artista 3D ou motion designer que vai produzir o vídeo em loop da primeira dobra do site da PETROLUB. O site já está pronto para receber o arquivo: enquanto não houver vídeo, ele exibe uma versão 3D em tempo real e, se ela falhar, uma imagem estática.

## Conceito

O símbolo de reciclagem da PETROLUB, em verde, é envolvido por petróleo preto e espesso, em movimento contínuo. A mensagem é a da empresa: o óleo lubrificante usado é coletado e volta ao ciclo, em vez de chegar ao solo e à água.

- **Símbolo:** usar a geometria fiel do arquivo fornecido pela PETROLUB. Não redesenhar nem simplificar. Referências no repositório: o vetor em `src/components/site/recycle-symbol.ts`, o desenho em `public/brand/simbolo-reciclagem.svg` e o modelo `public/models/petrolub-reciclagem-petroleo.glb`, com materiais e malhas separados, que serve como ponto de partida.
- **Material do símbolo:** verde de alto brilho com verniz (clearcoat) e chanfro visível nas bordas. Cor de referência `#156900`; o verde da marca é `#1c782b`. Nada de aparência de plástico fosco.
- **Petróleo:** precisa parecer líquido viscoso de verdade, com simulação de fluido (FLIP/SPH), e não malha animada. Cor preta com reflexos especulares fortes e leve reflexo verde vindo do símbolo. Elementos:
  - uma faixa de petróleo que orbita o símbolo, passando por trás e pela frente;
  - filetes que escorrem das partes de baixo do símbolo e soltam gotas;
  - uma poça na base que recebe as gotas, com ondulações;
  - gotículas suspensas ao redor.
- **Proibido:** ícone plano, fumaça no lugar do petróleo, visual de desenho animado, texto ou logotipo dentro do vídeo, e as cores azul, dourado, amarelo e laranja.

## Câmera, luz e movimento

- Câmera praticamente fixa, levemente acima do símbolo e olhando um pouco para baixo, como na imagem `public/images/oil-poster.webp`. No máximo, uma oscilação lenta de poucos graus.
- Luz de estúdio branca, com recortes que desenhem o volume do verde e o brilho do óleo. Oclusão ambiental e sombra de contato suave na base. Profundidade de campo bem sutil.
- Movimento calmo e contínuo, sem cortes. É o fundo da página: não pode competir com o título.
- **Loop perfeito:** o último quadro emenda no primeiro sem salto visível. Duração entre 6 e 10 segundos.

## Enquadramento

- Formato quase quadrado: **1:1 ou 1,05:1**. Por exemplo, 1600 × 1560, que é a proporção da imagem estática atual.
- Toda a cena dentro do quadro, com margem de uns 6% nas bordas. Nada pode ser cortado: o site centraliza o vídeo inteiro na área disponível.
- O lado esquerdo do vídeo fica perto do título no computador. Evite massa visual forte na faixa da esquerda.

## Entrega

| Arquivo | Uso | Especificação |
| --- | --- | --- |
| `hero.webm` | Chrome, Edge, Firefox e Android | VP9 **com canal alfa** (`yuva420p`), 1200 a 1600 px de largura, 24 ou 30 fps, sem áudio, alvo de **até 2,5 MB** |
| `hero.mp4` | Safari, iPhone e Mac | HEVC (H.265) **com canal alfa**, tag `hvc1`, mesmas dimensões e duração, sem áudio, alvo de **até 3 MB** |
| `hero-poster.webp` | Antes do vídeo carregar e para quem prefere menos movimento | Um quadro representativo, PNG ou WebP **com fundo transparente**, mesmas dimensões |
| Fonte | Ajustes futuros | Arquivo do projeto (.blend, .hip ou similar) e sequência PNG com alfa do loop completo |

Os dois vídeos precisam de **fundo transparente**. Fundo branco, preto ou xadrez "pintado" no vídeo não serve, porque o site tem fundo claro com texturas e linhas por trás.

### Exportação de referência (a partir da sequência PNG com alfa)

```bash
# WebM VP9 com alfa
ffmpeg -framerate 30 -i frame_%04d.png -c:v libvpx-vp9 -pix_fmt yuva420p -b:v 0 -crf 32 -row-mt 1 -an hero.webm

# MP4 HEVC com alfa: use o "Apple ProRes 4444" e converta no macOS, que gera HEVC com alfa compatível com o Safari:
#   avconvert --preset PresetHEVCHighestQualityWithAlpha --source hero-prores4444.mov --output hero.mp4
# ou, no Compressor/Final Cut, a opção "HEVC 8 bits com canal alfa"
```

Conferir antes de entregar: o WebM com alfa no Chrome e o MP4 com alfa no Safari, sobre um fundo claro. Se o Safari mostrar fundo preto, o alfa do HEVC não foi exportado.

## Como publicar no site

1. Suba os arquivos para um local público: a pasta `public/videos/` do projeto ou um serviço de arquivos, como Vercel Blob, Cloudflare R2 ou S3 com CDN.
2. No painel, abra **Admin › Conteúdo › Página inicial › Hero** e preencha:
   - **Vídeo do hero — WebM**: por exemplo `/videos/hero.webm`;
   - **Vídeo do hero — MP4 HEVC**: por exemplo `/videos/hero.mp4`;
   - **Imagem do hero**: o quadro transparente.
3. Salve. O vídeo passa a substituir o 3D. Se um navegador não suportar o arquivo correspondente, por exemplo quando só o WebM foi enviado e o visitante usa Safari, o site continua exibindo o 3D para esse visitante.

Comportamento automático do site:

- Com a economia de dados ligada, ou para quem prefere menos movimento, o site mostra só a imagem.
- O vídeo pausa quando sai da tela ou quando a aba fica em segundo plano.
- O texto do topo carrega antes do vídeo, sem prejudicar a velocidade da página.
