const domains = [
  ...new Set(
    [
      process.env.CLERK_JWT_ISSUER_DOMAIN,
      process.env.CLERK_FRONTEND_API_URL,
    ].filter((v): v is string => Boolean(v)),
  ),
];

export default {
  providers: domains.map((domain) => ({ domain, applicationID: "convex" })),
};
