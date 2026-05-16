import { Hero } from "@/components/Hero";
import { ReadingProgress } from "@/components/ReadingProgress";

export default function Home() {
  return (
    <main>
      <div className="grain" aria-hidden />
      <ReadingProgress />
      <Hero />
      {/* placeholder section to give the page scroll height for visual testing */}
      <section style={{ height: "200vh" }} aria-hidden />
    </main>
  );
}
