import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import { getPosts } from "@/lib/cms";
import { formatDate } from "@/lib/dates";

export const metadata: Metadata = {
  title: "Blog — VESPER P4",
  description:
    "Writing from the VESPER P4 community — cybersecurity, artificial intelligence, engineering, and national security at PUPR's ECECS Department.",
};

export default async function BlogPage() {
  const posts = await getPosts();

  return (
    <main>
      <Navbar />
      <PageHeader
        eyebrow="Journal"
        title="Blog."
        description="Writing from the VESPER P4 community — field notes, project write-ups, and perspectives across the four pillars."
      />

      <section className="bg-white py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          {posts.length === 0 ? (
            <EmptyState
              title="No posts yet"
              message="The first dispatches are being written. Check back soon."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-zinc-200 border border-zinc-200">
              {posts.map((post) => (
                <article key={post._id} className="group bg-white">
                  <Link href={`/blog/${post.slug}`} className="flex h-full flex-col">
                    {post.coverImage && (
                      <div className="relative aspect-[16/9] overflow-hidden bg-zinc-100">
                        <Image
                          src={`${post.coverImage.url}?w=1200&auto=format`}
                          alt={post.coverImage.alt}
                          fill
                          sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        />
                      </div>
                    )}
                    <div className="flex flex-1 flex-col p-8">
                      <p className="text-xs font-mono text-zinc-400 mb-4">
                        <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
                        <span aria-hidden="true"> · </span>
                        {post.author}
                      </p>
                      <h2 className="text-xl md:text-2xl font-bold tracking-tight text-zinc-900 leading-snug mb-3 transition-opacity duration-300 group-hover:opacity-60">
                        {post.title}
                      </h2>
                      <p className="text-sm text-zinc-500 leading-relaxed mb-6">{post.excerpt}</p>
                      <span className="mt-auto text-xs font-semibold tracking-widest uppercase text-zinc-900">
                        Read post →
                      </span>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
