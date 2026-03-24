"use client";
import { createContext, useContext, useState } from "react";

const CompanyContext = createContext();

export function CompanyProvider({ children }) {
  // 🔥 CAMBIO CLAVE → default "all"
  const [selectedCompanyId, setSelectedCompanyId] = useState("all");

  return (
    <CompanyContext.Provider
      value={{ selectedCompanyId, setSelectedCompanyId }}
    >
      {children}
    </CompanyContext.Provider>
  );
}

export const useCompany = () => useContext(CompanyContext);
