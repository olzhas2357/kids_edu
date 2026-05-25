import Link from 'next/link';
import { Card } from '@/components/ui/card';

export default function SuccessPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="max-w-lg text-center">
        <p className="text-4xl">🎉</p>
        <h1 className="mt-4 text-2xl font-bold text-green-800">Курсты сәтті аяқтадың!</h1>
        <p className="mt-2 text-slate-600">Сіз курсты сәтті аяқтадыңыз. Керемет жұмыс!</p>
        <Link href="/student/course" className="mt-6 inline-block text-indigo-600 hover:underline">
          Курске қайту
        </Link>
      </Card>
    </div>
  );
}
