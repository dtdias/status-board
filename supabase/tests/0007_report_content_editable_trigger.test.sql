begin;

create extension if not exists pgtap with schema extensions;

select plan(16);

insert into auth.users (id)
values ('10000000-0000-0000-0000-000000000001');

insert into public.weekly_reports (id, user_id, start_date, end_date, status)
values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '2026-09-21', '2026-09-27', 'draft'),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', '2026-09-28', '2026-10-04', 'ready'),
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', '2026-10-05', '2026-10-11', 'generated');

select lives_ok(
  $$
    insert into public.deliveries (id, weekly_report_id, title, description, status, icon_key)
    values ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Entrega', 'Descricao', 'delivered', 'integration')
  $$,
  'delivery can be inserted while report is draft'
);

select is(
  (select count(*) from public.deliveries where id = '30000000-0000-0000-0000-000000000001'),
  1::bigint,
  'delivery insert persists'
);

select lives_ok(
  $$update public.deliveries set title = 'Entrega atualizada' where id = '30000000-0000-0000-0000-000000000001'$$,
  'delivery can be updated while report is draft'
);

select lives_ok(
  $$delete from public.deliveries where id = '30000000-0000-0000-0000-000000000001'$$,
  'delivery can be deleted while report is draft'
);

select lives_ok(
  $$
    insert into public.support_fronts (id, weekly_report_id, title, activity_type, icon_key)
    values ('40000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'ERP', 'Monitoramento', 'server')
  $$,
  'support front can be inserted while report is draft'
);

select lives_ok(
  $$
    insert into public.support_routines (id, support_front_id, title)
    values ('50000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 'Monitorar filas')
  $$,
  'support routine resolves its report through the support front'
);

select lives_ok(
  $$update public.support_routines set title = 'Monitorar integracoes' where id = '50000000-0000-0000-0000-000000000001'$$,
  'support routine can be updated while report is draft'
);

select lives_ok(
  $$delete from public.support_routines where id = '50000000-0000-0000-0000-000000000001'$$,
  'support routine can be deleted while report is draft'
);

select lives_ok(
  $$
    insert into public.support_routines (id, support_front_id, title)
    values ('50000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000001', 'Monitorar disponibilidade')
  $$,
  'support routine can be recreated before cascade deletion'
);

select lives_ok(
  $$delete from public.support_fronts where id = '40000000-0000-0000-0000-000000000001'$$,
  'support front deletion cascades to routines'
);

select lives_ok(
  $$
    insert into public.deliveries (weekly_report_id, title, description, status, icon_key)
    values ('20000000-0000-0000-0000-000000000002', 'Entrega pronta', 'Descricao', 'in_progress', 'process')
  $$,
  'delivery can be inserted while report is ready'
);

select throws_ok(
  $$
    insert into public.deliveries (weekly_report_id, title, description, status, icon_key)
    values ('20000000-0000-0000-0000-000000000003', 'Entrega bloqueada', 'Descricao', 'blocked', 'code')
  $$,
  'P0001',
  'report is not editable in status generated',
  'delivery cannot be inserted after generation'
);

select lives_ok(
  $$
    insert into public.support_fronts (id, weekly_report_id, title, activity_type, icon_key)
    values ('40000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', 'API', 'Monitoramento', 'cloud')
  $$,
  'support front can be inserted while report is ready'
);

select lives_ok(
  $$
    insert into public.support_routines (id, support_front_id, title)
    values ('50000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000002', 'Monitorar API')
  $$,
  'support routine can be inserted while report is ready'
);

select lives_ok(
  $$update public.weekly_reports set status = 'generated' where id = '20000000-0000-0000-0000-000000000002'$$,
  'ready report can transition to generated'
);

select throws_ok(
  $$delete from public.support_fronts where id = '40000000-0000-0000-0000-000000000002'$$,
  'P0001',
  'report is not editable in status generated',
  'cascade deletion cannot bypass generated report protection'
);

select * from finish();

rollback;
