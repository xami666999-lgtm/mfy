import React, { useEffect, useState } from 'react';
import { Users, MessageCircle, Heart, Star, Share2, Plus, Search, MoreHorizontal, Send, ThumbsUp, MessageSquare } from 'lucide-react';
import { api } from '../../utils/api';
import type { SocialFriend, Review } from '../../types';

export function SocialView() {
  const [friends, setFriends] = useState<SocialFriend[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'friends' | 'activity' | 'reviews' | 'leaderboards'>('friends');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [friendsData, activityData] = await Promise.all([
        api.social.getFriends(),
        api.social.getActivity(),
      ]);
      setFriends(friendsData || []);
      setActivity(activityData || []);
    } catch (error) {
      console.error('Failed to load social data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="social-view">
      <div className="view-header">
        <div className="header-left">
          <h1 className="view-title">Social</h1>
          <span className="view-count">{friends.length} friends</span>
        </div>
        <div className="header-right">
          <button className="btn btn-primary"><Plus size={16} /> Add Friend</button>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab ${activeTab === 'friends' ? 'active' : ''}`} onClick={() => setActiveTab('friends')}>
          <Users size={16} /> Friends
        </button>
        <button className={`tab ${activeTab === 'activity' ? 'active' : ''}`} onClick={() => setActiveTab('activity')}>
          <MessageCircle size={16} /> Activity
        </button>
        <button className={`tab ${activeTab === 'reviews' ? 'active' : ''}`} onClick={() => setActiveTab('reviews')}>
          <Star size={16} /> Reviews
        </button>
        <button className={`tab ${activeTab === 'leaderboards' ? 'active' : ''}`} onClick={() => setActiveTab('leaderboards')}>
          <Trophy size={16} /> Leaderboards
        </button>
      </div>

      {activeTab === 'friends' && (
        <div className="friends-grid">
          {friends.map(friend => (
            <FriendCard key={friend.id} friend={friend} onJoin={() => {}} onInvite={() => {}} onMessage={() => {}} />
          ))}
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="activity-feed">
          {activity.map(item => (
            <ActivityItem key={item.id} item={item} />
          ))}
        </div>
      )}

      {activeTab === 'reviews' && (
        <div className="reviews-list">
          <div className="review-form">
            <textarea placeholder="Write a review..." className="review-textarea" />
            <div className="review-rating">
              {[1,2,3,4,5].map(n => (
                <button key={n} className="rating-star">★</button>
              ))}
            </div>
            <button className="btn btn-primary">Submit Review</button>
          </div>
          {reviews.map(review => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}

      {activeTab === 'leaderboards' && (
        <div className="leaderboards-view">
          <p>Leaderboards coming soon</p>
        </div>
      )}
    </div>
  );
}

function FriendCard({ friend, onJoin, onInvite, onMessage }: { friend: SocialFriend; onJoin: () => void; onInvite: () => void; onMessage: () => void }) {
  return (
    <div className="friend-card card">
      <div className="friend-avatar">
        {friend.avatar ? <img src={friend.avatar} alt={friend.name} /> : <User size={32} />}
        <span className={`presence-indicator ${friend.status}`} />
      </div>
      <div className="friend-info">
        <h4>{friend.name}</h4>
        <p className="friend-platform">{friend.platform}</p>
        {friend.currentGame && <p className="friend-game">Playing: {friend.currentGame}</p>}
      </div>
      <div className="friend-actions">
        <button className="icon-btn" onClick={onMessage} aria-label="Message"><MessageSquare size={16} /></button>
        {friend.currentGame && <button className="icon-btn" onClick={onJoin} aria-label="Join"><UserPlus size={16} /></button>}
        <button className="icon-btn" onClick={onInvite} aria-label="Invite"><UserPlus size={16} /></button>
      </div>
    </div>
  );
}

function ActivityItem({ item }: { item: any }) {
  return (
    <div className="activity-item card">
      <div className="activity-avatar">
        <User size={24} />
      </div>
      <div className="activity-content">
        <p><strong>{item.friendName}</strong> {item.details}</p>
        <span className="activity-time">{new Date(item.timestamp).toLocaleString()}</span>
      </div>
      {item.gameId && <button className="btn btn-secondary btn-sm">Join</button>}
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <div className="review-card card">
      <div className="review-header">
        <div className="review-author">
          {review.userAvatar ? <img src={review.userAvatar} alt={review.userName} className="avatar" /> : <User size={24} />}
          <div>
            <h4>{review.userName}</h4>
            <span className="review-date">{new Date(review.date).toLocaleDateString()}</span>
          </div>
        </div>
        <div className="review-rating-display">
          {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
        </div>
      </div>
      <p className="review-content">{review.content}</p>
      <div className="review-footer">
        <button className="icon-btn"><ThumbsUp size={16} /> {review.helpful}</button>
        <button className="icon-btn"><Heart size={16} /> {review.funny}</button>
        <button className="icon-btn"><MessageSquare size={16} /> Comment</button>
      </div>
    </div>
  );
}

import { User, UserPlus, Trophy } from 'lucide-react';
