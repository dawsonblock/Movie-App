-- Create a function to automatically create a profile when a new user is added to auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Generate a unique username based on email or user metadata
  DECLARE
    base_username TEXT;
    unique_username TEXT;
    attempt_count INTEGER := 0;
    max_attempts INTEGER := 10;
  BEGIN
    -- Try to get username from user metadata first (from sign-up form)
    IF NEW.raw_user_meta_data->>'username' IS NOT NULL THEN
      base_username := NEW.raw_user_meta_data->>'username';
    ELSE
      -- Fallback to email-based username
      base_username := split_part(NEW.email, '@', 1);
    END IF;
    
    -- Try to find a unique username
    WHILE attempt_count < max_attempts LOOP
      -- Check if username exists
      SELECT username INTO unique_username
      FROM public.profiles
      WHERE username = base_username
      LIMIT 1;
      
      IF unique_username IS NULL THEN
        -- Username is available
        unique_username := base_username;
        EXIT;
      END IF;
      
      -- Username taken, add random suffix with larger range for better uniqueness
      unique_username := base_username || '#' || floor(random() * 999999 + 100000)::TEXT;
      attempt_count := attempt_count + 1;
      
      -- Check if the new username is available
      SELECT username INTO unique_username
      FROM public.profiles
      WHERE username = unique_username
      LIMIT 1;
      
      IF unique_username IS NULL THEN
        EXIT;
      END IF;
    END LOOP;
    
    -- Fallback: use timestamp if still can't find unique
    IF unique_username IS NULL THEN
      unique_username := base_username || EXTRACT(EPOCH FROM NOW())::TEXT;
    END IF;
    
    -- Insert the new profile
    INSERT INTO public.profiles (id, username)
    VALUES (NEW.id, unique_username);
    
    RETURN NEW;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger that calls the function when a new user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add a comment to document the trigger
COMMENT ON FUNCTION public.handle_new_user IS 'Automatically creates a profile entry when a new user is added to auth.users';

COMMENT ON TRIGGER on_auth_user_created ON auth.users IS 'Trigger to automatically create profile on user registration';