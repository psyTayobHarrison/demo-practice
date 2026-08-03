package com.expensetracker.budget;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

public record BudgetRequest(
        @NotNull(message = "Amount is required")
        @Positive(message = "Amount must be positive")
        BigDecimal amount,

        @NotBlank(message = "Period is required")
        @Pattern(regexp = "\\d{4}-\\d{2}", message = "Period must be in yyyy-MM format")
        String period,

        @NotNull(message = "Category ID is required")
        Long categoryId
) {
}
