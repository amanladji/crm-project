package com.crm.backend.repository;

import com.crm.backend.entity.CampaignUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CampaignUserRepository extends JpaRepository<CampaignUser, Long> {
    List<CampaignUser> findByCampaignId(Long campaignId);
}
