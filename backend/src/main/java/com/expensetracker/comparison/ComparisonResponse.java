package com.expensetracker.comparison;

import java.math.BigDecimal;

public record ComparisonResponse(
        Long categoryId,
        String categoryName,
        BigDecimal budgetedAmount,
        BigDecimal spentAmount,
        BigDecimal remainingAmount,
        BigDecimal percentUsed,
        BudgetStatus status
) {
}
