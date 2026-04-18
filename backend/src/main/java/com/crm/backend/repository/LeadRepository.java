package com.crm.backend.repository;

import com.crm.backend.entity.Lead;
import com.crm.backend.enums.LeadStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LeadRepository extends JpaRepository<Lead, Long> {
    List<Lead> findByAssignedUserId(Long userId);
    List<Lead> findByCustomerId(Long customerId);
    long countByStatus(LeadStatus status);

    List<Lead> findByStatus(LeadStatus status);

    // Query for when a search query is provided
    @Query("SELECT l FROM Lead l WHERE " +
           "LOWER(l.name) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(l.email) LIKE LOWER(CONCAT('%', :query, '%'))")
    Page<Lead> searchLeads(@Param("query") String query, Pageable pageable);

    // Query for when no search query is provided
    @Query("SELECT l FROM Lead l ORDER BY l.id DESC")
    Page<Lead> searchLeadsNoQuery(Pageable pageable);

    // Query for when status is provided with search query
    @Query("SELECT l FROM Lead l WHERE " +
           "l.status = :status AND " +
           "(LOWER(l.name) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(l.email) LIKE LOWER(CONCAT('%', :query, '%')))")
    Page<Lead> filterLeadsByStatusAndSearch(@Param("query") String query, @Param("status") LeadStatus status, Pageable pageable);

    // Query for when only status is provided (no search query)
    @Query("SELECT l FROM Lead l WHERE l.status = :status ORDER BY l.id DESC")
    Page<Lead> filterLeadsByStatus(@Param("status") LeadStatus status, Pageable pageable);
}
