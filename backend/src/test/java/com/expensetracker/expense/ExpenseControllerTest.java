package com.expensetracker.expense;

import com.expensetracker.category.CategoryRequest;
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
class ExpenseControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void createExpense_success() throws Exception {
        Long categoryId = createCategoryViaApi("Groceries");

        ExpenseRequest request = new ExpenseRequest(
                new BigDecimal("50.00"),
                LocalDate.of(2026, 7, 15),
                "Weekly groceries",
                categoryId
        );

        mockMvc.perform(post("/api/expenses")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.amount").value(50.00))
                .andExpect(jsonPath("$.date").value("2026-07-15"))
                .andExpect(jsonPath("$.description").value("Weekly groceries"))
                .andExpect(jsonPath("$.categoryId").value(categoryId))
                .andExpect(jsonPath("$.categoryName").value("Groceries"));
    }

    @Test
    void createExpense_invalidCategory() throws Exception {
        ExpenseRequest request = new ExpenseRequest(
                new BigDecimal("50.00"),
                LocalDate.of(2026, 7, 15),
                "Test",
                99999L
        );

        mockMvc.perform(post("/api/expenses")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound());
    }

    @Test
    void createExpense_validationError() throws Exception {
        Long categoryId = createCategoryViaApi("Groceries");

        String body = """
                {
                    "amount": null,
                    "date": "2026-07-15",
                    "description": "Test",
                    "categoryId": %d
                }
                """.formatted(categoryId);

        mockMvc.perform(post("/api/expenses")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors").isArray());
    }

    @Test
    void getAllExpenses() throws Exception {
        Long categoryId = createCategoryViaApi("Groceries");
        createExpenseViaApi(categoryId, new BigDecimal("50.00"), LocalDate.of(2026, 7, 15), "Expense 1");
        createExpenseViaApi(categoryId, new BigDecimal("30.00"), LocalDate.of(2026, 7, 16), "Expense 2");

        mockMvc.perform(get("/api/expenses"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));
    }

    @Test
    void getExpensesByPeriod() throws Exception {
        Long categoryId = createCategoryViaApi("Groceries");
        createExpenseViaApi(categoryId, new BigDecimal("50.00"), LocalDate.of(2026, 7, 15), "July expense");
        createExpenseViaApi(categoryId, new BigDecimal("30.00"), LocalDate.of(2026, 8, 10), "August expense");

        mockMvc.perform(get("/api/expenses").param("period", "2026-07"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].description").value("July expense"));
    }

    @Test
    void updateExpense_success() throws Exception {
        Long categoryId = createCategoryViaApi("Groceries");
        Long expenseId = createExpenseViaApi(categoryId, new BigDecimal("50.00"), LocalDate.of(2026, 7, 15), "Original");

        ExpenseRequest updateRequest = new ExpenseRequest(
                new BigDecimal("75.00"),
                LocalDate.of(2026, 7, 16),
                "Updated",
                categoryId
        );

        mockMvc.perform(put("/api/expenses/{id}", expenseId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.amount").value(75.00))
                .andExpect(jsonPath("$.description").value("Updated"));
    }

    @Test
    void deleteExpense_success() throws Exception {
        Long categoryId = createCategoryViaApi("Groceries");
        Long expenseId = createExpenseViaApi(categoryId, new BigDecimal("50.00"), LocalDate.of(2026, 7, 15), "Test");

        mockMvc.perform(delete("/api/expenses/{id}", expenseId))
                .andExpect(status().isNoContent());
    }

    @Test
    void deleteExpense_notFound() throws Exception {
        mockMvc.perform(delete("/api/expenses/{id}", 99999))
                .andExpect(status().isNotFound());
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

    private Long createExpenseViaApi(Long categoryId, BigDecimal amount, LocalDate date, String description) throws Exception {
        ExpenseRequest request = new ExpenseRequest(amount, date, description, categoryId);
        MvcResult result = mockMvc.perform(post("/api/expenses")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();

        return objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asLong();
    }
}
