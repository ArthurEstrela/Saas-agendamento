export const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });

export default async function getCroppedImg(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number },
  quality = 0.9, // 0.9 é um ótimo equilíbrio entre peso e qualidade
  // Adicionamos dimensões de destino (ex: 1200x400 para banners)
  targetWidth = 1200,
  targetHeight = 400
): Promise<File> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Não foi possível obter o contexto do canvas");
  }

  // DEFINIMOS O TAMANHO DO CANVAS PARA A RESOLUÇÃO DE ALTA QUALIDADE
  // Em vez de usar pixelCrop direto, usamos um tamanho padrão de banner
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  // Configurações para suavização de imagem (Anti-aliasing)
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // Fundo branco para JPEGs (evita fundos pretos em transparências)
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // DESENHO MÁGICO:
  // Ele pega o recorte (pixelCrop) e "estica/encolhe" para o targetWidth/Height
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    targetWidth,
    targetHeight
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Canvas vazio"));
          return;
        }
        const file = new File([blob], "banner-cropped.jpg", {
          type: "image/jpeg",
        });
        resolve(file);
      },
      "image/jpeg",
      quality
    );
  });
}