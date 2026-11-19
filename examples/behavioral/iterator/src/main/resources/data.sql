-- 230 Fran results with spread-out times (2:31 to 9:09), plus a few Helen results.
insert into result (id, athlete, wod, seconds)
select x, 'Athlete ' || x, 'fran', 150 + mod(x * 37, 400) from system_range(1, 230);
insert into result (id, athlete, wod, seconds) values (1001, 'Ana', 'helen', 540), (1002, 'Leo', 'helen', 610);
