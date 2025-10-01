-- =====================================================
-- HAVEIBEENPWNED PASSWORD CHECKING FUNCTION
-- Server-side implementation for Supabase
-- =====================================================

-- Create a secure function to check passwords against HaveIBeenPwned
-- This runs server-side to protect password security
CREATE OR REPLACE FUNCTION auth.check_password_pwned(password_input text)
RETURNS json AS $$
DECLARE
    password_sha1 text;
    sha1_prefix text;
    sha1_suffix text;
    hibp_response text;
    response_lines text[];
    line_parts text[];
    current_line text;
    found_count integer;
BEGIN
    -- Input validation
    IF password_input IS NULL OR length(password_input) = 0 THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Password cannot be empty'
        );
    END IF;

    -- Generate SHA-1 hash of the password (uppercase)
    password_sha1 := upper(encode(digest(password_input, 'sha1'), 'hex'));
    
    -- Split into prefix (first 5 chars) and suffix (remaining 35 chars)
    sha1_prefix := substring(password_sha1 from 1 for 5);
    sha1_suffix := substring(password_sha1 from 6);

    -- Make HTTP request to HaveIBeenPwned API using k-anonymity
    -- This only sends the first 5 characters of the hash
    SELECT content INTO hibp_response
    FROM http((
        'GET',
        'https://api.pwnedpasswords.com/range/' || sha1_prefix,
        ARRAY[
            http_header('Add-Padding', 'true'),
            http_header('User-Agent', 'ShieldNest-Security-Check')
        ],
        NULL,
        NULL
    )::http_request);

    -- Handle HTTP errors
    IF hibp_response IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Unable to connect to password security service'
        );
    END IF;

    -- Parse the response to find our password hash suffix
    response_lines := string_to_array(hibp_response, E'\n');
    found_count := 0;

    FOREACH current_line IN ARRAY response_lines
    LOOP
        -- Skip empty lines
        IF length(trim(current_line)) = 0 THEN
            CONTINUE;
        END IF;

        -- Split line by colon: "SUFFIX:COUNT"
        line_parts := string_to_array(trim(current_line), ':');
        
        -- Check if this matches our password's suffix
        IF array_length(line_parts, 1) = 2 AND upper(line_parts[1]) = sha1_suffix THEN
            found_count := COALESCE(line_parts[2]::integer, 0);
            EXIT; -- Password found in breach database
        END IF;
    END LOOP;

    -- Return result
    IF found_count > 0 THEN
        RETURN json_build_object(
            'success', true,
            'pwned', true,
            'count', found_count,
            'message', 'This password has been found in ' || found_count || ' data breaches. Please choose a different password.'
        );
    ELSE
        RETURN json_build_object(
            'success', true,
            'pwned', false,
            'count', 0,
            'message', 'Password appears to be secure'
        );
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        -- Log error securely (don't log the password!)
        RAISE LOG 'HaveIBeenPwned check failed: %', SQLERRM;
        
        RETURN json_build_object(
            'success', false,
            'error', 'Password security check temporarily unavailable'
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION auth.check_password_pwned TO authenticated;

-- Create a simplified version for use in auth hooks
CREATE OR REPLACE FUNCTION auth.is_password_pwned(password_input text)
RETURNS boolean AS $$
DECLARE
    result json;
BEGIN
    result := auth.check_password_pwned(password_input);
    
    -- Return true if password is pwned, false otherwise
    RETURN COALESCE((result->>'pwned')::boolean, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION auth.is_password_pwned TO authenticated;

-- =====================================================
-- AUTH HOOK FOR AUTOMATIC PASSWORD CHECKING
-- =====================================================

-- Create a hook that automatically checks passwords during registration
CREATE OR REPLACE FUNCTION auth.check_password_strength()
RETURNS trigger AS $$
DECLARE
    password_check json;
BEGIN
    -- Only check on INSERT (new registrations) and when password changes
    IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.encrypted_password != NEW.encrypted_password) THEN
        
        -- Note: In Supabase, we can't access the raw password in triggers
        -- This would need to be implemented in your application logic instead
        -- See the Edge Function implementation below
        
        NULL; -- Placeholder for trigger logic
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: The trigger approach won't work because we can't access raw passwords
-- Instead, implement this in your application or Edge Function

-- =====================================================
-- EXAMPLE USAGE IN APPLICATION
-- =====================================================

/*
-- Example usage in your application:

-- 1. Before registering a user, check their password:
SELECT auth.check_password_pwned('user_password_here');

-- Returns:
-- {
--   "success": true,
--   "pwned": true,
--   "count": 12345,
--   "message": "This password has been found in 12345 data breaches..."
-- }

-- 2. Simple boolean check:
SELECT auth.is_password_pwned('password123');  -- Returns: true (pwned)
SELECT auth.is_password_pwned('MySecureP@ssw0rd!2024');  -- Returns: false (safe)

*/

-- =====================================================
-- EDGE FUNCTION INTEGRATION
-- =====================================================

-- For better integration, you should create a Supabase Edge Function
-- Here's the SQL to call from an Edge Function:

/*
CREATE OR REPLACE FUNCTION public.validate_user_password(user_password text)
RETURNS json AS $$
BEGIN
    -- This can be called from Edge Functions with better error handling
    RETURN auth.check_password_pwned(user_password);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.validate_user_password TO anon;
GRANT EXECUTE ON FUNCTION public.validate_user_password TO authenticated;
*/
