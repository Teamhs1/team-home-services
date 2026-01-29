export const COMPANY_ROLE_PERMISSIONS = {
  owner: ["*"],

  property_manager: [
    "view_properties",
    "edit_properties",
    "assign_jobs",
    "view_reports",
    "manage_members",
  ],

  leasing_manager: [
    "view_properties",
    "edit_listings",
    "publish_rentals",
    "assign_leasing_agents",
    "view_applications",
  ],

  leasing_agent: [
    "view_properties",
    "view_rentals",
    "create_showings",
    "update_application_status",
  ],

  maintenance_manager: ["view_properties", "assign_jobs", "view_all_jobs"],

  maintenance_staff: ["view_assigned_jobs", "complete_jobs"],

  accountant: ["view_invoices", "view_expenses", "export_reports"],

  viewer: ["view_properties"],
};
