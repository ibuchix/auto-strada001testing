create or replace function public.sync_user_name_to_profiles()
returns boolean
language plpgsql
security definer
as $$
declare
  current_user_id uuid := auth.uid();  -- Supabase injects this automatically for authenticated users
  username text;
  updated int;
begin
  -- Fetch user_name from auth.users
  select raw_user_meta_data ->> 'user_name'
  into username
  from auth.users
  where id = current_user_id;

  -- If no user_name set, return false
  if username is null or length(trim(username)) = 0 then
    return false;
  end if;

  -- Update profiles.full_name if it doesn't match
  update public.profiles
  set full_name = username
  where user_id = current_user_id and (full_name is distinct from username);

  -- Update sellers.full_name if it doesn't match
  update public.sellers
  set full_name = username
  where user_id = current_user_id and (full_name is distinct from username);

  return true;
end;
$$;
