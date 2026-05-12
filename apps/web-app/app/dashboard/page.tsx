import { Card } from "@whatsapp-saas/ui";
import { formatDate } from "@whatsapp-saas/utils";

export default function DashboardPage() {
  return (
    <div className="dashboard">
      <h1>Dashboard</h1>
      <p>Placeholder dashboard. Today is {formatDate(new Date())}.</p>
      <Card style={{ marginTop: 24 }}>
        <strong>Welcome</strong>
        <p>
          This is a skeleton workspace. Module owners can build out conversations,
          contacts, broadcasts, and automations from here.
        </p>
      </Card>
    </div>
  );
}
