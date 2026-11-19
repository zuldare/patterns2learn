create table membership (
    id           int primary key,
    athlete      varchar(40) not null,
    status       varchar(10) not null,
    trial_visits int not null default 0
);
