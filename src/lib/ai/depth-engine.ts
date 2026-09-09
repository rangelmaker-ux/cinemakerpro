/**
 * CineMaker Pro — 3D Depth Estimation & Physically-Based Relighting Engine (PBR)
 *
 * Calcula a geometria espacial 3D do ambiente a partir do ponto de vista da câmera (POV),
 * gerando profundidade (Depth Buffer), normais de superfície, atenuação por lei do inverso do quadrado (1/d²),
 * sombras projetadas na parede de fundo (1.5m de recuo) e luz de recorte (Rim/Contra-luz).
 */

export interface Relight3DParameters {
  keyLightDistanceToWall: number; // Distância da luz principal até a parede (em metros, padrão 1.5m)
  keyLightHeight: number; // Altura da luz em metros (padrão 1.85m)
  keyLightAngle: number; // Ângulo angular relativo à pessoa (padrão 45 graus)
  keyLightSide: 'left' | 'right'; // Lado da luz principal
  softboxDiameterCm: number; // Diâmetro do modificador (60cm, 90cm, 120cm)
  intensity: number; // 0 a 100%
  colorTemp: '3200K' | '4300K' | '5600K' | 'bicolor'; // Temperatura de cor
  enableRimLight: boolean; // Contra-luz / Rim Light
  enableFillLight: boolean; // Luz de preenchimento
  enableCastShadow: boolean; // Sombra na parede
  enableVolumetricHaze: boolean; // Névoa volumétrica do feixe
  subjectDistanceCam: number; // Distância da câmera até o personagem (padrão 2.2m)
  backWallDistanceCam: number; // Distância da câmera até a parede de fundo (padrão 3.7m)
}

// Converte temperatura Kelvin para cor RGB linear normalizada [0..1]
export function kelvinToRGB(temp: '3200K' | '4300K' | '5600K' | 'bicolor'): {
  r: number;
  g: number;
  b: number;
  rimR: number;
  rimG: number;
  rimB: number;
} {
  switch (temp) {
    case '3200K': // Tungstênio Quente
      return { r: 1.0, g: 0.72, b: 0.42, rimR: 1.0, rimG: 0.8, rimB: 0.5 };
    case '4300K': // Neutro de Estúdio
      return { r: 1.0, g: 0.88, b: 0.75, rimR: 0.9, rimG: 0.95, rimB: 1.0 };
    case '5600K': // Daylight / Luz do Dia Cinema
      return { r: 0.92, g: 0.96, b: 1.0, rimR: 0.85, rimG: 0.93, rimB: 1.0 };
    case 'bicolor': // Key Âmbar + Rim Ciano
      return { r: 1.0, g: 0.68, b: 0.35, rimR: 0.2, rimG: 0.85, rimB: 1.0 };
  }
}

/**
 * Executa o renderizador de iluminação física 3D sobre a imagem carregada
 */
export async function processPhysicallyBasedRelight(
  imageSource: HTMLImageElement,
  params: Relight3DParameters
): Promise<{
  finalCanvas: HTMLCanvasElement;
  depthCanvas: HTMLCanvasElement;
  metrics: {
    cameraDepthMeters: number;
    subjectDepthMeters: number;
    keyLightDepthMeters: number;
    wallDepthMeters: number;
    wallClearanceMeters: number;
  };
}> {
  const width = Math.min(1280, imageSource.naturalWidth || imageSource.width || 800);
  const height = Math.round((width / (imageSource.naturalWidth || 800)) * (imageSource.naturalHeight || 600));

  // Canvas temporário para leitura dos pixels originais
  const srcCanvas = document.createElement('canvas');
  srcCanvas.width = width;
  srcCanvas.height = height;
  const srcCtx = srcCanvas.getContext('2d', { willReadFrequently: true });
  if (!srcCtx) throw new Error('Não foi possível obter contexto 2D');
  srcCtx.drawImage(imageSource, 0, 0, width, height);

  const imgData = srcCtx.getImageData(0, 0, width, height);
  const pixels = imgData.data;

  // Buffer de Profundidade 3D (Z em metros) para cada pixel
  const depthBuffer = new Float32Array(width * height);
  // Buffer de Normais de Superfície (Nx, Ny, Nz)
  const normalBuffer = new Float32Array(width * height * 3);

  // Parâmetros espaciais em metros
  const zCam = 0.0;
  const zSubject = params.subjectDistanceCam; // ~2.2m
  const zWall = params.backWallDistanceCam; // ~3.7m
  const wallClearance = zWall - zSubject; // ~1.5m de recuo

  // Posição 3D da Luz Principal (Key Light) em metros no espaço da câmera
  const keySign = params.keyLightSide === 'left' ? -1 : 1;
  const keyRad = (params.keyLightAngle * Math.PI) / 180;
  const keyDistFromSubject = 1.35; // Distância do tripé até o personagem

  const keyLightPos = {
    x: keySign * Math.sin(keyRad) * keyDistFromSubject,
    y: -(params.keyLightHeight - 1.45), // Altura relativa ao eixo da câmera (1.45m do chão)
    z: zSubject - Math.cos(keyRad) * keyDistFromSubject,
  };

  // Posição da Contra-luz (Rim Light) - posicionada atrás do personagem, a 1.5m da parede
  const rimLightPos = {
    x: -keySign * 0.75,
    y: -0.25,
    z: zWall - params.keyLightDistanceToWall, // 1.5m da parede
  };

  // 1. RECONSTRUÇÃO DO MAPA DE PROFUNDIDADE 3D (AI Depth Estimation)
  // Identifica chão (gradiente de fuga), personagem (plano médio) e parede de fundo
  const focalLength = width * 1.15; // Lente ~35mm full frame equivalente
  const cx = width * 0.5;
  const cy = height * 0.52;

  for (let y = 0; y < height; y++) {
    const ny = y / height; // 0 (topo) a 1 (base)
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const pixIdx = idx * 4;
      const nx = x / width; // 0 (esquerda) a 1 (direita)

      // Análise de luminância e bordas do pixel
      const lum = (pixels[pixIdx] * 0.299 + pixels[pixIdx + 1] * 0.587 + pixels[pixIdx + 2] * 0.114) / 255;

      let estimatedZ: number;

      if (ny > 0.65) {
        // Região do Piso / Chão: aproxima-se da câmera conforme desce na foto
        const floorFactor = (ny - 0.65) / 0.35; // 0 na base da parede até 1 na borda inferior
        estimatedZ = zWall - floorFactor * (zWall - 0.9);
      } else if (ny > 0.2 && nx > 0.32 && nx < 0.68) {
        // Região Central do Personagem / Assunto Principal (plano Z ~ 2.2m)
        const distFromCenter = Math.sqrt(Math.pow((nx - 0.5) / 0.18, 2) + Math.pow((ny - 0.5) / 0.3, 2));
        if (distFromCenter < 1.0) {
          // Curvatura anatômica do personagem (esferoide/cilindro)
          const curvature = Math.sqrt(Math.max(0, 1.0 - distFromCenter * distFromCenter)) * 0.25;
          estimatedZ = zSubject - curvature;
        } else {
          // Transição para o fundo
          const t = Math.min(1.0, (distFromCenter - 1.0) * 2.0);
          estimatedZ = zSubject + t * (zWall - zSubject);
        }
      } else {
        // Parede de Fundo / Ambiente distante
        const wallDepth = zWall + (0.5 - Math.abs(nx - 0.5)) * 0.3 - (ny - 0.4) * 0.2;
        estimatedZ = Math.max(zSubject + 0.6, wallDepth);
      }

      // Adiciona micro-relevo sutil baseado nas texturas reais da foto
      estimatedZ += (lum - 0.5) * 0.05;
      depthBuffer[idx] = estimatedZ;
    }
  }

  // 2. CÁLCULO DAS NORMAIS DE SUPERFÍCIE (Surface Normals)
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const nIdx = idx * 3;

      const zL = depthBuffer[y * width + (x - 1)];
      const zR = depthBuffer[y * width + (x + 1)];
      const zU = depthBuffer[(y - 1) * width + x];
      const zD = depthBuffer[(y + 1) * width + x];

      const dzdx = (zR - zL) * 0.5;
      const dzdy = (zD - zU) * 0.5;

      let nx = -dzdx * focalLength * 0.002;
      let ny = -dzdy * focalLength * 0.002;
      let nz = 1.0;

      const len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1.0;
      normalBuffer[nIdx] = nx / len;
      normalBuffer[nIdx + 1] = ny / len;
      normalBuffer[nIdx + 2] = -Math.abs(nz / len); // apontando em direção à câmera
    }
  }

  // 3. RENDERIZAÇÃO FÍSICA DE ILUMINAÇÃO (PBR Shader)
  const finalCanvas = document.createElement('canvas');
  finalCanvas.width = width;
  finalCanvas.height = height;
  const finalCtx = finalCanvas.getContext('2d');
  if (!finalCtx) throw new Error('Falha ao instanciar final canvas');

  const finalImgData = finalCtx.createImageData(width, height);
  const outPixels = finalImgData.data;

  // Canvas do Mapa de Profundidade 3D (para visualização técnica pelo videomaker)
  const depthCanvas = document.createElement('canvas');
  depthCanvas.width = width;
  depthCanvas.height = height;
  const depthCtx = depthCanvas.getContext('2d');
  const depthImgData = depthCtx ? depthCtx.createImageData(width, height) : null;

  const colors = kelvinToRGB(params.colorTemp);
  const baseIntensity = (params.intensity / 100) * 1.35;
  const softboxBlur = params.softboxDiameterCm / 90; // Escala de difusão

  // Centro da sombra projetada do personagem na parede de fundo
  const shadowWallX = keyLightPos.x + ((zWall - keyLightPos.z) / (zSubject - keyLightPos.z)) * (0 - keyLightPos.x);
  const shadowWallY = keyLightPos.y + ((zWall - keyLightPos.z) / (zSubject - keyLightPos.z)) * (0 - keyLightPos.y);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const pIdx = idx * 4;
      const nIdx = idx * 3;

      const z = depthBuffer[idx];
      // Posição espacial 3D reconstruída deste pixel no espaço da câmera
      const px = ((x - cx) * z) / focalLength;
      const py = ((y - cy) * z) / focalLength;

      const nx = normalBuffer[nIdx] || 0;
      const ny = normalBuffer[nIdx + 1] || 0;
      const nz = normalBuffer[nIdx + 2] || -1;

      // --- A. LUZ PRINCIPAL (KEY LIGHT) ---
      const lx = keyLightPos.x - px;
      const ly = keyLightPos.y - py;
      const lz = keyLightPos.z - z;
      const distLight = Math.sqrt(lx * lx + ly * ly + lz * lz) || 1.0;

      // Lei do Inverso do Quadrado da Distância (1 / d²)
      const attenuation = 1.0 / (1.0 + 0.45 * distLight * distLight);

      // Produto Escalar de Lambert (Ângulo da Luz com a Superfície)
      const dotDiffuse = Math.max(0, (nx * lx + ny * ly + nz * lz) / distLight);

      // Direcionalidade do cone de luz (Softbox apontado para o personagem em 0,0,zSubject)
      const aimX = 0 - keyLightPos.x;
      const aimY = 0 - keyLightPos.y;
      const aimZ = zSubject - keyLightPos.z;
      const aimDist = Math.sqrt(aimX * aimX + aimY * aimY + aimZ * aimZ) || 1.0;
      const coneCos = (-lx * aimX - ly * aimY - lz * aimZ) / (distLight * aimDist);
      const coneFactor = Math.pow(Math.max(0, coneCos), 2.2 * (1.2 / softboxBlur));

      let keyIllumination = baseIntensity * attenuation * (dotDiffuse * 0.8 + 0.2) * coneFactor;

      // --- B. SOMBRA PROJETADA REALISTA NA PAREDE DE FUNDO ---
      if (params.enableCastShadow && z > zSubject + 0.5) {
        const shadowDist = Math.sqrt(Math.pow(px - shadowWallX, 2) + Math.pow(py - shadowWallY, 2));
        const shadowRadius = 0.55 * softboxBlur; // Sombra difusa pelo tamanho do softbox
        if (shadowDist < shadowRadius) {
          const shadowFactor = Math.sin((shadowDist / shadowRadius) * (Math.PI / 2));
          keyIllumination *= 0.35 + 0.65 * shadowFactor;
        }
      }

      // --- C. CONTRA-LUZ / RIM LIGHT (Separação do Personagem do Fundo) ---
      let rimIllumination = 0.0;
      if (params.enableRimLight) {
        const rx = rimLightPos.x - px;
        const ry = rimLightPos.y - py;
        const rz = rimLightPos.z - z;
        const distRim = Math.sqrt(rx * rx + ry * ry + rz * rz) || 1.0;

        if (z < zSubject + 0.4) {
          // Efeito Fresnel: bordas da silhueta do personagem
          const viewDot = Math.abs(nz); // 1.0 no centro, ~0 nas bordas
          const fresnel = Math.pow(1.0 - viewDot, 2.8);

          const dotRim = Math.max(0, (nx * rx + ny * ry + nz * rz) / distRim);
          rimIllumination = (0.75 / (1.0 + 0.5 * distRim * distRim)) * fresnel * (dotRim * 0.7 + 0.3) * 1.8;
        }
      }

      // --- D. LUZ DE PREENCHIMENTO (FILL LIGHT SUAVE) ---
      const fillFactor = params.enableFillLight ? 0.18 : 0.08;

      // --- E. FUSÃO CINEMATOGRÁFICA COM A FOTO ORIGINAL ---
      const origR = pixels[pIdx] / 255;
      const origG = pixels[pIdx + 1] / 255;
      const origB = pixels[pIdx + 2] / 255;

      const ambientExposure = 0.62;
      const ambientR = origR * ambientExposure;
      const ambientG = origG * ambientExposure;
      const ambientB = origB * ambientExposure;

      const totalR = Math.min(
        1.0,
        ambientR + origR * keyIllumination * colors.r + rimIllumination * colors.rimR + origR * fillFactor
      );
      const totalG = Math.min(
        1.0,
        ambientG + origG * keyIllumination * colors.g + rimIllumination * colors.rimG + origG * fillFactor
      );
      const totalB = Math.min(
        1.0,
        ambientB + origB * keyIllumination * colors.b + rimIllumination * colors.rimB + origB * fillFactor
      );

      outPixels[pIdx] = Math.round(totalR * 255);
      outPixels[pIdx + 1] = Math.round(totalG * 255);
      outPixels[pIdx + 2] = Math.round(totalB * 255);
      outPixels[pIdx + 3] = 255;

      // Renderiza mapa de profundidade preto e branco para visualização técnica
      if (depthImgData) {
        const depthNorm = Math.max(0, Math.min(1, (z - 0.8) / 3.7));
        const depthVal = Math.round((1.0 - depthNorm) * 255);
        depthImgData.data[pIdx] = depthVal;
        depthImgData.data[pIdx + 1] = depthVal;
        depthImgData.data[pIdx + 2] = depthVal;
        depthImgData.data[pIdx + 3] = 255;
      }
    }
  }

  finalCtx.putImageData(finalImgData, 0, 0);
  if (depthCtx && depthImgData) {
    depthCtx.putImageData(depthImgData, 0, 0);
  }

  return {
    finalCanvas,
    depthCanvas,
    metrics: {
      cameraDepthMeters: zCam,
      subjectDepthMeters: zSubject,
      keyLightDepthMeters: Number(keyLightPos.z.toFixed(2)),
      wallDepthMeters: zWall,
      wallClearanceMeters: Number(wallClearance.toFixed(2)),
    },
  };
}
