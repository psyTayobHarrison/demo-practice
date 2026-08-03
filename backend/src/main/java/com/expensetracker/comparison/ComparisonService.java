package com.expensetracker.comparison;

import com.expensetracker.budget.BudgetService;
import com.expensetracker.category.CategoryResponse;
import com.expensetracker.category.CategoryService;
import com.expensetracker.expense.ExpenseService;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class ComparisonService {

    private static final BigDecimal CLOSE_THRESHOLD = new BigDecimal("80");

    private final ExpenseService expenseService;
    private final BudgetService budgetService;
    private final CategoryService categoryService;

    public ComparisonService(ExpenseService expenseService, BudgetService budgetService, CategoryService categoryService) {
        this.expenseService = expenseService;
        this.budgetService = budgetService;
        this.categoryService = categoryService;
    }

    public List<ComparisonResponse> compare(String period) {
        Map<Long, BigDecimal> budgetedByCategory = budgetService.getBudgetedAmountsByCategoryForPeriod(period);
        Map<Long, BigDecimal> spentByCategory = expenseService.getTotalSpentByCategoryForPeriod(period);
        List<CategoryResponse> allCategories = categoryService.findAll();

        List<ComparisonResponse> results = new ArrayList<>();

        for (CategoryResponse category : allCategories) {
            BigDecimal budgetedAmount = budgetedByCategory.getOrDefault(category.id(), BigDecimal.ZERO);
            BigDecimal spentAmount = spentByCategory.getOrDefault(category.id(), BigDecimal.ZERO);

            // Only include categories that have either a budget or expenses for this period
            if (budgetedAmount.compareTo(BigDecimal.ZERO) == 0 && spentAmount.compareTo(BigDecimal.ZERO) == 0) {
                continue;
            }

            BigDecimal remainingAmount = budgetedAmount.subtract(spentAmount);
            BigDecimal percentUsed = budgetedAmount.compareTo(BigDecimal.ZERO) > 0
                    ? spentAmount.multiply(new BigDecimal("100")).divide(budgetedAmount, 2, RoundingMode.HALF_UP)
                    : spentAmount.compareTo(BigDecimal.ZERO) > 0 ? new BigDecimal("100.00") : BigDecimal.ZERO;

            BudgetStatus status = determineStatus(percentUsed);

            results.add(new ComparisonResponse(
                    category.id(),
                    category.name(),
                    budgetedAmount,
                    spentAmount,
                    remainingAmount,
                    percentUsed,
                    status
            ));
        }

        return results;
    }

    private BudgetStatus determineStatus(BigDecimal percentUsed) {
        if (percentUsed.compareTo(new BigDecimal("100")) >= 0) {
            return BudgetStatus.OVER;
        } else if (percentUsed.compareTo(CLOSE_THRESHOLD) >= 0) {
            return BudgetStatus.CLOSE;
        } else {
            return BudgetStatus.UNDER;
        }
    }
}
