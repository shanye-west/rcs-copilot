-- Courses table
create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slope_rating integer not null,
  course_rating numeric(4,1) not null,
  par_per_hole integer[] not null, -- 18 values
  handicap_per_hole integer[] not null, -- 18 values, 1=hardest
  created_at timestamp with time zone default now()
);

-- Add course_id to matches
do $$
begin
  if not exists (
    select 1 from information_schema.columns 
    where table_name='matches' and column_name='course_id'
  ) then
    alter table public.matches add column course_id uuid references courses(id);
  end if;
end$$;
