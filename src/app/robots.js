export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
      },
    ],
    sitemap: "https://teamhomeservices.ca/sitemap.xml",
  };
}
