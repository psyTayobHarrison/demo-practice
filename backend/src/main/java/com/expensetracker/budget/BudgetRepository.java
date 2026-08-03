package com.expensetracker.budget;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BudgetRepository extends JpaRepository<Budget, Long> {

    List<Budget> findByPeriod(String period);

    Optional<Budget> findByCategoryIdAndPeriod(Long categoryId, String period);

    boolean existsByCategoryIdAndPeriod(Long categoryId, String period);
}
