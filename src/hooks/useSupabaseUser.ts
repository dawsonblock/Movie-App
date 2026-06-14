"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";

interface UserProfile {
  id: string;
  username: string;
  email?: string;
}

const fetchUser = async (): Promise<UserProfile | null> => {
  try {
    const supabase = createClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return null;
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return null;
    }

    return {
      id: user.id,
      username: profile.username,
      email: user.email,
    };
  } catch (error) {
    console.error("Error fetching user:", error);
    return null;
  }
};

const useSupabaseUser = () => {
  const query = useQuery({
    queryKey: ["supabase-user"],
    queryFn: fetchUser,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: false,
    retry: 1,
  });

  return query;
};

export default useSupabaseUser;
