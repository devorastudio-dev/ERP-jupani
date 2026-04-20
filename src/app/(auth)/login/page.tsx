import { CupSoda } from "lucide-react";
import { LoginForm } from "@/features/auth/components/login-form";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(244,114,182,0.24),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(251,146,60,0.18),transparent_25%),linear-gradient(180deg,#fff8f5_0%,#fffdfb_100%)] px-4 py-10">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-10 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="space-y-6">
          <div className="inline-flex items-center gap-3 rounded-full border border-rose-200 bg-white/80 px-4 py-2 text-sm text-rose-700">
            <CupSoda className="h-4 w-4" />
            ERP interno para confeitaria artesanal
          </div>
          <div className="space-y-4">
            <h1 className="max-w-2xl text-5xl font-semibold leading-tight text-stone-900">
              Gestão bonita, enxuta e pronta para crescer com a Jupani.
            </h1>
            <p className="max-w-xl text-lg text-stone-600">
              Controle produtos, encomendas, caixa, compras, estoque, produção e relatórios em uma operação única.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              "Pedidos e encomendas",
              "Fluxo de caixa",
              "Estoque com ficha técnica",
            ].map((item) => (
              <div key={item} className="rounded-3xl border border-rose-100 bg-white/70 p-5 text-sm text-stone-600 shadow-sm">
                {item}
              </div>
            ))}
          </div>
        </section>
        <div className="flex justify-center lg:justify-end">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
