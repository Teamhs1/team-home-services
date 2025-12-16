export default function ServiceDetailPage({ params }) {
  const { slug } = params;

  const servicesConfig = {
    "standard-cleaning": {
      title: "Standard Cleaning",
      description:
        "Reliable, routine cleaning to keep your home or rental fresh, organized, and comfortable — without the stress.",
      includes: [
        "Cleaning and sanitizing kitchen surfaces",
        "Full bathroom cleaning and disinfection",
        "Vacuuming carpets and mopping hard floors",
        "Dusting furniture, shelves, and surfaces",
        "Wiping baseboards, doors, and light switches",
        "Garbage removal and final touch-up",
      ],
      idealFor:
        "Busy homeowners, tenants, Airbnb hosts, and property managers who want a consistently clean space on a regular schedule.",
    },

    "deep-cleaning": {
      title: "Deep Cleaning",
      description:
        "A detailed, top-to-bottom cleaning designed to eliminate built-up dirt, grease, and hidden grime throughout the home.",
      includes: [
        "Cleaning inside cabinets and drawers",
        "Deep scrubbing and descaling bathrooms",
        "Detailed baseboards, trim, and edges",
        "Exterior cleaning of kitchen appliances",
        "Oven interior cleaning (grease and buildup removal)",
        "Disinfection of high-touch areas",
        "Removal of heavy dust and stubborn buildup",
      ],
      idealFor:
        "Move-ins, move-outs, seasonal resets, post-renovation cleanups, or homes that require a deeper level of attention.",
    },

    "maintenance-support": {
      title: "Maintenance Support",
      description:
        "Ongoing property support to keep everything running smoothly — small fixes, inspections, and preventive care.",
      includes: [
        "Minor repairs and small fixes",
        "Door, lock, and hardware adjustments",
        "Light fixture and bulb replacements",
        "Basic plumbing issue troubleshooting",
        "Routine property inspections",
        "Preventive maintenance checks",
      ],
      idealFor:
        "Landlords and property managers who want reliable, all-in-one support without coordinating multiple contractors.",
    },
  };

  const service = servicesConfig[slug];

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
        {/* GRID */}
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
