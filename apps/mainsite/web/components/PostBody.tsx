import Image from "next/image";
import {
  PortableText,
  type PortableTextComponents,
  type PortableTextTypeComponentProps,
} from "@portabletext/react";
import type { PostBody as PostBodyValue, PostBodyImage } from "@/lib/cms";

// Inline body images — the CDN URL comes pre-resolved from the GROQ
// projection; sizing happens via Sanity CDN query params, not next/image
// optimization (images are unoptimized on this static site).
function BodyImage({ value }: PortableTextTypeComponentProps<PostBodyImage>) {
  if (!value.url) return null;
  return (
    <figure className="my-10">
      <Image
        src={`${value.url}?w=1600&auto=format`}
        alt={value.alt ?? ""}
        width={1600}
        height={900}
        className="w-full h-auto"
      />
    </figure>
  );
}

const components: PortableTextComponents = {
  types: {
    image: BodyImage,
  },
  block: {
    normal: ({ children }) => (
      <p className="text-base md:text-lg text-zinc-600 leading-relaxed mb-6">{children}</p>
    ),
    h2: ({ children }) => (
      <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-900 mt-14 mb-5">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-xl md:text-2xl font-bold tracking-tight text-zinc-900 mt-10 mb-4">
        {children}
      </h3>
    ),
    h4: ({ children }) => (
      <h4 className="text-lg md:text-xl font-semibold tracking-tight text-zinc-900 mt-8 mb-3">
        {children}
      </h4>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-2 border-zinc-900 pl-6 my-8 text-lg md:text-xl font-light italic text-zinc-700 leading-relaxed">
        {children}
      </blockquote>
    ),
  },
  list: {
    bullet: ({ children }) => (
      <ul className="list-disc pl-6 mb-6 space-y-2 text-base md:text-lg text-zinc-600 leading-relaxed">
        {children}
      </ul>
    ),
    number: ({ children }) => (
      <ol className="list-decimal pl-6 mb-6 space-y-2 text-base md:text-lg text-zinc-600 leading-relaxed">
        {children}
      </ol>
    ),
  },
  marks: {
    link: ({ children, value }) => (
      <a
        href={typeof value?.href === "string" ? value.href : "#"}
        className="text-zinc-900 underline underline-offset-4 decoration-zinc-300 hover:decoration-zinc-900 transition-colors duration-200"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    ),
  },
};

export default function PostBody({ value }: { value: PostBodyValue }) {
  return <PortableText value={value} components={components} />;
}
