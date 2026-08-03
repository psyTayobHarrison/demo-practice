package com.expensetracker.budget;

import java.math.BigDecimal;

public record BudgetResponse(
        Long id,
        BigDecimal amount,
        String period,
        Long categoryId,
        String categoryName
) {
}
