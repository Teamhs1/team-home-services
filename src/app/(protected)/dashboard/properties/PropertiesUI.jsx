"use client";

export default function PropertiesUI({ properties }) {
  if (!properties.length) {
    return (
      <p className="text-muted-foreground">
        No properties assigned to your company.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {properties.map((property) => (
        <div
          key={property.id}
          className="rounded-lg border bg-white p-4 shadow-sm hover:shadow-md transition"
        >
          <h3 className="font-medium">{property.name}</h3>
          {property.address && (
            <p className="text-sm text-muted-foreground">{property.address}</p>
          )}
          {property.unit && (
            <p className="text-sm text-muted-foreground">
              Unit {property.unit}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
