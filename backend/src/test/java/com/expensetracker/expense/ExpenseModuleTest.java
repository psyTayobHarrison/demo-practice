package com.expensetracker.expense;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.beans.factory.annotation.Autowired;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class ExpenseModuleTest {

    @Autowired
    private ExpenseController expenseController;

    @Autowired
    private ExpenseService expenseService;

    @Test
    void contextLoads() {
        assertThat(expenseController).isNotNull();
        assertThat(expenseService).isNotNull();
    }
}
