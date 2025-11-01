import { seoSchema } from "./landing-data";

export function SeoSchema() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(seoSchema),
      }}
    />
  );
}
