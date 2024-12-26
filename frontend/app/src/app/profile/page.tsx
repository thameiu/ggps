"use client";
import { useRouter,useSearchParams } from "next/navigation";
import Profile from "../../../components/profile/Profile";
import Loader from "../../../components/loader/loader";

export default function ProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const username = searchParams.get("username");
  

  if (!username) {
    return <Loader/>;
  }

  return (
    <div>
      <Profile username={username as string} />
    </div>
  );
}
