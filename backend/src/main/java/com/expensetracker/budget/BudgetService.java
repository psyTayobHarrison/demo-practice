package com.expensetracker.budget;

import com.expensetracker.ResourceNotFoundException;
import com.expensetracker.category.Category;
import com.expensetracker.category.CategoryService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional
public class BudgetService {

    private final BudgetRepository budgetRepository;
    private final CategoryService categoryService;

    public BudgetService(BudgetRepository budgetRepository, CategoryService categoryService) {
        this.budgetRepository = budgetRepository;
        this.categoryService = categoryService;
    }

    public List<BudgetResponse> findAll() {
        return budgetRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    public List<BudgetResponse> findByPeriod(String period) {
        return budgetRepository.findByPeriod(period).stream()
                .map(this::toResponse)
                .toList();
    }

    public BudgetResponse findById(Long id) {
        Budget budget = budgetRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Budget not found with id: " + id));
        return toResponse(budget);
    }

    public BudgetResponse create(BudgetRequest request) {
        Category category = categoryService.getEntityById(request.categoryId());

        if (budgetRepository.existsByCategoryIdAndPeriod(request.categoryId(), request.period())) {
            throw new IllegalArgumentException(
                    "Budget already exists for category " + category.getName() + " in period " + request.period());
        }

        Budget budget = new Budget(request.amount(), request.period(), category);
        budget = budgetRepository.save(budget);
        return toResponse(budget);
    }

    public BudgetResponse update(Long id, BudgetRequest request) {
        Budget budget = budgetRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Budget not found with id: " + id));
        Category category = categoryService.getEntityById(request.categoryId());

        budget.setAmount(request.amount());
        budget.setPeriod(request.period());
        budget.setCategory(category);
        budget = budgetRepository.save(budget);
        return toResponse(budget);
    }

    public void delete(Long id) {
        if (!budgetRepository.existsById(id)) {
            throw new ResourceNotFoundException("Budget not found with id: " + id);
        }
        budgetRepository.deleteById(id);
    }

    /**
     * Returns budgeted amounts per category for a given period.
     * Used by the comparison module.
     */
    public Map<Long, BigDecimal> getBudgetedAmountsByCategoryForPeriod(String period) {
        List<Budget> budgets = budgetRepository.findByPeriod(period);
        return budgets.stream()
                .collect(Collectors.toMap(
                        b -> b.getCategory().getId(),
                        Budget::getAmount
                ));
    }

    private BudgetResponse toResponse(Budget budget) {
        return new BudgetResponse(
                budget.getId(),
                budget.getAmount(),
                budget.getPeriod(),
                budget.getCategory().getId(),
                budget.getCategory().getName()
        );
    }
}
