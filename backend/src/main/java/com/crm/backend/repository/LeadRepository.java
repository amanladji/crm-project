package com.crm.backend.repository;

import com.crm.backend.entity.Lead;
import com.crm.backend.enums.LeadStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LeadRepository extends JpaRepository<Lead, Long> {
    List<Lead> findByAssignedUserId(Long userId);
    List<Lead> findByCustomerId(Long customerId);
    long countByStatus(LeadStatus status);
}