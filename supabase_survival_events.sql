-- 생존 웹(dopa-survival) 플레이 기록 · 10/23 자기야 OK
-- 이름·사진·IP 는 저장하지 않는다. 숫자 세기용 이벤트만.
-- 사이트(공개 키)는 넣기만 가능, 읽기·수정·삭제는 막힘 → 보는 건 대시보드/서비스 키로만.

create table if not exists public.survival_events (
  id bigserial primary key,
  at timestamptz not null default now(),
  ev text not null check (ev in ('view','start','scene','end','save','copy','again','tumblbug')),
  ep text check (char_length(ep) <= 10),
  g text check (g in ('m','f')),
  sid text check (char_length(sid) <= 16),
  src text check (char_length(src) <= 40),
  scene text check (char_length(scene) <= 10),
  ending text check (char_length(ending) <= 12),
  steps int check (steps between 0 and 99),
  dead boolean,
  photo boolean
);

alter table public.survival_events enable row level security;

drop policy if exists "survival_events_insert_anon" on public.survival_events;
create policy "survival_events_insert_anon" on public.survival_events
  for insert to anon, authenticated
  with check (true);

create index if not exists survival_events_at_idx on public.survival_events (at);
create index if not exists survival_events_ev_idx on public.survival_events (ev);
