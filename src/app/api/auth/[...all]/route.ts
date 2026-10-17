import { getAuth, isAuthConfigured } from "@/lib/auth";

async function handler(request: Request) {
  if (!isAuthConfigured()) {
    return Response.json(
      { message: "Google sign-in is not configured yet." },
      { status: 503 },
    );
  }
  return getAuth().handler(request);
}
export { handler as GET, handler as POST };
