create table result (
    id      int primary key,
    athlete varchar(40) not null,
    wod     varchar(20) not null,
    seconds int not null check (seconds > 0)
);
create index result_by_wod_time on result (wod, seconds, id);
