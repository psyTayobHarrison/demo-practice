package com.expensetracker.budget;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.beans.factory.annotation.Autowired;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class BudgetModuleTest {

    @Autowired
    private BudgetController budgetController;

    @Autowired
    private BudgetService budgetService;

    @Test
    void contextLoads() {
        assertThat(budgetController).isNotNull();
        assertThat(budgetService).isNotNull();
    }
}
