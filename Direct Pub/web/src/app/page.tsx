import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-(--size-content-max) flex-col justify-center gap-4 px-6">
      <h1 className="text-display">Direct Pub</h1>
      <p className="text-md text-text-muted">L&apos;application arrive. En attendant, le système de design :</p>
      <Link href="/design" className="text-link underline underline-offset-4">Voir les composants</Link>
    </main>
  );
}
