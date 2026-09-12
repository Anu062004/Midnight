import Link from "next/link";
import { pageMeta } from "@/lib/site";
import { Container, Display, Section } from "@/components/ui";
import { posts } from "@/data/blog";
import { Reveal } from "@/components/Reveal";

export const metadata = pageMeta({
  title: "Blog",
  description: "Notes on AI privacy, agent security, tokenization, and verifiable enforcement. Internal resources, no external republication.",
  path: "/blog",
});

export default function BlogPage() {
  return (
    <Section>
      <Container className="pb-16 pt-12 md:pb-24 md:pt-20">
        <p className="meta-label text-muted">Resources</p>
        <Display className="mt-6">Notes on private AI.</Display>
        <p className="mt-6 max-w-[58ch] text-lg leading-relaxed text-muted">
          Internal essays on the ideas behind the product. No external republication, no sponsored content.
        </p>
        <div className="mt-12 border-t border-line">
          {posts.map((post, i) => (
            <Reveal key={post.slug}>
              <Link href={`/blog/${post.slug}`} className="group grid grid-cols-4 gap-3 border-b border-line py-8 md:grid-cols-12">
                <p className="meta-label col-span-1 text-muted">{String(i + 1).padStart(2, "0")}</p>
                <div className="col-span-3 md:col-span-7">
                  <h2 className="font-display text-2xl font-medium tracking-tight group-hover:underline group-hover:underline-offset-4 md:text-3xl">
                    {post.title}
                  </h2>
                  <p className="mt-2 max-w-[56ch] leading-relaxed text-muted">{post.dek}</p>
                </div>
                <div className="col-span-3 col-start-2 md:col-span-4 md:col-start-9 md:text-right">
                  <p className="font-mono text-xs text-muted">{post.date} · {post.readMinutes} min</p>
                  <p className="mt-2 text-sm font-medium">Read →</p>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </Container>
    </Section>
  );
}
