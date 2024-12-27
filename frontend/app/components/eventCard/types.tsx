export interface Event {
  id: number;
  title: string;
  category: string;
  description: string;
  beginDate: string;
  endDate: string;
  number: string;
  street: string;
  city: string;
  zipCode: string;
}

export interface EventCardProps {
  event: Event;
  organizer: string;
}