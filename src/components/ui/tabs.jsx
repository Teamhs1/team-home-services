"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

// 🧩 Contenedor principal de las pestañas
export const Tabs = TabsPrimitive.Root;

// 🧩 Lista de pestañas
export const TabsList = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-10 items-center justify-center rounded-md bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400",
      className
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

// 🧩 Botón individual de pestaña
export const TabsTrigger = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "px-4 py-2 text-sm font-medium transition-all",
      "data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400",
      "data-[state=active]:border-b-2 data-[state=active]:border-blue-500",
      "hover:text-blue-500 focus:outline-none",
      className
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

// 🧩 Contenido de cada pestaña
export const TabsContent = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn("mt-4 outline-none focus-visible:ring-0", className)}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;
