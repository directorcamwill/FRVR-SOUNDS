import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Welcome } from "@/components/welcome";

// Smart landing:
// - Signed in → /command-center (artist home)
// - Anonymous → Welcome chooser (Artist vs Music Supervisor)
//   Returning anonymous visitors with a saved role skip the chooser client-side.
export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/command-center");
  return <Welcome />;
}
