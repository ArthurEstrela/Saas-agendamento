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
  quality = 1 // <-- ADICIONADO: Padrão qualidade máxima (0 a 1)
): Promise<File> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Could not get canvas context");
  }

  // Define o tamanho do canvas igual ao tamanho do corte
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // Desenha a imagem cortada
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Canvas is empty"));
          return;
        }
        // Cria o arquivo com nome fixo ou dinâmico
        const file = new File([blob], "banner-cropped.jpg", {
          type: "image/jpeg",
        });
        resolve(file);
      },
      "image/jpeg",
      quality // <-- Usa a qualidade máxima
    );
  });
}
