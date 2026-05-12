import Link from "next/link";
import { Button, LayoutWrapper } from "@whatsapp-saas/ui";

export default function HomePage() {
  return (
    <LayoutWrapper className="landing-hero">
      <header className="landing-hero-copy">
        <span className="landing-eyebrow">WhatsApp SaaS</span>
        <h1>Conversations that convert.</h1>
        <p>
          Skeleton landing page. Replace this with the real hero, features, and
          marketing content. Each section can be developed by its owner.
        </p>
        <div className="landing-cta-row">
          <Link href={process.env.NEXT_PUBLIC_WEB_APP_URL ?? "/"}>
            <Button>Open the app</Button>
          </Link>
          <Button variant="secondary">Talk to sales</Button>
        </div>
      </header>
    </LayoutWrapper>
  );
}
