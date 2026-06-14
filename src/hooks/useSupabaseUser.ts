"use client";

import { useQuery } from "@tanstack/react-query";

const fetchUser = async (): Promise<null> => {
  return null;
};

const useSupabaseUser = () => {
  const query = useQuery({
    queryKey: ["supabase-user"],
    queryFn: fetchUser,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  return query;
};

export default useSupabaseUser;
