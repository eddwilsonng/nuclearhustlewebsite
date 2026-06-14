type DescriptionBlock =
  | { type: 'paragraph'; content: string[] }
  | { type: 'list'; content: string[] };

const BULLET_PREFIX = /^[-•*–]\s+/;
const NUMBERED_PREFIX = /^\d+[.)]\s+/;

function splitDescriptionBlocks(text: string): DescriptionBlock[] {
  const lines = text.split('\n').map((line) => line.trim()).filter(Boolean);
  if (lines.length === 0) return [];

  const blocks: DescriptionBlock[] = [];
  let current: DescriptionBlock | null = null;

  for (const line of lines) {
    const isBullet = BULLET_PREFIX.test(line) || NUMBERED_PREFIX.test(line);
    const cleaned = line.replace(BULLET_PREFIX, '').replace(NUMBERED_PREFIX, '').trim();

    if (isBullet) {
      if (current?.type !== 'list') {
        current = { type: 'list', content: [] };
        blocks.push(current);
      }
      current.content.push(cleaned);
    } else {
      if (current?.type !== 'paragraph') {
        current = { type: 'paragraph', content: [] };
        blocks.push(current);
      }
      current.content.push(line);
    }
  }

  return blocks;
}

function DescriptionListItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3 text-stone-600 text-sm leading-relaxed">
      <span className="text-yellow-500 mt-[0.35rem] flex-shrink-0 font-mono leading-none">—</span>
      <span>{children}</span>
    </li>
  );
}

export function JobDescriptionBlock({ text }: { text: string }) {
  const blocks = splitDescriptionBlocks(text);

  if (blocks.length === 0) return null;

  return (
    <div className="space-y-4">
      {blocks.map((block, blockIndex) =>
        block.type === 'list' ? (
          <ul key={blockIndex} className="space-y-3">
            {block.content.map((item, itemIndex) => (
              <DescriptionListItem key={itemIndex}>{item}</DescriptionListItem>
            ))}
          </ul>
        ) : (
          <div key={blockIndex} className="space-y-3">
            {block.content.map((paragraph, paragraphIndex) => (
              <p key={paragraphIndex} className="text-stone-600 text-sm leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>
        )
      )}
    </div>
  );
}

export function JobDescriptionSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="font-mono text-xs tracking-widest uppercase text-stone-400 mb-4">{label}</h3>
      {children}
    </section>
  );
}
