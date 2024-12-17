"use client"
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';


const Chatroom = dynamic(() => import('../../../components/chatroom/chatroom'), { ssr: false });

export default function ChatroomPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  if (!id) {
    router.push('/map');
    return null;
  }
  return (
    <div style={{ height: "100vh", width: "100%" }}>
      <Chatroom eventId={id} />
    </div>
  );
}
