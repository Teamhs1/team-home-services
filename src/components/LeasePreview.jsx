"use client";

export default function LeasePreview({ template, application }) {
  if (!template || !application) return null;

  // 🔥 reemplazar variables dinámicas
  const content = template.content
    ?.replace(
      /{{tenant_name}}/g,
      `${application.first_name} ${application.last_name}`,
    )
    ?.replace(/{{unit}}/g, application.unit?.unit || "N/A")
    ?.replace(/{{property_address}}/g, application.property?.address || "N/A")
    ?.replace(/{{company_name}}/g, application.company?.name || "N/A")
    ?.replace(/{{rent_amount}}/g, application.unit?.rent_price || "N/A");

  return (
    <div className="bg-white border rounded-2xl shadow-sm p-6 space-y-4">
      <h2 className="text-xl font-semibold">Lease Preview</h2>

      <div className="prose max-w-none text-sm text-gray-700 whitespace-pre-wrap">
        {content}
      </div>
    </div>
  );
}
