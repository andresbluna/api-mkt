import { Injectable, BadRequestException } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class GeminiService {
  private client: GoogleGenerativeAI;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not defined');
    }
    this.client = new GoogleGenerativeAI(apiKey);
  }

  /**
   * Generar caption con Gemini
   */
  async generateCaption(prompt: string): Promise<string> {
    if (!prompt || prompt.trim() === '') {
      throw new BadRequestException('El prompt no puede estar vacío');
    }

    try {
      const model = this.client.getGenerativeModel({ model: 'imagen-4.0-fast-generate-001' });
      const result = await model.generateContent(
        `Genera un caption atractivo y persuasivo para Instagram sobre: ${prompt}. 
         El caption debe ser breve, enganchador y con emojis relevantes.`,
      );

      const text = result.response.text();
      return text;
    } catch (error) {
      throw new BadRequestException(
        `Error generando caption: ${error.message}`,
      );
    }
  }

  /**
   * Generar hashtags
   */
  async generateHashtags(prompt: string): Promise<string[]> {
    if (!prompt || prompt.trim() === '') {
      throw new BadRequestException('El prompt no puede estar vacío');
    }

    try {
      const model = this.client.getGenerativeModel({ model: 'imagen-4.0-fast-generate-001' });
      const result = await model.generateContent(
        `Genera 10 hashtags relevantes y populares para un post sobre: ${prompt}.
         Devuelve solo los hashtags separados por comas, sin el símbolo #.`,
      );

      const text = result.response.text();
      const hashtags = text
        .split(',')
        .map((tag) => `#${tag.trim()}`)
        .filter((tag) => tag.length > 1);

      return hashtags;
    } catch (error) {
      throw new BadRequestException(
        `Error generando hashtags: ${error.message}`,
      );
    }
  }

  //Generar los post de marketing
  async generateMarketingPost(prompt: string) {
    if (!prompt || prompt.trim() === '') {
      throw new BadRequestException('El prompt no puede estar vacío');
    }

    try {
      const [caption, hashtags] = await Promise.all([
        this.generateCaption(prompt),
        this.generateHashtags(prompt),
      ]);

      return {
        caption,
        hashtags,
        fullPost: `${caption}\n\n${hashtags.join(' ')}`,
      };
    } catch (error) {
      throw new BadRequestException(
        `Error generando post de marketing: ${error.message}`,
      );
    }
  }

  //mejorar contenido para plataformas especificas
  async optimizeContent(
    content: string,
    platform: string = 'instagram',
  ): Promise<string> {
    if (!content || content.trim() === '') {
      throw new BadRequestException('El contenido no puede estar vacío');
    }

    try {
      const model = this.client.getGenerativeModel({ model: 'imagen-4.0-fast-generate-001' });
      const result = await model.generateContent(
        `Optimiza el siguiente contenido para ${platform}:
         "${content}"
         
         Mejora:
         - Claridad y impacto
         - Añade emojis si es apropiado
         - Ajusta la longitud según las mejores prácticas de ${platform}
         - Mantén el mensaje original`,
      );

      return result.response.text();
    } catch (error) {
      throw new BadRequestException(
        `Error optimizando contenido: ${error.message}`,
      );
    }
  }


// En gemini.service.ts, reemplaza el método generateImage por este:

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

    const generationId =
      createData?.sdGenerationJob?.generationId;

    if (!generationId) {
      throw new Error('No se pudo iniciar la generación');
    }

    // Esperar a que termine
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

    const imageUrl =
      resultData?.generations_by_pk?.generated_images?.[0]?.url;

    if (!imageUrl) {
      throw new Error('No se recibió imagen');
    }

    // Descargar la imagen y convertirla a Base64
    const imageResponse = await fetch(imageUrl);
    const arrayBuffer = await imageResponse.arrayBuffer();

    return Buffer.from(arrayBuffer).toString('base64');
  }


}




