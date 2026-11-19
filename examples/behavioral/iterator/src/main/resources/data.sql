-- 230 Fran results (between 2:31 and 9:09) from 90 athletes, so many athletes have several results.
insert into result (id, athlete, wod, seconds)
select x, 'Athlete ' || mod(x, 90), 'fran', 150 + mod(x * 37, 400) from system_range(1, 230);
-- Ties and repeats near the top: Leo ties the fastest time, Ana has two fast results.
insert into result (id, athlete, wod, seconds) values
    (2001, 'Ana', 'fran', 152), (2002, 'Ana', 'fran', 153), (2003, 'Leo', 'fran', 151);
insert into result (id, athlete, wod, seconds) values (1001, 'Ana', 'helen', 540), (1002, 'Leo', 'helen', 610);
