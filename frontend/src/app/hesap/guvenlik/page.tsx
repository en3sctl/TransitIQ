"use client";

import { AccountLayout } from "@/components/hesap/account-layout";
import { Security2FAPanel } from "@/components/admin/security-2fa-panel";
import { SecuritySessionsPanel } from "@/components/admin/security-sessions-panel";

export default function SecurityPage() {
  return (
    <AccountLayout
      title="Güvenlik"
      subtitle="İki adımlı doğrulama ve aktif oturumlar."
    >
      <div className="space-y-6">
        <Security2FAPanel />
        <SecuritySessionsPanel />
      </div>
    </AccountLayout>
  );
}
