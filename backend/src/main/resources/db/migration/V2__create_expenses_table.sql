-- V2: Create expenses table

CREATE TABLE expenses (
    id            BIGSERIAL PRIMARY KEY,
    amount        DECIMAL(19,2) NOT NULL,
    date          DATE NOT NULL,
    description   VARCHAR(255),
    category_id   BIGINT NOT NULL,
    CONSTRAINT fk_expenses_category FOREIGN KEY (category_id) REFERENCES categories(id)
);
