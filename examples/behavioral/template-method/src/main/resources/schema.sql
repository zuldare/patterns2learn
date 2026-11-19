CREATE TABLE result (
    id      BIGINT AUTO_INCREMENT PRIMARY KEY,
    athlete VARCHAR(80) NOT NULL,
    wod     VARCHAR(80) NOT NULL,
    score   INT NOT NULL CHECK (score > 0)
);
