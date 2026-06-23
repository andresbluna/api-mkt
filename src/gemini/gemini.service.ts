import { Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class GeminiService {
  // --- Método real para generar imágenes (Leonardo.ai) ---
  async generateImage(prompt: string): Promise<string> {
    console.log('PROMPT:', prompt);

    const createResponse = await fetch(
      'https://cloud.leonardo.ai/api/rest/v1/generations',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.LEONARDO_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          modelId: 'b24e16ff-06e3-43eb-8d33-4416c2d75876', // Leonardo Kino XL
          width: 1024,
          height: 1024,
          num_images: 1,
        }),
      },
    );

    const createData = await createResponse.json();
    const generationId = createData?.sdGenerationJob?.generationId;

    if (!generationId) {
      throw new BadRequestException('No se pudo iniciar la generación');
    }

    await new Promise((resolve) => setTimeout(resolve, 8000));

    const resultResponse = await fetch(
      `https://cloud.leonardo.ai/api/rest/v1/generations/${generationId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.LEONARDO_API_KEY}`,
        },
      },
    );

    const resultData = await resultResponse.json();
    const imageUrl = resultData?.generations_by_pk?.generated_images?.[0]?.url;

    if (!imageUrl) {
      throw new BadRequestException('No se recibió imagen');
    }

    const imageResponse = await fetch(imageUrl);
    const arrayBuffer = await imageResponse.arrayBuffer();
    return Buffer.from(arrayBuffer).toString('base64');
  }

  // --- Método dummy para generar posts de marketing (texto) ---
  // ⚠️ TEMPORAL: devuelve datos ficticios. Reemplazar con IA real más adelante.
  async generateMarketingPost(prompt: string): Promise<{
    caption: string;
    hashtags: string[];
    fullPost: string;
  }> {
    if (!prompt || prompt.trim() === '') {
      throw new BadRequestException('El prompt no puede estar vacío');
    }

    // Datos dummy (puedes personalizarlos)
    const dummyCaption = `✨ ¡Descubre la magia de "${prompt}"! 🌟 
    Una experiencia única que no te puedes perder. 
    ¡Inspírate y transforma tu día a día! 💫`;

    const dummyHashtags = [
      '#inspiración',
      '#creatividad',
      '#nuevo',
      '#vibrapositiva',
      '#descubre',
    ];

    const fullPost = `${dummyCaption}\n\n${dummyHashtags.join(' ')}`;

    return {
      caption: dummyCaption,
      hashtags: dummyHashtags,
      fullPost,
    };
  }
}
