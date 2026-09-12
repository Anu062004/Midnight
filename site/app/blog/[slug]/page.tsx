import Link from "next/link";
import { notFound } from "next/navigation";
import { pageMeta } from "@/lib/site";
import { Container, Section } from "@/components/ui";
import { posts } from "@/data/blog";

export async function generateStaticParams() {
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = posts.find((p) => p.slug === slug);
  if (!post) return {};
  return pageMeta({ title: post.title, description: post.dek, path: `/blog/${slug}` });
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = posts.find((p) => p.slug === slug);
  if (!post) notFound();
  const index = posts.findIndex((p) => p.slug === slug);
  const next = posts[(index + 1) % posts.length];

  return (
    <Section>
      <Container className="grid grid-cols-4 gap-8 pb-16 pt-12 md:grid-cols-12 md:pb-24 md:pt-20">
        <article className="col-span-4 md:col-span-12 lg:col-span-7">
          <p className="meta-label text-muted">
            {post.date} · {post.readMinutes} min · {String(index + 1).padStart(2, "0")} / {String(posts.length).padStart(2, "0")}
          </p>
          <h1 className="mt-4 font-display text-4xl font-medium leading-[1.0] tracking-[-0.025em] md:text-6xl">
            {post.title}
          </h1>
          <p className="mt-5 border-l-2 border-accent pl-4 text-lg leading-relaxed text-muted">{post.dek}</p>
          <div className="mt-10 space-y-6 border-t border-line pt-8">
            {post.body.map((para, i) => (
              <p key={i} className="max-w-[68ch] text-[17px] leading-[1.75] text-ink/85">
                {para}
              </p>
            ))}
          </div>
        </article>
        <aside className="col-span-4 md:col-span-12 lg:col-span-3 lg:col-start-10">
          <div className="lg:sticky lg:top-24">
            <p className="meta-label text-muted">Next essay</p>
            <Link href={`/blog/${next.slug}`} className="mt-3 block border border-line p-5 hover:border-ink">
              <p className="font-display text-lg font-medium tracking-tight">{next.title}</p>
              <p className="mt-2 text-sm font-medium">Read →</p>
            </Link>
            <Link href="/blog" className="mt-4 block text-sm font-medium text-muted hover:text-ink">
              ← All essays
            </Link>
          </div>
        </aside>
      </Container>
    </Section>
  );
}
