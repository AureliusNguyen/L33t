import { Hero } from "@/components/Hero";
import { ReadingProgress } from "@/components/ReadingProgress";
import { WasmRttSlider } from "@/components/artifacts/WasmRttSlider";

export default function Home() {
  return (
    <main>
      <div className="grain" aria-hidden />
      <ReadingProgress />
      <Hero />
      <section className="max-w-[640px] mx-auto px-8 my-32">
        <h2 className="display-2 mb-6">wasm smoke test</h2>
        <div className="h-[520px]">
          <WasmRttSlider />
        </div>
      </section>
      <section style={{ height: "100vh" }} aria-hidden />
    </main>
  );
}
