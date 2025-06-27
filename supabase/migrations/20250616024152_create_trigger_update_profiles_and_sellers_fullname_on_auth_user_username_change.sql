create or replace function public.sync_full_name_on_user_name_change()
returns trigger
language plpgsql
security definer
as $$
declare
  new_name text;
begin
  -- Only proceed if user_name has changed
  if (new.raw_user_meta_data ->> 'user_name') is distinct from (old.raw_user_meta_data ->> 'user_name') then
    new_name := new.raw_user_meta_data ->> 'user_name';

    -- Update full_name in profiles
    update public.profiles
    set full_name = new_name
    where user_id = new.id;

    -- Update full_name in sellers
    update public.sellers
    set full_name = new_name
    where user_id = new.id;
  end if;

  return new;
end;
$$;


create trigger after_update_user_name_sync_full_name
after update on auth.users
for each row
when (
  (new.raw_user_meta_data ->> 'user_name') is distinct from (old.raw_user_meta_data ->> 'user_name')
)
execute function public.sync_full_name_on_user_name_change();
