// Combine an industry id and a specialization name into the slug stored on User.industry
export function toIndustrySlug(industryId, subIndustryName) {
  return `${industryId}-${subIndustryName.toLowerCase().replace(/ /g, "-")}`;
}

// Reverse toIndustrySlug against the industries list to recover the industry + specialization
export function fromIndustrySlug(slug, industries) {
  const industry = industries.find((ind) => slug?.startsWith(`${ind.id}-`));
  if (!industry) return { industryId: null, subIndustryName: null };

  const rest = slug.slice(industry.id.length + 1);
  const subIndustryName = industry.subIndustries.find(
    (sub) => sub.toLowerCase().replace(/ /g, "-") === rest
  );

  return { industryId: industry.id, subIndustryName: subIndustryName ?? null };
}

// Turn a free-typed industry/specialization term into a URL-safe, DB-safe key
export function slugify(text) {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-+|-+$)/g, "");
}
