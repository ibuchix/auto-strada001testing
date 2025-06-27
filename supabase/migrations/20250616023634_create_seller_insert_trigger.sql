-- Step 2: Create function for sellers insert
create or replace function public.fill_seller_full_name_if_missing()
returns trigger
language plpgsql
security definer
as $$
declare
  fetched_name text;
begin
  -- Only act if full_name is null or empty
  if new.full_name is null or trim(new.full_name) = '' then
    -- Fetch user_name from auth.users
    select raw_user_meta_data ->> 'user_name'
    into fetched_name
    from auth.users
    where id = new.user_id;

    -- Assign the fetched user_name to full_name
    if fetched_name is not null then
      new.full_name := fetched_name;
    end if;
  end if;

  return new;
end;
$$;

-- Step 2: Create trigger for sellers table
create trigger before_insert_sellers_fill_full_name
before insert on public.sellers
for each row
execute function public.fill_seller_full_name_if_missing();
