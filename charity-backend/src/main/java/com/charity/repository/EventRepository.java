package com.charity.repository;

import com.charity.entity.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EventRepository extends JpaRepository<Event, Long> {
    List<Event> findByStatus(Event.EventStatus status);
    List<Event> findByCampaignCampaignId(Long campaignId);
}
