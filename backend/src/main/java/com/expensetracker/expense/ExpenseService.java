package com.expensetracker.expense;

import com.expensetracker.ResourceNotFoundException;
import com.expensetracker.category.Category;
import com.expensetracker.category.CategoryService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final CategoryService categoryService;

    public ExpenseService(ExpenseRepository expenseRepository, CategoryService categoryService) {
        this.expenseRepository = expenseRepository;
        this.categoryService = categoryService;
    }

    public List<ExpenseResponse> findAll() {
        return expenseRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    public List<ExpenseResponse> findByPeriod(String period) {
        LocalDate[] range = parsePeriod(period);
        return expenseRepository.findByPeriod(range[0], range[1]).stream()
                .map(this::toResponse)
                .toList();
    }

    public ExpenseResponse findById(Long id) {
        Expense expense = expenseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Expense not found with id: " + id));
        return toResponse(expense);
    }

    public ExpenseResponse create(ExpenseRequest request) {
        Category category = categoryService.getEntityById(request.categoryId());
        Expense expense = new Expense(request.amount(), request.date(), request.description(), category);
        expense = expenseRepository.save(expense);
        return toResponse(expense);
    }

    public ExpenseResponse update(Long id, ExpenseRequest request) {
        Expense expense = expenseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Expense not found with id: " + id));
        Category category = categoryService.getEntityById(request.categoryId());
        expense.setAmount(request.amount());
        expense.setDate(request.date());
        expense.setDescription(request.description());
        expense.setCategory(category);
        expense = expenseRepository.save(expense);
        return toResponse(expense);
    }

    public void delete(Long id) {
        if (!expenseRepository.existsById(id)) {
            throw new ResourceNotFoundException("Expense not found with id: " + id);
        }
        expenseRepository.deleteById(id);
    }

    /**
     * Returns total spent per category for a given period.
     * Used by the comparison module.
     */
    public Map<Long, BigDecimal> getTotalSpentByCategoryForPeriod(String period) {
        LocalDate[] range = parsePeriod(period);
        List<Expense> expenses = expenseRepository.findByPeriod(range[0], range[1]);
        return expenses.stream()
                .collect(Collectors.groupingBy(
                        e -> e.getCategory().getId(),
                        Collectors.reducing(BigDecimal.ZERO, Expense::getAmount, BigDecimal::add)
                ));
    }

    private LocalDate[] parsePeriod(String period) {
        YearMonth yearMonth = YearMonth.parse(period, DateTimeFormatter.ofPattern("yyyy-MM"));
        LocalDate startDate = yearMonth.atDay(1);
        LocalDate endDate = yearMonth.plusMonths(1).atDay(1);
        return new LocalDate[]{startDate, endDate};
    }

    private ExpenseResponse toResponse(Expense expense) {
        return new ExpenseResponse(
                expense.getId(),
                expense.getAmount(),
                expense.getDate(),
                expense.getDescription(),
                expense.getCategory().getId(),
                expense.getCategory().getName()
        );
    }
}
