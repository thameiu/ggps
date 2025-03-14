import axios from 'axios';
import { Event } from './types';

export const handleEntryAction = async (
  eventId: number,
  isSignedUp: boolean,
  setLoading: (loading: boolean) => void,
  setSuccess: (success: boolean) => void,
  setError: (error: string | null) => void,
  setIsSignedUp: (isSignedUp: boolean) => void,
  setShowRemoveEntryModal: (showRemoveEntryModal: boolean) => void
) => {
  setLoading(true);
  setSuccess(false);
  setError(null);

  try {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('User not authenticated.');

    if (isSignedUp) {
      await axios.delete('http://localhost:9000/event/entry', {
        data: { eventId, token },
        headers: { Authorization: token },
      });
      setIsSignedUp(false);
      setShowRemoveEntryModal(false);
    } else {
      await axios.post(
        'http://localhost:9000/event/entry',
        { eventId, token, status: 'accepted' },
        { headers: { Authorization: token } }
      );
      setIsSignedUp(true);
    }
    setSuccess(true);
  } catch (err) {
    console.error('Error updating entry:', err);
    setError('Failed to update entry. Please try again later.');
  } finally {
    setLoading(false);
  }
};

export const checkSignUpStatus = async (
  eventId: number,
  setIsSignedUp: (isSignedUp: boolean) => void,
  setIsAdmin: (isAdmin: boolean) => void
) => {
  try {
    const token = localStorage.getItem('token');


    const entryResponse = await axios.get('http://localhost:9000/event/entry', {
      params: { eventId, token },
      headers: { Authorization: token },
    });

    setIsSignedUp(entryResponse.data.status);
    setIsAdmin(entryResponse.data.status === 'admin');

  } catch (err) {
    console.error('Error checking sign-up status:', err);
  }
};

export const checkOrganizerStatus = async (
  organizer: string | null,
  setIsOrganizer: (isOrganizer: boolean) => void,
  setUsername: (username: string) => void
) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.post(
      'http://localhost:9000/auth/verify-token',
      {},
      { headers: { authorization: token } }
    );
    const loggedInUser = response.data.user.username;
    setUsername(loggedInUser);
    setIsOrganizer(loggedInUser === organizer);
  } catch (err) {
    console.error('Error verifying organizer status:', err);
  }
};

export const checkChatroomAvailability = async (
  eventId: number,
  setHasChatroom: (hasChatroom: boolean) => void
) => {
  try {
    await axios.get(`http://localhost:9000/chat/${eventId}/messages`, {
      headers: { Authorization: localStorage.getItem('token') },
    });
    setHasChatroom(true);
  } catch (err) {
    console.error('No chatroom found for this event.');
    setHasChatroom(false);
  }
};

export const selectColor = (event: Event, setColor: (color: string | null) => void) => {
  const category = event.category.toLowerCase();
  if (category === 'convention') setColor('rgba(100, 0, 200, 1)');
  else if (['tournament', 'esport event'].includes(category)) setColor('rgba(219, 39, 39, 1)');
  else if (category === 'lan') setColor('rgba(80, 80, 255, 0.7)');
  else if (category === 'speedrunning event') setColor('rgba(39, 219, 39, 0.7)');
  else setColor('rgba(86, 86, 84, 0.7)');
};
