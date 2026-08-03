package com.expensetracker.category;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class CategoryControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void createCategory_success() throws Exception {
        CategoryRequest request = new CategoryRequest("Groceries");

        mockMvc.perform(post("/api/categories")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.name").value("Groceries"));
    }

    @Test
    void createCategory_duplicateName() throws Exception {
        CategoryRequest request = new CategoryRequest("Groceries");

        mockMvc.perform(post("/api/categories")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/categories")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").exists());
    }

    @Test
    void getAllCategories() throws Exception {
        createCategoryViaApi("Groceries");
        createCategoryViaApi("Transport");

        mockMvc.perform(get("/api/categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));
    }

    @Test
    void getCategoryById_success() throws Exception {
        Long id = createCategoryViaApi("Groceries");

        mockMvc.perform(get("/api/categories/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(id))
                .andExpect(jsonPath("$.name").value("Groceries"));
    }

    @Test
    void getCategoryById_notFound() throws Exception {
        mockMvc.perform(get("/api/categories/{id}", 99999))
                .andExpect(status().isNotFound());
    }

    @Test
    void updateCategory_success() throws Exception {
        Long id = createCategoryViaApi("Groceries");

        CategoryRequest updateRequest = new CategoryRequest("Food");

        mockMvc.perform(put("/api/categories/{id}", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(id))
                .andExpect(jsonPath("$.name").value("Food"));
    }

    @Test
    void deleteCategory_success() throws Exception {
        Long id = createCategoryViaApi("Groceries");

        mockMvc.perform(delete("/api/categories/{id}", id))
                .andExpect(status().isNoContent());
    }

    @Test
    void deleteCategory_notFound() throws Exception {
        mockMvc.perform(delete("/api/categories/{id}", 99999))
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
}
