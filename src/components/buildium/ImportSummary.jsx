"use client";

import { Building2, Home, Users } from "lucide-react";

export default function ImportSummary({ preview }) {
  return (
    <div className="bg-gray-50 rounded-xl p-4 space-y-3 border">
      <h3 className="font-medium text-sm text-gray-700">Data Preview</h3>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="bg-white rounded-lg p-3 shadow-sm">
          <Building2 className="mx-auto mb-1 w-4 h-4" />
          <p className="text-lg font-semibold">{preview.properties}</p>
          <p className="text-xs text-gray-500">Properties</p>
        </div>

        <div className="bg-white rounded-lg p-3 shadow-sm">
          <Home className="mx-auto mb-1 w-4 h-4" />
          <p className="text-lg font-semibold">{preview.units}</p>
          <p className="text-xs text-gray-500">Units</p>
        </div>

        <div className="bg-white rounded-lg p-3 shadow-sm">
          <Users className="mx-auto mb-1 w-4 h-4" />
          <p className="text-lg font-semibold">{preview.tenants || 0}</p>
          <p className="text-xs text-gray-500">Tenants</p>
        </div>
      </div>
    </div>
  );
}
