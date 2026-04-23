import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { UserButton, Protect } from "@clerk/nextjs";
// @ts-ignore - PricingTable may not be in all @clerk/nextjs versions
import { PricingTable } from "@clerk/nextjs";
import ReactMarkdown from "react-markdown";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function ProductPage() {
  const { getToken } = useAuth();
  const [userRole, setUserRole] = useState("tenant");
  const [provinceOrState, setProvinceOrState] = useState("");
  const [disputeCategory, setDisputeCategory] = useState("deposit");
  const [leaseStartDate, setLeaseStartDate] = useState<Date | null>(null);
  const [disputeDescription, setDisputeDescription] = useState("");
  const [desiredOutcome, setDesiredOutcome] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError("");

    if (!provinceOrState || provinceOrState.length < 2) {
      setError("Please enter your province or state.");
      return;
    }
    if (!leaseStartDate) {
      setError("Please select a lease start date.");
      return;
    }
    if (disputeDescription.length < 50) {
      setError("Dispute description must be at least 50 characters.");
      return;
    }
    if (desiredOutcome.length < 10) {
      setError("Desired outcome must be at least 10 characters.");
      return;
    }

    setLoading(true);
    setOutput("");

    try {
      const token = await getToken();
      const dateStr = leaseStartDate.toISOString().split("T")[0];

      const res = await fetch("/api/advisor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_role: userRole,
          province_or_state: provinceOrState,
          dispute_category: disputeCategory,
          lease_start_date: dateStr,
          dispute_description: disputeDescription,
          desired_outcome: desiredOutcome,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const msg = data.details ? data.details.join(", ") : data.error || "API request failed";
        setError(msg);
      } else {
        setOutput(data.response);
      }
    } catch (err: any) {
      setError(err?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", padding: "1rem" }}>
        <UserButton showName={true} />
      </div>

      {/* Clerk <Protect> renders the advisor form only for premium subscribers;
          everyone else sees the <PricingTable /> paywall as a fallback. */}
      {/* @ts-ignore - plan prop available in newer Clerk versions */}
      <Protect plan="premium_subscription" fallback={<PricingTable />}>
        <h1>Landlord-Tenant Dispute Advisor</h1>

        {/* --- Intake form: all fields map 1:1 to the backend InputRecord Pydantic model --- */}

        <label>I am a:</label>
        <select value={userRole} onChange={(e) => setUserRole(e.target.value)}>
          <option value="tenant">Tenant</option>
          <option value="landlord">Landlord</option>
        </select>

        <label>Province / State:</label>
        <input
          type="text"
          placeholder="e.g. Ontario"
          value={provinceOrState}
          onChange={(e) => setProvinceOrState(e.target.value)}
        />

        <label>Dispute Category:</label>
        <select
          value={disputeCategory}
          onChange={(e) => setDisputeCategory(e.target.value)}
        >
          <option value="deposit">Security Deposit</option>
          <option value="maintenance">Maintenance / Repairs</option>
          <option value="eviction">Eviction</option>
          <option value="noise">Noise / Disturbance</option>
          <option value="lease_violation">Lease Violation</option>
        </select>

        <label>Lease Start Date:</label>
        <DatePicker
          selected={leaseStartDate}
          onChange={(date: Date | null) => setLeaseStartDate(date)}
          dateFormat="yyyy-MM-dd"
          placeholderText="YYYY-MM-DD"
        />

        <label>Describe Your Dispute:</label>
        <textarea
          placeholder="Describe what happened in detail (min 50 characters)..."
          value={disputeDescription}
          onChange={(e) => setDisputeDescription(e.target.value)}
          rows={5}
        />

        <label>Desired Outcome:</label>
        <input
          type="text"
          placeholder="e.g. Full refund of security deposit"
          value={desiredOutcome}
          onChange={(e) => setDesiredOutcome(e.target.value)}
        />

        <button onClick={handleSubmit} disabled={loading}>
          {loading ? "Analyzing..." : "Get Advice"}
        </button>

        {error && (
          <div style={{ color: "red", marginTop: "1rem", padding: "0.75rem", backgroundColor: "#fff0f0", borderRadius: "6px", border: "1px solid #ffcccc" }}>
            {error}
          </div>
        )}

        {/* Render the streamed Markdown (rights summary, analysis, letter, next steps) */}
        {output && (
          <div className="output">
            <ReactMarkdown>{output}</ReactMarkdown>
          </div>
        )}
      </Protect>
    </div>
  );
}
