package com.expensetracker.comparison;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.beans.factory.annotation.Autowired;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class ComparisonModuleTest {

    @Autowired
    private ComparisonController comparisonController;

    @Autowired
    private ComparisonService comparisonService;

    @Test
    void contextLoads() {
        assertThat(comparisonController).isNotNull();
        assertThat(comparisonService).isNotNull();
    }
}
