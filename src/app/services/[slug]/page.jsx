import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function ServiceDetailPage({ params }) {
  const { slug } = params;

  // 🔹 Traer service_details desde Supabase
  const { data, error } = await supabase
    .from("site_content")
    .select("content")
    .eq("section", "service_details")
    .single();

  if (error || !data?.content?.items) {
    return (
      <main className="min-h-screen flex items-center justify-center text-gray-600">
        <p>Service not found.</p>
      </main>
    );
  }

  // 🔹 Buscar servicio por slug
  const service = data.content.items.find((item) => item.slug === slug);

  if (!service) {
    return (
      <main className="min-h-screen flex items-center justify-center text-gray-600">
        <p>Service not found.</p>
      </main>
    );
  }

  return (
    <main className="bg-gray-50 text-gray-800">
      {/* HERO */}
      <section className="relative bg-gradient-to-br from-blue-600 to-blue-500 text-white py-24 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <span className="inline-block mb-4 px-4 py-1 rounded-full bg-white/20 text-sm font-medium">
            Our Services
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-6">
            {service.title}
          </h1>
          <p className="max-w-2xl mx-auto text-lg text-blue-100">
            {service.description}
          </p>
        </div>
      </section>

      {/* CONTENT */}
      <section className="max-w-6xl mx-auto px-6 py-20 space-y-20">
        <div className="grid md:grid-cols-2 gap-12">
          {/* INCLUDED */}
          <div className="bg-white rounded-2xl shadow-sm p-8">
            <h2 className="text-2xl font-semibold mb-6">What’s Included</h2>
            <ul className="space-y-4">
              {service.includes.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-gray-700">
                  <span className="mt-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-sm">
                    ✓
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* IDEAL FOR */}
          <div className="bg-white rounded-2xl shadow-sm p-8 flex flex-col justify-between">
            <div>
              <h2 className="text-2xl font-semibold mb-6">Ideal For</h2>
              <p className="text-gray-700 leading-relaxed">
                {service.idealFor}
              </p>
            </div>

            <div className="mt-10">
              <div className="rounded-xl bg-blue-50 p-6">
                <p className="text-sm text-blue-700 font-medium mb-2">
                  Not sure if this service fits your needs?
                </p>
                <p className="text-sm text-blue-600">
                  Contact us and we’ll help you choose the right option.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <div className="inline-flex flex-col items-center gap-6 bg-white rounded-2xl shadow-sm px-10 py-12">
            <h3 className="text-2xl font-semibold">Ready to get started?</h3>
            <p className="text-gray-600 max-w-md">
              Request a personalized quote for <strong>{service.title}</strong>{" "}
              and let our team take care of the rest.
            </p>
            <a
              href="/#contact"
              className="inline-flex items-center justify-center px-10 py-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Request a Quote
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
