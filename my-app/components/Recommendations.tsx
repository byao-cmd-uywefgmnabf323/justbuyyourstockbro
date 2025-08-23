import Link from 'next/link';

export default function Recommendations() {
  return (
    <section className="border border-gray-300 bg-white p-4">
      <div className="flex justify-between items-center mb-2">
        <h2 className="font-semibold text-black">Recommendations</h2>
        <Link href="/onboarding" className="text-sm underline">
          Update Profile
        </Link>
      </div>
      <p className="text-sm text-gray-600 mb-4">
        Generate new picks from your profile on the onboarding page. Coming soon: inline generation here.
      </p>
      <div className="grid grid-cols-2 gap-4">
        <div className="border border-dashed border-gray-300 p-4 text-center">
          <p className="text-sm text-gray-500">[Ticker] | $Price | 24h %</p>
        </div>
        <div className="border border-dashed border-gray-300 p-4 text-center">
          <p className="text-sm text-gray-500">[Ticker] | $Price | 24h %</p>
        </div>
      </div>
    </section>
  );
}
