export default function Home() {
  return (
    <main className="px-16 py-32 max-w-[1280px] mx-auto">
      <div className="grain" aria-hidden />
      <h1 className="display-1 mb-8">Four ceilings.</h1>
      <p className="lede mb-12">A KV store that ties Redis 6.0 on the lab LAN.</p>
      <p className="body mb-6">
        Body prose in Newsreader. The reader will spend most of their time here.
        Optical sizing, italics that earn their place.
      </p>
      <p className="mono-body mb-2">SET key_1 value_1</p>
      <p className="mono-data">36,234 ops/sec</p>
    </main>
  );
}
