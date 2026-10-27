/* Question and answer text may embed images pasted in the admin editor as ![alt](url). */
const IMAGE = /!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g;

export function splitRichText(text: string): { type: "text" | "image"; value: string; alt?: string }[] {
  const parts: { type: "text" | "image"; value: string; alt?: string }[] = [];
  let last = 0;
  for (const match of text.matchAll(IMAGE)) {
    if (match.index > last) parts.push({ type: "text", value: text.slice(last, match.index) });
    parts.push({ type: "image", value: match[2], alt: match[1] });
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push({ type: "text", value: text.slice(last) });
  return parts;
}

export default function RichText({ text, className = "" }: { text: string; className?: string }) {
  return (
    <span className={className}>
      {splitRichText(text).map((part, index) =>
        part.type === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={index} src={part.value} alt={part.alt || "Question diagram"} className="my-3 block max-h-72 max-w-full rounded-lg border-2 border-ink bg-white object-contain" />
        ) : (
          <span key={index} className="whitespace-pre-line">{part.value}</span>
        ),
      )}
    </span>
  );
}
