package com.expensetracker.expense;

import com.expensetracker.ResourceNotFoundException;
import com.expensetracker.category.Category;
import com.expensetracker.category.CategoryService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

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
        return expenseRepository.findAllByOrderByDateDesc().stream()
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
