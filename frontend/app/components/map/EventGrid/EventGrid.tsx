import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './eventgrid.module.css';
import eventbarStyles from '../SideBars/eventbar.module.css';

interface EventGridProps {
  isActive: boolean;
  onClose: () => void;
}

export const useGridEscapeHandler = (isActive: boolean, toggleGrid: () => void) => {
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        toggleGrid(); 
      }
    };

    document.addEventListener('keydown', handleEscKey);

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [toggleGrid]);
};

const EventGrid: React.FC<EventGridProps> = ({ isActive, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [localEvents, setLocalEvents] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    if (isActive) {
      const storedEvents = JSON.parse(localStorage.getItem("fetchedEvents") || "[]");
      setLocalEvents(storedEvents);
    }
  }, [isActive]);


  if (!isActive) return null;

  // Filter events based on search term and category
  const filteredEvents = localEvents.filter(event => {
    const matchesSearch = 
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.city?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || event.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  const categories = ['all', ...Array.from(new Set(localEvents.map(event => event.category)))];

  const getEventColor = (category: string) => {
    switch(category.toLowerCase()) {
      case 'convention': return 'rgba(100, 0, 200, 1)';
      case 'tournament': 
      case 'esport event': return 'rgba(219, 39, 39, 1)';
      case 'lan': return 'rgba(80, 80, 255, 0.7)';
      case 'speedrunning event': return 'rgba(39, 219, 39, 0.7)';
      default: return 'rgba(86, 86, 84, 0.7)';
    }
  };

  return (
    <div 
      className={styles.eventGridOverlay} 
      role="dialog" 
      aria-label="Events Grid View"
    >
      <div className={styles.eventGridContainer}>
        <div className={styles.eventGridHeader}>
          <h2 className={eventbarStyles.eventBarSectionTitle}>Events Grid View</h2>
          <div className={styles.headerControls}>
            <div className={styles.keyboardTip}>
              Press <kbd>Esc</kbd> to toggle view
            </div>
            <button 
              className={styles.closeButton} 
              onClick={onClose}
              aria-label="Close grid view"
            >
              ×
            </button>
          </div>
        </div>

        <div className={styles.filtersContainer}>
          <div className={eventbarStyles.searchContainer}>
            <input
              type="text"
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={eventbarStyles.searchInput}
              aria-label="Search events"
              autoFocus
            />
          </div>

          <div className={eventbarStyles.selectorContainer}>
            <label htmlFor="categoryFilter" className={eventbarStyles.selectorLabel}>
              Category:
            </label>
            <select
              id="categoryFilter"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className={eventbarStyles.selector}
              aria-label="Filter by category"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.eventCount}>
          Showing {filteredEvents.length} of {localEvents.length} events
        </div>

        {filteredEvents.length > 0 ? (
          <div className={styles.eventGrid}>
            {filteredEvents.map(event => (
              <div 
                key={event.id} 
                className={eventbarStyles.eventCard}
                style={{ border: `2px solid ${getEventColor(event.category)}` }}
                onClick={() => router.push(`/event?id=${event.id}`)}
                role="button"
                aria-label={`View details for ${event.title}`}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    router.push(`/event?id=${event.id}`);
                  }
                }}
              >
                <h3 className={eventbarStyles.eventBarCardTitle}>{event.title}</h3>
                <p><strong>Location:</strong> {event.street}, {event.city}, {event.zipCode}</p>
                <p><strong>Begin:</strong> {new Date(event.beginDate).toLocaleString().slice(0, -3)}</p>
                <p><strong>End:</strong> {new Date(event.endDate).toLocaleString().slice(0, -3)}</p>
                <p><strong>Category:</strong> {event.category}</p>
                <p className={styles.viewDetails}>Click to view details</p>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.noEvents}>
            No events match your search criteria
          </div>
        )}
      </div>
    </div>
  );
};

export default EventGrid;