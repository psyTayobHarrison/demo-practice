package com.expensetracker.expense;

import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public record ExpenseRequest(
        @NotNull BigDecimal amount,
        @NotNull LocalDate date,
        String description,
        @NotNull Long categoryId
) {
}
