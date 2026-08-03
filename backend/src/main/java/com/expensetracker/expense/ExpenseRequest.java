package com.expensetracker.expense;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.time.LocalDate;

public record ExpenseRequest(
        @NotNull(message = "Amount is required")
        @Positive(message = "Amount must be positive")
        BigDecimal amount,

        @NotNull(message = "Date is required")
        LocalDate date,

        String description,

        @NotNull(message = "Category ID is required")
        Long categoryId
) {
}
