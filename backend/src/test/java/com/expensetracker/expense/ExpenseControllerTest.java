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
                new BigDecimal("42.50"),
                LocalDate.of(2026, 8, 13),
                "Weekly groceries",
                categoryId
        );

        mockMvc.perform(post("/api/expenses")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.amount").value(42.50))
                .andExpect(jsonPath("$.date").value("2026-08-13"))
                .andExpect(jsonPath("$.description").value("Weekly groceries"))
                .andExpect(jsonPath("$.categoryId").value(categoryId))
                .andExpect(jsonPath("$.categoryName").value("Groceries"));
    }

    @Test
    void createExpense_missingRequiredFields() throws Exception {
        String json = "{}";

        mockMvc.perform(post("/api/expenses")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors").isArray());
    }

    @Test
    void getExpenseById_success() throws Exception {
        Long categoryId = createCategoryViaApi("Transport");
        Long expenseId = createExpenseViaApi(new BigDecimal("15.00"), LocalDate.of(2026, 8, 10), "Bus fare", categoryId);

        mockMvc.perform(get("/api/expenses/{id}", expenseId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(expenseId))
                .andExpect(jsonPath("$.amount").value(15.00))
                .andExpect(jsonPath("$.date").value("2026-08-10"))
                .andExpect(jsonPath("$.description").value("Bus fare"))
                .andExpect(jsonPath("$.categoryId").value(categoryId))
                .andExpect(jsonPath("$.categoryName").value("Transport"));
    }

    @Test
    void getExpenseById_notFound() throws Exception {
        mockMvc.perform(get("/api/expenses/{id}", 99999))
                .andExpect(status().isNotFound());
    }

    @Test
    void getAllExpenses() throws Exception {
        Long categoryId = createCategoryViaApi("Food");
        createExpenseViaApi(new BigDecimal("10.00"), LocalDate.of(2026, 8, 1), "Lunch", categoryId);
        createExpenseViaApi(new BigDecimal("25.00"), LocalDate.of(2026, 8, 5), "Dinner", categoryId);

        mockMvc.perform(get("/api/expenses"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));
    }

    @Test
    void getAllExpenses_orderedByDateDesc() throws Exception {
        Long categoryId = createCategoryViaApi("Food");
        createExpenseViaApi(new BigDecimal("10.00"), LocalDate.of(2026, 8, 1), "Earlier", categoryId);
        createExpenseViaApi(new BigDecimal("25.00"), LocalDate.of(2026, 8, 15), "Later", categoryId);

        mockMvc.perform(get("/api/expenses"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].description").value("Later"))
                .andExpect(jsonPath("$[1].description").value("Earlier"));
    }

    @Test
    void updateExpense_success() throws Exception {
        Long categoryId = createCategoryViaApi("Groceries");
        Long newCategoryId = createCategoryViaApi("Food");
        Long expenseId = createExpenseViaApi(new BigDecimal("30.00"), LocalDate.of(2026, 8, 10), "Old description", categoryId);

        ExpenseRequest updateRequest = new ExpenseRequest(
                new BigDecimal("45.00"),
                LocalDate.of(2026, 8, 11),
                "Updated description",
                newCategoryId
        );

        mockMvc.perform(put("/api/expenses/{id}", expenseId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(expenseId))
                .andExpect(jsonPath("$.amount").value(45.00))
                .andExpect(jsonPath("$.date").value("2026-08-11"))
                .andExpect(jsonPath("$.description").value("Updated description"))
                .andExpect(jsonPath("$.categoryId").value(newCategoryId))
                .andExpect(jsonPath("$.categoryName").value("Food"));
    }

    @Test
    void deleteExpense_success() throws Exception {
        Long categoryId = createCategoryViaApi("Groceries");
        Long expenseId = createExpenseViaApi(new BigDecimal("20.00"), LocalDate.of(2026, 8, 10), "To delete", categoryId);

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

    private Long createExpenseViaApi(BigDecimal amount, LocalDate date, String description, Long categoryId) throws Exception {
        ExpenseRequest request = new ExpenseRequest(amount, date, description, categoryId);
        MvcResult result = mockMvc.perform(post("/api/expenses")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();

        return objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asLong();
    }
}
