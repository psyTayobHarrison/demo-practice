-- V2: Add expenses table

CREATE TABLE expenses (
    id            BIGSERIAL PRIMARY KEY,
    amount        DECIMAL(10,2) NOT NULL,
    date          DATE NOT NULL,
    description   VARCHAR(255),
    category_id   BIGINT NOT NULL,
    CONSTRAINT fk_expense_category FOREIGN KEY (category_id) REFERENCES categories(id)
);
