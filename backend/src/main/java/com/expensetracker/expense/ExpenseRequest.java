package com.expensetracker.expense;

import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public record ExpenseRequest(
        @NotNull(message = "Amount is required")
        BigDecimal amount,
        @NotNull(message = "Date is required")
        LocalDate date,
        String description,
        @NotNull(message = "Category is required")
        Long categoryId
) {
}
