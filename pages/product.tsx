import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { UserButton, Protect } from "@clerk/nextjs";
import { PricingTable } from "@clerk/nextjs";
import { fetchEventSource } from "@microsoft/fetch-event-source";
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
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    setOutput("");
    const token = await getToken();
    const dateStr = leaseStartDate
      ? leaseStartDate.toISOString().split("T")[0]
      : "";

    await fetchEventSource("/api", {
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
      onmessage(ev) {
        setOutput((prev) => prev + ev.data + "\n");
      },
      onclose() {
        setLoading(false);
      },
      onerror() {
        setLoading(false);
      },
    });
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", padding: "1rem" }}>
        <UserButton showName={true} />
      </div>
      <Protect plan="premium_subscription" fallback={<PricingTable />}>
        <h1>Landlord-Tenant Dispute Advisor</h1>

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

        {output && (
          <div className="output">
            <ReactMarkdown>{output}</ReactMarkdown>
          </div>
        )}
      </Protect>
    </div>
  );
}
