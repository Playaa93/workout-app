import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#0a0a09]">
      <div className="text-center space-y-4 max-w-sm">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-[#d4af37]/10 border border-[#d4af37]/20 flex items-center justify-center">
          <svg className="w-8 h-8 text-[#d4af37]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-[#f5f0e6] tracking-tight">
          Page introuvable
        </h2>
        <p className="text-[#6b655c] text-sm leading-relaxed">
          Cette page n&apos;existe pas ou a &eacute;t&eacute; d&eacute;plac&eacute;e.
        </p>
        <Link
          href="/"
          className="inline-block mt-2 px-5 py-2.5 bg-[#d4af37] hover:bg-[#e8c860] text-[#1a1715] rounded-xl text-sm font-semibold transition-colors"
        >
          Retour &agrave; l&apos;accueil
        </Link>
      </div>
    </div>
  );
}
