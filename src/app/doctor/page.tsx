import { redirect } from "next/navigation";

export default function DoctorIndexRedirect() {
  redirect("/doctor/dashboard");
}

