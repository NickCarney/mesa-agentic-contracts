import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );

export async function handleSupabaseSubscription() {
    // Subscribe to changes in the contracts table
    console.log("starting subscription");
    const channel = supabase
      .channel("schema-db-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "contracts",
        },
        async (payload) => {
          console.log("New row added:", payload);
          const ipfs_url =
            "https://mesa.mypinata.cloud/ipfs/" + payload.new.ipfs_cid;
            console.log("IPFS URL:", ipfs_url);
        }
      )
      .subscribe((status) => {
        console.log("Subscription status:", status);
      });
  
    channel.on("error", (error) => {
      console.error("Error in channel subscription:", error);
    });
  }