package com.crm.backend.repository;

import com.crm.backend.entity.Activity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ActivityRepository extends JpaRepository<Activity, Long> {
    List<Activity> findByLeadId(Long leadId);
    List<Activity> findByCustomerId(Long customerId);
    List<Activity> findAllByOrderByTimestampDesc();
}