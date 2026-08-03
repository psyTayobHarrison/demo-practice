package com.expensetracker.comparison;

import com.expensetracker.budget.BudgetRequest;
import com.expensetracker.category.CategoryRequest;
import com.expensetracker.expense.ExpenseRequest;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class ComparisonControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void compare_withData() throws Exception {
        Long categoryId = createCategoryViaApi("Groceries");
        createBudgetViaApi(categoryId, new BigDecimal("1000.00"), "2026-07");
        createExpenseViaApi(categoryId, new BigDecimal("500.00"), LocalDate.of(2026, 7, 10), "Expense 1");
        createExpenseViaApi(categoryId, new BigDecimal("300.00"), LocalDate.of(2026, 7, 20), "Expense 2");

        mockMvc.perform(get("/api/comparison").param("period", "2026-07"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].categoryId").value(categoryId))
                .andExpect(jsonPath("$[0].categoryName").value("Groceries"))
                .andExpect(jsonPath("$[0].budgetedAmount").value(1000.00))
                .andExpect(jsonPath("$[0].spentAmount").value(800.00))
                .andExpect(jsonPath("$[0].remainingAmount").value(200.00))
                .andExpect(jsonPath("$[0].percentUsed").value(80.00))
                .andExpect(jsonPath("$[0].status").value("CLOSE"));
    }

    @Test
    void compare_overBudget() throws Exception {
        Long categoryId = createCategoryViaApi("Transport");
        createBudgetViaApi(categoryId, new BigDecimal("500.00"), "2026-07");
        createExpenseViaApi(categoryId, new BigDecimal("600.00"), LocalDate.of(2026, 7, 15), "Over expense");

        mockMvc.perform(get("/api/comparison").param("period", "2026-07"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].budgetedAmount").value(500.00))
                .andExpect(jsonPath("$[0].spentAmount").value(600.00))
                .andExpect(jsonPath("$[0].remainingAmount").value(-100.00))
                .andExpect(jsonPath("$[0].percentUsed").value(120.00))
                .andExpect(jsonPath("$[0].status").value("OVER"));
    }

    @Test
    void compare_underBudget() throws Exception {
        Long categoryId = createCategoryViaApi("Rent");
        createBudgetViaApi(categoryId, new BigDecimal("1000.00"), "2026-07");
        createExpenseViaApi(categoryId, new BigDecimal("200.00"), LocalDate.of(2026, 7, 1), "Under expense");

        mockMvc.perform(get("/api/comparison").param("period", "2026-07"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].budgetedAmount").value(1000.00))
                .andExpect(jsonPath("$[0].spentAmount").value(200.00))
                .andExpect(jsonPath("$[0].remainingAmount").value(800.00))
                .andExpect(jsonPath("$[0].percentUsed").value(20.00))
                .andExpect(jsonPath("$[0].status").value("UNDER"));
    }

    @Test
    void compare_emptyPeriod() throws Exception {
        mockMvc.perform(get("/api/comparison").param("period", "2025-01"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    private Long createCategoryViaApi(String name) throws Exception {
        CategoryRequest request = new CategoryRequest(name);
        MvcResult result = mockMvc.perform(post("/api/categories")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();

        return objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asLong();
    }

    private void createBudgetViaApi(Long categoryId, BigDecimal amount, String period) throws Exception {
        BudgetRequest request = new BudgetRequest(amount, period, categoryId);
        mockMvc.perform(post("/api/budgets")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());
    }

    private void createExpenseViaApi(Long categoryId, BigDecimal amount, LocalDate date, String description) throws Exception {
        ExpenseRequest request = new ExpenseRequest(amount, date, description, categoryId);
        mockMvc.perform(post("/api/expenses")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());
    }
}
