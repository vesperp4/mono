import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PostBody from "@/components/PostBody";
import { getPost, getPostSlugs } from "@/lib/cms";
import { formatDate } from "@/lib/dates";

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

// Empty array while the Sanity project is unconfigured — the route still
// builds; unknown slugs 404 at request time via notFound() below.
export async function generateStaticParams() {
  const slugs = await getPostSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "Post not found — VESPER P4" };
  return {
    title: `${post.title} — VESPER P4`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      publishedTime: post.publishedAt,
      authors: [post.author],
      ...(post.coverImage && {
        images: [
          {
            url: `${post.coverImage.url}?w=1200&h=630&fit=crop&auto=format`,
            width: 1200,
            height: 630,
            alt: post.coverImage.alt,
          },
        ],
      }),
    },
  };
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  return (
    <main>
      <Navbar />

      {/* Dark header — keeps the fixed navbar readable, mirrors the home hero */}
      <section className="bg-black pt-40 pb-16 md:pt-48 md:pb-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold tracking-[0.3em] uppercase text-white/50 mb-6">
              <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
              <span aria-hidden="true"> · </span>
              {post.author}
            </p>
            <h1 className="text-4xl md:text-6xl font-bold leading-[1.05] tracking-tight text-white">
              {post.title}
            </h1>
          </div>
        </div>
      </section>

      <article className="bg-white py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="max-w-3xl mx-auto">
            {post.coverImage && (
              <figure className="relative aspect-[16/9] mb-14 overflow-hidden bg-zinc-100">
                <Image
                  src={`${post.coverImage.url}?w=1600&auto=format`}
                  alt={post.coverImage.alt}
                  fill
                  sizes="(min-width: 768px) 768px, 100vw"
                  priority
                  className="object-cover"
                />
              </figure>
            )}

            {post.body && post.body.length > 0 && <PostBody value={post.body} />}

            <div className="mt-16 pt-8 border-t border-zinc-100">
              <Link
                href="/blog"
                className="text-xs font-semibold tracking-widest uppercase text-zinc-500 hover:text-zinc-900 transition-colors duration-300"
              >
                ← All posts
              </Link>
            </div>
          </div>
        </div>
      </article>

      <Footer />
    </main>
  );
}
