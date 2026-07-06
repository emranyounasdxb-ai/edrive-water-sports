alter table public.packages
add column if not exists image_url text;

update public.packages
set image_url = '/images/packages/jet-ski.webp'
where category = 'jet_ski_rental'::public.rental_category;

update public.packages
set image_url = '/images/packages/jet-car-2-seater.webp'
where category = 'jet_car_rental'::public.rental_category
  and capacity = 2;

update public.packages
set image_url = '/images/packages/jet-car-4-seater.webp'
where category = 'jet_car_rental'::public.rental_category
  and capacity = 4;
