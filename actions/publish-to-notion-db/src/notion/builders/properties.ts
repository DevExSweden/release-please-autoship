export default function buildProperties(
  titlePropertyName: string,
  title: string,
  extraProperties?: Record<string, unknown>
): Record<string, unknown> {
  const base: Record<string, unknown> =
    extraProperties && typeof extraProperties === 'object' ? { ...extraProperties } : {};

  base[titlePropertyName] = {
    title: [
      {
        type: 'text',
        text: { content: title }
      }
    ]
  };

  return base;
}


