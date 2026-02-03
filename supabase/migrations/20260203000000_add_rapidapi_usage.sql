create table if not exists public.rapidapi_usage (
  month text primary key,
  count integer not null default 0,
  updated_at timestamptz not null default now()
);

create or replace function public.increment_rapidapi_usage(p_month text)
returns integer
language plpgsql
security definer
as $$
declare
  new_count integer;
begin
  insert into public.rapidapi_usage (month, count)
  values (p_month, 1)
  on conflict (month) do update
    set count = public.rapidapi_usage.count + 1,
        updated_at = now()
  returning count into new_count;

  return new_count;
end;
$$;

grant execute on function public.increment_rapidapi_usage(text) to anon, authenticated, service_role;
