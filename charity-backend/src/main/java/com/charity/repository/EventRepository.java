package com.charity.repository;

import com.charity.entity.Event;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EventRepository extends MongoRepository<Event, String> {
    List<Event> findByStatus(Event.EventStatus status);
    List<Event> findByCampaignCampaignId(String campaignId);
}

