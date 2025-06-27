create or replace function public.handle_new_user
returns trigger
language plpgsql
as $$

DECLARE
    _role text;
    _profile_exists boolean;
    _username text;
BEGIN
    -- Check if profile already exists first to avoid race conditions
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = NEW.id) INTO _profile_exists;
    
    -- If profile already exists, just return 
    IF _profile_exists THEN
        RAISE LOG 'Profile for user % already exists, skipping creation', NEW.id;
        RETURN NEW;
    END IF;

    -- Safely convert role from metadata with better error handling
    BEGIN
        -- First check if the role value is valid 
        IF NEW.raw_user_meta_data->>'role' IN ('dealer', 'seller', 'admin') THEN
            _role := NEW.raw_user_meta_data->>'role';
        ELSE
            _role := 'dealer';
        END IF;
        
        -- Insert the profile with error handling
        INSERT INTO public.profiles (
            id,
            role,
            full_name,
            updated_at
        )
        VALUES (
            NEW.id,
            _role::user_role,
            COALESCE(NEW.raw_user_meta_data->>'user_name', ''),
            NOW()
        );
        
        -- If the user is a seller, also create a seller profile with verified status
        IF _role = 'seller' THEN
            INSERT INTO public.sellers (
                user_id,
                full_name,
                created_at,
                updated_at,
                verification_status,
                is_verified
            )
            VALUES (
                NEW.id,
                COALESCE(NEW.raw_user_meta_data->>'user_name', ''),
                NOW(),
                NOW(),
                'verified',  -- Set verification_status to verified
                true         -- Set is_verified to true
            );
            RAISE LOG 'Created verified seller record for user %', NEW.id;
        END IF;
        
        RAISE LOG 'Created profile for user %', NEW.id;
    EXCEPTION 
        WHEN unique_violation THEN
            -- Profile already exists, ignore
            RAISE LOG 'Profile for user % already exists (unique violation caught)', NEW.id;
        WHEN OTHERS THEN
            -- Log error but don't fail the trigger
            RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    END;
    
    RETURN NEW;
END;

$$;