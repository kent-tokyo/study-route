import OpenAI from 'openai';

export async function generateConceptImage(
  label: string,
  description: string,
  imageModel: string = 'dall-e-3',
): Promise<{ url: string; revisedPrompt: string } | null> {
  if (!process.env.OPENAI_API_KEY) return null;
  if (imageModel === 'none') return null;

  const client = new OpenAI();

  const response = await client.images.generate({
    model: imageModel,
    prompt: `Create a visually rich educational illustration for the math concept "${label}": ${description}.

Goal: Help learners intuitively understand this concept through visual metaphors and diagrams.

Style guidelines:
- Clean, modern infographic / educational poster style
- White or very light background with soft pastel accent colors (blue #3b82f6, green #22c55e, orange #f59e0b, red #ef4444)
- Use clear visual metaphors: e.g., sets as circles/containers, functions as arrows/machines, numbers on a number line
- Include geometric shapes, arrows showing relationships, layered diagrams, and spatial groupings
- Layout like a polished educational diagram: structured, balanced, with clear visual hierarchy
- Show the STRUCTURE and RELATIONSHIPS of the concept, not just decorative art

Strict rules:
- Absolutely NO text, NO letters, NO numbers, NO formulas, NO labels, NO words in the image
- Use ONLY shapes, colors, spatial relationships, visual patterns, icons, and arrows to convey the idea
- The image should be self-explanatory through visual logic alone
- Professional quality, suitable for an educational web application`,
    n: 1,
    size: '1792x1024',
    quality: 'standard',
  });

  const url = response.data?.[0]?.url;
  const revisedPrompt = response.data?.[0]?.revised_prompt || '';
  return url ? { url, revisedPrompt } : null;
}
