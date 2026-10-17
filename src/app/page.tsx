import { headers } from "next/headers";
import { RecallApp } from "@/components/recall-app";
import { getAuth, isAuthConfigured } from "@/lib/auth";
import { hasOpenRouter } from "@/lib/ai/openrouter";
import { hasCloudinary } from "@/lib/cloudinary";
import { loadWorkspace } from "@/lib/workspace-server";

export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ authError?: string }>;
}) {
  const authError = Boolean((await searchParams).authError);
  const authEnabled = isAuthConfigured();
  let user: { name: string; email: string } | null = null;
  let initialWorkspace = null;
  let loadError = false;
  if (authEnabled) {
    try {
      const session = await getAuth().api.getSession({
        headers: await headers(),
      });
      if (session) {
        user = { name: session.user.name, email: session.user.email };
        initialWorkspace = await loadWorkspace(session.user.id);
      }
    } catch (error) {
      // Keep tokens, connection strings, and study content out of diagnostics.
      console.error(
        "Account load failed",
        error instanceof Error ? error.name : "UnknownError",
      );
      loadError = true;
    }
  }
  return (
    <RecallApp
      uploadsEnabled={hasCloudinary()}
      aiEnabled={hasOpenRouter()}
      user={user}
      initialWorkspace={initialWorkspace}
      authEnabled={authEnabled}
      loadError={loadError}
      authError={authError}
    />
  );
}
