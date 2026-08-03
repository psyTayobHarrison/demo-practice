package com.expensetracker.comparison;

import jakarta.validation.constraints.Pattern;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/comparison")
@Validated
public class ComparisonController {

    private final ComparisonService comparisonService;

    public ComparisonController(ComparisonService comparisonService) {
        this.comparisonService = comparisonService;
    }

    @GetMapping
    public List<ComparisonResponse> compare(
            @RequestParam
            @Pattern(regexp = "\\d{4}-\\d{2}", message = "Period must be in yyyy-MM format")
            String period) {
        return comparisonService.compare(period);
    }
}
