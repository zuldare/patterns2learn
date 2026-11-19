create table membership (
    id           int primary key,
    athlete      varchar(40) not null,
    status       varchar(10) not null check (status in ('TRIAL', 'ACTIVE', 'FROZEN', 'EXPIRED')),
    trial_visits int not null default 0 check (trial_visits between 0 and 3)
);
