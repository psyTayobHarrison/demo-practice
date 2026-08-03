package com.expensetracker.expense;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ExpenseRepository extends JpaRepository<Expense, Long> {

    @Query("SELECT e FROM Expense e WHERE e.date >= :startDate AND e.date < :endDate")
    List<Expense> findByPeriod(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
}
