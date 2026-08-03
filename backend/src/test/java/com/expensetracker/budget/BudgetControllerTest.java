package com.expensetracker.budget;

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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class BudgetControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void createBudget_success() throws Exception {
        Long categoryId = createCategoryViaApi("Groceries");

        BudgetRequest request = new BudgetRequest(new BigDecimal("500.00"), "2026-07", categoryId);

        mockMvc.perform(post("/api/budgets")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.amount").value(500.00))
                .andExpect(jsonPath("$.period").value("2026-07"))
                .andExpect(jsonPath("$.categoryId").value(categoryId))
                .andExpect(jsonPath("$.categoryName").value("Groceries"));
    }

    @Test
    void createBudget_duplicateCategoryAndPeriod() throws Exception {
        Long categoryId = createCategoryViaApi("Groceries");

        BudgetRequest request = new BudgetRequest(new BigDecimal("500.00"), "2026-07", categoryId);

        mockMvc.perform(post("/api/budgets")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/budgets")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").exists());
    }

    @Test
    void createBudget_validationError() throws Exception {
        Long categoryId = createCategoryViaApi("Groceries");

        String body = """
                {
                    "amount": null,
                    "period": "2026-07",
                    "categoryId": %d
                }
                """.formatted(categoryId);

        mockMvc.perform(post("/api/budgets")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors").isArray());
    }

    @Test
    void getAllBudgets() throws Exception {
        Long categoryId1 = createCategoryViaApi("Groceries");
        Long categoryId2 = createCategoryViaApi("Transport");

        createBudgetViaApi(categoryId1, new BigDecimal("500.00"), "2026-07");
        createBudgetViaApi(categoryId2, new BigDecimal("200.00"), "2026-07");

        mockMvc.perform(get("/api/budgets"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));
    }

    @Test
    void getBudgetsByPeriod() throws Exception {
        Long categoryId = createCategoryViaApi("Groceries");

        createBudgetViaApi(categoryId, new BigDecimal("500.00"), "2026-07");

        Long categoryId2 = createCategoryViaApi("Transport");
        createBudgetViaApi(categoryId2, new BigDecimal("200.00"), "2026-08");

        mockMvc.perform(get("/api/budgets").param("period", "2026-07"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].period").value("2026-07"));
    }

    @Test
    void updateBudget_success() throws Exception {
        Long categoryId = createCategoryViaApi("Groceries");
        Long budgetId = createBudgetViaApi(categoryId, new BigDecimal("500.00"), "2026-07");

        BudgetRequest updateRequest = new BudgetRequest(new BigDecimal("750.00"), "2026-07", categoryId);

        mockMvc.perform(put("/api/budgets/{id}", budgetId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.amount").value(750.00));
    }

    @Test
    void deleteBudget_success() throws Exception {
        Long categoryId = createCategoryViaApi("Groceries");
        Long budgetId = createBudgetViaApi(categoryId, new BigDecimal("500.00"), "2026-07");

        mockMvc.perform(delete("/api/budgets/{id}", budgetId))
                .andExpect(status().isNoContent());
    }

    @Test
    void deleteBudget_notFound() throws Exception {
        mockMvc.perform(delete("/api/budgets/{id}", 99999))
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

    private Long createBudgetViaApi(Long categoryId, BigDecimal amount, String period) throws Exception {
        BudgetRequest request = new BudgetRequest(amount, period, categoryId);
        MvcResult result = mockMvc.perform(post("/api/budgets")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();

        return objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asLong();
    }
}
