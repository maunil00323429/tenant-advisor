// Landing page — public-facing marketing page that introduces the product.
// Unauthenticated visitors see a sign-in button; signed-in users see their Clerk profile widget.

import { SignInButton, UserButton, useUser } from "@clerk/nextjs";
import Link from "next/link";

export default function LandingPage() {
  // Clerk hook to toggle between sign-in CTA and user avatar
  const { isSignedIn } = useUser();

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", color: "#1a1a1a" }}>
      {/* Nav bar — shows Clerk UserButton when signed in, SignInButton otherwise */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "1rem 2rem",
          borderBottom: "1px solid #e5e5e5",
        }}
      >
        <h2 style={{ margin: 0 }}>Tenant Advisor</h2>
        {isSignedIn ? <UserButton showName={true} /> : <SignInButton />}
      </header>

      {/* Hero — primary value proposition and CTA to the advisor form */}
      <section style={{ textAlign: "center", padding: "4rem 2rem" }}>
        <h1 style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>
          Know Your Rights Before You Respond
        </h1>
        <p style={{ fontSize: "1.2rem", color: "#555", maxWidth: "600px", margin: "0 auto 2rem" }}>
          AI-powered dispute advice for tenants and landlords. Get a rights summary,
          a professional response letter, and step-by-step next steps — in seconds.
        </p>
        {/* Routes to the gated product page (/product) */}
        <Link href="/product">
          <button
            style={{
              padding: "0.8rem 2rem",
              fontSize: "1.1rem",
              backgroundColor: "#2563eb",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            Get Your Free Analysis
          </button>
        </Link>
      </section>

      {/* Feature cards — mirrors the four Markdown sections the AI produces */}
      <section style={{ padding: "3rem 2rem", backgroundColor: "#f9fafb" }}>
        <h2 style={{ textAlign: "center", marginBottom: "2rem" }}>What You Get</h2>
        <div style={{ display: "flex", gap: "2rem", justifyContent: "center", flexWrap: "wrap" }}>
          <div style={{ maxWidth: "280px", textAlign: "center" }}>
            <h3>Rights Summary</h3>
            <p>Plain-language breakdown of your legal rights based on your province or state.</p>
          </div>
          <div style={{ maxWidth: "280px", textAlign: "center" }}>
            <h3>Response Letter</h3>
            <p>A professional, ready-to-send letter addressing your landlord or tenant directly.</p>
          </div>
          <div style={{ maxWidth: "280px", textAlign: "center" }}>
            <h3>Escalation Steps</h3>
            <p>Numbered next steps from informal resolution to tenant board and small claims court.</p>
          </div>
        </div>
      </section>

      {/* Pricing tiers — Free tier is informational, Premium unlocks the advisor via Clerk plans */}
      <section style={{ padding: "3rem 2rem", textAlign: "center" }}>
        <h2>Pricing</h2>
        <div style={{ display: "flex", gap: "2rem", justifyContent: "center", marginTop: "1.5rem" }}>
          <div style={{ border: "1px solid #e5e5e5", borderRadius: "12px", padding: "2rem", width: "250px" }}>
            <h3>Free</h3>
            <p>Browse the landing page and sign up to explore.</p>
          </div>
          <div style={{ border: "2px solid #2563eb", borderRadius: "12px", padding: "2rem", width: "250px" }}>
            <h3>Premium</h3>
            <p>Full access to the AI dispute advisor with unlimited analyses.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
