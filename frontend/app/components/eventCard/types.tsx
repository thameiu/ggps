export type Event = {
    id: number;
    title: string;
    description: string;
    beginDate: string;
    endDate: string;
    street: string;
    number: string;
    city: string;
    zipCode: string;
    latitude: number;
    longitude: number;
    category: string;
  };
  
  export type EventCardProps = {
    event: Event;
    organizer: string | null;
  };
  