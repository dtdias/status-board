create or replace function public.reorder_deliveries(target_report_id uuid, ordered_ids uuid[])
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  scoped_delivery_count integer;
begin
  if ordered_ids is null or cardinality(ordered_ids) = 0 then
    raise exception 'ordered_ids must not be empty';
  end if;

  if cardinality(ordered_ids) <> (select count(distinct delivery_id) from unnest(ordered_ids) as item(delivery_id)) then
    raise exception 'ordered_ids must not contain duplicates';
  end if;

  select count(*) into scoped_delivery_count
  from public.deliveries
  where weekly_report_id = target_report_id;

  if scoped_delivery_count <> cardinality(ordered_ids) then
    raise exception 'ordered_ids must include every delivery in report';
  end if;

  if exists (
    select 1
    from unnest(ordered_ids) as item(delivery_id)
    left join public.deliveries on deliveries.id = item.delivery_id and deliveries.weekly_report_id = target_report_id
    where deliveries.id is null
  ) then
    raise exception 'ordered_ids contains a delivery outside report';
  end if;

  update public.deliveries
  set position = ordered.position - 1
  from unnest(ordered_ids) with ordinality as ordered(delivery_id, position)
  where deliveries.id = ordered.delivery_id
    and deliveries.weekly_report_id = target_report_id;
end;
$$;

grant execute on function public.reorder_deliveries(uuid, uuid[]) to authenticated;
