CREATE TABLE wod_session (
    id    BIGINT PRIMARY KEY,
    wod   VARCHAR(80) NOT NULL,
    spots INT NOT NULL CHECK (spots >= 0)
);

CREATE TABLE booking (
    id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    session_id BIGINT NOT NULL REFERENCES wod_session (id),
    athlete    VARCHAR(80) NOT NULL
);
