package com.expensetracker.category;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.beans.factory.annotation.Autowired;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class CategoryModuleTest {

    @Autowired
    private CategoryController categoryController;

    @Autowired
    private CategoryService categoryService;

    @Test
    void contextLoads() {
        assertThat(categoryController).isNotNull();
        assertThat(categoryService).isNotNull();
    }
}
