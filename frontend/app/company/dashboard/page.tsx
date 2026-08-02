/*These pages are where a customer manages their own:
AI Inventory
Risk Register
Compliance Assessments
Policies
Reports*/

export default function CompanyDashboard() {
  return (
    <main style={{ padding: "32px" }}>
      <h1>TrustGRC AI 360</h1>

      <h2>Organization Dashboard</h2>

      <p>
        Welcome to your Governance, Risk and Compliance portal.
      </p>

      <ul>
        <li>AI Inventory</li>
        <li>Assessments</li>
        <li>Generated Risks</li>
        <li>Policies</li>
        <li>Reports</li>
      </ul>
    </main>
  );
}