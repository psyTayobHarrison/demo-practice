-- V1: Initial schema for expense tracker
-- Tables: categories

CREATE TABLE categories (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(255) NOT NULL UNIQUE
);
