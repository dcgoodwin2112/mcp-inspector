import { getPublicProfile } from "@/lib/profiles";

export async function GET() {
  return Response.json(getPublicProfile());
}
