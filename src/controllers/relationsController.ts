import { supaClient } from "../hooks/supa-client.ts";
import { UserProfile } from "../hooks/use-session.ts";

const removeRelation = async (
  clientId: string,
  profile: UserProfile | null,
) => {
  try {
    const { error } = await supaClient
      .from("admin_client")
      .delete()
      .eq("admin_id", profile?.user_id)
      .eq("client_id", clientId);

    if (!error) {
      console.log("Relationship remove from Supabase");
      return true;
    } else {
      console.error("Failed to remove relationship from Supabase", error);
      return false;
    }
  } catch (error) {
    console.error("Error removing relationship from Supabase:", error);
    return false;
  }
};

const fetchRelation = async (profile: UserProfile | null) => {
  if (profile) {
    const { data, error } = await supaClient
      .from("admin_client")
      .select()
      .eq("client_id", profile?.user_id);
    if (error) {
      console.error("Error fetching client ID:", error.message);
      return null;
    } else {
      return data;
    }
  }
};
const sendRequest = async (selectedAdmin: any, profile: UserProfile | null) => {
  const { error } = await supaClient.from("admin_client").insert({
    admin_id: selectedAdmin.user_id,
    client_id: profile?.user_id,
    relation_status: "pending",
  });
  if (error) {
    throw error;
  }
};

const refuseRequest = async (relation: any) => {
  const { error } = await supaClient
    .from("admin_client")
    .delete()
    .eq("id", relation.id);
  if (error) {
    console.error("Failed to delete the relation", error);
    return false;
  } else {
    return true;
  }
};

const acceptRequest = async (relation: any) => {
  console.log("relation", relation);
  const { error } = await supaClient
    .from("admin_client")
    .update({ relation_status: "accepted" })
    .eq("id", relation.id);
  if (error) {
    console.error("Failed to update the relation", error);
    return false;
  } else {
    return true;
  }
};

const fetchNotifications = async (profile: UserProfile | null) => {
  if (profile) {
    const { data, error } = await supaClient
      .from("admin_client")
      .select()
      .eq("admin_id", profile?.user_id)
      .eq("relation_status", "pending")
      .limit(10);

    if (error) {
      console.error("Error fetching notifications:", error.message);
      return null;
    } else {
      return data;
    }
  }
};

export {
  removeRelation,
  fetchRelation,
  sendRequest,
  refuseRequest,
  acceptRequest,
  fetchNotifications,
};
