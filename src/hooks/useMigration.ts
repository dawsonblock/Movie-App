"use client";

import { useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { performMigration } from "@/utils/migration";

const MIGRATION_CHECK_KEY = "migration_checked";

/**
 * Client-side hook to trigger migration after authentication
 * This ensures localStorage is accessible when migration runs
 */
export function useMigration() {
  useEffect(() => {
    const checkAndMigrate = async () => {
      try {
        // Check if we've already attempted migration for this session
        const hasChecked = localStorage.getItem(MIGRATION_CHECK_KEY);
        if (hasChecked) {
          return;
        }

        // Check if user is authenticated
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          // User is authenticated, perform migration
          console.info("Starting client-side migration...");
          const result = await performMigration();
          console.info("Migration result:", result);
        }

        // Mark that we've checked for migration
        localStorage.setItem(MIGRATION_CHECK_KEY, "true");
      } catch (error) {
        console.error("Migration check failed:", error);
      }
    };

    checkAndMigrate();
  }, []);
}